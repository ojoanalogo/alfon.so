import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FullscreenToggle from './FullscreenToggle';

function getButton(): HTMLButtonElement {
  return screen.getByRole('button') as HTMLButtonElement;
}

beforeEach(() => {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => null,
  });
  document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
  document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FullscreenToggle', () => {
  it('renders a button with the fullscreen tooltip dataset', () => {
    render(<FullscreenToggle />);
    const btn = getButton();
    expect(btn.getAttribute('data-tooltip')).toBe('Pantalla completa');
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('forwards a custom className while keeping base classes', () => {
    render(<FullscreenToggle className="my-custom-class" />);
    const btn = getButton();
    expect(btn.className.includes('my-custom-class')).toBe(true);
    expect(btn.className.includes('tooltip')).toBe(true);
    expect(btn.className.includes('cursor-pointer')).toBe(true);
  });

  it('shows the expand icon and enter label when not fullscreen', () => {
    const { container } = render(<FullscreenToggle />);
    const btn = getButton();
    expect(btn.getAttribute('aria-label')).toBe('Pantalla completa');
    expect(container.querySelector('svg.lucide-expand')).toBeTruthy();
    expect(container.querySelector('svg.lucide-shrink')).toBeNull();
  });

  it('shows the shrink icon and exit label when fullscreen', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    const { container } = render(<FullscreenToggle />);
    const btn = getButton();
    expect(btn.getAttribute('aria-label')).toBe('Salir de pantalla completa');
    expect(container.querySelector('svg.lucide-shrink')).toBeTruthy();
    expect(container.querySelector('svg.lucide-expand')).toBeNull();
  });

  it('requests fullscreen when clicked while not fullscreen', () => {
    render(<FullscreenToggle />);
    fireEvent.click(getButton());
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(document.exitFullscreen).not.toHaveBeenCalled();
  });

  it('exits fullscreen when clicked while fullscreen', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    render(<FullscreenToggle />);
    fireEvent.click(getButton());
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(document.documentElement.requestFullscreen).not.toHaveBeenCalled();
  });

  it('updates the icon when fullscreenchange fires', () => {
    const { container } = render(<FullscreenToggle />);
    expect(container.querySelector('svg.lucide-expand')).toBeTruthy();

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    fireEvent(document, new Event('fullscreenchange'));

    expect(container.querySelector('svg.lucide-shrink')).toBeTruthy();
    expect(container.querySelector('svg.lucide-expand')).toBeNull();
  });
});
