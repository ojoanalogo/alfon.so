import { useCallback, useEffect, useRef, useState } from 'react';
import { loadNotes, saveNotes } from './storage';
import type { Note } from './types';

function createEmptyNote(): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Nota sin título',
    content: '',
    updatedAt: now,
  };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  // Persist on change, but skip the mount run — the initial value came straight
  // from storage, so writing it back rewrites storage on every app open for no reason.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    saveNotes(notes);
  }, [notes]);

  const createNote = useCallback(() => {
    const note = createEmptyNote();
    setNotes((prev) => [note, ...prev]);
    return note.id;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const findNote = useCallback((id: string) => notes.find((note) => note.id === id), [notes]);

  return { notes, createNote, updateNote, deleteNote, findNote };
}
