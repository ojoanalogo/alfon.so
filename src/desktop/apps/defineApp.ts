import { createElement, type ComponentType, type ReactNode } from 'react';
import type { IconKey } from '@/lib/desktopIcons';
import type { ExplorerViewMode, ListItem } from '../layouts/types';
import type { AppGeometry } from '../types';
import type { WindowAppContext } from './types';

export type { AppGeometry };

export interface SettingsSection {
  id: string;
  /** Section title shown above the body. Omit for header-less sections. */
  title?: string;
  render: () => ReactNode;
}

/**
 * Discriminated union: each `kind` is a "sub-app shape" with its own concerns.
 * The dispatcher (`renderApp`) maps `kind` → the right window shell + body
 * components, so app authors never wire chrome/CSS by hand.
 */
export type AppLayout =
  | { kind: 'custom'; render: (ctx: WindowAppContext) => ReactNode }
  | {
      kind: 'explorer';
      items: (ctx: WindowAppContext) => ListItem[];
      defaultMode?: ExplorerViewMode;
      /** Activate handler; receives the activated item id and the ctx. */
      onActivate?: (id: string, ctx: WindowAppContext) => void;
      /** Optional footer rendered below the items (e.g. trash actions). */
      footer?: (ctx: WindowAppContext) => ReactNode;
    }
  | { kind: 'browser'; initialUrl?: string | null; hideTitle?: boolean }
  | { kind: 'terminal' }
  | { kind: 'settings'; sections: SettingsSection[] };

export interface DesktopIconConfig {
  /** Override the icon label (defaults to the app's title when title is a string). */
  label?: string;
  tooltip?: string;
  /** When false, the app exists but has no desktop icon. */
  show?: boolean;
}

export interface AppChrome {
  /**
   * Extra class on the outer `<motion.section>`. Only set this when a matching
   * `.desktop-window--<x>` selector exists in global.css (the browser variant
   * is the reference); otherwise it emits a dead class to the DOM.
   */
  windowClassName?: string;
  /** Extra class on the `.card-body` inside the window. */
  bodyClassName?: string;
}

/** Resolved app definition. Build with `defineApp(...)` or a variant factory. */
export interface AppDefinition<Id extends string = string> {
  id: Id;
  /** Static title or a function of the runtime context (e.g. browser → host). */
  title: string | ((ctx: WindowAppContext) => string);
  /** Bundled icon key (src/lib/desktopIcons). Optional when `iconUrl` is set. */
  iconKey?: IconKey;
  /**
   * Direct icon URL, e.g. `import iconUrl from './icon.svg?url'` co-located with
   * the app. Overrides `iconKey`, so a new app's icon needs no edit in
   * lib/desktopIcons.ts.
   */
  iconUrl?: string;
  layout: AppLayout;
  geometry: AppGeometry;
  chrome?: AppChrome;
  desktopIcon?: DesktopIconConfig | false;
  taskbarTooltip?: string;
  /** Gate the app's existence on runtime state (e.g. hide blog when no posts). */
  availableWhen?: (ctx: Pick<WindowAppContext, 'posts'>) => boolean;
}

/** Identity helper — keeps inferred literal `id` and yields autocomplete on the rest. */
export function defineApp<Id extends string>(app: AppDefinition<Id>): AppDefinition<Id> {
  return app;
}

// ---------------------------------------------------------------------------
// Variant factories
// ---------------------------------------------------------------------------
// Each factory fills layout.kind, sensible chrome defaults, and the bits that
// app authors don't want to repeat (taskbar tooltips, body class hooks).

export interface DefineCustomAppInput<Id extends string, P> {
  id: Id;
  title: string | ((ctx: WindowAppContext) => string);
  iconKey?: IconKey;
  iconUrl?: string;
  /** Component rendered as the window body. Provide this OR `render`. */
  component?: ComponentType<P>;
  /** Props for `component`, derived from the runtime ctx. Omit for prop-less components. */
  props?: (ctx: WindowAppContext) => P;
  /** Escape hatch for ad-hoc rendering. Provide this OR `component`. */
  render?: (ctx: WindowAppContext) => ReactNode;
  geometry: AppGeometry;
  chrome?: AppChrome;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

export function defineCustomApp<Id extends string, P = Record<string, never>>(
  input: DefineCustomAppInput<Id, P>,
): AppDefinition<Id> {
  const { component, props, render } = input;
  if (!render && !component) {
    throw new Error(`defineCustomApp(${input.id}): provide either \`component\` or \`render\`.`);
  }
  const Component = component as ComponentType<Record<string, unknown>>;
  const resolvedRender =
    render ??
    ((ctx: WindowAppContext) =>
      createElement(Component, (props ? props(ctx) : {}) as Record<string, unknown>));
  return defineApp({
    id: input.id,
    title: input.title,
    iconKey: input.iconKey,
    iconUrl: input.iconUrl,
    layout: { kind: 'custom', render: resolvedRender },
    geometry: input.geometry,
    chrome: input.chrome,
    desktopIcon: input.desktopIcon,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip,
  });
}

export interface DefineExplorerAppInput<Id extends string> {
  id: Id;
  title: string | ((ctx: WindowAppContext) => string);
  iconKey?: IconKey;
  iconUrl?: string;
  items: (ctx: WindowAppContext) => ListItem[];
  defaultMode?: ExplorerViewMode;
  onActivate?: (id: string, ctx: WindowAppContext) => void;
  footer?: (ctx: WindowAppContext) => ReactNode;
  geometry: AppGeometry;
  chrome?: AppChrome;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

export function defineExplorerApp<Id extends string>(input: DefineExplorerAppInput<Id>): AppDefinition<Id> {
  return defineApp({
    id: input.id,
    title: input.title,
    iconKey: input.iconKey,
    iconUrl: input.iconUrl,
    layout: {
      kind: 'explorer',
      items: input.items,
      defaultMode: input.defaultMode,
      onActivate: input.onActivate,
      footer: input.footer,
    },
    geometry: input.geometry,
    chrome: input.chrome,
    desktopIcon: input.desktopIcon,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip,
  });
}

export interface DefineBrowserAppInput<Id extends string> {
  id: Id;
  /** Fallback title (used when the browser has no current URL). */
  title?: string;
  iconKey?: IconKey;
  iconUrl?: string;
  /** Loaded when the app opens for the first time. */
  initialUrl?: string | null;
  /** Hide the app label in the titlebar — leaves only nav + URL bar visible. */
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

/**
 * "Sub-app extending browser." Pre-fills layout.kind = 'browser', wires the
 * title to the current URL host, and applies the browser chrome class hooks.
 * Make a Twitter app in one line: `defineBrowserApp({ id: 'twitter', title: 'Twitter', initialUrl: 'https://twitter.com' })`.
 */
export function defineBrowserApp<Id extends string>(input: DefineBrowserAppInput<Id>): AppDefinition<Id> {
  const fallback = input.title ?? 'navegador';
  return defineApp({
    id: input.id,
    title: (ctx) => {
      const url = ctx.browsers.get(input.id).url ?? input.initialUrl ?? null;
      if (!url) return fallback;
      try {
        return new URL(url).host;
      } catch {
        return fallback;
      }
    },
    iconKey: input.iconKey ?? 'startup',
    iconUrl: input.iconUrl,
    layout: {
      kind: 'browser',
      initialUrl: input.initialUrl ?? null,
      hideTitle: input.hideTitle,
    },
    geometry: { ...DEFAULT_BROWSER_GEOMETRY, ...input.geometry },
    chrome: {
      windowClassName: 'desktop-window--browser',
      bodyClassName: 'browser-window__body',
    },
    desktopIcon: input.desktopIcon ?? false,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip ?? fallback,
  });
}

export interface DefineTerminalAppInput<Id extends string> {
  id: Id;
  title: string;
  iconKey?: IconKey;
  iconUrl?: string;
  geometry: AppGeometry;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

export function defineTerminalApp<Id extends string>(input: DefineTerminalAppInput<Id>): AppDefinition<Id> {
  return defineApp({
    id: input.id,
    title: input.title,
    iconKey: input.iconKey ?? 'terminal',
    iconUrl: input.iconUrl,
    layout: { kind: 'terminal' },
    geometry: input.geometry,
    chrome: { bodyClassName: 'terminal-window__body' },
    desktopIcon: input.desktopIcon,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip,
  });
}

export interface DefineSettingsAppInput<Id extends string> {
  id: Id;
  title: string;
  iconKey?: IconKey;
  iconUrl?: string;
  sections: SettingsSection[];
  geometry: AppGeometry;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

export function defineSettingsApp<Id extends string>(input: DefineSettingsAppInput<Id>): AppDefinition<Id> {
  return defineApp({
    id: input.id,
    title: input.title,
    iconKey: input.iconKey ?? 'settings',
    iconUrl: input.iconUrl,
    layout: { kind: 'settings', sections: input.sections },
    geometry: input.geometry,
    chrome: { bodyClassName: 'card-body--settings' },
    desktopIcon: input.desktopIcon,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip,
  });
}

// ---------------------------------------------------------------------------
// Helpers consumed by the runtime (DesktopApp / renderApp).
// ---------------------------------------------------------------------------

export function resolveAppTitle(app: AppDefinition, ctx: WindowAppContext): string {
  return typeof app.title === 'function' ? app.title(ctx) : app.title;
}

export function appLabel(app: AppDefinition): string {
  if (typeof app.title === 'string') return app.title;
  // Fallback when title is a function — desktop icons should still have a label.
  return app.id;
}
