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
  const listClass = density === 'compact' ? 'gap-2' : 'gap-4';

  return (
    <div className={className}>
      {heading && (
        <p className="mb-2 text-[0.6rem] tracking-[0.05em] uppercase text-muted">{heading}</p>
      )}
      <ul className={`m-0 flex list-none flex-col p-0 ${listClass}`}>{children}</ul>
    </div>
  );
}
