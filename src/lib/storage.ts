export const STORAGE_PREFIX = 'alfonso:';

/** Logical localStorage names (without the prefix). */
export const STORAGE_KEYS = {
  theme: 'theme',
  wallpaper: 'wallpaper',
  desktopColor: 'desktop-color',
  desktopPattern: 'desktop-pattern',
  windowTransparency: 'window-transparency',
  notes: 'notes',
} as const;

export type StorageKeyName = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

/** Fully prefixed keys for direct localStorage access (tests, inline scripts). */
export const STORAGE = {
  theme: storageKey(STORAGE_KEYS.theme),
  wallpaper: storageKey(STORAGE_KEYS.wallpaper),
  desktopColor: storageKey(STORAGE_KEYS.desktopColor),
  desktopPattern: storageKey(STORAGE_KEYS.desktopPattern),
  windowTransparency: storageKey(STORAGE_KEYS.windowTransparency),
  notes: storageKey(STORAGE_KEYS.notes),
} as const;

export function gameHighScoreName(gameId: string): string {
  return `game-highscore:${gameId}`;
}

export function gameHighScoreKey(gameId: string): string {
  return storageKey(gameHighScoreName(gameId));
}

export function readStorageItem(name: string): string | null {
  try {
    return localStorage.getItem(storageKey(name));
  } catch {
    return null;
  }
}

export function writeStorageItem(name: string, value: string): void {
  try {
    localStorage.setItem(storageKey(name), value);
  } catch {
    /* quota / private mode */
  }
}

export function removeStorageItem(name: string): void {
  try {
    localStorage.removeItem(storageKey(name));
  } catch {
    /* private mode */
  }
}
