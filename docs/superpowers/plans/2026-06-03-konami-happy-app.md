# Konami → Happy App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Konami code open the existing `happy` (`no_abrir.mp4`) app inside the desktop emulation instead of navigating to a standalone `/happy` page.

**Architecture:** Move the Konami logic out of the global inline script in `BaseHead.astro` and into the desktop React tree, co-located with its effect. A pure matcher module holds the sequence; a React hook attaches the `keydown` listener and fires a callback; `DesktopShell` wires the callback to `openWindow('happy')`. The standalone `/happy` page is deleted.

**Tech Stack:** Astro, React, TypeScript, Vitest + jsdom, `@testing-library/react` (`renderHook`, `act`).

---

## File Structure

- **Create** `src/desktop/lib/konami.ts` — pure sequence + matcher factory. No DOM, no React.
- **Create** `src/desktop/lib/konami.test.ts` — unit tests for the matcher.
- **Create** `src/desktop/state/useKonamiCode.ts` — React hook: attaches `keydown`, fires `onUnlock` on completion.
- **Create** `src/desktop/state/useKonamiCode.test.ts` — hook tests via `renderHook` + dispatched events.
- **Modify** `src/desktop/DesktopShell.tsx` — call `useKonamiCode(() => openWindow('happy'))`.
- **Modify** `src/components/site/BaseHead.astro` — remove the Konami `<script>` block.
- **Delete** `src/pages/happy.astro`.

---

## Task 1: Pure Konami matcher

**Files:**
- Create: `src/desktop/lib/konami.ts`
- Test: `src/desktop/lib/konami.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/desktop/lib/konami.test.ts
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
    matcher.push('ArrowUp'); // index 2
    // 'ArrowUp' again is wrong at index 2, but equals sequence[0] -> restart at 1.
    matcher.push('ArrowUp');
    // From here, the remaining keys after the first ArrowUp complete it.
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/desktop/lib/konami.test.ts`
Expected: FAIL — cannot resolve `./konami` / `createKonamiMatcher is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/desktop/lib/konami.ts

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
  return key === expected || key.toLowerCase() === expected;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/desktop/lib/konami.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/desktop/lib/konami.ts src/desktop/lib/konami.test.ts
git commit -m "feat(desktop): add pure konami sequence matcher"
```

---

## Task 2: useKonamiCode hook

**Files:**
- Create: `src/desktop/state/useKonamiCode.ts`
- Test: `src/desktop/state/useKonamiCode.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/desktop/state/useKonamiCode.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { KONAMI_SEQUENCE } from '../lib/konami';
import { useKonamiCode } from './useKonamiCode';

function dispatch(keys: readonly string[]) {
  act(() => {
    for (const key of keys) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
  });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('useKonamiCode', () => {
  it('calls onUnlock exactly once after the full sequence', () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));
    dispatch(KONAMI_SEQUENCE);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnlock for a partial or wrong sequence', () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));
    dispatch(['ArrowUp', 'ArrowUp', 'ArrowDown', 'x']);
    expect(cb).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useKonamiCode(cb));
    unmount();
    dispatch(KONAMI_SEQUENCE);
    expect(cb).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/desktop/state/useKonamiCode.test.ts`
Expected: FAIL — cannot resolve `./useKonamiCode` / `useKonamiCode is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/desktop/state/useKonamiCode.ts
import { useEffect, useRef } from 'react';
import { createKonamiMatcher } from '../lib/konami';

/**
 * Fires `onUnlock` when the Konami code is entered. The listener lives only
 * while the hook is mounted, so the easter egg is active only on the desktop.
 */
export function useKonamiCode(onUnlock: () => void): void {
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    const matcher = createKonamiMatcher();
    function handleKeyDown(event: KeyboardEvent) {
      if (matcher.push(event.key)) {
        onUnlockRef.current();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/desktop/state/useKonamiCode.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/desktop/state/useKonamiCode.ts src/desktop/state/useKonamiCode.test.ts
git commit -m "feat(desktop): add useKonamiCode hook"
```

---

## Task 3: Wire the hook into DesktopShell

**Files:**
- Modify: `src/desktop/DesktopShell.tsx`

No new test — the hook and matcher are unit-tested; this is a one-line wire-up that the existing DesktopShell render path covers.

- [ ] **Step 1: Add the import**

At the top of `src/desktop/DesktopShell.tsx`, alongside the other `./state/*` imports (e.g. after the `useAppContext` import on line 17):

```ts
import { useKonamiCode } from './state/useKonamiCode';
```

- [ ] **Step 2: Call the hook**

Inside `DesktopShell`, after `openWindow` is destructured from `useResponsiveLayout` (line 41), add:

```ts
useKonamiCode(() => openWindow('happy'));
```

- [ ] **Step 3: Verify the project still type-checks and tests pass**

Run: `pnpm test`
Expected: PASS — full suite green, including the new konami tests.

- [ ] **Step 4: Commit**

```bash
git add src/desktop/DesktopShell.tsx
git commit -m "feat(desktop): open the happy app on the konami code"
```

---

## Task 4: Remove the global Konami script and the /happy page

**Files:**
- Modify: `src/components/site/BaseHead.astro`
- Delete: `src/pages/happy.astro`

- [ ] **Step 1: Confirm nothing else links to /happy**

Run: `grep -rn "/happy" src/ astro.config.* 2>/dev/null`
Expected: the only matches are the `window.location.href = '/happy'` line in `BaseHead.astro` (about to be removed) and nothing else. If any navigation link to `/happy` exists elsewhere, stop and report it before deleting the page.

- [ ] **Step 2: Remove the Konami `<script>` from BaseHead.astro**

Delete the entire block below (currently lines ~83–120 in `src/components/site/BaseHead.astro`) — the `onKonamiCode` definition and its `window.location.href = '/happy'` callback:

```html
<script>
  function onKonamiCode(cb: () => void) {
    const sequence = [
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
    ];
    let input = 0;

    function matchesKey(event: KeyboardEvent, expected: string) {
      return event.key === expected || event.key.toLowerCase() === expected;
    }

    document.addEventListener('keydown', (event) => {
      if (matchesKey(event, sequence[input]!)) {
        input += 1;
        if (input === sequence.length) {
          cb();
          input = 0;
        }
        return;
      }

      input = matchesKey(event, sequence[0]!) ? 1 : 0;
    });
  }

  onKonamiCode(() => {
    window.location.href = '/happy';
  });
</script>
```

Leave the rest of the file intact — in particular the analytics `<script>` block above it and the `<ClientRouter />` below it.

- [ ] **Step 3: Delete the /happy page**

Run: `git rm src/pages/happy.astro`
Expected: `rm 'src/pages/happy.astro'`.

- [ ] **Step 4: Verify the build and tests**

Run: `pnpm test && pnpm build`
Expected: tests PASS and the Astro build completes with no broken reference to `/happy` or the removed script.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/BaseHead.astro
git commit -m "refactor: drop the global konami script and the /happy page"
```

---

## Self-Review notes

- **Spec coverage:** matcher (Task 1), hook (Task 2), DesktopShell wire-up to `openWindow('happy')` (Task 3), BaseHead script removal + `/happy` deletion + pre-delete grep (Task 4). All spec units and tests covered.
- **Type consistency:** `createKonamiMatcher().push(key: string): boolean` and `KONAMI_SEQUENCE` are used identically across Tasks 1–2; `useKonamiCode(onUnlock: () => void)` matches its call site in Task 3.
- **No placeholders:** every code/command step is concrete.
