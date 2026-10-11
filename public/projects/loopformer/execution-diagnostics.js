/* Shared forced-execution diagnostics; chart semantics and palettes stay consistent. */
window.renderLoopformerDiagnostics = async function(data, prefix) {
  "use strict";
  const byId = id => document.getElementById(id.replace(/^a1-/, `${prefix}-`));
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
  const nformat = n => n.toLocaleString("en-US");
  const pct = n => `${(100 * n).toFixed(2)}%`;

  function legend(id, series) {
    const parent = byId(id);
    parent.replaceChildren(...series.map(([name, color]) => {
      const item = document.createElement("span"), swatch = document.createElement("i");
      swatch.style.backgroundColor = color; swatch.setAttribute("aria-hidden", "true");
      item.append(swatch, document.createTextNode(name)); return item;
    }));
  }
  function fail(plot, controls, error) {
    console.error("Recurrent execution diagnostics:", error);
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

    await attach("a1-survival-plot", ["a1-survival-request"], async plot => {
      const n = Number(byId("a1-survival-request").value), fixed = data.fixed[n];
      const bins = [[1,6],[7,8],[9,12],[13,16],[17,32],[33,64],[65,128],[129,256]].filter(([low]) => low <= n);
      const points = bins.map(([low, upper]) => {
        const high = Math.min(upper,n);
        return {label:low === high ? `Loop ${low}` : `Loops ${low}–${high}`,
          count:fixed.loops.filter(p => p.loop >= low && p.loop <= high).reduce((sum,p) => sum+p.first_failures,0)};
      });
      points.push({label:`No error through ${n}`,count:data.graphs-fixed.stats.failed_graphs});
      if (points.reduce((sum,p) => sum+p.count,0) !== data.graphs) throw new Error('First-error histogram does not partition the graph panel');
      const colors = points.map((_,i) => paletteColor(i === points.length-1 ? "survival-step" : "survival-prefix"));
      legend("a1-survival-legend", [["First error in this range",paletteColor("survival-prefix")], ["No error through cutoff",paletteColor("survival-step")]]);
      await Plotly.react(plot,[{type:"bar",orientation:"h",y:points.map(p => p.label),x:points.map(p => p.count/data.graphs),
        marker:{color:colors},width:.55,customdata:points.map(p => p.count),
        text:points.map(p => pct(p.count/data.graphs)),textposition:"auto",
        hovertemplate:"%{y}<br>%{x:.2%} · %{customdata:,d} / 1,350 graphs<extra></extra>"}],
        {...layout,dragmode:false,margin:{l:123,r:18,t:12,b:48},
          xaxis:{...axis,title:{text:"Share of all graphs",standoff:12},range:[0,1],tickformat:".0%",fixedrange:true},
          yaxis:{showgrid:false,autorange:"reversed",fixedrange:true}},options);
      byId("a1-survival-note").textContent = `${prefix === "a2" ? "Stopping ignored · " : ""}Steps = ${n} throughout · mean correct prefix: ${fixed.stats.restricted_mean_correct_prefix.toFixed(2)} loops · ` +
        `${nformat(data.graphs-fixed.stats.failed_graphs)} / 1,350 graphs have no error through the cutoff.`;
    });

    await attach("a1-errors-plot", ["a1-errors-request", "a1-errors-view"], async plot => {
      const n = Number(byId("a1-errors-request").value), fixed = data.fixed[n], s = fixed.stats;
      const view = byId("a1-errors-view").value;
      let traces, xlabel, ylabel, note, caption;
      let customLayout = { dragmode: false, margin: { l: 145, r: 16, t: 10, b: 47 } };
      legend("a1-errors-legend", []);
      if (view === "episodes") {
        traces = [["ended", "Ended before cutoff", paletteColor("errors-primary")], ["censored", "Still wrong at cutoff", paletteColor("errors-censored")]].map(([key, name, color]) => ({
          type: "bar", x: fixed.episodes.map(p => p.label), y: fixed.episodes.map(p => p[key]), marker: { color }, name,
          hovertemplate: `${name}<br>Observed duration: %{x} loops<br>%{y:,d} episodes<extra></extra>` }));
        customLayout = { dragmode: false, barmode: "stack" };
        xlabel = "Observed wrong-stretch length (loops)"; ylabel = "Wrong stretches";
        note = `${nformat(s.wrong_episodes)} wrong stretches · ${nformat(s.right_censored_episodes)} still ongoing at loop ${n}.`;
        caption = "A graph can contribute several wrong stretches. Light pink segments are unfinished at the requested cutoff; their eventual lengths are unknown. These are observed durations, not a distribution of completed recovery times.";
        legend("a1-errors-legend", [["Ended before cutoff", paletteColor("errors-primary")], ["Still wrong at cutoff", paletteColor("errors-censored")]]);
      } else {
        let labels, numerators, denominators;
        if (view === "first") {
          labels = ["Repeated previous<br>state", "Another earlier<br>state", "Later reachable<br>state", "Outside the<br>reachable path"];
          numerators = fixed.categories.map(c => c.count); denominators = numerators.map(() => s.failed_graphs);
          note = `${nformat(s.failed_graphs)} failed graphs; each contributes exactly one first error. ${data.graphs - s.failed_graphs} ${data.graphs - s.failed_graphs === 1 ? 'graph has' : 'graphs have'} no error.`;
          caption = "Categories use the same priority as the metrics section: previous state, another earlier state, later reachable state, then outside the start node's path. Percentages are among failed graphs, not all graphs.";
        } else if (view === "recovery") {
          labels = ["Back to the correct<br>reference state", "Wrong, but follows<br>a valid edge", "Other wrong<br>transition"];
          numerators = [s.reference_recoveries, s.wrong_edge_continuations, s.other_wrong_transitions]; denominators = numerators.map(() => s.prior_wrong_transitions);
          note = `${nformat(s.prior_wrong_transitions)} transitions following a wrong prediction · ${pct(s.wrong_loop_fraction)} of all observed loops are wrong.`;
          caption = "Each bar describes the next transition after a wrong decoded letter. Recovery takes precedence; the other two categories remain wrong. Repeated transitions share graphs, so no independent-transition confidence interval is shown.";
        } else {
          const e = fixed.edge_consistency;
          labels = ["After a correct<br>prediction", "After a wrong<br>prediction"];
          numerators = [e.correct_prior, e.wrong_prior]; denominators = [e.correct_exposure, e.wrong_exposure];
          note = `Does the next decoded letter follow an edge from the previous decoded letter? Loops 2–${n}.`;
          caption = "This checks edges between consecutive decoded letters, grouped by whether the preceding letter matched the reference. A valid edge can still lead along the wrong path. The first loop is excluded from this correct/wrong-previous comparison; observations within a graph are correlated.";
        }
        traces = [{ type: "bar", orientation: "h", y: labels,
          x: numerators.map((value, i) => denominators[i] ? value / denominators[i] : null), marker: { color: paletteColor("errors-primary") }, width: .5,
          customdata: numerators.map((value, i) => [value, denominators[i]]),
          text: numerators.map((value, i) => denominators[i] ? pct(value / denominators[i]) : "N/A"), textposition: "auto",
          hovertemplate: "%{y}<br>%{x:.2%}<br>%{customdata[0]:,d} / %{customdata[1]:,d}<extra></extra>" }];
        xlabel = view === "first" ? "Share of first errors" : view === "edges" ? "Valid decoded transitions" : "Share of transitions after an error";
      }
      const barAxes = view === "episodes" ? {
        xaxis: { ...axis, title: { text: xlabel, standoff: 12 }, type: "category", fixedrange: true },
        yaxis: { ...axis, title: { text: ylabel, standoff: 8 }, rangemode: "tozero", fixedrange: true } } : {
        xaxis: { ...axis, title: { text: xlabel, standoff: 12 }, range: [0, 1], tickformat: ".0%", fixedrange: true },
        yaxis: { ...axis, showgrid: false, autorange: "reversed", fixedrange: true } };
      await Plotly.react(plot, traces, { ...layout, ...customLayout, ...barAxes }, options);
      byId("a1-errors-note").textContent = (prefix === "a2" ? "Stopping ignored · " : "") + note;
      byId("a1-errors-caption").textContent = (prefix === "a2" ? "These are forced rollouts through N, including predictions after the head would stop. " : "") + caption;
    });

    await attach("a1-structure-plot", ["a1-structure-request", "a1-structure-field", "a1-structure-mode", "a1-structure-metric"], async plot => {
      const n = byId("a1-structure-request").value, field = byId("a1-structure-field").value;
      const split = !["graph_mode", "dataset_seed"].includes(field);
      byId("a1-structure-mode-label").hidden = !split;
      const mode = split ? byId("a1-structure-mode").value : "all", metric = byId("a1-structure-metric").value;
      const cells = data.structure[n][field][mode], points = cells.map(c => ({ ...c, ...c.metrics[metric] }));
      const label = c => field === "graph_mode" ? names[c.label] : c.label;
      const max = Math.min(1, Math.max(.05, Math.ceil(Math.max(...points.map(p => p.high ?? 0)) * 1.15 * 20) / 20));
      const height = points.length > 3 ? 325 : 265;
      plot.style.height = `${height}px`;
      const color = metric === "complete_trajectory" ? paletteColor("structure-trajectory") : paletteColor("structure-answer");
      await Plotly.react(plot, [{ type: "bar", orientation: "h", y: points.map(label), x: points.map(p => p.rate),
        width: .45, marker: { color }, error_x: { type: "data", symmetric: false, thickness: 1, width: 4, color: paletteColor("structure-trajectory"),
          array: points.map(p => p.graphs ? p.high - p.rate : 0), arrayminus: points.map(p => p.graphs ? p.rate - p.low : 0) },
        customdata: points.map(p => [p.correct, p.graphs, p.low, p.high]),
        hovertemplate: "%{y}<br>%{x:.2%} · %{customdata[0]} / %{customdata[1]} graphs<br>95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}<extra></extra>",
      }], { ...layout, height, dragmode: false, margin: { l: 122, r: 60, t: 12, b: 48 },
        annotations: points.map((p, i) => ({ x: p.high ?? 0, y: i, xref: "x", yref: "y", showarrow: false,
          text: p.graphs ? pct(p.rate) : "N/A", xanchor: "left", xshift: 6, font: { size: 11 } })),
        xaxis: { ...axis, title: { text: metric === "complete_trajectory" ? "Complete trajectory accuracy" : "Final-answer accuracy", standoff: 12 },
          range: [0, max], tickformat: ".0%", fixedrange: true },
        yaxis: { ...axis, autorange: "reversed", fixedrange: true, showgrid: false, tickvals: points.map(label),
          ticktext: points.map(p => `${field === "graph_mode" ? label(p).replace("Full 26-state cycles", "Full cycles").replace("Random functions", "Random functions") : label(p)}<br>${p.graphs} graphs`) },
      }, options);
      byId("a1-structure-note").textContent = `${prefix === "a2" ? "Stopping ignored · " : ""}Fixed Steps = ${n} · ${split ? names[mode] + " · 450" : "all 1,350"} graphs · one query per graph.`;
    });
};
