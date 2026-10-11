# First-attempt evaluation

The first attempt's Evaluation Metrics section uses `ce_full` in the complete
`eval/pointer_analysis/paper-20261009` suite. This is the 2,500-update checkpoint,
selected for earlier development depth extension, not the validation-CE minimum
at 3,250 used in the older small architecture comparison. No new model selection,
inference or training is performed. The separate Analysis placeholder remains.

## Reproduce the export

From the website repository, using the research NumPy environment:

```bash
/Users/mukunds/Desktop/loopformer/.venv/bin/python scripts/export-loopformer-attempt1-eval.py \
  --run /Users/mukunds/Desktop/loopformer/eval/pointer_analysis/paper-20261009 \
  --graphs /Users/mukunds/Desktop/loopformer/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --output public/projects/loopformer/data/attempt-1-eval.json
```

The exporter verifies completed audit and figure-manifest hashes, all 338 CE raw
chunk hashes, frozen graph/protocol identities and checkpoint identity. Raw rules
reconstruct targets. Every one of the 345,600 final and complete-trajectory
outcomes is recalculated from raw predictions and checked against audited arrays
and depth tables. Only the actually observed first N positions are scored;
zero-filled padding is never interpreted as model predictions.

For fixed Steps=6/12/32/256, raw traces independently reproduce saved survival,
risk sets, first-error types, wrong episodes, recovery and summary statistics.
Decoded edge consistency groups transitions by the preceding readout's correctness,
using loops 2 through N. Return-to-reference takes precedence over wrong-but-valid
edge continuation. Wrong-episode tails remain censored at N. Range intervals
reproduce the research suite's 2,000 whole-graph bootstrap draws within seed/type
strata (seed 239). Source hashes and metric definitions are retained in JSON.

## Figures and scientific scope

Four Plotly figures keep the article's broader metric plan without duplicating
its definitions or creating a separate chart for every diagnostic:

1. Final-answer and complete-trajectory accuracy by requested depth, with optional
   pointwise intervals and the training limit marked at 6. Different requested N values are independent prompts.
2. Fixed-request first-error histogram. Each of the 1,350 graphs contributes
   once to a loop-range bin or the separate no-error-through-cutoff bar. Counts
   are summed from the audited per-loop first-failure table and must partition
   the entire panel. Bin widths differ and are labelled; this is a fraction of
   all graphs, not a density or conditional hazard. This replaces the visually
   similar survival/accuracy curves while preserving the first-error question.
3. First-error taxonomy, subsequent recovery/wrong-edge/other transitions,
   decoded edge consistency, and observed wrong-stretch durations. Each view
   explains its denominator. Correlated transition/episode counts have no fake
   independent-sample confidence intervals.
4. Graph type, generation seed, within-type cycle/transient/reachable-state bins,
   selectable final-answer or complete-trajectory accuracy at fixed N. Rates
   include successful graphs and show counts and Wilson intervals. Empty bins
   are N/A. Reachable-state counts include Start; period 26 is not treated as
   independent of full-cycle graph type.

[The shared palette](loopformer-chart-palette.md) reserves blue for accuracy,
green for survival, rose for error diagnostics, and graphite for graph structure.
The same family keeps its palette across architectures; training and baseline
colors are reserved for their own families. All curves are unsmoothed. No stopping, R/C discrepancy, or autonomous
solver score is assigned to this headless architecture. The full benchmark has
cycles unlike the original nonrepeating training paths; familiar requested counts
do not imply that the graph distribution is unchanged.

The main readout: 97.53% final-answer accuracy across N=1–6; 94.81% complete
trajectories at N=6; 1.11% at N=12; zero at N=256. For Steps=32, mean correct
prefix is 8.83, with 1,238 reference recoveries among 28,546 prior-wrong
transitions (4.34%). These are observed results, not an identified failure cause.

## Verification

Validate JSON counts/denominators, syntax and local links, then visually inspect
each figure, changing requested depths and diagnostic/structure views. Check
empty bins, histogram totals, quality zoom/reset, optional intervals and mobile layout.
Static tables and prose summarize results if chart loading fails.
