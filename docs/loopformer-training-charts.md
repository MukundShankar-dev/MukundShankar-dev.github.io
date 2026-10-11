# LoopFormer training charts

The journal's training section displays raw/smoothed training CE with trained-depth
validation CE, using a linear y-axis by default with an optional logarithmic view.
The complete-trajectory figure for depths 1–6, 7 and 8 is retained in the inert
`deferred-training-accuracy` HTML template for the later results section. To restore
it, move its figure out of the template; the script initializes it when present. No backend, W&B account or model inference is required.

## Sources and regeneration

Source run: `depth6-fresh30k-seed37-batch4` in the LoopFormer repository.
The exported JSON contains 3,750 optimizer updates, 16 validation checkpoints,
configuration, definitions and SHA-256 hashes of the original source files.

From this website repository:

```bash
python3 scripts/export-loopformer-training.py \
  --run /path/to/loopformer/models/stage1_pointer/depth6-fresh30k-seed37-batch4
```

The exporter uses only the Python standard library. It checks the fixed 256-example
validation cohort and all intermediate predictions/losses against every saved
validation CSV before writing `public/projects/loopformer/data/attempt-1-training.json`.
The HTML includes the corresponding 16-row validation CE table as a JavaScript-free
fallback; keep that table aligned if deliberately replacing the source run.

## Display semantics

- CE means nominal-loop losses averaged within examples, then over examples.
- Each raw training point is an eight-example update batch, not a full training-set measurement.
- Default smoothing is a trailing example-weighted 50-update mean, with partial
  windows at the start. Exactly two solid curves are shown: beige `#ac885a` for
  training and dark brown `#634b3d` for validation, matching every training figure.
  Colors come from [the shared palette](loopformer-chart-palette.md).
  There is no raw overlay. Raw/Smoothed mode and a 10–500-update slider control the training display; 50 updates remains the default. Validation is never smoothed.
- Accuracy requires all nominal transitions to be correct. The trained-depth cohort
  contains 192 graphs; depths 7 and 8 contain 32 graphs each.
- Checkpoint 3,250 minimizes trained-depth validation CE. Checkpoint 2,500 is the
  retained depth-extension candidate from subsequent development evaluations.
  Neither the 32-example curves nor these charts represent the later population benchmark.
- Hover labels include the actual measurement update, since validation and training
  have different sampling frequencies. No intermediate validation values are invented.

## Assets and preview

The page loads its own `training-charts.css`, `training-charts.js`, JSON and pinned
`vendor/plotly-basic-3.1.0.min.js` (MIT license in the adjacent license file).
Plotly is sourced from <https://cdn.plot.ly/plotly-basic-3.1.0.min.js> and is served
locally with the page; visitors make no third-party chart/data requests.

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
```

Open <http://127.0.0.1:8765/projects/loopformer/#training-loss-title>.
Serve over HTTP; opening the HTML directly as a file may block the JSON fetch.

## Verification

The original export passed all 16 CSV/history cross-checks, fixed-cohort and update
coverage checks, and recomputed checkpoint selection. Browser checks covered hover
values/counts, zoom/reset, smoothing, linear/log scales, curve visibility, and
desktop and 390-pixel-wide layouts. No console warnings or errors were observed.
The interactive curves are SVG line plots, with an HTML measurement table and
downloadable JSON fallback. No training or population-analysis jobs were run.

The smoothing UI now uses an explicit Raw/Smoothed selector and a separate
10–500-update window slider on every loss figure. Larger windows average more
recent update batches; they can hide short-lived spikes. Only the training
trace changes, validation and source data stay untouched, and hover retains
the raw batch loss. Raw mode disables the slider and preserves its setting
for returning to Smoothed.
