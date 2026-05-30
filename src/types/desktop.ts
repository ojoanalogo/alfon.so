/**
 * Consolidated types for the desktop shell.
 *
 * Re-exports everything that windows, layouts, app definitions, and contexts
 * exchange. Prefer importing from this barrel so individual file moves stay cheap.
 */

export type {
  WindowGeometry,
  WindowState,
  WindowDef,
  ResizeDirection,
  BlogPostSummary,
  WallpaperOption,
} from '../components/desktop/react/types';

export type {
  WindowAppContext,
  WindowAppEntry,
  WindowAppRenderer,
  WindowAppRegistry,
  WindowChromeOptions,
  TrashItem,
  TrashController,
} from '../components/desktop/react/apps/types';

export type { IconKey, DesktopIconUrls } from '../lib/desktopIcons';
export type { ListItem } from '../components/desktop/react/layouts/types';
