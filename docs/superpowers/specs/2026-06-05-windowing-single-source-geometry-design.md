# Single-source window geometry — design

**Date:** 2026-06-05
**Status:** Approved (pending spec review)
**Scope:** Refactor the desktop windowing system so every window has one
authoritative frame, centering is a placement policy (not a parallel render
path), and geometry intent is explicit. Bundles audit findings #1, #2/#17/#18,
and #19, plus a real-browser regression test.

## Problem

A centered window's position currently lives in two places that can disagree:

- `displayPos` (measured center, rendered while idle) in `useWindowCenterLayout`
- `state.x/y` (rendered once "locked") in `useWindowManager`

Every recent drag bug was these two diverging, then `userLocked` flipping which
one drives the render. The divergence is fed by three things:

1. The manager reseeds a centered window from `createInitialState`'s
   `MIN_HEIGHT` placeholder (`mergeWindowUiState`), overwriting the real
   measured center the centering hook reported (audit #19).
2. The centering hook's `lastSentRef` dedupe then declines to re-correct it.
3. `displayPos` freezes once `userLocked`, so a re-grab can read a stale value.

On top of that, the reducer infers user-vs-auto intent by sniffing
`document.body.classList.contains('is-window-gesturing')` — ambient DOM state
that made the stuck-class bug (#5) session-global and the reducer untestable
without simulating `document.body`.

## North star: behave like a real window manager

In a real WM, every window has one concrete frame (`x, y, w, h`) owned by the
manager. "Centering" is a placement *policy* that computes concrete coordinates
and writes them — not a continuous second source. The user moving a window flips
it from *auto-placed* to *user-placed*, after which auto-placement leaves it
alone. This design makes the desktop match that model.

## Target architecture

- Every window — centered or not — renders from `state.x / state.y`. The
  `displayPos` / `displayX` / `displayY` indirection is deleted.
- `useWindowCenterLayout` becomes a pure corrector: in a layout effect
  (pre-paint) it measures the rendered box and, **while `enabled && !userSized`**,
  writes the centered frame into `state` via an explicit auto-layout method. Once
  the window is user-placed it goes silent. No `userLocked`, no `userPositioned`
  ref, no `markUserPositioned`, no `displayPos`.
- The manager treats a centered window's reported frame as authoritative and
  stops reseeding it from the `MIN_HEIGHT` placeholder.
- Geometry intent is carried by **which method** is called, not by reading
  `document.body`.

### Non-goals

- No change to non-centered placement (deterministic jittered near-center stays).
- No change to the gesture math (`useWindowGestures` drag/resize formulas).
- No visual/design changes to any window, including `about`.
- The `is-window-gesturing` class stays — it still drives CSS and the centering
  hook's during-gesture guard. It just stops being the reducer's intent signal.

## Changes

### 1. Geometry API: explicit intent (audit #3 / #17 / #18)

`useWindowManager` replaces the overloaded `setGeometry` with two methods:

- `setUserGeometry(id, patch)` — the user moved/resized. Sets `userSized = true`.
  Authoritative.
- `correctLayout(id, patch)` — automatic placement/correction (centering,
  width-sync, mobile fit, responsive relayout). Never sets `userSized`.

Details:

- `normalizeGeometryPatch` keeps the min-width / min-height clamping but drops the
  `document.body.classList` sniff. `userSized` is set only on the
  `setUserGeometry` path.
- The batch `setGeometries(updates)` (responsive relayout) keeps batch semantics
  but follows `correctLayout` rules (no `userSized`). It may be renamed
  `correctLayouts` for symmetry, or kept as `setGeometries` — naming decided in
  the plan; behavior is the `correctLayout` rule.
- `WindowManager` interface and `WindowManagerContext` are updated accordingly.

Callers:

- `useWindowGestures` (drag + resize) → `setUserGeometry`.
- `useWindowCenterLayout` (centering) → `correctLayout`.
- `useWindowWidthSync` (width drift correction) → `correctLayout`.
- `useResponsiveLayout` (mobile fit, batch relayout) → `correctLayout` /
  batch-correct.
- `Window.tsx` owns the routing: it passes the right method to each hook instead
  of one shared `onGeometryChange`.

### 2. Centering becomes a placement policy (audit #2 + #17/#18)

`useWindowCenterLayout` is rewritten to:

- Accept `userSized` (already available in `Window.tsx` as `state.userSized`).
- Run its measure-and-report effect only while `enabled && !userSized`. `enabled`
  stays `center && open && !minimized && !maximized`.
- Inside `syncPosition`, keep the `is-window-gesturing` guard so it never fights
  an in-progress drag in the window between grab and the first move committing
  `userSized`.
- Report the centered frame via the injected `correctLayout` callback. Keep a
  `lastSentRef`-style dedupe to avoid redundant reports (it is no longer a
  correctness hazard because the manager no longer clobbers the value — see #3).
- Return nothing position-related. `markUserPositioned`, `displayX`, `displayY`
  are removed.

`Window.tsx`:

- `posX = state.x`, `posY = state.y` for all windows (drop the `center ?
  displayX : state.x` branch).
- `gestureState` no longer substitutes `displayX/Y`; the gesture origin is
  `state.x/y` (with `layoutWidth` for width as today).
- Remove `handleMoveStart`'s `markUserPositioned()` call; the gesture path now
  marks `userSized` via `setUserGeometry`.

### 3. Manager stops reseeding centered windows (audit #1 / #19)

`mergeWindowUiState` currently keeps a window's custom geometry only when
`previous.userSized`. Extend it so a window's stored `x/y/width/height` is also
preserved when the window is **centered** (`def.center`). Because
`mergeWindowUiState` is a pure helper without `defs`, thread the set of centered
ids (or the relevant flag) from `useWindowManager`, where `defs` is in scope.

Result: the centering hook's written frame sticks. `state.x/y` for `about` is the
true measured center, rendered directly, pre-paint — no flicker, no divergence,
no lock state machine.

`relayoutToViewport` already skips open windows, so no change there.

## Data flow (after)

```
open(about) ──▶ manager places concrete frame (centered policy seed)
                         │
   first paint ◀── state.x/y (concrete) ──▶ Window renders top/left
                         ▲
   useWindowCenterLayout measures box (layout effect, pre-paint),
   while !userSized → correctLayout(about, {x,y,width})  (manager keeps it)
                         │
   user drags titlebar ─▶ useWindowGestures → setUserGeometry(...) (userSized=true)
                         │
   centering hook gated off (!userSized) ─▶ window stays user-placed
```

## Test strategy

### jsdom suite (updated, stays the default `pnpm test`)

- Manager tests that set `is-window-gesturing` + `setGeometry` to assert
  `userSized` switch to direct `setUserGeometry` / `correctLayout` calls — less
  setup, more honest.
- `useWindowCenterLayout` tests shrink: drop `displayPos`/lock assertions; keep
  "reports the centered frame while `!userSized`" and "goes silent once
  user-placed (`userSized`)".
- New manager test: a centered window's reported frame survives the mount-sync
  merge (regression for #1/#19).
- Update `Window.tsx`, `useWindowWidthSync`, `useResponsiveLayout`,
  `WindowManagerContext` tests for the new API names.

### New real-browser regression test (`@vitest/browser`, Playwright provider)

- Added as a **separate vitest project** so the existing jsdom `pnpm test` is
  untouched and CI stays jsdom-only. New script: `pnpm test:browser`.
- One focused spec mounting the desktop that reproduces the exact bug: open a
  second window, then drag `about` twice, asserting its rendered `top`/`left`
  never jump between the grab and the first move (sample the rect across pointer
  events). This is the guard jsdom structurally cannot provide.
- New dev dependencies: `@vitest/browser` + `playwright`. Documented in the plan;
  not added to the CI `pnpm test` path.

## Risks & mitigations

- **Wide rename surface.** `setGeometry` → `setUserGeometry`/`correctLayout`
  touches many files and tests. Mechanical; the compiler + the full suite catch
  stragglers.
- **Pre-paint correctness.** Reporting the center in `useLayoutEffect` must land
  before paint. React flushes layout effects and their resulting state updates
  before paint, so the first painted frame is correct. Verified by the browser
  test.
- **Mobile fit vs `userSized`.** Mobile fit applies to all open windows; it uses
  `correctLayout` and must not be gated on `!userSized`. Keep `correctLayout`
  caller-gated (it does not auto-skip `userSized` windows).
- **Concentrated logic risk.** The only non-mechanical logic lives in the center
  hook and `mergeWindowUiState`; both are covered by the browser test and new
  jsdom tests.

## Out of scope / follow-ups

- Audit #4 (max-height/scroll for content-sized centered windows on short
  viewports) — separate UX decision.
- Audit #16 (dead `viewportWidth/Height` props on `useWindowManager`) — optional
  cleanup, can ride along only if trivial.
