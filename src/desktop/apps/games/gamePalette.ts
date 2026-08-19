/** Theme-aware canvas colors read from CSS custom properties. */
export interface GamePalette {
  canvas: string;
  grid: string;
  text: string;
  textMuted: string;
  accent: string;
  accentAlt: string;
  danger: string;
  warning: string;
}

const FALLBACK: GamePalette = {
  canvas: '#18181b',
  grid: '#27272a',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  accent: '#22c55e',
  accentAlt: '#38bdf8',
  danger: '#ef4444',
  warning: '#fbbf24',
};

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function readGamePalette(): GamePalette {
  return {
    canvas: readCssVar('--color-background', FALLBACK.canvas),
    grid: readCssVar('--color-hairline', FALLBACK.grid),
    text: readCssVar('--color-primary', FALLBACK.text),
    textMuted: readCssVar('--color-muted', FALLBACK.textMuted),
    accent: '#22c55e',
    accentAlt: '#38bdf8',
    danger: '#ef4444',
    warning: '#fbbf24',
  };
}

export function overlayRgba(alpha = 0.55): string {
  const bg = readCssVar('--color-background', '#18181b');
  if (bg.startsWith('#')) {
    const hex = bg.replace('#', '');
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    if (![r, g, b].some(Number.isNaN)) {
      return `rgb(${r} ${g} ${b} / ${alpha})`;
    }
  }
  return `rgb(0 0 0 / ${alpha})`;
}
