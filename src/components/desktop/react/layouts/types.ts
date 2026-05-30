import type { ReactNode } from 'react';

/**
 * Canonical record consumed by every list-style layout in the desktop shell
 * (GridLayout, FolderList, ExplorerLayout). Adding a new layout? Take ListItem[]
 * — never invent a sibling shape.
 *
 * - `iconSrc` wins when both `iconSrc` and `graphic` are present.
 * - `kind` is the human-readable category shown in the list view ("PDF", "Carpeta").
 * - `size` overrides the synthetic file-size in the list view; leave empty to let
 *   ExplorerLayout fall back to `fakeFileSize()`.
 */
export interface ListItem {
  id: string;
  label: string;
  /** Category label rendered in list view (e.g. "Proyecto", "PDF"). */
  kind?: string;
  /** Tooltip / extended description (rendered as the button's title attr). */
  title?: string;
  /** Path to a raster/svg icon; preferred over `graphic` when set. */
  iconSrc?: string;
  /** Emoji or inline ReactNode — used when no `iconSrc`. */
  graphic?: ReactNode;
  /** Pre-formatted file size for the list view. */
  size?: string;
  disabled?: boolean;
}
