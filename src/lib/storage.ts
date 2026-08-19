export const STORAGE_PREFIX = 'alfonso:';

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
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
