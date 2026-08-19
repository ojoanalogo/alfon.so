import { describe, it, expect, beforeEach } from 'vitest';
import { readStorageItem, removeStorageItem, storageKey, writeStorageItem } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('prefixes keys with alfonso:', () => {
    expect(storageKey('theme')).toBe('alfonso:theme');
  });

  it('reads and writes prefixed values', () => {
    writeStorageItem('theme', 'dark');
    expect(readStorageItem('theme')).toBe('dark');
    expect(localStorage.getItem('alfonso:theme')).toBe('dark');
  });

  it('ignores unprefixed legacy keys', () => {
    localStorage.setItem('theme', 'light');
    expect(readStorageItem('theme')).toBeNull();
  });

  it('removeStorageItem clears prefixed key', () => {
    writeStorageItem('theme', 'dark');
    removeStorageItem('theme');
    expect(readStorageItem('theme')).toBeNull();
  });
});
