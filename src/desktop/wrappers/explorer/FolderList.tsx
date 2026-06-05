import type { ListItem } from './types';
import { fakeFileSize } from './fakeFileSize';
import ListItemIcon from './ListItemIcon';

interface FolderListProps {
  items: ListItem[];
  onOpen?: (id: string) => void;
  className?: string;
  showHeader?: boolean;
}

function FolderListHeader() {
  return (
    <li
      className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto_auto] gap-2 border-b border-[color:var(--color-hairline)] bg-[rgb(229_231_235/0.35)] px-2 py-1 text-[0.5625rem] font-semibold tracking-[0.04em] text-muted uppercase max-sm:hidden dark:bg-[rgb(24_24_27/0.55)]"
      aria-hidden="true"
    >
      <span />
      <span>Nombre</span>
      <span>Tipo</span>
      <span>Tamaño</span>
    </li>
  );
}

function FolderListRow({ item, onOpen }: { item: ListItem; onOpen?: (id: string) => void }) {
  const size = item.size ?? (item.isFolder ? '—' : fakeFileSize(item.id));
  const content = (
    <>
      <span className="flex items-center justify-center leading-none" aria-hidden="true">
        <ListItemIcon item={item} size={16} imgClassName="h-4 w-4 [image-rendering:pixelated]" />
      </span>
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-primary">
        {item.label}
      </span>
      <span className="whitespace-nowrap text-muted max-sm:hidden">{item.kind ?? '—'}</span>
      <span className="min-w-[3.5rem] text-right whitespace-nowrap text-muted tabular-nums max-sm:hidden">
        {size ?? '—'}
      </span>
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
    // role="list" is intentional: WebKit drops list semantics when list-style is
    // removed, so VoiceOver wouldn't announce this as a list without it.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <ul
      className={['folder-list m-0 list-none p-0 text-[0.6875rem]', className]
        .filter(Boolean)
        .join(' ')}
      role="list"
    >
      {showHeader && <FolderListHeader />}
      {items.map((item) => (
        <li key={item.id}>
          <FolderListRow item={item} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
