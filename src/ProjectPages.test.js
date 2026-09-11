import fs from 'fs';
import path from 'path';

const slugs = ['full-time-brief', 'tool-calling', 'confidence-probes'];

test.each(slugs)('%s is a self-contained static page with metadata and working local assets', slug => {
  const filename = path.join(process.cwd(), 'public/projects', slug, 'index.html');
  const page = new DOMParser().parseFromString(fs.readFileSync(filename, 'utf8'), 'text/html');
  expect(page.querySelector('title').textContent).toContain('Mukund Shankar');
  expect(page.querySelector('meta[name="description"]').content.length).toBeGreaterThan(30);
  expect(page.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`https://mukundshankar-dev.github.io/projects/${slug}/`);
  expect(page.querySelectorAll('a[href="/#projects"]')).toHaveLength(2);
  for (const element of page.querySelectorAll('img[src], a[href], link[href]')) {
    const url = element.getAttribute('src') || element.getAttribute('href');
    if (/^https?:/.test(url)) continue;
    const [pathname, hash] = url.split('#');
    if (!pathname) {
      expect(page.getElementById(hash)).not.toBeNull();
      continue;
    }
    const local = pathname.startsWith('/') ? path.join(process.cwd(), 'public', pathname) : path.resolve(path.dirname(filename), pathname);
    expect(fs.existsSync(local)).toBe(true);
  }
});

test('research detail pages preserve the original reports and quantitative claims', () => {
  const read = filename => fs.readFileSync(path.join(process.cwd(), filename));
  expect(read('public/projects/tool-calling/report.pdf')).toEqual(read('src/files/tool_call_report.pdf'));
  expect(read('public/projects/confidence-probes/report.pdf')).toEqual(read('src/files/723_report.pdf'));
  expect(read('public/projects/tool-calling/index.html').toString()).toMatch(/47.1% to 79.9%/);
  expect(read('public/projects/confidence-probes/index.html').toString()).toMatch(/0.953 ROC-AUC on held-out TriviaQA/);
});

test('keeps the public Full Time Brief page concise and product-focused', () => {
  const filename = path.join(process.cwd(), 'public/projects/full-time-brief/index.html');
  const page = new DOMParser().parseFromString(fs.readFileSync(filename, 'utf8'), 'text/html');
  expect([...page.querySelectorAll('main section h2')].map(heading => heading.textContent)).toEqual(['Overview', 'My role', 'Building it', 'Links']);
  expect(page.querySelector('section[aria-labelledby="links"] .project-links').textContent).toContain('Visit Full Time Brief');
  expect(page.body.textContent).not.toMatch(/Codex|cron|rate limit|refresh interval|reconciliation|overturned goal|added time|extra time|5–12 stories|image selection|automatically publishes/i);
});
