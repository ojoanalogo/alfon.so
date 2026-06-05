import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotesSidebar from './NotesSidebar';
import type { Note } from './types';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'My note',
    content: 'first line\nsecond line',
    updatedAt: '2026-01-01T08:30:00.000Z',
    ...overrides,
  };
}

function setup(props: Partial<React.ComponentProps<typeof NotesSidebar>> = {}) {
  const onQueryChange = vi.fn();
  const onSelect = vi.fn();
  const onCreate = vi.fn();
  const result = render(
    <NotesSidebar
      notes={props.notes ?? [makeNote()]}
      activeId={props.activeId ?? null}
      query={props.query ?? ''}
      onQueryChange={props.onQueryChange ?? onQueryChange}
      onSelect={props.onSelect ?? onSelect}
      onCreate={props.onCreate ?? onCreate}
    />,
  );
  return { ...result, onQueryChange, onSelect, onCreate };
}

describe('NotesSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the empty state when there are no notes', () => {
    const { container } = setup({ notes: [] });
    expect(screen.getByText('Sin notas aún.')).toBeTruthy();
    // no note item buttons rendered
    expect(container.querySelector('.notes-sidebar__item')).toBeNull();
  });

  it('lists each note with its title', () => {
    const notes = [makeNote({ id: 'a', title: 'Alpha' }), makeNote({ id: 'b', title: 'Beta' })];
    const { container } = setup({ notes });
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(container.querySelectorAll('.notes-sidebar__item')).toHaveLength(2);
  });

  it('falls back to "Sin título" for blank titles', () => {
    setup({ notes: [makeNote({ title: '   ' })] });
    expect(screen.getByText('Sin título')).toBeTruthy();
  });

  it('shows a preview of the first content line (truncated to 48 chars)', () => {
    const long = 'x'.repeat(80);
    setup({ notes: [makeNote({ content: `${long}\nignored` })] });
    expect(screen.getByText('x'.repeat(48))).toBeTruthy();
    // the 80-char string is not shown in full
    expect(screen.queryByText(long)).toBeNull();
  });

  it('omits the preview line when content is empty', () => {
    const { container } = setup({ notes: [makeNote({ content: '   ' })] });
    // Only the title and timestamp spans render — the preview span is dropped.
    // (Asserts the structure rather than the absence of arbitrary text.)
    const item = container.querySelector('.notes-sidebar__item') as HTMLElement;
    expect(item.querySelectorAll('span')).toHaveLength(2);
  });

  it('fires onSelect with the note id when an item is clicked', () => {
    const { onSelect } = setup({ notes: [makeNote({ id: 'pick-me', title: 'Pick' })] });
    fireEvent.click(screen.getByText('Pick'));
    expect(onSelect).toHaveBeenCalledWith('pick-me');
  });

  it('marks the active note with the highlight classes', () => {
    const notes = [makeNote({ id: 'a', title: 'Alpha' }), makeNote({ id: 'b', title: 'Beta' })];
    const { container } = setup({ notes, activeId: 'b' });
    const items = container.querySelectorAll('.notes-sidebar__item');
    expect(items[0].getAttribute('aria-current')).toBeNull();
    expect(items[1].getAttribute('aria-current')).toBe('true');
  });

  it('reflects the query prop in the search input', () => {
    const { container } = setup({ query: 'hello' });
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('fires onQueryChange when typing in the search box', () => {
    const { container, onQueryChange } = setup();
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'todo' } });
    expect(onQueryChange).toHaveBeenCalledWith('todo');
  });

  it('fires onCreate when the "Nueva nota" button is clicked', () => {
    const { onCreate } = setup();
    fireEvent.click(screen.getByText('Nueva nota'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('formats a same-day timestamp as a time and an older one as a date', () => {
    // sameDay path: build an ISO for "now" so the branch is deterministic.
    const now = new Date();
    const sameDayNote = makeNote({ id: 'today', title: 'Today', updatedAt: now.toISOString() });
    const olderNote = makeNote({
      id: 'old',
      title: 'Old',
      updatedAt: '2000-03-15T10:00:00.000Z',
    });
    const { container } = setup({ notes: [sameDayNote, olderNote] });
    const items = container.querySelectorAll('.notes-sidebar__item');

    // The timestamp is the last span in each item. Assert the discriminating
    // shape (time has H:MM, the date does not) rather than locale-pinned text.
    const timestampOf = (item: Element) => {
      const spans = item.querySelectorAll('span');
      return spans[spans.length - 1].textContent?.trim() ?? '';
    };

    expect(timestampOf(items[0])).toMatch(/\d{1,2}:\d{2}/);
    expect(timestampOf(items[1])).not.toMatch(/\d{1,2}:\d{2}/);
    expect(timestampOf(items[1]).length).toBeGreaterThan(0);
  });
});
