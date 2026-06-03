import { describe, it, expect } from 'vitest';
import { PROJECTS, TECH_STACK, type ProjectEntry } from './data';
import { TRASH_JUNK, type TrashJunkItem } from '../trash/junk';

describe('PROJECTS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PROJECTS)).toBe(true);
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it('every entry has the required string fields title, description, icon', () => {
    for (const p of PROJECTS) {
      expect(typeof p.title).toBe('string');
      expect(p.title.trim().length).toBeGreaterThan(0);
      expect(typeof p.description).toBe('string');
      expect(p.description.trim().length).toBeGreaterThan(0);
      expect(typeof p.icon).toBe('string');
      expect(p.icon.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a string link field (may be empty for unreleased projects)', () => {
    for (const p of PROJECTS) {
      expect(typeof p.link).toBe('string');
    }
  });

  it('non-empty links are well-formed http(s) URLs', () => {
    for (const p of PROJECTS) {
      if (p.link === '') continue;
      expect(p.link).toMatch(/^https?:\/\//);
      expect(() => new URL(p.link)).not.toThrow();
    }
  });

  it('has unique titles', () => {
    const titles = PROJECTS.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('does not carry any unexpected keys on entries', () => {
    const allowed = new Set<keyof ProjectEntry>(['title', 'description', 'link', 'icon']);
    for (const p of PROJECTS) {
      for (const key of Object.keys(p)) {
        expect(allowed.has(key as keyof ProjectEntry)).toBe(true);
      }
    }
  });
});

describe('TECH_STACK', () => {
  it('is a non-empty record of string keys to string values', () => {
    const entries = Object.entries(TECH_STACK);
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, value] of entries) {
      expect(key.trim().length).toBeGreaterThan(0);
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('TRASH_JUNK', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TRASH_JUNK)).toBe(true);
    expect(TRASH_JUNK.length).toBeGreaterThan(0);
  });

  it('every item has required string fields id, name, kind, iconSrc', () => {
    for (const item of TRASH_JUNK) {
      expect(typeof item.id).toBe('string');
      expect(item.id.trim().length).toBeGreaterThan(0);
      expect(typeof item.name).toBe('string');
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(typeof item.kind).toBe('string');
      expect(item.kind.trim().length).toBeGreaterThan(0);
      expect(typeof item.iconSrc).toBe('string');
      expect(item.iconSrc.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = TRASH_JUNK.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = TRASH_JUNK.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('optional appId, when present, is a non-empty string', () => {
    for (const item of TRASH_JUNK) {
      if (item.appId === undefined) continue;
      expect(typeof item.appId).toBe('string');
      expect(item.appId.trim().length).toBeGreaterThan(0);
    }
  });

  it('optional isFolder, when present, is a boolean', () => {
    for (const item of TRASH_JUNK) {
      if (item.isFolder === undefined) continue;
      expect(typeof item.isFolder).toBe('boolean');
    }
  });

  it('optional size, when present, is a non-empty string', () => {
    for (const item of TRASH_JUNK) {
      if (item.size === undefined) continue;
      expect(typeof item.size).toBe('string');
      expect(item.size.trim().length).toBeGreaterThan(0);
    }
  });

  it('does not carry any unexpected keys on items', () => {
    const allowed = new Set<keyof TrashJunkItem>([
      'id',
      'name',
      'kind',
      'iconSrc',
      'appId',
      'isFolder',
      'size',
    ]);
    for (const item of TRASH_JUNK) {
      for (const key of Object.keys(item)) {
        expect(allowed.has(key as keyof TrashJunkItem)).toBe(true);
      }
    }
  });

  it('includes the known app-opening junk entries (area51, ovnis, happy) with appIds', () => {
    const byId = new Map(TRASH_JUNK.map((i) => [i.id, i]));
    for (const id of ['area51', 'ovnis', 'happy']) {
      const item = byId.get(id);
      expect(item).toBeTruthy();
      expect(item?.appId).toBeTruthy();
    }
  });

  it('folder items can show "—" for size; only some override it explicitly', () => {
    const folders = TRASH_JUNK.filter((i) => i.isFolder);
    expect(folders.length).toBeGreaterThan(0);
    // node_modules overrides size, the compressed zip does not.
    const nodeModules = folders.find((i) => i.id === 'node_modules');
    expect(nodeModules?.size).toBe('1 PB');
  });
});
