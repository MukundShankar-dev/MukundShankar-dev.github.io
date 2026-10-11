"""Export Architecture 4's two training stages from saved measurements; no inference."""
import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path


def close(a, b):
    if not math.isclose(a, b, rel_tol=3e-6, abs_tol=3e-7):
        raise ValueError(f'Measurements disagree: {a} != {b}')


def export(root, name, controller=False):
    path = root / name
    hashes = {}
    def read(file):
        raw = (path / file).read_bytes()
        hashes[file] = hashlib.sha256(raw).hexdigest()
        return raw.decode()
    config = json.loads(read('config.json'))
    best = json.loads(read('best_checkpoint.json'))
    events = [json.loads(line) for line in read('metrics.jsonl').splitlines()]
    train = [e for e in events if e['event'] == 'train']
    val = [e for e in events if e['event'] == 'validation']
    expected_train = [1] + list(range(10, 6001, 10)) if controller else list(range(1, 2251))
    expected_val = list(range(0, 6001, 100)) if controller else list(range(0, 2251, 250))
    assert [e['step'] for e in train] == expected_train
    assert [e['step'] for e in val] == expected_val
    measurements = []
    if controller:
        assert config['training_loops'] == 12 and config['batch_size'] == 256
        assert config['requested_counts'] == [n for n in range(1, 64) if n not in [9,17,29,41,53]]
        history = {(int(r['step']), r['cohort']): r for r in csv.DictReader(read('validation_history.csv').splitlines())}
        assert len(history) == sum(len(e['validation']) for e in val)
        for e in val:
            for cohort, values in e['validation'].items():
                for metric, value in values.items():
                    saved = history[e['step'], cohort][metric]
                    if value is None:
                        assert saved == ''
                    else:
                        close(float(saved), value)
            row = e['validation']['selection']
            assert row['questions'] == 1408
            measurements.append({'step': e['step'], 'trained': {'examples':1408, 'stop_loss':row['loss'], 'exact_stop':row['exact_stop']}})
        selected = min(measurements, key=lambda r:(-r['trained']['exact_stop'],r['trained']['stop_loss']))
        assert selected['step'] == best['step'] == 5800
        for e in train:
            row = e['train']
            close(row['loss'],row['stop_loss'] + config['remaining_loss_weight']*row['remaining_loss'] + config['initial_loss_weight']*row['initial_loss'])
        training = {'steps':expected_train,'examples':[256]*len(train),'stop_loss':[e['train']['stop_loss'] for e in train]}
    else:
        assert config['train_scope']=='recurrent' and config['isolated_controller']
        assert config['state_loss_weight']==.25 and config['gradient_accumulation']==4
        depths = config['train_depths']
        ids = None
        for e in val:
            examples = defaultdict(list)
            for row in csv.DictReader(read(f"validation-step-{e['step']:06d}.csv").splitlines()):
                examples[row['example_id']].append(row)
            assert len(examples)==768 and (ids is None or ids==set(examples))
            ids=set(examples)
            by_depth=defaultdict(list)
            for rows in examples.values():
                rows.sort(key=lambda r:int(r['loop']))
                assert [int(r['loop']) for r in rows]==list(range(1,13))
                depth=int(rows[0]['task_depth'])
                nominal=rows[:depth]
                losses={key:sum(float(r[column]) for r in nominal)/depth for key,column in [('pointer_loss','intermediate_loss'),('state_loss','r_intermediate_loss')]}
                by_depth[depth].append(losses)
            for depth,rows in by_depth.items():
                assert len(rows)==64
                close(sum(r['pointer_loss'] for r in rows)/64,e['validation']['by_depth'][str(depth)]['loss'])
            rows=[r for d in depths for r in by_depth[d]]
            trained={'examples':len(rows), **{k:sum(r[k] for r in rows)/len(rows) for k in ['pointer_loss','state_loss']}}
            close(trained['pointer_loss'],e['validation']['pointer_selection_loss'])
            measurements.append({'step':e['step'],'trained':trained})
        assert min(measurements,key=lambda r:r['trained']['pointer_loss'])['step']==best['step']==2250
        for e in train:
            row=e['train']
            assert row['examples']==16
            close(row['objective_loss'],row['loss']+.25*row['direct_state']['loss']+.1*row['completion']['objective_loss'])
        training={'steps':expected_train,'examples':[16]*len(train),
                  'pointer_loss':[e['train']['loss'] for e in train],
                  'state_loss':[e['train']['direct_state']['loss'] for e in train]}
    assert all(math.isfinite(v) and v>=0 for k,values in training.items() for v in values)
    return {'run':name,'config':config,'source_sha256':hashes,'selected_step':best['step'],'training':training,'validation':measurements}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs-root',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    runs={'executor':export(args.runs_root,'executor_r-seed61'), 'controller':export(args.runs_root,'controller-prefix-seed83',True)}
    result={'schema_version':1,'runs':runs,'definitions':{
        'scope':'Original development monitoring; executor and controller updates are separate training stages.',
        'executor':'C and direct-R 26-letter CE, mean nominal loops per example then mean examples. Validation: 576 queries, 64 per trained count 1–6/8/10/12, correlated through shared graph/start pairs. R loss is unscaled (training coefficient 0.25).',
        'controller':'Balanced stop BCE over observed continue/stop classes per example. Training samples 58 requests through 63 with min(N,12) loops; validation is the 1408-query selection cohort, 128 graphs at 11 seen counts up to 12 (excluding 9). Cohorts differ. Numerical auxiliary losses are not included.',
        'logging':'Executor: all 2250 updates. Controller: batch at update 1 and each tenth update, 601 samples; these are not ten-update averages.',
        'smoothing':'Trailing update window over available logged batches, weighted by batch examples. No interpolation of missing training losses. Validation remains unsmoothed.'}}
    args.output.write_text(json.dumps(result,separators=(',',':'),allow_nan=False)+'\n')
    print('Verified 2250 executor updates, 10 per-loop validation CSVs, 601 controller batch records and 61 validation checkpoints; selection matches both saved checkpoints.')

if __name__=='__main__': main()
