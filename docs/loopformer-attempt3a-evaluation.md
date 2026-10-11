# Architecture 3a evaluation in the article

The fixed-prompt Results subsection uses `fixed6`, checkpoint
`depth6-fixed-prompt-seed37/step-003250`, selected on trained-depth validation CE.
All 1,350 benchmark graphs and independently prompted counts 1–256 are included.
Architecture, training and the author's Analysis subsection are unchanged.

## Reproduction and evidence

From the website repository, with NumPy available:

```bash
python scripts/export-loopformer-attempt2-eval.py --model fixed6 \
  --run /path/to/loopformer/eval/pointer_analysis/paper-20261009 \
  --graphs /path/to/loopformer/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --output public/projects/loopformer/data/attempt-3a-eval.json
```

The existing exporter now accepts either `joint_full` (default, Architecture 2)
or `fixed6`. It validates the selected checkpoint path and frozen identity,
complete independent audits, source hashes, raw graph traversal and native
fidelity. It recomputes ten outcomes for every one of the 345,600 queries,
checks depth aggregates and Wilson intervals, and retains all 256 stopping
histograms. The shared diagnostic exporter checks first-error, recovery, edge
and wrong-stretch records and reconstructs graph strata. No model inference,
training, checkpoint selection or research-artifact changes occur.

The extra count probe reads executed loop nine from each independently prompted
N=9–256 on the same graphs. It records accuracy, changed letters, lost correct
answers and gained correct answers versus N=9. It checks agreement with the
saved fixed-request per-loop counts and the paired marginal identities. It
never reads padding beyond the requested horizon. This is a descriptive readout
of existing audited raw trajectories; it is not a new confirmation experiment.

## Coverage and story

All six Architecture 2 figure families and all their diagnostic views remain:
forced accuracy, first-error histogram, error/recovery/decoded-edge/wrong-stretch
breakdowns, graph structure, exact/joint stopping, and actual-stop matrix.
Two additional figures make the fixed-memory result interpretable:

- Conditional first-error hazard, with shrinking risk sets, explicit numerator/
  denominator hover, Wilson intervals, and undefined values when no graphs remain.
- Loop-nine accuracy versus requested N, with paired count-change details on
  hover. The close-up covers N=9–32; the full range covers N=9–256.

`attempt-2-eval.js` shares the quality/timing/matrix renderer across both sections;
`execution-diagnostics.js` shares the existing diagnostics across attempts 1, 2,
and 3a. The two additional figures use the existing green first-error and blue
accuracy palettes. They introduce no new family colors and reuse none across
families. The stopping matrix now derives its column range from the whole arm:
1–6 for Architecture 2 and 1–7 for 3a. Its default four rows match the adjacent
paragraph exactly: N=7,8,12,256. Each row totals 1,350 graphs.

Forced complete trajectories at N=7/8/9/10 are 1,242/1,160/775/112 out of 1,350.
At N=32 the mean correct prefix is 7.7652, with four complete paths; at N=256
one complete path remains. These cyclic 26-state graphs do not imply hundreds
of distinct states. Trained-count exact stops are 8,077/8,100 and joint successes
7,914/8,100. Beyond six, eight requests succeed exactly, all at N=7; all other
337,492 requests stop early. No stop occurs beyond seven.

The same-loop probe finds N=9 versus N=32 accuracy of 788 versus 304/1,350,
with 495 paired losses and eleven gains. Steps text, including tokenization and
positions, changes together; this does not localize the internal cause. Fixed
prompt memory and restricted writable state also changed together, so improved
execution cannot be attributed uniquely to one of them. No hidden-state collapse,
general reasoning, latency or new controller-capacity claim is made.

## Verification

Raw export checks pass. Generalizing the exporter reproduces the complete
existing Architecture 2 JSON exactly, including source hashes. HTML checks
confirm unique IDs, valid labels/references and eight Architecture 3a figures;
all other article prose remains unchanged. JavaScript syntax checks pass.

Browser verification on 2026-10-11: all 34 article charts render, including all
eight new figures and all earlier-architecture families, without warnings or
errors. Exercised full-depth views, confidence bands, all error views, every
structural grouping, fixed-request selectors and the individual stopping matrix.
At 390px all eight plot bounds fit; the count-sensitivity plot and seven-column
stop matrix were visually checked. Cell values omit repeated percent signs to
keep mobile columns legible; units remain explicit above the matrix and in the
colorbar/hover. Desktop viewport and default controls restored. Local links,
assets and whitespace checks pass.
