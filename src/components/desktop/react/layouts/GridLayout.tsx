import type { ReactNode } from 'react';

export interface GridLayoutItem {
  id: string;
  label: string;
  iconSrc?: string;
  /** Emoji or custom graphic when no iconSrc. */
  graphic?: ReactNode;
  title?: string;
  disabled?: boolean;
}

interface GridLayoutProps {
  items: GridLayoutItem[];
  onActivate: (id: string) => void;
  /** Optional section heading above the grid. */
  heading?: string;
  className?: string;
  children?: ReactNode;
}

function GridCell({
  item,
  onActivate,
}: {
  item: GridLayoutItem;
  onActivate: (id: string) => void;
}) {
  const { id, label, iconSrc, graphic, title, disabled } = item;

  const graphicNode = (
    <span className="desktop-icon-grid__graphic" aria-hidden="true">
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          width={32}
          height={32}
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
  return (
    <div className={['window-grid-layout', className].filter(Boolean).join(' ')}>
      {heading && <p className="window-grid-layout__heading">{heading}</p>}
      <div className="desktop-icon-grid" role="list">
        {items.map((item) => (
          <GridCell key={item.id} item={item} onActivate={onActivate} />
        ))}
      </div>
      {children}
    </div>
  );
}
