import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotesEditor, { type NoteViewMode } from './NotesEditor';
import type { Note } from './types';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'Title',
    content: '# Heading\n\nbody',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function setup(
  props: Partial<React.ComponentProps<typeof NotesEditor>> & { mode?: NoteViewMode } = {},
) {
  const onModeChange = vi.fn();
  const onChange = vi.fn();
  const onDelete = vi.fn();
  const onCreate = vi.fn();
  const result = render(
    <NotesEditor
      note={'note' in props ? (props.note ?? null) : makeNote()}
      mode={props.mode ?? 'preview'}
      onModeChange={props.onModeChange ?? onModeChange}
      onChange={props.onChange ?? onChange}
      onDelete={props.onDelete ?? onDelete}
      onCreate={props.onCreate ?? onCreate}
    />,
  );
  return { ...result, onModeChange, onChange, onDelete, onCreate };
}

describe('NotesEditor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('empty state (no note)', () => {
    it('renders the empty prompt and create button instead of an editor', () => {
      const { container } = setup({ note: null });
      expect(
        screen.getByText(
          'Selecciona una nota o crea una nueva para empezar a escribir markdown.',
        ),
      ).toBeTruthy();
      expect(container.querySelector('.notes-editor__toolbar')).toBeNull();
      expect(container.querySelector('textarea')).toBeNull();
    });

    it('fires onCreate when the "Crear nota" button is clicked', () => {
      const { onCreate } = setup({ note: null });
      fireEvent.click(screen.getByText('Crear nota'));
      expect(onCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('preview mode', () => {
    it('renders the title heading and markdown-parsed content as HTML', () => {
      const { container } = setup({
        note: makeNote({ title: 'My Title', content: '# Hello\n\nworld' }),
        mode: 'preview',
      });
      expect(screen.getByText('My Title')).toBeTruthy();
      const article = container.querySelector('.notes-editor__preview article');
      expect(article).toBeTruthy();
      // marked turns "# Hello" into an <h1> and the paragraph into <p>
      expect(article?.querySelector('h1')?.textContent).toBe('Hello');
      expect(article?.innerHTML.includes('<p>world</p>')).toBe(true);
    });

    it('shows the "Sin título" fallback heading for a blank title', () => {
      setup({ note: makeNote({ title: '  ', content: 'x' }), mode: 'preview' });
      expect(screen.getByText('Sin título')).toBeTruthy();
    });

    it('shows an empty-content placeholder when content is blank', () => {
      const { container } = setup({
        note: makeNote({ content: '   ' }),
        mode: 'preview',
      });
      expect(screen.getByText('Sin contenido todavía.')).toBeTruthy();
      expect(container.querySelector('.notes-editor__preview article')).toBeNull();
    });

    it('renders an "Editar" toggle that requests edit mode', () => {
      const { onModeChange } = setup({ mode: 'preview' });
      fireEvent.click(screen.getByText('Editar'));
      expect(onModeChange).toHaveBeenCalledWith('edit');
    });
  });

  describe('edit mode', () => {
    it('renders title input and content textarea bound to the note', () => {
      const { container } = setup({
        note: makeNote({ title: 'Bound title', content: 'Bound content' }),
        mode: 'edit',
      });
      const title = container.querySelector('.notes-editor__title') as HTMLInputElement;
      const textarea = container.querySelector('.notes-editor__textarea') as HTMLTextAreaElement;
      expect(title.value).toBe('Bound title');
      expect(textarea.value).toBe('Bound content');
    });

    it('fires onChange with a title patch when the title input changes', () => {
      const { container, onChange } = setup({
        note: makeNote({ id: 'abc' }),
        mode: 'edit',
      });
      const title = container.querySelector('.notes-editor__title') as HTMLInputElement;
      fireEvent.change(title, { target: { value: 'New title' } });
      expect(onChange).toHaveBeenCalledWith('abc', { title: 'New title' });
    });

    it('fires onChange with a content patch when typing in the textarea', () => {
      const { container, onChange } = setup({
        note: makeNote({ id: 'abc' }),
        mode: 'edit',
      });
      const textarea = container.querySelector('.notes-editor__textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'typed body' } });
      expect(onChange).toHaveBeenCalledWith('abc', { content: 'typed body' });
    });

    it('renders a "Listo" toggle that requests preview mode', () => {
      const { onModeChange } = setup({ mode: 'edit' });
      fireEvent.click(screen.getByText('Listo'));
      expect(onModeChange).toHaveBeenCalledWith('preview');
    });
  });

  describe('delete flow', () => {
    it('does not show the confirm modal until "Eliminar" is clicked', () => {
      setup({ mode: 'preview' });
      expect(screen.queryByText('Eliminar nota')).toBeNull();
    });

    it('opens the confirm modal and fires onDelete with the note id on confirm', () => {
      const { onDelete } = setup({ note: makeNote({ id: 'del-1', title: 'Doomed' }), mode: 'preview' });
      // toolbar "Eliminar" button opens the modal
      fireEvent.click(screen.getByText('Eliminar'));
      expect(screen.getByText('Eliminar nota')).toBeTruthy();
      // confirm button inside the modal is also labelled "Eliminar"
      const confirmButtons = screen.getAllByText('Eliminar');
      // last "Eliminar" is the modal confirm action
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      expect(onDelete).toHaveBeenCalledWith('del-1');
    });

    it('closes the modal without deleting when cancelled', () => {
      const { onDelete } = setup({ mode: 'preview' });
      fireEvent.click(screen.getByText('Eliminar'));
      expect(screen.getByText('Eliminar nota')).toBeTruthy();
      fireEvent.click(screen.getByText('Cancelar'));
      expect(screen.queryByText('Eliminar nota')).toBeNull();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
