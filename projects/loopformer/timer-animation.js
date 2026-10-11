/* Idealized timing demonstration, not recorded model activations. */
(() => {
  'use strict';
  const figure=document.getElementById('architecture-5-animation');
  if(!figure)return;
  const $=s=>figure.querySelector(s), $$=s=>figure.querySelectorAll(s);
  let loop=0,playing=false,timer=null;
  const sub=n=>String(n).split('').map(c=>'₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join('');
  const set=(s,value)=>{$$(s).forEach(n=>{n.textContent=value;});};
  function render(announce=false){
    const initialized=loop===0,done=loop===12;
    const title=initialized?'Read the request into one scalar':done?'Loop 12: the readout signals stop':`Loop ${loop}: update memory, then decide`;
    const description=initialized?'The reader turns the Steps digit embeddings into the initial memory m₀. The connected path carries that value into the repeating update below.':done?'The ideal update takes the memory from approximately 1 to 0. The learned readout signals stop, so this value is not carried into another loop.':`After one executor loop, the same learned update takes memory from approximately ${13-loop} to ${12-loop}. The readout signals continue, so the updated value becomes the next loop’s input.`;
    set('[data-timer-position]',initialized?'Before looping':`Loop ${loop} / 12`);
    set('[data-timer-title]',title);set('[data-timer-description]',description);
    set('[data-timer-previous]',initialized?'m₀ ≈ 12':`m${sub(loop-1)} ≈ ${13-loop}`);
    set('[data-timer-memory]',initialized?'mₜ':`m${sub(loop)} ≈ ${12-loop}`);
    set('[data-timer-verdict]',initialized?'Continue / stop':done?'STOP':'CONTINUE');
    const parts=initialized?['digits','embeddings','reader','previous']:['previous','cell','updated','decision'];
    const wires=initialized?['digits','embeddings','initialize']:['previous','update','decide',...(done?[]:['remember'])];
    $$('[data-timer-part]').forEach(n=>n.classList.toggle('is-active',parts.includes(n.dataset.timerPart)));
    $$('[data-timer-wire]').forEach(n=>n.classList.toggle('is-active',wires.includes(n.dataset.timerWire)));
    figure.classList.toggle('is-playing',playing);
    set('[data-timer-play]',playing?'Ⅱ Pause':done?'↺ Replay':'▶ Follow the loops');
    if(announce)set('[data-timer-announcement]',title+'. '+description);
  }
  function stop(){playing=false;clearTimeout(timer);timer=null;}
  function tick(){timer=setTimeout(()=>{if(loop===12){stop();render();return;}loop++;render();tick();},1800);}
  $('[data-timer-play]').addEventListener('click',()=>{if(playing)stop();else{if(loop===12)loop=0;playing=true;tick();}render(true);});
  $('[data-timer-next]').addEventListener('click',()=>{stop();loop=(loop+1)%13;render(true);});
  $('[data-timer-reset]').addEventListener('click',()=>{stop();loop=0;render(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();render();}});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&playing){stop();render();}}).observe(figure);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{stop();render();});
  $('.arch-controls').hidden=false;render();
})();
