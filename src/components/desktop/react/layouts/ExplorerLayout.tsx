import type { ReactNode } from 'react';
import { useExplorerView } from '../context/ExplorerViewContext';
import GridLayout, { type GridLayoutItem } from './GridLayout';
import FolderList, { type FolderEntry } from './FolderList';
import { fakeFileSize } from './fakeFileSize';

export interface ExplorerItem {
  id: string;
  label: string;
  kind: string;
  icon?: ReactNode;
  iconSrc?: string;
  graphic?: ReactNode;
  size?: string;
  disabled?: boolean;
  title?: string;
}

interface ExplorerLayoutProps {
  items: ExplorerItem[];
  onActivate: (id: string) => void;
  children?: ReactNode;
}

export default function ExplorerLayout({ items, onActivate, children }: ExplorerLayoutProps) {
  const { mode } = useExplorerView();

  const gridItems: GridLayoutItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    iconSrc: item.iconSrc,
    graphic: item.graphic ?? item.icon,
    title: item.title,
    disabled: item.disabled,
  }));

  const folderEntries: FolderEntry[] = items.map((item) => ({
    id: item.id,
    name: item.label,
    kind: item.kind,
    size: item.size ?? fakeFileSize(item.id, item.kind),
    icon: item.iconSrc ? (
      <img
        src={item.iconSrc}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
      />
    ) : (
      (item.graphic ?? item.icon)
    ),
    disabled: item.disabled,
  }));

  function handleActivate(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (item?.disabled) return;
    onActivate(id);
  }

  return (
    <div className="explorer-layout text-xs">
      {mode === 'grid' ? (
        <GridLayout items={gridItems} onActivate={handleActivate} />
      ) : (
        <FolderList entries={folderEntries} onOpen={handleActivate} showHeader />
      )}
      {children}
    </div>
  );
}
