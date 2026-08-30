import { describe, it, expect } from 'vitest';
import { PROJECTS, TECH_STACK, type ProjectEntry } from './data';

describe('PROJECTS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PROJECTS)).toBe(true);
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it('every entry has the required string fields title, description, and optional icon', () => {
    for (const p of PROJECTS) {
      expect(typeof p.title).toBe('string');
      expect(p.title.trim().length).toBeGreaterThan(0);
      expect(typeof p.description).toBe('string');
      expect(p.description.trim().length).toBeGreaterThan(0);
      if (p.icon !== undefined) {
        expect(typeof p.icon).toBe('string');
        expect(p.icon.length).toBeGreaterThan(0);
      }
    }
  });

  it('does not use an emoji icon for sofia', () => {
    const sofia = PROJECTS.find((p) => p.title === 'sofia');
    expect(sofia).toBeDefined();
    expect(sofia?.icon).toBeUndefined();
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

  it('lists TypeScript, PostgreSQL, and Codex without JavaScript or generic SQL', () => {
    expect(TECH_STACK.ts).toBe('TypeScript');
    expect(TECH_STACK.psql).toBe('PostgreSQL');
    expect(TECH_STACK.codex).toBe('OpenAI Codex');
    expect(TECH_STACK).not.toHaveProperty('js');
    expect(TECH_STACK).not.toHaveProperty('sql');
  });
});
