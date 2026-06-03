import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../state/ThemeContext';

function renderToggle(props?: { className?: string }) {
  return render(
    <ThemeProvider>
      <ThemeToggle {...props} />
    </ThemeProvider>,
  );
}

function getButton(): HTMLButtonElement {
  return screen.getByRole('button') as HTMLButtonElement;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.themePreference;
  // jsdom has no matchMedia; stub it so `system` resolves to light (no dark match).
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ThemeToggle', () => {
  it('renders a button with the toggle tooltip dataset', () => {
    renderToggle();
    const btn = getButton();
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('data-tooltip')).toBe('Cambiar tema');
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('forwards a custom className while keeping base classes', () => {
    renderToggle({ className: 'my-custom-class' });
    const btn = getButton();
    expect(btn.className.includes('my-custom-class')).toBe(true);
    expect(btn.className.includes('tooltip')).toBe(true);
    expect(btn.className.includes('cursor-pointer')).toBe(true);
  });

  it('does not append "undefined" when no className is given', () => {
    renderToggle();
    const btn = getButton();
    expect(btn.className.includes('undefined')).toBe(false);
  });

  // --- system (default) state -------------------------------------------------

  it('shows the system icon and system aria-label when following system (light)', () => {
    // No stored preference → preference === 'system', matchMedia → light.
    const { container } = renderToggle();
    const btn = getButton();
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(btn.getAttribute('aria-label')).toBe(
      'Tema del sistema (claro). Clic para fijar manualmente.',
    );
    expect(btn.getAttribute('title')).toBe(
      'Tema del sistema (claro). Clic para fijar manualmente.',
    );
    // lucide Monitor renders an svg with the `lucide-monitor` class.
    expect(container.querySelector('svg.lucide-monitor')).toBeTruthy();
    expect(container.querySelector('svg.lucide-sun')).toBeNull();
    expect(container.querySelector('svg.lucide-moon')).toBeNull();
  });

  // --- explicit light state ---------------------------------------------------

  it('shows the sun icon and "switch to dark" label when fixed to light', () => {
    localStorage.setItem('theme', 'light');
    const { container } = renderToggle();
    const btn = getButton();
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
    expect(btn.getAttribute('title')).toBe('Tema fijado (claro). Clic para alternar.');
    expect(container.querySelector('svg.lucide-sun')).toBeTruthy();
    expect(container.querySelector('svg.lucide-monitor')).toBeNull();
    expect(container.querySelector('svg.lucide-moon')).toBeNull();
  });

  // --- explicit dark state ----------------------------------------------------

  it('shows the moon icon and "switch to light" label when fixed to dark', () => {
    localStorage.setItem('theme', 'dark');
    const { container } = renderToggle();
    const btn = getButton();
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo claro');
    expect(btn.getAttribute('title')).toBe('Tema fijado (oscuro). Clic para alternar.');
    expect(container.querySelector('svg.lucide-moon')).toBeTruthy();
    expect(container.querySelector('svg.lucide-sun')).toBeNull();
    expect(container.querySelector('svg.lucide-monitor')).toBeNull();
  });

  it('uses the dark system label when system resolves to dark', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    renderToggle();
    const btn = getButton();
    expect(btn.getAttribute('aria-label')).toBe(
      'Tema del sistema (oscuro). Clic para fijar manualmente.',
    );
  });

  // --- toggle behavior --------------------------------------------------------

  it('clicking from explicit light flips to dark (document class + storage + label)', () => {
    localStorage.setItem('theme', 'light');
    const { container } = renderToggle();
    const btn = getButton();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(btn);

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo claro');
    // AnimatePresence (mode="sync") keeps the exiting icon mounted during its
    // exit animation, so we only assert the new (moon) icon is present.
    expect(container.querySelector('svg.lucide-moon')).toBeTruthy();
  });

  it('clicking from explicit dark flips to light', () => {
    localStorage.setItem('theme', 'dark');
    const { container } = renderToggle();
    const btn = getButton();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(btn);

    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
    expect(container.querySelector('svg.lucide-sun')).toBeTruthy();
  });

  it('clicking while following system fixes a manual preference (system → light → dark)', () => {
    // system resolves to light; toggling from system writes the OPPOSITE of effective.
    const { container } = renderToggle();
    const btn = getButton();
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(container.querySelector('svg.lucide-monitor')).toBeTruthy();

    fireEvent.click(btn);

    // effective was light → toggleThemePreference writes 'dark'.
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo claro');
    expect(container.querySelector('svg.lucide-moon')).toBeTruthy();
  });

  it('two consecutive clicks return to the original light state', () => {
    localStorage.setItem('theme', 'light');
    renderToggle();
    const btn = getButton();

    fireEvent.click(btn);
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(btn);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
  });

  it('renders exactly one theme icon at a time', () => {
    localStorage.setItem('theme', 'light');
    const { container } = renderToggle();
    expect(container.querySelectorAll('svg').length).toBe(1);
  });
});
