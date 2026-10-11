# Architecture 3b evaluation in the article

The depth-12 fixed-prompt Results subsection uses `fixed12`, checkpoint
`depth12-fixed-prompt-seed47-gaps/step-005000`, selected by the original
trained-count validation CE. Architecture 3a and 3b have the same mechanics;
the new training data, depth/count exposure, precision, batching and update
budget differ. This section does not assign improvement uniquely to one change.
All earlier article prose and the author's Analysis subsection are preserved.

## Reproduction

From the website repository, with NumPy available:

```bash
python scripts/export-loopformer-attempt2-eval.py --model fixed12 \
  --run /path/to/loopformer/eval/pointer_analysis/paper-20261009 \
  --graphs /path/to/loopformer/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --output public/projects/loopformer/data/attempt-3b-eval.json
```

The shared exporter validates frozen checkpoint identity, complete audit/review
hashes, native fidelity, all source chunks and the graph/reference targets.
It recomputes ten outcomes for all 345,600 graph/count queries, checks every
quality rate and Wilson interval, all 256 stop histograms and the shared
first-error/recovery/edge/wrong-stretch diagnostics at N=6/12/32/256. Structure
bins are recomputed from raw graph rules. No source research artifacts, model
weights, training, inference or checkpoint choices change.

Training cohorts are explicit: nine trained requested values 1–6/8/10/12
(12,150 queries), three held-out requested values 7/9/11 (4,050), and genuinely
unseen rollout depths 13–256 (329,400). Intermediate positions 7/9/11 were
supervised inside longer training examples. The trained maximum is twelve,
not six; neither the aggregates nor the chart boundary reuse 3a's cutoff.

## Eight matching plot families

The section retains all eight Architecture 3a families: forced final/trajectory
accuracy, first-error histogram, conditional hazard, errors/recovery/edges/wrong
stretches, graph structure, requested-count sensitivity, exact/joint stopping,
and the requested-versus-actual-stop matrix. The same family colors, confidence
interval controls, diagnostic selectors and downloadable data remain available.

- Quality/timing default to N=1–32, with 1–16 and 1–256 options. Hollow markers
  identify held-out requested values 7/9/11 without introducing new colors.
- Fixed-request error diagnostics default to N=32; structure defaults to N=12.
  The six-step option remains available for direct comparison with earlier runs.
- Conditional hazard defaults to the first twenty loops, with full-rollout and
  N=6/12/32/256 selectors. No risk set means undefined, not zero. The training
  boundary is omitted when viewing a rollout shorter than twelve loops.
- Count sensitivity holds the readout at loop fourteen, rather than 3a's loop
  nine, to examine behavior just beyond the new training limit. Every N=14–256
  is independently prompted on the same 1,350 graphs. Paired changes are relative
  to N=14. Marginal counts agree with the audited fixed-request loop records and
  paired losses/gains agree with the marginal accuracy differences. Post-horizon
  padding is never scored.
- The stop matrix defaults to N=12/13/32/256, exactly the rows described in the
  adjacent paragraph. It shows every stop from those rows. To keep columns
  legible, it omits only loops with zero observations across all displayed rows;
  actual loop numbers remain on the axis. Individual counts include held-out
  requests. Percentages use 1,350 graphs per row. This column compaction applies
  only to 3b; earlier matrices retain their full loop range.

## Checked results

Complete paths at N=12/13/14/15/16: 1,260/1,200/845/228/82 of 1,350.
Held-out N=7/9/11: complete paths 1,305/1,292/1,282; exact stops
1,334/1,125/1,196; joint successes 1,300/1,102/1,149.
Trained-count exact/joint totals are 11,743/11,506 of 12,150. All 329,400
queries beyond twelve stop early, with no exact or joint success.

At fixed N=32, mean correct prefix is 12.5437; one complete path remains.
Of 1,349 failed graphs, 750 first repeat the previous state. Recovery is
1,192/23,642 and decoded-edge consistency after wrong predictions 1,019/23,642.
There are 2,481 wrong stretches, 1,289 censored at N. Conditional first-error
risk at loops 12/13/14/15 is 74/1,240, 313/1,166, 535/853 and 239/318.

At fixed executed loop fourteen, N=14 accuracy is 858/1,350 versus 313/1,350
for N=20. Paired changes lose 557 correct letters and gain twelve. Both requests
have two digits, with mapping/start/target unchanged. This demonstrates request
sensitivity on this population but does not identify the internal mechanism.

## Validation

The fixed12 export completes all raw-data/audit checks. HTML checks confirm
matching eight-family coverage, unique IDs and valid labels/references, with
all prose outside the new Results subsection unchanged. JavaScript syntax
checks pass. Browser checks are recorded after installation.

Final verification on 2026-10-11: regenerating Architecture 2 and 3a exports
produces complete JSON equality with their existing data, including all source
hashes. All eight new charts render with no browser warnings/errors. Exercised
full-range quality/count/hazard views, confidence intervals, all four error
views, all five structure groupings and the individual N=7 stopping matrix.
Verified the training boundary is absent for the N=6 hazard view. All eight
plot bounds fit a 390px viewport; visually checked the count plot and six-column
stop matrix. Desktop viewport and defaults restored. IDs, labels, local links,
assets, JS syntax and whitespace checks pass. A shared status sentence now
uses singular grammar when exactly one complete graph remains.
