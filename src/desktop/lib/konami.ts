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
 * KMP "failure function": fail[i] is the length of the longest proper prefix of
 * `seq[0..i]` that is also a suffix. It lets the matcher rewind to the longest
 * still-valid partial match on a mismatch instead of discarding all progress.
 */
function buildFailure(seq: readonly string[]): number[] {
  const fail = new Array<number>(seq.length).fill(0);
  let len = 0;
  for (let i = 1; i < seq.length; i++) {
    while (len > 0 && !matchesKey(seq[i]!, seq[len]!)) len = fail[len - 1]!;
    if (matchesKey(seq[i]!, seq[len]!)) len += 1;
    fail[i] = len;
  }
  return fail;
}

/**
 * Stateful matcher for the Konami sequence. `push` feeds one key and returns
 * `true` exactly on the keystroke that completes the sequence (then resets).
 * On a mismatch it rewinds (KMP) to the longest prefix of the sequence that is
 * still satisfied by the keys seen so far, so a stray repeated key (e.g. an
 * extra leading ArrowUp) doesn't force a full restart.
 */
export function createKonamiMatcher() {
  const fail = buildFailure(KONAMI_SEQUENCE);
  let index = 0;
  return {
    push(key: string): boolean {
      while (index > 0 && !matchesKey(key, KONAMI_SEQUENCE[index]!)) {
        index = fail[index - 1]!;
      }
      if (matchesKey(key, KONAMI_SEQUENCE[index]!)) index += 1;
      if (index === KONAMI_SEQUENCE.length) {
        index = 0;
        return true;
      }
      return false;
    },
  };
}
