import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  description: string;
  action?: ReactNode;
  /** Tighter layout for sidebars and narrow panels. */
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  icon,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'empty-state flex flex-col',
        compact
          ? 'items-start gap-2 px-2 py-3 text-left'
          : 'items-center justify-center gap-3 p-6 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && (
        <div className={compact ? 'text-muted' : 'text-muted [&_svg]:h-10 [&_svg]:w-10'}>
          {icon}
        </div>
      )}
      <p
        className={[
          'm-0 leading-relaxed text-muted',
          compact ? 'text-[0.6875rem]' : 'max-w-[16rem] text-[0.75rem]',
        ].join(' ')}
      >
        {description}
      </p>
      {action}
    </div>
  );
}
