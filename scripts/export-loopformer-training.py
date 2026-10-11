"""Export the first LoopFormer run for the static journal, without model inference.

Usage: python3 scripts/export-loopformer-training.py --run /path/to/run
Validation measurements are checked against every saved nominal CSV prediction.
"""
import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path


def export(run: Path) -> dict:
    sources = {}

    def read(name: str) -> str:
        payload = (run / name).read_bytes()
        sources[name] = hashlib.sha256(payload).hexdigest()
        return payload.decode()

    config = json.loads(read("config.json"))
    best = json.loads(read("best_checkpoint.json"))
    history = [json.loads(line) for line in read("metrics.jsonl").splitlines()]
    training = [r for r in history if r["event"] == "train"]
    validation = [r for r in history if r["event"] == "validation"]
    if ([r["step"] for r in training] != list(range(1, 3751)) or
            [r["step"] for r in validation] != list(range(0, 3751, 250))):
        raise ValueError("Expected the complete original 3,750-update run")
    if (config["train_max_depth"] != 6 or config["validation_per_depth"] != 32
            or config["learning_rate"] != 0.0002 or best["step"] != 3250):
        raise ValueError("Run does not match the journal's first-attempt recipe")

    measurements = []
    reference_ids = None
    for event in validation:
        step = event["step"]
        examples = defaultdict(list)
        for row in csv.DictReader(read(f"validation-step-{step:06d}.csv").splitlines()):
            if int(row["loop"]) <= int(row["task_depth"]):
                examples[row["example_id"]].append(row)
        if len(examples) != 256:
            raise ValueError(f"Incomplete validation at update {step}")
        ids = set(examples)
        if reference_ids is not None and ids != reference_ids:
            raise ValueError("Validation cohort changed between updates")
        reference_ids = ids
        rescored = defaultdict(list)
        for rows in examples.values():
            depth = int(rows[0]["task_depth"])
            if sorted(int(r["loop"]) for r in rows) != list(range(1, depth + 1)):
                raise ValueError("Missing or duplicated nominal transitions")
            correct = all(r["prediction"] == r["intermediate_target"] for r in rows)
            loss = sum(float(r["intermediate_loss"]) for r in rows) / depth
            rescored[depth].append((correct, loss))
        for depth in range(1, 9):
            values = rescored[depth]
            saved = event["validation"]["by_depth"][str(depth)]
            accuracy = sum(v[0] for v in values) / len(values)
            loss = sum(v[1] for v in values) / len(values)
            if (len(values) != 32 or accuracy != saved["trajectory_accuracy"]
                    or not math.isclose(loss, saved["loss"], rel_tol=1e-6, abs_tol=1e-7)):
                raise ValueError(f"CSV and history disagree at {step}, depth {depth}")
        cohorts = {}
        for key, depths in [("trained", range(1, 7)), ("depth7", [7]), ("depth8", [8])]:
            values = [v for d in depths for v in rescored[d]]
            cohorts[key] = {
                "examples": len(values), "correct": sum(v[0] for v in values),
                "loss": sum(v[1] for v in values) / len(values),
            }
        measurements.append({"step": step, **cohorts})
    if min(measurements, key=lambda r: r["trained"]["loss"])["step"] != best["step"]:
        raise ValueError("Recomputed checkpoint selection disagrees with saved selection")
    if any(not math.isfinite(r["train"]["loss"]) or r["train"]["loss"] < 0 for r in training):
        raise ValueError("Invalid training loss")
    return {
        "schema_version": 1,
        "run": run.name,
        "source_repository": "https://github.com/MukundShankar-dev/loopformer",
        "source_directory": f"models/stage1_pointer/{run.name}",
        "source_sha256": sources,
        "definitions": {
            "training_loss": "Per-update batch CE: mean nominal transitions within each example, then mean examples; 26-symbol vocabulary, natural logarithms.",
            "validation_loss": "Same example-mean CE on a fixed cohort of 192 held-out graphs at requested depths 1–6.",
            "trajectory_accuracy": "An example succeeds only if every nominal intermediate prediction is correct. Cohorts: depths 1–6, 192 graphs; depth 7, 32; depth 8, 32.",
            "smoothing": "Display only: trailing example-weighted mean over the selected number of optimizer updates; partial windows at the start. Raw training losses retained. Validation never smoothed.",
            "checkpoint_2500": "Retained depth-extension candidate from subsequent development evaluations; not selected by the small monitor curves alone.",
            "checkpoint_3250": "Original minimum trained-depth validation-CE checkpoint.",
        },
        "config": config,
        "training": {
            "steps": [r["step"] for r in training],
            "loss": [r["train"]["loss"] for r in training],
            "examples": [r["train"]["examples"] for r in training],
        },
        "validation": measurements,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] /
                        "public/projects/loopformer/data/attempt-1-training.json")
    args = parser.parse_args()
    data = export(args.run)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, separators=(",", ":"), allow_nan=False) + "\n")
    print(f"Exported 3,750 updates and 16 CSV-verified validation checkpoints to {args.output}")


if __name__ == "__main__":
    main()
