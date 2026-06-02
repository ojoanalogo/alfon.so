export const DEFAULT_WALLPAPER_ID = '5';

export function defaultWallpaperId(availableIds: Set<string>): string | null {
  if (availableIds.has(DEFAULT_WALLPAPER_ID)) return DEFAULT_WALLPAPER_ID;
  const firstNumeric = [...availableIds].sort((a, b) => Number(a) - Number(b))[0];
  return firstNumeric ?? null;
}
