/* Frozen source measurements; all smoothing is an explicitly labeled display choice. */
(() => {
  "use strict";
  const palette = getComputedStyle(document.documentElement);
  const paletteColor = name => palette.getPropertyValue(`--plot-${name}`).trim();
  const trainColor = paletteColor("training-train"), validationColor = paletteColor("training-validation");
  const ink = "#292c33";
  const lossPlot = document.getElementById("training-loss-plot");
  const accuracyPlot = document.getElementById("training-accuracy-plot");
  if (!lossPlot) return;
  const figures = [lossPlot, accuracyPlot].filter(Boolean).map(plot => plot.closest(".training-figure"));
  const controls = figures.flatMap(figure => [...figure.querySelectorAll("input, select, button")]);
  const statuses = figures.map(figure => figure.querySelector(".chart-status"));
  controls.forEach(control => { control.disabled = true; });

  function smooth(values, weights, window) {
    let sum = 0, count = 0;
    return values.map((value, i) => {
      sum += value * weights[i]; count += weights[i];
      if (i >= window) {
        sum -= values[i - window] * weights[i - window]; count -= weights[i - window];
      }
      return sum / count;
    });
  }

  function layout(yaxis) {
    return {
      autosize: true, paper_bgcolor: "#fffefa", plot_bgcolor: "#fffefa",
      font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', size: 11, color: ink },
      margin: { l: 57, r: 15, t: 33, b: 48 },
      showlegend: false, hovermode: "x unified", dragmode: "zoom",
      hoverlabel: { bgcolor: "#fffefa", bordercolor: "#d7d1c8", font: { size: 11 } },
      xaxis: { title: { text: "Optimizer update", standoff: 12 }, range: [0, 3750],
        tickvals: [0, 750, 1500, 2250, 3000, 3750], tickformat: ",d",
        gridcolor: "#eee9e2", zeroline: false, linecolor: "#d7d1c8", fixedrange: false },
      yaxis: { ...yaxis, gridcolor: "#eee9e2", zeroline: false, linecolor: "#d7d1c8", fixedrange: false },
      shapes: [2500, 3250].map(x => ({ type: "line", x0: x, x1: x, y0: 0, y1: 1,
        xref: "x", yref: "paper", line: { color: "#b9afa3", width: 1, dash: "dot" }, layer: "below" })),
      annotations: [2500, 3250].map(x => ({ x, y: 1.07, xref: "x", yref: "paper",
        text: x.toLocaleString("en-US"), showarrow: false, font: { size: 10, color: "#746b61" } })),
    };
  }
  const options = { responsive: true, displayModeBar: false, scrollZoom: false, displaylogo: false };

  async function start() {
    if (!window.Plotly) throw new Error("The plotting library did not load.");
    const response = await fetch("./data/attempt-1-training.json");
    if (!response.ok) throw new Error(`Training data request failed (${response.status}).`);
    const data = await response.json();
    if (data.schema_version !== 1 || data.training.steps.length !== 3750 || data.validation.length !== 16) {
      throw new Error("Unexpected training data format.");
    }
    const training = data.training, validation = data.validation;
    const steps = validation.map(row => row.step);
    const windowSelect = document.getElementById("training-smoothing");
    const smoothingWindow = lossPlot.closest(".training-figure").querySelector("[data-smoothing-window]");
    const windowLabel = lossPlot.closest(".training-figure").querySelector("[data-window-label]");
    const scaleSelect = document.getElementById("training-loss-scale");
    const lossTraces = [
      { x: training.steps, y: smooth(training.loss, training.examples, 50), name: "Training · trailing 50 updates",
        type: "scatter", mode: "lines", line: { color: trainColor, width: 2, dash: "solid" }, customdata: training.loss,
        hovertemplate: "Update %{x:,d}<br>Mean CE: %{y:.4g}<br>Raw batch CE: %{customdata:.4g}<extra>Training</extra>" },
      { x: steps, y: validation.map(row => row.trained.loss), name: "Validation · depths 1–6",
        type: "scatter", mode: "lines", line: { color: validationColor, width: 2, dash: "solid" },
        hovertemplate: "Update %{x:,d}<br>CE: %{y:.4g}<br>192 fixed validation examples<extra>Validation · 1–6</extra>" },
    ];
    await Plotly.newPlot(lossPlot, lossTraces, layout({
      title: { text: "Cross-entropy (nats)", standoff: 8 }, type: scaleSelect.value,
      exponentformat: "power", minexponent: 3, showexponent: "all", autorange: true,
    }), options);
    // The accuracy figure is retained in an inert template until the results section is written.
    if (accuracyPlot) {
      const accuracyTraces = [
        ["trained", "Depths 1–6 · trained range", paletteColor("accuracy-answer"), "solid", "circle"],
        ["depth7", "Depth 7 · unseen depth", paletteColor("accuracy-trajectory"), "dash", "diamond"],
        ["depth8", "Depth 8 · unseen depth", paletteColor("accuracy-extra"), "dot", "square"],
      ].map(([key, name, color, dash, symbol]) => ({
        x: steps, y: validation.map(row => row[key].correct / row[key].examples), name,
        customdata: validation.map(row => [row[key].correct, row[key].examples]),
        type: "scatter", mode: "lines+markers", line: { color, width: 2, dash }, marker: { size: 5, symbol },
        hovertemplate: "Update %{x:,d}<br>%{y:.2%} · %{customdata[0]}/%{customdata[1]} complete trajectories<extra>" + name + "</extra>",
      }));
      await Plotly.newPlot(accuracyPlot, accuracyTraces, layout({
        title: { text: "Complete trajectories", standoff: 8 }, range: [0, 1.045], tickformat: ".0%", dtick: .2,
      }), options);
      document.querySelectorAll("[data-accuracy-trace]").forEach(input => {
        input.addEventListener("change", () => Plotly.restyle(accuracyPlot, { visible: input.checked }, [Number(input.dataset.accuracyTrace)]));
      });
      document.getElementById("accuracy-reset").addEventListener("click", () => {
        Plotly.relayout(accuracyPlot, { "xaxis.range": [0, 3750], "yaxis.range": [0, 1.045] });
      });
    }

    function updateSmoothing() {
      const raw = windowSelect.value === "raw";
      const size = raw ? 1 : Number(smoothingWindow.value);
      smoothingWindow.disabled = raw;
      windowLabel.textContent = `${smoothingWindow.value} updates`;
      smoothingWindow.setAttribute("aria-valuetext", `${smoothingWindow.value} updates`);
      Plotly.restyle(lossPlot, { y: [raw ? training.loss : smooth(training.loss, training.examples, size)],
        name: raw ? "Training · raw batches" : `Training · trailing ${size} updates` }, [0]);
      document.getElementById("training-smoothing-note").textContent = raw
        ? "Training shows the raw loss of each 8-example update batch."
        : `Training shows a trailing ${size}-update, example-weighted mean; initial windows use available updates.`;
    }
    windowSelect.addEventListener("change", updateSmoothing);
    smoothingWindow.addEventListener("input", updateSmoothing);
    scaleSelect.addEventListener("change", () => {
      Plotly.relayout(lossPlot, { "yaxis.type": scaleSelect.value, "yaxis.autorange": true });
    });
    document.getElementById("loss-training-visible").addEventListener("change", event => {
      Plotly.restyle(lossPlot, { visible: event.target.checked }, [0]);
    });
    document.getElementById("loss-validation-visible").addEventListener("change", event => {
      Plotly.restyle(lossPlot, { visible: event.target.checked }, [1]);
    });
    document.getElementById("loss-reset").addEventListener("click", () => {
      Plotly.relayout(lossPlot, { "xaxis.range": [0, 3750], "yaxis.autorange": true });
    });
    controls.forEach(control => { control.disabled = false; });
    statuses.forEach(status => { status.hidden = true; });
  }
  start().catch(error => {
    console.error("LoopFormer training charts:", error);
    statuses.forEach(status => {
      status.hidden = false;
      status.textContent = "Interactive chart unavailable. The validation table and downloadable data below are still available.";
    });
  });
})();
