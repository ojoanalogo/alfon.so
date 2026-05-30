import type { ReactNode } from 'react';

export interface DesktopIconGridItemData {
  id: string;
  label: string;
  iconSrc?: string;
  /** Emoji or custom graphic when no iconSrc. */
  graphic?: ReactNode;
  title?: string;
  disabled?: boolean;
}

interface DesktopIconGridProps {
  items: DesktopIconGridItemData[];
  onActivate: (id: string) => void;
  className?: string;
}

interface DesktopIconGridItemProps {
  item: DesktopIconGridItemData;
  onActivate: (id: string) => void;
}

function DesktopIconGridItem({ item, onActivate }: DesktopIconGridItemProps) {
  const { id, label, iconSrc, graphic, title, disabled } = item;

  if (disabled) {
    return (
      <div
        className="desktop-icon-grid__cell desktop-icon-grid__cell--disabled"
        title={title ?? label}
        aria-label={label}
      >
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
      <span className="desktop-icon-grid__label">{label}</span>
    </button>
  );
}

export default function DesktopIconGrid({ items, onActivate, className }: DesktopIconGridProps) {
  return (
    <div className={['desktop-icon-grid', className].filter(Boolean).join(' ')} role="list">
      {items.map((item) => (
        <DesktopIconGridItem key={item.id} item={item} onActivate={onActivate} />
      ))}
    </div>
  );
}
