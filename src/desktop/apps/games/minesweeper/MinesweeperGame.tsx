import { useCallback, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import {
  COLS,
  MINES,
  ROWS,
  countFlags,
  createBoard,
  revealCell,
  toggleFlag,
  type Board,
  type Cell,
} from './minesweeperLogic';

const NUMBER_COLORS = [
  '',
  'text-blue-600',
  'text-green-700',
  'text-red-600',
  'text-indigo-800',
  'text-amber-900',
  'text-cyan-800',
  'text-zinc-900',
  'text-zinc-600',
];

function cellLabel(cell: Cell): string {
  if (cell.state === 'flagged') return '🚩';
  if (cell.state === 'hidden') return '';
  if (cell.mine) return '💣';
  return cell.adjacent > 0 ? String(cell.adjacent) : '';
}

function cellClassName(cell: Cell, gameOver: boolean): string {
  const base =
    'mines-cell flex h-8 w-8 items-center justify-center text-[0.8125rem] font-bold leading-none select-none';

  if (cell.state === 'hidden') {
    return [base, 'mines-cell--hidden cursor-pointer'].join(' ');
  }

  if (cell.state === 'flagged') {
    return [base, 'mines-cell--hidden mines-cell--flagged cursor-pointer text-red-700'].join(' ');
  }

  if (cell.mine) {
    return [
      base,
      'mines-cell--revealed mines-cell--mine',
      gameOver ? 'bg-red-500 text-zinc-900' : 'bg-red-400 text-zinc-900',
    ].join(' ');
  }

  if (cell.adjacent === 0) {
    return [base, 'mines-cell--revealed mines-cell--empty cursor-default'].join(' ');
  }

  return [
    base,
    'mines-cell--revealed mines-cell--number cursor-default',
    NUMBER_COLORS[cell.adjacent],
  ].join(' ');
}

function statusFace(lost: boolean, won: boolean, playing: boolean): string {
  if (won) return '😎';
  if (lost) return '😵';
  if (playing) return '🙂';
  return '😊';
}

interface MinesweeperGameProps {
  active: boolean;
}

export default function MinesweeperGame({ active }: MinesweeperGameProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [lost, setLost] = useState(false);
  const [won, setWon] = useState(false);

  const restart = useCallback(() => {
    setBoard(null);
    setLost(false);
    setWon(false);
  }, []);

  function handleReveal(row: number, col: number) {
    if (!active || lost || won) return;
    const result = revealCell(board, row, col);
    setBoard(result.board);
    setLost(result.lost);
    setWon(result.won);
  }

  const flags = board ? countFlags(board) : 0;
  const minesLeft = Math.max(MINES - flags, 0);
  const playing = Boolean(board) && !lost && !won;

  return (
    <GameShell
      hint="clic izquierdo revelar · clic derecho bandera"
      overlay={<GameOverOverlay show={lost || won} onRestart={restart} />}
    >
      <div className="minesweeper flex h-full flex-col items-center justify-center gap-3 p-3">
        <div className="minesweeper__panel flex w-full max-w-[19.5rem] items-center justify-between gap-2 rounded border-2 border-zinc-500 bg-zinc-500 px-2 py-1.5 shadow-[inset_1px_1px_0_#9ca3af,inset_-1px_-1px_0_#374151]">
          <div
            className="minesweeper__counter min-w-[2.75rem] rounded bg-zinc-900 px-1.5 py-0.5 text-center font-[ui-monospace,monospace] text-sm font-bold tracking-wider text-red-500 shadow-[inset_1px_1px_2px_rgb(0_0_0/0.8)]"
            aria-label={`minas restantes: ${minesLeft}`}
          >
            {String(minesLeft).padStart(2, '0')}
          </div>

          <button
            type="button"
            className="minesweeper__face flex h-9 w-9 items-center justify-center rounded border-2 border-zinc-300 bg-zinc-400 text-lg shadow-[1px_1px_0_#f9fafb,inset_-1px_-1px_0_#6b7280] active:translate-y-px active:shadow-none"
            onClick={restart}
            aria-label="reiniciar"
          >
            {statusFace(lost, won, playing)}
          </button>

          <div
            className="minesweeper__counter min-w-[2.75rem] rounded bg-zinc-900 px-1.5 py-0.5 text-center font-[ui-monospace,monospace] text-sm font-bold tracking-wider text-red-500 shadow-[inset_1px_1px_2px_rgb(0_0_0/0.8)]"
            aria-hidden="true"
          >
            {won ? '00' : lost ? '!!' : '··'}
          </div>
        </div>

        <div
          className="minesweeper__board rounded border-[3px] border-zinc-500 bg-zinc-500 p-1.5 shadow-[inset_1px_1px_0_#9ca3af,inset_-1px_-1px_0_#374151]"
          style={{ gridTemplateColumns: `repeat(${COLS}, 2rem)` }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => {
              const cell = board?.[row][col] ?? {
                mine: false,
                adjacent: 0,
                state: 'hidden' as const,
              };
              const revealed = cell.state === 'revealed';
              const disabled = revealed || lost || won;

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  disabled={disabled}
                  className={cellClassName(cell, lost)}
                  onClick={() => handleReveal(row, col)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    if (!active || lost || won) return;
                    setBoard((current) => toggleFlag(current ?? createBoard(row, col), row, col));
                  }}
                  aria-label={`celda ${row + 1},${col + 1}`}
                >
                  {cellLabel(cell)}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </GameShell>
  );
}
