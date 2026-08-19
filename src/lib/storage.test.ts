import { describe, it, expect, beforeEach } from 'vitest';
import {
  readStorageItem,
  removeStorageItem,
  STORAGE,
  STORAGE_KEYS,
  STORAGE_PREFIX,
  writeStorageItem,
} from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('prefixes keys with the shared storage prefix', () => {
    expect(STORAGE.theme).toBe(`${STORAGE_PREFIX}${STORAGE_KEYS.theme}`);
  });

  it('reads and writes prefixed values', () => {
    writeStorageItem(STORAGE_KEYS.theme, 'dark');
    expect(readStorageItem(STORAGE_KEYS.theme)).toBe('dark');
    expect(localStorage.getItem(STORAGE.theme)).toBe('dark');
  });

  it('ignores unprefixed legacy keys', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'light');
    expect(readStorageItem(STORAGE_KEYS.theme)).toBeNull();
  });

  it('removeStorageItem clears prefixed key', () => {
    writeStorageItem(STORAGE_KEYS.theme, 'dark');
    removeStorageItem(STORAGE_KEYS.theme);
    expect(readStorageItem(STORAGE_KEYS.theme)).toBeNull();
  });
});
