import { describe, expect, it } from 'vitest';
import { DEFAULT_DESKTOP_PATTERN_ID, DESKTOP_PATTERNS } from './desktopPatterns';

describe('DESKTOP_PATTERNS', () => {
  it('lists cuadrícula/grid first and uses trama as the default id', () => {
    expect(DEFAULT_DESKTOP_PATTERN_ID).toBe('crosshatch');
    expect(DESKTOP_PATTERNS[0]?.id).toBe('grid');
    expect(DESKTOP_PATTERNS[0]?.label).toBe('Cuadrícula');
  });

  it('uses a 16px grid tile for medium-sized squares', () => {
    const grid = DESKTOP_PATTERNS.find((entry) => entry.id === 'grid');
    expect(grid?.backgroundSize).toBe('16px 16px');
    expect(grid?.backgroundImage).toContain('width%3D%2216%22');
    expect(grid?.backgroundImage).toContain('M16%200H0V16');
  });

  it('encodes SVG data URIs once (no double-encoded hash)', () => {
    for (const pattern of DESKTOP_PATTERNS) {
      expect(pattern.backgroundImage).not.toContain('%2523');
    }
  });

  it('embeds stroke/fill colors with a single-encoded hash', () => {
    for (const pattern of DESKTOP_PATTERNS.filter((entry) => entry.id !== 'noise')) {
      expect(pattern.backgroundImage).toContain('%2371717a');
    }
  });

  it('uses diagonal crosshatch lines for trama (not an orthogonal mini-grid)', () => {
    const crosshatch = DESKTOP_PATTERNS.find((entry) => entry.id === 'crosshatch');
    expect(crosshatch?.backgroundImage).toContain('l4-4');
    expect(crosshatch?.backgroundImage).toContain('l4%204');
  });

  it('keeps noise filter references single-encoded', () => {
    const noise = DESKTOP_PATTERNS.find((entry) => entry.id === 'noise');
    expect(noise?.backgroundImage).toContain('url(%23n)');
    expect(noise?.backgroundImage).not.toContain('url(%2523n)');
  });

  it('includes every pattern id', () => {
    expect(DESKTOP_PATTERNS.map((pattern) => pattern.id)).toEqual([
      'grid',
      'crosshatch',
      'noise',
      'dots',
      'diagonal',
    ]);
  });
});
