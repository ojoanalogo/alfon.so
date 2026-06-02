export type GridIconSize = 'small' | 'medium' | 'large';
export type GridSpacing = 'compact' | 'normal' | 'roomy';
export type GridSortBy = 'name' | 'kind';

export interface GridSettings {
  iconSize: GridIconSize;
  spacing: GridSpacing;
  sortBy: GridSortBy;
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  iconSize: 'medium',
  spacing: 'normal',
  sortBy: 'name',
};

export const ICON_SIZE_PX: Record<GridIconSize, number> = {
  small: 24,
  medium: 32,
  large: 48,
};

export const SPACING_GAP_PX: Record<GridSpacing, number> = {
  compact: 8,
  normal: 16,
  roomy: 24,
};
