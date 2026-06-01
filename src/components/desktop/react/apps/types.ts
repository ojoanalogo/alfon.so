import type { BlogPostSummary } from '../types';
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
  trash: TrashController;
  iconUrls: Record<string, string>;
}
