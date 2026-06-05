import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNotes } from './useNotes';
import type { Note } from './types';

const STORAGE_KEY = 'devfolio:notes';

function readStorage(): Note[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Note[]) : [];
}

describe('useNotes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty when there is nothing persisted', () => {
    const { result } = renderHook(() => useNotes());
    expect(result.current.notes).toEqual([]);
  });

  it('does not write storage on mount before any edit', () => {
    renderHook(() => useNotes());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('hydrates initial notes from storage', () => {
    const seeded: Note[] = [
      { id: 'a', title: 'Seed', content: 'hello', updatedAt: '2026-01-01T00:00:00.000Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useNotes());
    expect(result.current.notes).toEqual(seeded);
  });

  it('createNote prepends a new note and returns its id', () => {
    const { result } = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = result.current.createNote();
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].id).toBe(id);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(result.current.notes[0].title).toBe('Nota sin título');
    expect(result.current.notes[0].content).toBe('');
    expect(typeof result.current.notes[0].updatedAt).toBe('string');
  });

  it('createNote prepends (newest first) and keeps unique ids', () => {
    const { result } = renderHook(() => useNotes());

    let firstId = '';
    let secondId = '';
    act(() => {
      firstId = result.current.createNote();
    });
    act(() => {
      secondId = result.current.createNote();
    });

    expect(result.current.notes).toHaveLength(2);
    expect(firstId).not.toBe(secondId);
    // newest is first
    expect(result.current.notes[0].id).toBe(secondId);
    expect(result.current.notes[1].id).toBe(firstId);
  });

  it('findNote returns the matching note and undefined for unknown ids', () => {
    const { result } = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = result.current.createNote();
    });

    expect(result.current.findNote(id)?.id).toBe(id);
    expect(result.current.findNote('does-not-exist')).toBeUndefined();
  });

  it('updateNote patches title and content for the targeted note only', () => {
    const { result } = renderHook(() => useNotes());

    let idA = '';
    let idB = '';
    act(() => {
      idA = result.current.createNote();
    });
    act(() => {
      idB = result.current.createNote();
    });

    const beforeUpdatedAt = result.current.findNote(idA)?.updatedAt;
    const untouchedB = result.current.findNote(idB);

    act(() => {
      result.current.updateNote(idA, { title: 'Updated title', content: 'Body text' });
    });

    const updated = result.current.findNote(idA);
    expect(updated?.title).toBe('Updated title');
    expect(updated?.content).toBe('Body text');
    // updatedAt is refreshed to a string timestamp
    expect(typeof updated?.updatedAt).toBe('string');
    expect(beforeUpdatedAt).toBeTruthy();

    // the other note remains identical
    expect(result.current.findNote(idB)).toEqual(untouchedB);
  });

  it('updateNote can patch a single field (partial patch)', () => {
    const { result } = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = result.current.createNote();
    });

    act(() => {
      result.current.updateNote(id, { content: 'only content' });
    });

    const note = result.current.findNote(id);
    expect(note?.content).toBe('only content');
    // title untouched
    expect(note?.title).toBe('Nota sin título');
  });

  it('updateNote with an empty patch still refreshes updatedAt and is a no-op for fields', () => {
    const { result } = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = result.current.createNote();
    });
    const before = result.current.findNote(id);

    act(() => {
      result.current.updateNote(id, {});
    });

    const after = result.current.findNote(id);
    expect(after?.title).toBe(before?.title);
    expect(after?.content).toBe(before?.content);
    expect(typeof after?.updatedAt).toBe('string');
  });

  it('updateNote on a missing id leaves all notes unchanged', () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.createNote();
    });
    const snapshot = result.current.notes;

    act(() => {
      result.current.updateNote('missing-id', { title: 'nope' });
    });

    expect(result.current.notes).toEqual(snapshot);
  });

  it('deleteNote removes only the targeted note', () => {
    const { result } = renderHook(() => useNotes());

    let idA = '';
    let idB = '';
    act(() => {
      idA = result.current.createNote();
    });
    act(() => {
      idB = result.current.createNote();
    });

    act(() => {
      result.current.deleteNote(idA);
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.findNote(idA)).toBeUndefined();
    expect(result.current.findNote(idB)?.id).toBe(idB);
  });

  it('deleteNote on a missing id is a no-op', () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.createNote();
    });
    const snapshot = result.current.notes;

    act(() => {
      result.current.deleteNote('not-here');
    });

    expect(result.current.notes).toEqual(snapshot);
  });

  it('persists notes to localStorage on create', () => {
    const { result } = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = result.current.createNote();
    });

    const stored = readStorage();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(id);
  });

  it('persists updates and deletes to localStorage', () => {
    const { result } = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = result.current.createNote();
    });
    act(() => {
      result.current.updateNote(id, { title: 'Persisted' });
    });

    expect(readStorage()[0].title).toBe('Persisted');

    act(() => {
      result.current.deleteNote(id);
    });

    expect(readStorage()).toEqual([]);
  });

  it('rehydrates persisted state in a fresh hook instance', () => {
    const first = renderHook(() => useNotes());

    let id = '';
    act(() => {
      id = first.result.current.createNote();
    });
    act(() => {
      first.result.current.updateNote(id, { title: 'Survives remount', content: 'kept' });
    });

    // New hook instance reads from the same localStorage.
    const second = renderHook(() => useNotes());
    expect(second.result.current.notes).toHaveLength(1);
    const note = second.result.current.notes[0];
    expect(note.id).toBe(id);
    expect(note.title).toBe('Survives remount');
    expect(note.content).toBe('kept');
  });
});
