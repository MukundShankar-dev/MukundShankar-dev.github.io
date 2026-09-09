import fs from 'fs';
import path from 'path';

const journalPath = path.join(process.cwd(), 'public/projects/dexvision/index.html');
const journal = new DOMParser().parseFromString(fs.readFileSync(journalPath, 'utf8'), 'text/html');

test('presents four chronological phases without internal subphase labels', () => {
  const entries = [...journal.querySelectorAll('.journal-entry')];
  expect(entries.map(entry => entry.id)).toEqual([
    'hand-control', 'demonstration-data', 'learning-loop', 'pick-place-anchor',
  ]);
  expect(entries.map(entry => entry.querySelector('.eyebrow').textContent)).toEqual([
    'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4',
  ]);
  expect(journal.querySelector('.checkpoint')).toBeNull();
  expect(journal.body.textContent).not.toMatch(/through\s+(?:checkpoint\s+)?4\.5A|as of\s+\w+\s+\d/i);
  for (const heading of journal.querySelectorAll('h2, h3')) {
    expect(heading.textContent).not.toMatch(/\b[1-4]\.\d+[A-Z]?\b/);
  }
});

test('keeps unique anchors and resolves navigation and accessible heading references', () => {
  const ids = [...journal.querySelectorAll('[id]')].map(element => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const link of journal.querySelectorAll('a[href^="#"]')) {
    expect(journal.getElementById(link.getAttribute('href').slice(1))).not.toBeNull();
  }
  for (const element of journal.querySelectorAll('[aria-labelledby]')) {
    for (const id of element.getAttribute('aria-labelledby').split(/\s+/)) {
      expect(journal.getElementById(id)).not.toBeNull();
    }
  }
});

test('retains three replay images with local assets, descriptions, and full-size links', () => {
  const images = [...journal.querySelectorAll('.replay-gallery img')];
  expect(images).toHaveLength(3);
  for (const image of images) {
    const source = image.getAttribute('src');
    expect(fs.existsSync(path.resolve(path.dirname(journalPath), source))).toBe(true);
    expect(image.getAttribute('alt').length).toBeGreaterThan(20);
    expect(image.closest('a').getAttribute('href')).toBe(source);
  }
  expect(fs.existsSync(path.join(process.cwd(), 'public', journal.querySelector('link[rel="stylesheet"]').getAttribute('href')))).toBe(true);
});
