import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import NotesApp from './NotesApp';
import type { Note } from './types';

const STORAGE_KEY = 'devfolio:notes';

function seed(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'Seed note',
    content: 'seed content',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('NotesApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the sidebar and the editor empty state when nothing is selected', () => {
    const { container } = render(<NotesApp />);
    expect(container.querySelector('.notes-sidebar')).toBeTruthy();
    // no active note -> editor shows the empty prompt
    expect(
      screen.getByText('Selecciona una nota o crea una nueva para empezar a escribir markdown.'),
    ).toBeTruthy();
  });

  it('hydrates persisted notes into the sidebar list', () => {
    seed([
      makeNote({ id: 'a', title: 'Persisted A' }),
      makeNote({ id: 'b', title: 'Persisted B' }),
    ]);
    render(<NotesApp />);
    expect(screen.getByText('Persisted A')).toBeTruthy();
    expect(screen.getByText('Persisted B')).toBeTruthy();
  });

  it('selecting a note shows it in the editor preview', () => {
    seed([makeNote({ id: 'a', title: 'Choose me', content: '# Selected\n\ntext' })]);
    render(<NotesApp />);
    fireEvent.click(screen.getByText('Choose me'));
    // preview heading (h1 inside the editor) shows the title
    const heading = document.querySelector('.notes-editor__preview h1');
    expect(heading?.textContent).toBe('Choose me');
  });

  it('creating a note adds it to the list, selects it, and opens edit mode', () => {
    const { container } = render(<NotesApp />);
    // "Nueva nota" is the sidebar create button
    fireEvent.click(screen.getByText('Nueva nota'));
    // editor switches to edit mode -> textarea is present
    const textarea = container.querySelector('.notes-editor__textarea');
    expect(textarea).toBeTruthy();
    // the new note appears in the sidebar list
    expect(container.querySelectorAll('.notes-sidebar__item')).toHaveLength(1);
  });

  it('typing in the new note title updates the sidebar entry and persists', () => {
    const { container } = render(<NotesApp />);
    fireEvent.click(screen.getByText('Nueva nota'));

    const title = container.querySelector('.notes-editor__title') as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'Fresh idea' } });

    // sidebar list reflects the new title
    expect(screen.getByText('Fresh idea')).toBeTruthy();
    // persisted to storage
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Note[];
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Fresh idea');
  });

  it('typing markdown content shows up in the rendered preview after switching modes', () => {
    const { container } = render(<NotesApp />);
    fireEvent.click(screen.getByText('Nueva nota'));

    const textarea = container.querySelector('.notes-editor__textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '# Big title\n\nsome **bold** body' } });

    // "Listo" switches edit -> preview
    fireEvent.click(screen.getByText('Listo'));

    const article = container.querySelector('.notes-editor__preview article');
    expect(article?.querySelector('h1')?.textContent).toBe('Big title');
    expect(article?.querySelector('strong')?.textContent).toBe('bold');
  });

  it('filters the sidebar by query matching title or content', () => {
    seed([
      makeNote({ id: 'a', title: 'Groceries', content: 'milk and eggs' }),
      makeNote({ id: 'b', title: 'Work', content: 'finish the report' }),
    ]);
    const { container } = render(<NotesApp />);

    const search = container.querySelector('input[type="search"]') as HTMLInputElement;

    // match by content of the second note
    fireEvent.change(search, { target: { value: 'report' } });
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.queryByText('Groceries')).toBeNull();

    // match by title of the first note
    fireEvent.change(search, { target: { value: 'groc' } });
    expect(screen.getByText('Groceries')).toBeTruthy();
    expect(screen.queryByText('Work')).toBeNull();

    // no matches -> empty state
    fireEvent.change(search, { target: { value: 'zzz-nothing' } });
    expect(screen.getByText('Sin notas aún.')).toBeTruthy();
  });

  it('deleting the active note removes it and returns the editor to its empty state', () => {
    seed([makeNote({ id: 'a', title: 'Delete me', content: 'bye' })]);
    render(<NotesApp />);

    fireEvent.click(screen.getByText('Delete me'));
    // toolbar delete opens the modal
    fireEvent.click(screen.getByText('Eliminar'));
    const eliminarButtons = screen.getAllByText('Eliminar');
    fireEvent.click(eliminarButtons[eliminarButtons.length - 1]);

    // note gone from sidebar + editor back to empty prompt
    expect(screen.queryByText('Delete me')).toBeNull();
    expect(
      screen.getByText('Selecciona una nota o crea una nueva para empezar a escribir markdown.'),
    ).toBeTruthy();
    // persisted empty
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([]);
  });

  it('creating a note clears an active search query', () => {
    seed([makeNote({ id: 'a', title: 'Existing', content: 'x' })]);
    const { container } = render(<NotesApp />);

    const search = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'nomatch' } });
    expect(screen.getByText('Sin notas aún.')).toBeTruthy();

    fireEvent.click(screen.getByText('Nueva nota'));
    // query reset to empty
    expect(search.value).toBe('');
    // both the new note and the previously-filtered one are now visible
    expect(container.querySelectorAll('.notes-sidebar__item')).toHaveLength(2);
  });
});
