import { describe, it, expect } from 'vitest';
import { findNoteByFileName, noteFileName } from './paths';
import type { Note } from './types';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    title: 'Mi nota',
    content: 'hola',
    updatedAt: '2026-06-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('noteFileName', () => {
  it('slugifies the title and adds .md', () => {
    expect(noteFileName(makeNote({ title: 'Hola Mundo' }), [])).toBe('hola-mundo.md');
  });

  it('disambiguates duplicate titles with a short id suffix', () => {
    const notes = [
      makeNote({ id: '11111111-1111-1111-1111-111111111111', title: 'Ideas' }),
      makeNote({ id: '22222222-2222-2222-2222-222222222222', title: 'Ideas' }),
    ];
    expect(noteFileName(notes[0], notes)).toBe('ideas.md');
    expect(noteFileName(notes[1], notes)).toBe('ideas-222222.md');
  });
});

describe('findNoteByFileName', () => {
  it('resolves notes/foo.md paths', () => {
    const note = makeNote({ title: 'Lista de compras' });
    expect(findNoteByFileName([note], 'notes/lista-de-compras.md')).toBe(note);
  });
});
