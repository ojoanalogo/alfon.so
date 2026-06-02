import { useMemo, useState } from 'react';
import { Check, FilePlus, Pencil, StickyNote, Trash2 } from 'lucide-react';
import { marked } from 'marked';
import { PROSE_CLASS_BASE } from '@/styles/proseConfig';
import { WINDOW_ACTION_BTN, WINDOW_ACTION_BTN_DESTRUCTIVE } from '@/styles/tokens';
import EmptyState from '../../ui/EmptyState';
import Modal from '../../ui/Modal';
import type { Note } from './types';

const ICON = 'h-3.5 w-3.5 shrink-0';

export type NoteViewMode = 'edit' | 'preview';

interface NotesEditorProps {
  note: Note | null;
  mode: NoteViewMode;
  onModeChange: (mode: NoteViewMode) => void;
  onChange: (id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

function displayTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || 'Sin título';
}

export default function NotesEditor({
  note,
  mode,
  onModeChange,
  onChange,
  onDelete,
  onCreate,
}: NotesEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const content = note?.content ?? '';
  const previewHtml = useMemo(() => {
    if (!content.trim()) return '';
    return marked.parse(content, { async: false }) as string;
  }, [content]);

  if (!note) {
    return (
      <EmptyState
        className="notes-editor notes-editor--empty min-h-0 flex-1"
        icon={<StickyNote aria-hidden="true" />}
        description="Selecciona una nota o crea una nueva para empezar a escribir markdown."
        action={
          <button
            type="button"
            className={`${WINDOW_ACTION_BTN} inline-flex items-center gap-1.5`}
            onClick={onCreate}
          >
            <FilePlus className={ICON} aria-hidden="true" />
            Crear nota
          </button>
        }
      />
    );
  }

  const editing = mode === 'edit';

  return (
    <div className="notes-editor flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="notes-editor__toolbar flex items-center gap-2 border-b border-gray-300/50 px-3 py-2 dark:border-gray-700/50">
        {editing ? (
          <button
            type="button"
            className={`${WINDOW_ACTION_BTN} inline-flex items-center gap-1.5 text-primary`}
            onClick={() => onModeChange('preview')}
          >
            <Check className={ICON} aria-hidden="true" />
            Listo
          </button>
        ) : (
          <button
            type="button"
            className={`${WINDOW_ACTION_BTN} inline-flex items-center gap-1.5`}
            onClick={() => onModeChange('edit')}
          >
            <Pencil className={ICON} aria-hidden="true" />
            Editar
          </button>
        )}
        <button
          type="button"
          className={`${WINDOW_ACTION_BTN_DESTRUCTIVE} ml-auto inline-flex items-center gap-1.5`}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className={ICON} aria-hidden="true" />
          Eliminar
        </button>
      </div>

      {editing ? (
        <>
          <input
            type="text"
            value={note.title}
            onChange={(event) => onChange(note.id, { title: event.target.value })}
            placeholder="Título"
            className="notes-editor__title w-full border-b border-gray-300/50 bg-transparent px-3 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-highlight-border)] dark:border-gray-700/50"
          />
          <textarea
            value={note.content}
            onChange={(event) => onChange(note.id, { content: event.target.value })}
            placeholder="Escribe markdown aquí…"
            className="notes-editor__textarea min-h-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-secondary outline-none"
            spellCheck
            autoFocus
          />
        </>
      ) : (
        <div className="notes-editor__preview min-h-0 flex-1 overflow-auto px-4 py-3">
          <h1 className="mb-4 text-lg font-semibold text-primary">{displayTitle(note.title)}</h1>
          {previewHtml ? (
            <article className={PROSE_CLASS_BASE} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <EmptyState compact description="Sin contenido todavía." />
          )}
        </div>
      )}

      {confirmDelete && (
        <Modal
          title="Eliminar nota"
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => onDelete(note.id)}
          onClose={() => setConfirmDelete(false)}
        >
          <p>¿Eliminar &ldquo;{displayTitle(note.title)}&rdquo;? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </div>
  );
}
