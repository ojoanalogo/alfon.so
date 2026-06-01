# Desktop Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the React desktop into a first-class `src/desktop/` tree with a single-primitive app framework (`defineApp` + `browserApp`/`explorerApp`), all shared state in hooks/contexts, and the dead Astro drag system removed — with zero behavioral change.

**Architecture:** Six staged migrations (A–F). Each is a pure restructuring that ends on a green verification gate. An *app* is a module that default-exports an `AppDefinition` (built by `defineApp` or a specialization factory); each definition carries its own `render(ctx, win)`, so there is no central dispatch switch. Wrappers (`browserApp`, `explorerApp`) exist only where 2+ apps share chrome.

**Tech Stack:** Astro 6, React 19, TypeScript (strict), Tailwind 4, framer-motion. Package manager: pnpm. **No test framework exists** and none is added.

---

## Verification model (read first)

This is a **behavior-preserving refactor with no test harness**. TDD is not applicable; the verification gate for every task is the build/typecheck/lint trio plus a manual smoke check at the end.

**The gate command (run from repo root):**

```bash
pnpm check && pnpm lint && pnpm build
```

**Baseline (must be preserved at every task):**
- `pnpm check` → `0 errors, 0 warnings, 5 hints`, exit 0
- `pnpm lint` → no output, exit 0
- `pnpm build` → `Complete!`, exit 0

If a task's gate shows *more* errors/warnings than baseline, the task is not done. Never edit `eslint`/`tsconfig` to silence a real error introduced by the refactor.

**Branch:** all work lands on `refactor/desktop-architecture` (already created). Commit after every task.

**Rename mechanic:** prefer `git mv` so history follows files. After moving, fix imports, then run the gate.

---

## File structure (target)

```
src/desktop/
  DesktopApp.tsx          DesktopShell.tsx        types.ts
  window/    Window.tsx WindowTitlebar.tsx WindowControls.tsx useWindowGestures.ts index.ts
  shell/     Wallpaper.tsx BootOverlay.tsx ContextMenu.tsx ThemeToggle.tsx
             icons/(DesktopIcons.tsx ...)  taskbar/(Taskbar.tsx TaskbarClock.tsx)
             startmenu/(StartMenu.tsx)     trash/(Papelera.tsx)
  ui/        parts.tsx Modal.tsx           (shared presentational primitives)
  wrappers/  types.ts defineApp.tsx index.ts
             browser/(browserApp.tsx BrowserChrome.tsx BrowserContent.tsx useBrowserHistories.ts browserUtils.ts)
             explorer/(explorerApp.tsx ExplorerLayout.tsx ExplorerTitleContent.tsx ExplorerWindow.tsx
                       GridLayout.tsx ListLayout.tsx FolderList.tsx ListItemIcon.tsx fakeFileSize.ts LayoutSwitcher.tsx types.ts)
  apps/      registry.ts  cascade.ts
             about/  projects/  blog/  photos/  startup/  settings/  terminal/
             trash/  area51/  ovnis/  happy/  browser/  post/
  state/     WindowManagerContext.tsx useWindowManager.ts WallpaperContext.tsx
             GridSettingsContext.tsx ThemeContext.tsx useDesktopIcons.ts
             useDesktopApps.ts useResponsiveLayout.ts useAppContext.ts useTrashController.ts useTaskbarMeta.ts
  lib/       viewport.ts iconLabelTone.ts useResolvedIconLabelTone.ts useViewportSize.ts desktopIcons.ts

src/components/site/   Header.astro BaseHead.astro NoiseBackground.astro PostPreview.astro ThemeToggle.astro
src/components/ui/     (unchanged: Card/Divider/PostList/SectionHeading/Tag/TerminalPrompt .astro)
```

Tasks A/B do the move; C–E reshape the contents into the above; F handles the `.astro` side.

---

## Task A: Path aliases + delete dead files

**Files:**
- Modify: `tsconfig.json`
- Delete: `src/components/DraggableWindows.astro`
- Delete: `src/utils/draggable-windows.ts`

- [ ] **Step 1: Confirm baseline gate is green**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: check `0 errors, 0 warnings, 5 hints`; lint silent; build `Complete!`.

- [ ] **Step 2: Add path aliases to tsconfig**

Replace the entire contents of `tsconfig.json` with:

```jsonc
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@desktop/*": ["src/desktop/*"]
    }
  }
}
```

- [ ] **Step 3: Confirm the dead files have no live importers**

Run: `rg -n "DraggableWindows|draggable-windows" src --glob '!**/DraggableWindows.astro' --glob '!**/draggable-windows.ts'`
Expected: the only match is the ASCII-art string `WM: draggable-windows` in `src/components/desktop/react/terminal/commands.ts` (a literal, not an import). If any real `import` appears, STOP and reassess.

- [ ] **Step 4: Delete the dead pre-React drag system**

```bash
git rm src/components/DraggableWindows.astro src/utils/draggable-windows.ts
```

- [ ] **Step 5: Run the gate**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: matches baseline exactly (`0 errors, 0 warnings, 5 hints`; build `Complete!`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add path aliases and delete dead drag system"
```

---

## Task B: Hoist the desktop tree to `src/desktop/`

A pure 1:1 move. Internal relative imports between desktop files stay valid (relativity is preserved); only the 12 cross-boundary imports (to `src/lib`, `src/styles`, `src/config`) break — fix them with the `@/` alias. Also repoint the one Astro page import.

**Files:**
- Move: `src/components/desktop/react/` → `src/desktop/` (whole directory)
- Modify (cross-boundary imports): `src/desktop/window/Window.tsx`, `src/desktop/parts.tsx`, `src/desktop/Papelera.tsx`, `src/desktop/DesktopApp.tsx`, `src/desktop/context/WallpaperContext.tsx`, `src/desktop/settings/GridSettingsSection.tsx`, `src/desktop/apps/defineApp.ts`, `src/desktop/apps/desktopIcons.ts`, `src/desktop/apps/contents/TrashFooter.tsx`, `src/desktop/apps/contents/PostContent.tsx`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Move the directory**

```bash
git mv src/components/desktop/react src/desktop
rmdir src/components/desktop 2>/dev/null || true
```

- [ ] **Step 2: Repoint every cross-boundary import to the `@/` alias**

Run this codemod (rewrites any `../…/{lib,styles,config}/…` import in the moved tree to `@/…`):

```bash
rg -l "from '(\.\./)+(lib|styles|config)/" src/desktop \
  | xargs perl -pi -e "s#from '(\.\./)+(lib|styles|config)/#from '\@/\$2/#g"
```

- [ ] **Step 3: Verify no stale relative cross-boundary imports remain**

Run: `rg -n "from '(\.\./)+(lib|styles|config)/" src/desktop`
Expected: no matches (all now `@/lib`, `@/styles`, `@/config`).

- [ ] **Step 4: Repoint the Astro page import**

In `src/pages/index.astro`, change:

```astro
import DesktopApp from '../components/desktop/react/DesktopApp';
```
to:
```astro
import DesktopApp from '@/desktop/DesktopApp';
```

- [ ] **Step 5: Run the gate**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: baseline (`0 errors, 0 warnings, 5 hints`; build `Complete!`). Typical failure here = a missed import path; the `check` output names the file + line.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: hoist desktop runtime to src/desktop with @/ aliases"
```

---

## Task C: Introduce the `defineApp` primitive + `browserApp`/`explorerApp`; delete the dispatch switch

This is the core architectural change. Build `src/desktop/wrappers/`, convert `registry.ts` to the new factories, and delete `renderApp.tsx`'s `switch` and the `AppLayout` union. `terminal` and `settings` lose their factories and become plain `defineApp` apps in this task (their bodies stay where they are for now; Task D relocates them).

**Files:**
- Move: `src/desktop/browser/` → `src/desktop/wrappers/browser/`; `src/desktop/layouts/` → `src/desktop/wrappers/explorer/`; `src/desktop/window/ExplorerWindow.tsx` → `src/desktop/wrappers/explorer/ExplorerWindow.tsx`; `src/desktop/context/ExplorerViewContext.tsx` → `src/desktop/wrappers/explorer/ExplorerViewContext.tsx`
- Create: `src/desktop/wrappers/types.ts`, `src/desktop/wrappers/defineApp.tsx`, `src/desktop/wrappers/browser/browserApp.tsx`, `src/desktop/wrappers/explorer/explorerApp.tsx`, `src/desktop/wrappers/index.ts`
- Modify: `src/desktop/apps/registry.ts`, `src/desktop/apps/desktopIcons.ts`, `src/desktop/DesktopApp.tsx`, `src/desktop/apps/contents/SettingsBody.tsx`
- Delete: `src/desktop/apps/renderApp.tsx`, `src/desktop/apps/defineApp.ts`, `src/desktop/apps/types.ts`

- [ ] **Step 1: Relocate browser + explorer assets into wrappers/**

```bash
mkdir -p src/desktop/wrappers
git mv src/desktop/browser src/desktop/wrappers/browser
git mv src/desktop/layouts src/desktop/wrappers/explorer
git mv src/desktop/window/ExplorerWindow.tsx src/desktop/wrappers/explorer/ExplorerWindow.tsx
git mv src/desktop/context/ExplorerViewContext.tsx src/desktop/wrappers/explorer/ExplorerViewContext.tsx
```

- [ ] **Step 2: Create the shared contracts `wrappers/types.ts`**

This consolidates the old `apps/types.ts` (`WindowAppContext` → renamed `AppContext`, `TrashController`, `TrashItem`) and adds `WindowChromeProps` + `AppDefinition`.

```ts
// src/desktop/wrappers/types.ts
import type { ReactNode } from 'react';
import type { IconKey } from '@/lib/desktopIcons';
import type {
  AppGeometry,
  BlogPostSummary,
  WindowGeometry,
  WindowState,
} from '../types';
import type { BrowserHistories } from './browser/useBrowserHistories';

export type { AppGeometry };

export interface TrashItem {
  id: string;
  label: string;
  iconSrc: string;
}

export interface TrashController {
  items: TrashItem[];
  onOpenFile: (windowId: string) => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
  onEmpty: () => void;
}

/** Read-only runtime environment passed to every app's render/body. */
export interface AppContext {
  posts: BlogPostSummary[];
  onOpenPost: (slug: string) => void;
  /** Open a URL in the main browser window. */
  onOpenLink: (url: string) => void;
  /** Per-browser-app navigation state. */
  browsers: BrowserHistories;
  trash: TrashController;
  iconUrls: Record<string, string>;
}

/** Window-manager wiring handed to each app's render by DesktopShell. */
export interface WindowChromeProps {
  state: WindowState;
  focused: boolean;
  minWidth: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onGeometryChange: (geometry: Partial<WindowGeometry>) => void;
}

export interface DesktopIconConfig {
  label?: string;
  tooltip?: string;
  show?: boolean;
}

export interface SettingsSection {
  id: string;
  title?: string;
  render: () => ReactNode;
}

/** Resolved app definition. Build with defineApp() or a specialization factory. */
export interface AppDefinition<Id extends string = string> {
  id: Id;
  title: string | ((ctx: AppContext) => string);
  iconKey?: IconKey;
  iconUrl?: string;
  geometry: AppGeometry;
  desktopIcon?: DesktopIconConfig | false;
  taskbarTooltip?: string;
  availableWhen?: (ctx: Pick<AppContext, 'posts'>) => boolean;
  windowClassName?: string;
  bodyClassName?: string;
  /** Self-contained render; window-manager wiring arrives as `win`. */
  render: (ctx: AppContext, win: WindowChromeProps) => ReactNode;
}

export function resolveAppTitle(app: AppDefinition, ctx: AppContext): string {
  return typeof app.title === 'function' ? app.title(ctx) : app.title;
}

export function appLabel(app: AppDefinition): string {
  return typeof app.title === 'string' ? app.title : app.id;
}
```

- [ ] **Step 3: Create the primitive `wrappers/defineApp.tsx`**

```tsx
// src/desktop/wrappers/defineApp.tsx
import type { ReactNode } from 'react';
import Window from '../window';
import type { IconKey } from '@/lib/desktopIcons';
import type { AppGeometry } from '../types';
import {
  resolveAppTitle,
  type AppContext,
  type AppDefinition,
  type DesktopIconConfig,
} from './types';

export interface DefineAppInput<Id extends string> {
  id: Id;
  title: string | ((ctx: AppContext) => string);
  iconKey?: IconKey;
  iconUrl?: string;
  geometry: AppGeometry;
  desktopIcon?: DesktopIconConfig | false;
  taskbarTooltip?: string;
  availableWhen?: AppDefinition['availableWhen'];
  windowClassName?: string;
  bodyClassName?: string;
  /** The window body. Receives the runtime AppContext. */
  body: (ctx: AppContext) => ReactNode;
  /** Optional titlebar chrome (e.g. the browser URL bar). */
  titleContent?: (ctx: AppContext) => ReactNode;
}

/**
 * The app primitive: metadata + a `body` (and optional `titleContent`). It
 * generates the standard render that wraps both in the shared <Window>. Most
 * apps use this directly; only chrome shared by 2+ apps earns a factory.
 */
export function defineApp<Id extends string>(input: DefineAppInput<Id>): AppDefinition<Id> {
  const { body, titleContent, ...meta } = input;
  return {
    ...meta,
    render: (ctx, win) => {
      const app: AppDefinition = { ...meta, render: () => null };
      return (
        <Window
          {...win}
          title={resolveAppTitle(app, ctx)}
          titleContent={titleContent?.(ctx)}
          windowClassName={meta.windowClassName}
          bodyClassName={meta.bodyClassName}
        >
          {body(ctx)}
        </Window>
      );
    },
  };
}
```

- [ ] **Step 4: Create `wrappers/browser/browserApp.tsx`**

```tsx
// src/desktop/wrappers/browser/browserApp.tsx
import { defineApp } from '../defineApp';
import BrowserChrome from './BrowserChrome';
import BrowserContent from './BrowserContent';
import type { AppContext, AppDefinition } from '../types';
import type { AppGeometry } from '../../types';

export interface BrowserAppInput<Id extends string> {
  id: Id;
  /** Fallback title when the browser has no current URL. */
  title?: string;
  iconKey?: AppDefinition['iconKey'];
  iconUrl?: string;
  initialUrl?: string | null;
  hideTitle?: boolean;
  geometry?: Partial<AppGeometry>;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

const DEFAULT_BROWSER_GEOMETRY: AppGeometry = {
  defaultX: 180,
  defaultY: 80,
  defaultWidth: 800,
  defaultHeight: 520,
  minWidth: 480,
  initialZ: 30,
};

function browserTitle<Id extends string>(input: BrowserAppInput<Id>) {
  const fallback = input.title ?? 'navegador';
  return (ctx: AppContext) => {
    const url = ctx.browsers.get(input.id).url ?? input.initialUrl ?? null;
    if (!url) return fallback;
    try {
      return new URL(url).host;
    } catch {
      return fallback;
    }
  };
}

/** Site-launcher / browser archetype: URL chrome in the titlebar + iframe body. */
export function browserApp<Id extends string>(input: BrowserAppInput<Id>): AppDefinition<Id> {
  const fallback = input.title ?? 'navegador';
  const title = browserTitle(input);
  return defineApp({
    id: input.id,
    title,
    iconKey: input.iconKey ?? 'startup',
    iconUrl: input.iconUrl,
    geometry: { ...DEFAULT_BROWSER_GEOMETRY, ...input.geometry },
    desktopIcon: input.desktopIcon ?? false,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip ?? fallback,
    windowClassName: 'desktop-window--browser',
    bodyClassName: 'browser-window__body',
    titleContent: (ctx) => (
      <BrowserChrome
        appId={input.id}
        title={title(ctx)}
        browsers={ctx.browsers}
        hideTitle={input.hideTitle}
      />
    ),
    body: (ctx) => <BrowserContent appId={input.id} browsers={ctx.browsers} />,
  });
}
```

- [ ] **Step 5: Create `wrappers/explorer/explorerApp.tsx`**

This specialization supplies its own `render` (mounts `ExplorerWindow`, which provides the view context above `<Window>`).

```tsx
// src/desktop/wrappers/explorer/explorerApp.tsx
import type { ReactNode } from 'react';
import ExplorerWindow from './ExplorerWindow';
import ExplorerLayout from './ExplorerLayout';
import type { ExplorerViewMode, ListItem } from './types';
import { resolveAppTitle, type AppContext, type AppDefinition } from '../types';
import type { AppGeometry } from '../../types';

export interface ExplorerAppInput<Id extends string> {
  id: Id;
  title: string | ((ctx: AppContext) => string);
  iconKey?: AppDefinition['iconKey'];
  iconUrl?: string;
  items: (ctx: AppContext) => ListItem[];
  defaultMode?: ExplorerViewMode;
  onActivate?: (id: string, ctx: AppContext) => void;
  footer?: (ctx: AppContext) => ReactNode;
  geometry: AppGeometry;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

/** File-list archetype: grid/list view + activate + optional footer. */
export function explorerApp<Id extends string>(input: ExplorerAppInput<Id>): AppDefinition<Id> {
  const { items, onActivate, footer, defaultMode, ...meta } = input;
  return {
    ...meta,
    render: (ctx, win) => {
      const app: AppDefinition = { ...meta, render: () => null };
      return (
        <ExplorerWindow {...win} title={resolveAppTitle(app, ctx)} defaultMode={defaultMode}>
          <ExplorerLayout items={items(ctx)} onActivate={(id) => onActivate?.(id, ctx)} />
          {footer?.(ctx)}
        </ExplorerWindow>
      );
    },
  };
}
```

- [ ] **Step 6: Update `ExplorerWindow.tsx`'s import of the view context**

In `src/desktop/wrappers/explorer/ExplorerWindow.tsx`, the import moved from `../context/ExplorerViewContext` to a sibling. Change:

```tsx
import { ExplorerViewProvider, useExplorerView } from '../context/ExplorerViewContext';
```
to:
```tsx
import { ExplorerViewProvider, useExplorerView } from './ExplorerViewContext';
```
And change `import Window, { type WindowProps } from './Window';` to `import Window, { type WindowProps } from '../../window';`.

- [ ] **Step 7: Fix `ExplorerLayout.tsx` view-context import**

In `src/desktop/wrappers/explorer/ExplorerLayout.tsx`, change `import { useExplorerView } from '../context/ExplorerViewContext';` to `import { useExplorerView } from './ExplorerViewContext';`. (The `useGridSettings` import from `../context/GridSettingsContext` stays — that context is relocated in Task E; leave it as `../../context/GridSettingsContext` for now by changing the prefix to `../../context/GridSettingsContext`.)

Run `rg -n "from '\.\./context/" src/desktop/wrappers/explorer` and repoint each remaining `../context/X` to `../../context/X`.

- [ ] **Step 8: Create the wrappers barrel `wrappers/index.ts`**

```ts
// src/desktop/wrappers/index.ts
export { defineApp, type DefineAppInput } from './defineApp';
export { browserApp, type BrowserAppInput } from './browser/browserApp';
export { explorerApp, type ExplorerAppInput } from './explorer/explorerApp';
export {
  appLabel,
  resolveAppTitle,
  type AppContext,
  type AppDefinition,
  type DesktopIconConfig,
  type SettingsSection,
  type TrashController,
  type TrashItem,
} from './types';
```

- [ ] **Step 9: Point `SettingsBody.tsx` at the new SettingsSection type**

In `src/desktop/apps/contents/SettingsBody.tsx`, change `import type { SettingsSection } from '../defineApp';` to `import type { SettingsSection } from '@desktop/wrappers';`.

- [ ] **Step 10: Rewrite `registry.ts` against the new factories**

Replace the imports and factory calls. Full new file:

```ts
// src/desktop/apps/registry.ts
import { createElement } from 'react';
import {
  browserApp,
  defineApp,
  explorerApp,
  type AppDefinition,
  type SettingsSection,
} from '@desktop/wrappers';
import { cascadeOffset } from './cascadePositions';
import { appIconSrc } from './desktopIcons';
import AboutContent from './contents/AboutContent';
import ClassifiedContent from './contents/ClassifiedContent';
import { CLASSIFIED_DOCS } from './contents/classifiedDocs';
import HappyContent from './contents/HappyContent';
import PostContent from './contents/PostContent';
import SettingsBody from './contents/SettingsBody';
import TerminalApp from '../TerminalApp';
import TrashFooter from './contents/TrashFooter';
import AppearanceSection from '../settings/AppearanceSection';
import GridSettingsSection from '../settings/GridSettingsSection';
import { PROJECTS, TRASH_JUNK } from './data';
import { BROWSER_APP_ID, postSlugFromWindowId, postWindowId } from './postWindow';
import type { ListItem } from '../wrappers/explorer/types';
import type { BlogPostSummary } from '../types';

const terminalApp = defineApp({
  id: 'terminal',
  title: 'terminal — guest@alfon.so',
  iconKey: 'terminal',
  geometry: { defaultX: 88, defaultY: 36, defaultWidth: 560, defaultHeight: 380, initialZ: 10 },
  desktopIcon: { label: 'terminal.sh', tooltip: 'Terminal' },
  taskbarTooltip: 'Terminal',
  bodyClassName: 'terminal-window__body',
  body: (ctx) => createElement(TerminalApp, { posts: ctx.posts, focused: true }),
});

const aboutApp = defineApp({
  id: 'about',
  title: 'about.txt',
  iconKey: 'about',
  geometry: { defaultX: 0, defaultY: 0, defaultWidth: 576, minWidth: 520, initialZ: 11, center: true, defaultOpen: true },
  desktopIcon: { label: 'about.txt', tooltip: 'Mi info' },
  taskbarTooltip: 'about.txt',
  body: () => createElement(AboutContent),
});

const projectsApp = explorerApp({
  id: 'projects',
  title: 'proyectos',
  iconKey: 'projects',
  items: () =>
    PROJECTS.map<ListItem>((project) => ({
      id: project.title,
      label: project.title,
      kind: 'Proyecto',
      graphic: project.icon,
      title: project.description,
      disabled: !project.link,
    })),
  onActivate: (id, ctx) => {
    const project = PROJECTS.find((entry) => entry.title === id);
    if (project?.link) ctx.onOpenLink(project.link);
  },
  geometry: { defaultX: 128, defaultY: 64, defaultWidth: 576, initialZ: 12 },
  desktopIcon: { label: 'proyectos', tooltip: 'Mis proyectos' },
  taskbarTooltip: 'Proyectos',
});

const blogApp = explorerApp({
  id: 'blog',
  title: '✍️ últimos posts',
  iconKey: 'blog',
  defaultMode: 'list',
  items: (ctx) =>
    ctx.posts.map<ListItem>((post) => ({
      id: post.slug,
      label: post.title,
      kind: 'Post',
      iconSrc: ctx.iconUrls.blog,
      title: post.description ?? post.title,
    })),
  onActivate: (id, ctx) => ctx.onOpenPost(id),
  availableWhen: (ctx) => ctx.posts.length > 0,
  geometry: { defaultX: 160, defaultY: 96, defaultWidth: 576, initialZ: 13 },
  desktopIcon: { label: 'blog.sql', tooltip: 'Mis posts' },
  taskbarTooltip: 'Blog',
});

const area51App = defineApp({
  id: 'area51',
  title: 'area51.pdf — CLASIFICADO',
  iconKey: 'classified',
  geometry: { defaultX: 220, defaultY: 120, defaultWidth: 560, initialZ: 14 },
  desktopIcon: false,
  body: () => createElement(ClassifiedContent, { doc: CLASSIFIED_DOCS.area51 }),
});

const ovnisApp = defineApp({
  id: 'ovnis',
  title: 'ovnis.pdf — SOLO LECTURA',
  iconKey: 'classified',
  geometry: { defaultX: 250, defaultY: 150, defaultWidth: 560, initialZ: 15 },
  desktopIcon: false,
  body: () => createElement(ClassifiedContent, { doc: CLASSIFIED_DOCS.ovnis }),
});

const happyApp = defineApp({
  id: 'happy',
  title: 'no_abrir.mp4',
  iconKey: 'video',
  geometry: { defaultX: 280, defaultY: 84, defaultWidth: 600, initialZ: 16 },
  desktopIcon: false,
  body: () => createElement(HappyContent),
});

const trashApp = explorerApp({
  id: 'trash',
  title: '🗑 Papelera',
  iconKey: 'trash',
  items: (ctx) => {
    const junk = TRASH_JUNK.map<ListItem>((entry) => {
      const app = entry.appId ? findApp(entry.appId) : undefined;
      return {
        id: entry.id,
        label: entry.name,
        kind: entry.kind,
        graphic: entry.icon,
        iconSrc: app ? appIconSrc(app, ctx.iconUrls) : undefined,
        isFolder: entry.isFolder,
        disabled: !entry.appId,
      };
    });
    const deleted = ctx.trash.items.map<ListItem>((item) => ({
      id: item.id,
      label: item.label,
      kind: 'Icono eliminado',
      iconSrc: item.iconSrc,
    }));
    return [...junk, ...deleted];
  },
  onActivate: (id, ctx) => {
    const junk = TRASH_JUNK.find((entry) => entry.id === id);
    if (junk?.appId) {
      ctx.trash.onOpenFile(junk.appId);
      return;
    }
    if (ctx.trash.items.some((item) => item.id === id)) {
      ctx.trash.onRestore(id);
    }
  },
  footer: (ctx) => createElement(TrashFooter, { trash: ctx.trash }),
  geometry: { defaultX: 320, defaultY: 140, defaultWidth: 420, initialZ: 17 },
  desktopIcon: false,
});

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'apariencia', title: 'Apariencia', render: () => createElement(AppearanceSection) },
  { id: 'escritorio', title: 'Escritorio', render: () => createElement(GridSettingsSection) },
];

const settingsApp = defineApp({
  id: 'settings',
  title: 'ajustes',
  iconKey: 'settings',
  geometry: { defaultX: 240, defaultY: 72, defaultWidth: 580, defaultHeight: 420, initialZ: 18 },
  desktopIcon: { label: 'ajustes', tooltip: 'Ajustes del escritorio' },
  taskbarTooltip: 'Ajustes',
  bodyClassName: 'card-body--settings',
  body: () => createElement(SettingsBody, { sections: SETTINGS_SECTIONS }),
});

const browserMainApp = browserApp({
  id: BROWSER_APP_ID,
  title: 'web browser',
  iconKey: 'startup',
  initialUrl: null,
  geometry: { defaultX: 180, defaultY: 80, defaultWidth: 800, initialZ: 30 },
  taskbarTooltip: 'Navegador web',
});

const photosApp = browserApp({
  id: 'photos',
  title: 'photos.jpg',
  iconKey: 'photos',
  initialUrl: 'https://ojoanalogo.com',
  hideTitle: true,
  geometry: { defaultX: 200, defaultY: 96, defaultWidth: 880, initialZ: 31 },
  desktopIcon: { label: 'photos.jpg', tooltip: 'Mi vida en fotos' },
  taskbarTooltip: 'Mi vida en fotos',
});

const startupApp = browserApp({
  id: 'startup',
  title: 'startup.sh',
  iconKey: 'startup',
  initialUrl: 'https://molecula.digital',
  hideTitle: true,
  geometry: { defaultX: 220, defaultY: 112, defaultWidth: 880, initialZ: 32 },
  desktopIcon: { label: 'startup.sh', tooltip: 'Mi startup de productos digitales' },
  taskbarTooltip: 'Molécula Digital',
});

export const APPS = [
  terminalApp,
  aboutApp,
  projectsApp,
  blogApp,
  photosApp,
  startupApp,
  settingsApp,
  area51App,
  ovnisApp,
  happyApp,
  trashApp,
  browserMainApp,
] as const satisfies readonly AppDefinition[];

export type AppId = (typeof APPS)[number]['id'];

export function findApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}

export function createPostApps(posts: BlogPostSummary[]): AppDefinition[] {
  return posts.map((post, index) => {
    const offset = cascadeOffset(index, { baseX: 180, baseY: 108, pitch: 28 });
    return defineApp({
      id: postWindowId(post.slug),
      title: `${post.slug}.md`,
      iconKey: 'blog',
      geometry: { defaultX: offset.x, defaultY: offset.y, defaultWidth: 640, initialZ: 20 + index },
      desktopIcon: false,
      taskbarTooltip: post.title,
      body: () => createElement(PostContent, { post }),
    });
  });
}

export function isPostApp(id: string): boolean {
  return id.startsWith('post:');
}

export { findPostBySlug };
function findPostBySlug(posts: BlogPostSummary[], windowId: string) {
  const slug = postSlugFromWindowId(windowId);
  return posts.find((post) => post.slug === slug);
}
```

Note: TerminalApp body passes `focused: true` because the old per-window `focused` flag is not available at definition time. If terminal focus behavior regresses in the smoke check, Task E's `useAppContext` work threads real focus through; for now `true` matches the common (focused) case. Flag this in the Task C commit body.

- [ ] **Step 11: Update `desktopIcons.ts` import**

In `src/desktop/apps/desktopIcons.ts`, change `import { appLabel, type AppDefinition } from './defineApp';` to `import { appLabel, type AppDefinition } from '@desktop/wrappers';`.

- [ ] **Step 12: Rewrite `DesktopApp.tsx`'s window render path**

In `src/desktop/DesktopApp.tsx`:
- Remove `import { appToWindowDef, renderApp } from './apps/renderApp';` and add `import { appToWindowDef } from './apps/appToWindowDef';` (created next step) and keep types.
- Change the imports of `WindowAppContext, TrashController` from `./apps/types` to `import type { AppContext, TrashController } from '@desktop/wrappers';` and replace the `WindowAppContext` type name with `AppContext` throughout the file.
- Replace the `renderApp({ app, def, state, focused, ctx, callbacks })` call in the `apps.map(...)` block with:

```tsx
{apps.map((app) => {
  const state = wm.windows[app.id];
  if (!state) return null;
  const win = {
    state,
    focused: wm.focusedId === app.id,
    minWidth: minWidthForDef(defs.find((d) => d.id === app.id)!),
    onFocus: () => wm.focus(app.id),
    onClose: () => wm.close(app.id),
    onMinimize: () => wm.minimize(app.id),
    onToggleMaximize: () => wm.toggleMaximize(app.id),
    onGeometryChange: (geometry: Partial<WindowGeometry>) => wm.setGeometry(app.id, geometry),
  };
  return <Fragment key={app.id}>{app.render(appContext, win)}</Fragment>;
})}
```

Add `import { minWidthForDef } from './useWindowManager';` and `import type { WindowGeometry } from './types';` if not already imported.

- [ ] **Step 13: Extract `appToWindowDef` out of the deleted renderApp**

Create `src/desktop/apps/appToWindowDef.ts` with the geometry helper lifted verbatim from the old `renderApp.tsx` (the `CASCADE_BASE`, `BASE_Z`, and `appToWindowDef` export), importing `cascadeOffset` from `./cascadePositions` and the `AppDefinition` type + `WindowDef` from `../types`:

```ts
// src/desktop/apps/appToWindowDef.ts
import type { AppDefinition } from '@desktop/wrappers';
import type { WindowDef } from '../types';
import { cascadeOffset } from './cascadePositions';

const CASCADE_BASE = { baseX: 96, baseY: 48 };
const BASE_Z = 10;

export function appToWindowDef(app: AppDefinition, index = 0): WindowDef {
  const geometry = app.geometry;
  const cascaded = cascadeOffset(index, CASCADE_BASE);
  return {
    id: app.id,
    title: typeof app.title === 'string' ? app.title : app.id,
    ...geometry,
    defaultX: geometry.defaultX ?? cascaded.x,
    defaultY: geometry.defaultY ?? cascaded.y,
    initialZ: geometry.initialZ ?? BASE_Z + index,
  };
}
```

- [ ] **Step 14: Delete the obsolete dispatch + old type/factory files**

```bash
git rm src/desktop/apps/renderApp.tsx src/desktop/apps/defineApp.ts src/desktop/apps/types.ts
```

- [ ] **Step 15: Fix any lingering references to the deleted modules**

Run: `rg -n "apps/renderApp|apps/defineApp|apps/types|WindowAppContext" src/desktop`
Expected: no matches. Repoint any stragglers to `@desktop/wrappers` (for `AppContext`/`defineApp`) or `./appToWindowDef`.

- [ ] **Step 16: Run the gate**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: baseline (`0 errors, 0 warnings, 5 hints`; build `Complete!`).

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "refactor: replace dispatch switch with defineApp primitive + browser/explorer factories"
```

---

## Task D: Split the registry into per-app modules

Turn `registry.ts` into a thin import-and-list, with each app a co-located module under `apps/<name>/`, and relocate scattered app bodies into their apps. `cascadePositions.ts` → `cascade.ts`. Post apps move to `apps/post/`.

**Files:**
- Create per-app modules: `apps/about/index.tsx`, `apps/projects/index.tsx`, `apps/projects/data.ts`, `apps/blog/index.tsx`, `apps/photos/index.tsx`, `apps/startup/index.tsx`, `apps/browser/index.tsx`, `apps/settings/index.tsx`, `apps/terminal/index.tsx`, `apps/trash/index.tsx`, `apps/area51/index.tsx`, `apps/ovnis/index.tsx`, `apps/happy/index.tsx`, `apps/post/postApp.ts`
- Move bodies into apps: `apps/contents/AboutContent.tsx`→`apps/about/AboutContent.tsx`; `apps/contents/PostContent.tsx`→`apps/post/PostContent.tsx`; `apps/contents/ClassifiedContent.tsx`+`classifiedDocs.tsx`→`apps/classified/`; `apps/contents/HappyContent.tsx`→`apps/happy/`; `apps/contents/SettingsBody.tsx`→`apps/settings/`; `apps/contents/TrashFooter.tsx`→`apps/trash/`; `TerminalApp.tsx`+`terminal/commands.ts`→`apps/terminal/`; `settings/AppearanceSection.tsx`+`GridSettingsSection.tsx`+`ThemeSegmentedControl.tsx`+`desktopColors.ts`+`ui.tsx`→`apps/settings/`
- Modify: `apps/registry.ts` (becomes thin), `apps/data.ts` (split projects/trash), `apps/desktopIcons.ts`, `DesktopApp.tsx` (import path for `appToWindowDef`/`TRASH_JUNK`), `apps/postWindow.ts` stays.
- Rename: `apps/cascadePositions.ts` → `apps/cascade.ts`

> **Why so granular:** these are content-identical relocations. For each app, the per-app `index.tsx` holds the `defineApp`/`browserApp`/`explorerApp` call currently in `registry.ts` (Task C), and the registry just imports the default export.

- [ ] **Step 1: Rename cascade helper**

```bash
git mv src/desktop/apps/cascadePositions.ts src/desktop/apps/cascade.ts
rg -l "apps/cascadePositions|'./cascadePositions'" src/desktop | xargs perl -pi -e "s#cascadePositions#cascade#g"
```

- [ ] **Step 2: Relocate app body components (verbatim moves)**

```bash
mkdir -p src/desktop/apps/about src/desktop/apps/post src/desktop/apps/classified \
         src/desktop/apps/happy src/desktop/apps/settings src/desktop/apps/trash \
         src/desktop/apps/terminal
git mv src/desktop/apps/contents/AboutContent.tsx     src/desktop/apps/about/AboutContent.tsx
git mv src/desktop/apps/contents/PostContent.tsx      src/desktop/apps/post/PostContent.tsx
git mv src/desktop/apps/contents/ClassifiedContent.tsx src/desktop/apps/classified/ClassifiedContent.tsx
git mv src/desktop/apps/contents/classifiedDocs.tsx   src/desktop/apps/classified/classifiedDocs.tsx
git mv src/desktop/apps/contents/HappyContent.tsx     src/desktop/apps/happy/HappyContent.tsx
git mv src/desktop/apps/contents/SettingsBody.tsx     src/desktop/apps/settings/SettingsBody.tsx
git mv src/desktop/apps/contents/TrashFooter.tsx      src/desktop/apps/trash/TrashFooter.tsx
git mv src/desktop/TerminalApp.tsx                    src/desktop/apps/terminal/TerminalApp.tsx
git mv src/desktop/terminal/commands.ts               src/desktop/apps/terminal/commands.ts
git mv src/desktop/settings/AppearanceSection.tsx     src/desktop/apps/settings/AppearanceSection.tsx
git mv src/desktop/settings/GridSettingsSection.tsx   src/desktop/apps/settings/GridSettingsSection.tsx
git mv src/desktop/settings/ThemeSegmentedControl.tsx src/desktop/apps/settings/ThemeSegmentedControl.tsx
git mv src/desktop/settings/desktopColors.ts          src/desktop/apps/settings/desktopColors.ts
git mv src/desktop/settings/ui.tsx                    src/desktop/apps/settings/ui.tsx
rmdir src/desktop/apps/contents src/desktop/settings src/desktop/terminal 2>/dev/null || true
```

- [ ] **Step 3: Fix imports inside the moved bodies**

Run `pnpm check 2>&1 | rg "error|Cannot find"` and repoint each broken import. Expected fixes (relative depth changed by one level):
- `apps/terminal/TerminalApp.tsx` imports `./terminal/commands` → `./commands`.
- `apps/terminal/commands.ts` imports of `../types`, `../apps/...` etc. → adjust by depth, or switch to `@desktop/...`.
- `apps/settings/*` cross-imports among Appearance/GridSettings/ThemeSegmentedControl/desktopColors/ui stay sibling (`./`), but their `../context/...` → `@desktop/state/...` will be finalized in Task E; for now repoint `../context/` → `../../context/`.
- `apps/about/AboutContent.tsx`, `apps/post/PostContent.tsx` imports of `../../parts` → `@desktop/ui/parts` (parts moves in Task E; for now use `../../parts`) and `../data` → `../projects/data` (see Step 5) for TECH_STACK. **TECH_STACK is used by AboutContent** — move it alongside (Step 5).

Re-run `pnpm check` until imports resolve. Do not proceed with errors.

- [ ] **Step 4: Split `apps/data.ts` into per-app data**

`data.ts` holds `PROJECTS`/`ProjectEntry`, `TECH_STACK`, `ClassifiedDoc`, `TrashJunkItem`/`TRASH_JUNK`. Move each to its owner:

```bash
mkdir -p src/desktop/apps/projects
```

- Create `apps/projects/data.ts` with `ProjectEntry` + `PROJECTS` + `TECH_STACK` (TECH_STACK is consumed by AboutContent; keep it here and import from About).
- Move `ClassifiedDoc` interface into `apps/classified/classifiedDocs.tsx` (its only consumer).
- Create `apps/trash/junk.ts` with `TrashJunkItem` + `TRASH_JUNK`.
- Delete `apps/data.ts`.

```bash
git rm src/desktop/apps/data.ts   # after content is relocated
```

Update importers: `AboutContent` → `import { TECH_STACK } from '../projects/data'`; registry/per-app modules import `PROJECTS` from `../projects/data` and `TRASH_JUNK` from `../trash/junk`; `DesktopApp.tsx` imports `TRASH_JUNK` from `./apps/trash/junk`.

- [ ] **Step 5: Create per-app `index.tsx` modules**

For each app, cut its factory call out of `registry.ts` into `apps/<name>/index.tsx` as the default export, importing its co-located body. Example for terminal:

```tsx
// src/desktop/apps/terminal/index.tsx
import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import TerminalApp from './TerminalApp';

export default defineApp({
  id: 'terminal',
  title: 'terminal — guest@alfon.so',
  iconKey: 'terminal',
  geometry: { defaultX: 88, defaultY: 36, defaultWidth: 560, defaultHeight: 380, initialZ: 10 },
  desktopIcon: { label: 'terminal.sh', tooltip: 'Terminal' },
  taskbarTooltip: 'Terminal',
  bodyClassName: 'terminal-window__body',
  body: (ctx) => createElement(TerminalApp, { posts: ctx.posts, focused: true }),
});
```

Repeat for `about`, `projects`, `blog`, `photos`, `startup`, `browser`, `settings`, `trash`, `area51`, `ovnis`, `happy` — each holding exactly the factory object it had in registry.ts (Task C), with body imports repointed to co-located files. `area51` and `ovnis` both import `ClassifiedContent` + `CLASSIFIED_DOCS` from `../classified/...`.

- [ ] **Step 6: Create `apps/post/postApp.ts`**

Move `createPostApps`, `isPostApp`, `findPostBySlug` from registry into `apps/post/postApp.ts`, importing `defineApp` from `@desktop/wrappers`, `PostContent` from `./PostContent`, `cascadeOffset` from `../cascade`, and the slug helpers from `../postWindow`.

- [ ] **Step 7: Reduce `registry.ts` to a thin list**

```ts
// src/desktop/apps/registry.ts
import type { AppDefinition } from '@desktop/wrappers';
import aboutApp from './about';
import projectsApp from './projects';
import blogApp from './blog';
import photosApp from './photos';
import startupApp from './startup';
import settingsApp from './settings';
import area51App from './area51';
import ovnisApp from './ovnis';
import happyApp from './happy';
import trashApp from './trash';
import browserApp from './browser';
import terminalApp from './terminal';

export const APPS = [
  terminalApp, aboutApp, projectsApp, blogApp, photosApp, startupApp,
  settingsApp, area51App, ovnisApp, happyApp, trashApp, browserApp,
] as const satisfies readonly AppDefinition[];

export type AppId = (typeof APPS)[number]['id'];

export function findApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}

export { createPostApps, isPostApp, findPostBySlug } from './post/postApp';
```

> `findApp` is used by `apps/trash/index.tsx`. Import it there from `../registry` — registry imports trash and trash imports registry, but since both only reference each other's *functions/values at call time* (not module-init), the cycle is safe. If `pnpm build` flags the cycle, move `findApp` + `APPS` array construction so `findApp` reads a lazily-populated list, or pass `findApp` into the trash items closure via `AppContext`. Verify at the gate.

- [ ] **Step 8: Run the gate**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: baseline.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: split app registry into co-located per-app modules"
```

---

## Task E: Finalize folders (shell/state/ui/lib) + decompose DesktopApp into hooks

Move the remaining loose files into `shell/`, `state/`, `ui/`, `lib/`, promote `useTheme` to a `ThemeContext`, and extract `DesktopApp`'s inline logic into named hooks.

**Files:**
- Move shell chrome → `shell/`: `DesktopIcons.tsx`, `DesktopWallpaper.tsx`(→`shell/Wallpaper.tsx`), `DesktopBootOverlay.tsx`(→`shell/BootOverlay.tsx`), `ContextMenu.tsx`, `ThemeToggle.tsx`, `StartMenu.tsx`(→`shell/startmenu/`), `Taskbar.tsx`+`ui/TaskbarClock.tsx`(→`shell/taskbar/`), `Papelera.tsx`(→`shell/trash/`), `icons/ThemeIcons.tsx`(→`shell/icons/` or keep near consumers)
- Move state → `state/`: `context/*` (4 files), `useWindowManager.ts`, `useDesktopIcons.ts`, `useTheme.ts`(→`state/ThemeContext.tsx`)
- Move ui → `ui/`: `parts.tsx`, `ui/Modal.tsx`
- Move lib → `lib/`: `utils/*` (viewport, iconLabelTone, useResolvedIconLabelTone, useViewportSize), and `src/lib/desktopIcons.ts` → `src/desktop/lib/desktopIcons.ts` (update the `@/lib/desktopIcons` alias references to `@desktop/lib/desktopIcons`, and the `src/pages/index.astro` import `DESKTOP_ICON_URLS`)
- Create hooks: `state/useDesktopApps.ts`, `state/useResponsiveLayout.ts`, `state/useAppContext.ts`, `state/useTrashController.ts`, `state/useTaskbarMeta.ts`
- Create `src/desktop/DesktopShell.tsx`; slim `src/desktop/DesktopApp.tsx`

- [ ] **Step 1: Move state modules and promote theme**

```bash
mkdir -p src/desktop/state
git mv src/desktop/context/WindowManagerContext.tsx src/desktop/state/WindowManagerContext.tsx
git mv src/desktop/context/WallpaperContext.tsx     src/desktop/state/WallpaperContext.tsx
git mv src/desktop/context/GridSettingsContext.tsx  src/desktop/state/GridSettingsContext.tsx
git mv src/desktop/useWindowManager.ts              src/desktop/state/useWindowManager.ts
git mv src/desktop/useDesktopIcons.ts               src/desktop/state/useDesktopIcons.ts
git mv src/desktop/useTheme.ts                      src/desktop/state/ThemeContext.tsx
rmdir src/desktop/context 2>/dev/null || true
```

Then convert `state/ThemeContext.tsx`: wrap the existing `useTheme` hook in a `ThemeProvider` + `useTheme()` context consumer (keep the same return shape so `ThemeSegmentedControl`/`ThemeToggle` consumers are unchanged aside from import path). Mount `<ThemeProvider>` in `DesktopApp` (Step 7).

- [ ] **Step 2: Move lib + ui + shell modules**

```bash
mkdir -p src/desktop/lib src/desktop/ui src/desktop/shell/icons src/desktop/shell/taskbar src/desktop/shell/startmenu src/desktop/shell/trash
git mv src/desktop/utils/viewport.ts                 src/desktop/lib/viewport.ts
git mv src/desktop/utils/iconLabelTone.ts            src/desktop/lib/iconLabelTone.ts
git mv src/desktop/utils/useResolvedIconLabelTone.ts src/desktop/lib/useResolvedIconLabelTone.ts
git mv src/desktop/utils/useViewportSize.ts          src/desktop/lib/useViewportSize.ts
git mv src/desktop/parts.tsx                          src/desktop/ui/parts.tsx
# Modal.tsx already lives at src/desktop/ui/Modal.tsx — no move needed.
git mv src/desktop/icons/ThemeIcons.tsx              src/desktop/shell/icons/ThemeIcons.tsx
git mv src/desktop/DesktopIcons.tsx                  src/desktop/shell/icons/DesktopIcons.tsx
git mv src/desktop/DesktopWallpaper.tsx              src/desktop/shell/Wallpaper.tsx
git mv src/desktop/DesktopBootOverlay.tsx            src/desktop/shell/BootOverlay.tsx
git mv src/desktop/ContextMenu.tsx                   src/desktop/shell/ContextMenu.tsx
git mv src/desktop/ThemeToggle.tsx                   src/desktop/shell/ThemeToggle.tsx
git mv src/desktop/StartMenu.tsx                     src/desktop/shell/startmenu/StartMenu.tsx
git mv src/desktop/Taskbar.tsx                       src/desktop/shell/taskbar/Taskbar.tsx
git mv src/desktop/ui/TaskbarClock.tsx               src/desktop/shell/taskbar/TaskbarClock.tsx
git mv src/desktop/Papelera.tsx                      src/desktop/shell/trash/Papelera.tsx
rmdir src/desktop/utils src/desktop/icons 2>/dev/null || true
```

- [ ] **Step 3: Move the shared icon lib into the desktop tree**

```bash
git mv src/lib/desktopIcons.ts src/desktop/lib/desktopIcons.ts
rg -l "@/lib/desktopIcons" src | xargs perl -pi -e "s#\@/lib/desktopIcons#\@desktop/lib/desktopIcons#g"
```

In `src/pages/index.astro` change `import { DESKTOP_ICON_URLS } from '../lib/desktopIcons';` → `import { DESKTOP_ICON_URLS } from '@desktop/lib/desktopIcons';`. (Check `src/lib/blog.ts`/others don't import desktopIcons: `rg -n "lib/desktopIcons" src` — repoint any remaining.)

- [ ] **Step 4: Repair all import paths after the moves**

Run: `pnpm check 2>&1 | rg -c error` — work through each error, repointing imports. Prefer `@desktop/...` aliases for cross-folder refs (e.g. `state/*`, `wrappers`, `lib/*`, `ui/parts`) and `./` for siblings. Re-run until `0 errors`.

- [ ] **Step 5: Extract `useDesktopApps` + `appToWindowDef` wiring**

Create `src/desktop/state/useDesktopApps.ts`:

```ts
// src/desktop/state/useDesktopApps.ts
import { useMemo } from 'react';
import { APPS, createPostApps } from '../apps/registry';
import { appToWindowDef } from '../apps/appToWindowDef';
import type { AppDefinition } from '@desktop/wrappers';
import type { BlogPostSummary, WindowDef } from '../types';

export function useDesktopApps(posts: BlogPostSummary[]): { apps: AppDefinition[]; defs: WindowDef[] } {
  const apps = useMemo<AppDefinition[]>(() => {
    const filtered = APPS.filter((app) => app.availableWhen?.({ posts }) ?? true);
    return [...filtered, ...createPostApps(posts)];
  }, [posts]);
  const defs = useMemo<WindowDef[]>(() => apps.map(appToWindowDef), [apps]);
  return { apps, defs };
}
```

- [ ] **Step 6: Extract the remaining DesktopApp logic into hooks**

Create these hooks by lifting the corresponding blocks **verbatim** from the current `DesktopApp.tsx` (`DesktopAppContent`), changing only what's needed to accept/return params:
- `state/useResponsiveLayout.ts` — the `windowsRef`, resize-listener effect, `layoutEpoch`, `fitWindowToMobile`, `openWindow`, and the clamp `useEffect`. Returns `{ openWindow, fitWindowToMobile }`. Signature: `useResponsiveLayout(wm, defs, viewport)`.
- `state/useTrashController.ts` — the `trash` useMemo. Signature: `useTrashController(icons, openWindow): TrashController`.
- `state/useAppContext.ts` — the `appContext` useMemo + `handleOpenLink`. Signature: `useAppContext({ posts, openWindow, browsers, trash, desktopIconUrls, setGeometry }): AppContext`.
- `state/useTaskbarMeta.ts` — the `meta` useMemo. Signature: `useTaskbarMeta(apps, desktopIconUrls): Record<string, WindowMeta>`. Imports `TRASH_JUNK` from `../apps/trash/junk`.

- [ ] **Step 7: Create `DesktopShell.tsx` and slim `DesktopApp.tsx`**

`DesktopApp.tsx` becomes the provider tree only:

```tsx
// src/desktop/DesktopApp.tsx
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import { useViewportSize } from './lib/useViewportSize';
import { useDesktopApps } from './state/useDesktopApps';
import { WindowManagerProvider } from './state/WindowManagerContext';
import { WallpaperProvider } from './state/WallpaperContext';
import { GridSettingsProvider } from './state/GridSettingsContext';
import { ThemeProvider } from './state/ThemeContext';
import DesktopShell from './DesktopShell';
import type { BlogPostSummary, WallpaperOption } from './types';

interface DesktopAppProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}

export default function DesktopApp({ posts, wallpapers, desktopIconUrls }: DesktopAppProps) {
  const viewport = useViewportSize();
  const { apps, defs } = useDesktopApps(posts);
  return (
    <WindowManagerProvider defs={defs} viewportWidth={viewport.width} viewportHeight={viewport.height}>
      <ThemeProvider>
        <WallpaperProvider wallpapers={wallpapers}>
          <GridSettingsProvider>
            <DesktopShell apps={apps} defs={defs} posts={posts} desktopIconUrls={desktopIconUrls} viewport={viewport} />
          </GridSettingsProvider>
        </WallpaperProvider>
      </ThemeProvider>
    </WindowManagerProvider>
  );
}
```

`DesktopShell.tsx` holds the former `DesktopAppContent`, now consuming the extracted hooks (`useResponsiveLayout`, `useTrashController`, `useAppContext`, `useTaskbarMeta`), and renders `<Wallpaper/> <BootOverlay/> <DesktopIcons/>`, the window map (the `app.render(appContext, win)` block from Task C Step 12), `<Taskbar/>`, `<Papelera/>` — with shell imports repointed to `./shell/...`.

- [ ] **Step 8: Run the gate**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: baseline.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: finalize desktop folders and decompose DesktopApp into hooks/contexts"
```

---

## Task F: Group site `.astro` components

**Files:**
- Move: `src/components/Header.astro`, `BaseHead.astro`, `NoiseBackground.astro`, `PostPreview.astro`, `ThemeToggle.astro` → `src/components/site/`
- Modify importers: `src/layouts/BaseLayout.astro`, `src/components/site/Header.astro` (imports `ThemeToggle`), `src/components/ui/PostList.astro` (imports `PostPreview`), `src/config/postFormatting.ts` (references `PostPreview`?), `src/components/site/BaseHead.astro` (imports `Tag`? — verify)

- [ ] **Step 1: Move the site components**

```bash
mkdir -p src/components/site
git mv src/components/Header.astro         src/components/site/Header.astro
git mv src/components/BaseHead.astro       src/components/site/BaseHead.astro
git mv src/components/NoiseBackground.astro src/components/site/NoiseBackground.astro
git mv src/components/PostPreview.astro    src/components/site/PostPreview.astro
git mv src/components/ThemeToggle.astro    src/components/site/ThemeToggle.astro
```

- [ ] **Step 2: Repoint importers**

Run: `rg -n "components/(Header|BaseHead|NoiseBackground|PostPreview|ThemeToggle)\.astro|from '\.\./(Header|BaseHead|NoiseBackground|PostPreview|ThemeToggle)" src`
For each hit, update the path to `components/site/<Name>.astro` (relative or `@/components/site/<Name>.astro`). Known importers: `BaseLayout.astro` (BaseHead, Header, NoiseBackground), `site/Header.astro` (`./ThemeToggle.astro` — stays sibling), `ui/PostList.astro` (PostPreview → `../site/PostPreview.astro`).

- [ ] **Step 3: Run the gate**

Run: `pnpm check && pnpm lint && pnpm build`
Expected: baseline (`0 errors, 0 warnings, 5 hints`; build `Complete!`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: group standalone site components under components/site"
```

---

## Final verification (manual smoke check)

After Task F, run the dev server and confirm no behavioral regressions vs. `main`.

- [ ] **Run:** `pnpm dev` and open the printed localhost URL.
- [ ] **Desktop (`/`):** boot overlay plays; double-click each desktop icon (about, terminal, proyectos, blog.sql, photos.jpg, startup.sh, ajustes) and confirm each window opens with correct title/icon.
- [ ] **Window manager:** drag, resize (all 8 handles), minimize (genie to taskbar), maximize/restore, focus stacking, close.
- [ ] **Browser apps:** in the web browser app type a URL + Enter; back/forward/reload work; photos/startup load their iframes with the URL bar only (no title).
- [ ] **Explorer apps:** projects open external links; blog opens post windows; grid↔list toggle works; sort setting applies.
- [ ] **Trash:** Papelera widget opens the trash window; junk files (area51/ovnis/no_abrir) open; restore/empty work; deleting a desktop icon moves it to trash.
- [ ] **Settings:** appearance (theme segmented control, wallpaper picker) and grid settings apply live; theme persists across reload.
- [ ] **Taskbar:** entries select/minimize/close; start menu lists apps; clock ticks; "close all".
- [ ] **Mobile:** narrow the viewport (<640px); windows fit full-screen; opening from taskbar re-fits.
- [ ] **Site pages:** `/blog` lists posts; a post page renders (hero, tags, prose); `/happy` shows the video; `/404` renders.
- [ ] **Final gate:** `pnpm check && pnpm lint && pnpm build` green.

If all pass, the refactor is complete and ready to merge via `superpowers:finishing-a-development-branch`.

---

## Self-review notes (author)

- **Spec coverage:** §move+aliases→Task A/B; §`defineApp`/wrappers spec→Task C; §per-app modules→Task D; §hooks/contexts (goal #3)→Task E; §Snake example→supported by Task C/D `defineApp` (no new factory); §site grouping + dead files→Task A/F. All spec sections map to a task.
- **Known risk — registry⇄trash cycle** (Task D Step 7): flagged with a fallback. Verify at the gate; if `findApp` is `undefined` at trash-items eval, apply the lazy/closure fallback.
- **Known behavior note — terminal `focused`** (Task C Step 10): the per-window `focused` flag isn't available inside a `defineApp` body, so terminal receives `focused: true`. If the smoke check shows a terminal focus/caret regression, thread `focused` by giving `body`/`render` access to `win.focused` (extend the body signature to `(ctx, win)` for terminal only, or read focus from a small context). Documented, not silently dropped.
- **Type consistency:** `AppContext` (was `WindowAppContext`), `AppDefinition.render(ctx, win)`, `WindowChromeProps`, `DefineAppInput.body/titleContent`, `explorerApp`/`browserApp` inputs used consistently across Tasks C–E.
