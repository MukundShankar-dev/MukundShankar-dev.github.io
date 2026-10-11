"""Export the audited ordinary-Qwen baseline for the static journal; no inference."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

import numpy as np


def export(run: Path, graphs: Path) -> dict:
    sources = {}

    def read(name: str) -> bytes:
        payload = (run / name).read_bytes()
        sources[name] = hashlib.sha256(payload).hexdigest()
        return payload

    audit = json.loads(read("independent_audit.json"))
    summary = json.loads(read("summary.json"))
    freeze = json.loads(read("freeze.json"))
    if not audit["passed"] or summary["status"] != "complete" or not summary["weights_unchanged"]:
        raise ValueError("A completed, audited baseline with unchanged weights is required")
    for name, digest in {**audit["analysis_artifacts_sha256"],
                         "freeze.json": audit["freeze_sha256"],
                         "outcomes.npz": audit["outcomes_sha256"]}.items():
        read(name)
        if sources[name] != digest:
            raise ValueError(f"Audited source has changed: {name}")

    def rows(name: str) -> list[dict]:
        return list(csv.DictReader(read(name).decode().splitlines()))

    def point(row: dict) -> dict:
        n, correct = int(row["graphs"]), int(row["correct"])
        rate = correct / n
        if not math.isclose(rate, float(row["accuracy"]), abs_tol=1e-12):
            raise ValueError("Saved accuracy differs from counts")
        z = 1.959963984540054
        denominator = 1 + z * z / n
        center = (rate + z * z / (2 * n)) / denominator
        radius = z * math.sqrt(rate * (1 - rate) / n + z * z / (4 * n * n)) / denominator
        low, high = max(0, center - radius), min(1, center + radius)
        if "low" in row:
            low, high = float(row["low"]), float(row["high"])
            if not math.isclose(low, max(0, center-radius), abs_tol=1e-9):
                raise ValueError("Saved Wilson interval differs")
            if not math.isclose(high, min(1, center+radius), abs_tol=1e-9):
                raise ValueError("Saved Wilson interval differs")
        return dict(depth=int(row["requested_depth"]), graphs=n, correct=correct,
                    accuracy=rate, low=low, high=high,
                    invalid=int(row["invalid_answers"]))

    series = {"all": [point(row) for row in rows("quality_by_depth.csv")]}
    strata = rows("strata.csv")
    for mode in ("random_function", "permutation", "full_cycle"):
        series[mode] = [point(row) for row in strata
                        if row["field"] == "graph_mode" and row["value"] == mode]
    for key, values in series.items():
        if [p["depth"] for p in values] != list(range(1, 257)):
            raise ValueError(f"Incomplete depth coverage: {key}")
        if any(p["graphs"] != (1350 if key == "all" else 450) for p in values):
            raise ValueError(f"Graph cohort changed: {key}")
    for i, total in enumerate(series["all"]):
        for key in ("graphs", "correct", "invalid"):
            if total[key] != sum(series[mode][i][key] for mode in series if mode != "all"):
                raise ValueError(f"Graph-type totals disagree at depth {i+1}")
    total = sum(p["graphs"] for p in series["all"])
    correct = sum(p["correct"] for p in series["all"])
    invalid = sum(p["invalid"] for p in series["all"])
    if (total != summary["queries"] or correct != summary["correct"] or
            invalid != audit["invalid_answers"] or correct / total != audit["accuracy"]):
        raise ValueError("Depth totals disagree with the completed audit")
    intervals = []
    for row in rows("cluster_intervals.csv"):
        lo, hi = (1, 256) if row["depth_range"] == "all" else map(int, row["depth_range"].split("-"))
        values = [p for p in series["all"] if lo <= p["depth"] <= hi]
        hits, queries = sum(p["correct"] for p in values), sum(p["graphs"] for p in values)
        if not math.isclose(hits / queries, float(row["rate"]), abs_tol=1e-12):
            raise ValueError("Depth-range summary disagrees")
        intervals.append(dict(depth_range=row["depth_range"], correct=hits, queries=queries,
                              accuracy=hits/queries, low=float(row["low"]), high=float(row["high"])))
    protocol_bytes = (run.parent / "protocol.json").read_bytes()
    sources["../protocol.json"] = hashlib.sha256(protocol_bytes).hexdigest()
    if sources["../protocol.json"] != freeze["protocol_sha256"]:
        raise ValueError("Frozen benchmark protocol changed")
    protocol = json.loads(protocol_bytes)
    graph_bytes = graphs.read_bytes()
    sources["benchmark_graphs.jsonl"] = hashlib.sha256(graph_bytes).hexdigest()
    if sources["benchmark_graphs.jsonl"] != freeze["config"]["graphs_sha256"]:
        raise ValueError("Frozen graph dataset changed")
    graph_rows = [json.loads(line) for line in graph_bytes.splitlines()]
    if len(graph_rows) != 1350:
        raise ValueError("Unexpected graph count")
    targets = np.empty((1350, 256), dtype=np.uint8)
    groups = {}
    modes = []
    features = {"cycle_period": [], "transient_length": [], "orbit_size": []}
    for i, graph in enumerate(graph_rows):
        _, seed, mode, *_ = graph["example_id"].split("-")
        modes.append(mode)
        groups.setdefault((int(seed), mode), []).append(i)
        mapping, state = dict(graph["mapping"]), graph["initial_state"]
        visited, node = {}, state
        while node not in visited:
            visited[node] = len(visited)
            node = mapping[node]
        features["cycle_period"].append(len(visited) - visited[node])
        features["transient_length"].append(visited[node])
        features["orbit_size"].append(len(visited))
        for j in range(256):
            state = mapping[state]
            targets[i, j] = ord(state) - 65
    with np.load(run / "outcomes.npz", allow_pickle=False) as outcomes:
        predictions = outcomes["predictions"]
        correct_matrix = outcomes["correct"]
        valid = outcomes["valid"]
        if (predictions.shape != targets.shape or not np.array_equal(outcomes["counts"], np.arange(1, 257))
                or not np.array_equal(valid, predictions < 26)
                or not np.array_equal(correct_matrix, predictions == targets)):
            raise ValueError("Audited outcomes differ from independently executed graph targets")
    for key, points in series.items():
        mask = np.ones(1350, dtype=bool) if key == "all" else np.array(modes) == key
        if not np.array_equal(correct_matrix[mask].sum(0), [p["correct"] for p in points]):
            raise ValueError("Audited matrix and depth/graph-type table disagree")
    for field in ("cycle_period", "transient_length"):
        for value in set(features[field]):
            mask = np.array(features[field]) == value
            reference = [row for row in strata if row["field"] == field and int(row["value"]) == value]
            if (len(reference) != 256 or any(int(row["graphs"]) != int(mask.sum()) for row in reference)
                    or not np.array_equal(correct_matrix[mask].sum(0), [int(row["correct"]) for row in reference])):
                raise ValueError(f"Reconstructed graph feature differs from audited strata: {field}={value}")
    frequency = np.bincount(predictions.ravel(), minlength=27)
    labels = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") + ["invalid"]
    if any(int(frequency[i]) != audit["prediction_counts"].get(label, 0) for i, label in enumerate(labels)):
        raise ValueError("Prediction frequencies differ from audit")
    uncertainty = protocol["uncertainty"]
    rng = np.random.default_rng(uncertainty["bootstrap_seed"])
    draws_by_group = [(mode, rng.choice(ids, size=(uncertainty["bootstrap_repeats"], len(ids)), replace=True))
                      for (_, mode), ids in groups.items()]
    draws = np.concatenate([sample for _, sample in draws_by_group], axis=1)
    comparisons = []
    bands = [("all", "1–256 · full benchmark", 1, 256), ("1", "1 · one step", 1, 1)]
    bands += [(r["depth_range"], r["depth_range"].replace("-", "–"),
               *map(int, r["depth_range"].split("-"))) for r in intervals if r["depth_range"] != "all"]
    # Bin membership is fixed across depths. Resample whole graphs within each
    # seed/type/bin, then reuse those draws for every requested-depth range.
    structural_bins = {"cycle_period": protocol["cycle_bins"],
                       "transient_length": protocol["transient_bins"],
                       "orbit_size": protocol["cycle_bins"]}
    structural_samples = {}
    for field, bins in structural_bins.items():
        for mode in ("random_function", "permutation", "full_cycle"):
            samples = []
            for lower, upper in bins:
                ids = np.where((np.array(modes) == mode) & (np.array(features[field]) >= lower)
                               & (np.array(features[field]) <= upper))[0]
                sample_rng = np.random.default_rng(uncertainty["bootstrap_seed"])
                strata_draws = []
                for (_, group_mode), group_ids in groups.items():
                    members = np.intersect1d(ids, group_ids)
                    if group_mode == mode and len(members):
                        strata_draws.append(sample_rng.choice(members,
                            size=(uncertainty["bootstrap_repeats"], len(members)), replace=True))
                sample = np.concatenate(strata_draws, axis=1) if strata_draws else None
                label = str(lower) if lower == upper else f"{lower}–{upper}"
                samples.append((label, ids, sample))
            structural_samples[field, mode] = samples
    for key, label, lo, hi in bands:
        means = correct_matrix[:, lo-1:hi].mean(axis=1)
        whole_low, whole_high = np.quantile(means[draws].mean(axis=1), [.025, .975])
        saved = next((r for r in intervals if r["depth_range"] == key), None)
        if saved and not np.allclose([whole_low, whole_high], [saved["low"], saved["high"]], rtol=0, atol=1e-12):
            raise ValueError("Recomputed whole-graph intervals differ from audited intervals")
        by_mode = []
        for mode in series:
            if mode == "all":
                continue
            mask = np.array(modes) == mode
            mode_draws = np.concatenate([sample for m, sample in draws_by_group if m == mode], axis=1)
            low, high = np.quantile(means[mode_draws].mean(axis=1), [.025, .975])
            queries = int(mask.sum()) * (hi-lo+1)
            hits = int(correct_matrix[mask, lo-1:hi].sum())
            by_mode.append(dict(mode=mode, graphs=int(mask.sum()), queries=queries, correct=hits,
                                accuracy=hits/queries, low=float(low), high=float(high)))
        predicted = np.bincount(predictions[:, lo-1:hi].ravel(), minlength=27).tolist()
        expected = np.bincount(targets[:, lo-1:hi].ravel(), minlength=27).tolist()
        queries = 1350 * (hi-lo+1)
        if sum(predicted) != queries or sum(expected) != queries:
            raise ValueError("Distribution denominators disagree")
        structure = {}
        for (field, mode), samples in structural_samples.items():
            cells = []
            for bin_label, ids, sample in samples:
                n = len(ids)
                hits = int(correct_matrix[ids, lo-1:hi].sum())
                ci = np.quantile(means[sample].mean(axis=1), [.025, .975]) if n else [None, None]
                cells.append(dict(label=bin_label, graphs=n, queries=n*(hi-lo+1), correct=hits,
                                  accuracy=hits/(n*(hi-lo+1)) if n else None,
                                  low=float(ci[0]) if n else None, high=float(ci[1]) if n else None))
            if sum(c["graphs"] for c in cells) != 450:
                raise ValueError("Structural bins do not partition graph type")
            structure.setdefault(field, {})[mode] = cells
        comparisons.append(dict(structure=structure, key=key, label=label, start=lo, end=hi, queries=queries,
                                by_mode=by_mode, predicted=predicted, expected=expected))
    return dict(schema_version=2, comparisons=comparisons,
                comparison_uncertainty=uncertainty, source_directory="eval/pointer_analysis/paper-20261009/ordinary_qwen",
                source_repository="https://github.com/MukundShankar-dev/loopformer",
                source_sha256=sources, config=freeze["config"],
                summary=dict(graphs=1350, queries=total, correct=correct, accuracy=correct/total,
                             invalid=invalid, token_budget_stops=audit["token_budget_stops"]),
                definitions=dict(accuracy="Exact final uppercase letter after stripping surrounding whitespace; invalid responses remain failures.",
                                 pointwise_interval="95% Wilson interval over graphs at each requested depth; not a simultaneous band.",
                                 aggregate_interval="Saved 95% graph-cluster bootstrap interval, stratified by seed and graph type; all requests of a graph stay together.",
                                 smoothing="None. Lines connect measured integer depths; no interpolated measurements."),
                series=series, intervals=intervals)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--graphs", type=Path, required=True, help="Frozen benchmark graphs.jsonl")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] /
                        "public/projects/loopformer/data/baseline-direct.json")
    args = parser.parse_args()
    data = export(args.run, args.graphs)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, separators=(",", ":"), allow_nan=False) + "\n")
    print(f"Exported 256 depths and three graph-type series: {data['summary']['correct']:,}/{data['summary']['queries']:,} correct.")


if __name__ == "__main__":
    main()
