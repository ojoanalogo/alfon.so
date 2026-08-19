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

  it('migrates legacy theme key on read', () => {
    localStorage.setItem('theme', 'light');
    expect(readStorageItem('theme')).toBe('light');
    expect(localStorage.getItem('alfonso:theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('migrates legacy devfolio wallpaper key on read', () => {
    localStorage.setItem('devfolio.wallpaper', '03');
    expect(readStorageItem('wallpaper')).toBe('03');
    expect(localStorage.getItem('alfonso:wallpaper')).toBe('03');
    expect(localStorage.getItem('devfolio.wallpaper')).toBeNull();
  });

  it('prefers prefixed value over legacy', () => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('alfonso:theme', 'dark');
    expect(readStorageItem('theme')).toBe('dark');
  });

  it('removeStorageItem clears prefixed key', () => {
    writeStorageItem('theme', 'dark');
    removeStorageItem('theme');
    expect(readStorageItem('theme')).toBeNull();
  });
});
