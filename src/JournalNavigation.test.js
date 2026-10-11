import fs from 'fs';
import path from 'path';
import vm from 'vm';

const script = fs.readFileSync(path.join(process.cwd(), 'public/projects/journal-navigation.js'), 'utf8');

function setup() {
  const page = new DOMParser().parseFromString(`<main>
    <header class="project-header"><h1>Journal</h1></header>
    <article class="journal-entry" id="one"><header><h2>First entry</h2></header><h3>Details</h3></article>
    <article class="journal-entry" id="two"><header><h2>Second entry</h2></header><h3>Details</h3></article>
  </main>`, 'text/html');
  const events = {};
  let pending;
  const window = {
    scrollY: 0, innerHeight: 600,
    addEventListener: (name, handler) => { events[name] = handler; },
    requestAnimationFrame: handler => { pending = handler; return 1; },
  };
  Object.defineProperty(page.documentElement, 'scrollHeight', { value: 2000 });
  const elements = page.querySelectorAll('.project-header, .journal-entry, h3');
  const positions = [0, 200.2, 300, 900, 1000];
  elements.forEach((element, index) => {
    element.getBoundingClientRect = () => ({ top: positions[index] - window.scrollY });
  });
  vm.runInNewContext(script, { document: page, window });
  const scroll = y => {
    window.scrollY = y;
    events.scroll();
    pending();
  };
  return { page, scroll };
}

test('builds the outline from headings with unique subsection anchors', () => {
  const { page } = setup();
  const links = [...page.querySelectorAll('.reading-nav a')];
  expect(links.map(link => link.textContent)).toEqual(['Overview', 'First entry', 'Details', 'Second entry', 'Details']);
  for (const link of links) expect(page.getElementById(link.hash.slice(1))).not.toBeNull();
  const ids = [...page.querySelectorAll('[id]')].map(element => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(page.querySelector('progress').value).toBe(0);
  expect(page.querySelector('[aria-current]').textContent).toBe('Overview');
});

test('tracks scrolling, fractional anchor positions, current subsections, and progress endpoints', () => {
  const { page, scroll } = setup();
  scroll(80); // Section starts 120.2px below the viewport top after an anchor jump.
  expect(page.querySelector('[aria-current]').textContent).toBe('First entry');
  scroll(200);
  expect(page.querySelectorAll('[aria-current]')).toHaveLength(1);
  expect(page.querySelector('[aria-current]').hash).toBe('#one-section-1');
  expect(page.querySelector('#one-section-1')).not.toBeNull();
  expect([...page.querySelectorAll('.reading-subsections')].filter(group => !group.hidden)).toHaveLength(1);
  scroll(700);
  expect(page.querySelector('progress').value).toBe(50);
  scroll(1400);
  expect(page.querySelector('.reading-percent').textContent).toBe('100%');
  expect(page.querySelector('[aria-current]').hash).toBe('#two-section-1');
  scroll(0);
  expect(page.querySelector('.reading-percent').textContent).toBe('0%');
});

test('mobile menu exposes expanded state and closes on selection or Escape', () => {
  const { page } = setup();
  const nav = page.querySelector('.reading-nav');
  const toggle = page.querySelector('button');
  toggle.click();
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(nav.classList.contains('is-open')).toBe(true);
  page.querySelector('.reading-nav a').click();
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  toggle.click();
  toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

test.each(['dexvision', 'loopformer'])('%s loads the shared navigation script and keeps a no-JS index', slug => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public/projects', slug, 'index.html'), 'utf8');
  const page = new DOMParser().parseFromString(html, 'text/html');
  expect(page.querySelector('script[src="/projects/journal-navigation.js"][defer]')).not.toBeNull();
  expect(page.querySelectorAll('.journal-index a').length).toBeGreaterThan(0);
});
