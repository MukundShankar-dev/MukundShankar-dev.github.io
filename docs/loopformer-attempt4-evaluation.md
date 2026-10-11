# Architecture 4 evaluation in the article

Results use the frozen `gru` representative, `controller-prefix-seed83/best`,
controller update 5,800 with executor update 2,250. This is the later trained
controller described in the article, not the unsuccessful original executor-run
controller. The population remains 1,350 graphs, requests 1–256, threshold 0.5,
and cap 272. No research artifacts, weights, training or inference are changed.

## Reproduction

From the website repository with NumPy:

```bash
python scripts/export-loopformer-attempt2-eval.py --model gru \
  --run /path/to/loopformer/eval/pointer_analysis/paper-20261009 \
  --graphs /path/to/loopformer/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --controller-eval /path/to/loopformer/eval/pointer_diagnostics/controller-prefix-seed83-20261008T224026.497535Z \
  --output public/projects/loopformer/data/attempt-4-eval.json
```

The shared exporter now handles isolated 2D executor traces as well as earlier
3D count-dependent predictions. It checks audit/review/manifest hashes, frozen
identity, raw chunk hashes, exact graph targets, all ten outcome matrices, depth
rates/intervals, stopping histograms and the existing error/structure diagnostics.
The isolated arm additionally requires passing reuse and native-fidelity files.
Direct R readouts come from the same audited chunks; their predictions at C's
first errors are cross-checked against the saved first-error table. Readout
accuracy, prefix success and paired first-error statistics are recomputed.
All provenance hashes are in the output JSON.

Steps and its position/length side channel are excluded from R by PromptRouter
in the research implementation. The executor is count-independent: one executor
trace is reused across requested counts after native fidelity verification.
The flat loop-fourteen chart documents that contract and shared trace, rather
than claiming 243 independent count-variant reruns or learned count invariance.

## Coverage and interpretation

All eight prior families remain: forced quality, first-error timing, conditional
hazard, errors/recovery/edges/wrong stretches, graph strata, count sensitivity,
exact/joint stopping, and actual-stop distributions. A ninth figure compares
C and the new direct R readout, with current-letter and complete-path views.
Metric-family palettes and shared controls remain consistent.

The execution figures default to N=256 (hazard: first 32 loops), because 42
first errors all occur by loop 30 and 1,308/1,350 paths remain correct through
256. Hazard uses a labeled 0–1% scale to make rare errors visible. Structure
still includes all graph-type/seed/cycle/transient/reachable-state options.
At 256 C final accuracy is 1,320/1,350; strict prefix is 1,308. Direct R has
1,320 correct final letters but 1,295 complete prefixes. Its curve uses a labeled
94–100% vertical close-up. Forty graphs fail under both readouts, 36 first fail
at the same loop; C fails on 42 graphs and direct R on 55.

Controller exposure is reported separately from executor exposure. The controller
saw 58 numbers through 63 except 9/17/29/41/53; only min(N,12) rollout positions
were supervised. It scores 8,784/14,850 exact stops on seen short counts and
4,756/63,450 on seen long counts. The held-out group and unseen 64–256 range
have their own aggregates. Numeric exposure is not long-rollout supervision.
Open markers in timing identify controller-held-out values; quality identifies
executor-omitted requested values 7/9/11. Both use a twelve-loop boundary.

The stopping figure retains the distribution family but uses median and
10th–90th percentile whiskers plus requested-loop markers. This is readable
across the GRU's broader stopping range. Default N=12/32/63/256 matches its
paragraph: medians 12/31/77/74 and ranges 10–14/26–36/69–87/66–84. Hover includes
the complete minimum/maximum and counts; every graph has a stop. Percentile
whiskers are not confidence intervals and do not include all observations.
All requests at N=256 stop early. This is distinct from the strong forced result.

At fixed N=256, recovery is 234/7,544 (3.10%), while decoded-edge validity after
a wrong letter is 6,974/7,544 (92.44%). There are 264 wrong stretches, thirty
censored at the cutoff. No first error repeats the previous state; categories
are earlier state 16, later reachable 17, outside orbit nine. These are only
42 failed graphs, not percentages of all graphs. Valid decoded edges do not
mean decoded letters were fed back into R. Routing, capacity, bridge, losses and
graph sampling changed jointly, so this is not a causal ablation of one change.

## Validation

Raw export and metric checks pass. Validation of browser rendering, controls,
mobile layout and earlier-section regression is recorded after installation.

Final checks on 2026-10-11: all 51 article charts render, including all nine
Architecture 4 figures and previous sections, with no warnings/error states.
Exercised both readout metrics, confidence bands, full-range quality/timing/count/
hazard views, all four error views, all five structural groupings and individual
stopping distributions. The 3b exporter output is exactly unchanged, including
source hashes. All nine figures fit a 390px viewport; visually checked stopping
and rare-error hazard on mobile, and readout comparisons on desktop. Restored
default controls and desktop viewport. IDs, labels, local links/assets, JS syntax
and whitespace checks pass. Article prose outside Architecture 4 Results is
unchanged.

## Additional controller and readout diagnostics

Four additional figures retain existing plot families and controls:

- Direct R predictions at each graph's first C error, within N=6/12/32/256.
  At 256: R correct 5, same wrong letter 37, different wrong letters 0; the
  denominator is 42 failed graphs, not the full 1,350.
- Early/exact/late/missing proportions at every requested count, with a signed
  and absolute stopping-error view. Errors are actual stop minus requested stop;
  missing signals are not converted into cap stops.
- Answer-by-timing partition: exact correct/wrong, nonexact correct/wrong, missing.
  At 256 all stops are early; 313 return the requested letter and 1,037 do not.
- Selected GRU development countdown errors and countdown/stop agreement.
  The 128-graph/count validation panel covers requests 1–16 with cap 16; the
  separate 32-graph/count deep panel covers 13–64 with cap 64. Neither is pooled
  into population results. The selected `best` CSV rows are checked against the
  completed summary JSON, including denominators; source hashes are exported.
  Numerical diagnostics retain saved results rather than claiming new inference
  or independent raw-trace verification. Initial error is at t=0; remaining MAE
  averages t=0..N per example, and decrement MAE averages transitions 1..N.
  Diagnostic zero is first predicted remaining <=0.5, starting at t=1. Zero/stop
  agreement requires both crossings and equal first crossing time, which may
  itself be incorrect. This auxiliary readout is not the deployed stop policy.

A checkbox adds strict autonomous success to the existing timing plot. The new
countdown-error family uses violet shades; readout accuracy stays blue and all
stopping outcomes use the shared timing palette. Different metric families
never share series colors. No prior result views are removed.

The exporter recomputes readout partitions and timing partitions from already
verified raw predictions/outcomes and checks residuals against the audited CSV.
All existing export values are retained (only provenance gains new sources).

Additional-diagnostic validation on 2026-10-11: all 55 article charts render,
including all 13 Architecture 4 figures, with no browser errors/warnings. Checked
both countdown panels and views, stop categories/residuals and depth ranges,
readout first-failure request controls, and the strict-success toggle. New charts
fit 390px mobile width; visually checked the first-error and countdown figures.
Existing JSON values are unchanged except expanded provenance. All 256 timing
partitions sum to 1,350; HTML IDs/label references, JS syntax, unique family series
colors and whitespace checks pass. Restored defaults and desktop viewport.

Timing palette clarification: exact stopping is green (#16835f), early is
burgundy (#77212a), late is amber (#df9c24), and missing is slate gray (#7a8793).
The shared exact-stop token changes consistently across architectures. Missing
means no threshold crossing through the 272-loop cap, not a wrong answer or a
late crossing; this full benchmark has no missing stops. The category legend and
caption now state this explicitly. The outcome chart also uses amber for a correct
letter at the wrong time, separating it from coral end-to-end success.

The article now omits the zero-count missing-stop series from both stopping-category
and answer/timing plots, including their legends. Raw exported metrics are retained;
the renderer rejects a nonzero missing count rather than silently hiding outcomes.
Captions state that every graph signaled a stop.
