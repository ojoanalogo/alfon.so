/** The classic Konami code. Letter keys are matched case-insensitively. */
export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

function matchesKey(key: string, expected: string): boolean {
  // Single-character keys (the b/a letters) are matched case-insensitively;
  // multi-character keys like 'ArrowUp' require an exact match.
  if (expected.length === 1) {
    return key.toLowerCase() === expected.toLowerCase();
  }
  return key === expected;
}

/**
 * Stateful matcher for the Konami sequence. `push` feeds one key and returns
 * `true` exactly on the keystroke that completes the sequence (then resets).
 * A wrong key resets the progress, but restarts at 1 when that key is itself
 * the first key of the sequence.
 */
export function createKonamiMatcher() {
  let index = 0;
  return {
    push(key: string): boolean {
      if (matchesKey(key, KONAMI_SEQUENCE[index]!)) {
        index += 1;
        if (index === KONAMI_SEQUENCE.length) {
          index = 0;
          return true;
        }
        return false;
      }
      index = matchesKey(key, KONAMI_SEQUENCE[0]!) ? 1 : 0;
      return false;
    },
  };
}
