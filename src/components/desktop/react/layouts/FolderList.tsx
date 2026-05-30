import type { ReactNode } from 'react';

export interface FolderEntry {
  id: string;
  name: string;
  kind: string;
  size?: string;
  /** Emoji or short glyph for the row. */
  icon: ReactNode;
  disabled?: boolean;
}

interface FolderListProps {
  entries: FolderEntry[];
  onOpen?: (id: string) => void;
  className?: string;
  showHeader?: boolean;
}

function FolderListHeader() {
  return (
    <li className="folder-list__header" aria-hidden="true">
      <span />
      <span>Nombre</span>
      <span>Tipo</span>
      <span>Tamaño</span>
    </li>
  );
}

function FolderListRow({
  entry,
  onOpen,
}: {
  entry: FolderEntry;
  onOpen?: (id: string) => void;
}) {
  const content = (
    <>
      <span className="folder-list__icon" aria-hidden="true">
        {entry.icon}
      </span>
      <span className="folder-list__name">{entry.name}</span>
      <span className="folder-list__kind">{entry.kind}</span>
      <span className="folder-list__size">{entry.size ?? '—'}</span>
    </>
  );

  if (entry.disabled || !onOpen) {
    return <div className="folder-list__row folder-list__row--disabled">{content}</div>;
  }

  return (
    <button type="button" className="folder-list__row" onClick={() => onOpen(entry.id)}>
      {content}
    </button>
  );
}

export default function FolderList({ entries, onOpen, className, showHeader }: FolderListProps) {
  return (
    <ul className={['folder-list', className].filter(Boolean).join(' ')} role="list">
      {showHeader && <FolderListHeader />}
      {entries.map((entry) => (
        <li key={entry.id}>
          <FolderListRow entry={entry} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
