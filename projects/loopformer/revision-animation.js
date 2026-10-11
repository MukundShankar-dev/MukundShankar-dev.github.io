/* Schematic forward passes, not recorded predictions or hidden activations. */
(() => {
  'use strict';
  const figure = document.getElementById('architecture-3a-animation');
  if (!figure) return;
  const $ = selector => figure.querySelector(selector);
  const $$ = selector => figure.querySelectorAll(selector);
  let index = 0, playing = false, timer = null;
  const frames = [{loop:0, phase:'encode'}];
  for (let loop = 1; loop <= 3; loop++) {
    for (const phase of ['update', 'head', 'decision']) frames.push({loop, phase});
  }
  frames.push({loop:3, phase:'read'});
  function render(announce = false) {
    const {loop, phase} = frames[index];
    const title = phase === 'encode' ? 'Encode the prompt once'
      : `Loop ${loop} · ${phase === 'update' ? 'update the state' : phase === 'head' ? 'compute the stop score' : phase === 'read' ? 'read the final answer' : loop === 3 ? 'stop looping' : 'continue from the R state'}`;
    const text = phase === 'encode' ? 'P prepares the full sequence. The requested count is present as text, with no separate numeric counter.'
      : phase === 'update' ? 'Each layer reuses its own first-pass prompt memory. Only the answer-position vector changes; the same R weights are reused.'
      : phase === 'head' ? 'H reads the answer-position vector directly from R and computes a stop score. It has no private memory or supplied loop counter.'
      : phase === 'read' ? 'C reads the final R state, followed by normalization and the LM head, to return D. H chooses when to exit; C reads the answer from the state.'
      : loop === 3 ? 'H’s score crosses the stopping threshold in this ideal example. Recurrence ends, and the final state is ready to be read through C.'
      : 'H’s score is below the threshold, so only the working vector advances to the next R pass. Layer-specific prompt memory stays fixed; neither readout is fed back.';
    $('[data-stage-number]').textContent = String(index + 1).padStart(2, '0');
    $('[data-stage-title]').textContent = title;
    $('[data-stage-description]').textContent = text;
    const active = phase === 'encode' ? ['p'] : phase === 'update' ? ['r','state']
      : phase === 'head' ? ['head'] : phase === 'read' ? ['c','output'] : loop === 3 ? ['head'] : ['state'];
    $$('[data-block]').forEach(node => node.classList.toggle('is-active', active.includes(node.dataset.block)));
    const wires = phase === 'encode' ? ['input','init'] : phase === 'update' ? ['state']
      : phase === 'head' ? ['head'] : phase === 'read' ? ['read','output'] : loop < 3 ? ['feedback'] : [];
    $$('[data-flow]').forEach(node => node.classList.toggle('is-active', wires.includes(node.dataset.flow)));
    $$('[data-cell]').forEach(node => {
      const cell = Number(node.dataset.cell);
      const isPrefix = Number(node.dataset.row) < 3;
      node.style.fill = isPrefix ? '#a5aaa0' : '#438c84';
      node.style.opacity = String(.3 + ((cell * 7 + (isPrefix ? 0 : loop * 11)) % 17) / 26);
    });
    $$('[data-output]').forEach(node => { node.textContent = phase === 'read' ? 'D' : '—'; });
    const stopText = phase === 'encode' || phase === 'update' ? 'p(stop) = ?'
      : ['decision', 'read'].includes(phase) ? loop === 3 ? 'STOP' : 'CONTINUE'
      : loop === 3 ? 'p(stop) ≥ τ' : 'p(stop) < τ';
    $$('[data-stop]').forEach(node => { node.textContent = stopText; });
    $$('[data-loop]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.loop) === loop)));
    figure.classList.toggle('is-playing', playing);
    $('[data-play]').textContent = playing ? 'Ⅱ Pause' : index === frames.length - 1 ? '↺ Replay' : '▶ Play';
    $('[data-play]').setAttribute('aria-label', playing ? 'Pause revision animation' : index === frames.length - 1 ? 'Replay revision animation' : 'Play revision animation');
    if (announce) $('[data-announcement]').textContent = `${title}. ${text}`;
  }
  function stop() { playing = false; clearTimeout(timer); timer = null; }
  function tick() {
    timer = setTimeout(() => {
      if (index === frames.length - 1) { stop(); render(); return; }
      index++; render(); tick();
    }, 2800);
  }
  $('[data-play]').addEventListener('click', () => {
    if (playing) stop();
    else { if (index === frames.length - 1) index = 0; playing = true; tick(); }
    render(true);
  });
  $('[data-step]').addEventListener('click', () => { stop(); index = (index + 1) % frames.length; render(true); });
  $('[data-restart]').addEventListener('click', () => { stop(); index = 0; render(true); });
  $$('[data-loop]').forEach(button => button.addEventListener('click', () => { stop(); index = {1:3,2:6,3:10}[button.dataset.loop]; render(true); }));
  new IntersectionObserver(entries => { if (!entries[0].isIntersecting && playing) { stop(); render(); } }).observe(figure);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); render(); } });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { stop(); render(); });
  $('.arch-controls').hidden = false;
  render();
})();
