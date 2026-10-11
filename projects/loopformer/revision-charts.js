/* Original monitoring only. Stop loss is balanced BCE before its 0.1 weight. */
(() => {
  'use strict';
  const figures = [...document.querySelectorAll('[data-revision-loss]')];
  if (!figures.length) return;
  const palette = getComputedStyle(document.documentElement);
  const paletteColor = name => palette.getPropertyValue(`--plot-${name}`).trim();
  const trainColor = paletteColor("training-train"), validationColor = paletteColor("training-validation");
  const definitions = {
    trace: {file:'baseline-traces.json', updates:2250, records:2250, validations:10, examples:16, cohort:'576 examples · trained counts'},
    joint: {file:'attempt-2-training.json', updates:3750, examples:8, cohort:'192 fixed examples · depths 1–6'},
    fixed: {file:'attempt-2-training.json', updates:3750, examples:8, cohort:'192 fixed examples · depths 1–6'},
    fixed12: {file:'attempt-3b-training.json', updates:7500, examples:4, cohort:'288 fixed examples · counts 1–6, 8, 10, 12'},
    executor: {file:'attempt-4-training.json', updates:2250, records:2250, validations:10, examples:16, cohort:'576 queries · trained counts'},
    timer: {file:'attempt-5-training.json', updates:3000, records:301, validations:31, examples:256, sampled:true, cohort:'1,408 queries · seen counts ≤12, excluding 9'},
    controller: {file:'attempt-4-training.json', updates:6000, records:601, validations:61, examples:256, sampled:true, cohort:'1,408 queries · seen counts ≤12, excluding 9'}
  };
  const requests = new Map();
  function load(file) {
    if (!requests.has(file)) requests.set(file, fetch(`./data/${file}`).then(response => {
      if (!response.ok) throw new Error(`Chart data request failed (${response.status})`);
      return response.json();
    }));
    return requests.get(file);
  }
  function smooth(values, weights, size, steps) {
    let sum = 0, total = 0, first = 0;
    return values.map((value, i) => {
      sum += value * weights[i]; total += weights[i];
      while (steps[first] <= steps[i] - size) {
        sum -= values[first] * weights[first]; total -= weights[first]; first++;
      }
      return sum / total;
    });
  }
  async function initialize(figure) {
    const key = figure.dataset.revisionRun, definition = definitions[key];
    if (!definition) throw new Error('Unknown training run');
    const data = await load(definition.file), run = data.runs[key];
    if (!window.Plotly || data.schema_version !== 1 || !run ||
        run.training.steps.length !== (definition.records || definition.updates) || run.validation.length !== (definition.validations || 16)) {
      throw new Error('Plotting library or complete run data unavailable');
    }
    const {training, validation, selected_step: selected} = run;
    const field = figure.dataset.revisionLoss;
    const plot = figure.querySelector('.training-chart');
    const smoothing = figure.querySelector('[data-smoothing]');
    const smoothingWindow = figure.querySelector('[data-smoothing-window]');
    const windowLabel = figure.querySelector('[data-window-label]');
    const scale = figure.querySelector('[data-scale]');
    const controls = [...figure.querySelectorAll('button, select, input')];
    const traces = [
      {x:training.steps, y:smooth(training[field], training.examples, Number(smoothingWindow.value), training.steps), name:'Training',
        customdata:training[field], type:'scatter', mode:'lines', line:{color:trainColor, width:2, dash:'solid'},
        hovertemplate:'Update %{x:,d}<br>Displayed loss: %{y:.4g}<br>Raw batch: %{customdata:.4g}<extra>Training</extra>'},
      {x:validation.map(row=>row.step), y:validation.map(row=>row.trained[field]), name:'Validation',
        type:'scatter', mode:'lines', line:{color:validationColor, width:2, dash:'solid'},
        hovertemplate:`Update %{x:,d}<br>Loss: %{y:.4g}<br>${definition.cohort}<extra>Validation</extra>`}
    ];
    await Plotly.newPlot(plot, traces, {
      autosize:true, paper_bgcolor:'#fffefa', plot_bgcolor:'#fffefa',
      font:{family:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', size:11, color:'#292c33'},
      margin:{l:57,r:15,t:33,b:48}, showlegend:false, hovermode:'x unified', dragmode:'zoom',
      hoverlabel:{bgcolor:'#fffefa',bordercolor:'#d7d1c8',font:{size:11}},
      xaxis:{title:{text:'Optimizer update',standoff:12},range:[0,definition.updates],
        tickvals:Array.from({length:6},(_,i)=>i*definition.updates/5),tickformat:',d',gridcolor:'#eee9e2',zeroline:false},
      yaxis:{title:{text:field==='stop_loss'?'Balanced stop BCE (nats)':field==='state_loss'?'Direct R cross-entropy (nats)':field==='response_loss'?'Response cross-entropy (nats)':'Letter cross-entropy (nats)',standoff:8},
        type:'linear',autorange:true,gridcolor:'#eee9e2',zeroline:false,exponentformat:'power',minexponent:3,showexponent:'all'},
      shapes:[{type:'line',x0:selected,x1:selected,y0:0,y1:1,xref:'x',yref:'paper',
        line:{color:'#b9afa3',width:1,dash:'dot'},layer:'below'}],
      annotations:[{x:selected,y:1.07,xref:'x',yref:'paper',text:`Selected · ${selected.toLocaleString('en-US')}`,
        showarrow:false,xanchor:selected>definition.updates*.9?'right':'center',font:{size:10,color:'#746b61'}}]
    }, {responsive:true,displayModeBar:false,scrollZoom:false,displaylogo:false});
    function updateVisibility() {
      Plotly.restyle(plot,{visible:[figure.querySelector('[data-kind="train"]').checked,
        figure.querySelector('[data-kind="validation"]').checked]});
    }
    figure.querySelectorAll('input[type=checkbox]').forEach(input=>input.addEventListener('change',updateVisibility));
    function updateSmoothing() {
      const raw=smoothing.value==='raw';
      const size=raw?1:Number(smoothingWindow.value);
      smoothingWindow.disabled=raw;
      windowLabel.textContent=`${smoothingWindow.value} updates`;
      smoothingWindow.setAttribute('aria-valuetext',`${smoothingWindow.value} updates`);
      Plotly.restyle(plot,{y:[raw?training[field]:smooth(training[field],training.examples,size,training.steps)]},[0]);
      figure.querySelector('[data-smoothing-note]').textContent=raw
        ? `Training shows raw ${definition.examples}-example ${definition.sampled ? "logged batches (every 10 updates, plus update 1)" : "update batches"}.`
        : `Training shows a trailing ${size}-update, example-weighted mean${definition.sampled ? " of available logged batches" : ""}; initial windows use available ${definition.sampled ? "records" : "updates"}.`;
    }
    smoothing.addEventListener('change',updateSmoothing);
    smoothingWindow.addEventListener('input',updateSmoothing);
    scale.addEventListener('change',()=>Plotly.relayout(plot,{'yaxis.type':scale.value,'yaxis.autorange':true}));
    figure.querySelector('[data-reset]').addEventListener('click',()=>Plotly.relayout(plot,{
      'xaxis.range':[0,definition.updates],'yaxis.autorange':true}));
    controls.forEach(control=>{control.disabled=false;});
    figure.querySelector('.chart-status').hidden=true;
  }
  figures.forEach(figure=>initialize(figure).catch(error=>{
    console.error('LoopFormer training charts:',error);
    const status=figure.querySelector('.chart-status');
    status.hidden=false;
    status.textContent='Interactive chart unavailable. The validation table and downloadable data remain available below.';
  }));
})();
