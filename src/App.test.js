import { render, screen, within } from '@testing-library/react';
import App from './App';
import { projects } from './data/projects';

test('separates experience, selected work, education, and earlier work', () => {
  render(<App />);
  expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(['Experience', 'Selected Work', 'Education', 'Earlier Work']);
  expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', 'resume.pdf');
  expect(screen.getByRole('link', { name: 'Project journal' })).toHaveAttribute('href', '/projects/dexvision/');
  expect(screen.getByText('Expected Dec 2026')).toBeInTheDocument();
  expect(screen.getByText(/Currently, I'm researching long-form language generation/)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /Research Assistant/ })).not.toBeInTheDocument();
});

test('projects are concise, illustrated rows in editorial order without resume bullets', () => {
  render(<App />);
  const section = screen.getByRole('region', { name: 'Selected Work' });
  expect(within(section).getAllByRole('heading', { level: 3 }).map(h => h.textContent)).toEqual([
    'Full Time Brief', 'DexVision', 'Diagnosing Tool-Call Decision Making in Small LLMs', 'Confidence Probes for Language Models',
  ]);
  expect(within(section).queryByRole('list')).not.toBeInTheDocument();
  for (const article of within(section).getAllByRole('article')) {
    expect(within(article).getByRole('img')).toHaveAttribute('loading', 'lazy');
    expect(within(article).getByRole('img')).toHaveAttribute('width');
    expect(within(article).getByRole('img')).toHaveAttribute('height');
  }
  expect(screen.queryByText(/47.1%|0.953 ROC-AUC/)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'LoopFormer' })).not.toBeInTheDocument();
  const loopformer = projects.find(project => project.slug === 'loopformer');
  expect(loopformer.visible).toBe(false);
  expect(loopformer.image).toBeTruthy();
  expect(loopformer.links[0].href).toBe('https://github.com/MukundShankar-dev/loopformer');
});

test('experience retains engineering and research evidence and teaching bullets', () => {
  render(<App />);
  const experience = screen.getByRole('region', { name: 'Experience' });
  expect(within(experience).getAllByRole('article')).toHaveLength(3);
  for (const article of within(experience).getAllByRole('article')) {
    expect(within(article).getAllByRole('listitem')).toHaveLength(2);
  }
  expect(within(experience).getByText(/10K\+ documents.*17%/)).toBeInTheDocument();
  expect(within(experience).getByText(/90% R@1 on KIT-ML and HumanML3D/)).toBeInTheDocument();
  expect(within(experience).getByText(/39,000 videos/)).toBeInTheDocument();
  expect(within(experience).getByText(/approximately 30 students/)).toBeInTheDocument();
});

test('keeps external links safe and historical links available', () => {
  render(<App />);
  for (const link of screen.getAllByRole('link')) {
    if (link.getAttribute('target') === '_blank') {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  }
  const earlier = screen.getByRole('region', { name: 'Earlier Work' });
  expect(within(earlier).getByRole('link', { name: 'App Store' })).toHaveAttribute('href', expect.stringContaining('id6462011570'));
  expect(within(earlier).getByText(/YOLOv5 balloon detection/)).toBeInTheDocument();
});
