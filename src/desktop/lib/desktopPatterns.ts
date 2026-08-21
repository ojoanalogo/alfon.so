import type { DesktopPatternOption } from '../types';

const PATTERN_STROKE = '#71717a';

export const DEFAULT_DESKTOP_PATTERN_ID = 'crosshatch';

function svgPattern(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const DESKTOP_PATTERNS: DesktopPatternOption[] = [
  {
    id: 'crosshatch',
    label: 'Trama',
    backgroundImage: svgPattern(
      `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path d="M-2 2l4-4M2 10l8-8M10 14l4-4" fill="none" stroke="${PATTERN_STROKE}" stroke-opacity="0.28" stroke-width="0.75"/><path d="M-2 10l4 4M2 2l8 8M10 -2l4 4" fill="none" stroke="${PATTERN_STROKE}" stroke-opacity="0.28" stroke-width="0.75"/></svg>`,
    ),
    backgroundSize: '12px 12px',
    opacity: 0.42,
  },
  {
    id: 'noise',
    label: 'Grano',
    backgroundImage: svgPattern(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.35"/></svg>`,
    ),
    backgroundSize: '128px 128px',
    opacity: 0.35,
  },
  {
    id: 'dots',
    label: 'Puntos',
    backgroundImage: svgPattern(
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="2" cy="2" r="1.5" fill="${PATTERN_STROKE}" fill-opacity="0.45"/></svg>`,
    ),
    backgroundSize: '20px 20px',
    opacity: 0.55,
  },
  {
    id: 'grid',
    label: 'Cuadrícula',
    backgroundImage: svgPattern(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M24 0H0V24" fill="none" stroke="${PATTERN_STROKE}" stroke-opacity="0.35" stroke-width="1"/></svg>`,
    ),
    backgroundSize: '24px 24px',
    opacity: 0.5,
  },
  {
    id: 'diagonal',
    label: 'Rayas',
    backgroundImage: svgPattern(
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M-1 1l2-2M0 8L8 0M7 9l2-2" fill="none" stroke="${PATTERN_STROKE}" stroke-opacity="0.35" stroke-width="1"/></svg>`,
    ),
    backgroundSize: '8px 8px',
    opacity: 0.45,
  },
  {
    id: 'hex',
    label: 'Hexágonos',
    backgroundImage: svgPattern(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="24"><path d="M14 0l12 7v10l-12 7L2 17V7z" fill="none" stroke="${PATTERN_STROKE}" stroke-opacity="0.28" stroke-width="1"/></svg>`,
    ),
    backgroundSize: '28px 24px',
    opacity: 0.42,
  },
];

export function resolvePatternId(id: string | null, availableIds: Set<string>): string | null {
  if (!id) return null;
  return availableIds.has(id) ? id : null;
}
