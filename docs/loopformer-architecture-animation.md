# First-architecture animation

The native SVG/CSS/JavaScript figure in `public/projects/loopformer/index.html`
sits after the first architecture explanation and before Training. It introduces
P once, shared R across three loops, full-sequence hidden-state feedback, and
C/readout at the final exit in the conceptual inference flow. Only rank-8 q/v LoRA in R is trainable. Original weights,
embeddings, final normalization and LM head stay frozen. The normalization and
head are compressed into one labeled output arrow; readout selects the answer
position and the 26 letter tokens.

## Scientific scope

The three-loop execution and final D readout are an explicitly labeled ideal illustration, not
checkpoint predictions. Grid colors are schematic, not activations. The prompt
is an excerpt of a 26-rule input. No generated letter or C output returns to R.
The loop budget is external; this architecture has no learned stopping. The
animation shows conceptual inference; the caption separately explains that the
implementation reads through C every loop for intermediate supervision and
measurement, including per-loop losses and backpropagation through frozen C and
preceding R loops. No model inference or training is invoked.

Ground truth: `scripts/recurrent_qwen/model.py` in the loopformer repository,
particularly initialization and the recurrent forward loop; its canonical
`docs/architecture.md` and `docs/pointer_model_evolution.md` explain the initial
full-sequence configuration.

## Interaction and accessibility

The animation starts paused. Play runs one finite eight-phase sequence. Pause,
Next step, Restart, and direct loop buttons work with the keyboard. It pauses
when offscreen or when the browser tab is hidden. Reduced-motion preferences
remove moving strokes and color transitions; the diagram and manual controls
remain available. SVG descriptions and manual-step announcements explain the
flow to assistive technology. Without JavaScript, the SVG and caption remain
visible and the inactive controls stay hidden. Wide and narrow SVG layouts
preserve labels on phones rather than shrinking the horizontal diagram.

## Visual references

- [Jay Alammar, The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/): compact tensor glyphs and separated processing blocks.
- [Georgia Tech, Transformer Explainer](https://poloclub.github.io/transformer-explainer/): inspectable computation flow.

The figure is original native markup for this model; no reference artwork or
third-party animation library is copied. Attribution links are also in its
expandable notes. Assets are `architecture-animation.css` and
`architecture-animation.js`, with all selectors scoped to the figure.

## Preview

Serve `public/` and open `/projects/loopformer/#architecture-1-animation`.
