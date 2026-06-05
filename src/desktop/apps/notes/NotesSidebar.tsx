import { FilePlus, FileText, Search, StickyNote } from 'lucide-react';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';
import EmptyState from '../../ui/EmptyState';
import type { Note } from './types';

const ICON = 'h-3.5 w-3.5 shrink-0';

interface NotesSidebarProps {
  notes: Note[];
  activeId: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function NotesSidebar({
  notes,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
}: NotesSidebarProps) {
  return (
    <aside className="notes-sidebar flex w-[11.5rem] shrink-0 flex-col border-r border-gray-300/50 dark:border-gray-700/50">
      <div className="flex flex-col gap-2 border-b border-gray-300/50 p-2 dark:border-gray-700/50">
        <div className="relative">
          <Search
            className={`${ICON} pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted`}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar…"
            className="w-full border border-[rgb(113_113_122/0.35)] bg-[rgb(255_255_255/0.35)] py-1 pr-2 pl-7 text-[0.6875rem] text-primary outline-none focus:border-[color:var(--color-highlight-border)] dark:bg-[rgb(0_0_0/0.2)]"
          />
        </div>
        <button
          type="button"
          className={`${WINDOW_ACTION_BTN} inline-flex items-center justify-center gap-1.5`}
          onClick={onCreate}
        >
          <FilePlus className={ICON} aria-hidden="true" />
          Nueva nota
        </button>
      </div>

      <ul className="notes-sidebar__list m-0 min-h-0 flex-1 list-none overflow-y-auto p-1">
        {notes.length === 0 ? (
          <li>
            <EmptyState
              compact
              icon={<StickyNote className={`${ICON} mt-0.5`} aria-hidden="true" />}
              description="Sin notas aún."
            />
          </li>
        ) : (
          notes.map((note) => {
            const active = note.id === activeId;
            const preview = note.content.trim().split('\n')[0]?.slice(0, 48);
            return (
              <li key={note.id}>
                <button
                  type="button"
                  className={[
                    'notes-sidebar__item w-full cursor-pointer border border-transparent px-2 py-1.5 text-left',
                    active &&
                      'border-[color:var(--color-highlight-border)] bg-[var(--color-highlight-bg)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onSelect(note.id)}
                >
                  <span className="flex items-center gap-1.5 truncate text-[0.6875rem] font-medium text-primary">
                    <FileText className={ICON} aria-hidden="true" />
                    {note.title.trim() || 'Sin título'}
                  </span>
                  {preview && (
                    <span className="mt-0.5 block truncate pl-5 text-[0.625rem] text-muted">
                      {preview}
                    </span>
                  )}
                  <span className="mt-0.5 block pl-5 text-[0.5625rem] text-muted">
                    {formatUpdatedAt(note.updatedAt)}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
