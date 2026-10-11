"""Export first-attempt evaluation from audited results and rechecked raw traces."""
import argparse
from collections import Counter
import csv
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from loopformer_eval_diagnostics import export_diagnostics


ARM = 'ce_full'
METRICS = ('nominal_final_correct', 'complete_trajectory')
CATEGORIES = ('repeat previous state', 'earlier visited state', 'later reachable state', 'outside start orbit')


def wilson(hits: int, count: int) -> tuple[float | None, float | None]:
    if not count:
        return None, None
    z = 1.959963984540054
    p = hits / count
    den = 1 + z*z/count
    center = (p + z*z/(2*count))/den
    radius = z*math.sqrt(p*(1-p)/count + z*z/(4*count*count))/den
    return max(0, center-radius), min(1, center+radius)


def export(root: Path, graphs: Path) -> dict:
    hashes = {}

    def read(rel: str) -> bytes:
        payload = (root/rel).read_bytes()
        hashes[rel] = hashlib.sha256(payload).hexdigest()
        return payload

    def load(rel: str) -> dict:
        return json.loads(read(rel))

    def rows(rel: str) -> list[dict]:
        return list(csv.DictReader(read(rel).decode().splitlines()))

    review = load('completed_review.json')
    audit = load('independent_audit.json')
    reference = load('reference_audit.json')
    manifest = load('plots/manifest.json')
    if not all(a['passed'] for a in (review, audit, reference)) or manifest['status'] != 'complete':
        raise ValueError('Completed independent audits required')
    for name, key in [('plots/manifest.json','manifest_sha256'), ('reference_audit.json','reference_audit_sha256'),
                      ('independent_audit.json','independent_audit_sha256')]:
        if hashes[name] != review[key]:
            raise ValueError(f'Completed-review hash mismatch: {name}')
    for name, digest in manifest['input_sha256'].items():
        read(name)
        if hashes[name] != digest:
            raise ValueError(f'Approved analysis input changed: {name}')
    config = load('protocol.json')
    if hashes['protocol.json'] != reference['protocol_sha256']:
        raise ValueError('Protocol changed')
    graph_bytes = graphs.read_bytes()
    hashes['benchmark_graphs.jsonl'] = hashlib.sha256(graph_bytes).hexdigest()
    if hashes['benchmark_graphs.jsonl'] != reference['graph_sha256']:
        raise ValueError('Graph dataset changed')
    tasks = [json.loads(line) for line in graph_bytes.splitlines()]
    ngraph, counts = len(tasks), np.array(config['requests'])
    if ngraph != 1350 or counts.tolist() != list(range(1,257)):
        raise ValueError('Unexpected benchmark coverage')
    checkpoint = next(a for a in config['models'] if a['name'] == ARM)
    if not checkpoint['path'].endswith('depth6-fresh30k-seed37-batch4/step-002500'):
        raise ValueError('Wrong first-attempt checkpoint')
    summary = load(f'{ARM}/summary.json')
    freeze = load(f'{ARM}/freeze.json')
    if summary['status'] != 'complete' or not summary['weights_unchanged'] or not summary['native_fidelity']:
        raise ValueError('First-attempt extraction is unverified')
    if next(a for a in freeze['protocol']['models'] if a['name'] == ARM) != checkpoint:
        raise ValueError('Checkpoint freeze differs')
    targets = np.empty((ngraph,256),dtype=np.uint8)
    features = []
    for i, task in enumerate(tasks):
        mapping, state = dict(task['mapping']), task['initial_state']
        seen, node = {}, state
        while node not in seen:
            seen[node] = len(seen)
            node = mapping[node]
        _, seed, mode, *_ = task['example_id'].split('-')
        features.append(dict(graph_mode=mode,dataset_seed=int(seed),cycle_period=len(seen)-seen[node],
                             transient_length=seen[node],orbit_size=len(seen)))
        for j in range(256):
            state = mapping[state]
            targets[i,j] = ord(state)-65
    with np.load(root/'outcomes.npz',allow_pickle=False) as z:
        outcomes = {m:z[f'{ARM}__{m}'] for m in METRICS}
        if not np.array_equal(z['targets'][:,:256], targets) or not (z[f'{ARM}__stops']==-2).all():
            raise ValueError('Targets or headless stopping semantics differ')
    requests = config['fixed_prompt_failure_requests']
    diagnostic_parts, indices = [], []
    for path in sorted((root/ARM).glob('graphs-*.npz')):
        rel = str(path.relative_to(root))
        read(rel)
        if hashes[rel] != reference['source_chunk_sha256'][rel]:
            raise ValueError(f'Raw chunk changed: {rel}')
        with np.load(path,allow_pickle=False) as z:
            ids = z['graph_indices']
            pred = z['predictions'][:,:,:256]
            if not np.array_equal(z['counts'], counts) or not (z['stops']==-2).all():
                raise ValueError('Raw chunk scope changed')
            hits = pred == targets[ids,None,:]
            final = hits[:,np.arange(256),np.arange(256)]
            complete = np.stack([hits[:,j,:j+1].all(1) for j in range(256)],axis=1)
            if not np.array_equal(final,outcomes[METRICS[0]][ids]) or not np.array_equal(complete,outcomes[METRICS[1]][ids]):
                raise ValueError('Raw predictions disagree with audited quality outcomes')
            diagnostic_parts.append(pred[:,np.array(requests)-1,:].copy())
            indices.extend(ids.tolist())
    if indices != list(range(ngraph)):
        raise ValueError('Raw graph coverage differs')
    traces = np.concatenate(diagnostic_parts)
    quality_rows = [r for r in rows('quality_by_depth.csv') if r['model']==ARM]
    quality = {}
    for metric in METRICS:
        values = [r for r in quality_rows if r['metric']==metric]
        if [int(r['requested_depth']) for r in values] != counts.tolist():
            raise ValueError('Quality depth coverage differs')
        quality[metric] = []
        for j,row in enumerate(values):
            hits = int(outcomes[metric][:,j].sum())
            low, high = wilson(hits,ngraph)
            if (hits != int(row['successes']) or not np.allclose([hits/ngraph,low,high],
                    [float(row[k]) for k in ('rate','low','high')],atol=1e-12,rtol=0)):
                raise ValueError('Depth table disagrees with raw outcomes')
            quality[metric].append(dict(depth=j+1,correct=hits,graphs=ngraph,rate=hits/ngraph,low=low,high=high))
    if any(r['rate'] for r in quality_rows if r['metric'] not in METRICS):
        raise ValueError('Headless model was assigned stopping scores')
    baseline_audit = load('ordinary_qwen/independent_audit.json')
    if not baseline_audit['passed'] or hashes['ordinary_qwen/independent_audit.json'] != review['baseline_audit_sha256']:
        raise ValueError('Baseline audit differs')
    baseline_freeze = load('ordinary_qwen/freeze.json')
    if (hashes['ordinary_qwen/freeze.json'] != baseline_audit['freeze_sha256']
            or baseline_freeze['config']['graphs_sha256'] != hashes['benchmark_graphs.jsonl']
            or baseline_freeze['protocol_sha256'] != hashes['protocol.json']):
        raise ValueError('Baseline comparison is not on the identical graph/count panel')
    baseline = rows('ordinary_qwen/quality_by_depth.csv')
    if hashes['ordinary_qwen/quality_by_depth.csv'] != baseline_audit['analysis_artifacts_sha256']['quality_by_depth.csv']:
        raise ValueError('Baseline depth table changed')
    quality['ordinary_qwen'] = [dict(depth=int(r['requested_depth']), correct=int(r['correct']),graphs=int(r['graphs']),
                                   rate=float(r['accuracy']),low=float(r['low']),high=float(r['high'])) for r in baseline]
    fixed, structure = export_diagnostics(tasks, targets, outcomes, config, traces, ARM, read, wilson)
    intervals = [dict(metric=r['metric'],depth_range=r['depth_range'],rate=float(r['rate']),low=float(r['low']),high=float(r['high']))
                 for r in rows('cluster_intervals.csv') if r['model']==ARM and r['metric'] in METRICS]
    # Verify range values and the same stratified bootstrap used by the research suite.
    rng=np.random.default_rng(config['uncertainty']['bootstrap_seed']);groups={}
    for i,f in enumerate(features):groups.setdefault((f['dataset_seed'],f['graph_mode']),[]).append(i)
    draws=np.concatenate([rng.choice(ids,size=(config['uncertainty']['bootstrap_repeats'],len(ids)),replace=True) for ids in groups.values()],axis=1)
    for row in intervals:
        lo,hi=(1,256) if row['depth_range']=='all' else map(int,row['depth_range'].split('-'))
        means=outcomes[row['metric']][:,lo-1:hi].mean(1)
        low,high=np.quantile(means[draws].mean(1),[.025,.975])
        if not np.allclose([means.mean(),low,high],[row[k] for k in ('rate','low','high')],atol=1e-12,rtol=0):
            raise ValueError('Saved aggregate interval differs')
    return dict(schema_version=1,model=ARM,checkpoint=checkpoint,graphs=ngraph,queries=ngraph*len(counts),training_max=6,
                quality=quality,fixed=fixed,structure=structure,intervals=intervals,source_sha256=hashes,
                source_directory='eval/pointer_analysis/paper-20261009',
                definitions=dict(final='Correct C readout at externally supplied N; final-letter matches can follow earlier errors.',
                complete='Every readout through requested N is correct.',fixed='Separate unchanged Steps=N prompt for each survival/hazard panel.',
                intervals='95% pointwise Wilson for binary graph outcomes; saved range intervals use stratified graph bootstrap.',
                stopping='Not applicable: no learned stop head.',episodes='Observed durations; episodes continuing at N are right-censored.',
                recovery='Correct next reference state after a wrong decode; prior-wrong transitions are correlated within graphs.'))


def main() -> None:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--run',type=Path,required=True);p.add_argument('--graphs',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    data=export(args.run,args.graphs);args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n')
    print('Verified 345,600 first-attempt outcomes and all four fixed-request diagnostic panels; exported chart data.')


if __name__=='__main__':main()
