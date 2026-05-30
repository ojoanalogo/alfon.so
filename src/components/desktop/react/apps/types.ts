import type { ReactNode } from 'react';
import type { BlogPostSummary, WindowDef } from '../types';
import type { BrowserHistories } from '../browser/useBrowserHistories';

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

/**
 * Props passed to every window app renderer. App authors should treat this as
 * the read-only environment their app runs in — to mutate state, call the
 * provided handlers (`onOpenPost`, `onOpenLink`, `browsers.navigate`, …).
 */
export interface WindowAppContext {
  posts: BlogPostSummary[];
  onOpenPost: (slug: string) => void;
  /** Open a URL in the main browser window. */
  onOpenLink: (url: string) => void;
  /** Per-browser-app navigation state. */
  browsers: BrowserHistories;
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
