# Konami easter egg → opens the `happy` app in the desktop

**Date:** 2026-06-03
**Status:** Approved (design)

## Problem

The Konami code currently lives as a global inline `<script>` in
`src/components/site/BaseHead.astro` and, on completion, navigates the browser
to a standalone `/happy` page (`src/pages/happy.astro`) that renders a YouTube
iframe full-screen.

The site's homepage is a desktop emulation (a React island). A `happy` app
(`no_abrir.mp4`) already exists inside that desktop and renders the same video
in a window. The easter egg should open that app inside the desktop instead of
navigating away to a separate page.

## Decisions

- **Scope:** The egg works **only when the desktop is mounted** (homepage,
  viewport ≥ 40rem). On mobile widths and other pages it silently does nothing.
  No navigation-home fallback, no `/happy` fallback.
- **The `/happy` page is deleted.** The in-desktop app fully replaces it.
- **Approach A:** the Konami logic moves out of the global inline script and
  into the desktop React tree, co-located with its effect. The sequence matcher
  becomes pure and unit-testable.

## Architecture

Keydown → pure sequence matcher (advance / reset) → on completion →
`openWindow('happy')` → existing window manager opens the existing
`no_abrir.mp4` app (responsive-fitted on mobile widths via `useResponsiveLayout`).

The app definition (`src/desktop/apps/happy/`), the registry entry, the
trash-junk wiring, and `HappyContent` are **unchanged**.

## Units

### 1. `src/desktop/lib/konami.ts` (new) — pure matcher

A pure module holding the sequence and a small stateful matcher. No DOM, no
React — directly unit-testable.

- `KONAMI_SEQUENCE` — the existing sequence:
  `ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, b, a`.
- `createKonamiMatcher()` → returns an object with:
  - `push(key: string): boolean` — feed one key; returns `true` exactly on the
    keystroke that completes the sequence (and resets internal index to 0),
    `false` otherwise.
  - Internal index advances on match; on mismatch it resets, but restarts at 1
    if the mismatching key equals the first sequence key (preserving today's
    behavior).
- Key comparison is case-insensitive for letter keys (so `b`/`B`, `a`/`A`
  match), matching the existing `matchesKey` logic (`key === expected ||
  key.toLowerCase() === expected`).

### 2. `src/desktop/state/useKonamiCode.ts` (new) — React hook

`useKonamiCode(onUnlock: () => void): void`

- On mount, creates a matcher and attaches a `keydown` listener on `document`.
- For each event, calls `matcher.push(event.key)`; if it returns `true`, calls
  `onUnlock()`.
- Removes the listener on unmount.
- `onUnlock` is held in a ref so the listener does not need re-attaching when
  the callback identity changes.

### 3. `src/desktop/DesktopShell.tsx` — wire-up

Add one call inside the component:

```ts
useKonamiCode(() => openWindow('happy'));
```

`openWindow` already exists in the component (from `useResponsiveLayout`) and is
the correct opener (handles mobile fitting). Opening an already-open window just
focuses it (existing `open` behavior).

### 4. `src/components/site/BaseHead.astro` — remove

Delete the entire Konami `<script>` block (the `onKonamiCode` definition and the
`window.location.href = '/happy'` callback). Leave the rest of the file (analytics
script, `ClientRouter`) intact.

### 5. `src/pages/happy.astro` — delete

Remove the file. No other code links to `/happy` after BaseHead is updated
(verify with a grep for `/happy` before finalizing).

## Testing

Per the project's Vitest + jsdom setup (pure logic / hooks only; no `astro:`
virtual modules):

- **`src/desktop/lib/konami.test.ts`**
  - Full correct sequence returns `true` on the final key, `false` before.
  - Wrong key mid-sequence resets; a subsequent full sequence still completes.
  - A mismatching key that equals the first key restarts the count at 1.
  - `b`/`B` and `a`/`A` match case-insensitively.
  - After completion the matcher resets (a second full sequence completes again).
- **`src/desktop/state/useKonamiCode.test.ts`**
  - `renderHook(() => useKonamiCode(cb))`; dispatch the sequence of `keydown`
    events on `document`; assert `cb` fired exactly once.
  - Dispatch a partial/wrong sequence; assert `cb` did not fire.
  - Unmount removes the listener (post-unmount keys do not call `cb`).

## Out of scope

- No changes to the `happy` app contents, icon, title, or trash wiring.
- No new fallback behavior for mobile or non-homepage routes.
- No generalized "open any app" event bridge (YAGNI — only `happy` needs it).
