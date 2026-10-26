import { describe, expect, it } from 'vitest';
import { DESKTOP_ICON_URLS } from './desktopIcons';
import { ICON_PACKS, resolveIconPackId } from './iconPacks';

describe('iconPacks', () => {
  it('offers the classic set plus six generated themes', () => {
    expect(ICON_PACKS.map((pack) => pack.id)).toEqual([
      'classic',
      'graphite',
      'cream',
      'ocean',
      'rose',
      'forest',
      'violet',
    ]);
  });

  it('gives every pack a url for each desktop icon key', () => {
    for (const pack of ICON_PACKS) {
      for (const key of Object.keys(DESKTOP_ICON_URLS)) {
        expect(pack.urls[key]).toBeTruthy();
      }
    }
  });

  it('keeps generated packs distinct from the classic pixels', () => {
    const classic = ICON_PACKS.find((pack) => pack.id === 'classic');
    const ocean = ICON_PACKS.find((pack) => pack.id === 'ocean');
    expect(ocean?.urls.terminal).not.toBe(classic?.urls.terminal);
  });

  it('falls back to classic for an unknown stored id', () => {
    expect(resolveIconPackId(null)).toBe('classic');
    expect(resolveIconPackId('nope')).toBe('classic');
    expect(resolveIconPackId('rose')).toBe('rose');
  });
});
