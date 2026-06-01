import type { ReactNode } from 'react';
import { useExplorerView } from './ExplorerViewContext';
import { useGridSettings } from '@desktop/state/GridSettingsContext';
import GridLayout from './GridLayout';
import FolderList from './FolderList';
import type { ListItem } from './types';

/**
 * Back-compat alias — ExplorerItem was renamed to ListItem.
 * Prefer importing ListItem directly from `./types` in new code.
 */
export type ExplorerItem = ListItem;

interface ExplorerLayoutProps {
  items: ListItem[];
  onActivate: (id: string) => void;
  children?: ReactNode;
}

function sortItems(items: ListItem[], sortBy: 'name' | 'kind'): ListItem[] {
  if (sortBy === 'kind') {
    return [...items].sort((a, b) =>
      (a.kind ?? '').localeCompare(b.kind ?? '') || a.label.localeCompare(b.label),
    );
  }
  // Default 'name': preserve insertion order for already-curated lists.
  return items;
}

export default function ExplorerLayout({
  items,
  onActivate,
  children,
}: ExplorerLayoutProps) {
  const { mode } = useExplorerView();
  const { settings } = useGridSettings();

  const sorted = sortItems(items, settings.sortBy);

  function handleActivate(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (item?.disabled) return;
    onActivate(id);
  }

  return (
    <div className="explorer-layout text-xs">
      {mode === 'grid' ? (
        <GridLayout items={sorted} onActivate={handleActivate} />
      ) : (
        <FolderList items={sorted} onOpen={handleActivate} showHeader />
      )}
      {children}
    </div>
  );
}
