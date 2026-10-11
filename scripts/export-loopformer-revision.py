"""Export completion/fixed-memory learning histories, independently checking saved CSVs.

No inference. Run with --runs-root /path/to/loopformer/models/stage1_pointer
and --output /path/to/attempt-2-training.json.
"""
import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path


def close(a: float, b: float) -> None:
    if not math.isclose(a, b, rel_tol=2e-6, abs_tol=2e-7):
        raise ValueError(f'Source measurements disagree: {a} vs {b}')


def export_run(root: Path, name: str, mode: str, *, depth12: bool = False) -> dict:
    run = root / name
    hashes = {}

    def read(filename: str) -> str:
        raw = (run / filename).read_bytes()
        hashes[filename] = hashlib.sha256(raw).hexdigest()
        return raw.decode()

    config = json.loads(read('config.json'))
    best = json.loads(read('best_checkpoint.json'))
    expected = {'train_max_depth': 6, 'validation_max_depth': 8,
                'validation_per_depth': 32, 'completion_loss_weight': .1,
                'completion_head_hidden_size': 128, 'batch_size': 4,
                'gradient_accumulation': 2, 'learning_rate': .0002,
                'warmup_steps': 10, 'weight_decay': 0, 'epochs': 1}
    if depth12:
        expected.update(train_max_depth=12, validation_max_depth=12,
                        gradient_accumulation=1, precision='bf16', attention='sdpa',
                        bucket_by_depth=True, train_depths=[1, 2, 3, 4, 5, 6, 8, 10, 12])
    maximum = 12 if depth12 else 8
    updates, interval, batch = (7500, 500, 4) if depth12 else (3750, 250, 8)
    trained_depths = expected['train_depths'] if depth12 else list(range(1, 7))
    for key, value in expected.items():
        if config[key] != value:
            raise ValueError(f'Unexpected {key}: {config[key]}')
    if config.get('recurrence_mode', 'full_sequence') != mode:
        raise ValueError('Unexpected recurrence mode')
    events = [json.loads(line) for line in read('metrics.jsonl').splitlines()]
    training = [e for e in events if e['event'] == 'train']
    validation = [e for e in events if e['event'] == 'validation']
    if [e['step'] for e in training] != list(range(1, updates + 1)):
        raise ValueError('Missing training updates')
    if [e['step'] for e in validation] != list(range(0, updates + 1, interval)):
        raise ValueError('Missing validation checkpoints')
    measurements = []
    identities = None
    for event in validation:
        step = event['step']
        examples = defaultdict(list)
        for row in csv.DictReader(read(f'validation-step-{step:06d}.csv').splitlines()):
            examples[row['example_id']].append(row)
        current = set(examples)
        if len(current) != 32 * maximum or (identities is not None and current != identities):
            raise ValueError('Validation cohort changed')
        identities = current
        by_depth = defaultdict(list)
        for rows in examples.values():
            rows.sort(key=lambda row: int(row['loop']))
            depth = int(rows[0]['task_depth'])
            if [int(r['loop']) for r in rows] != list(range(1, maximum + 1)):
                raise ValueError('Missing or duplicate monitoring loops')
            nominal = rows[:depth]
            losses = []
            for t, row in enumerate(nominal, 1):
                target = t == depth
                if row['stop_target'] != str(target):
                    raise ValueError('Incorrect stop label')
                logit = float(row['stop_logit'])
                # Stable BCE from logits; stop_loss is independently verified.
                loss = max(logit, 0) - logit * target + math.log1p(math.exp(-abs(logit)))
                # FP32 softplus subtraction can differ from this float64 reference.
                if not math.isclose(loss, float(row['stop_loss']), rel_tol=2e-6, abs_tol=1e-6):
                    raise ValueError('Stop BCE disagrees with logits')
                losses.append(float(row['stop_loss']))
            pointer = sum(float(r['intermediate_loss']) for r in nominal) / depth
            stop = losses[-1] if depth == 1 else (sum(losses[:-1]) / (depth - 1) + losses[-1]) / 2
            trajectory = all(r['prediction'] == r['intermediate_target'] for r in nominal)
            first_stop = next((int(r['loop']) for r in rows if float(r['stop_probability']) >= .5), None)
            by_depth[depth].append({'pointer_loss': pointer, 'stop_loss': stop,
                                    'correct': trajectory, 'exact_stop': first_stop == depth})
        for depth in range(1, maximum + 1):
            values = by_depth[depth]
            saved = event['validation']['by_depth'][str(depth)]
            if len(values) != 32:
                raise ValueError('Incorrect depth population')
            close(sum(v['pointer_loss'] for v in values) / 32, saved['loss'])
            close(sum(v['stop_loss'] for v in values) / 32, saved['completion']['objective_loss'])
            close(sum(v['correct'] for v in values) / 32, saved['trajectory_accuracy'])
            close(sum(v['exact_stop'] for v in values) / 32, saved['completion']['first_stop_exact_rate'])
        cohorts = {}
        cohort_depths = [('trained', trained_depths), ('heldout', [7, 9, 11])] if depth12 else [('trained', trained_depths), ('depth7', [7]), ('depth8', [8])]
        for key, depths in cohort_depths:
            values = [v for d in depths for v in by_depth[d]]
            n = len(values)
            cohorts[key] = {'examples': n,
                            'pointer_loss': sum(v['pointer_loss'] for v in values) / n,
                            'stop_loss': sum(v['stop_loss'] for v in values) / n,
                            'correct': sum(v['correct'] for v in values),
                            'exact_stop': sum(v['exact_stop'] for v in values)}
        close(cohorts['trained']['pointer_loss'], event['validation']['pointer_selection_loss'])
        close(cohorts['trained']['stop_loss'], event['validation']['completion_selection_loss'])
        measurements.append({'step': step, **cohorts})
    selected = min(measurements, key=lambda row: row['trained']['pointer_loss'])
    if selected['step'] != best['step'] or best['step'] != (5000 if depth12 else 3250):
        raise ValueError('Checkpoint selection mismatch')
    close(selected['trained']['pointer_loss'], best['selection_loss'])
    for event in training:
        row = event['train']
        if row['examples'] != batch:
            raise ValueError('Unexpected batch weight')
        for value in [row['loss'], row['completion']['objective_loss'], row['objective_loss']]:
            if not math.isfinite(value) or value < 0:
                raise ValueError('Invalid training measurement')
        close(row['loss'] + .1 * row['completion']['objective_loss'], row['objective_loss'])
    return {'run': name, 'mode': mode, 'config': config, 'selected_step': best['step'],
            'source_sha256': hashes,
            'validation_ids_sha256': hashlib.sha256('\n'.join(sorted(identities)).encode()).hexdigest(),
            'training': {'steps': [e['step'] for e in training],
                         'examples': [e['train']['examples'] for e in training],
                         'pointer_loss': [e['train']['loss'] for e in training],
                         'stop_loss': [e['train']['completion']['objective_loss'] for e in training]},
            'validation': measurements}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs-root', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--depth12', action='store_true', help='Export architecture 3b instead of the two depth-6 runs')
    args = parser.parse_args()
    if args.depth12:
        runs = {'fixed12': export_run(args.runs_root, 'depth12-fixed-prompt-seed47-gaps', 'fixed_prompt', depth12=True)}
    else:
        runs = {key: export_run(args.runs_root, name, mode) for key, name, mode in [
            ('joint', 'depth6-completion-seed37', 'full_sequence'),
            ('fixed', 'depth6-fixed-prompt-seed37', 'fixed_prompt')]}
        if runs['joint']['validation_ids_sha256'] != runs['fixed']['validation_ids_sha256']:
            raise ValueError('Runs do not share the validation cohort')
    result = {'schema_version': 1, 'runs': runs, 'definitions': {
        'pointer_loss': '26-symbol CE, mean nominal loops within each example then mean examples.',
        'stop_loss': 'Unscaled balanced BCE: equal weight to mean continue BCE and final stop BCE per example; depth 1 has stop BCE only. Mean across examples. Training multiplies this loss by 0.1.',
        'validation': 'Charts use 192 fixed examples at depths 1–6. All 256 examples, including 32 each at 7/8, are audited and exported.',
        'smoothing': 'Display-only trailing example-weighted mean for training; unsmoothed validation every 250 updates.',
        'scope': 'Original development monitoring, not full-population evaluation or measured inference speed.'}}
    if args.depth12:
        result['definitions']['validation'] = 'Charts use 288 fixed examples at requested counts 1–6/8/10/12. All 384 examples are audited; 96 at held-out counts 7/9/11 are exported separately.'
        result['definitions']['smoothing'] = 'Display-only trailing example-weighted mean for training; unsmoothed validation every 500 updates.'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, separators=(',', ':'), allow_nan=False) + '\n')
    print(f'Exported {sum(len(r["training"]["steps"]) for r in runs.values()):,} updates and {sum(len(r["validation"]) for r in runs.values())} CSV-verified validation checkpoints.')


if __name__ == '__main__':
    main()
