# Single-source window geometry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every desktop window render from one authoritative frame
(`state.x/y`), turn centering into a placement policy that writes that frame, and
carry geometry intent explicitly through the manager API — eliminating the
`displayPos` dual-source that caused the centered-window drag bugs.

**Architecture:** `useWindowManager` exposes `setUserGeometry` (user move/resize,
sets `userSized`) and `correctLayout` / `correctLayouts` (automatic placement,
never sets `userSized`); the reducer stops sniffing `document.body`. The manager
preserves centered windows' stored frame instead of reseeding it.
`useWindowCenterLayout` becomes a pure corrector that writes the centered frame
while `!userSized`, with no `displayPos`/lock state. `Window.tsx` renders all
windows from `state.x/y` and routes gesture reports to `setUserGeometry` and
auto reports to `correctLayout`.

**Tech Stack:** React 19, TypeScript, Vitest (jsdom) for unit tests, new
`@vitest/browser` (Playwright provider) for one real-browser drag regression test.

**Reference spec:** `docs/superpowers/specs/2026-06-05-windowing-single-source-geometry-design.md`

---

## File structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/desktop/state/useWindowManager.ts` | window state + geometry methods | split API, drop body-class sniff, preserve centered frame |
| `src/desktop/window/useWindowCenterLayout.ts` | centering placement policy | rewrite as pure corrector |
| `src/desktop/window/Window.tsx` | window shell render + hook wiring | single-source render, intent routing |
| `src/desktop/window/useWindowWidthSync.ts` | width-drift correction | route report as `auto` (no signature change) |
| `src/desktop/state/useResponsiveLayout.ts` | mobile fit + relayout | call `correctLayout`/`correctLayouts` |
| `src/desktop/state/useAppContext.ts` | app context wiring | rename `setGeometry` param to `correctLayout` |
| `src/desktop/DesktopShell.tsx` | top-level wiring | route intent → manager methods |
| `test/factories.ts` | test fixtures | `onGeometryChange` signature unchanged (vi.fn) |
| `vitest.browser.config.ts` (new) | browser test project | Playwright provider, `test/browser/**` |
| `test/browser/about-drag.browser.test.tsx` (new) | drag regression | real-browser no-jump assertion |

---

## Task 1: Manager — explicit-intent geometry API

Replace the overloaded `setGeometry`/`setGeometries` with `setUserGeometry`
(sets `userSized`), `correctLayout` (does not), and `correctLayouts` (batch
auto). `normalizeGeometryPatch` takes an explicit `markUserSized` flag instead of
reading `document.body`.

**Files:**
- Modify: `src/desktop/state/useWindowManager.ts`
- Test: `src/desktop/state/useWindowManager.test.ts`

- [ ] **Step 1: Update the manager tests to the new API (red)**

In `src/desktop/state/useWindowManager.test.ts`, replace the whole
`describe('useWindowManager - setGeometry', …)` block and the
`describe('useWindowManager - setGeometries (batch)', …)` block with the
following two blocks. The key change: `userSized` is driven by *which method* is
called, not by adding `is-window-gesturing` to `document.body`.

```ts
describe('useWindowManager - correctLayout (auto placement)', () => {
  it('applies a position patch without marking userSized', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { x: 123, y: 45 }));
    expect(result.current.windows.a.x).toBe(123);
    expect(result.current.windows.a.y).toBe(45);
    expect(result.current.windows.a.userSized).toBeUndefined();
  });

  it('clamps width to the effective min width', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { width: 50 }));
    expect(result.current.windows.a.width).toBe(400);
  });

  it('clamps height to MIN_HEIGHT', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { height: 10 }));
    expect(result.current.windows.a.height).toBe(140);
  });

  it('is a no-op when the patch does not change anything', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { x: 300 }));
    const snapshot = result.current.windows.a;
    act(() => result.current.correctLayout('a', { x: 300 }));
    expect(result.current.windows.a).toBe(snapshot);
  });

  it('is a no-op for unknown ids', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('missing', { x: 1 }));
    expect(result.current.windows.missing).toBeUndefined();
  });
});

describe('useWindowManager - setUserGeometry (user move/resize)', () => {
  it('applies the patch and marks the window userSized', () => {
    const { result } = renderManager();
    act(() => result.current.setUserGeometry('a', { x: 200 }));
    expect(result.current.windows.a.x).toBe(200);
    expect(result.current.windows.a.userSized).toBe(true);
  });

  it('still updates (sets userSized) for an unchanged geometry', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { x: 300 }));
    const snapshot = result.current.windows.a;
    expect(snapshot.userSized).toBeUndefined();
    act(() => result.current.setUserGeometry('a', { x: 300 }));
    expect(result.current.windows.a.userSized).toBe(true);
    expect(result.current.windows.a).not.toBe(snapshot);
  });

  it('is a no-op for unknown ids', () => {
    const { result } = renderManager();
    act(() => result.current.setUserGeometry('missing', { x: 1 }));
    expect(result.current.windows.missing).toBeUndefined();
  });
});

describe('useWindowManager - correctLayouts (batch auto)', () => {
  it('applies multiple patches in one update', () => {
    const { result } = renderManager();
    act(() =>
      result.current.correctLayouts({ a: { x: 10, y: 20 }, b: { x: 30, y: 40 } }),
    );
    expect(result.current.windows.a.x).toBe(10);
    expect(result.current.windows.a.y).toBe(20);
    expect(result.current.windows.b.x).toBe(30);
    expect(result.current.windows.b.y).toBe(40);
  });

  it('clamps each patch independently', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayouts({ a: { width: 10 }, b: { height: 5 } }));
    expect(result.current.windows.a.width).toBe(400);
    expect(result.current.windows.b.height).toBe(140);
  });

  it('skips unknown ids and no-op patches without changing state identity', () => {
    const { result } = renderManager();
    const before = result.current.windows;
    act(() =>
      result.current.correctLayouts({
        missing: { x: 1 },
        a: { x: before.a.x, y: before.a.y },
      }),
    );
    expect(result.current.windows).toBe(before);
    expect(result.current.windows.missing).toBeUndefined();
  });
});
```

Also update the two existing tests that used `is-window-gesturing` to assert
`userSized`: in `describe('useWindowManager - open', …)` the test
`'applies default open geometry (clears userSized) when opening from closed on
desktop'` and in `describe('useWindowManager - open applies default geometry', …)`
the test `'resets an open-from-closed window …'`. Replace their
`document.body.classList.add('is-window-gesturing'); act(() => result.current.setGeometry('a', { width: 700 })); … remove(...)` lines with a single:

```ts
act(() => result.current.setUserGeometry('a', { width: 700 }));
```

(Drop the `document.body.classList.add/remove('is-window-gesturing')` lines and
the `setGeometry` calls; `setUserGeometry` sets `userSized` directly.) Do the same
in the `'preserves custom geometry when restoring a minimized window'` test and
the centered `'sizes a centered window …'` test.

> **Preserve each test's existing patch arguments verbatim** — only the
> gesturing-class wrapper and the method name change. The restore test patches
> `{ x: 250, y: 180, width: 720 }` and asserts all three; the centered test
> patches `{ width: 680 }`. Do NOT copy the `{ width: 700 }` literal into them —
> e.g. the restore line becomes
> `act(() => result.current.setUserGeometry('a', { x: 250, y: 180, width: 720 }));`.

- [ ] **Step 2: Run the manager tests to verify they fail**

Run: `pnpm exec vitest run src/desktop/state/useWindowManager.test.ts`
Expected: FAIL — `correctLayout` / `setUserGeometry` / `correctLayouts` are not functions.

- [ ] **Step 3: Rewrite the geometry API in `useWindowManager.ts`**

Replace the `STATE_CLASS` import usage in the reducer and the
`setGeometry`/`setGeometries` definitions. First, update `normalizeGeometryPatch`
(around line 226-250) to take an explicit flag and drop the DOM read:

```ts
const normalizeGeometryPatch = useCallback(
  (
    id: string,
    geometry: Partial<WindowGeometry>,
    target: WindowState,
    markUserSized: boolean,
  ): Partial<WindowGeometry> | null => {
    const def = defs.find((entry) => entry.id === id);
    const vw = typeof window !== 'undefined' ? window.innerWidth : viewportWidth;
    const minW = def ? effectiveMinWidth(def, vw) : Math.min(MIN_WIDTH, vw - 16);
    const next: Partial<WindowGeometry> & { userSized?: boolean } = { ...geometry };
    if (next.width != null) next.width = Math.max(minW, next.width);
    if (next.height != null) next.height = Math.max(MIN_HEIGHT, next.height);
    if (markUserSized) next.userSized = true;
    const changed =
      next.userSized === true && target.userSized !== true
        ? true
        : (Object.keys(next) as (keyof WindowGeometry)[]).some(
            (key) => next[key] !== target[key],
          );
    return changed ? next : null;
  },
  [defs, viewportWidth],
);
```

Remove the now-unused `import { STATE_CLASS } from '../lib/stateClasses';` **only
if** no other code in this file uses it (it does not after this change).

Replace `setGeometry` / `setGeometries` with three methods:

```ts
const applyPatch = useCallback(
  (id: string, geometry: Partial<WindowGeometry>, markUserSized: boolean) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      const next = normalizeGeometryPatch(id, geometry, target, markUserSized);
      if (!next) return prev;
      return { ...prev, [id]: { ...target, ...next } };
    });
  },
  [normalizeGeometryPatch],
);

const setUserGeometry = useCallback(
  (id: string, geometry: Partial<WindowGeometry>) => applyPatch(id, geometry, true),
  [applyPatch],
);

const correctLayout = useCallback(
  (id: string, geometry: Partial<WindowGeometry>) => applyPatch(id, geometry, false),
  [applyPatch],
);

const correctLayouts = useCallback(
  (updates: Record<string, Partial<WindowGeometry>>) => {
    setWindows((prev) => {
      let nextState: Record<string, WindowState> | null = null;
      for (const [id, geometry] of Object.entries(updates)) {
        const target = (nextState ?? prev)[id];
        if (!target) continue;
        const patch = normalizeGeometryPatch(id, geometry, target, false);
        if (!patch) continue;
        if (!nextState) nextState = { ...prev };
        nextState[id] = { ...target, ...patch };
      }
      return nextState ?? prev;
    });
  },
  [normalizeGeometryPatch],
);
```

Update the `WindowManager` interface (lines ~96-101): remove `setGeometry` and
`setGeometries`; add:

```ts
  /** Apply a user-driven move/resize; marks the window user-placed. */
  setUserGeometry: (id: string, geometry: Partial<WindowGeometry>) => void;
  /** Apply an automatic placement/correction; never marks the window user-placed. */
  correctLayout: (id: string, geometry: Partial<WindowGeometry>) => void;
  /** Batch automatic correction in one state update (layout passes). */
  correctLayouts: (updates: Record<string, Partial<WindowGeometry>>) => void;
```

Update the returned object (lines ~322-326): replace `setGeometry, setGeometries`
with `setUserGeometry, correctLayout, correctLayouts`.

- [ ] **Step 4: Run the manager tests to verify they pass**

Run: `pnpm exec vitest run src/desktop/state/useWindowManager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/desktop/state/useWindowManager.ts src/desktop/state/useWindowManager.test.ts
git commit -m "refactor(desktop): split window geometry API into user vs auto intent"
```

---

## Task 2: Manager — preserve a centered window's frame (#1/#19)

`mergeWindowUiState` reseeds non-`userSized` windows from `createInitialState`'s
`MIN_HEIGHT` placeholder, overwriting the center hook's measured frame. Preserve
the stored frame for centered windows too.

**Files:**
- Modify: `src/desktop/state/useWindowManager.ts`
- Test: `src/desktop/state/useWindowManager.test.ts`

> **Why a direct unit test (not a mounted-hook test):** `mergeWindowUiState` has
> exactly one caller — the mount-sync `useLayoutEffect`, guarded by
> `syncedToWindowViewport.current` (set permanently on first run). A mounted-hook
> test cannot re-trigger the merge after the center hook has corrected the frame,
> so it would pass regardless of the fix. We export `mergeWindowUiState` and test
> it directly, which genuinely goes red without the `centeredIds` change.

- [ ] **Step 1: Write the failing test**

Add a new top-level `describe` to `useWindowManager.test.ts` (it imports
`makeWindowState` from `@test/factories` — add that import if absent, and add
`mergeWindowUiState` to the `./useWindowManager` import):

```ts
describe('mergeWindowUiState', () => {
  // `fresh` is what createInitialState produces — a MIN_HEIGHT placeholder for
  // content-sized centered windows. `prev` holds the center hook's corrected
  // frame (auto layout, so userSized is unset).
  function fresh() {
    return {
      c: makeWindowState({ id: 'c', open: true, x: 9, y: 999, width: 500, height: null }),
      p: makeWindowState({ id: 'p', open: true, x: 9, y: 999, width: 600, height: 400 }),
    };
  }
  function prev() {
    return {
      c: makeWindowState({ id: 'c', open: true, x: 262, y: 184, width: 500, height: null }),
      p: makeWindowState({ id: 'p', open: true, x: 111, y: 222, width: 600, height: 400 }),
    };
  }

  it('keeps a centered window\'s frame but reseeds a non-centered, non-userSized one', () => {
    const merged = mergeWindowUiState(fresh(), prev(), new Set(['c']));
    expect(merged.c.x).toBe(262); // centered: corrected frame preserved
    expect(merged.c.y).toBe(184);
    expect(merged.p.x).toBe(9); // non-centered, not userSized: takes fresh
    expect(merged.p.y).toBe(999);
  });

  it('reseeds a centered window omitted from centeredIds', () => {
    const merged = mergeWindowUiState(fresh(), prev(), new Set());
    expect(merged.c.y).toBe(999); // not preserved -> fresh placeholder
  });

  it('keeps a userSized window regardless of centeredIds', () => {
    const f = { u: makeWindowState({ id: 'u', open: true, x: 9, y: 999 }) };
    const p = { u: makeWindowState({ id: 'u', open: true, x: 50, y: 60, userSized: true }) };
    const merged = mergeWindowUiState(f, p, new Set());
    expect(merged.u.x).toBe(50);
    expect(merged.u.y).toBe(60);
  });

  it('keeps fresh ui geometry for a closed centered window', () => {
    const f = { c: makeWindowState({ id: 'c', open: false, x: 9, y: 999 }) };
    const p = { c: makeWindowState({ id: 'c', open: false, x: 262, y: 184 }) };
    const merged = mergeWindowUiState(f, p, new Set(['c']));
    expect(merged.c.y).toBe(999); // not open -> not preserved
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run src/desktop/state/useWindowManager.test.ts -t "mergeWindowUiState"`
Expected: FAIL — either `mergeWindowUiState` is not exported (import error) or, once
exported with the old 2-arg body, the centered `c` is reseeded to `y: 999`
(current code only preserves `userSized` windows).

- [ ] **Step 3: Export + preserve centered frames in `mergeWindowUiState`**

Change `mergeWindowUiState` (lines ~33-61) to **`export function`**, accept a set
of centered ids, and preserve geometry for centered windows too:

```ts
export function mergeWindowUiState(
  fresh: Record<string, WindowState>,
  prev: Record<string, WindowState>,
  centeredIds: ReadonlySet<string>,
): Record<string, WindowState> {
  const merged = { ...fresh };
  for (const id of Object.keys(merged)) {
    const previous = prev[id];
    if (!previous) continue;
    merged[id] = {
      ...merged[id],
      open: previous.open,
      minimized: previous.minimized,
      maximized: previous.maximized,
      zIndex: previous.zIndex,
      userSized: previous.userSized,
    };
    // Keep custom geometry after a user move/resize, AND keep a centered
    // window's measured frame (the center hook owns it — never reseed it from
    // the MIN_HEIGHT placeholder).
    const keepGeometry =
      (previous.userSized || centeredIds.has(id)) &&
      previous.open &&
      !previous.minimized &&
      !previous.maximized;
    if (keepGeometry) {
      merged[id] = {
        ...merged[id],
        x: previous.x,
        y: previous.y,
        width: previous.width,
        height: previous.height,
      };
    }
  }
  return merged;
}
```

In `useWindowManager`, derive the centered id set and pass it at the mount-sync
call site (lines ~127-136). Add near the top of the hook, after `order`:

```ts
const centeredIds = useMemo(
  () => new Set(defs.filter((def) => def.center).map((def) => def.id)),
  [defs],
);
```

And update the call:

```ts
setWindows((prev) => mergeWindowUiState(createInitialState(defs, vw, vh), prev, centeredIds));
```

> The `syncedToWindowViewport` guard (mount-sync runs once) is unchanged — that
> is correct production behavior. The exported unit test above is what proves the
> `centeredIds` preservation; no hook-level test is needed for it.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run src/desktop/state/useWindowManager.test.ts`
Expected: PASS (all manager tests).

- [ ] **Step 5: Commit**

```bash
git add src/desktop/state/useWindowManager.ts src/desktop/state/useWindowManager.test.ts
git commit -m "fix(desktop): preserve a centered window's measured frame across mount re-sync"
```

---

## Task 3: Rewrite `useWindowCenterLayout` as a pure corrector (#2)

Remove `displayPos`, `displayX/Y`, `userLocked`, `userPositioned`,
`markUserPositioned`. The hook now only measures the box and reports the centered
frame via `onGeometryChange` while `enabled && !userSized`, bailing mid-gesture
via the `is-window-gesturing` guard.

**Files:**
- Modify: `src/desktop/window/useWindowCenterLayout.ts`
- Test: `src/desktop/window/useWindowCenterLayout.test.ts`

- [ ] **Step 1: Replace the test file body (red)**

Replace the three `describe` blocks for `centered geometry`, `idempotence`,
`guards`, and `user positioning` with the following (keep the imports, viewport
setup, `elWithRect`, `ResizeObserverStub`, and `beforeEach`). The hook no longer
returns `displayX/Y`/`markUserPositioned`, so tests assert on the reported
geometry only.

```ts
interface Args {
  el?: HTMLElement | null;
  enabled?: boolean;
  userSized?: boolean;
  width?: number;
  onGeometryChange?: Mock<(geometry: { x?: number; y?: number; width?: number }) => void>;
}

function renderCenter(args: Args = {}) {
  const onGeometryChange =
    args.onGeometryChange ??
    vi.fn<(geometry: { x?: number; y?: number; width?: number }) => void>();
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current =
    args.el === undefined ? elWithRect(600, 400) : args.el;
  const utils = renderHook(
    ({ enabled, userSized, width }: { enabled: boolean; userSized?: boolean; width: number }) =>
      useWindowCenterLayout({ rootRef: ref, enabled, userSized, width, onGeometryChange }),
    { initialProps: { enabled: args.enabled ?? true, userSized: args.userSized, width: args.width ?? 600 } },
  );
  return { ...utils, onGeometryChange, ref };
}

describe('useWindowCenterLayout - centered corrector', () => {
  it('reports the centered frame for an enabled, not-user-sized window', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    expect(onGeometryChange).toHaveBeenCalled();
    const geo = onGeometryChange.mock.calls[0][0];
    expect(geo.x).toBe(Math.round(Math.max(EDGE_MARGIN, (VW - 600) / 2)));
    expect(geo.y).toBe(Math.round(Math.max(EDGE_MARGIN, (VH - TASKBAR_HEIGHT - 400) / 2)));
    expect(geo.width).toBe(600);
  });

  it('clamps to EDGE_MARGIN when wider/taller than the viewport', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(VW + 400, VH + 400) });
    const geo = onGeometryChange.mock.calls[0][0];
    expect(geo.x).toBe(EDGE_MARGIN);
    expect(geo.y).toBe(EDGE_MARGIN);
  });

  it('does not re-report when the rAF passes resolve to the same box', async () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    expect(onGeometryChange.mock.calls.length).toBe(1);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(onGeometryChange.mock.calls.length).toBe(1);
  });
});

describe('useWindowCenterLayout - guards', () => {
  it('does nothing when disabled', () => {
    const { onGeometryChange } = renderCenter({ enabled: false });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('does nothing once the window is user-sized', () => {
    const { onGeometryChange } = renderCenter({ userSized: true });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('does nothing when the ref has no node', () => {
    const { onGeometryChange } = renderCenter({ el: null });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('does not report while the body has is-window-gesturing', () => {
    document.body.classList.add('is-window-gesturing');
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('skips reporting when the measured box has zero size', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(0, 0) });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });
});

describe('useWindowCenterLayout - re-centers when user-sizing clears', () => {
  it('resumes reporting the centered frame when userSized goes back to false (reopen)', () => {
    const { onGeometryChange, rerender } = renderCenter({ userSized: true });
    expect(onGeometryChange).not.toHaveBeenCalled();
    rerender({ enabled: true, userSized: false, width: 600 });
    const geo = onGeometryChange.mock.calls.at(-1)![0];
    expect(geo.x).toBe(Math.round(Math.max(EDGE_MARGIN, (VW - 600) / 2)));
    expect(geo.y).toBe(Math.round(Math.max(EDGE_MARGIN, (VH - TASKBAR_HEIGHT - 400) / 2)));
  });
});
```

Remove the now-unused `renderHookWithProps` helper at the bottom of the file.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run src/desktop/window/useWindowCenterLayout.test.ts`
Expected: FAIL — hook signature/return mismatch (`userSized` not accepted, etc.).

- [ ] **Step 3: Rewrite the hook**

Replace the entire body of `src/desktop/window/useWindowCenterLayout.ts` with:

```ts
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { centerInWorkArea } from '../lib/geometry';
import { STATE_CLASS } from '../lib/stateClasses';

interface WindowCenterLayoutOptions {
  rootRef: RefObject<HTMLElement | null>;
  /** center && open && !minimized && !maximized */
  enabled: boolean;
  /** Painted width; a change re-measures the centered box. */
  width: number;
  /** Once the user has moved/resized the window, stop centering it. */
  userSized?: boolean;
  /** Auto-layout reporter (routes to the manager's correctLayout). */
  onGeometryChange: (geometry: { x?: number; y?: number; width?: number }) => void;
}

/**
 * Centering as a placement policy: while a center-flagged window is auto-placed
 * (`enabled && !userSized`), measure its rendered box and write the centered
 * frame back through `onGeometryChange`. It owns no render-time position state —
 * the window renders from `state.x/y` like every other window. Once the user
 * moves/resizes it (`userSized`), this goes silent; on reopen the manager clears
 * `userSized` and the effect resumes.
 */
export function useWindowCenterLayout({
  rootRef,
  enabled,
  width,
  userSized,
  onGeometryChange,
}: WindowCenterLayoutOptions) {
  const onGeometryChangeRef = useRef(onGeometryChange);
  onGeometryChangeRef.current = onGeometryChange;
  // The settle triggers (rAF passes, fonts.ready, ResizeObserver) often resolve
  // to the same box; only report real changes.
  const lastSentRef = useRef<{ x: number; y: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!enabled || userSized || typeof window === 'undefined') return;
    const el = rootRef.current;
    if (!el) return;

    let raf2 = 0;

    function syncPosition() {
      // Never fight an in-progress drag in the window between grab and the first
      // move committing userSized.
      if (document.body.classList.contains(STATE_CLASS.windowGesturing)) return;

      const node = rootRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const center = centerInWorkArea(window.innerWidth, window.innerHeight, rect.width, rect.height);
      const nextX = Math.round(center.x);
      const nextY = Math.round(center.y);
      const roundedWidth = Math.round(rect.width);

      const last = lastSentRef.current;
      if (!last || last.x !== nextX || last.y !== nextY || last.width !== roundedWidth) {
        lastSentRef.current = { x: nextX, y: nextY, width: roundedWidth };
        onGeometryChangeRef.current({ x: nextX, y: nextY, width: roundedWidth });
      }
    }

    syncPosition();
    const raf1 = requestAnimationFrame(syncPosition);
    raf2 = requestAnimationFrame(() => requestAnimationFrame(syncPosition));
    void document.fonts?.ready.then(syncPosition);

    const observer = new ResizeObserver(syncPosition);
    observer.observe(el);
    window.addEventListener('resize', syncPosition);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
      window.removeEventListener('resize', syncPosition);
      // Drop the cached box so a resume (e.g. reopen clearing userSized) can
      // re-report even if it resolves to a prior value.
      lastSentRef.current = null;
    };
  }, [enabled, rootRef, width, userSized]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run src/desktop/window/useWindowCenterLayout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/desktop/window/useWindowCenterLayout.ts src/desktop/window/useWindowCenterLayout.test.ts
git commit -m "refactor(desktop): centering hook becomes a pure placement corrector"
```

---

## Task 4: `Window.tsx` — single-source render + intent routing

Render all windows from `state.x/y`; add the `intent` arg to
`onGeometryChange`; route gesture reports as `user` and centering/width-sync
reports as `auto`. Remove all `displayX/Y` / `markUserPositioned` usage.

**Files:**
- Modify: `src/desktop/window/Window.tsx`
- Test: `src/desktop/window/Window.test.tsx`

- [ ] **Step 1: Update the width-sync Window tests (red)**

In `src/desktop/window/Window.test.tsx`, the `describe('Window - width sync', …)`
block asserts `onGeometryChange` is called with `{ width: 600 }`. With the new
signature it is called with `({ width: 600 }, 'auto')`. Update the three
assertions:

```ts
expect(onGeometryChange).toHaveBeenCalledWith({ width: 600 }, 'auto');
```

and for the negative cases keep `not.toHaveBeenCalled()` / the centered
`not.toHaveBeenCalledWith({ width: 600 }, 'auto')` form.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run src/desktop/window/Window.test.tsx -t "width sync"`
Expected: FAIL — called with one arg, not two.

- [ ] **Step 3: Edit `Window.tsx`**

Update the `WindowProps.onGeometryChange` type (line ~28):

```ts
  onGeometryChange: (geometry: Partial<WindowGeometry>, intent: 'user' | 'auto') => void;
```

Add `useCallback` to the React import if not present. After `onGeometryChange` is
in scope inside the component, build the two routed reporters and replace the
hook wiring (lines ~79-117):

```ts
  const reportUser = useCallback(
    (geometry: Partial<WindowGeometry>) => onGeometryChange(geometry, 'user'),
    [onGeometryChange],
  );
  const reportAuto = useCallback(
    (geometry: Partial<WindowGeometry>) => onGeometryChange(geometry, 'auto'),
    [onGeometryChange],
  );

  const layoutWidth = useWindowWidthSync({
    state,
    defaultWidth,
    minWidth,
    center,
    onGeometryChange: reportAuto,
  });

  useWindowCenterLayout({
    rootRef,
    enabled: center && state.open && !state.minimized && !state.maximized,
    width: layoutWidth,
    userSized: state.userSized,
    onGeometryChange: reportAuto,
  });

  const posX = state.x;
  const posY = state.y;

  const gestureState = useMemo(() => ({ ...state, width: layoutWidth }), [state, layoutWidth]);

  const { startMove, startResize } = useWindowGestures({
    state: gestureState,
    minWidth,
    rootRef,
    onFocus,
    onGeometryChange: reportUser,
  });
```

Delete the now-removed `markUserPositioned` destructure, the `handleMoveStart`
function, and the `center ? displayX : state.x` lines. Wire the titlebar directly
to `startMove`:

```tsx
          <WindowTitlebar
            title={title}
            titleContent={titleContent}
            onMoveStart={startMove}
            onDoubleClick={onToggleMaximize}
          />
```

Resize handles call `startResize` directly (already the case after the earlier
revert):

```tsx
            onPointerDown={(event) => startResize(event, direction)}
```

- [ ] **Step 4: Run the Window + center + gesture tests**

Run: `pnpm exec vitest run src/desktop/window/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/desktop/window/Window.tsx src/desktop/window/Window.test.tsx
git commit -m "refactor(desktop): render windows from state.x/y; route geometry intent"
```

---

## Task 5: Wire the new API through DesktopShell, responsive layout, app context

**Files:**
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `src/desktop/state/useResponsiveLayout.ts`
- Modify: `src/desktop/state/useAppContext.ts`
- Test: `src/desktop/state/useResponsiveLayout.test.ts`, `src/desktop/state/useAppContext.test.ts`

- [ ] **Step 1: Update responsive-layout + app-context tests (red)**

In `src/desktop/state/useResponsiveLayout.test.ts`:
- In `makeWm`, replace `setGeometry: vi.fn(), setGeometries: vi.fn(),` with
  `setUserGeometry: vi.fn(), correctLayout: vi.fn(), correctLayouts: vi.fn(),`.
- Replace every `wm.setGeometries` assertion with `wm.correctLayouts`, and every
  `wm.setGeometry` assertion (in the `fitWindowToMobile` and `openWindow` blocks)
  with `wm.correctLayout`.

In `src/desktop/state/useAppContext.test.ts`:
- Rename the `setGeometry` fixture key to `correctLayout` in `makeParams` and in
  the two `onOpenLink` tests; update the assertions
  `expect(setGeometry)…` → `expect(correctLayout)…` (the `{ height: 520 }`
  expectation is unchanged).

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run src/desktop/state/useResponsiveLayout.test.ts src/desktop/state/useAppContext.test.ts`
Expected: FAIL — old method names referenced.

- [ ] **Step 3: Edit the three source files**

`useResponsiveLayout.ts` (line ~13): destructure the new methods and use them:

```ts
const { correctLayout, correctLayouts, relayoutToViewport } = wm;
```

In `fitWindowToMobile` (line ~45) use `correctLayout(id, mobile)` and update its
dep array to `[correctLayout]`. In the layout effect, replace `setGeometries(updates)`
with `correctLayouts(updates)` and update the effect dep array entry
`setGeometries` → `correctLayouts`.

`useAppContext.ts`: rename the `setGeometry` param to `correctLayout` in
`UseAppContextParams` (line ~14) and the destructure (line ~23); use
`correctLayout(BROWSER_APP_ID, { height: 520 })` (line ~29) and update the
`handleOpenLink` dep array `setGeometry` → `correctLayout`.

`DesktopShell.tsx`:
- Line ~39: `const { unfocus } = wm;` (drop `setGeometry`).
- Line ~70-77: pass `correctLayout: wm.correctLayout` into `useAppContext`
  instead of `setGeometry`.
- Line ~128-129: route intent to the manager methods:

```tsx
            onGeometryChange: (geometry: Partial<WindowGeometry>, intent: 'user' | 'auto') =>
              intent === 'user'
                ? wm.setUserGeometry(app.id, geometry)
                : wm.correctLayout(app.id, geometry),
```

> **Caution:** the widened two-arg `onGeometryChange` (Task 4) is structurally
> assignable from the old one-arg lambda, so `pnpm check` will NOT flag a
> partially-migrated body that ignores `intent`. Replace lines 128-129 verbatim
> and make sure the `intent === 'user'` branch (→ `setUserGeometry`) is present —
> only the Task 8 browser test guards that the user-intent path is wired.

- [ ] **Step 4: Run the affected suites**

Run: `pnpm exec vitest run src/desktop/state/useResponsiveLayout.test.ts src/desktop/state/useAppContext.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/desktop/DesktopShell.tsx src/desktop/state/useResponsiveLayout.ts src/desktop/state/useAppContext.ts src/desktop/state/useResponsiveLayout.test.ts src/desktop/state/useAppContext.test.ts
git commit -m "refactor(desktop): route shell/responsive/app-context through the new geometry API"
```

---

## Task 6: Update remaining tests + typecheck/lint sweep

**Files:**
- Modify: `src/desktop/state/WindowManagerContext.test.tsx`
- Possibly: `test/factories.ts` (no change expected — `onGeometryChange: vi.fn()`)

- [ ] **Step 1: Update ALL `setGeometry` references in the context test**

`src/desktop/state/WindowManagerContext.test.tsx` references the removed API in
**three** places — update all of them:

1. Line ~78, the API-surface test: replace `typeof api.setGeometry` /
   `typeof api.setGeometries` lines with:

```ts
    expect(typeof api.setUserGeometry).toBe('function');
    expect(typeof api.correctLayout).toBe('function');
    expect(typeof api.correctLayouts).toBe('function');
```

2. Line ~171, the test title `'setGeometry() patches a window through context'`
   → `'correctLayout() patches a window through context'`, and line ~175
   `result.current.setGeometry('a', { x: 123, y: 45 })` →
   `result.current.correctLayout('a', { x: 123, y: 45 })`.

3. Line ~189 `first.result.current.setGeometry('a', { x: 10 })` →
   `first.result.current.correctLayout('a', { x: 10 })`.

Grep the file for `setGeometr` afterward to confirm zero remain.

- [ ] **Step 2: Run the full jsdom suite**

Run: `pnpm test`
Expected: PASS (all suites). Fix any straggler references the compiler/tests
surface (search `setGeometry`/`setGeometries` across `src` and `test`).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm check && pnpm lint`
Expected: 0 errors. (Resolve unused-import warnings, e.g. a now-unused
`STATE_CLASS` import in `useWindowManager.ts`.)

- [ ] **Step 4: Manual dev-server verification**

Run the dev server, then: open the desktop, confirm `about` is centered; open a
second window; drag `about` once and again — no flick, no jump. Drag a regular
window — clean. Close and reopen `about` — re-centers.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(desktop): finish geometry-API migration; update context API test"
```

---

## Task 7: Add the `@vitest/browser` project (#4 infra)

**Files:**
- Modify: `package.json`
- Create: `vitest.browser.config.ts`

- [ ] **Step 1: Add dev dependencies**

Run (all three packages are required — `vitest-browser-react` is the React render
adapter used by the Task 8 harness and is NOT a transitive dep):

```bash
pnpm add -D @vitest/browser playwright vitest-browser-react
pnpm exec playwright install chromium
```

- [ ] **Step 2: Create `vitest.browser.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));
const desktop = fileURLToPath(new URL('./src/desktop', import.meta.url));
const test = fileURLToPath(new URL('./test', import.meta.url));
const stub = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: [
      { find: 'astro:content', replacement: stub('./test/stubs/astro-content.ts') },
      { find: 'astro:assets', replacement: stub('./test/stubs/astro-assets.ts') },
      { find: /^@test\//, replacement: `${test}/` },
      { find: /^@desktop\//, replacement: `${desktop}/` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  test: {
    include: ['test/browser/**/*.browser.test.{ts,tsx}'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

> Uses `browser.instances` (current `@vitest/browser` API), not the deprecated
> `browser.name`. `setupFiles: ['./test/setup.ts']` is **intentionally omitted** —
> the jsdom setup polyfills (ResizeObserver, matchMedia) are native in a real
> browser and the render adapter handles its own cleanup. Do not copy the jsdom
> `setupFiles` here.

- [ ] **Step 3: Add the script**

In `package.json` `scripts`, add:

```json
    "test:browser": "vitest run --config vitest.browser.config.ts",
```

The existing `"test": "vitest run"` stays jsdom-only (its config's `include` is
`src/**/*.test.{ts,tsx}`, which does not match `test/browser/**`).

- [ ] **Step 4: Verify the project boots**

Run: `pnpm exec vitest run --config vitest.browser.config.ts`
Expected: PASS with "No test files found" (the spec is added in Task 8) — confirm
the browser launches without config errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.browser.config.ts
git commit -m "test(desktop): add @vitest/browser project (playwright/chromium)"
```

---

## Task 8: Browser regression test — centered-window drag never jumps

A focused harness mounting the real `useWindowManager` + `useResponsiveLayout` +
`Window` for two windows (one centered, one plain), driving a real pointer drag
on the centered window and asserting its rendered top/left never jumps between
the grab and the first move.

**Files:**
- Create: `test/browser/about-drag.browser.test.tsx`

- [ ] **Step 1: Write the harness + failing-by-construction test**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
import { useMemo } from 'react';
import Window from '@desktop/window/Window';
import { useWindowManager } from '@desktop/state/useWindowManager';
import { useResponsiveLayout } from '@desktop/state/useResponsiveLayout';
import type { WindowDef, WindowGeometry } from '@desktop/types';

const DEFS: WindowDef[] = [
  { id: 'about', title: 'about', defaultX: 0, defaultY: 0, defaultWidth: 560,
    minWidth: 520, initialZ: 11, center: true, defaultOpen: true },
  { id: 'term', title: 'term', defaultX: 0, defaultY: 0, defaultWidth: 600,
    initialZ: 12, defaultOpen: true },
];

function Harness() {
  const wm = useWindowManager(DEFS, window.innerWidth, window.innerHeight);
  const viewport = useMemo(
    () => ({ width: window.innerWidth, height: window.innerHeight }),
    [],
  );
  useResponsiveLayout(wm, DEFS, viewport);
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {DEFS.map((def) => {
        const state = wm.windows[def.id];
        return (
          <Window
            key={def.id}
            state={state}
            title={def.title}
            focused={wm.focusedId === def.id}
            minWidth={def.minWidth ?? 400}
            defaultWidth={def.defaultWidth}
            center={def.center}
            onFocus={() => wm.focus(def.id)}
            onClose={() => wm.close(def.id)}
            onMinimize={() => wm.minimize(def.id)}
            onToggleMaximize={() => wm.toggleMaximize(def.id)}
            onGeometryChange={(geometry: Partial<WindowGeometry>, intent: 'user' | 'auto') =>
              intent === 'user' ? wm.setUserGeometry(def.id, geometry) : wm.correctLayout(def.id, geometry)
            }
          >
            <div style={{ padding: 24 }}>{def.id} body</div>
          </Window>
        );
      })}
    </div>
  );
}

function topOf(el: Element): number {
  return Math.round(el.getBoundingClientRect().top);
}

describe('about window drag (real browser)', () => {
  it('does not jump when grabbed; tracks the drag delta', async () => {
    render(<Harness />);
    const about = document.querySelector('[data-window-id="about"]') as HTMLElement;
    expect(about).toBeTruthy();

    // First-paint correctness: the centered frame must be committed before paint,
    // so the box is already at its converged center with no settle flicker.
    const firstPaintTop = topOf(about);
    await new Promise((r) => setTimeout(r, 100));
    const settledTop = topOf(about);
    expect(Math.abs(firstPaintTop - settledTop)).toBeLessThanOrEqual(1);

    const titlebar = about.querySelector('.window-titlebar__drag') as HTMLElement;
    const s = titlebar.getBoundingClientRect();

    // GRAB ONLY (pointerdown, no move yet). This is the exact moment the old bug
    // flicked the window from displayPos to a stale state.y. With single-source
    // geometry the grab changes nothing, so top must be unchanged.
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: titlebar, coords: { x: s.x + 20, y: s.y + 10 } },
    ]);
    const afterGrabTop = topOf(about);
    expect(Math.abs(afterGrabTop - settledTop)).toBeLessThanOrEqual(2);

    // Now drag down by a clear delta; the window must track it (not jump).
    const DY = 60;
    await userEvent.pointer([
      { target: titlebar, coords: { x: s.x + 20, y: s.y + 10 + DY } },
    ]);
    const afterMoveTop = topOf(about);
    expect(Math.abs(afterMoveTop - (settledTop + DY))).toBeLessThanOrEqual(3);
    await userEvent.pointer([{ keys: '[/MouseLeft]', target: titlebar }]);

    // Re-grab: a second grab must also not jump (the stale-displayPos re-grab bug).
    const beforeSecond = topOf(about);
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: titlebar, coords: { x: s.x + 20, y: s.y + 10 + DY } },
    ]);
    expect(Math.abs(topOf(about) - beforeSecond)).toBeLessThanOrEqual(2);
    await userEvent.pointer([{ keys: '[/MouseLeft]', target: titlebar }]);
  });
});
```

> **Why the targets are the titlebar:** `useWindowGestures` attaches
> `pointermove`/`pointerup` to `window`, not the titlebar. The harness targets the
> titlebar for every pointer step and relies on real-DOM event bubbling to reach
> those window-level listeners — which is precisely what jsdom cannot model, and
> why this test must run in a real browser. The `.window-titlebar__drag` selector
> is the titlebar move region (see `WindowTitlebar`); confirm the class name.

- [ ] **Step 2: Validate the test is RED against the bug, then GREEN on the fix**

The whole point of this test is to catch the drag jump, so prove it discriminates
before trusting it:

1. Temporarily `git stash` the Task 3/4 changes (restore the pre-refactor
   `useWindowCenterLayout` with `displayPos`/`markUserPositioned` and the
   `center ? displayX : state.x` render in `Window.tsx`).
2. Run `pnpm test:browser`. Expected: **FAIL** at the grab-only assertion —
   `afterGrabTop` jumps far from `settledTop` (the original ~200px divergence).
   Record the observed delta.
3. `git stash pop` to restore the fix. Run `pnpm test:browser` again.
   Expected: **PASS**. The `<=2px` grab tolerance sits far below the recorded
   buggy delta, so the test genuinely discriminates.

If the harness cannot reproduce the jump in step 2, the test is not a real guard —
rework the harness (it must use the real `useWindowManager` mount-sync + center
hook) or escalate rather than ship a green-only test.

- [ ] **Step 3: Commit**

```bash
git add test/browser/about-drag.browser.test.tsx package.json pnpm-lock.yaml
git commit -m "test(desktop): real-browser regression that centered-window drag never jumps"
```

---

## Task 9: Final verification

- [ ] **Step 1: Full jsdom suite**

Run: `pnpm test`
Expected: PASS (all suites).

- [ ] **Step 2: Browser suite**

Run: `pnpm test:browser`
Expected: PASS.

- [ ] **Step 3: Typecheck + lint + build**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: 0 errors; build completes.

- [ ] **Step 4: Manual sanity on the dev server**

Open the desktop. Verify: `about` opens centered; with a second window open,
dragging `about` (first and repeated grabs) shows no flick; regular windows drag
cleanly; close+reopen `about` re-centers; viewport resize keeps `about` centered
until dragged.

- [ ] **Step 5: Final commit (if anything was touched in verification)**

```bash
git add -A
git commit -m "chore(desktop): single-source geometry refactor — verification pass"
```

---

## Self-review notes

- **Spec coverage:** #1 → Task 2; #2 → Tasks 3-4; #3 → Tasks 1, 4, 5; #4 → Tasks
  7-8. Non-goals (no gesture-math change, no visual change) respected — gesture
  hooks untouched except the report routing in Task 4.
- **Type consistency:** `onGeometryChange(geometry, intent)` defined in Task 4
  (`Window.tsx`) and consumed in Task 5 (`DesktopShell`) and Task 8 (harness).
  Manager methods `setUserGeometry` / `correctLayout` / `correctLayouts` named
  consistently across Tasks 1, 5, 6, 8.
- **`is-window-gesturing`:** still added by `useWindowGestures` (unchanged) for
  CSS + the center hook's during-gesture guard; only the *reducer* stops reading
  it (Task 1).

## Adversarial-review pass (applied)

A 5-lens adversarial review (32 agents, 16 confirmed findings) was run against
this plan and the live code; all confirmed findings are folded in:

- **Blocker** — Task 7 now installs `vitest-browser-react` (the Task 8 harness
  import was otherwise unresolvable).
- **Bug** — Task 6 now enumerates all three `setGeometry` sites in
  `WindowManagerContext.test.tsx` (lines ~78, ~171/175, ~189), not just the
  API-surface assertions.
- **Weak test (Task 2)** — replaced the tautological mounted-hook test (defeated
  by the `syncedToWindowViewport` guard) with a direct `export`ed
  `mergeWindowUiState` unit test that genuinely goes red without `centeredIds`.
- **Weak test (Task 8)** — added a first-paint sample, a grab-only assertion (the
  exact transient the bug produced) with a tight 2px tolerance and a 60px drag
  delta, and an explicit red-against-reverted validation step.
- **Nits** — Task 1 preserve-patch-args caution; Task 5 two-arg back-compat
  caution; Task 7 `setupFiles`-omission rationale; Task 8 bubbling rationale;
  Task 3 resume test asserts the reported value.
