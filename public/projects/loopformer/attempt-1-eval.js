/* First-attempt evaluation: audited measured values, never browser inference. */
(() => {
  "use strict";
  if (!document.getElementById("a1-quality-plot")) return;
  const byId = id => document.getElementById(id);
  const palette = getComputedStyle(document.documentElement);
  const paletteColor = name => palette.getPropertyValue(`--plot-${name}`).trim();

  const names = { random_function: "Random functions", permutation: "Permutations", full_cycle: "Full 26-state cycles" };
  const paper = "#fffefa";
  const options = { responsive: true, displayModeBar: false, displaylogo: false, scrollZoom: false };
  const axis = { gridcolor: "#eee9e2", zeroline: false, linecolor: "#d7d1c8" };
  const layout = {
    autosize: true, paper_bgcolor: paper, plot_bgcolor: paper, showlegend: false,
    font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', size: 11, color: "#292c33" },
    margin: { l: 55, r: 16, t: 20, b: 48 }, hovermode: "closest", dragmode: "zoom",
    hoverlabel: { bgcolor: paper, bordercolor: "#d7d1c8", font: { size: 11 } },
  };
  const percentAxis = title => ({ ...axis, title: { text: title, standoff: 8 }, range: [0, 1.02], tickformat: ".0%", dtick: .2 });
  const xaxis = (title, max) => ({ ...axis, title: { text: title, standoff: 12 }, range: [.5, max + .5],
    tickvals: max === 256 ? [1, 64, 128, 192, 256] : max === 32 ? [1, 6, 12, 20, 32] : max === 12 ? [1, 3, 6, 9, 12] : [1, 2, 3, 4, 5, 6] });
  const boundary = {
    shapes: [{ type: "line", xref: "x", yref: "paper", x0: 6, x1: 6, y0: 0, y1: 1,
      line: { color: "#aaa195", width: 1, dash: "dot" }, layer: "below" }],
    annotations: [{ x: 6, y: 1.04, xref: "x", yref: "paper", text: "Training limit · 6", showarrow: false,
      xanchor: "left", xshift: 4, font: { size: 10, color: "#746b61" } }],
  };
  const nformat = n => n.toLocaleString("en-US");
  const pct = n => `${(100 * n).toFixed(2)}%`;

  function line(points, color, name, xkey, ykey, custom, hover) {
    return { type: "scatter", mode: "lines", x: points.map(p => p[xkey]), y: points.map(p => p[ykey]),
      name, line: { color, width: 2 }, connectgaps: false, customdata: points.map(custom), hovertemplate: hover + "<extra></extra>" };
  }
  function band(points, xkey, low, high, color) {
    return [{ type: "scatter", mode: "lines", x: points.map(p => p[xkey]), y: points.map(p => p[low]),
      line: { width: 0 }, hoverinfo: "skip" },
    { type: "scatter", mode: "lines", x: points.map(p => p[xkey]), y: points.map(p => p[high]),
      line: { width: 0 }, fill: "tonexty", fillcolor: color, hoverinfo: "skip" }];
  }
  function legend(id, series) {
    const parent = byId(id);
    parent.replaceChildren(...series.map(([name, color]) => {
      const item = document.createElement("span"), swatch = document.createElement("i");
      swatch.style.backgroundColor = color; swatch.setAttribute("aria-hidden", "true");
      item.append(swatch, document.createTextNode(name)); return item;
    }));
  }
  function fail(plot, controls, error) {
    console.error("First-attempt evaluation:", error);
    controls.forEach(c => { c.disabled = true; });
    const status = plot.closest("figure").querySelector(".chart-status");
    status.hidden = false;
    status.textContent = "Interactive chart unavailable. Summary measurements and downloadable data remain below.";
  }
  async function attach(id, ids, draw) {
    const plot = byId(id), controls = ids.map(byId);
    try {
      await draw(plot);
      plot.closest("figure").querySelector(".chart-status").hidden = true;
      controls.forEach(control => {
        control.disabled = false;
        control.addEventListener(control.tagName === "BUTTON" ? "click" : "change", () => draw(plot).catch(e => fail(plot, controls, e)));
      });
    } catch (error) { fail(plot, controls, error); }
  }

  async function start() {
    if (!window.Plotly) throw new Error("Plotly unavailable");
    const response = await fetch("./data/attempt-1-eval.json");
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);
    const data = await response.json();
    if (data.schema_version !== 1 || data.model !== "ce_full" || data.graphs !== 1350 ||
        Object.values(data.quality).some(p => p.length !== 256) ||
        [6, 12, 32, 256].some(n => data.fixed[n]?.loops.length !== n)) throw new Error("Unexpected evaluation schema");

    await attach("a1-quality-plot", ["a1-quality-range", "a1-quality-ci", "a1-quality-reset"], async plot => {
      const specs = [["nominal_final_correct", "Final-answer accuracy", paletteColor("accuracy-answer"), paletteColor("accuracy-answer-band")],
        ["complete_trajectory", "Complete trajectory", paletteColor("accuracy-trajectory"), paletteColor("accuracy-trajectory-band")]];
      const traces = [];
      for (const [key, name, color, fill] of specs) {
        const points = data.quality[key];
        if (byId("a1-quality-ci").checked) traces.push(...band(points, "depth", "low", "high", fill));
        traces.push(line(points, color, name, "depth", "rate", p => [p.correct, p.graphs, p.low, p.high],
          `${name}<br>Requested steps: %{x}<br>%{y:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d}` +
          "<br>95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}"));
      }
      legend("a1-quality-legend", specs.map(s => [s[1], s[2]]));
      await Plotly.react(plot, traces, { ...layout, ...boundary,
        xaxis: xaxis("Requested steps (N)", Number(byId("a1-quality-range").value)), yaxis: percentAxis("Graphs correct") }, options);
    });

    await window.renderLoopformerDiagnostics(data, "a1");
  }
  start().catch(error => {
    for (const id of ["a1-quality-plot", "a1-survival-plot", "a1-errors-plot", "a1-structure-plot"]) {
      const plot = byId(id);
      fail(plot, Array.from(plot.closest("figure").querySelectorAll("select, input, button")), error);
    }
  });
})();
