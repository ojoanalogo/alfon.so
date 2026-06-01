import { useWallpaper } from '../context/WallpaperContext';
import { useGridSettings } from '../context/GridSettingsContext';
import type { IconLabelTone } from './iconLabelTone';

/**
 * Resolve the icon label tone: GridSettings override wins, otherwise fall
 * back to the wallpaper-derived auto detection.
 */
export function useResolvedIconLabelTone(): IconLabelTone {
  const { iconLabelTone } = useWallpaper();
  const { settings } = useGridSettings();
  if (settings.labelTone === 'light' || settings.labelTone === 'dark') {
    return settings.labelTone;
  }
  return iconLabelTone;
}
