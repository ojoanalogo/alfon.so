import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadNotes, saveNotes } from './storage';
import type { Note } from './types';

const STORAGE_KEY = 'devfolio:notes';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'Title',
    content: 'Content',
    updatedAt: '2026-06-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('notes/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadNotes - first load / defaults', () => {
    it('returns an empty array when nothing is stored', () => {
      expect(loadNotes()).toEqual([]);
    });

    it('returns an empty array when the stored value is an empty string', () => {
      localStorage.setItem(STORAGE_KEY, '');
      expect(loadNotes()).toEqual([]);
    });
  });

  describe('save/load round-trip', () => {
    it('persists notes and loads them back identically', () => {
      const notes: Note[] = [
        makeNote({ id: 'a', title: 'First', content: 'Hello' }),
        makeNote({ id: 'b', title: 'Second', content: 'World' }),
      ];
      saveNotes(notes);
      const loaded = loadNotes();
      expect(loaded).toEqual(notes);
    });

    it('round-trips an empty array', () => {
      saveNotes([]);
      // Empty stringified array '[]' is truthy, so it is parsed back.
      expect(loadNotes()).toEqual([]);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
    });

    it('overwrites previously saved notes', () => {
      saveNotes([makeNote({ id: 'old' })]);
      saveNotes([makeNote({ id: 'new' })]);
      const loaded = loadNotes();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('new');
    });

    it('writes the value under the expected storage key', () => {
      const notes = [makeNote({ id: 'x' })];
      saveNotes(notes);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual(notes);
    });
  });

  describe('malformed / invalid stored data resilience', () => {
    it('returns [] when stored JSON is malformed', () => {
      localStorage.setItem(STORAGE_KEY, '{not valid json');
      expect(loadNotes()).toEqual([]);
    });

    it('returns [] when stored JSON is not an array (object)', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 'a' }));
      expect(loadNotes()).toEqual([]);
    });

    it('returns [] when stored JSON is a primitive', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'));
      expect(loadNotes()).toEqual([]);
    });

    it('filters out entries that are not valid notes', () => {
      const valid = makeNote({ id: 'good' });
      const mixed = [
        valid,
        null,
        42,
        'string',
        { id: 'x' }, // missing other fields
        { id: 1, title: 't', content: 'c', updatedAt: 'u' }, // wrong id type
        { id: 'y', title: 't', content: 'c' }, // missing updatedAt
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mixed));
      const loaded = loadNotes();
      expect(loaded).toEqual([valid]);
    });

    it('drops a note missing a required string field', () => {
      const arr = [{ id: 'a', title: 'a', content: 'c', updatedAt: 123 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      expect(loadNotes()).toEqual([]);
    });

    it('keeps notes with empty-string fields (still valid strings)', () => {
      const note = makeNote({ id: '', title: '', content: '', updatedAt: '' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([note]));
      expect(loadNotes()).toEqual([note]);
    });
  });

  describe('saveNotes error resilience', () => {
    it('swallows errors thrown by localStorage.setItem (quota / private mode)', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => saveNotes([makeNote()])).not.toThrow();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
