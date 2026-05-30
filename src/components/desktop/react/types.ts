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
}

export interface WindowDef {
  id: string;
  title: string;
  /** Default geometry, in CSS pixels, before viewport clamping. */
  defaultX: number;
  defaultY: number;
  defaultWidth: number;
  /** Minimum width when resizing; defaults to global MIN_WIDTH. */
  minWidth?: number;
  defaultOpen?: boolean;
  /** Stacking order applied to windows that start open. */
  initialZ?: number;
  /** Initial height in px; omit for content-driven height. */
  defaultHeight?: number;
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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
