import type { ReactNode } from 'react';
import type { BlogPostSummary, WindowDef } from '../types';

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

/** Props passed to every window app renderer. */
export interface WindowAppContext {
  posts: BlogPostSummary[];
  browserUrl: string | null;
  browserReloadKey: number;
  onOpenPost: (slug: string) => void;
  onOpenLink: (url: string) => void;
  onBrowserReload: () => void;
  onBrowserNavigate: (url: string) => void;
  focusedWindowId: string | null;
  trash: TrashController;
  iconUrls: Record<string, string>;
}

/** Per-window chrome customization beyond the default titlebar. */
export interface WindowChromeOptions {
  titleContent?: ReactNode;
  bodyClassName?: string;
  windowClassName?: string;
  /** Dynamic title override (e.g. browser URL). */
  resolveTitle?: (def: WindowDef, ctx: WindowAppContext) => string;
}

export type WindowAppRenderer = (ctx: WindowAppContext, windowId: string) => ReactNode;

export interface WindowAppEntry {
  render: WindowAppRenderer;
  /** Folder-style windows with a grid/list switcher in the title bar. */
  explorer?: boolean;
  chrome?: WindowChromeOptions | ((ctx: WindowAppContext) => WindowChromeOptions);
}

export type WindowAppRegistry = Record<string, WindowAppEntry>;

/** Resolve chrome options — static object or dynamic function. */
export function resolveWindowChrome(
  entry: WindowAppEntry | undefined,
  _def: WindowDef,
  ctx: WindowAppContext,
): WindowChromeOptions {
  if (!entry?.chrome) return {};
  const chrome = typeof entry.chrome === 'function' ? entry.chrome(ctx) : entry.chrome;
  return {
    ...chrome,
    resolveTitle: chrome.resolveTitle ?? ((d) => d.title),
  };
}

export function resolveWindowTitle(
  entry: WindowAppEntry | undefined,
  def: WindowDef,
  ctx: WindowAppContext,
): string {
  const chrome = resolveWindowChrome(entry, def, ctx);
  return chrome.resolveTitle?.(def, ctx) ?? def.title;
}
