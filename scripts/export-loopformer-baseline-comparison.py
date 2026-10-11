"""Add matched structural summaries for the audited three-baseline comparison."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np


def export(run: Path, graphs: Path, direct_path: Path, trace_path: Path, responses_path: Path) -> dict:
    sources = {}
    def load(path: Path, key: str) -> dict:
        raw=path.read_bytes();sources[key]=hashlib.sha256(raw).hexdigest()
        return json.loads(raw)
    direct=load(direct_path,'baseline-direct.json');trace=load(trace_path,'baseline-traces.json')
    responses=load(responses_path,'baseline-trace-responses.json')
    raw=graphs.read_bytes();sources['graphs.jsonl']=hashlib.sha256(raw).hexdigest()
    if sources['graphs.jsonl'] != trace['source_sha256']['benchmark_graphs.jsonl'] or sources['graphs.jsonl'] != direct['source_sha256']['benchmark_graphs.jsonl']:
        raise ValueError('Baseline graph populations differ')
    rows=[json.loads(line) for line in raw.splitlines()]
    groups={};modes=[];features={key:[] for key in ('cycle_period','transient_length','orbit_size')}
    for i,row in enumerate(rows):
        _,seed,mode,*_=row['example_id'].split('-');groups.setdefault((seed,mode),[]).append(i);modes.append(mode)
        mapping=dict(row['mapping']);visited={};node=row['initial_state']
        while node not in visited:visited[node]=len(visited);node=mapping[node]
        features['cycle_period'].append(len(visited)-visited[node]);features['transient_length'].append(visited[node]);features['orbit_size'].append(len(visited))
    modes=np.array(modes);features={k:np.array(v) for k,v in features.items()}
    arms={};uncertainty=direct['comparison_uncertainty']
    if len(rows)!=1350 or any(np.sum(modes==m)!=450 for m in set(modes)):
        raise ValueError('Graph population changed')
    for arm in ('original','sft'):
        outcome_bytes=(run/arm/'outcomes.npz').read_bytes();digest=hashlib.sha256(outcome_bytes).hexdigest();sources[f'{arm}/outcomes.npz']=digest
        response=responses['arms'][arm]
        if (digest!=trace['source_sha256'][f'{arm}/outcomes.npz'] or digest!=response['outcomes_sha256']
            or response['independent_audit_sha256']!=trace['source_sha256'][f'{arm}/independent_audit.json']):
            raise ValueError('Outcome/response audit identity differs')
        with np.load(run/arm/'outcomes.npz',allow_pickle=False) as saved:matrix=saved['stopped_answer_correct'].copy()
        if matrix.shape!=(1350,256) or matrix.sum(0).tolist()!=response['correct']:
            raise ValueError('Raw responses disagree with audited final-answer outcomes')
        for mode,series in trace['arms'][arm]['series'].items():
            mask=np.ones(1350,dtype=bool) if mode=='all' else modes==mode
            if matrix[mask].sum(0).tolist()!=series['metrics']['stopped_answer_correct']['hits']:
                raise ValueError('Depth/type series differs')
        comparisons=[]
        for band in direct['comparisons']:
            lo,hi=band['start'],band['end'];values=matrix[:,lo-1:hi];means=values.mean(1)
            def summarize(ids: np.ndarray, label: str) -> dict:
                hits=int(values[ids].sum());n=len(ids);queries=n*(hi-lo+1)
                if n:
                    rng=np.random.default_rng(uncertainty['bootstrap_seed']);draws=[]
                    for members in groups.values():
                        selected=np.intersect1d(ids,members)
                        if len(selected):draws.append(rng.choice(selected,size=(uncertainty['bootstrap_repeats'],len(selected)),replace=True))
                    low,high=np.quantile(means[np.concatenate(draws,axis=1)].mean(1),[.025,.975]).tolist()
                else:low=high=None
                return dict(label=label,graphs=n,queries=queries,correct=hits,accuracy=hits/queries if queries else None,low=low,high=high)
            by_mode=[dict(summarize(np.flatnonzero(modes==row['mode']),row['mode']),mode=row['mode']) for row in band['by_mode']]
            structure={}
            for field,mode_cells in band['structure'].items():
                structure[field]={}
                for mode,cells in mode_cells.items():
                    result=[]
                    for cell in cells:
                        limits=[int(v) for v in cell['label'].split('–')];lower,upper=limits[0],limits[-1]
                        ids=np.flatnonzero((modes==mode)&(features[field]>=lower)&(features[field]<=upper))
                        if len(ids)!=cell['graphs']:raise ValueError('Structural bins differ across models')
                        result.append(summarize(ids,cell['label']))
                    structure[field][mode]=result
            # All three plots use the same actual reference-letter distribution.
            expected=np.sum(response['expected'][lo-1:hi],axis=0).tolist()
            if expected!=band['expected'][:26] or any(sum(r)!=1350 for r in response['predicted'][lo-1:hi]):
                raise ValueError('Letter-reference or query denominator differs')
            comparisons.append(dict(key=band['key'],by_mode=by_mode,structure=structure))
        arms[arm]=comparisons
    return dict(schema_version=1,graphs=1350,arms=arms,source_sha256=sources,uncertainty=uncertainty)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('run','graphs','direct','traces','responses','output'):p.add_argument('--'+name,type=Path,required=True)
    a=p.parse_args();data=export(a.run,a.graphs,a.direct,a.traces,a.responses)
    a.output.write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n')
    print('Verified common graphs, all returned-letter counts, per-depth accuracy and structural denominators for both trace arms.')
