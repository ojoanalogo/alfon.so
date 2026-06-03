import { describe, it, expect } from 'vitest';
import {
  BORDER_DEFAULT,
  CARD_BASE,
  CARD_PADDED,
  CARD_FLAT,
  WINDOW_ACTION_BTN,
  WINDOW_ACTION_BTN_DESTRUCTIVE,
} from './tokens';

describe('CARD tokens', () => {
  it('CARD_BASE carries the default border token', () => {
    expect(CARD_BASE).toContain(BORDER_DEFAULT);
  });

  it('CARD_PADDED extends CARD_BASE and adds the standard padding', () => {
    expect(CARD_PADDED.startsWith(CARD_BASE)).toBe(true);
    expect(CARD_PADDED).toContain('p-4');
  });

  it('CARD_FLAT extends CARD_BASE and adds zero-padding + overflow clipping', () => {
    expect(CARD_FLAT.startsWith(CARD_BASE)).toBe(true);
    expect(CARD_FLAT).toContain('p-0');
    expect(CARD_FLAT).toContain('overflow-hidden');
  });

  it('the two variants only differ from CARD_BASE by their appended classes', () => {
    expect(CARD_PADDED.slice(CARD_BASE.length).trim()).toBe('p-4 sm:p-6');
    expect(CARD_FLAT.slice(CARD_BASE.length).trim()).toBe('p-0 overflow-hidden');
  });

  it('CARD_PADDED is not padding-clipped and CARD_FLAT is not padded', () => {
    expect(CARD_PADDED).not.toContain('overflow-hidden');
    expect(CARD_FLAT).not.toContain('p-4');
  });
});

describe('WINDOW_ACTION_BTN tokens', () => {
  // The base substring shared by both variants is everything they have in common;
  // it is not exported, so derive it from the default variant up to its first
  // variant-specific class.
  const sharedBase = WINDOW_ACTION_BTN.slice(0, WINDOW_ACTION_BTN.indexOf(' text-secondary'));

  it('both variants share the ACTION_BTN_BASE substring', () => {
    expect(sharedBase.length).toBeGreaterThan(0);
    expect(WINDOW_ACTION_BTN).toContain(sharedBase);
    expect(WINDOW_ACTION_BTN_DESTRUCTIVE).toContain(sharedBase);
  });

  it('the default variant is the neutral secondary button', () => {
    expect(WINDOW_ACTION_BTN).toContain('text-secondary');
    expect(WINDOW_ACTION_BTN).not.toContain('text-[rgb(220_38_38)]');
  });

  it('the destructive variant carries the red label token', () => {
    expect(WINDOW_ACTION_BTN_DESTRUCTIVE).toContain('text-[rgb(220_38_38)]');
    expect(WINDOW_ACTION_BTN_DESTRUCTIVE).toContain('hover:border-[rgb(220_38_38)]');
  });
});
