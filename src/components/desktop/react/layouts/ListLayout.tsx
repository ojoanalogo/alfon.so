import type { ReactNode } from 'react';

interface ListLayoutProps {
  children: ReactNode;
  /** Optional section heading above the list. */
  heading?: string;
  className?: string;
  /** Spacing variant — compact for dense lists, relaxed for readable content. */
  density?: 'compact' | 'relaxed';
}

export default function ListLayout({
  children,
  heading,
  className,
  density = 'relaxed',
}: ListLayoutProps) {
  const listClass = density === 'compact' ? 'window-list-layout--compact' : 'window-list-layout--relaxed';

  return (
    <div className={['window-list-layout', className].filter(Boolean).join(' ')}>
      {heading && <p className="window-list-layout__heading">{heading}</p>}
      <ul className={['window-list-layout__list', listClass].join(' ')}>{children}</ul>
    </div>
  );
}
