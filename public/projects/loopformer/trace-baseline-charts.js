/* Audited explicit-trace generations. Generated state positions are not loops. */
(() => {
  'use strict';
  const quality = document.getElementById('trace-quality-plot');
  if (!quality) return;
  const stopping = document.getElementById('trace-stopping-plot');
  const select = id => document.getElementById(id);
  const metric = select('trace-quality-metric'), range = select('trace-quality-range'), mode = select('trace-quality-mode');
  const model = select('trace-stopping-model'), count = select('trace-stopping-count'), view = select('trace-stopping-view');
  const names = {all:'All graph types', random_function:'Random functions', permutation:'Permutations', full_cycle:'Full 26-state cycles'};
  const arms = {original:'Original Qwen · traces', sft:'Full SFT · traces'};
  const palette = getComputedStyle(document.documentElement);
  const color = key => palette.getPropertyValue(`--plot-baseline-${key}`).trim();
  const colors = {original:color('primary'), sft:color('comparison')};
  const definitions = {
    strict_success:'Strict success requires all N transitions to be correct, exactly N emitted states, and EOS.',
    stopped_answer_correct:'Returned final-answer accuracy checks the last emitted letter against the N-step answer, even if the trace has the wrong length.',
    nominal_final_correct:'State-at-N accuracy checks the letter at position N. Missing positions and malformed responses fail; extra states may follow.',
    complete_trajectory:'Correct prefix through N requires every one of the first N states to be correct. Extra states may follow; short or malformed responses fail.',
    exact_stop:'Exact termination requires exactly N emitted states and EOS, regardless of whether the transitions are correct.',
    joint_success:'Correct answer + exact stop requires the last letter to be correct, exactly N emitted states, and EOS. Earlier transitions may be wrong.'
  };
  const paper = '#fffefa', axis = {gridcolor:'#eee9e2', zeroline:false};
  const base = {
    autosize:true, paper_bgcolor:paper, plot_bgcolor:paper,
    font:{family:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', size:11, color:'#292c33'},
    margin:{l:54,r:15,t:22,b:49}, showlegend:false,
    hoverlabel:{bgcolor:paper,bordercolor:'#d7d1c8',font:{size:11}}
  };
  const options = {responsive:true,displayModeBar:false,scrollZoom:false,displaylogo:false};
  function fail(target, error) {
    console.error('LoopFormer trace baseline:',error);
    const figure = target.closest('figure');
    figure.querySelectorAll('select, button').forEach(control => { control.disabled = true; });
    const status = figure.querySelector('.chart-status');
    status.hidden = false;
    status.textContent = 'Interactive chart unavailable. Summary measurements and downloadable source data remain available below.';
  }
  async function connect(target, render) {
    try {
      await render();
      target.closest('figure').querySelector('.chart-status').hidden = true;
      target.closest('figure').querySelectorAll('select, button').forEach(control => {
        control.disabled = false;
        control.addEventListener(control.tagName === 'BUTTON' ? 'click' : 'change', () => render().catch(error => fail(target,error)));
      });
    } catch (error) { fail(target,error); }
  }
  async function start() {
    if (!window.Plotly) throw new Error('Plotly unavailable');
    const response = await fetch('./data/baseline-traces.json');
    if (!response.ok) throw new Error(`Chart data request failed (${response.status})`);
    const data = await response.json();
    if (data.schema_version !== 1 || data.graphs !== 1350 || data.requests.length !== 256 ||
        Object.keys(arms).some(arm => Object.keys(names).some(group => {
          const series = data.arms[arm]?.series[group];
          return !series || Object.keys(definitions).some(key => {
            const points = series.metrics[key];
            return !points || points.hits.length !== 256 || points.intervals.length !== 256 ||
              points.hits.some(n => !Number.isInteger(n) || n < 0 || n > series.graphs);
          });
        }))) throw new Error('Incomplete audited trace data');
    await connect(quality, async () => {
      const max = Number(range.value), points = data.requests.slice(0,max);
      const traces = Object.keys(arms).map(arm => {
        const group = data.arms[arm].series[mode.value], values = group.metrics[metric.value];
        return {type:'scatter', mode:'lines+markers', name:arms[arm], x:points,
          y:values.hits.slice(0,max).map(n => n/group.graphs),
          line:{color:colors[arm],width:2,dash:arm === 'original' ? 'dash' : 'solid'},
          marker:{color:colors[arm],size:max <= 32 ? 5 : 2,symbol:arm === 'original' ? 'circle' : 'diamond'},
          customdata:points.map((n,i) => [values.hits[i],group.graphs,...values.intervals[i]]),
          hovertemplate:'%{y:.3%}<br>%{customdata[0]:,d} / %{customdata[1]:,d} queries' +
            '<br>95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}<extra>%{fullData.name}</extra>'};
      });
      await Plotly.react(quality,traces,{...base,hovermode:'x unified',dragmode:'zoom',
        xaxis:{...axis,title:{text:'Requested steps (N)',standoff:12},range:[.5,max+.5],
          tickvals:max === 16 ? [1,4,7,9,11,12,16] : max === 32 ? [1,8,12,16,24,32] : [1,64,128,192,256]},
        yaxis:{...axis,title:{text:'Fraction of queries',standoff:8},tickformat:'.0%',range:[-.025,1.045],dtick:.2},
        shapes:[...[7,9,11].map(n => ({type:'rect',xref:'x',yref:'paper',x0:n-.35,x1:n+.35,y0:0,y1:1,
          fillcolor:'#ebe7e0',opacity:.6,line:{width:0},layer:'below'})),
          {type:'line',xref:'x',yref:'paper',x0:12.5,x1:12.5,y0:0,y1:1,line:{color:'#b9afa3',width:1,dash:'dot'},layer:'below'}]
      },options);
      select('trace-quality-definition').textContent = definitions[metric.value];
      select('trace-quality-note').textContent = `${names[mode.value]} · ${data.arms.sft.series[mode.value].graphs.toLocaleString('en-US')} graphs at each requested count.`;
    });
    await connect(stopping, async () => {
      const n = Number(count.value), diagnostic = data.arms[model.value].diagnostics[n];
      if (!diagnostic || Object.values(diagnostic.termination).reduce((a,b)=>a+b,0) !== data.graphs ||
          diagnostic.lengths.reduce((sum,row)=>sum+row.graphs,0) !== data.graphs) throw new Error('Incomplete termination partition');
      if (view.value === 'termination') {
        const categories = ['exact','early','late','budget','malformed'];
        const labels = ['Exact length','Early stop','Late stop','Token cap','Malformed'];
        const hits = categories.map(key => diagnostic.termination[key]);
        await Plotly.react(stopping,[{type:'bar',orientation:'h',x:hits.map(v=>v/data.graphs),y:labels,
          width:.55,marker:{color:colors[model.value]},customdata:hits,
          hovertemplate:'%{y}<br>%{x:.2%}<br>%{customdata:,d} / 1,350 queries<extra></extra>'}],
        {...base,dragmode:false,hovermode:'closest',margin:{l:86,r:40,t:10,b:49},
          annotations:labels.map((label,i)=>({x:hits[i]/data.graphs,y:label,xref:'x',yref:'y',text:`${(hits[i]/data.graphs*100).toFixed(1)}%`,
            showarrow:false,xanchor:'left',xshift:6,font:{size:11}})),
          xaxis:{...axis,title:{text:'Fraction of queries',standoff:12},range:[0,1.16],tickvals:[0,.25,.5,.75,1],tickformat:'.0%',fixedrange:true},
          yaxis:{showgrid:false,autorange:'reversed',fixedrange:true}},options);
      } else {
        const rows = diagnostic.lengths.map(row=>({...row}));
        if (!rows.some(row=>row.states === n)) rows.push({states:n,graphs:0});
        rows.sort((a,b)=>a.states-b.states);
        const labels = rows.map(row=>row.states ? String(row.states) : 'Malformed');
        const requested = rows.findIndex(row=>row.states === n);
        await Plotly.react(stopping,[{type:'bar',x:labels,y:rows.map(row=>row.graphs/data.graphs),
          marker:{color:colors[model.value]},width:.65,customdata:rows.map(row=>row.graphs),
          hovertemplate:'Emitted states: %{x}<br>%{y:.2%}<br>%{customdata:,d} / 1,350 queries<extra></extra>'}],
        {...base,dragmode:false,hovermode:'closest',margin:{...base.margin,t:34},
          xaxis:{...axis,type:'category',categoryorder:'array',categoryarray:labels,title:{text:'Emitted states (observed lengths)',standoff:12},fixedrange:true},
          yaxis:{...axis,title:{text:'Fraction of queries',standoff:8},range:[0,1.06],tickformat:'.0%',fixedrange:true},
          shapes:[{type:'line',xref:'x',yref:'paper',x0:requested,x1:requested,y0:0,y1:1,line:{color:'#b9afa3',width:1,dash:'dot'}}],
          annotations:[{x:requested,y:1.08,xref:'x',yref:'paper',text:`Requested: ${n}`,showarrow:false,font:{size:10}}]},options);
      }
    });
  }
  start().catch(error => {fail(quality,error);fail(stopping,error);});
})();
