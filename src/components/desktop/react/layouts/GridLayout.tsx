import { useContext, createContext, useMemo, type ReactNode } from 'react';
import type { ListItem } from './types';
import {
  ICON_SIZE_PX,
  useGridSettings,
  type GridIconSize,
  type GridSpacing,
} from '../context/GridSettingsContext';

/**
 * Per-app override of the global GridSettings. Drilled through ExplorerLayout
 * so each app can pin its own icon size / spacing without touching user prefs.
 */
export interface GridOverrides {
  iconSize?: GridIconSize;
  spacing?: GridSpacing;
}

const GridOverridesContext = createContext<GridOverrides | null>(null);

export function GridOverridesProvider({
  overrides,
  children,
}: {
  overrides?: GridOverrides;
  children: ReactNode;
}) {
  const value = useMemo(() => overrides ?? null, [overrides]);
  return <GridOverridesContext.Provider value={value}>{children}</GridOverridesContext.Provider>;
}

const SPACING_GAP_PX: Record<GridSpacing, number> = {
  compact: 8,
  normal: 16,
  roomy: 24,
};

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
  const { id, label, iconSrc, graphic, title, disabled } = item;

  const graphicNode = (
    <span className="desktop-icon-grid__graphic" aria-hidden="true">
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          width={iconPx}
          height={iconPx}
          className="desktop-icon-grid__icon"
          loading="lazy"
          decoding="async"
        />
      ) : (
        graphic
      )}
    </span>
  );

  if (disabled) {
    return (
      <div
        className="desktop-icon-grid__cell desktop-icon-grid__cell--disabled"
        title={title ?? label}
        aria-label={label}
      >
        {graphicNode}
        <span className="desktop-icon-grid__label">{label}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="desktop-icon-grid__cell"
      onClick={() => onActivate(id)}
      title={title ?? label}
    >
      {graphicNode}
      <span className="desktop-icon-grid__label">{label}</span>
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
  const overrides = useContext(GridOverridesContext);

  const iconSize = overrides?.iconSize ?? settings.iconSize;
  const spacing = overrides?.spacing ?? settings.spacing;
  const iconPx = ICON_SIZE_PX[iconSize];
  const gap = SPACING_GAP_PX[spacing];

  return (
    <div className={['window-grid-layout', className].filter(Boolean).join(' ')}>
      {heading && <p className="window-grid-layout__heading">{heading}</p>}
      <div className="desktop-icon-grid" role="list" style={{ gap: `${gap}px` }}>
        {items.map((item) => (
          <GridCell key={item.id} item={item} iconPx={iconPx} onActivate={onActivate} />
        ))}
      </div>
      {children}
    </div>
  );
}
