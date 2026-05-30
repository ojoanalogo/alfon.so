import type { ReactNode } from 'react';
import type { ListItem } from './types';
import { fakeFileSize } from './fakeFileSize';

interface FolderListProps {
  items: ListItem[];
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

function renderRowIcon(item: ListItem): ReactNode {
  if (item.iconSrc) {
    return (
      <img
        src={item.iconSrc}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return item.graphic ?? null;
}

function FolderListRow({
  item,
  onOpen,
}: {
  item: ListItem;
  onOpen?: (id: string) => void;
}) {
  const size = item.size ?? fakeFileSize(item.id, item.kind ?? '');
  const content = (
    <>
      <span className="folder-list__icon" aria-hidden="true">
        {renderRowIcon(item)}
      </span>
      <span className="folder-list__name">{item.label}</span>
      <span className="folder-list__kind">{item.kind ?? '—'}</span>
      <span className="folder-list__size">{size ?? '—'}</span>
    </>
  );

  if (item.disabled || !onOpen) {
    return <div className="folder-list__row folder-list__row--disabled">{content}</div>;
  }

  return (
    <button type="button" className="folder-list__row" onClick={() => onOpen(item.id)}>
      {content}
    </button>
  );
}

export default function FolderList({ items, onOpen, className, showHeader }: FolderListProps) {
  return (
    <ul className={['folder-list', className].filter(Boolean).join(' ')} role="list">
      {showHeader && <FolderListHeader />}
      {items.map((item) => (
        <li key={item.id}>
          <FolderListRow item={item} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
