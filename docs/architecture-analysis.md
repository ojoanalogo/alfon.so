# Devfolio — Architecture Analysis & Refactoring Plan

> Astro 6 + React 19 "desktop-OS" portfolio. Static `.astro` page shell hydrating a single React desktop island behind `client:media`, with an OS metaphor (windows, taskbar, draggable icons, start menu, ~18 mini-apps including four canvas games).

---

## 1. Architecture overview

The codebase splits into two cleanly-motivated halves connected by a deliberately narrow seam:

- **Site shell (`src/pages`, `src/layouts`, `src/components/site`, `src/styles`, `src/lib`)** — static Astro routing, SEO/head, the Tailwind v4 styling system (`global.css` + `tokens.ts` + `proseConfig.ts`), theme bootstrap, and the blog content collection. Only two hydration points exist (`index.astro` desktop, About content), each gated to exactly one viewport class so the desktop never ships to mobile.
- **Desktop subsystem (`src/desktop/**`)** — organized by concern: `state/` (window manager, icons, theme, wallpaper), `window/` (chrome + geometry), `shell/` (icons grid, taskbar, start menu, boot overlay), `apps/` (the ~18 apps + a single `registry.ts`), and `wrappers/` (the `defineApp`/`browserApp`/`explorerApp` authoring toolkit + reusable UI/lib helpers).

The **design philosophy is genuinely sound and largely honored**:

- **One source of truth for apps.** `registry.ts` drives window defs, desktop icons, taskbar, start menu, and even terminal `ls`. There really is (almost) no second registration point.
- **A clean app-authoring contract.** Apps import only from `@desktop/wrappers`; `AppContext`/`WindowChromeProps` decouple ~18 apps from window-manager internals. Apps never import each other — they navigate via `ctx.onOpenApp`/`onOpenLink`/`onOpenPost`.
- **A clear styling convention.** Inline Tailwind for layout/visual tokens, shared class-string constants in `tokens.ts`, and `@layer components` in `global.css` reserved (with a documented allow-list) for what utilities cannot express: generated content, `@keyframes`, ancestor/descendant-state combinators, `!important` geometry, JS-toggled class hooks. This convention is audited as clean — `shrink-0` (not `flex-shrink-0`) is used uniformly; `CARD_*`/`WINDOW_ACTION_BTN` tokens are reused, not re-derived.
- **A pragmatic, dependency-injected shell.** `DesktopShell.tsx` is an honest wiring hub: it holds instance-local state hooks and threads state + callbacks down as props. Most state is *not* promoted to Context (only WindowManager/Theme/Wallpaper are), which keeps the dependency graph legible.

The **honest weaknesses** cluster in two places and one cross-cutting theme:

1. **Window geometry is split between React state and the live DOM.** Because `WindowState.height` can be `null` (content-sized), the truth of a window's size is sometimes only knowable by `getBoundingClientRect()`. This forces `Window.tsx`, `useWindowGestures`, `useWindowCenterLayout`, and `useWindowManager.relayoutToViewport` to all measure the DOM, and it drives a multi-pass `rAF`/`flushSync`/`layoutEpoch` relayout scheduler that the recent commit history shows was iterated to correctness rather than designed up front. This is the dominant architectural tension.
2. **A `body.is-window-gesturing` magic CSS class is an undocumented control channel.** It is *set* by the drag/gesture hooks but *read* by `useWindowManager.normalizeGeometryPatch` (to infer the persistent `userSized` flag), by `useWindowCenterLayout` (to suspend re-centering), and styled in `global.css`. A gesture in one module silently changes state semantics in three others, with no type enforcement.
3. **A small lib ⇄ state import cycle and forked layout constants.** Layout constants (`MIN_WIDTH`/`MIN_HEIGHT`/`TASKBAR_HEIGHT`) live *inside* `useWindowManager.ts`, so leaf libs (`viewport.ts`, `windowPlacement.ts`) import back into the React state hook, and `EDGE_MARGIN`/`MOBILE_BREAKPOINT`/`isMobileViewport` are re-declared across 4+ files.

None of these are correctness bugs today — they are maintainability/coupling debt, accurately reflected in the recent run of window-sizing/centering fix commits.

---

## 2. Key strengths worth preserving

- **The registry-as-single-source pattern.** Do not undermine it; the only place it's currently violated is `DESKTOP_ICON_ORDER` (see plan).
- **The `@desktop/wrappers` contract boundary.** ~18 apps depend on a small, stable surface. Keep apps from importing each other or window internals.
- **The DI shell design.** `DesktopShell` holding instance-local hooks and passing props is simpler than promoting everything to Context. Don't "fix" this into a provider tree.
- **The documented `tokens.ts` / `global.css` cascade-layer split.** It is correct and adhered to. The `global.css` allow-list comment (lines 63-69) is load-bearing documentation.
- **`proseConfig.ts` as the single prose-token source.** It already encodes the fix for a past drift bug; keep both desktop consumers on `PROSE_CLASS_BASE`.
- **Games already share `useGameLoop`/`useGameControls`/`GameShell`.** Extraction precedent exists — further consolidation is "more of the same," not new abstraction.

---

## 3. Prioritized refactoring plan

Ordered by impact-to-effort. Each item flags effort (S/M/L), risk, and — per AGENTS.md (Simplicity First, Surgical Changes) — whether the "fix" should be **skipped** or **scoped down**.

### Theme A — Initial-load performance (highest impact)

#### A1. Code-split the heavy, rarely-opened apps `[high impact]`
- **Problem:** The entire desktop — all ~18 app modules, 4 canvas games, `framer-motion`, `marked`, `lucide-react` — ships as one synchronous `client:media` island. A repo-wide grep for `React.lazy`/`Suspense`/`import(` returns **zero** matches; there is no code splitting anywhere.
- **Files:** `src/pages/index.astro:55-60`, per-app `render()` wrappers (`apps/games/*/index.tsx`, `apps/notes/index.tsx`, `apps/terminal/index.tsx`), `apps/notes/NotesEditor.tsx:3`.
- **Change:** Wrap the 4 game canvases + Notes + Terminal in `React.lazy` + `Suspense` at the app-definition `render()` boundary so each module loads on first window-open. Additionally `await import('marked')` inside `NotesEditor` to drop it from the initial bundle. Leave `framer-motion` eager (used by always-mounted Window/Taskbar/StartMenu chrome).
- **Effort:** L · **Risk:** Medium — scoped to per-app render wrappers; does not touch the registry contract or styling split. Verify lazy boundaries don't break the open-flow's `flushSync` sequencing.

#### A2. Don't mount app bodies for never-opened windows `[medium impact]`
- **Problem:** `Window.tsx` computes `status='closed'` but never early-returns; it always renders `{children}` (toggling only `aria-hidden`/`inert`). Every app body mounts and runs effects on initial hydration even if never opened (`useNotes` reads localStorage in a `useState` initializer + runs a save effect; game *loops* already gate themselves, but canvases still mount).
- **Files:** `Window.tsx:198-295`, `defineApp.tsx:39-52`, `DesktopShell.tsx:110-130`, plus a `wasOpened` flag in `useWindowManager`.
- **Change:** Track a per-window "has been opened" flag and render `{wasOpened ? body(ctx, win) : null}`. **Prefer keep-mounted-after-first-open** over naive `state.open && children` so terminal history / unsaved notes survive close+reopen.
- **Effort:** M · **Risk:** Medium — must validate notes/terminal/browser session state survives close+reopen.

#### A3. rAF-coalesce and dedupe the resize handlers `[medium impact, S effort — quick win]`
- **Problem:** Three independent, unthrottled resize listeners fire per tick: `useViewportSize` (window + visualViewport), `useDesktopIcons.ts:114` (a second window resize that setStates all icon positions), and `useResponsiveLayout` (bumps `layoutEpoch`, then runs up to 3 layout passes). On continuous drag-resize / mobile keyboard toggle this re-renders the whole shell subtree (no `React.memo`) repeatedly.
- **Files:** `lib/useViewportSize.ts:14-26`, `state/useDesktopIcons.ts:101-116`, `DesktopApp.tsx:17-23`.
- **Change:** rAF-batch `update()` in `useViewportSize`; drop or rAF-batch the duplicate listener in `useDesktopIcons`. Keep the existing equality guard. Optionally consolidate behind one shared rAF-throttled viewport subscription.
- **Effort:** S · **Risk:** Low — behavior-preserving.

### Theme B — Break the geometry/constants coupling (foundation for everything else)

#### B1. Extract a dependency-free `layoutConstants.ts` `[medium impact, S effort — quick win]`
- **Problem:** `MIN_WIDTH`/`MIN_HEIGHT`/`TASKBAR_HEIGHT`/`minWidthForDef` live inside the `useWindowManager` React hook; leaf libs import back into it → real lib ⇄ state import cycle. `EDGE_MARGIN` (8) is re-declared in 4 files; `MOBILE_BREAKPOINT`/`isMobileViewport` are forked in `useDesktopIcons`.
- **Files:** `state/useWindowManager.ts:10-16`, `lib/viewport.ts:3,8-12`, `lib/windowPlacement.ts:1,3`, `window/useWindowCenterLayout.ts:4`, `state/useDesktopIcons.ts:19-25`, `shell/startmenu/StartMenu.tsx:15`.
- **Change:** Create `src/desktop/lib/layoutConstants.ts` exporting `MIN_WIDTH`, `MIN_HEIGHT`, `TASKBAR_HEIGHT`, `EDGE_MARGIN`, `MOBILE_BREAKPOINT_PX`, `minWidthForDef`, and a single width-optional `isMobileViewport`. Re-point all importers/re-declarations. Don't touch icon-grid-specific constants (`BASE_X`, `ROW_PITCH_DESKTOP`) — they're legitimately local.
- **Effort:** S · **Risk:** Low — pure re-pointing of plain constants. Preserve the width-optional `isMobileViewport` signature when consolidating.

#### B2. Move `desktopColors.ts` out of `apps/` into a neutral leaf `[medium impact, S effort — quick win]`
- **Problem:** `state/WallpaperContext.tsx` imports `DESKTOP_COLORS`/`resolveDesktopColorValue` from `../apps/settings/desktopColors` — a state→apps import that inverts intended layering. `AppearanceSection` then reads `desktopColors` back off the context (dual-source ambiguity).
- **Files:** `state/WallpaperContext.tsx:10-14`, `apps/settings/desktopColors.ts`, `apps/settings/AppearanceSection.tsx:59`.
- **Change:** Relocate `desktopColors.ts` → `src/desktop/lib/desktopColors.ts` (precedent: WallpaperContext already imports `lib/iconLabelTone` and `config/wallpapers`). Fix the two import sites. No behavior change.
- **Effort:** S · **Risk:** Low.

#### B3. Centralize the JS-toggled state-class names (the `is-window-gesturing` channel) `[low impact, S effort]`
- **Problem:** Behavioral class names (`is-window-gesturing`, `is-trash-drop-target`, `is-sized`, `is-focused`, `is-dragging`, `is-selected`) are string literals set in TSX and read in `global.css` and other hooks, with no type link.
- **Change:** Export them as named string constants from a single module near `tokens.ts` so the setters and CSS share one source. **This is the only convention-aligned response to the "global.css owns desktop styling" finding** — do **not** split the CSS (see §5).
- **Effort:** S · **Risk:** Low.

### Theme C — Type-contract hardening

#### C1. Derive `WindowChromeProps` from `WindowProps` `[medium impact, S effort — quick win]`
- **Problem:** `WindowChromeProps` is a hand-maintained near-duplicate of `WindowProps` with no compile-time link; they have **already drifted** (`minWidth` required in one, optional in the other). A future required `WindowProp` becomes a silent gap at the `<Window {...win}>` app boundary.
- **Files:** `wrappers/types.ts:41-55`, `window/Window.tsx:17-38`.
- **Change:** `type WindowChromeProps = Omit<WindowProps, 'title' | 'children' | 'titleContent' | 'bodyClassName' | 'windowClassName'>` — mirroring the existing `Omit<WindowProps, ...>` in `ExplorerWindow.tsx`. Note this flips `minWidth` to optional; if chrome callers depend on required, intersect `& { minWidth: number }`.
- **Effort:** S · **Risk:** Low.

#### C2. Tighten `iconUrls` and a few small contract nits `[low impact, S effort — bundle these]`
- `AppContext.iconUrls` / `DesktopIconUrls`: widen-from-strong-union back to `Record<IconKey, string>` so `ctx.iconUrls.blgo` typos fail at compile time. **Do not** change `resolveIconUrl(key: string)` — it's intentionally called with non-`IconKey` ids via `definition.iconKey ?? definition.id`. (`wrappers/types.ts:37`, `lib/desktopIcons.ts:34`)
- Annotate `const win: WindowChromeProps = {...}` in `DesktopShell.tsx:114` to enable excess-property checking at the construction site.
- Drop the unnecessary `!` non-null assertion: `onOpenWindow(icon.windowId)` (`StartMenu.tsx:155`) — `windowId: string` is already non-nullable.
- Terminal: thread real focus — `focused: win?.focused ?? false` instead of hardcoded `true` (`apps/terminal/index.tsx:13`). This fixes an actual minor bug: terminal grabs input focus on mount even when opened behind another window.
- **Effort:** S each · **Risk:** Low.

### Theme D — Single-source-of-truth & content-leak fixes

#### D1. Filter the blog `published` flag `[medium impact, S effort — quick win, latent footgun]`
- **Problem:** `getCollection('blog')` is used raw at every call site with no `published` filter. The sole post is `published:false` yet renders live in the blog index, generates a static `/blog/<slug>/` page, and ships into the desktop. Today it's the only post (so filtering would empty the blog) — a latent leak for the next real draft.
- **Files:** `pages/blog/index.astro:10`, `pages/index.astro:15`, `pages/blog/[slug].astro:8`, `content.config.ts:12`.
- **Change:** Add `getPublishedPosts()` in `lib/blog.ts` filtering `entry.data.published !== false`; use at all 3 call sites; verify the sitemap integration doesn't surface the draft. Optionally allow drafts in dev via `import.meta.env.DEV`.
- **Effort:** S · **Risk:** Low (with the dev-allowance, authoring still works locally).

#### D2. Eliminate the `DESKTOP_ICON_ORDER` sync hazard `[medium impact, S effort]`
- **Problem:** A second hand-maintained app-id list parallel to `APPS`, contradicting the registry's "no second place to update" docstring. An app missing from this list silently sorts last.
- **Files:** `apps/desktopIcons.ts:9-24`, `apps/registry.ts`.
- **Change:** The *display-order difference* from the start menu is intentional and fine. The hazard is the parallel id *list*. Smallest fix: keep the order array but add a compile- or test-level exhaustiveness assertion that every `APPS` id with `desktopIcon !== false` is present (e.g. a `Record<AppId, number>` keyed by id, or a typed check), so a forgotten id fails CI instead of silently sorting last. **Skip** adding an `iconOrder` field to every `AppDefinition` (broader, fights Simplicity First).
- **Effort:** S · **Risk:** Low.

### Theme E — Duplication cleanup (low-risk, do opportunistically)

#### E1. Extract the games' shared directional controller `[medium impact, M effort]`
- **Problem:** The `moveRef` + active-gated keyup `useEffect` block is **byte-for-byte identical** across Pong/Plane/Breakout; the whole scaffold (canvas ref, `useState(initial)`, draw-on-`[game]` effect, `restart`, `tick`) is near-identical across all four (~840 lines total).
- **Files:** `apps/games/{pong,plane,breakout,snake}/*.tsx`.
- **Change:** Extract `useAxisControls(active, speed)` (the verbatim moveRef + keyup block) first — highest value, lowest churn. Optionally `useCanvasFrame(game, draw)` for the shared draw effect. Keep each game's `drawFrame`/`stepGame` physics local; **leave Snake's `directionRef` model as-is** (genuinely different). This matches the existing `useGameLoop`/`GameShell` precedent, so it's consolidation, not new abstraction.
- **Effort:** M · **Risk:** Low.

#### E2. The identical game-over overlay JSX `[low impact, S effort]`
- Extract `GameOverOverlay({ show, onRestart })` into `GameShell.tsx` (which already has an `overlay?` prop). Each game passes `show={game.gameOver}` (breakout: `|| game.won`), keeping the predicate at the call site. (`apps/games/*/*.tsx`)
- **Effort:** S · **Risk:** Low.

#### E3. Remove the `{...meta, render: () => null}` shim duplication `[low impact, S effort]`
- Narrow `resolveAppTitle(app: AppDefinition, ...)` → `Pick<AppDefinition, 'title'>` in `wrappers/types.ts:90`, then pass `meta` directly and delete the throwaway shim at `defineApp.tsx:40` and `explorerApp.tsx:30`. **Do not** try to make `explorerApp` delegate to `defineApp` — it mounts a *different* component (`ExplorerWindow`), which `defineApp` cannot swap; that part is intrinsic, not missed reuse.
- **Effort:** S · **Risk:** Low.

#### E4. Extract a shared popover dismiss/clamp hook `[low impact, M effort — optional]`
- `StartMenu` and `ContextMenu` independently reimplement viewport-clamp + capture-phase outside-pointerdown + Escape dismissal, each defining `VIEWPORT_MARGIN = 8`. Extract `useDismissablePopover(...)` + `clampToViewport(...)`; keep the two positioning models separate, pass scroll/blur vs resize as options. Only do this if touching these files anyway. (`StartMenu.tsx:42-82`, `ContextMenu.tsx:27-65`)
- **Effort:** M · **Risk:** Low.

### Theme F — God-module decomposition (real debt, but apply surgically)

#### F1. Extract pure helpers from `useWindowManager` (410-line module) `[medium impact, L effort]`
- **Problem:** One hook owns store + lifecycle + z-index + normalization + an 83-line DOM-measuring `relayoutToViewport`. The geometry-application shape `{width, height: defaultHeight ?? geo.height, userSized:false, …}` is duplicated 3× (`open`, `applyDefaultOpenLayout`, `relayoutToViewport`) with repeated 4-field self-comparison bail-outs.
- **Change (scoped):** Extract a pure `applyDefaultGeometry(target, geo, def)` helper to collapse the 3 duplicated blocks; move *only* the DOM-measuring part of `relayoutToViewport` (`querySelector` + `getBoundingClientRect`) into a `measureCenterWindow` helper so state logic stops touching the DOM. **Skip `useReducer`** — it's optional and rewriting working, non-duplicated lifecycle handlers fights Surgical Changes.
- **Effort:** L (pure-helper portions are M) · **Risk:** Medium — geometry is the area the recent fix commits churned; extract behavior-identically and test open/maximize/relayout flows.

#### F2. Extract hooks from `Window.tsx` `[medium impact, M effort]`
- **Problem:** Presentation mixed with three state machines: a render-phase `setState` (maximize cross-fade sync), a self-correcting width effect that calls `onGeometryChange` back into the store, and a three-way height model (null / minHeight floor / fixed) spread across Window/viewport/useWindowManager.
- **Change:** Extract `useMaximizeAnimation` and `useWindowWidthSync`, mirroring the existing `useWindowCenterLayout`/`useWindowGestures` pattern in the same dir. Centralize the null/floor/fixed height decision into one helper colocated with `resolveLayoutWidth` in `viewport.ts`. Pure extractions, no behavior change. The render-phase `setState` is valid React (derive-state-from-props with equality bail-out) — keep it.
- **Effort:** M · **Risk:** Medium.

#### F3. `useResponsiveLayout` multi-pass scheduler `[document, don't rewrite]`
- **Problem:** A hand-rolled multi-pass layout effect (sync + 2× rAF + `layoutEpoch` self-retrigger + `flushSync`) with implicit React-commit-timing dependencies.
- **Change:** **Do not rewrite speculatively.** Add a top-of-hook comment naming the single source of truth for geometry (WM state vs measured DOM) and the ordering contract between passes. *If* a trace proves the `layoutEpoch` self-retrigger (line 129) is redundant with the rAF passes, remove only that. Note `useWindowCenterLayout` already uses the same sync+rAF+`fonts.ready`+`ResizeObserver` idiom — a full collapse is a cross-module L-effort refactor that violates Simplicity First if done now.
- **Effort:** S (documentation) · **Risk:** Low.

#### F4. `useDesktopIconDrag` teardown consolidation `[low impact, S effort]`
- The 304-line drag hook's body-class cleanup is scattered across `endDrag` and the trash-drop early-return. Extract a single `teardown()` (clears both body classes, resets `overTrashRef`, nulls `dragRef`) called from all drag-end paths. **Skip** the larger `useIconTiltAnimation`/AbortController rewrites (exceed Surgical Changes). Document the `snapshotRef`-into-empty-deps pattern — it's deliberate and correct.
- **Effort:** S · **Risk:** Low.

### Theme G — Smaller localized cleanups (S effort, do when adjacent)

- **`WallpaperContext`:** call `resolveStoredPreferences(wallpapers)` **once** and seed both `wallpaperId`/`backgroundColorId` from it instead of twice (double localStorage read on mount). Wrap `ThemeContext` value in `useMemo` + setters in `useCallback` (mirroring WallpaperContext). The stringly-typed tri-state retype is optional/larger — defer. (`WallpaperContext.tsx:125-132`, `ThemeContext.tsx:62-70`)
- **`useWindowCenterLayout`:** drop the redundant synchronous + double-rAF `syncPosition` triggers (single rAF + `fonts.ready` + `ResizeObserver` cover settle); guard `onGeometryChange` behind an actual-change check. Keep the `is-window-gesturing` read (established pattern). (`useWindowCenterLayout.ts:67-74`)
- **`commands.ts`:** thread `theme` through `TerminalCommandContext` (read from `useTheme()` in `TerminalApp`) so `neofetchLines` stops reading `document.documentElement.classList` — the module's only DOM read. (`apps/terminal/commands.ts:66-67`)
- **`lib/blog.ts`:** the `(entry as unknown as { rendered?… })` double-cast is isolated; extract a tiny typed helper that logs/throws when `rendered.html` is absent so the silent `marked` fallback becomes observable. (`lib/blog.ts:18-19`)
- **Dead code (safe deletes):** `wrappers/explorer/ListLayout.tsx` (zero importers; active renderer is `FolderList`); `ExplorerItem` alias at `ExplorerLayout.tsx:12`; the 4 never-consumed barrel re-exports in `wrappers/index.ts:2,3,6,9`. Per AGENTS.md these are pre-existing dead code — delete only if explicitly doing a cleanup pass, otherwise note.
- **Memory doc fix (outside repo):** `~/.claude/projects/.../memory/desktop-styling-convention.md` references pre-restructure `src/components/desktop/**` paths — every path is stale. Repoint to `src/desktop/**` and `src/desktop/apps/settings/ui.tsx`; drop the dead `.claude/css-migration-plan.md` reference. Convention *content* is still correct.

---

## 4. Quick wins (do these first)

S-effort, high-value, low-risk:

1. **B1** — extract `layoutConstants.ts` (breaks the lib⇄state cycle + removes forked constants). *Foundation for later geometry work.*
2. **D1** — filter blog `published` (closes a content-leak footgun before the next draft).
3. **C1** — derive `WindowChromeProps` from `WindowProps` (kills the contract-drift class).
4. **B2** — move `desktopColors.ts` to a neutral leaf (removes state→apps inversion).
5. **A3** — rAF-coalesce/dedupe resize handlers (cheap perf + render-thrash win).
6. **C2 bundle** — `iconUrls` typing, `win` annotation, drop `windowId!`, terminal `focused` (the last is an actual minor bug fix).
7. **D2** — `DESKTOP_ICON_ORDER` exhaustiveness check (restores registry single-source guarantee).

---

## 5. Explicitly out of scope / do-not-touch

These were flagged but are **by-design, correct, or where the proposed fix violates AGENTS.md** (Simplicity First / Surgical Changes). Do not "fix" them:

- **Splitting `global.css` into a desktop stylesheet.** The single-stylesheet arrangement is intentional and documented (header lines 63-69), and this is a single-bundle Astro site. A wholesale CSS split is L-effort churn on working code. The *only* sanctioned step is B3 (centralize the JS-toggled class names) — no CSS moves.
- **Routing wallpaper/theme setters through `AppContext`.** `AppContext` is documented read-only; the Settings app intentionally consumes `WallpaperContext`/`ThemeContext` directly (so does `ThemeSegmentedControl` via `useTheme`). Threading mutable setters through ~18 apps for one consumer is exactly the speculative plumbing the ethos forbids. At most, add a one-line "privileged app" comment.
- **Rewriting `useResponsiveLayout` into a single-pass ResizeObserver scheduler.** Document it (F3); don't rewrite speculatively — the multi-pass idiom is codebase-wide and the geometry code is the area recent fixes churned.
- **`BootOverlay` module-level `bootFinished` flag.** The non-replay-on-remount behavior is the documented, desired UX. Do not introduce `sessionStorage` or a provider; the 3-line flag is intentionally minimal.
- **Memoizing the per-app `win` closures / splitting `AppContext` into capability sub-objects.** With ~7-18 trivial apps and tiny event closures, this buys nothing measurable and adds single-use abstraction. Only revisit if the app count grows substantially or a measured re-render problem appears.
- **Adding a test toolchain solely for the prose/theme-duplication findings.** The repo has zero test infra. For prose tokens and the no-flash theme script, the convention-aligned fix is a cross-linking comment (theme.ts ↔ BaseLayout inline script must stay in lockstep), **not** standing up vitest/playwright. The inline no-flash script genuinely cannot import a module pre-paint — partial duplication is inherent to the pattern.
- **Unifying the parody "classified files" content across `classifiedDocs.tsx` / `junk.ts` / `commands.ts`.** The three are deliberately different shapes (rich JSX, trash metadata, terminal plaintext). At most, reference the canonical filename tuple from `junk.ts` so the three can't disagree on *which* files exist — do not derive the prose bodies from one source.
- **The `userSized` `Partial<WindowGeometry>` smuggling** is a type-clarity nit, not a runtime bug (current behavior is correct). The `GeometryPatch` retype is a fine *if-touching-anyway* improvement, not a priority.

> **Standing rule for all of the above:** every changed line should trace to one of the numbered items. No adjacent "improvements," no reformatting, match existing style.
