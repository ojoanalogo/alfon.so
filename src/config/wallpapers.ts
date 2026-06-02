export const DEFAULT_WALLPAPER_ID = '1';

/** Maps pre-rename wallpaper ids stored in localStorage to normalized ids. */
export const LEGACY_WALLPAPER_IDS: Record<string, string> = {
  jp96pwl191o71: '1',
  '9uxkdqmh6rz71': '2',
  a1wxfdoslzh31: '3',
  me96ufa4vm271: '4',
  'pissarro-garden-eragny': '5',
  'pissarro-landscape-eragny': '6',
};

export function resolveWallpaperId(storedId: string, availableIds: Set<string>): string | null {
  const normalized = LEGACY_WALLPAPER_IDS[storedId] ?? storedId;
  if (availableIds.has(normalized)) return normalized;
  return availableIds.has(DEFAULT_WALLPAPER_ID) ? DEFAULT_WALLPAPER_ID : null;
}

export function defaultWallpaperId(availableIds: Set<string>): string | null {
  if (availableIds.has(DEFAULT_WALLPAPER_ID)) return DEFAULT_WALLPAPER_ID;
  const firstNumeric = [...availableIds].sort((a, b) => Number(a) - Number(b))[0];
  return firstNumeric ?? null;
}
