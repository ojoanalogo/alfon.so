import { describe, expect, it } from 'vitest';
import { DESKTOP_PATTERNS } from './desktopPatterns';

describe('DESKTOP_PATTERNS', () => {
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

  it('keeps noise filter references single-encoded', () => {
    const noise = DESKTOP_PATTERNS.find((entry) => entry.id === 'noise');
    expect(noise?.backgroundImage).toContain('url(%23n)');
    expect(noise?.backgroundImage).not.toContain('url(%2523n)');
  });

  it('includes every pattern id', () => {
    expect(DESKTOP_PATTERNS.map((pattern) => pattern.id)).toEqual([
      'dots',
      'grid',
      'diagonal',
      'crosshatch',
      'hex',
      'noise',
    ]);
  });
});
