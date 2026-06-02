import type { ReactNode } from 'react';

interface WindowTitlebarProps {
  title: string;
  titleContent?: ReactNode;
  onMoveStart: (event: React.PointerEvent) => void;
  onDoubleClick: () => void;
}

export default function WindowTitlebar({
  title,
  titleContent,
  onMoveStart,
  onDoubleClick,
}: WindowTitlebarProps) {
  return (
    <div
      className="window-titlebar__drag flex min-w-0 flex-1 touch-none items-center gap-[0.375rem] px-[0.625rem] select-none"
      onPointerDown={onMoveStart}
      onDoubleClick={onDoubleClick}
    >
      {titleContent ?? (
        <span className="min-w-0 overflow-hidden text-[0.6875rem] leading-[1.2] text-ellipsis whitespace-nowrap text-muted max-sm:text-[0.625rem]">
          {title}
        </span>
      )}
    </div>
  );
}
