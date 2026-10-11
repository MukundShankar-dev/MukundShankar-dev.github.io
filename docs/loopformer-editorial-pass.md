# Article completion and editorial pass

The article now has a two-paragraph TL;DR, a baseline Analysis subsection,
completed analyses for Architectures 2/3a/3b/4/5, and Takeaways plus What Next.
The author's existing Architecture 1 analysis is mostly retained, with narrower
interpretation of chance/randomness and a transition into learned stopping.
Interpretive closing paragraphs previously in Results are moved into the new
analyses to avoid repeating the same conclusion. The introduction is unchanged.

The new prose follows the project sequence: familiar-length success; stopping
and execution failing separately; fixed prompt memory; longer training moving
the failure boundary; isolated executor and GRU; final task-specific timer.
Counts, graph horizons, numerical controller exposure and finite benchmark scope
remain distinct. Proposed ablations, larger state spaces, terminal repair,
transfer and matched latency measurements are future work, not completed results.

The TL;DR's 96.89% complete trajectories, 97.78% final answers at N=256 and exact
stopping across all 256 requested counts were checked against attempt-5-eval.json.
The ordinary baseline conclusion now refers to unreliable stopping at unfamiliar
counts, not proof about abstract understanding. Architecture 3b no longer implies
unchanged effective updates: effective batch dropped from eight to four and the
one-epoch update count doubled. Minor spelling/grammar fixes are local.

Count-sensitivity and numerical-controller diagnostics now have short entries in
Metrics, matching existing plotted families. Existing figures, tables, scripts,
colors, downloads, animations and demo links are unchanged. All empty Analysis,
TL;DR and Takeaways placeholders are filled; the intentionally hidden training
accuracy figure remains hidden.

Validation: all figure/table/script HTML matches before the edit, new headline
metrics agree with saved data, IDs/label references/internal anchors and local
links are valid. Browser layout and rendering are checked after installation.

Browser validation: all 68 charts still render with no error states or console
warnings. All seven Analysis headings have prose. The TL;DR has exactly two
paragraphs. Visually checked the opening, Takeaways and What Next, including the
new navigation anchor. Whitespace checks pass.
