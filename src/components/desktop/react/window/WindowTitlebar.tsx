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
      className="window-titlebar__drag cursor-grab select-none"
      onPointerDown={onMoveStart}
      onDoubleClick={onDoubleClick}
    >
      {titleContent ?? <span className="window-titlebar__title">{title}</span>}
    </div>
  );
}
