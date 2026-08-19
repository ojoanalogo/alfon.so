import { readStorageItem, STORAGE_KEYS, writeStorageItem } from '@/lib/storage';
import type { Note } from './types';

export function loadNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = readStorageItem(STORAGE_KEYS.notes);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNote);
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    writeStorageItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  } catch {
    /* private mode / quota */
  }
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.content === 'string' &&
    typeof note.updatedAt === 'string'
  );
}
