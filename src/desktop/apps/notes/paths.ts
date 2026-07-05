import type { Note } from './types';

function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'nota-sin-titulo';
}

/** Virtual filename for a note in `~/notes/` (used by the terminal). */
export function noteFileName(note: Note, allNotes: Note[]): string {
  const base = slugifyTitle(note.title);
  const sameTitle = allNotes.filter((entry) => slugifyTitle(entry.title) === base);
  if (sameTitle.length <= 1) return `${base}.md`;

  const canonical = [...sameTitle].sort(
    (a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.id.localeCompare(b.id),
  )[0];
  if (canonical.id === note.id) return `${base}.md`;
  return `${base}-${note.id.slice(0, 6)}.md`;
}

export function noteFileNames(notes: Note[]): string[] {
  return notes.map((note) => noteFileName(note, notes));
}

/** Resolve `notes/foo.md` (or `foo.md`) to a stored note. */
export function findNoteByFileName(notes: Note[], rawPath: string): Note | undefined {
  const normalized = rawPath.replace(/^notes\//, '').replace(/^~\//, '');
  return notes.find((note) => noteFileName(note, notes) === normalized);
}
