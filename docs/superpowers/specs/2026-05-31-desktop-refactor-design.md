# Desktop Refactor — Design

**Date:** 2026-05-31
**Status:** Approved (design); pending implementation plan

## Problem

The portfolio site renders a fake desktop OS. The React implementation lives in
`src/components/desktop/react/` and has grown into a mess:

- **16 loose files at the folder root** mixed with 9 subfolders, no consistent
  level of abstraction.
- **App implementations are scattered.** The terminal lives at the root
  (`TerminalApp.tsx`) *and* in `terminal/`; the browser in `browser/`; settings
  split between `settings/` and `apps/contents/SettingsBody.tsx`; about /
  classified / post bodies in `apps/contents/`. "An app" has no single home.
- The `desktop/react/` nesting itself is a smell — the `/react` layer implies a
  dead non-React version.
- Deep relative imports (`../../../../lib/desktopIcons`).
- `DesktopApp.tsx` (296 lines) mixes layout effects, trash wiring, context
  assembly, taskbar metadata, and handlers in one component.

The author wants to be able to add an app by creating a single co-located
module (e.g. `apps/snake/index.tsx`) and to have a clear, first-class spec for
**what an "app" is** vs **what an "app wrapper" is** (browser, explorer,
terminal, settings, plain window, trash).

## Goals

1. Delete unused Astro/legacy files.
2. Make the React desktop first-class (hoist out of `components/`).
3. Move all stateful logic into hooks, and shared state into contexts;
   components become thin/presentational.
4. Reorganize the desktop folder around two first-class concepts: **apps**
   (one self-contained module each) and **wrappers** (one `defineApp` primitive
   plus reuse-earned specializations). Adding a one-off app must require no new
   factory.

## Decisions (locked during brainstorming)

| Decision | Choice |
| --- | --- |
| Appetite | **Full re-architecture** — may change internal boundaries; behavior preserved. |
| Scope | **Everything** — desktop *and* the standalone Astro blog/site pages. |
| App authoring API | **Archetype factory per app**, each app a co-located module that default-exports its `AppDefinition`. |
| Discovery | **Explicit `APPS` registry array** (no auto-glob) — registry stays a thin import-and-list. |
| Wrappers | **One primitive + earned specializations.** `defineApp` is the primitive (metadata + `body` + optional `titleContent`); the only factories are `browserApp` and `explorerApp`, each justified by reuse across 2+ apps. No central `renderApp` switch. |
| State model | **Logic in hooks, shared state in contexts.** Components read from contexts. |

## Architecture

### Top-level move + path aliases

Hoist `src/components/desktop/react/` → **`src/desktop/`**. Add tsconfig path
aliases (Astro honors tsconfig `paths`) to kill the `../../../../` chains:

```jsonc
// tsconfig.json
"compilerOptions": {
  "baseUrl": ".",
  "paths": { "@/*": ["src/*"], "@desktop/*": ["src/desktop/*"] }
}
```

### Target structure

```
src/desktop/
  DesktopApp.tsx          # thin: providers + <DesktopShell/>
  DesktopShell.tsx        # renders shell + open windows (was DesktopAppContent)

  window/                 # generic OS window PRIMITIVE (frame only)
    Window.tsx  WindowTitlebar.tsx  WindowControls.tsx  useWindowGestures.ts

  shell/                  # desktop chrome — NOT apps
    Wallpaper.tsx  BootOverlay.tsx  ContextMenu.tsx
    icons/    DesktopIcons.tsx ...
    taskbar/  Taskbar.tsx  TaskbarClock.tsx
    startmenu/ StartMenu.tsx
    trash/    Papelera.tsx              # floating trash widget

  wrappers/               # the app-framework: primitive + earned specializations
    types.ts              # AppDefinition, AppContext, WindowChromeProps contracts
    defineApp.tsx         # the PRIMITIVE — wraps body (+ optional titleContent) in <Window>
    browser/   browserApp.ts  BrowserChrome.tsx  BrowserContent.tsx  useBrowserHistories.ts  browserUtils.ts
    explorer/  explorerApp.ts ExplorerLayout.tsx GridLayout/ListLayout/FolderList...
    index.ts              # re-exports defineApp, browserApp, explorerApp

  apps/                   # "what is an app" — one folder per app
    registry.ts           # thin: import each app, export APPS array + createPostApps
    about/index.tsx
    projects/index.tsx + data.ts
    blog/index.tsx
    photos/index.tsx       # browserApp preset (site launcher)
    startup/index.tsx      # browserApp preset (site launcher)
    settings/index.tsx     # defineApp; co-locates SettingsBody + Appearance/GridSettings sections
    terminal/index.tsx     # defineApp; co-locates TerminalBody + commands.ts
    trash/index.tsx        # explorerApp; co-locates junk.ts + footer
    area51/index.tsx  ovnis/index.tsx  classifiedDocs.tsx
    happy/index.tsx
    browser/index.tsx      # browserApp — the main browser window
    post/postApp.tsx       # createPostApps factory (dynamic, per blog post)

  state/                  # goal #3 — shared state as hooks + contexts
    WindowManagerContext.tsx   WallpaperContext.tsx
    GridSettingsContext.tsx    ThemeContext.tsx (was useTheme)
    ExplorerViewContext.tsx    useDesktopIcons.ts

  lib/                    # pure helpers
    viewport.ts  cascade.ts  iconLabelTone.ts  desktopIcons.ts (moved from src/lib)
```

### Spec: what is an *app*

An app is a module that default-exports an `AppDefinition`. In the common case
it calls the `defineApp` primitive directly; only when it reuses shared chrome
does it go through a specialization factory (`browserApp` / `explorerApp`).

```ts
interface AppDefinition {
  id: string;
  title: string | ((ctx: AppContext) => string);
  icon: IconSource;                 // co-located import OR icon key
  geometry: AppGeometry;
  desktopIcon?: DesktopIconConfig | false;
  taskbarTooltip?: string;
  availableWhen?: (ctx: Pick<AppContext, 'posts'>) => boolean;
  // self-contained: each definition carries its own render. The window-manager
  // wiring (state/focus/callbacks/minWidth) arrives as `win`.
  render: (ctx: AppContext, win: WindowChromeProps) => ReactNode;
}
```

The load-bearing contract is `render`. The common case never writes it by
hand — `defineApp` takes `body` (+ optional `titleContent`) and **generates**
the standard render that wraps them in the shared `<Window>` primitive:

```ts
defineApp({
  id, title, icon, geometry,
  body: (ctx) => ReactNode,            // window content
  titleContent?: (ctx) => ReactNode,   // optional titlebar chrome (browser)
  windowClassName?, bodyClassName?,
})
// → render = (ctx, win) => <Window {...win}
//      titleContent={titleContent?.(ctx)} ...>{body(ctx)}</Window>
```

There is **no central `renderApp` switch and no `AppLayout` union.** The single
`<Window>`-wrapping code path lives inside `defineApp`. Specializations that
need to wrap the window itself (explorer mounts an `ExplorerViewProvider` above
`<Window>` so the titlebar switcher and body share `mode`) supply their own
`render` — which keeps wrappers open without reintroducing a switch.

`AppContext` — the read-only runtime environment passed to `render` (unchanged
in spirit from today's `WindowAppContext`):

```ts
interface AppContext {
  posts: BlogPostSummary[];
  onOpenPost: (slug: string) => void;
  onOpenLink: (url: string) => void;   // open URL in main browser window
  browsers: BrowserHistories;
  trash: TrashController;
  iconUrls: Record<string, string>;
}
```

`WindowChromeProps` — the window-manager callbacks + state that `DesktopShell`
hands each app's `render` so the wrapper can mount the shared `<Window>`
primitive (focus/close/minimize/maximize/geometry, focused flag, class hooks).

### Spec: what is an *app wrapper*

A wrapper is a thin factory over `defineApp` that bundles a reusable `body`
(and, for browser, `titleContent` + state). A factory exists **only when 2+
apps share its wiring** — single-use chrome stays a plain `defineApp` app. This
is YAGNI by construction: shipping an app never requires writing a factory.

The full set is the primitive plus two earned specializations:

```ts
// wrappers/defineApp.tsx — the PRIMITIVE (covers terminal, settings, about,
// snake, classified, post, happy: anything that's "a window with a body").
export function defineApp(input: AppInput): AppDefinition { /* identity + defaults */ }

// wrappers/browser/browserApp.ts — reused by browser, photos, startup (3 apps).
// Adds the titlebar URL chrome, per-app history, and URL-derived title.
export function browserApp(input: BrowserAppInput): AppDefinition {
  return defineApp({
    ...input,
    title: (ctx) => hostOf(ctx.browsers.get(input.id).url) ?? input.title,
    titleContent: (ctx) => <BrowserChrome appId={input.id} browsers={ctx.browsers} ... />,
    body: (ctx) => <BrowserContent appId={input.id} browsers={ctx.browsers} />,
  });
}

// wrappers/explorer/explorerApp.ts — reused by projects, blog, trash (3 apps).
// Adds the list/grid + view-mode + activate + footer convention.
export function explorerApp(input: ExplorerAppInput): AppDefinition { /* ... */ }
```

`browser` is the only archetype that uses `titleContent`; at the framework level
it is therefore no longer structurally special. Single-use bodies become plain
apps: `terminalApp` and `settingsApp` are **not** created — `apps/terminal/` and
`apps/settings/` call `defineApp` with their own co-located body component.

`DesktopShell` maps over open windows and renders each via the generic
`defineApp` code path. The `renderApp.tsx` dispatcher and `AppLayout` union are
**deleted**.

### Worked example: adding an app (Snake)

The reference path for adding a one-off app — no factory, one registry line:

```tsx
// apps/snake/index.tsx
import { defineApp } from '@desktop/wrappers';
import snakeIcon from './icon.svg?url';
import SnakeGame from './SnakeGame';   // plain React component; owns its own state

export default defineApp({
  id: 'snake',
  title: 'snake.exe',
  icon: snakeIcon,
  geometry: { defaultWidth: 480, defaultHeight: 520, initialZ: 19 },
  desktopIcon: { label: 'snake.exe', tooltip: 'No trabajes, juega' },
  body: () => <SnakeGame />,
});
```

```ts
// apps/registry.ts  — the one explicit edit
import snakeApp from './snake';
export const APPS = [ aboutApp, snakeApp, /* … */ ];
```

Decision rule for future apps:

| Adding… | Write |
| --- | --- |
| A one-off app (Snake, calculator, guestbook) | `defineApp({ body })` — no factory |
| Another site launcher | reuse `browserApp({ initialUrl })` |
| Another file/grid list | reuse `explorerApp({ items })` |
| A new archetype shared by 2+ apps | promote to a factory *then* (not before) |

### State model (goal #3)

`DesktopApp.tsx` is decomposed; logic moves to hooks, shared state to contexts:

- `useDesktopApps(posts)` → `{ apps, defs }`
- `useResponsiveLayout(defs)` → the resize / clamp / center effects (today inline)
- `useTrashController(icons, openWindow)`
- `useAppContext(...)` → assembles `AppContext`
- `useTaskbarMeta(apps)`
- `useTheme` → promoted to `ThemeContext`
- Browser histories stay in `AppContext`, backed by `useBrowserHistories`

`DesktopApp.tsx` becomes a thin provider tree wrapping `<DesktopShell/>`.

### Astro / site side ("everything" scope)

- **Delete dead:** `src/components/DraggableWindows.astro` and
  `src/utils/draggable-windows.ts` (old pre-React drag system; only
  self-referenced). The string `draggable-windows` in `terminal/commands.ts` is
  ASCII art, not an import.
- **Group site components:** move `Header.astro`, `BaseHead.astro`,
  `NoiseBackground.astro`, `PostPreview.astro`, `ThemeToggle.astro` →
  `src/components/site/`. Keep `src/components/ui/` (Card, Divider, PostList,
  SectionHeading, Tag, TerminalPrompt) as the design-system primitives.
- Blog pages (`/blog`, `/blog/[slug]`), `/happy`, `/404`, and the layouts
  (`BaseLayout`, `PostLayout`) stay **functionally identical** — only import
  paths change.

## Migration plan (staged, each stage ends green)

Each stage must pass `pnpm build`, `pnpm check`, and `pnpm lint` before the next
begins. No functional/behavioral changes anywhere — pure restructuring.

- **(a)** Add path aliases; delete dead files (`DraggableWindows.astro`,
  `draggable-windows.ts`).
- **(b)** Hoist `components/desktop/react/` → `src/desktop/` (mechanical move,
  fix imports / adopt aliases).
- **(c)** Introduce the `defineApp` primitive (`body`/`titleContent` → `<Window>`)
  plus `browserApp` / `explorerApp` factories; delete `renderApp.tsx` switch and
  the `AppLayout` union. `terminal` and `settings` become plain `defineApp` apps.
- **(d)** Split the registry into per-app modules under `apps/*`; `registry.ts`
  becomes import-and-list.
- **(e)** Decompose `DesktopApp.tsx` into hooks + contexts (`state/*`).
- **(f)** Group site `.astro` components under `components/site/`.

## Non-goals

- No new apps or features; no visual/behavioral changes.
- No change to content (blog posts, copy) or to the public routes.
- No auto-glob discovery (explicit registry kept by choice).

## Verification

A clean `pnpm build` + `pnpm check` + `pnpm lint` at the end of each stage.
Manual smoke check of the desktop (open windows, browser nav, trash,
settings, taskbar, mobile layout) and the blog pages after the final stage.
