"""Export Architectures 2, 3a, 3b, 4 or 5 quality and stopping after rechecking audited raw chunks."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from loopformer_eval_diagnostics import export_diagnostics

CHECKPOINTS = {'joint_full': 'depth6-completion-seed37/step-003250',
               'fixed6': 'depth6-fixed-prompt-seed37/step-003250',
               'fixed12': 'depth12-fixed-prompt-seed47-gaps/step-005000',
               'gru': 'controller-prefix-seed83/best',
               'final': 'controller-shared-number-precision-seed83/best'}
METRICS = ('nominal_final_correct', 'complete_trajectory', 'exact_stop', 'joint_success',
           'strict_success', 'early_stop', 'late_stop', 'missing_stop',
           'stopped_answer_correct', 'correct_letter_wrong_time')


def wilson(hits: int, count: int) -> tuple[float | None, float | None]:
    if not count:
        return None, None
    z = 1.959963984540054
    p = hits / count
    denominator = 1 + z*z/count
    center = (p + z*z/(2*count)) / denominator
    radius = z*math.sqrt(p*(1-p)/count + z*z/(4*count*count)) / denominator
    return max(0, center-radius), min(1, center+radius)


def export(root: Path, graphs: Path, arm: str = 'joint_full', controller_eval: Path | None = None, numeric_root: Path | None = None) -> dict:
    hashes = {}
    training_max = 12 if arm in ('fixed12', 'gru', 'final') else 6
    probe_loop = 14 if arm in ('fixed12', 'gru', 'final') else 9

    def read(name: str) -> bytes:
        payload = (root/name).read_bytes()
        hashes[name] = hashlib.sha256(payload).hexdigest()
        return payload

    def load(name: str) -> dict:
        return json.loads(read(name))

    review = load('completed_review.json')
    audit = load('independent_audit.json')
    reference = load('reference_audit.json')
    manifest = load('plots/manifest.json')
    if not all(a['passed'] for a in (review, audit, reference)) or manifest['status'] != 'complete':
        raise ValueError('Completed independent audits required')
    for name, key in [('plots/manifest.json', 'manifest_sha256'),
                      ('reference_audit.json', 'reference_audit_sha256'),
                      ('independent_audit.json', 'independent_audit_sha256')]:
        if hashes[name] != review[key]:
            raise ValueError(f'Review hash differs: {name}')
    for name, digest in manifest['input_sha256'].items():
        read(name)
        if hashes[name] != digest:
            raise ValueError(f'Approved input changed: {name}')
    config = load('protocol.json')
    if hashes['protocol.json'] != reference['protocol_sha256']:
        raise ValueError('Protocol changed')
    graph_bytes = graphs.read_bytes()
    hashes['benchmark_graphs.jsonl'] = hashlib.sha256(graph_bytes).hexdigest()
    if hashes['benchmark_graphs.jsonl'] != reference['graph_sha256']:
        raise ValueError('Graph population changed')
    tasks = [json.loads(line) for line in graph_bytes.splitlines()]
    counts = np.array(config['requests'])
    cap = config['safety_cap']
    if len(tasks) != 1350 or counts.tolist() != list(range(1, 257)) or cap != 272 or config['threshold'] != .5:
        raise ValueError('Unexpected evaluation scope')
    checkpoint = next(m for m in config['models'] if m['name'] == arm)
    if not checkpoint['path'].endswith(CHECKPOINTS[arm]):
        raise ValueError('Wrong selected checkpoint')
    summary, freeze = load(f'{arm}/summary.json'), load(f'{arm}/freeze.json')
    if summary['status'] != 'complete' or not summary['weights_unchanged'] or not summary['native_fidelity']:
        raise ValueError('Unverified extraction')
    if next(m for m in freeze['protocol']['models'] if m['name'] == arm) != checkpoint:
        raise ValueError('Checkpoint freeze differs')
    targets = np.empty((len(tasks), cap), dtype=np.uint8)
    for i, task in enumerate(tasks):
        mapping, state = dict(task['mapping']), task['initial_state']
        for t in range(cap):
            state = mapping[state]
            targets[i, t] = ord(state)-65
    with np.load(root/'outcomes.npz', allow_pickle=False) as z:
        outcomes = {m: z[f'{arm}__{m}'] for m in METRICS}
        stops = z[f'{arm}__stops']
        if not np.array_equal(targets, z['targets']):
            raise ValueError('Reference targets differ')
    indices = []
    diagnostic_parts = []
    count_probe_parts = []
    executor_parts, direct_parts = [], []
    if arm in ("gru", "final"):
        if not load(f"{arm}/reuse_audit.json")["passed"] or not load(f"{arm}/native_fidelity.json")["passed"]:
            raise ValueError("Isolated executor reuse/native checks failed")
    for path in sorted((root/arm).glob('graphs-*.npz')):
        name = str(path.relative_to(root))
        read(name)
        if hashes[name] != reference['source_chunk_sha256'][name]:
            raise ValueError(f'Raw chunk changed: {name}')
        with np.load(path, allow_pickle=False) as z:
            ids, pred, stop = z['graph_indices'], z['predictions'], z['stops']
            if arm in ('gru', 'final'):
                if pred.shape != (len(ids), cap) or z['direct'].shape != pred.shape:
                    raise ValueError('Invalid isolated executor trace shape')
                executor_parts.append(pred.copy()); direct_parts.append(z['direct'].copy())
                # Steps is removed from R; the audited shared executor trace serves all counts.
                pred = np.broadcast_to(pred[:, None, :], (len(ids), len(counts), cap))
            if not np.array_equal(z['counts'], counts) or not np.array_equal(stop, stops[ids]):
                raise ValueError('Count or stop identity differs')
            if not ((stop == -1) | ((stop >= 1) & (stop <= cap))).all():
                raise ValueError('Invalid stopping time')
            hits = pred == targets[ids, None, :]
            nominal = hits[:, np.arange(256), np.arange(256)]
            complete = np.stack([hits[:, j, :j+1].all(1) for j in range(256)], axis=1)
            actual = np.where(stop > 0, stop, cap)
            returned = np.take_along_axis(pred, actual[..., None]-1, -1)[..., 0] == targets[ids, :256]
            exact = stop == counts[None, :]
            expected = dict(nominal_final_correct=nominal, complete_trajectory=complete,
                            exact_stop=exact, joint_success=exact & returned, strict_success=exact & complete,
                            early_stop=(stop > 0) & (stop < counts), late_stop=stop > counts,
                            missing_stop=stop == -1, stopped_answer_correct=returned,
                            correct_letter_wrong_time=returned & ~exact)
            for metric in METRICS:
                if not np.array_equal(expected[metric], outcomes[metric][ids]):
                    raise ValueError(f'Raw predictions disagree with {metric}')
            diagnostic_parts.append(pred[:, np.array(config["fixed_prompt_failure_requests"])-1, :256].copy())
            if arm in ('fixed6', 'fixed12', 'gru', 'final'):
                # Score the same recurrent age across all sufficiently long requests.
                count_probe_parts.append(pred[:, probe_loop-1:, probe_loop-1].copy())
            indices.extend(ids.tolist())
    if indices != list(range(len(tasks))):
        raise ValueError('Incomplete or duplicate graph coverage')
    saved = {(r['metric'], int(r['requested_depth'])): r for r in
             csv.DictReader(read('quality_by_depth.csv').decode().splitlines()) if r['model'] == arm}
    quality = {}
    for metric in METRICS:
        quality[metric] = []
        for j, n in enumerate(counts):
            total = int(outcomes[metric][:, j].sum())
            low, high = wilson(total, len(tasks))
            row = saved[metric, int(n)]
            if total != int(row['successes']) or int(row['graphs']) != len(tasks) or not np.allclose(
                    [total/len(tasks), low, high], [float(row[k]) for k in ('rate', 'low', 'high')], rtol=0, atol=1e-12):
                raise ValueError('Depth table differs from recomputed outcomes')
            quality[metric].append(dict(depth=int(n), correct=total, graphs=len(tasks), rate=total/len(tasks), low=low, high=high))
    fixed, structure = export_diagnostics(tasks, targets, outcomes, config, np.concatenate(diagnostic_parts), arm, read, wilson)
    histograms = {}
    for j, n in enumerate(counts):
        loops, frequency = np.unique(stops[:, j], return_counts=True)
        histograms[str(n)] = [dict(loop=int(loop), graphs=int(count)) for loop, count in zip(loops, frequency)]
        if sum(p['graphs'] for p in histograms[str(n)]) != len(tasks):
            raise ValueError('Stopping histogram does not partition the population')
    cohorts = ({'trained': [1,2,3,4,5,6,8,10,12], 'held_out': [7,9,11],
                'beyond': list(range(13,257))} if arm in ('fixed12', 'gru', 'final') else
               {'trained': list(range(1,7)), 'beyond': list(range(7,257))})
    aggregates = {name: {metric: int(values[:, np.array(requests)-1].sum())
                         for metric, values in outcomes.items()} | {'queries': len(tasks)*len(requests)}
                  for name, requests in cohorts.items()}
    extra = {}
    if arm in ('gru', 'final'):
        c, r = np.concatenate(executor_parts)[:, :256], np.concatenate(direct_parts)[:, :256]
        ch, rh = c == targets[:, :256], r == targets[:, :256]
        cp, rp = np.logical_and.accumulate(ch, axis=1), np.logical_and.accumulate(rh, axis=1)
        cf = np.where((~ch).any(1), (~ch).argmax(1)+1, 257)
        rf = np.where((~rh).any(1), (~rh).argmax(1)+1, 257)
        for row in csv.DictReader(read('first_errors.csv').decode().splitlines()):
            if row['model'] == arm:
                i, t = int(row['graph_index']), int(row['loop'])-1
                if row['r_prediction'] != chr(int(r[i,t])+65):
                    raise ValueError('Direct readout differs from audited first-error record')
        readouts = []
        for j in range(256):
            point = dict(depth=j+1, graphs=len(tasks), disagree=int((c[:, j] != r[:, j]).sum()))
            for name, values in [('c_answer',ch),('r_answer',rh),('c_trajectory',cp),('r_trajectory',rp)]:
                hits = int(values[:,j].sum()); low, high = wilson(hits,len(tasks))
                point[name] = dict(correct=hits,rate=hits/len(tasks),low=low,high=high)
            readouts.append(point)
        controller_cohorts = {'seen_short': [n for n in range(1,13) if n != 9],
            'seen_long': [n for n in range(13,64) if n not in [17,29,41,53]],
            'held_out': [9,17,29,41,53], 'beyond_count': list(range(64,257))}
        controller_aggregates = {name: {metric:int(values[:,np.array(ns)-1].sum()) for metric,values in outcomes.items()}
            | {'queries':len(tasks)*len(ns)} for name,ns in controller_cohorts.items()}
        extra = dict(readouts=readouts, readout_failures=dict(c_failed=int((cf<=256).sum()),
            r_failed=int((rf<=256).sum()),both_failed=int(((cf<=256)&(rf<=256)).sum()),
            same_first_error=int(((cf==rf)&(cf<=256)).sum()), c_first=int((cf<rf).sum()),r_first=int((rf<cf).sum())),
            controller_cohorts=controller_cohorts,controller_aggregates=controller_aggregates,
            count_independent_executor=True,
            stop_quantiles={str(n): dict(graphs=int((stops[:,j]>0).sum()), missing=int((stops[:,j]<0).sum()),
                minimum=int(stops[:,j][stops[:,j]>0].min()), maximum=int(stops[:,j][stops[:,j]>0].max()),
                p10=float(np.quantile(stops[:,j][stops[:,j]>0],.1)), median=float(np.median(stops[:,j][stops[:,j]>0])),
                p90=float(np.quantile(stops[:,j][stops[:,j]>0],.9))) for j,n in enumerate(counts)})
    if arm in ('gru', 'final'):
        first_readouts = {}
        for n in config['fixed_prompt_failure_requests']:
            ids = np.flatnonzero(cf <= n)
            t = cf[ids]-1
            categories = {'r_correct': rh[ids,t],
                          'same_wrong': (r[ids,t] == c[ids,t]),
                          'different_wrong': (~rh[ids,t]) & (r[ids,t] != c[ids,t])}
            values = {key: int(mask.sum()) for key,mask in categories.items()}
            if sum(values.values()) != len(ids):
                raise ValueError('First-C-error readouts do not partition failures')
            first_readouts[str(n)] = dict(failed=len(ids), graphs=len(tasks), **values)
        timing = []
        for j,n in enumerate(counts):
            observed = stops[:,j] > 0
            residual = stops[observed,j]-n
            exact, returned = outcomes['exact_stop'][:,j], outcomes['stopped_answer_correct'][:,j]
            partitions = dict(exact_correct=exact & returned, exact_wrong=exact & ~returned,
                              nonexact_correct=observed & ~exact & returned,
                              nonexact_wrong=observed & ~exact & ~returned, missing=~observed)
            parts = {key:int(mask.sum()) for key,mask in partitions.items()}
            if sum(parts.values()) != len(tasks):
                raise ValueError('Answer/timing outcomes do not partition graphs')
            timing.append(dict(depth=int(n), graphs=len(tasks), observed=int(observed.sum()),
                signed_mean=float(residual.mean()) if len(residual) else None,
                absolute_mean=float(np.abs(residual).mean()) if len(residual) else None, **parts))
        saved_timing = {int(row['requested_depth']):row for row in
            csv.DictReader(read('timing_residuals.csv').decode().splitlines()) if row['model']==arm}
        for row in timing:
            ref = saved_timing[row['depth']]
            if row['observed'] != int(ref['observed_crossings']) or not np.allclose(
                [row['signed_mean'],row['absolute_mean']], [float(ref['signed_mean']),float(ref['absolute_mean'])], atol=1e-12, rtol=0):
                raise ValueError('Timing residuals disagree with audited table')
        extra.update(first_readouts=first_readouts, timing_breakdown=timing)
        if arm == 'gru' and controller_eval is not None:
            payload = (controller_eval/'summary.json').read_bytes()
            development = json.loads(payload)
            hashes['controller_development/summary.json'] = hashlib.sha256(payload).hexdigest()
            if (development['status'] != 'complete' or development['threshold'] != .5 or
                    development['run'] != 'models/stage1_pointer/controller-prefix-seed83'):
                raise ValueError('Wrong controller development evaluation')
            payload = (controller_eval/'metrics.csv').read_bytes()
            hashes['controller_development/metrics.csv'] = hashlib.sha256(payload).hexdigest()
            saved_rows = {(r['split'],r['cohort']):r for r in csv.DictReader(payload.decode().splitlines()) if r['checkpoint']=='best'}
            panels = {}
            for split,start,end,graphs_per_count,replay_cap in [('validation',1,16,128,16),('depth_test',13,64,32,64)]:
                points = []
                for n in range(start,end+1):
                    metrics = development['metrics']['best'][split][f'depth_{n}']
                    saved_row = saved_rows[split,f'depth_{n}']
                    if metrics['questions'] != graphs_per_count:
                        raise ValueError('Unexpected development denominator')
                    for key,value in metrics.items():
                        if value is not None and not math.isclose(value,float(saved_row[key]),abs_tol=1e-12):
                            raise ValueError('Development CSV/JSON mismatch')
                    points.append(dict(depth=n, **metrics))
                panels[split] = dict(graphs=graphs_per_count, cap=replay_cap, points=points)
            extra['countdown'] = dict(source_directory=str(controller_eval), checkpoint='best',
                scope=development['scope'], source_input_sha256=development['input_sha256'], panels=panels)
    if arm == 'final':
        if not np.all(stops == counts[None,:]):
            raise ValueError('Final timer is not exact at every benchmark count')
        # Verify the unchanged-executor claim against the prior architecture's saved chunks.
        for path in sorted((root/'gru').glob('graphs-*.npz')):
            name = str(path.relative_to(root))
            read(name)
            if hashes[name] != reference['source_chunk_sha256'][name]:
                raise ValueError('Previous executor source changed')
            with np.load(path, allow_pickle=False) as old, np.load(root/'final'/path.name, allow_pickle=False) as current:
                for key in ('graph_indices','predictions','direct'):
                    if not np.array_equal(old[key],current[key]):
                        raise ValueError('Final and GRU executor outputs differ')
        extra['graph_invariant_controller'] = True
        extra['executor_matches_gru'] = True
        if numeric_root is not None:
            def numeric_read(name):
                payload=(numeric_root/name).read_bytes()
                hashes['numeric/'+name]=hashlib.sha256(payload).hexdigest()
                return payload
            numeric_summary=json.loads(numeric_read('summary.json'))
            if (numeric_summary['status']!='complete' or not numeric_summary['inference_files_unchanged'] or
                    numeric_summary['executor_executed'] or numeric_summary['inference_sha256']!=freeze['checkpoint_sha256']):
                raise ValueError('Numeric diagnostic does not match frozen final checkpoint')
            reader=[]
            for row in csv.DictReader(numeric_read('reader.csv').decode().splitlines()):
                n=int(row['requested']); initial=float(row['initial_memory']); error=float(row['absolute_error'])
                if not math.isclose(abs(initial-n),error,abs_tol=1e-12):
                    raise ValueError('Reader absolute error mismatch')
                reader.append(dict(request=n,initial=initial,error=error))
            countdown=[]
            for row in csv.DictReader(numeric_read('countdown.csv').decode().splitlines()):
                n=int(row['requested']); stop=int(row['first_stop']) if row['first_stop'] else None
                flags=dict(exact_stop=stop==n,early_stop=stop is not None and stop<n,
                           late_stop=stop is not None and stop>n,missing_stop=stop is None)
                if any(row[k]!=str(v) for k,v in flags.items()):
                    raise ValueError('Numeric first-stop flags disagree')
                if float(row['initial_memory']) != reader[n-1]['initial']:
                    raise ValueError('Numeric initial memory differs')
                countdown.append(dict(request=n,stop=stop,error=stop-n if stop is not None else None))
            if ([p['request'] for p in reader]!=list(range(1,10001)) or
                    [p['request'] for p in countdown]!=list(range(1,8193)) or
                    sum(p['error']==0 for p in countdown)!=numeric_summary['exact_stop_questions'] or
                    max(p['error'] for p in reader)!=numeric_summary['reader_max_absolute_error']):
                raise ValueError('Incomplete or inconsistent numeric diagnostic')
            extra['numeric_controller']=dict(reader=reader,countdown=countdown,summary=numeric_summary,
                source_directory=str(numeric_root),scope='Controller only; no R execution or pointer-quality measurement.')
    count_probe = None
    if count_probe_parts:
        observed = np.concatenate(count_probe_parts)
        correct = observed == targets[:, probe_loop-1, None]
        count_probe = dict(loop=probe_loop, reference_request=probe_loop, points=[])
        for j, n in enumerate(counts[probe_loop-1:]):
            hits = int(correct[:, j].sum())
            low, high = wilson(hits, len(tasks))
            count_probe['points'].append(dict(request=int(n), correct=hits, graphs=len(tasks),
                rate=hits/len(tasks), low=low, high=high,
                changed=int((observed[:, j] != observed[:, 0]).sum()),
                lost=int((correct[:, 0] & ~correct[:, j]).sum()),
                gained=int((~correct[:, 0] & correct[:, j]).sum())))
        for n in config['fixed_prompt_failure_requests']:
            if n >= probe_loop and count_probe['points'][n-probe_loop]['correct'] != fixed[str(n)]['loops'][probe_loop-1]['step_correct']:
                raise ValueError('Count probe disagrees with audited per-loop counts')
        for point in count_probe['points']:
            if point['correct'] != count_probe['points'][0]['correct'] - point['lost'] + point['gained']:
                raise ValueError('Paired count changes disagree with marginal accuracy')
    return dict(schema_version=1, model=arm, checkpoint=checkpoint, graphs=len(tasks), queries=345600,
                training_max=training_max, **extra, **({"cohorts": cohorts} if arm in ("fixed12", "gru") else {}), threshold=.5, safety_cap=cap, quality=quality, stops=histograms,
                **({"count_probe": count_probe} if count_probe else {}), aggregates=aggregates, fixed=fixed, structure=structure, source_sha256=hashes, source_directory='eval/pointer_analysis/paper-20261009',
                definitions=dict(forced='Ignore stopping and evaluate C through supplied N.',
                                 exact='First stop probability >=0.5 occurs at N; no cap fallback success.',
                                 joint='Exact stop and returned C letter matches x_N; earlier mistakes permitted.',
                                 strict='Exact stop and every intermediate C letter is correct.',
                                 intervals='Pointwise 95% Wilson across graphs at each separately prompted N.'))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', choices=CHECKPOINTS, default='joint_full')
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--graphs', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--controller-eval', type=Path, help='Optional saved selected-GRU development countdown evaluation')
    parser.add_argument('--numeric-root', type=Path, help='Final controller-only reader/countdown diagnostic directory')
    args = parser.parse_args()
    data = export(args.run, args.graphs, args.model, args.controller_eval, args.numeric_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, separators=(',', ':'), allow_nan=False)+'\n')
    print(f'Rechecked all 345,600 {args.model} queries, ten metrics, all 256 stopping histograms and four fixed-request diagnostic panels.')


if __name__ == '__main__':
    main()
