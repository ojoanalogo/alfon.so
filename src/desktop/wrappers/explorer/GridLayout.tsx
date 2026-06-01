import { type ReactNode } from 'react';
import type { ListItem } from './types';
import { ICON_SIZE_PX, useGridSettings, type GridSpacing } from '@desktop/state/GridSettingsContext';
import ListItemIcon from './ListItemIcon';

const SPACING_GAP_PX: Record<GridSpacing, number> = {
  compact: 8,
  normal: 16,
  roomy: 24,
};

const GRID_CELL =
  'flex flex-col items-center gap-1 rounded-[0.25rem] border border-transparent p-2 text-center font-[inherit] text-[color:inherit]';

interface GridLayoutProps {
  items: ListItem[];
  onActivate: (id: string) => void;
  /** Optional section heading above the grid. */
  heading?: string;
  className?: string;
  children?: ReactNode;
}

function GridCell({
  item,
  iconPx,
  onActivate,
}: {
  item: ListItem;
  iconPx: number;
  onActivate: (id: string) => void;
}) {
  const { id, label, title, disabled } = item;

  const graphicNode = (
    <span
      className="flex h-8 w-8 items-center justify-center text-[1.5rem] leading-none"
      aria-hidden="true"
    >
      <ListItemIcon item={item} size={iconPx} imgClassName="h-8 w-8 [image-rendering:pixelated]" />
    </span>
  );
  const label_ = <span className="w-full overflow-hidden text-[0.6rem] leading-[1.25] whitespace-nowrap text-ellipsis text-secondary">{label}</span>;

  if (disabled) {
    return (
      <div
        className={`${GRID_CELL} cursor-default opacity-55`}
        title={title ?? label}
        aria-label={label}
      >
        {graphicNode}
        {label_}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${GRID_CELL} cursor-pointer hover:border-[rgb(156_163_175/0.4)] hover:bg-[rgb(229_231_235/0.4)] dark:hover:bg-[rgb(107_114_128/0.1)]`}
      onClick={() => onActivate(id)}
      title={title ?? label}
    >
      {graphicNode}
      {label_}
    </button>
  );
}

export default function GridLayout({
  items,
  onActivate,
  heading,
  className,
  children,
}: GridLayoutProps) {
  const { settings } = useGridSettings();
  const iconPx = ICON_SIZE_PX[settings.iconSize];
  const gap = SPACING_GAP_PX[settings.spacing];

  return (
    <div className={className}>
      {heading && (
        <p className="mb-2 text-[0.6rem] tracking-[0.05em] uppercase text-muted">{heading}</p>
      )}
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))]"
        role="list"
        style={{ gap: `${gap}px` }}
      >
        {items.map((item) => (
          <GridCell key={item.id} item={item} iconPx={iconPx} onActivate={onActivate} />
        ))}
      </div>
      {children}
    </div>
  );
}
