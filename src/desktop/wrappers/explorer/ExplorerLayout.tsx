import type { ReactNode } from 'react';
import { useExplorerView } from './ExplorerViewContext';
import GridLayout from './GridLayout';
import FolderList from './FolderList';
import type { ListItem } from './types';

interface ExplorerLayoutProps {
  items: ListItem[];
  onActivate: (id: string) => void;
  children?: ReactNode;
}

export default function ExplorerLayout({ items, onActivate, children }: ExplorerLayoutProps) {
  const { mode } = useExplorerView();

  function handleActivate(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (item?.disabled) return;
    onActivate(id);
  }

  // Items render in their curated insertion order (no client-side sorting).
  return (
    <div className="explorer-layout text-xs">
      {mode === 'grid' ? (
        <GridLayout items={items} onActivate={handleActivate} />
      ) : (
        <FolderList items={items} onOpen={handleActivate} showHeader />
      )}
      {children}
    </div>
  );
}
