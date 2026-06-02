export const DEFAULT_WALLPAPER_ID = '4';

export function resolveWallpaperId(storedId: string, availableIds: Set<string>): string | null {
  if (availableIds.has(storedId)) return storedId;
  return defaultWallpaperId(availableIds);
}

export function defaultWallpaperId(availableIds: Set<string>): string | null {
  if (availableIds.has(DEFAULT_WALLPAPER_ID)) return DEFAULT_WALLPAPER_ID;
  const firstNumeric = [...availableIds].sort((a, b) => Number(a) - Number(b))[0];
  return firstNumeric ?? null;
}
