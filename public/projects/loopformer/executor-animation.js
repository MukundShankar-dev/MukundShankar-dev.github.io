/* One persistent architecture diagram; animation highlights an ideal execution. */
(() => {
  'use strict';
  const figure=document.getElementById('architecture-4-animation');
  if(!figure)return;
  const $=s=>figure.querySelector(s), $$=s=>figure.querySelectorAll(s);
  const frames=[{phase:'overview',loop:0},{phase:'prepare-r',loop:0},{phase:'prepare-controller',loop:0}];
  for(let loop=1;loop<=3;loop++){
    frames.push({phase:'execute',loop},{phase:'control',loop});
    if(loop<3)frames.push({phase:'repeat',loop});
  }
  frames.push({phase:'read',loop:3});
  const sub=n=>'₀₁₂₃'[n];
  let index=0,playing=false,timer=null;
  const set=(s,text)=>{$$(s).forEach(node=>{node.textContent=text;});};
  function render(announce=false){
    const {phase,loop}=frames[index];
    const details={
      overview:['Two states, with separate jobs','R updates the working state hₜ. The controller updates its own memory mₜ and chooses when to stop. Only hₜ returns to R.','The same P weights encode two prompt views before recurrence. Read each row from left to right. Teal carries the executor state; rust carries private controller memory. The dashed decision arrow selects a path without adding a state input to R.'],
      'prepare-r':['Initialize the executor','P encodes Rules and Start without Steps, producing the initial working state h₀ for R.','P is frozen. This encoding supplies no requested count to the executor.'],
      'prepare-controller':['Reuse P to initialize the controller','The same P weights encode the full prompt. A learned projection creates the GRU’s initial private memory m₀.','This is a second prompt encoding through the same module, before recurrence begins. No parsed count or loop index is supplied to the GRU.'],
      execute:[`Loop ${loop}: update the working state`,loop===1?'R performs the first transition and forms the per-layer prompt memory reused by later loops.':'The bridge-prepared state enters the same R layers. Fixed prompt memory supplies the rules; R updates only the working vector.','R uses the same weights at every loop. It never receives the controller’s memory.'],
      control:[`Loop ${loop}: update memory and decide`,`The GRU combines h${sub(loop)} with its previous private memory. Its updated memory supplies the stop readout, which chooses ${loop===3?'stop':'continue'} in this ideal example.`,'The GRU keeps its own state for the next decision. Its observation is detached, so controller gradients cannot change R.'],
      repeat:[`Continue to loop ${loop+1}`,`The bridge restores h${sub(loop)} to the initial state’s RMS scale, then applies a learned gain and projection before the next R pass.`,'Only the executor state travels through the bridge. The controller’s memory remains on its separate loop.'],
      read:['Stop and read the answer','C transforms the final R state h₃. Final normalization and the language-model head read the letter D.','The answer comes from the executor state. Neither the decoded letter nor the controller memory becomes an R input.']
    };
    const parts={overview:[], 'prepare-r':['prompt','p','initial-state','input'], 'prepare-controller':['prompt','p','initial-controller','previous'],execute:['memory','r','state'],control:['state','previous','controller','updated','decision'],repeat:['state','bridge','input'],read:['state','c','output']}[phase];
    const wires={overview:[], 'prepare-r':['prompt','initial-state','initial-r'], 'prepare-controller':['prompt','initial-memory'],execute:['initial-r','memory','state'],control:['observe','previous','updated','decision','choose'],repeat:['branch','return','bridge','remember'],read:['branch','read','output']}[phase];
    if(phase==='control') wires.push('branch', ...(loop===3?['read']:['return']));
    $$('[data-part]').forEach(node=>node.classList.toggle('is-active',parts.includes(node.dataset.part)));
    $$('[data-wire]').forEach(node=>node.classList.toggle('is-active',wires.includes(node.dataset.wire)));
    figure.classList.toggle('is-playing',playing);
    set('[data-position]',phase==='overview'?'Overview':loop?`Loop ${loop} / 3`:'Setup');
    set('[data-stage-title]',details[phase][0]);set('[data-stage-description]',details[phase][1]);set('[data-retained]',details[phase][2]);
    set('[data-working-state]',loop?`h${sub(loop)}`:'hₜ');
    set('[data-memory-before]',loop?`m${sub(loop-1)}`:phase==='prepare-controller'?'m₀':'mₜ₋₁');
    set('[data-memory-after]',loop?`m${sub(loop)}`:'mₜ');
    set('[data-verdict]',phase==='overview'?'Continue / stop':phase==='control'||phase==='repeat'||phase==='read'?loop===3?'STOP':'CONTINUE':'—');
    set('[data-output]',phase==='read'||phase==='overview'?'D':'—');
    set('[data-progress]',`${index+1} / ${frames.length}`);
    $('[data-back]').disabled=index===0;
    set('[data-play]',playing?'Ⅱ Pause':index===frames.length-1?'↺ Replay':'▶ Follow the flow');
    if(announce)set('[data-announcement]',details[phase][0]+'. '+details[phase][1]);
  }
  function stop(){playing=false;clearTimeout(timer);timer=null;}
  function tick(){timer=setTimeout(()=>{if(index===frames.length-1){stop();render();return;}index++;render();tick();},4200);}
  $('[data-play]').addEventListener('click',()=>{if(playing)stop();else{if(index===frames.length-1)index=0;playing=true;tick();}render(true);});
  $('[data-step]').addEventListener('click',()=>{stop();index=(index+1)%frames.length;render(true);});
  $('[data-back]').addEventListener('click',()=>{stop();index=Math.max(0,index-1);render(true);});
  $('[data-restart]').addEventListener('click',()=>{stop();index=0;render(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();render();}});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&playing){stop();render();}}).observe(figure);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{stop();render();});
  $('.arch-controls').hidden=false;render();
})();
