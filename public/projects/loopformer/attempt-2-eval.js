/* Shared Architectures 2 / 3a / 3b / 4 / 5 evaluation; metric families keep their palette. */
(() => {
  'use strict';
  function renderEvaluation(prefix, model, url) {
  const byId = id => document.getElementById(id.replace(/^a2-/, `${prefix}-`));
  if (!byId('a2-quality-plot')) return;
  const palette = getComputedStyle(document.documentElement);
  const color = name => palette.getPropertyValue(`--plot-${name}`).trim();
  const paper = '#fffefa';
  const options = {responsive:true, displayModeBar:false, displaylogo:false, scrollZoom:false};
  const axis = {gridcolor:'#eee9e2', zeroline:false};
  const layout = {autosize:true, paper_bgcolor:paper, plot_bgcolor:paper, showlegend:false,
    font:{family:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', size:11, color:'#292c33'},
    margin:{l:55, r:18, t:30, b:49}, hovermode:'x unified', dragmode:'zoom',
    hoverlabel:{bgcolor:paper, bordercolor:'#d7d1c8', font:{size:11}}};
  const percentAxis = {...axis, title:{text:'Fraction of graphs', standoff:10}, range:[-.025,1.045], tickformat:'.0%', dtick:.2};
  const boundary = limit => ({
    shapes:[{type:'line', xref:'x', yref:'paper', x0:limit, x1:limit, y0:0, y1:1,
      line:{color:'#aaa195', width:1, dash:'dot'}, layer:'below'}],
    annotations:[{x:limit, y:1.06, xref:'x', yref:'paper', text:`Training limit · ${limit}`, showarrow:false,
      xanchor:'left', xshift:4, font:{size:10, color:'#746b61'}}]
  });
  function legend(id, specs) {
    byId(id).replaceChildren(...specs.map(([name, value]) => {
      const item=document.createElement('span'), swatch=document.createElement('i');
      swatch.style.backgroundColor=value; swatch.setAttribute('aria-hidden','true');
      item.append(swatch,document.createTextNode(name)); return item;
    }));
  }
  function fail(plot, error) {
    console.error(`${prefix} evaluation:`, error);
    const figure=plot.closest('figure'), status=figure.querySelector('.chart-status');
    figure.querySelectorAll('select,button,input').forEach(c => {c.disabled=true;});
    status.hidden=false;
    status.textContent='Interactive chart unavailable. Summary measurements and downloadable data remain below.';
  }
  async function attach(id, draw) {
    const plot=byId(id), figure=plot.closest('figure');
    try {
      await draw(plot); figure.querySelector('.chart-status').hidden=true;
      figure.querySelectorAll('select,button,input').forEach(control => {
        control.disabled=false;
        control.addEventListener(control.tagName==='BUTTON'?'click':'change', () => draw(plot).catch(e => fail(plot,e)));
      });
    } catch (error) {fail(plot,error);}
  }
  async function renderAdditional(data) {
    await attach('a2-hazard-plot', async plot => {
      const n=byId('a2-hazard-request').value;
      const rows=data.fixed[n].loops.slice(0,byId('a2-hazard-range').value==='full'?Number(n):Number(byId('a2-hazard-range').value));
      const valid=rows.filter(p=>p.at_risk>0);
      legend('a2-hazard-legend',[['First-error risk among paths still correct',color('survival-prefix')]]);
      await Plotly.react(plot,[{type:'scatter',mode:'lines+markers',name:'Conditional first-error risk',
        x:rows.map(p=>p.loop),y:rows.map(p=>p.hazard),connectgaps:false,
        line:{color:color('survival-prefix'),width:2},marker:{size:5},
        error_y:{type:'data',array:rows.map(p=>p.hazard===null?0:p.hazard_high-p.hazard),
          arrayminus:rows.map(p=>p.hazard===null?0:p.hazard-p.hazard_low),visible:true,thickness:1,width:3},
        customdata:rows.map(p=>[p.first_failures,p.at_risk]),
        hovertemplate:'Loop %{x}<br>%{y:.2%} · %{customdata[0]:,d} first errors / %{customdata[1]:,d} still-correct paths<extra></extra>'}],
        {...layout,...(rows.length>=data.training_max?boundary(data.training_max):{}),xaxis:{...axis,title:{text:'Executed loop',standoff:12},range:[.5,rows.length+.5]},
          yaxis:{...percentAxis,range:data.count_independent_executor?[-.0003,.01]:percentAxis.range,dtick:data.count_independent_executor ? .002 : .2,tickformat:data.count_independent_executor?'.1%':'.0%',title:{text:'Conditional first-error risk',standoff:10}}},options);
      byId('a2-hazard-note').textContent=`Fixed Steps = ${n}; stopping ignored. Risk sets shrink after errors. ${valid.length} of ${rows.length} displayed loops have at least one eligible graph; zero eligible graphs means N/A.`;
    });
    await attach('a2-count-plot', async plot => {
      const max=Number(byId('a2-count-range').value);
      const {loop, reference_request:reference}=data.count_probe;
      const rows=data.count_probe.points.filter(p=>p.request<=max);
      legend('a2-count-legend',[[`Correct letter at loop ${loop}`,color('accuracy-answer')]]);
      await Plotly.react(plot,[{type:'scatter',mode:'lines+markers',name:`Loop-${loop} accuracy`,
        x:rows.map(p=>p.request),y:rows.map(p=>p.rate),
        line:{color:color('accuracy-answer'),width:2},marker:{size:max<=32?5:2},
        customdata:rows.map(p=>[p.correct,p.graphs,p.low,p.high,p.changed,p.lost,p.gained]),
        hovertemplate:`Requested %{x} steps; read at loop ${loop}<br>%{y:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d} graphs<br>95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}<br>Compared with Steps = ${reference}:<br>%{customdata[4]:,d} changed letters · %{customdata[5]:,d} lost correct · %{customdata[6]:,d} gained correct<extra></extra>`}],
        {...layout,xaxis:{...axis,title:{text:`Requested steps (N); readout fixed at loop ${loop}`,standoff:12},range:[loop-.5,max+.5]},
          yaxis:{...percentAxis,title:{text:`Loop-${loop} accuracy`,standoff:10}}},options);
    });
  }
  async function renderReadouts(data) {
    await attach('a2-readout-plot', async plot => {
      const metric=byId('a2-readout-metric').value;
      const specs=[['c','Read through C','accuracy-trajectory'],['r','Direct R readout','accuracy-extra']];
      legend('a2-readout-legend',specs.map(([,name,key])=>[name,color(key)]));
      const traces=specs.map(([key,name,paletteKey],i)=>({type:'scatter',mode:'lines',name,
        x:data.readouts.map(p=>p.depth),y:data.readouts.map(p=>p[`${key}_${metric}`].rate),
        line:{color:color(paletteKey),width:2,dash:i?'dash':'solid'},
        customdata:data.readouts.map(p=>[p[`${key}_${metric}`].correct,p.graphs,p[`${key}_${metric}`].low,p[`${key}_${metric}`].high,p.disagree]),
        hovertemplate:'%{y:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d} graphs<br>95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}<br>Different R/C letters at this loop: %{customdata[4]:,d}<extra>%{fullData.name}</extra>'}));
      await Plotly.react(plot,traces,{...layout,...boundary(data.training_max),
        xaxis:{...axis,title:{text:'Executed loops',standoff:12},range:[.5,256.5],tickvals:[1,64,128,192,256]},
        yaxis:{...percentAxis,range:[.94,1.005],dtick:.01,title:{text:metric==='trajectory'?'Complete trajectory':'Current-letter accuracy',standoff:10}}},options);
    });
  }
  async function drawStopSpread(data, plot, selection) {
    const requests=selection==='examples'?[12,32,63,256]:[Number(selection)];
    const points=requests.map(n=>data.stop_quantiles[n]);
    const y=requests.map((_,i)=>i);
    legend('a2-stops-legend',[['Median stop · whiskers: 10th–90th percentile',color('timing-exact')],['Requested stopping loop',color('timing-joint')]]);
    byId('a2-stops-title').textContent='How long does the controller actually run?';
    byId('a2-stops-subtitle').textContent='Same 1,350 graphs per request · actual first threshold crossing';
    await Plotly.react(plot,[{type:'scatter',mode:'markers',name:'Actual stop',y,x:points.map(p=>p.median),
      marker:{color:color('timing-exact'),size:8},
      error_x:{type:'data',array:points.map(p=>p.p90-p.median),arrayminus:points.map(p=>p.median-p.p10),
        color:color('timing-exact'),thickness:3,width:6},
      customdata:points.map((p,i)=>[requests[i],p.p10,p.p90,p.minimum,p.maximum,p.graphs,p.missing]),
      hovertemplate:'Requested %{customdata[0]}<br>Median stop: %{x}<br>10th–90th percentile: %{customdata[1]}–%{customdata[2]}<br>Full range: %{customdata[3]}–%{customdata[4]}<br>%{customdata[5]:,d} stops; %{customdata[6]} missing<extra></extra>'},
      {type:'scatter',mode:'markers',name:'Requested stop',x:requests,y,marker:{color:color('timing-joint'),size:10,symbol:'diamond-open'},
       hovertemplate:'Requested stop: %{x}<extra></extra>'}],
      {...layout,hovermode:'closest',dragmode:false,margin:{l:65,r:20,t:20,b:55},
       xaxis:{...axis,title:{text:'Actual stopping loop',standoff:12},range:[0,Math.max(...requests,...points.map(p=>p.p90))*1.04]},
       yaxis:{...axis,showgrid:false,range:[requests.length-.5,-.5],tickvals:y,ticktext:requests.map(String),title:{text:'Requested steps',standoff:10}}},options);
    byId('a2-stops-note').textContent=data.graph_invariant_controller?'Every graph stops at the requested loop: median, minimum, maximum and both percentiles coincide. The filled dot and open diamond overlap.':'Whiskers describe variation across graphs, not confidence intervals. Hover for the full observed range; every graph has a recorded stop.';
  }
  async function renderControllerDetails(data) {
    // These displayed partitions omit missing stops only because their count is zero.
    if (data.timing_breakdown.some(p => p.missing !== 0)) throw new Error('Stopping charts require the missing-stop category for this population');
    await attach('a2-readout-errors-plot', async plot => {
      const n=byId('a2-readout-errors-request').value, row=data.first_readouts[n];
      const specs=[['r_correct','R correct','accuracy-trajectory'],['same_wrong','Same wrong letter','accuracy-extra'],['different_wrong','Different wrong letters','accuracy-answer']];
      legend('a2-readout-errors-legend',specs.map(([,name,key])=>[name,color(key)]));
      await Plotly.react(plot,[{type:'bar',orientation:'h',x:specs.map(([key])=>row.failed?row[key]/row.failed:null),
        y:specs.map(([,name])=>name),marker:{color:specs.map(([, ,key])=>color(key))},
        customdata:specs.map(([key])=>[row[key],row.failed]),text:specs.map(([key])=>`${row[key]} / ${row.failed}`),textposition:'auto',
        hovertemplate:'%{y}<br>%{x:.2%} · %{customdata[0]} / %{customdata[1]} failed graphs<extra></extra>'}],
        {...layout,hovermode:'closest',margin:{l:140,r:24,t:16,b:50},
          xaxis:{...percentAxis,title:{text:'Share of graphs with a C error',standoff:12}},
          yaxis:{...axis,showgrid:false,autorange:'reversed'},bargap:.5},options);
      byId('a2-readout-errors-note').textContent=`${row.failed} of ${row.graphs.toLocaleString()} graphs have a C error within ${n} loops. Each is counted once, at its first C error.`;
    });
    await attach('a2-stop-categories-plot', async plot => {
      const max=Number(byId('a2-stop-categories-range').value), residual=byId('a2-stop-categories-view').value==='residual';
      const rows=data.timing_breakdown.slice(0,max);
      const specs=residual?[['signed_mean','Mean signed error','timing-exact'],['absolute_mean','Mean absolute error','timing-extra']]:
        [['early_stop','Early','timing-extra'],['exact_stop','Exact','timing-exact'],['late_stop','Late','timing-muted']];
      legend('a2-stop-categories-legend',specs.map(([,name,key])=>[name,color(key)]));
      const traces=specs.map(([key,name,paletteKey])=>residual?
        {type:'scatter',mode:'lines',name,x:rows.map(p=>p.depth),y:rows.map(p=>p[key]),line:{color:color(paletteKey),width:2,dash:key==='absolute_mean'?'dash':'solid'},
          customdata:rows.map(p=>p.observed),hovertemplate:'%{y:.2f} loops · %{customdata:,d} observed stops<extra>%{fullData.name}</extra>'}:
        {type:'bar',name,x:rows.map(p=>p.depth),y:data.quality[key].slice(0,max).map(p=>p.rate),marker:{color:color(paletteKey)},
          customdata:data.quality[key].slice(0,max).map(p=>[p.correct,p.graphs]),
          hovertemplate:'%{y:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d} graphs<extra>%{fullData.name}</extra>'});
      await Plotly.react(plot,traces,{...layout,barmode:'stack',bargap:0,...boundary(data.training_max),
        xaxis:{...axis,title:{text:'Requested steps (N)',standoff:12},range:[.5,max+.5]},
        yaxis:residual?{...axis,zeroline:true,zerolinecolor:'#aaa195',title:{text:'Stopping error (loops)',standoff:10}}:percentAxis},options);
      byId('a2-stop-categories-note').textContent=residual?'Signed error = actual stop − requested stop; negative means early. Absolute error measures distance irrespective of direction. Missing stops are excluded, never assigned to the cap.':
        'Each requested count uses all 1,350 graphs. Categories sum to 100%; every graph signaled a stop.';
    });
    await attach('a2-outcomes-plot', async plot => {
      const max=Number(byId('a2-outcomes-range').value), rows=data.timing_breakdown.slice(0,max);
      const specs=[['exact_correct','Exact + correct','timing-joint'],['exact_wrong','Exact + wrong','timing-exact'],
        ['nonexact_correct','Wrong time + correct','timing-muted'],['nonexact_wrong','Wrong time + wrong','timing-extra']];
      legend('a2-outcomes-legend',specs.map(([,name,key])=>[name,color(key)]));
      await Plotly.react(plot,specs.map(([key,name,paletteKey])=>({type:'bar',name,x:rows.map(p=>p.depth),y:rows.map(p=>p[key]/p.graphs),
        marker:{color:color(paletteKey)},customdata:rows.map(p=>[p[key],p.graphs]),
        hovertemplate:'%{y:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d} graphs<extra>%{fullData.name}</extra>'})),
        {...layout,barmode:'stack',bargap:0,...boundary(data.training_max),
          xaxis:{...axis,title:{text:'Requested steps (N)',standoff:12},range:[.5,max+.5]},yaxis:percentAxis},options);
    });
    if (data.numeric_controller) await renderNumericController(data);
    if (!data.countdown) return;
    await attach('a2-countdown-plot', async plot => {
      const split=byId('a2-countdown-panel').value, panel=data.countdown.panels[split], rows=panel.points;
      const agreement=byId('a2-countdown-view').value==='agreement';
      const specs=agreement?[['exact_stop','Exact stop','timing-exact'],['remaining_zero_exact','Countdown reaches zero at N','timing-joint'],['remaining_stop_zero_agreement','Stop and countdown agree','timing-extra']]:
        [['remaining_initial_mae','Initial count error','countdown-initial'],['remaining_mae','Remaining-work error','countdown-remaining'],['remaining_decrement_mae','Decrement error','countdown-decrement']];
      legend('a2-countdown-legend',specs.map(([,name,key])=>[name,color(key)]));
      const traces=specs.map(([key,name,paletteKey],i)=>({type:'scatter',mode:'lines+markers',name,
        x:rows.map(p=>p.depth),y:rows.map(p=>p[key]),line:{color:color(paletteKey),width:2,dash:['solid','dash','dot'][i]},
        marker:{color:color(paletteKey),size:5,symbol:rows.map(p=>[9,17,29,41,53,64].includes(p.depth)?'circle-open':'circle')},
        customdata:rows.map(p=>[p.questions,agreement?Math.round(p[key]*p.questions):null]),
        hovertemplate:agreement?'%{y:.2%} · %{customdata[1]} / %{customdata[0]} queries<extra>%{fullData.name}</extra>':
          '%{y:.3f} steps · mean across %{customdata[0]} queries<extra>%{fullData.name}</extra>'}));
      await Plotly.react(plot,traces,{...layout,...(split==='validation'?boundary(data.training_max):{}),
        xaxis:{...axis,title:{text:'Requested steps (N)',standoff:12},range:[rows[0].depth-.5,rows.at(-1).depth+.5]},
        yaxis:agreement?percentAxis:{...axis,rangemode:'tozero',title:{text:'Mean absolute error (steps)',standoff:10}}},options);
      byId('a2-countdown-subtitle').textContent=`Development replay · ${panel.graphs} graphs per count · ${rows[0].depth}–${rows.at(-1).depth} requested steps · ${panel.cap}-loop cap`;
      byId('a2-countdown-note').textContent=agreement?
        'Diagnostic zero = first readout ≤ 0.5 from loop one. Agreement requires both a zero crossing and a stop at the same loop, even if that loop is wrong. Missing crossings fail; the stop head remains the actual policy.':
        'Initial error is measured before loop one. Remaining-work error averages loops 0…N within each query; decrement error measures deviation from a decrease of one. Open markers are numeric values unseen by this controller.';
    });
  }
  async function renderNumericController(data) {
    await attach('a2-countdown-plot', async plot => {
      const reader=byId('a2-countdown-view').value==='reader';
      const maximum=byId('a2-countdown-range').value==='full'?(reader?10000:8192):256;
      const rows=(reader?data.numeric_controller.reader:data.numeric_controller.countdown).slice(0,maximum);
      const name=reader?'Initial number-reading error':'Actual stop − requested stop';
      const paletteKey=reader?'countdown-initial':'timing-exact';
      legend('a2-countdown-legend',[[name,color(paletteKey)]]);
      await Plotly.react(plot,[{type:'scatter',mode:'lines',name,x:rows.map(p=>p.request),y:rows.map(p=>p.error),
        line:{color:color(paletteKey),width:1.5},customdata:rows.map(p=>reader?p.initial:p.stop),
        hovertemplate:reader?'Requested %{x}<br>Initial memory: %{customdata:.8f}<br>Absolute error: %{y:.8f} steps<extra></extra>':
          'Requested %{x}<br>First stop: %{customdata}<br>Stopping error: %{y} loops<extra></extra>'}],
        {...layout,xaxis:{...axis,title:{text:'Requested count (N)',standoff:12},range:[.5,maximum+.5]},
          yaxis:{...axis,title:{text:reader?'Absolute reading error (steps)':'Stopping error (loops)',standoff:10},
            ...(reader?{rangemode:'tozero',tickformat:'.4f'}:{range:[-1,1],dtick:1})}},options);
      byId('a2-countdown-subtitle').textContent=`Controller only · every integer 1–${maximum.toLocaleString()} · no executor loops`;
      byId('a2-countdown-note').textContent=reader?
        'One numerical observation per integer. This is the initializer itself, not a separately fitted probe of GRU memory. Maximum error through 10,000: 0.001953125 steps.':
        'Every tested integer through 8,192 stops exactly. The zero line describes timing only; no pointer answers were evaluated beyond 256.';
    });
  }
  async function start() {
    if (!window.Plotly) throw new Error('Plotly unavailable');
    const response=await fetch(url);
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    const data=await response.json();
    if (data.schema_version!==1 || data.model!==model || data.graphs!==1350 ||
        Object.values(data.quality).some(p => p.length!==256)) throw new Error('Unexpected evaluation schema');
    const panels=[
      ['quality', [['nominal_final_correct','Final-answer accuracy','accuracy-answer'],
        ['complete_trajectory','Complete trajectory','accuracy-trajectory']]],
      ['timing', [['exact_stop','Exact stop','timing-exact'],
        ['joint_success','Correct answer + exact stop','timing-joint']]]
    ];
    for (const [id,specs] of panels) {
      await attach(`a2-${id}-plot`, async plot => {
        const max=Number(byId(`a2-${id}-range`).value);
        const activeSpecs=[...specs];
        if (id==='timing' && byId('a2-timing-strict')?.checked)
          activeSpecs.push(['strict_success','Exact stop + every step correct','timing-extra']);
        legend(`a2-${id}-legend`, activeSpecs.map(([,name,key]) => [name,color(key)]));
        const traces=activeSpecs.flatMap(([key,name,paletteKey],index) => {
          const points=data.quality[key].slice(0,max);
          const measured={type:'scatter', mode:'lines+markers', name,
            x:points.map(p => p.depth), y:points.map(p => p.rate),
            line:{color:color(paletteKey), width:2, dash:index?'dash':'solid'},
            marker:{color:color(paletteKey), size:max<=32?4:2, symbol:points.map(p=>(index?'diamond':'circle')+((id==='timing' && data.controller_cohorts?data.controller_cohorts.held_out:data.cohorts?.held_out)?.includes(p.depth)?'-open':''))},
            customdata:points.map(p => [p.correct,p.graphs,p.low,p.high]),
            hovertemplate:'%{y:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d} graphs<br>95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}<extra>%{fullData.name}</extra>'};
          if (id==='timing' && key==='exact_stop' && data.graph_invariant_controller) {
            measured.hovertemplate='%{y:.2%} · same stopping time on all %{customdata[1]:,d} graphs<br>One effective controller outcome at this integer; no graph-based interval<extra>%{fullData.name}</extra>';
            return [measured];
          }
          if (!byId(`a2-${id}-ci`).checked) return [measured];
          const interval={type:'scatter',mode:'lines',x:points.map(p=>p.depth),line:{width:0},hoverinfo:'skip'};
          return [{...interval,y:points.map(p=>p.low)},
            {...interval,y:points.map(p=>p.high),fill:'tonexty',fillcolor:color(paletteKey),opacity:.12},measured];
        });
        await Plotly.react(plot,traces,{...layout,...boundary(data.training_max),
          xaxis:{...axis,title:{text:'Requested steps (N)',standoff:12},range:[.5,max+.5],
            tickvals:max===64?[1,12,32,48,63]:max===16?[1,6,8,12,16]:max===32?[1,6,12,20,32]:[1,64,128,192,256]},
          yaxis:percentAxis},options);
      });
    }
    if (data.readouts) await renderReadouts(data);
    if (data.first_readouts) await renderControllerDetails(data);
    const stopMax=Math.max(...Object.values(data.stops).flat().map(p=>p.loop));
    await attach('a2-stops-plot', async plot => {
      const selection=byId('a2-stops-request').value;
      if (data.stop_quantiles) return drawStopSpread(data, plot, selection);
      const requests=selection==='examples'?(model==='fixed12'?[12,13,32,256]:[7,8,12,256]):[Number(selection)];
      // The longer-trained arm spans more stop loops; omit only columns empty in every displayed row.
      const loops=model==='fixed12'?
        [...new Set(requests.flatMap(n=>data.stops[n].map(p=>p.loop)))].sort((a,b)=>a-b):
        Array.from({length:stopMax},(_,i)=>i+1);
      const rows=requests.map(n=>{
        const histogram=data.stops[n];
        if (!histogram || histogram.reduce((sum,p)=>sum+p.graphs,0)!==data.graphs ||
            histogram.some(p=>p.loop<1 || p.loop>stopMax)) throw new Error('Unexpected stop distribution');
        return loops.map(loop=>histogram.find(p=>p.loop===loop)?.graphs || 0);
      });
      byId('a2-stops-title').textContent=selection==='examples'?'What does it do with a larger request?':`Asked for ${requests[0]} steps: where does it stop?`;
      byId('a2-stops-subtitle').textContent='Rows: requested steps · columns: actual stopping loop · 1,350 graphs per row';
      legend('a2-stops-legend',[]);
      const labels=requests.map(String);
      const channels=color('timing-exact').slice(1).match(/.{2}/g).map(v=>parseInt(v,16));
      const tint=value=>`rgb(${channels.map((channel,i)=>Math.round([255,254,250][i]*(1-value)+channel*value)).join(',')})`;
      const cells=rows.flatMap((row,i)=>row.map((count,j)=>({x:j+1,loop:loops[j],y:i,count,rate:count/data.graphs,request:requests[i]})));
      // The locally bundled Plotly basic build supports scatter, not heatmap.
      // Rectangles supply cells; a scatter layer supplies hover and the color scale.
      await Plotly.react(plot,[{type:'scatter',mode:'markers',x:cells.map(p=>p.x),y:cells.map(p=>p.y),
        customdata:cells.map(p=>[p.request,p.count,p.rate,p.loop]),
        marker:{size:1,color:cells.map(p=>p.rate),cmin:0,cmax:1,colorscale:[[0,paper],[1,color('timing-exact')]],showscale:true,
          colorbar:{thickness:10,len:.8,tickformat:'.0%',dtick:.5,title:{text:'Graphs',font:{size:10}}}},
        hovertemplate:'Requested: %{customdata[0]} steps<br>Stopped at loop %{customdata[3]}<br>%{customdata[2]:.2%} · %{customdata[1]:,d} / 1,350 graphs<extra></extra>'}],
        {...layout,hovermode:'closest',hoverdistance:-1,dragmode:false,margin:{l:65,r:60,t:16,b:55},
          shapes:cells.map(p=>({type:'rect',xref:'x',yref:'y',x0:p.x-.48,x1:p.x+.48,y0:p.y-.48,y1:p.y+.48,
            line:{width:0},fillcolor:tint(p.rate),layer:'below'})),
          annotations:cells.map(p=>({x:p.x,y:p.y,xref:'x',yref:'y',showarrow:false,
            text:p.count?`${(100*p.rate).toFixed(1)}`:'–',font:{size:10,color:p.rate>.5?'#ffffff':'#292c33'}})),
          xaxis:{...axis,showgrid:false,title:{text:'Actual stopping loop',standoff:12},tickvals:loops.map((_,i)=>i+1),ticktext:loops.map(String),range:[.5,loops.length+.5],fixedrange:true},
          yaxis:{zeroline:false,range:[requests.length-.5,-.5],tickvals:requests.map((_,i)=>i),ticktext:labels,
            title:{text:'Requested steps',standoff:10},showgrid:false,fixedrange:true}},options);
      byId('a2-stops-note').textContent=selection==='examples'?
        'The four requests discussed above, shown together. Cell values are percentages; every row totals 100%. Color shows the share of graphs, not answer accuracy.':
        `Steps = ${requests[0]} throughout. Cell values are percentages of graphs stopping at that column’s loop.`;

    });
    await window.renderLoopformerDiagnostics(data, prefix);
    if (data.count_probe) await renderAdditional(data);
  }
  start().catch(error => ['quality','timing','stops','survival','errors','structure','hazard','count','readout','readout-errors','stop-categories','outcomes','countdown'].forEach(id => {const plot=byId(`a2-${id}-plot`); if (plot) fail(plot,error);}));
  }
  renderEvaluation('a2','joint_full','./data/attempt-2-eval.json');
  renderEvaluation('a3a','fixed6','./data/attempt-3a-eval.json');
  renderEvaluation('a3b','fixed12','./data/attempt-3b-eval.json');
  renderEvaluation('a4','gru','./data/attempt-4-eval.json');
  renderEvaluation('a5','final','./data/attempt-5-eval.json');
})();
