/* Audited ordinary baselines, compared on common graphs; no browser inference. */
(() => {
  'use strict';
  if (!document.getElementById('baseline-accuracy-plot')) return;
  const byId = id => document.getElementById(id);
  const palette = getComputedStyle(document.documentElement);
  const color = key => palette.getPropertyValue(`--plot-${key}`).trim();
  const models = {
    direct:{name:'Qwen · direct answer',dash:'dot',symbol:'square'},
    original:{name:'Qwen · intermediate steps',dash:'dash',symbol:'circle'},
    sft:{name:'Full SFT · intermediate steps',dash:'solid',symbol:'diamond'}
  };
  // Colors belong to the metric family; model identity also has a stable dash/marker/pattern.
  const familySeries = {
    accuracy:{direct:'accuracy-extra',original:'accuracy-answer',sft:'accuracy-trajectory'},
    timing:{direct:'timing-extra',original:'timing-exact',sft:'timing-joint'},
    structure:{direct:'structure-extra',original:'structure-answer',sft:'structure-trajectory'},
    responses:{direct:'responses-direct',original:'responses-original',sft:'responses-sft'}
  };
  const modelColor = (family,key) => color(familySeries[family][key]);
  const barMarker = (family,key) => ({color:modelColor(family,key),
    pattern:{shape:key==='direct'?'.':key==='original'?'/':'',solidity:.12}});
  const modes = {all:'All graph types',random_function:'Random functions',permutation:'Permutations',full_cycle:'Full 26-state cycles'};
  const definitions = {
    stopped_answer_correct:'Accuracy checks the returned letter against the N-step answer. For trace models, this is the last emitted state, even if the length is wrong. Invalid responses fail.',
    nominal_final_correct:'State-at-N accuracy checks position N. Missing positions and malformed responses fail; extra states may follow.',
    complete_trajectory:'Correct prefix through N requires every one of the first N states to be correct. Extra states may follow; short or malformed responses fail.',
    strict_success:'Strict success requires every transition to be correct, exactly N emitted states, and EOS.',
    exact_stop:'Exact termination requires exactly N emitted states and EOS, regardless of whether the transitions are correct.',
    joint_success:'Correct answer + exact stop requires the last letter to be correct, exactly N emitted states, and EOS. Earlier transitions may be wrong.'
  };
  const paper='#fffefa',axis={gridcolor:'#eee9e2',zeroline:false};
  const options={responsive:true,displayModeBar:false,scrollZoom:false,displaylogo:false};
  const layout={autosize:true,paper_bgcolor:paper,plot_bgcolor:paper,showlegend:false,
    font:{family:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',size:11,color:'#292c33'},
    margin:{l:55,r:18,t:22,b:49},hoverlabel:{bgcolor:paper,bordercolor:'#d7d1c8',font:{size:11}}};
  const percent=title=>({...axis,title:{text:title,standoff:10},range:[0,1.04],tickformat:'.0%'});
  const format=n=>n.toLocaleString('en-US');
  // Average neighboring requested counts on the full panel before cropping the view.
  function smoothQuality(points,window) {
    const radius=(window-1)/2;
    return points.map((_,i)=>{
      const start=Math.max(0,i-radius),end=Math.min(points.length,i+radius+1);
      let hits=0,queries=0;
      for(let j=start;j<end;j++){hits+=points[j].hits;queries+=points[j].graphs;}
      return {value:hits/queries,start:start+1,end};
    });
  }
  function legend(figure,keys,directNA=false,reference=false,family='accuracy') {
    const parent=figure.querySelector('.baseline-series');
    parent.replaceChildren();
    for(const key of keys) {
      const item=document.createElement('span'),swatch=document.createElement('i');
      swatch.className='series-swatch';swatch.style.borderColor=modelColor(family,key);
      swatch.style.borderTopStyle=key==='direct'?'dotted':key==='original'?'dashed':'solid';
      swatch.setAttribute('aria-hidden','true');
      if(key==='direct'&&directNA)item.classList.add('baseline-na');
      item.append(swatch,document.createTextNode(models[key].name+(key==='direct'&&directNA?' · N/A':'')));
      parent.append(item);
    }
    if(reference) {
      const item=document.createElement('span'),swatch=document.createElement('i');
      swatch.className='series-swatch';swatch.style.borderColor=color('responses-reference');swatch.style.borderTopStyle='dashed';
      item.append(swatch,document.createTextNode('Correct letters · reference'));parent.append(item);
    }
  }
  function fail(plot,error) {
    console.error('LoopFormer baseline comparison:',error);
    const figure=plot.closest('figure'),status=figure.querySelector('.chart-status');
    figure.querySelectorAll('select,button,input').forEach(c=>{c.disabled=true;});
    status.hidden=false;status.textContent='Interactive chart unavailable. Summary measurements and downloadable data remain below.';
  }
  async function connect(id,draw) {
    const plot=byId(id),figure=plot.closest('figure');
    try {
      await draw(plot,figure);figure.querySelector('.chart-status').hidden=true;
      figure.querySelectorAll('select,button,input').forEach(control=>{
        control.disabled=false;
        control.addEventListener(control.tagName==='BUTTON'?'click':control.type==='range'?'input':'change',()=>draw(plot,figure).catch(e=>fail(plot,e)));
      });
    } catch(error) {fail(plot,error);}
  }
  async function start() {
    if(!window.Plotly)throw new Error('Plotly unavailable');
    const [direct,trace,letters,structure]=await Promise.all(['baseline-direct','baseline-traces','baseline-trace-responses','baseline-comparison'].map(async name=>{
      const response=await fetch(`./data/${name}.json`);if(!response.ok)throw new Error(`Missing ${name}`);return response.json();
    }));
    if(direct.schema_version!==2||trace.schema_version!==1||letters.schema_version!==1||structure.schema_version!==1||trace.graphs!==1350||structure.graphs!==1350)
      throw new Error('Unexpected comparison schema');
    for(const key of ['original','sft']) {
      if(letters.arms[key].correct.some((n,i)=>n!==trace.arms[key].series.all.metrics.stopped_answer_correct.hits[i])||
         letters.arms[key].predicted.some(row=>row.length!==27||row.reduce((a,b)=>a+b,0)!==1350))throw new Error('Letter counts and outcome panel differ');
    }
    for(const id of ['baseline-graph-range','baseline-response-range']) {
      byId(id).replaceChildren(...direct.comparisons.map(band=>{
        const option=document.createElement('option');option.value=band.key;option.textContent=band.label;return option;
      }));
    }
    await connect('baseline-accuracy-plot',async(plot,figure)=>{
      const metric=byId('trace-quality-metric').value,mode=byId('trace-quality-mode').value,max=Number(byId('trace-quality-range').value);
      const raw=byId('trace-quality-smoothing').value==='raw',window=Number(byId('trace-quality-window').value);
      byId('trace-quality-window').disabled=raw;
      byId('trace-quality-window').setAttribute('aria-valuetext',`${window} requested counts`);
      byId('trace-quality-window-label').textContent=`${window} counts`;
      const family=['exact_stop','joint_success','strict_success'].includes(metric)?'timing':'accuracy';
      figure.dataset.plotFamily=family;
      const common=metric==='stopped_answer_correct',keys=common?Object.keys(models):['original','sft'];
      legend(figure,Object.keys(models),!common,false,family);
      const traces=keys.map(key=>{
        const allPoints=key==='direct'?direct.series[mode].map(p=>({hits:p.correct,graphs:p.graphs,interval:[p.low,p.high]})):
          trace.arms[key].series[mode].metrics[metric].hits.map((hits,i)=>({hits,graphs:trace.arms[key].series[mode].graphs,interval:trace.arms[key].series[mode].metrics[metric].intervals[i]}));
        const smoothed=smoothQuality(allPoints,raw?1:window).slice(0,max),points=allPoints.slice(0,max);
        const m=models[key],lineColor=modelColor(family,key);return {type:'scatter',mode:raw?'lines+markers':'lines',name:m.name,x:points.map((_,i)=>i+1),y:smoothed.map(p=>p.value),
          line:{color:lineColor,width:2,dash:m.dash},marker:{color:lineColor,size:max<=32?5:2,symbol:m.symbol},
          customdata:points.map((p,i)=>[p.hits,p.graphs,...p.interval,p.hits/p.graphs,smoothed[i].start,smoothed[i].end]),
          hovertemplate:(raw?'':'Smoothed: %{y:.3%} · N=%{customdata[5]}–%{customdata[6]}<br>')+
            'Raw at N=%{x}: %{customdata[4]:.3%}<br>%{customdata[0]:,d} / %{customdata[1]:,d} queries<br>Raw 95% interval: %{customdata[2]:.2%}–%{customdata[3]:.2%}<extra>%{fullData.name}</extra>'};
      });
      await Plotly.react(plot,traces,{...layout,hovermode:'x unified',dragmode:'zoom',
        xaxis:{...axis,title:{text:'Requested steps (N)',standoff:12},range:[.5,max+.5],tickvals:max===16?[1,4,7,9,11,12,16]:max===32?[1,8,12,16,24,32]:[1,64,128,192,256]},
        yaxis:{...percent('Fraction of queries'),range:[-.025,1.045],dtick:.2},
        shapes:[...[7,9,11].map(n=>({type:'rect',xref:'x',yref:'paper',x0:n-.35,x1:n+.35,y0:0,y1:1,fillcolor:'#ebe7e0',opacity:.6,line:{width:0},layer:'below'})),
          {type:'line',xref:'x',yref:'paper',x0:12.5,x1:12.5,y0:0,y1:1,line:{color:'#b9afa3',width:1,dash:'dot'},layer:'below'}]},options);
      byId('trace-quality-definition').textContent=definitions[metric];
      byId('trace-quality-smoothing-note').textContent=raw?'Lines show the individual, unsmoothed measurements.':
        `Lines show a centered, query-weighted mean across ${window} neighboring requested counts, with smaller windows at the panel edges (1 and 256). This blends trained and held-out counts; select Raw to see the count-specific dips.`;

      byId('trace-quality-note').textContent=`${modes[mode]} · ${mode==='all'?'1,350':'450'} graphs per requested count.`+(!common?' Direct-answer Qwen has no trace; its value is N/A, not zero.':'');
    });
    await connect('trace-stopping-plot',async(plot,figure)=>{
      const family='timing';
      const n=Number(byId('trace-stopping-count').value),lengths=byId('trace-stopping-view').value==='lengths',keys=['original','sft'];
      legend(figure,keys,false,false,family);
      if(!lengths) {
        const categories=['exact','early','late','budget','malformed'],labels=['Exact length','Early stop','Late stop','Token cap','Malformed'];
        const traces=keys.map(key=>({type:'bar',orientation:'h',name:models[key].name,y:labels,x:categories.map(c=>trace.arms[key].diagnostics[n].termination[c]/1350),
          marker:barMarker(family,key),customdata:categories.map(c=>trace.arms[key].diagnostics[n].termination[c]),
          hovertemplate:'%{y}<br>%{x:.2%} · %{customdata:,d} / 1,350 queries<extra>%{fullData.name}</extra>'}));
        await Plotly.react(plot,traces,{...layout,barmode:'group',bargap:.28,dragmode:false,hovermode:'closest',margin:{l:88,r:18,t:15,b:49},
          xaxis:{...percent('Fraction of queries'),fixedrange:true},yaxis:{showgrid:false,autorange:'reversed',fixedrange:true}},options);
      } else {
        // Keep the requested length visible while pooling distant tails.
        const bins = [{lo:0,hi:0,label:'Malformed'}, {lo:1,hi:n-3,label:`1–${n-3}`},
          ...[n-2,n-1,n,n+1,n+2].map(v=>({lo:v,hi:v,label:String(v)})),
          {lo:n+3,hi:272,label:`${n+3}–272`}];
        const labels=bins.map(bin=>bin.label),requested=bins.findIndex(bin=>bin.lo===n&&bin.hi===n);
        const traces=keys.map(key=>{
          const rows=trace.arms[key].diagnostics[n].lengths;
          const groups=bins.map(bin=>rows.filter(row=>row.states>=bin.lo&&row.states<=bin.hi));
          const hits=groups.map(rows=>rows.reduce((sum,row)=>sum+row.graphs,0));
          if(hits.reduce((a,b)=>a+b,0)!==1350)throw new Error('Length bins do not partition the panel');
          return {type:'bar',name:models[key].name,x:labels,y:hits.map(h=>h/1350),marker:barMarker(family,key),
            customdata:hits.map((h,i)=>[h,groups[i].map(row=>`${row.states || 'Malformed'}: ${row.graphs}`).join(', ')||'No responses']),
            hovertemplate:'Emitted states: %{x}<br>%{y:.2%} · %{customdata[0]:,d} / 1,350 queries<br>Observed lengths (queries): %{customdata[1]}<extra>%{fullData.name}</extra>'};
        });
        await Plotly.react(plot,traces,{...layout,barmode:'group',dragmode:false,hovermode:'closest',margin:{...layout.margin,t:34,b:74},
          xaxis:{...axis,type:'category',categoryorder:'array',categoryarray:labels,title:{text:'Emitted states (observed lengths)',standoff:12},fixedrange:true},
          yaxis:{...percent('Fraction of queries'),fixedrange:true},
          shapes:[{type:'line',xref:'x',yref:'paper',x0:requested,x1:requested,y0:0,y1:1,line:{color:'#b9afa3',width:1,dash:'dot'}}],
          annotations:[{x:requested,y:1.08,xref:'x',yref:'paper',text:`Requested: ${n}`,showarrow:false,font:{size:10}}]},options);
      }
    });
    await connect('baseline-graphs-plot',async(plot,figure)=>{
      const family='structure';
      const key=byId('baseline-graph-range').value,field=byId('baseline-structure-field').value,mode=byId('baseline-structure-mode').value;
      const byMode=field==='graph_mode',band=direct.comparisons.find(b=>b.key===key);
      byId('baseline-structure-mode-label').hidden=byMode;legend(figure,Object.keys(models),false,false,family);
      const getPoints=model=>{const row=model==='direct'?band:structure.arms[model].find(b=>b.key===key);return byMode?row.by_mode:row.structure[field][mode];};
      const labels=getPoints('direct').map(p=>byMode?modes[p.mode]:p.label);
      const traces=Object.keys(models).map(key=>{const points=getPoints(key);return {type:'bar',orientation:'h',name:models[key].name,y:labels,x:points.map(p=>p.accuracy),marker:barMarker(family,key),
        error_x:{type:'data',symmetric:false,color:modelColor(family,key),thickness:1,width:3,array:points.map(p=>p.graphs?p.high-p.accuracy:0),arrayminus:points.map(p=>p.graphs?p.accuracy-p.low:0)},
        customdata:points.map(p=>[p.correct,p.queries,p.graphs,p.low,p.high]),
        hovertemplate:'%{y}<br>%{x:.2%} · %{customdata[0]:,d} / %{customdata[1]:,d} queries<br>%{customdata[2]} graphs<br>95% interval: %{customdata[3]:.2%}–%{customdata[4]:.2%}<extra>%{fullData.name}</extra>'};});
      const height=byMode?330:405;plot.style.height=`${height}px`;
      const max=Math.min(1.04,Math.max(.1,Math.ceil(Math.max(...Object.keys(models).flatMap(k=>getPoints(k).map(p=>p.high||0)))*1.12*10)/10));
      await Plotly.react(plot,traces,{...layout,height,barmode:'group',bargap:.28,dragmode:false,hovermode:'closest',margin:{l:102,r:18,t:12,b:49},
        xaxis:{...percent('Returned final-answer accuracy'),range:[0,max],fixedrange:true},
        yaxis:{showgrid:false,autorange:'reversed',fixedrange:true,tickvals:labels,ticktext:getPoints('direct').map((p,i)=>`${byMode?['Random<br>functions','Permutations','Full cycles'][i]:p.label}<br>${p.graphs} graphs`)},
        annotations:getPoints('direct').filter(p=>!p.graphs).map(p=>({x:0,y:p.label,xref:'x',yref:'y',text:'N/A · no graphs',xanchor:'left',showarrow:false,font:{size:10}}))},options);
      byId('baseline-graph-note').textContent=`${byMode?'450 graphs per type':modes[mode]+' · 450 graphs'} · ${band.label}. All three models use the same graph groups.`;
    });
    await connect('baseline-responses-plot',async(plot,figure)=>{
      const family='responses';
      const band=direct.comparisons.find(b=>b.key===byId('baseline-response-range').value),predicted={direct:band.predicted};
      for(const key of ['original','sft'])predicted[key]=Array.from({length:27},(_,letter)=>letters.arms[key].predicted.slice(band.start-1,band.end).reduce((sum,row)=>sum+row[letter],0));
      const order=Array.from({length:26},(_,i)=>i);
      if(byId('baseline-response-order').value==='frequency')order.sort((a,b)=>predicted.direct[b]-predicted.direct[a]||a-b);
      const labels=order.map(i=>String.fromCharCode(65+i));legend(figure,Object.keys(models),false,true,family);
      const traces=Object.keys(models).map(key=>({type:'bar',name:models[key].name,x:labels,y:order.map(i=>predicted[key][i]/band.queries),marker:barMarker(family,key),customdata:order.map(i=>predicted[key][i]),
        hovertemplate:'%{y:.2%} · %{customdata:,d} responses<extra>%{fullData.name}</extra>'}));
      traces.push({type:'scatter',mode:'lines+markers',name:'Correct letters · reference',x:labels,y:order.map(i=>band.expected[i]/band.queries),
        line:{color:color('responses-reference'),width:2,dash:'dash'},marker:{color:color('responses-reference'),size:4},customdata:order.map(i=>band.expected[i]),hovertemplate:'%{y:.2%} · %{customdata:,d} correct targets<extra>Correct letters · reference</extra>'});
      await Plotly.react(plot,traces,{...layout,barmode:'group',hovermode:'x unified',dragmode:false,
        xaxis:{...axis,type:'category',categoryorder:'array',categoryarray:labels,title:{text:'Answer letter',standoff:12},fixedrange:true},
        yaxis:{...axis,title:{text:'Share of all queries',standoff:10},rangemode:'tozero',tickformat:'.0%',fixedrange:true}},options);
      byId('baseline-response-note').textContent=`${format(band.queries)} queries per model · invalid responses: ${Object.keys(models).map(k=>`${models[k].name} ${format(predicted[k][26])}`).join('; ')}. Included in every denominator.`;
    });
  }
  start().catch(error=>['baseline-accuracy-plot','trace-stopping-plot','baseline-graphs-plot','baseline-responses-plot'].forEach(id=>fail(byId(id),error)));
})();
