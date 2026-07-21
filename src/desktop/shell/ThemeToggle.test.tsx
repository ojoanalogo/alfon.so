import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../state/ThemeContext';
import { setupThemeDropdowns } from '@/lib/theme';
import { stubMatchMedia } from '@test/helpers';

function renderToggle(props?: { className?: string }) {
  return render(
    <ThemeProvider>
      <ThemeToggle {...props} />
    </ThemeProvider>,
  );
}

function getTrigger(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Cambiar tema' });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.themePreference;
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ThemeToggle', () => {
  it('renders a dropdown trigger with the theme tooltip dataset', () => {
    renderToggle();
    const trigger = getTrigger();
    expect(trigger.getAttribute('data-tooltip')).toBe('Cambiar tema');
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('forwards a custom className on the dropdown container', () => {
    const { container } = renderToggle({ className: 'my-custom-class' });
    const dropdown = container.querySelector('.theme-dropdown');
    expect(dropdown?.className.includes('my-custom-class')).toBe(true);
    expect(dropdown?.className.includes('theme-dropdown')).toBe(true);
  });

  it('shows the system icon when following system (light)', () => {
    renderToggle();
    const trigger = getTrigger();
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(trigger.querySelector('svg.lucide-monitor')).toBeTruthy();
    expect(trigger.querySelector('svg.lucide-sun')).toBeNull();
    expect(trigger.querySelector('svg.lucide-moon')).toBeNull();
  });

  it('shows the sun icon when fixed to light', () => {
    localStorage.setItem('theme', 'light');
    renderToggle();
    const trigger = getTrigger();
    expect(trigger.querySelector('svg.lucide-sun')).toBeTruthy();
    expect(trigger.querySelector('svg.lucide-monitor')).toBeNull();
    expect(trigger.querySelector('svg.lucide-moon')).toBeNull();
  });

  it('shows the moon icon when fixed to dark', () => {
    localStorage.setItem('theme', 'dark');
    renderToggle();
    const trigger = getTrigger();
    expect(trigger.querySelector('svg.lucide-moon')).toBeTruthy();
    expect(trigger.querySelector('svg.lucide-sun')).toBeNull();
    expect(trigger.querySelector('svg.lucide-monitor')).toBeNull();
  });

  it('opens the menu with Sistema, Claro, and Oscuro options', () => {
    renderToggle();
    fireEvent.click(getTrigger());
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('listbox', { name: 'Opciones de tema' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Sistema' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Claro' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Oscuro' })).toBeTruthy();
  });

  it('selecting Oscuro applies dark theme and closes the menu', () => {
    const { container } = renderToggle();
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('option', { name: 'Oscuro' }));

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.theme-dropdown-menu')?.classList.contains('hidden')).toBe(
      true,
    );
  });

  it('selecting Claro applies light theme', () => {
    localStorage.setItem('theme', 'dark');
    renderToggle();
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('option', { name: 'Claro' }));

    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('selecting Sistema clears the stored override', () => {
    localStorage.setItem('theme', 'dark');
    renderToggle();
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('option', { name: 'Sistema' }));

    expect(localStorage.getItem('theme')).toBeNull();
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  it('marks the active preference in the menu', () => {
    localStorage.setItem('theme', 'light');
    renderToggle();
    fireEvent.click(getTrigger());

    expect(screen.getByRole('option', { name: 'Claro' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByRole('option', { name: 'Oscuro' }).getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('closes the menu when clicking outside', () => {
    renderToggle();
    fireEvent.click(getTrigger());
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');

    fireEvent.pointerDown(document.body);
    expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('is not closed by Astro setupThemeDropdowns global click handler', () => {
    setupThemeDropdowns();
    renderToggle();
    fireEvent.click(getTrigger());
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('option', { name: 'Oscuro' })).toBeTruthy();
  });
});
