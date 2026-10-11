# Final architecture results in the article

The final Results section (`attempt-5-evaluation`) uses
`controller-shared-number-precision-seed83/best`, with the unchanged executor from
update 2,250. The original Architecture 5 model/training prose and Analysis
placeholder are preserved. All thirteen Architecture 4 figure families remain,
using the same renderer, metric colors and selectors. No inference, training,
selection, publication or research-artifact mutation is involved.

## Reproduction

From the website repository, with NumPy available:

```bash
python scripts/export-loopformer-attempt2-eval.py --model final \
  --run /path/to/loopformer/eval/pointer_analysis/paper-20261009 \
  --graphs /path/to/loopformer/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --numeric-root /path/to/loopformer/eval/pointer_benchmark/shared-number-precision-20261008/numeric \
  --output public/projects/loopformer/data/attempt-5-eval.json
```

All prior export checks apply: completed independent audits, frozen protocol and
checkpoint identities, source hashes, graph reference targets, 345,600 raw
outcomes, per-count tables, stopping histograms, first errors and structural
breakdowns. Final and GRU raw chunks are compared for identical graph order,
C predictions and direct-R predictions across all 272 extracted loops.
The complete forced diagnostic exports also compare equal.

The separately saved controller-only numeric summary must match every frozen
final checkpoint inference-file hash. Reader errors are recomputed from saved
initial memories; first-stop flags are checked against saved stopping times;
all requested integers and summary counts/max errors are checked. Source hashes
are included in the downloadable JSON. No synthetic countdown trajectory or
unsaved decrement error is substituted for an observed diagnostic.

## Results and distinctions

All 256 requested counts stop exactly on every graph. Joint success at N=256 is
1,320/1,350 (97.78%); strict success is 1,308/1,350 (96.89%). Across all requested
counts, joint success is 338,026/345,600 (97.81%); strict success is
335,293/345,600 (97.02%). These overall query rates differ from rates at N=256.

Executor metrics are unchanged from Architecture 4: 42 first errors by loop 30,
1,308 fully correct through 256, first-error R-correct/C-wrong cases 5/42, and
same wrong readouts 37/42. Prior recovery, edge consistency, wrong stretches,
strata, count independence and readout-accuracy views remain available.

The final timing chart defaults to all 256 counts with strict success enabled.
The controller reads only the requested number. Its repeated graph outcomes do
not provide independent timing observations, so exact-stop bands and Wilson
hover intervals are suppressed for this model. Joint/strict success still has
across-graph variation and optional pointwise Wilson intervals.

Actual-stop markers overlap the requested-loop markers and percentile whiskers
collapse; the text explicitly explains this. Early/late are zero, missing is
omitted because its count is zero, and the signed/absolute error curves coincide
at zero. The outcome partition has only exact+correct and exact+wrong nonzero.
The existing shared guard rejects unrepresented missing outcomes.

## Final countdown diagnostic

The GRU development-readout panel is replaced by the final controller's available
numerical diagnostic in the same figure family. Two views:

- Initial number-reading absolute error, every integer 1–10,000, maximum
  0.001953125 steps. Violet numeric-diagnostic palette.
- First-stop residual, every integer 1–8,192, identically zero. Green timing palette.

The selector also supports viewing only 1–256. This is one numerical observation
per integer, with no executor operation or pointer correctness measurement.
The original diagnostic ran through loop 8,208 (rollout maximum plus 16).
The plot does not imply graph quality through 8,192, arbitrary integer counting,
or a causal explanation for the executor improvement. Unlike the GRU's auxiliary
probe, the scalar initializer is part of this controller's actual state.

## Validation

The raw-data exporter passes all checks. The final export's forced diagnostics,
structure, count probe, readout curves and first-error readout partitions exactly
match Architecture 4. Browser controls, responsive rendering and previous-section
regression are checked after installation.

Final checks: all 68 article charts render, including all thirteen new final-model
figures, with no browser errors or warnings. Numeric views/ranges, optional timing
bands, stopping residuals, individual stopping requests, readout metrics, recovery
and structural selectors were exercised. All thirteen final plots fit the 390px
viewport; the numerical figure was visually checked on mobile, and the final
summary/timing/numerical figures on desktop. Defaults and desktop viewport were
restored. Re-exported GRU and fixed12 JSON exactly match their previous files.
HTML IDs, label/description references, local assets, JS syntax and whitespace
checks pass. All prose outside the new Results section remains unchanged.
