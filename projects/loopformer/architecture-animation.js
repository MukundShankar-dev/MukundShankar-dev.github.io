/* Illustrative forward pass; symbols and grid colors are schematic, not model data. */
(() => {
  'use strict';
  const figure = document.getElementById('architecture-1-animation');
  if (!figure) return;
  const $ = selector => figure.querySelector(selector);
  const $$ = selector => figure.querySelectorAll(selector);
  const play = $('#arch-play');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = [
    { title: 'Start with the whole prompt', text: 'Rules, Start and Steps are embedded together. P prepares the initial hidden state once.', block: 'p', wire: 'input', loop: 0, state: 0, read: 0 },
    { title: 'P creates h₀', text: 'The complete sequence leaves P: one 896-dimensional vector per token position. This is the input to the first R pass.', block: 'p', wire: 'init', loop: 0, state: 0, read: 0 },
    { title: 'Loop 1 · update the state', text: 'R applies layers 6–17 to every position. Only its rank-8 q/v LoRA adapters were trained; the original weights remain frozen.', block: 'r', wire: 'state', loop: 1, state: 1, read: 0 },
    { title: 'Carry h₁ into the next loop', text: 'The supplied loop budget has not been reached. The entire hidden state returns directly to R for another update.', block: 'state', wire: 'feedback', loop: 1, state: 1, read: 0 },
    { title: 'Loop 2 · reuse the same R', text: 'The same twelve layers and the same adapters update every token position again. Rules, Start and Steps representations evolve too.', block: 'r', wire: 'state', loop: 2, state: 2, read: 0 },
    { title: 'Carry h₂ into the next loop', text: 'P is not run again. Recurrence continues directly from h₂, with the same causal mask and positional information.', block: 'state', wire: 'feedback', loop: 2, state: 2, read: 0 },
    { title: 'Loop 3 · one more state update', text: 'R is reused a third time to form h₃. There is still one shared recurrent module, rather than three separately trained copies.', block: 'r', wire: 'state', loop: 3, state: 3, read: 0 },
    { title: 'Loop 3 · return D', text: 'The supplied three-loop budget is reached. C reads h₃, followed by final normalization and the LM head, to return D. There is no learned stopping head.', block: 'c', wire: 'output', loop: 3, state: 3, read: 3 }
  ];
  let index = 0;
  let playing = false;
  let timer = null;
  const subscripts = ['₀', '₁', '₂', '₃'];
  const letters = ['—', 'B', 'C', 'D'];

  function render(announce = false) {
    const frame = frames[index];
    $('#arch-stage-number').textContent = String(index + 1).padStart(2, '0');
    $('#arch-stage-title').textContent = frame.title;
    $('#arch-stage-description').textContent = frame.text;
    $$('[data-block]').forEach(node => node.classList.toggle('is-active', node.dataset.block === frame.block || (frame.block === 'c' && node.dataset.block === 'output')));
    $$('[data-flow]').forEach(node => node.classList.toggle('is-active', (frame.block === 'c' ? ['read', 'output'].includes(node.dataset.flow) : node.dataset.flow === frame.wire)));
    $$('[data-state-label]').forEach(node => { node.textContent = index < 2 ? 'hₜ' : `h${subscripts[frame.state]}`; });
    $$('[data-output]').forEach(node => { node.textContent = letters[frame.read]; });
    $$('[data-cell]').forEach(node => {
      const cell = Number(node.dataset.cell);
      node.style.opacity = String(.25 + ((cell * 7 + frame.state * 11) % 17) / 24);
      node.style.fill = frame.state % 2 ? '#438c84' : '#76a694';
    });
    $$('[data-loop]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.loop) === frame.loop)));
    figure.classList.toggle('is-playing', playing);
    play.textContent = playing ? 'Ⅱ Pause' : index === frames.length - 1 ? '↺ Replay' : '▶ Play';
    play.setAttribute('aria-label', playing ? 'Pause architecture animation' : index === frames.length - 1 ? 'Replay architecture animation' : 'Play architecture animation');
    if (announce) $('#arch-announcement').textContent = `${frame.title}. ${frame.text}`;
  }
  function stop() {
    playing = false;
    window.clearTimeout(timer);
    timer = null;
  }
  function schedule() {
    timer = window.setTimeout(() => {
      if (index === frames.length - 1) { stop(); render(); return; }
      index += 1;
      render();
      schedule();
    }, 2600);
  }
  play.addEventListener('click', () => {
    if (playing) stop();
    else { if (index === frames.length - 1) index = 0; playing = true; schedule(); }
    render(true);
  });
  $('#arch-step').addEventListener('click', () => { stop(); index = (index + 1) % frames.length; render(true); });
  $('#arch-restart').addEventListener('click', () => { stop(); index = 0; render(true); });
  $$('[data-loop]').forEach(button => button.addEventListener('click', () => {
    stop(); index = { 1: 3, 2: 5, 3: 7 }[button.dataset.loop]; render(true);
  }));
  // Pause when off-screen or backgrounded; resuming is always an explicit action.
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && playing) { stop(); render(); }
  });
  observer.observe(figure);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); render(); } });
  reducedMotion.addEventListener('change', () => { stop(); render(); });
  $('.arch-controls').hidden = false;
  render();
})();
