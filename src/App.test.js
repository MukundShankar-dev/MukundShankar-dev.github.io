import { render, screen, within } from '@testing-library/react';
import App from './App';

test('connects the portfolio to the ongoing DexVision journal and resume', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Mukund Shankar' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Read the project journal/ })).toHaveAttribute('href', '/projects/dexvision/');
  expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', 'resume.pdf');
  expect(screen.getByText('Expected December 2026')).toBeInTheDocument();
});

test('leads with recent technical projects and keeps project goals distinct from results', () => {
  render(<App />);
  const titles = screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent);
  expect(titles.slice(0, 4)).toEqual([
    'DexVision',
    'Tool-Calling Decisions in Small LLMs',
    'Confidence Probes for Language Models',
    'Machine Learning Engineer Intern · JuumeAI',
  ]);
  const toolCalling = screen.getByRole('article', { name: 'Tool-Calling Decisions in Small LLMs' });
  expect(within(toolCalling).getByText('47.1% to 79.9%')).toBeInTheDocument();
  const confidence = screen.getByRole('article', { name: 'Confidence Probes for Language Models' });
  expect(within(confidence).getByText('0.953 ROC-AUC on held-out TriviaQA')).toBeInTheDocument();
  const dexvision = screen.getByRole('article', { name: 'DexVision' });
  expect(within(dexvision).getAllByRole('listitem')).toHaveLength(3);
  expect(within(dexvision).getByText(/Planning visual perception/)).toBeInTheDocument();
  expect(within(dexvision).getByText('In progress')).toBeInTheDocument();
  expect(screen.getAllByText('In progress')).toHaveLength(1);
  const juume = screen.getByRole('article', { name: 'Machine Learning Engineer Intern · JuumeAI' });
  expect(within(juume).getByText(/then-frontier LLM baselines without retrieval/)).toBeInTheDocument();
  expect(screen.queryByText(/0\.97 AUC-ROC/)).not.toBeInTheDocument();
});

test('places project headings before previews and preserves compact teaching bullets', () => {
  render(<App />);
  for (const title of ['Tool-Calling Decisions in Small LLMs', 'Confidence Probes for Language Models', 'DexVision']) {
    const article = screen.getByRole('article', { name: title });
    expect([...article.children].map(child => child.tagName)).toEqual(['HEADER', 'FIGURE', 'DIV']);
    expect(within(article).getByRole('heading', { level: 3 })).toBeInTheDocument();
  }
  const teaching = screen.getByRole('article', { name: 'Teaching Assistant · University of Maryland' });
  expect(within(teaching).getAllByRole('listitem')).toHaveLength(2);
  expect(within(teaching).getByText(/approximately 30 students/)).toBeInTheDocument();
});

test('shows real project previews with accessible full-size chart links', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: /Simulated Shadow Hand/ })).toHaveAttribute('src', '/projects/dexvision/images/lift.png');
  expect(screen.getByRole('link', { name: /tool-call probe accuracy chart at full size/ })).toHaveAttribute('href', 'tool-call-probes.png');
  expect(screen.getByRole('link', { name: /confidence-probe ROC curve at full size/ })).toHaveAttribute('href', 'confidence-probe-roc.png');
});
