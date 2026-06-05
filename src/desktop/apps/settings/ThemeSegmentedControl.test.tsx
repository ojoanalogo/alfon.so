import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider } from '@desktop/state/ThemeContext';
import { stubMatchMedia } from '@test/helpers';
import ThemeSegmentedControl from './ThemeSegmentedControl';

function renderControl() {
  return render(
    <ThemeProvider>
      <ThemeSegmentedControl />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ThemeSegmentedControl', () => {
  it('renders the three theme options', () => {
    renderControl();

    expect(screen.getByRole('group', { name: 'Tema' })).toBeTruthy();
    expect(screen.getByText('Sistema')).toBeTruthy();
    expect(screen.getByText('Claro')).toBeTruthy();
    expect(screen.getByText('Oscuro')).toBeTruthy();
  });

  it('selects "Sistema" by default (no stored preference)', () => {
    renderControl();

    const system = screen.getByText('Sistema').closest('button');
    expect(system?.getAttribute('aria-pressed')).toBe('true');
    const dark = screen.getByText('Oscuro').closest('button');
    expect(dark?.getAttribute('aria-pressed')).toBe('false');
  });

  it('picking "Oscuro" calls setTheme → persists dark + moves the pressed state', () => {
    renderControl();

    fireEvent.click(screen.getByText('Oscuro'));

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByText('Oscuro').closest('button')?.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Sistema').closest('button')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('picking "Claro" persists light and removes the dark class', () => {
    renderControl();

    fireEvent.click(screen.getByText('Oscuro'));
    fireEvent.click(screen.getByText('Claro'));

    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(screen.getByText('Claro').closest('button')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('picking "Sistema" clears the stored preference', () => {
    renderControl();

    fireEvent.click(screen.getByText('Oscuro'));
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(screen.getByText('Sistema'));
    expect(localStorage.getItem('theme')).toBeNull();
    expect(screen.getByText('Sistema').closest('button')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
