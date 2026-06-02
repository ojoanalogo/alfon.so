import type { ReactNode } from 'react';

interface GameShellProps {
  hint?: string;
  score?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
}

export default function GameShell({ hint, score, children, overlay }: GameShellProps) {
  return (
    <div className="game-shell flex min-h-0 min-w-0 flex-1 flex-col">
      {(hint || score != null) && (
        <div className="game-shell__hud flex shrink-0 items-center justify-between gap-2 border-b border-gray-300/50 px-2 py-1 text-[0.6875rem] dark:border-gray-700/50">
          <span className="truncate text-muted">{hint}</span>
          {score != null && <span className="shrink-0 font-medium text-primary">{score}</span>}
        </div>
      )}
      <div className="game-shell__stage relative min-h-0 flex-1">
        {children}
        {overlay}
      </div>
    </div>
  );
}
