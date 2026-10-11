"""Export audited ordinary trace baselines and original SFT monitoring for Plotly."""
import argparse
from collections import Counter
import csv
import hashlib
import io
import json
import math
from pathlib import Path

import numpy as np

METRICS = ('stopped_answer_correct', 'nominal_final_correct', 'complete_trajectory',
           'exact_stop', 'joint_success', 'strict_success')
TRAINED = [1, 2, 3, 4, 5, 6, 8, 10, 12]
REQUESTS = [6, 7, 9, 11, 12, 16, 32, 256]


def wilson(hits: int, count: int) -> list[float]:
    z = 1.959963984540054
    rate = hits / count
    center = (rate + z*z/(2*count)) / (1 + z*z/count)
    radius = z * math.sqrt(rate*(1-rate)/count + z*z/(4*count*count)) / (1 + z*z/count)
    return [max(0, center-radius), min(1, center+radius)]


def export(run: Path, training: Path, graphs: Path) -> dict:
    sources = {}

    def read(path: Path, key: str) -> bytes:
        raw = path.read_bytes()
        sources[key] = hashlib.sha256(raw).hexdigest()
        return raw

    def load(name: str) -> dict:
        return json.loads(read(run/name, name))

    complete, provenance, protocol = load('completion.json'), load('plots/provenance.json'), load('protocol.json')
    if (complete['status'] != 'complete' or not complete['independent_audits_passed']
            or complete['queries_per_arm'] != 345600):
        raise ValueError('Completed independent audits required')
    if sources['protocol.json'] != provenance['sources_sha256']['trace_protocol']:
        raise ValueError('Protocol differs from completed figures')
    graph_rows = [json.loads(l) for l in read(graphs, 'benchmark_graphs.jsonl').splitlines()]
    if (sources['benchmark_graphs.jsonl'] != protocol['graphs_sha256'] or len(graph_rows) != 1350
            or protocol['requests'] != list(range(1, 257))):
        raise ValueError('Graph/count panel changed')
    modes = np.array([r['example_id'].split('-')[2] for r in graph_rows])
    masks = {'all': np.ones(1350, dtype=bool), **{m:modes==m for m in ('random_function','permutation','full_cycle')}}
    if any(int(v.sum()) != (1350 if k == 'all' else 450) for k,v in masks.items()):
        raise ValueError('Graph-type exposure differs')
    arms = {}
    for arm in ('original', 'sft'):
        audit, summary, freeze = [load(f'{arm}/{f}.json') for f in ('independent_audit','summary','freeze')]
        native = load(f'{arm}/native_fidelity.json')
        read(run/arm/'prompt.txt', f'{arm}/prompt.txt')
        raw = read(run/arm/'outcomes.npz', f'{arm}/outcomes.npz')
        if (not audit['passed'] or audit['queries'] != 345600 or audit['reserved_test_queries'] != 1536
                or summary['status'] != 'complete' or summary['smoke'] or not summary['weights_unchanged']
                or freeze['identity']['config'] != protocol or freeze['identity']['arm'] != arm
                or sources[f'{arm}/freeze.json'] != audit['freeze_sha256']
                or summary['freeze_sha256'] != audit['freeze_sha256']
                or sources[f'{arm}/outcomes.npz'] != audit['outcomes_sha256']
                or sources[f'{arm}/outcomes.npz'] != provenance['sources_sha256'][arm]
                or sources[f'{arm}/prompt.txt'] != freeze['identity']['prompt_sha256']
                or summary['chunks_sha256'] != audit['chunks_sha256']
                or native != audit['native_sensitivity']):
            raise ValueError(f'{arm}: audit/source identity mismatch')
        with np.load(io.BytesIO(raw), allow_pickle=False) as saved:
            arrays = {k:saved[k] for k in saved.files}
        if not np.array_equal(arrays.pop('counts'), np.arange(1,257)) or any(a.shape != (1350,256) for a in arrays.values()):
            raise ValueError('Outcome coverage differs')
        for key,value in audit['metrics'].items():
            if not math.isclose(float(arrays[key].mean()), value, abs_tol=1e-12):
                raise ValueError(f'{arm}: aggregate mismatch for {key}')
        if not np.array_equal(arrays['strict_success'], arrays['complete_trajectory'] & arrays['exact_stop']):
            raise ValueError('Strict-success semantics differ')
        categories = {'exact':arrays['exact_stop'], 'early':arrays['early_stop'], 'late':arrays['late_stop'],
                      'budget':arrays['missing_stop'] & ~arrays['malformed'], 'malformed':arrays['malformed']}
        if not (sum(categories.values()) == 1).all():
            raise ValueError('Termination categories do not partition every query')
        if any(int(v.sum()) != audit['termination_categories'].get(k,0) for k,v in categories.items()):
            raise ValueError('Termination totals differ')
        series = {}
        for mode, mask in masks.items():
            n = int(mask.sum())
            series[mode] = {'graphs':n, 'metrics':{}}
            for key in METRICS:
                hits = arrays[key][mask].sum(0).tolist()
                series[mode]['metrics'][key] = {'hits':hits, 'intervals':[wilson(h,n) for h in hits]}
        cohorts = load(f'{arm}/cluster_intervals.json')
        for key,group in cohorts.items():
            cols = np.array(group['counts'])-1
            if group['queries'] != 1350*len(cols) or group['graphs'] != 1350:
                raise ValueError('Cohort denominator changed')
            for metric,values in group['metrics'].items():
                hits = int(arrays[metric][:,cols].sum())
                if not math.isclose(hits/group['queries'], values['rate'], abs_tol=1e-12):
                    raise ValueError('Cohort summary differs from audited outcomes')
                values['correct'] = hits
        diagnostics = {}
        for n in REQUESTS:
            lengths, count = np.unique(arrays['emitted_states'][:,n-1], return_counts=True)
            diagnostics[str(n)] = {'termination':{k:int(v[:,n-1].sum()) for k,v in categories.items()},
                'lengths':[{'states':int(a),'graphs':int(b)} for a,b in zip(lengths,count)]}
        test = list(csv.DictReader(read(run/arm/'reserved_test_by_depth.csv',f'{arm}/reserved_test_by_depth.csv').decode().splitlines()))
        if [int(r['depth']) for r in test] != list(range(1,13)) or sum(int(r['questions']) for r in test) != 1536:
            raise ValueError('Opened test table coverage differs')
        arms[arm] = {'series':series, 'cohorts':cohorts, 'diagnostics':diagnostics,
            'reserved_test':test, 'native_sensitivity':{k:native[k] for k in ('questions','exact_scores','exact_continuations','scope')},
            'weights_sha256':freeze['identity']['weights_sha256']}
    events = [json.loads(l) for l in read(training/'metrics.jsonl','training/metrics.jsonl').splitlines()]
    if sources['training/metrics.jsonl'] != provenance['sources_sha256']['training_metrics']:
        raise ValueError('Training history differs from audited figure provenance')
    summary = json.loads(read(training/'summary.json','training/summary.json'))
    best = json.loads(read(training/'best_checkpoint.json','training/best_checkpoint.json'))
    if summary['status'] != 'complete' or summary['trainable_parameters'] != summary['total_parameters'] or summary['total_parameters'] != 494032768:
        raise ValueError('Full-model SFT training incomplete or wrong scope')
    train = [e for e in events if e['event']=='train']; val = [e for e in events if e['event']=='validation']
    if [e['step'] for e in train] != list(range(1,2251)) or [e['step'] for e in val] != list(range(0,2251,250)):
        raise ValueError('Training history coverage differs')
    validation = []
    for e in val:
        by_depth=e['validation']['by_depth']
        if any(by_depth[str(n)]['examples'] != 64 for n in range(1,13)):
            raise ValueError('Validation cohort changed')
        loss=sum(by_depth[str(n)]['loss'] for n in TRAINED)/len(TRAINED)
        if not math.isclose(loss,e['validation']['selection_loss'],abs_tol=1e-10):
            raise ValueError('Validation selection includes wrong counts')
        validation.append({'step':e['step'],'trained':{'examples':576,'response_loss':loss}})
    if min(validation,key=lambda r:r['trained']['response_loss'])['step'] != best['step'] or best['step'] != 2250:
        raise ValueError('Checkpoint selection differs')
    if any(e['train']['examples'] != 16 or not math.isfinite(e['train']['loss']) for e in train):
        raise ValueError('Invalid training batch')
    training_run={'selected_step':2250, 'training':{'steps':[e['step'] for e in train], 'examples':[16]*2250,
        'response_loss':[e['train']['loss'] for e in train]}, 'validation':validation}
    return {'schema_version':1,'graphs':1350,'requests':list(range(1,257)),'trained_counts':TRAINED,
        'arms':arms,'runs':{'trace':training_run},'source_sha256':sources,
        'source_run':'eval/pointer_traces/seed61-20261010',
        'definitions':{
            'stopped_answer_correct':'Last returned state matches the N-step reference; wrong length is allowed; malformed responses fail.',
            'nominal_final_correct':'State at position N is correct; a missing position or malformed output fails.',
            'complete_trajectory':'All first N generated states are correct; extra states may follow; missing states or malformed output fail.',
            'exact_stop':'Well-formed response contains exactly N states and ends with EOS.',
            'joint_success':'Last returned state correct and exact termination.',
            'strict_success':'All first N states correct and exact termination.',
            'intervals':'Pointwise Wilson intervals for per-depth graph rates; saved stratified whole-graph bootstrap intervals for count cohorts.',
            'termination':'Mutually exclusive: malformed takes priority, then token cap without EOS, then early/exact/late EOS.',
            'training':'Full-vocabulary response-token CE including EOS, averaged within each example then across examples; validation is teacher forced.',
            'scope':'Audited free generations on the opened 1350-graph panel. These are parsed state positions, not recurrent loops. BF16 batched scores; native audit agrees on scores, not every token continuation.'}}


def main() -> None:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--run',type=Path,required=True);p.add_argument('--training',type=Path,required=True)
    p.add_argument('--graphs',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    a=p.parse_args();data=export(a.run,a.training,a.graphs)
    a.output.write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n')
    print('Verified both audited 345,600-query panels, termination partitions, cohort totals, 2,250 training updates and checkpoint selection.')

if __name__=='__main__':main()
