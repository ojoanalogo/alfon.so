import { describe, it, expect } from 'vitest';
import {
  POST_WINDOW_PREFIX,
  BROWSER_APP_ID,
  postWindowId,
  isPostWindowId,
  postSlugFromWindowId,
} from './postWindow';

describe('postWindowId', () => {
  it('prefixes the slug with the post window prefix', () => {
    expect(postWindowId('my-slug')).toBe('post:my-slug');
  });

  it('uses the exported prefix constant', () => {
    expect(postWindowId('x')).toBe(`${POST_WINDOW_PREFIX}x`);
  });
});

describe('isPostWindowId', () => {
  it('recognizes ids produced by postWindowId', () => {
    expect(isPostWindowId(postWindowId('x'))).toBe(true);
  });

  it('rejects non-post app ids', () => {
    expect(isPostWindowId(BROWSER_APP_ID)).toBe(false);
    expect(isPostWindowId('browser')).toBe(false);
  });
});

describe('postSlugFromWindowId', () => {
  it('round-trips a slug through encode/decode', () => {
    expect(postSlugFromWindowId(postWindowId('a-b'))).toBe('a-b');
  });

  it('recovers a slug that itself contains the prefix', () => {
    // the colon-bearing slug survives because only the leading prefix is stripped
    expect(postSlugFromWindowId(postWindowId('post:nested'))).toBe('post:nested');
  });
});
