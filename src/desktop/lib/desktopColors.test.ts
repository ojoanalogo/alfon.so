import { describe, it, expect } from 'vitest';
import { DESKTOP_COLORS, resolveDesktopColorValue } from './desktopColors';

describe('resolveDesktopColorValue', () => {
  it('maps the "default" option to the background token', () => {
    expect(resolveDesktopColorValue('default')).toBe('var(--color-background)');
  });

  it('returns the literal hex for a known color', () => {
    expect(resolveDesktopColorValue('blue')).toBe('#60a5fa');
    expect(resolveDesktopColorValue('red')).toBe('#f87171');
  });

  it('falls back to the first option for an unknown id', () => {
    // colors[0] is the "default" automatic option → background token
    expect(resolveDesktopColorValue('does-not-exist')).toBe('var(--color-background)');
  });

  it('every catalogued color resolves to a non-empty value', () => {
    for (const color of DESKTOP_COLORS) {
      expect(resolveDesktopColorValue(color.id)).toBeTruthy();
    }
  });
});
