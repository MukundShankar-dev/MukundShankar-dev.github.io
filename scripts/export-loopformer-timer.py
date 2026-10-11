"""Export saved scalar-controller monitoring and final fit summaries; no inference."""
import argparse, csv, hashlib, json, math
from pathlib import Path


def export(root):
    hashes = {}
    def read(name, file):
        raw = (root / name / file).read_bytes()
        hashes[f'{name}/{file}'] = hashlib.sha256(raw).hexdigest()
        return raw.decode()
    name = 'controller-affine-seed83'
    config = json.loads(read(name, 'config.json'))
    events = [json.loads(line) for line in read(name, 'metrics.jsonl').splitlines()]
    train = [e for e in events if e['event'] == 'train']
    val = [e for e in events if e['event'] == 'validation']
    assert [e['step'] for e in train] == [1] + list(range(10, 3001, 10))
    assert [e['step'] for e in val] == list(range(0, 3001, 100))
    assert config['controller_kind'] == 'affine_suffix' and config['training_loops'] == 12
    assert config['batch_size'] == 256
    counts = [n for n in range(1,64) if n not in [9,17,29,41,53]]
    assert config['requested_counts'] == counts
    history = {(int(r['step']),r['cohort']):r for r in csv.DictReader(read(name,'validation_history.csv').splitlines())}
    assert len(history) == sum(len(e['validation']) for e in val)
    def close(a,b):
        assert math.isclose(a,b,rel_tol=3e-6,abs_tol=3e-7),(a,b)
    for e in val:
        for cohort,row in e['validation'].items():
            for k,v in row.items():
                saved=history[e['step'],cohort][k]
                if v is None: assert saved==''
                else: close(float(saved),v)
        assert e['validation']['selection']['questions']==1408
    for e in train:
        r=e['train']
        close(r['loss'],r['stop_loss']+config['remaining_loss_weight']*r['remaining_loss']+config['initial_loss_weight']*r['initial_loss'])
    best=json.loads(read(name,'best_checkpoint.json'))
    selected=min(val,key=lambda e:(-e['validation']['selection']['exact_stop'],e['validation']['selection']['loss']))
    assert best['step']==selected['step']==3000
    fits={}
    for key,run in [('reader','controller-shared-number-seed83'),('precision','controller-shared-number-precision-seed83')]:
        d=json.loads(read(run,'summary.json'))
        assert d['status']=='complete' and d['fit']['training_counts']==counts
        fits[key]={'run':run,'fit':d['fit'],'selection':d['selection']}
    assert fits['precision']['fit']['training_loops']==12
    run={'run':name,'config':config,'selected_step':3000,
         'training':{'steps':[e['step'] for e in train],'examples':[256]*len(train),'stop_loss':[e['train']['stop_loss'] for e in train]},
         'validation':[{'step':e['step'],'trained':{'examples':1408,'stop_loss':e['validation']['selection']['loss'],'exact_stop':e['validation']['selection']['exact_stop']}} for e in val]}
    assert all(math.isfinite(v) and v>=0 for v in run['training']['stop_loss'])
    return {'schema_version':1,'runs':{'timer':run},'fits':fits,'source_sha256':hashes,'definitions':{
      'curve':'Original affine-suffix controller, before shared-reader replacement and precision refinement. Balanced stop BCE only, not total numerical objective.',
      'training':'301 sampled 256-query batches: update 1 and every tenth update. 58 requested counts through 63; nominal rollouts capped at 12.',
      'validation':'31 checkpoints, 1408 queries on 128 graphs, seen counts 1–12 excluding 9. Mean per-example balanced BCE.',
      'selection':'Highest short-seen-count exact-stop accuracy, then lowest BCE; update 3000.',
      'fits':'Shared reader: one least-squares fit. Precision: before/fitted/exported numerical training MSE, unscaled squared-step units, initial-state error excluded and denominator min(N,12)+1. No per-iteration or validation history saved for these fits.'}}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runs-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    a.output.write_text(json.dumps(export(a.runs_root),separators=(',',':'),allow_nan=False)+'\n')
    print('Verified 301 training records, 31 validation checkpoints, checkpoint selection and two final fit summaries.')
