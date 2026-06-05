import { describe, it, expect } from 'vitest';
import { KONAMI_SEQUENCE, createKonamiMatcher } from './konami';

function feed(matcher: ReturnType<typeof createKonamiMatcher>, keys: string[]): boolean {
  let last = false;
  for (const key of keys) last = matcher.push(key);
  return last;
}

describe('createKonamiMatcher', () => {
  it('returns true only on the final key of a correct sequence', () => {
    const matcher = createKonamiMatcher();
    const all = [...KONAMI_SEQUENCE];
    const last = all.pop()!;
    for (const key of all) expect(matcher.push(key)).toBe(false);
    expect(matcher.push(last)).toBe(true);
  });

  it('resets on a wrong key, then still completes a fresh full sequence', () => {
    const matcher = createKonamiMatcher();
    matcher.push('ArrowUp');
    expect(matcher.push('x')).toBe(false); // wrong key resets
    expect(feed(matcher, [...KONAMI_SEQUENCE])).toBe(true);
  });

  it('keeps the valid partial match when a mismatching key equals an earlier key', () => {
    const matcher = createKonamiMatcher();
    matcher.push('ArrowUp'); // index 1
    matcher.push('ArrowUp'); // index 2, expected next is 'ArrowDown'
    // 'ArrowUp' mismatches the expected 'ArrowDown'; KMP rewinds to the longest
    // still-valid prefix (the two leading ArrowUps), so progress is preserved
    // rather than discarded — feeding the sequence from index 1 onward completes.
    matcher.push('ArrowUp');
    const rest = KONAMI_SEQUENCE.slice(1);
    expect(feed(matcher, [...rest])).toBe(true);
  });

  it('resyncs after an extra leading key instead of hard-resetting', () => {
    const matcher = createKonamiMatcher();
    // One fat-fingered extra ArrowUp before the real code: the trailing 10 keys
    // are the exact sequence, so a KMP resync should still complete it.
    expect(feed(matcher, ['ArrowUp', ...KONAMI_SEQUENCE])).toBe(true);
  });

  it('matches b/a case-insensitively', () => {
    const matcher = createKonamiMatcher();
    const upper = KONAMI_SEQUENCE.map((k) => (k === 'b' || k === 'a' ? k.toUpperCase() : k));
    expect(feed(matcher, upper)).toBe(true);
  });

  it('resets after completion so a second full sequence completes again', () => {
    const matcher = createKonamiMatcher();
    expect(feed(matcher, [...KONAMI_SEQUENCE])).toBe(true);
    expect(feed(matcher, [...KONAMI_SEQUENCE])).toBe(true);
  });
});
