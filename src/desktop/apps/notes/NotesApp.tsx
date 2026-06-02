import { useMemo, useState } from 'react';
import NotesSidebar from './NotesSidebar';
import NotesEditor, { type NoteViewMode } from './NotesEditor';
import { useNotes } from './useNotes';

export default function NotesApp() {
  const { notes, createNote, updateNote, deleteNote } = useNotes();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<NoteViewMode>('preview');
  const [query, setQuery] = useState('');

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const activeNote = activeId ? notes.find((note) => note.id === activeId) : undefined;

  function handleSelect(id: string) {
    setActiveId(id);
    setMode('preview');
  }

  function handleCreate() {
    const id = createNote();
    setActiveId(id);
    setMode('edit');
    setQuery('');
  }

  function handleDelete(id: string) {
    deleteNote(id);
    setActiveId((current) => (current === id ? null : current));
  }

  return (
    <div className="notes-app flex min-h-0 min-w-0 flex-1">
      <NotesSidebar
        notes={filteredNotes}
        activeId={activeId}
        query={query}
        onQueryChange={setQuery}
        onSelect={handleSelect}
        onCreate={handleCreate}
      />
      <NotesEditor
        key={activeId ?? 'empty'}
        note={activeNote ?? null}
        mode={mode}
        onModeChange={setMode}
        onChange={updateNote}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </div>
  );
}
