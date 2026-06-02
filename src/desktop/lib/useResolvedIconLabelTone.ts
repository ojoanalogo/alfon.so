import { useWallpaper } from '../state/WallpaperContext';
import type { IconLabelTone } from './iconLabelTone';

/** Icon label tone from wallpaper or fill color luminance. */
export function useResolvedIconLabelTone(): IconLabelTone {
  const { iconLabelTone } = useWallpaper();
  return iconLabelTone;
}
