import type { ReactNode } from 'react';
import { formatWindowTitle } from '@desktop/lib/formatWindowTitle';
import type { IconKey } from '@desktop/lib/desktopIcons';
import type { AppGeometry, BlogPostSummary, WindowGeometry, WindowState } from '../types';
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

/**
 * Read-only runtime environment passed to every app's render/body.
 * (Previously named WindowAppContext in apps/types.ts.)
 */
export interface AppContext {
  posts: BlogPostSummary[];
  onOpenPost: (slug: string) => void;
  /** Open a registered app window by id. */
  onOpenApp: (id: string) => void;
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
  defaultWidth: number;
  defaultHeight?: number;
  center?: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onGeometryChange: (geometry: Partial<WindowGeometry>) => void;
  /** Minimum height for content-sized windows. */
  minHeight?: number;
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
  /**
   * When set, the browser history for this app is seeded with this URL on
   * first open. Only meaningful for browser-kind apps; ignored by others.
   */
  initialBrowserUrl?: string | null;
  /** Self-contained render; window-manager wiring arrives as `win`. */
  render: (ctx: AppContext, win: WindowChromeProps) => ReactNode;
}

export function resolveAppTitle(app: AppDefinition, ctx: AppContext): string {
  const raw = typeof app.title === 'function' ? app.title(ctx) : app.title;
  return formatWindowTitle(raw);
}

export function appLabel(app: AppDefinition): string {
  return typeof app.title === 'string' ? app.title : app.id;
}
