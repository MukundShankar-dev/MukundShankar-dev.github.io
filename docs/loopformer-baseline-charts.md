# LoopFormer baseline comparisons

The article now separates **Experiments** (all three procedures) from **Results**
(all five Plotly figures and source tables). Source metrics, training scope and
user-written interpretations are retained. No training, checkpoint selection or
model inference is performed.

## Sources and reproduction

- Direct answer: `eval/pointer_analysis/paper-20261009/ordinary_qwen/`, exported
  with `scripts/export-loopformer-baseline.py` to `baseline-direct.json`.
- Intermediate-step prompting and full SFT: completed, independently audited
  `eval/pointer_traces/seed61-20261010/{original,sft}/`, exported with
  `scripts/export-loopformer-trace-baselines.py` to `baseline-traces.json`.
  Training history is `models/trace_sft/seed61-full/metrics.jsonl`.
- All arms use the identical 1,350 graphs and N=1–256 (345,600 queries per arm).
  SFT trains all 494,032,768 parameters on the executor's original 36,000 examples,
  one epoch/2,250 updates, requested counts 1–6, 8, 10, 12.

The response exporter reads raw compressed trace chunks on the research desktop,
verifies every byte hash against the passed independent audit, validates query
coverage and strict whole-response parsing, and counts the last returned letters.
It does not redownload weights, decode token streams again, or run inference.

```bash
python3 scripts/export-loopformer-trace-responses.py \
  --run /path/to/eval/pointer_traces/seed61-20261010 \
  > public/projects/loopformer/data/baseline-trace-responses.json
```

Run it where the complete chunks exist, or pipe the script to Python over SSH
with the same `--run` argument and save its JSON stdout locally. The subsequent
comparison exporter requires NumPy and compact audited outcome artifacts:

```bash
python scripts/export-loopformer-baseline-comparison.py \
  --run /path/to/copied/seed61-20261010 \
  --graphs /path/to/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --direct public/projects/loopformer/data/baseline-direct.json \
  --traces public/projects/loopformer/data/baseline-traces.json \
  --responses public/projects/loopformer/data/baseline-trace-responses.json \
  --output public/projects/loopformer/data/baseline-comparison.json
```

It checks raw-response final accuracy against every audited outcome column, graph
hashes and type populations, source/audit identities, structural bin membership,
and actual reference-letter distributions against the direct-answer export.
Structural intervals use whole-graph bootstrap resampling within seed/type/bin
strata, with the existing seed/repeat count. They describe each model separately;
they are not paired-difference confidence intervals.

## Figures

1. **Quality by requested count:** all three models appear together by default,
   showing returned-final-letter accuracy. Metric selection exposes five trace
   metrics with both trace arms together. Direct-answer trace values are N/A,
   explicitly labelled, never drawn at zero. Pointwise Wilson intervals are on
   hover. Graph-type/range selectors preserve simultaneous model comparison.
   Smoothed is the default: a centered, query-weighted moving mean over five
   requested counts, adjustable to odd windows from 3–31. Compute on all 256
   counts before cropping so changing the visible range preserves shared values;
   windows truncate only at panel edges. Raw restores exact per-count curves.
   Smoothing can blend trained/held-out counts; the caption makes this explicit.
   Hover keeps raw hits, denominator and raw Wilson intervals, separately labels
   the smoothed rate and contributing count range, and assigns no CI to smoothing.
2. **Stopping/lengths:** grouped bars compare both trace arms, with one common
   requested count. There is no model switch. Direct-answer termination is N/A.
   Exact/early/late require EOS; malformed takes precedence over token-cap failure.
   Length bins isolate N−2 through N+2, pool more distant tails, and keep malformed
   output separate. Hover lists observed lengths/counts inside each bin. The bins
   partition every query and include the requested count even when unobserved.
3. **Graph structure:** all three models in grouped bars for returned final-letter
   accuracy; choose graph type, within-type cycle length/transient/orbit bins,
   and a common request range. Empty bins are N/A, with shared graph denominators.
4. **Returned letters:** all three models in grouped bars, with one actual-target
   reference line. All queries, including malformed/invalid outputs, remain in
   the denominator. Trace bars show the last parsed state, not intermediate states.
5. **SFT learning curve:** only SFT has a training run. Existing training and
   validation colors, linear default, smoothing/raw and log controls are retained.
   Response-token CE includes EOS and is teacher forced.

Colors follow metric families throughout the article: execution quality uses
blue/cyan/navy, stopping uses red/coral, structure uses grays, and returned-letter
distributions use orange/purple/teal. Exact/strict/joint selections in the quality
panel switch to the stopping family. Legends update with the plot. Models retain
distinct names, dashes/markers, and bar patterns; no model palette is shared
across different metric families. See [the palette guide](loopformer-chart-palette.md).

Full SFT succeeds strictly on 12,150/12,150 trained-count queries, 6/4,050 held-out
7/9/11 queries, and 0/329,400 beyond 12. At N=11 all first 11 states are correct,
but every response emits 12 states. Original trace prompting yields 45 strict
successes versus 26,698 correct last letters. Overall returned-letter accuracies
are 6.25%, 7.73%, and 23.99% (direct, original trace, SFT).

Direct answer uses FP32/eight tokens; both trace arms use BF16/SDPA/272 tokens.
Trace native checks match scored outcomes on 54 queries, not every continuation.
Full SFT versus recurrence is neither capacity- nor compute-matched; the final
recurrent controller also saw separate numeric labels through 63. No recurrent
loop-cost interpretation is assigned to generated text states.

## Verification

Check exporter integrity/denominators, histogram partition totals, JavaScript
syntax, local links and unique IDs, all chart loads, metric/group/range changes,
mobile figure sizing and browser errors. Keep both trace arms visible in stopping
and length views, all three models in comparable figures, and no invented data for
undefined metrics. Source tables and downloads remain available without JavaScript.

Verified on 2026-10-11: both exporters passed integrity and denominator checks;
all first-error and emitted-length bins partition their query populations.
JavaScript syntax, unique IDs, local links/assets, and whitespace checks passed.
All 20 article charts rendered without browser warnings/errors. Shared metric,
graph-type/range, stopping/length, and empty-bin controls were exercised; baseline
figures and the first-error histogram also fit a 390-pixel mobile viewport.
