import type { ReactNode } from 'react';
import { useExplorerView } from '../context/ExplorerViewContext';
import { useGridSettings } from '../context/GridSettingsContext';
import GridLayout, { GridOverridesProvider, type GridOverrides } from './GridLayout';
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
  /** Per-app grid overrides (icon size, spacing). */
  gridOverrides?: GridOverrides;
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
  gridOverrides,
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
        <GridOverridesProvider overrides={gridOverrides}>
          <GridLayout items={sorted} onActivate={handleActivate} />
        </GridOverridesProvider>
      ) : (
        <FolderList items={sorted} onOpen={handleActivate} showHeader />
      )}
      {children}
    </div>
  );
}
