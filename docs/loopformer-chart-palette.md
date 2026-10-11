# LoopFormer chart palette

A family is the quantity being plotted, not the model or article section.
`chart-palette.css` owns every series color. Reuse a family's colors wherever it
appears, including ordinary baselines and recurrent architectures. No series
color belongs to two families. Neutral text, grids and reference annotations are
not data series. Training curves remain unchanged.

| Family | Reserved colors |
| --- | --- |
| Training losses | Train beige `#ac885a`; validation brown `#634b3d` |
| Execution/answer accuracy | Blue `#2f609f`; cyan-blue `#138caf`; navy `#142e57` |
| Stopping and answer-plus-exact-stop outcomes | Red `#bd3038`; coral `#f2785b`; burgundy `#77212a` |
| First-error location / intact prefixes | Forest `#407d3a`; olive `#839a32` |
| Error taxonomy, recovery, decoded edges, wrong stretches | Rose `#a34469`; light pink `#d49bac` |
| Graph-structure breakdowns | Graphite `#54545a`; gray `#9a9aa1`; charcoal `#222225` |
| Returned-letter distributions | Orange `#d15c22`; purple `#7850a1`; teal `#007f73`; target reference lavender `#bfa7d4` |

Within execution plots, recurrent final-answer/complete-path curves keep their
blue/cyan assignments. The baseline model comparison uses navy/blue/cyan for
direct/prompted/SFT. Stopping comparisons use the stopping palette; baseline
exact/strict/joint metric choices switch that plot to the stopping family.
Graph-structure baseline bars use charcoal/gray/graphite. Returned-letter bars
alone keep the orange/purple/teal palette. Every chart supplies its own legend.

Baseline model identity is additionally preserved through dotted/dashed/solid
lines, square/circle/diamond markers and dotted/hatched/plain bars. Model names
stay explicit; colors do not remain fixed across different metric families.

Confidence fills use their series hue with transparency. The Architecture 2
requested-versus-actual-stop matrix uses the stopping red as its intensity scale,
with a percentage colorbar. Zero cells use the neutral paper background. Family
colors carry chart context, while percentages and labels carry the result.

Verification: no hex series color is assigned across families. Browser checks
confirmed baseline legend colors in all four families and the exact-stop metric
switch. All 26 article charts rendered without error states or console warnings.
