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
   (one self-contained module each) and **wrappers** (reusable window
   archetypes, each self-contained).

## Decisions (locked during brainstorming)

| Decision | Choice |
| --- | --- |
| Appetite | **Full re-architecture** — may change internal boundaries; behavior preserved. |
| Scope | **Everything** — desktop *and* the standalone Astro blog/site pages. |
| App authoring API | **Archetype factory per app**, each app a co-located module that default-exports its `AppDefinition`. |
| Discovery | **Explicit `APPS` registry array** (no auto-glob) — registry stays a thin import-and-list. |
| Wrappers | **Open / self-contained.** Each wrapper bundles its factory + render logic; the central `renderApp` switch is deleted; each `AppDefinition` carries its own `render`. |
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

  wrappers/               # "what is an app WRAPPER" — first-class, self-contained
    types.ts              # AppDefinition, AppContext, WindowChromeProps contracts
    window.tsx            # windowApp() — plain shell, custom body
    browser/   browserApp.ts  BrowserFrame.tsx  useBrowserHistories.ts  browserUtils.ts
    explorer/  explorerApp.ts ExplorerFrame.tsx GridLayout/ListLayout/FolderList...
    terminal/  terminalApp.ts TerminalFrame.tsx
    settings/  settingsApp.ts SettingsFrame.tsx + section primitives (ui)

  apps/                   # "what is an app" — one folder per app
    registry.ts           # thin: import each app, export APPS array + createPostApps
    about/index.tsx
    projects/index.tsx + data.ts
    blog/index.tsx
    photos/index.tsx
    startup/index.tsx
    settings/index.tsx     # provides AppearanceSection, GridSettingsSection (co-located)
    terminal/index.tsx + commands.ts
    trash/index.tsx + junk.ts
    area51/index.tsx  ovnis/index.tsx  classifiedDocs.tsx
    happy/index.tsx
    browser/index.tsx      # the main browser app
    post/postApp.tsx       # createPostApps factory (dynamic, per blog post)

  state/                  # goal #3 — shared state as hooks + contexts
    WindowManagerContext.tsx   WallpaperContext.tsx
    GridSettingsContext.tsx    ThemeContext.tsx (was useTheme)
    ExplorerViewContext.tsx    useDesktopIcons.ts

  lib/                    # pure helpers
    viewport.ts  cascade.ts  iconLabelTone.ts  desktopIcons.ts (moved from src/lib)
```

### Spec: what is an *app*

An app is a module that default-exports an `AppDefinition`, produced by a
wrapper factory:

```ts
interface AppDefinition {
  id: string;
  title: string | ((ctx: AppContext) => string);
  icon: IconSource;                 // co-located import OR icon key
  geometry: AppGeometry;
  desktopIcon?: DesktopIconConfig | false;
  taskbarTooltip?: string;
  availableWhen?: (ctx: Pick<AppContext, 'posts'>) => boolean;
  // self-contained: each app carries its own render — NO central renderApp switch
  render(ctx: AppContext, win: WindowChromeProps): ReactNode;
}
```

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

A wrapper is a factory module that fills in `render` using its own Frame. Adding
a wrapper means dropping a folder in `wrappers/` — no central switch to edit.

```ts
// wrappers/browser/browserApp.ts
export function browserApp(input: BrowserAppInput): AppDefinition {
  return {
    ...base(input),
    render: (ctx, win) => (
      <Window {...win} titleContent={<BrowserChrome appId={input.id} ... />}>
        <BrowserContent appId={input.id} browsers={ctx.browsers} />
      </Window>
    ),
  };
}
```

Wrappers to provide: `windowApp` (plain shell, custom `body`), `browserApp`,
`explorerApp`, `terminalApp`, `settingsApp`.

`DesktopShell` maps over open windows and calls `app.render(ctx, win)`. The
`renderApp.tsx` dispatcher and the `AppLayout` discriminated union are **deleted**.

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
- **(c)** Extract wrappers (`wrappers/*`); each `AppDefinition` carries its own
  `render`; delete `renderApp.tsx` switch and the `AppLayout` union.
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
