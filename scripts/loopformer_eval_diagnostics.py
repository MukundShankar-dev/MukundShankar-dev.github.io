"""Shared audited fixed-request diagnostics for recurrent article figures."""
from collections import Counter
from typing import Callable
import csv
import math
import numpy as np

CATEGORIES = ('repeat previous state', 'earlier visited state', 'later reachable state', 'outside start orbit')


def export_diagnostics(tasks: list[dict], targets: np.ndarray, outcomes: dict,
                       config: dict, traces: np.ndarray, arm: str,
                       read: Callable[[str], bytes],
                       wilson: Callable[[int, int], tuple[float | None, float | None]]) -> tuple[dict, dict]:
    """Recheck observed first-N readouts; never treat post-horizon padding as predictions."""
    ngraph = len(tasks)
    requests = config['fixed_prompt_failure_requests']
    def rows(name):
        return list(csv.DictReader(read(name).decode().splitlines()))
    features = []
    for task in tasks:
        mapping, node = dict(task['mapping']), task['initial_state']
        seen = {}
        while node not in seen:
            seen[node] = len(seen)
            node = mapping[node]
        _, seed, mode, *_ = task['example_id'].split('-')
        features.append(dict(graph_mode=mode, dataset_seed=int(seed), cycle_period=len(seen)-seen[node],
                             transient_length=seen[node], orbit_size=len(seen)))
    saved_loops = {(int(r['requested_depth']),int(r['loop'])):r for r in rows('fixed_request_loops.csv') if r['model']==arm}
    saved_errors = {(int(r['requested_depth']),int(r['graph_index'])):r for r in rows('first_errors.csv') if r['model']==arm}
    saved_stats = {int(r['requested_depth']):r for r in rows('execution_statistics.csv') if r['model']==arm}
    saved_episodes = Counter((int(r['requested_depth']),int(r['graph_index']),int(r['start_loop']),int(r['duration']),r['right_censored']=='True')
                             for r in rows('wrong_episodes.csv') if r['model']==arm)
    fixed = {}
    for column, requested in enumerate(requests):
        pred = traces[:,column,:requested]
        hit = pred == targets[:,:requested]
        first = np.where((~hit).any(1),(~hit).argmax(1)+1,requested+1)
        loops = []
        for j in range(requested):
            at_risk, failures, survivors = int((first>=j+1).sum()), int((first==j+1).sum()), int((first>j+1).sum())
            step = int(hit[:,j].sum())
            saved = saved_loops[requested,j+1]
            if [at_risk,failures,survivors,step] != [int(saved[k]) for k in ('at_risk','first_failures','survivors','step_correct')]:
                raise ValueError('Loop metrics disagree with raw traces')
            low, high = wilson(survivors,ngraph)
            hlow, hhigh = wilson(failures,at_risk)
            loops.append(dict(loop=j+1,survivors=survivors,graphs=ngraph,survival=survivors/ngraph,
                              low=low,high=high,step_correct=step,step_accuracy=step/ngraph,
                              at_risk=at_risk,first_failures=failures,hazard=failures/at_risk if at_risk else None,
                              hazard_low=hlow,hazard_high=hhigh))
        categories = Counter(); recovered = continued = prior = consistent = wrong_consistent = prior_right = right_consistent = 0
        episodes = []
        for i,task in enumerate(tasks):
            mapping = {ord(a)-65:ord(b)-65 for a,b in task['mapping']}
            initial = ord(task['initial_state'])-65
            e = int(first[i])-1
            if e < requested:
                value = int(pred[i,e]); previous = initial if e==0 else int(targets[i,e-1])
                visited = {initial,*targets[i,:e].tolist()}
                orbit, node = set(), initial
                while node not in orbit:
                    orbit.add(node); node = mapping[node]
                category = CATEGORIES[0] if value==previous else CATEGORIES[1] if value in visited else CATEGORIES[2] if value in orbit else CATEGORIES[3]
                saved = saved_errors[requested,i]
                if category != saved['category'] or int(saved['loop']) != e+1 or saved['prediction'] != chr(value+65):
                    raise ValueError('First error/taxonomy differs from raw trace')
                categories[category] += 1
            for j in range(1,requested):
                edge_ok = int(pred[i,j]) == mapping[int(pred[i,j-1])]
                consistent += edge_ok
                if not hit[i,j-1]:
                    prior += 1; recovered += bool(hit[i,j]); continued += edge_ok and not hit[i,j]
                    wrong_consistent += edge_ok
                else:
                    prior_right += 1; right_consistent += edge_ok
            cursor = 0
            while cursor < requested:
                if hit[i,cursor]: cursor += 1; continue
                end = cursor+1
                while end<requested and not hit[i,end]: end+=1
                record = (requested,i,cursor+1,end-cursor,end==requested)
                if saved_episodes[record] != 1:
                    raise ValueError('Wrong episode differs from saved table')
                episodes.append((end-cursor,end==requested)); cursor=end
        failed = int((first<=requested).sum())
        wrong_loops = int((~hit).sum())
        correct_prefix = float(np.minimum(first-1,requested).mean())
        stats = dict(graphs=ngraph,failed_graphs=failed,restricted_mean_correct_prefix=correct_prefix,
                     wrong_loop_fraction=wrong_loops/(ngraph*requested),prior_wrong_transitions=int(prior),
                     reference_recoveries=int(recovered),conditional_reference_recovery=recovered/prior if prior else None,
                     wrong_edge_continuations=int(continued),other_wrong_transitions=int(prior-recovered-continued),
                     wrong_episodes=len(episodes),right_censored_episodes=sum(c for _,c in episodes))
        if any(not math.isclose(float(value),float(saved_stats[requested][key]),abs_tol=1e-12) for key,value in stats.items()):
            raise ValueError('Recomputed execution summary differs')
        if sum(n==requested for n,*_ in saved_episodes.elements()) != len(episodes):
            raise ValueError('Episode coverage differs')
        episode_bins = []
        for low,high in [(1,1),(2,4),(5,8),(9,16),(17,32),(33,64),(65,128),(129,256)]:
            if low>requested:continue
            episode_bins.append(dict(label=str(low) if low==high else f'{low}–{min(high,requested)}',
                                     ended=sum(low<=length<=high and not censored for length,censored in episodes),
                                     censored=sum(low<=length<=high and censored for length,censored in episodes)))
        fixed[str(requested)] = dict(loops=loops,stats=stats,categories=[dict(label=c,count=categories[c]) for c in CATEGORIES],
                                    episodes=episode_bins,edge_consistency=dict(correct_prior=right_consistent,correct_exposure=prior_right,
                                    wrong_prior=wrong_consistent,wrong_exposure=prior,all=consistent,total=ngraph*(requested-1)))
    structure = {}
    for requested in requests:
        cells = {}
        for field in ('graph_mode','dataset_seed','cycle_period','transient_length','orbit_size'):
            populations = ['all'] if field in ('graph_mode','dataset_seed') else config['graph_modes']
            cells[field] = {}
            for mode in populations:
                buckets = [(str(v),v,v) for v in config['graph_modes' if field=='graph_mode' else 'seeds']] if field in ('graph_mode','dataset_seed') else [
                    (str(a) if a==b else f'{a}–{b}',a,b) for a,b in config['transient_bins' if field=='transient_length' else 'cycle_bins']]
                rows_out = []
                for label,lo,hi in buckets:
                    ids = [i for i,f in enumerate(features) if (mode=='all' or f['graph_mode']==mode) and lo<=f[field]<=hi]
                    metrics = {}
                    for metric in ('nominal_final_correct', 'complete_trajectory'):
                        hits=int(outcomes[metric][ids,requested-1].sum()); low,high=wilson(hits,len(ids))
                        metrics[metric]=dict(correct=hits,rate=hits/len(ids) if ids else None,low=low,high=high)
                    rows_out.append(dict(label=label,graphs=len(ids),metrics=metrics))
                cells[field][mode]=rows_out
        structure[str(requested)]=cells
    return fixed, structure
