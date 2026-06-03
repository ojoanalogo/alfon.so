import type { ReactNode } from 'react';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';

/** Standard "jugar de nuevo" overlay shown over the stage when a game ends. */
export function GameOverOverlay({ show, onRestart }: { show: boolean; onRestart: () => void }) {
  if (!show) return null;
  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <button type="button" className={WINDOW_ACTION_BTN} onClick={onRestart}>
        jugar de nuevo
      </button>
    </div>
  );
}

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
