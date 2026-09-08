import { render, screen } from '@testing-library/react';
import App from './App';

test('connects the portfolio to the ongoing DexVision journal and resume', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Mukund Shankar' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Read the project journal/ })).toHaveAttribute('href', '/projects/dexvision/');
  expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', 'resume.pdf');
  expect(screen.getByText('Expected December 2026')).toBeInTheDocument();
});

test('shows real project previews with accessible full-size chart links', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: /Simulated Shadow Hand/ })).toHaveAttribute('src', '/projects/dexvision/images/lift.png');
  expect(screen.getByRole('link', { name: /tool-call probe accuracy chart at full size/ })).toHaveAttribute('href', 'tool-call-probes.png');
  expect(screen.getByRole('link', { name: /confidence-probe ROC curve at full size/ })).toHaveAttribute('href', 'confidence-probe-roc.png');
});
