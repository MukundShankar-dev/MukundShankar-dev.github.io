/* Shared, dependency-free navigation. Headings remain the source of truth. */
(() => {
  const main = document.querySelector('main');
  const entries = [...document.querySelectorAll('main > .journal-entry')];
  if (!main || !entries.length || document.querySelector('.reading-nav')) return;

  const ensureId = (element, base) => {
    if (element.id) return element.id;
    let id = base;
    let suffix = 2;
    while (document.getElementById(id)) id = `${base}-${suffix++}`;
    element.id = id;
    return id;
  };
  const nav = document.createElement('nav');
  nav.className = 'reading-nav';
  nav.setAttribute('aria-label', 'On this page');
  nav.innerHTML = `
    <div class="reading-nav-heading">On this page</div>
    <button class="reading-nav-toggle" type="button" aria-expanded="false" aria-controls="reading-sections">
      <span class="reading-nav-current">Overview</span><span aria-hidden="true">⌄</span>
    </button>
    <div class="reading-nav-links" id="reading-sections"><ol></ol></div>
    <div class="reading-progress"><div><span>Page progress</span><span class="reading-percent">0%</span></div>
      <progress max="100" value="0" aria-label="Page scroll progress"></progress>
    </div>`;
  const list = nav.querySelector('ol');
  const targets = [];
  const groups = [];
  const makeLink = (element, label, parent, group) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${element.id}`;
    link.textContent = label;
    item.append(link);
    parent.append(item);
    targets.push({ element, link, group, label });
    return item;
  };
  const overview = main.querySelector('.project-header');
  if (overview) {
    ensureId(overview, 'journal-overview');
    makeLink(overview, 'Overview', list, null);
  }
  entries.forEach((entry, index) => {
    const heading = entry.querySelector('header h2');
    if (!heading) return;
    ensureId(entry, `journal-entry-${index + 1}`);
    const group = document.createElement('ol');
    group.className = 'reading-subsections';
    const phase = entry.querySelector('header .eyebrow');
    const label = `${phase ? `${phase.textContent.trim()} · ` : ''}${heading.textContent.trim()}`;
    const item = makeLink(entry, label, list, group);
    item.append(group);
    groups.push(group);
    entry.querySelectorAll('h3').forEach((subheading, subindex) => {
      ensureId(subheading, `${entry.id}-section-${subindex + 1}`);
      makeLink(subheading, subheading.textContent.trim(), group, group);
    });
  });
  document.body.append(nav);
  document.documentElement.classList.add('has-reading-nav');

  const toggle = nav.querySelector('.reading-nav-toggle');
  const currentLabel = nav.querySelector('.reading-nav-current');
  const linkPanel = nav.querySelector('.reading-nav-links');
  const progress = nav.querySelector('progress');
  const percent = nav.querySelector('.reading-percent');
  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      close();
      toggle.focus();
    }
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const target = document.getElementById(link.hash.slice(1));
    close();
    // Move focus into the content too, rather than leaving it in a hidden mobile menu.
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  let offsets = [];
  let active = -1;
  let frame = 0;
  let needsMeasure = true;
  function update() {
    frame = 0;
    if (needsMeasure) {
      offsets = targets.map(({ element }) => element.getBoundingClientRect().top + window.scrollY);
      needsMeasure = false;
    }
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y = Math.max(0, window.scrollY);
    const value = maxScroll ? Math.round(Math.min(1, y / maxScroll) * 100) : 100;
    progress.value = value;
    percent.textContent = `${value}%`;
    let next = 0;
    // Allow for fractional pixels when the browser rounds an anchor's scroll position.
    offsets.forEach((offset, index) => { if (offset <= y + 122) next = index; });
    if (maxScroll > 0 && y >= maxScroll - 2) next = targets.length - 1;
    if (next === active) return;
    active = next;
    targets.forEach(({ link }, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    groups.forEach(group => { group.hidden = group !== targets[active].group; });
    currentLabel.textContent = targets[active].label;
    // Keep the current item visible inside the sidebar without scrolling the page.
    const linkRect = targets[active].link.getBoundingClientRect();
    const panelRect = linkPanel.getBoundingClientRect();
    if (linkPanel.clientHeight && (linkRect.top < panelRect.top || linkRect.bottom > panelRect.bottom)) {
      linkPanel.scrollTop += linkRect.top - panelRect.top - linkPanel.clientHeight / 2;
    }
  }
  function schedule(measure = false) {
    needsMeasure = needsMeasure || measure;
    if (!frame) frame = window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('resize', () => schedule(true));
  window.addEventListener('load', () => schedule(true));
  window.addEventListener('hashchange', () => schedule(true));
  // Charts, images, and fonts can change section positions after initial load.
  if ('ResizeObserver' in window) new ResizeObserver(() => schedule(true)).observe(main);
  if (document.fonts) document.fonts.ready.then(() => schedule(true));
  update();
})();
