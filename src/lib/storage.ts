export const STORAGE_PREFIX = 'alfonso:';

/** Legacy keys migrated once on read (prefixed key wins if both exist). */
const LEGACY_KEYS: Record<string, string[]> = {
  theme: ['theme'],
  wallpaper: ['devfolio.wallpaper'],
  'desktop-color': ['devfolio.desktop-color'],
  'desktop-pattern': [],
  'window-transparency': ['devfolio.window-transparency'],
  notes: ['devfolio:notes'],
};

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

function migrateLegacyKey(name: string): string | null {
  const legacy = LEGACY_KEYS[name];
  if (!legacy) return null;
  for (const oldKey of legacy) {
    try {
      const value = localStorage.getItem(oldKey);
      if (value !== null) {
        localStorage.setItem(storageKey(name), value);
        localStorage.removeItem(oldKey);
        return value;
      }
    } catch {
      /* private mode */
    }
  }
  return null;
}

export function readStorageItem(name: string): string | null {
  try {
    const current = localStorage.getItem(storageKey(name));
    if (current !== null) return current;
    return migrateLegacyKey(name);
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
