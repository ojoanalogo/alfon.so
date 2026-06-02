export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  /** `null` means the window height is driven by its content. */
  height: number | null;
}

export interface WindowState extends WindowGeometry {
  id: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  /** Set after move/resize; relayout keeps custom width/height when true. */
  userSized?: boolean;
}

/**
 * Default window geometry an app declares, in CSS pixels, before viewport
 * clamping. Shared by `AppDefinition.geometry` and `WindowDef` so a new field
 * (e.g. `maxWidth`) propagates to both without a hand-maintained mapping.
 */
export interface AppGeometry {
  /** Legacy; placement is computed near viewport center at runtime. */
  defaultX?: number;
  /** Legacy; placement is computed near viewport center at runtime. */
  defaultY?: number;
  defaultWidth: number;
  /** Initial height in px; omit for content-driven height. */
  defaultHeight?: number;
  /** Floor height for content-driven windows (height unset). */
  minHeight?: number;
  /** Minimum width when resizing; defaults to global MIN_WIDTH. */
  minWidth?: number;
  /** Stacking order; omit to derive from the app's registry order. */
  initialZ?: number;
  /** Place the window at the viewport center on first layout. */
  center?: boolean;
  defaultOpen?: boolean;
}

/**
 * Resolved window definition. `appToWindowDef` fills stacking defaults;
 * x/y placement is resolved near the viewport center when a window opens.
 */
export interface WindowDef extends AppGeometry {
  id: string;
  title: string;
  defaultX: number;
  defaultY: number;
  initialZ: number;
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Per-window taskbar presentation metadata (icon + labels). */
export interface WindowMeta {
  iconSrc: string;
  label: string;
  tooltip?: string;
}

export interface BlogPostSummary {
  title: string;
  slug: string;
  publishDate: string;
  description?: string;
  readingTime?: string;
  tags?: string[];
  heroImageSrc?: string;
  heroImageAlt?: string;
  /** Pre-rendered HTML for the post body. */
  html: string;
}

export interface WallpaperOption {
  id: string;
  label: string;
  src: string;
  thumbSrc: string;
}
