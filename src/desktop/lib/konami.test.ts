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

  it('restarts the count at 1 when a mismatching key equals the first key', () => {
    const matcher = createKonamiMatcher();
    matcher.push('ArrowUp'); // index 1
    matcher.push('ArrowUp'); // index 2, expected next is 'ArrowDown'
    // 'ArrowUp' mismatches the expected 'ArrowDown', but equals sequence[0],
    // so progress restarts at index 1 rather than 0.
    matcher.push('ArrowUp');
    // index is now 1; feeding the sequence from index 1 onward completes it.
    const rest = KONAMI_SEQUENCE.slice(1);
    expect(feed(matcher, [...rest])).toBe(true);
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
