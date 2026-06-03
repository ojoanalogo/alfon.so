import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SunIcon, MoonIcon, SystemIcon } from './ThemeIcons';

describe('ThemeIcons', () => {
  it('renders SunIcon as an svg', () => {
    const { container } = render(<SunIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders MoonIcon as an svg', () => {
    const { container } = render(<MoonIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders SystemIcon as an svg', () => {
    const { container } = render(<SystemIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies the default className when none is provided', () => {
    const { container } = render(<SunIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('h-4');
    expect(svg?.getAttribute('class')).toContain('w-4');
  });

  it('applies a custom className when provided', () => {
    const { container } = render(<MoonIcon className="custom-size h-8 w-8" />);
    const svg = container.querySelector('svg');
    const cls = svg?.getAttribute('class') ?? '';
    expect(cls).toContain('custom-size');
    expect(cls).not.toContain('h-4 w-4');
  });

  it('marks icons as decorative via aria-hidden', () => {
    const { container } = render(<SystemIcon />);
    const svg = container.querySelector('svg');
    // lucide forwards aria-hidden to the rendered svg
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders distinct lucide icons for Sun and Moon', () => {
    const sun = render(<SunIcon />).container.querySelector('svg');
    const moon = render(<MoonIcon />).container.querySelector('svg');
    // lucide tags each icon with its own class (e.g. lucide-sun / lucide-moon)
    expect(sun?.getAttribute('class')).not.toBe(moon?.getAttribute('class'));
  });
});
