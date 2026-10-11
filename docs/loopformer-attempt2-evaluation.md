# Architecture 2 evaluation in the article

The Results subsection of `public/projects/loopformer/index.html` describes the
joint full-sequence completion model at update 3,250. The author's Analysis
subsection remains empty. The comparison to Architecture 1 explicitly identifies
its different selected update (2,500); it does not establish a causal effect of
stop-loss training. No model inference, checkpoint selection, or training occurs.

## Evidence and reproduction

Source: `eval/pointer_analysis/paper-20261009/` in the research repository.
Checkpoint: `depth6-completion-seed37/step-003250`, selected by trained-depth
letter-validation CE. All 1,350 graphs and requests 1–256 are included.

```bash
python scripts/export-loopformer-attempt2-eval.py \
  --run /path/to/loopformer/eval/pointer_analysis/paper-20261009 \
  --graphs /path/to/loopformer/data/pointer/benchmark-seeds307-311-313/graphs.jsonl \
  --output public/projects/loopformer/data/attempt-2-eval.json
```

The exporter requires NumPy. It checks passed audits and completed-review hashes,
the plot manifest's input hashes, graph/protocol identities, checkpoint freeze,
and native-fidelity/unchanged-weight status. It hashes every joint-model raw
chunk against the reference audit, independently executes each rule table, and
recomputes all ten binary outcomes from predictions and first-stop indices for
345,600 queries. It checks the depth CSV rates and Wilson intervals and verifies
that every stopping histogram contains exactly 1,350 graphs. Source hashes are
included in the JSON. No source artifacts are modified.

## Six Plotly figures

- **Can it still follow the path?** Forced final-answer and complete-trajectory
  accuracy. Same blue accuracy family as Architecture 1. Stop decisions are
  ignored; each N is a separately prompted rollout.
- **When does it first lose the path?** Fixed-request first-error histogram with
  a separate no-error bar, mean correct prefix, and N=6/12/32/256 selectors.
- **What happens when it loses track?** The same first-error taxonomy, recovery,
  decoded-edge and censored wrong-stretch views as Architecture 1.
- **Which graphs does it struggle with?** Graph-type, generation-seed and within-type
  cycle/transient/reachable-state views, with final-answer/complete-path metrics,
  per-bin counts, Wilson intervals and N/A for empty bins.
- **Does it know when to stop?** Exact stopping and correct answer + exact stop.
  Fixed first probability ≥0.5 and count-independent 272-loop cap. Neither
  cap fallback nor a correct letter at a wrong loop counts as exact success.
  Joint success permits earlier errors; strict success is separately exported.
- **What does it do with a larger request?** Requested-versus-actual-stop matrix.
  The default shows all four requests discussed in the adjacent paragraph:
  7, 8, 12 and 256. Each row has 1,350 graphs and sums to 100%; columns show
  actual stop loops 1–6, containing every observed stop. Individual N=6/7/8/12/
  32/256 views remain available. Dashes mean zero observations. This is timing,
  distinct from the separate first-error plot. The paragraph and default matrix
  now cover identical requested counts, rather than requiring a selector change.

Line charts offer ranges 1–16, 1–32 and 1–256, reset zoom, exact counts and
pointwise Wilson intervals in hover and optional bands. Lines are unsmoothed. The stopping family
uses red/coral; legends identify the meaning in each figure. The semantic HTML
summary and table remain available without JavaScript.

## Key checked measurements

- Counts 1–6: forced final accuracy 7,926/8,100 = 97.85%; exact stop
  7,978/8,100 = 98.49%; joint success 7,814/8,100 = 96.47%.
- Forced complete paths at N=6/7/8/12: 1,254/949/372/5 out of 1,350.
- All 337,500 requests beyond six stop early; exact/joint success is zero.
- N=7: 1,262 stop at five, 88 at six. N=8: all stop at five.
- N=12: 1,314 stop at three, 36 at four. Every stop on the full panel is in 1–6.

This documents finite, already-opened graph/count results. It does not identify
memory loss, gradient interference or a particular internal mechanism as the
cause of failure.

## Verification

On 2026-10-11 the export completed all raw-query and histogram checks. JavaScript
syntax, HTML IDs/labels, local assets/links and whitespace checks passed. All
three figures rendered without browser warnings/errors; both full-depth views
and N=6/256 stopping controls were exercised. The three figure bounds fit a
390-pixel viewport, and the mobile execution plot was visually checked.

## Expanded execution coverage

Architecture 2 retains every diagnostic family from Architecture 1 and adds
stopping. All execution diagnostics explicitly ignore stopping and score the
observed first N predictions. `loopformer_eval_diagnostics.py` shares the export
checks; `execution-diagnostics.js` shares the three diagnostic figures across
both attempts. Refactoring the Architecture 1 exporter reproduced exactly the
existing JSON, including every nested value and source hash.

Fixed-request raw predictions are checked against saved first-error, per-loop,
recovery, episode and summary tables. Structure features are independently
rebuilt from the graph rules; no empty bin becomes zero. The comparison at N=32
finds a 6.34-loop mean correct prefix versus 8.83, 3.99% conditional recovery versus
4.34%, and a changed first-error mix. Similarity statements are restricted to
these observed descriptive features, not a shared internal failure mechanism.

Expanded-section verification (2026-10-11): all 26 article charts rendered, with
no visible error states or browser warnings. Tested all four error views, an
empty structural bin, confidence bands, the changing N=7/12 stopping titles,
and Architecture 1 recovery controls. Histogram/category/episode denominators,
unique HTML IDs/references, local links/assets and whitespace checks passed.

The family palette is now keyed by metric across baseline and recurrent sections;
there is no baseline-wide model palette. The stop matrix uses red intensity,
matching the stopping family, with numeric cells and a percentage colorbar.

The revised matrix was checked at desktop and 390-pixel width, including the
individual N=6 view and default four-request view. Percentages and denominators
match the exported stop histograms. The local Plotly basic build renders the
matrix with colored rectangles and a scatter hover layer; no new library is
loaded. Source syntax and whitespace checks passed.
