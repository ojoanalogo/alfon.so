import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import { readGamePalette, overlayRgba } from '../gamePalette';
import { useGameHighScore } from '../useGameHighScore';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';
import {
  CELL,
  COLS,
  ROWS,
  hardDrop,
  initialState,
  moveHorizontal,
  rotate,
  tickDown,
  tickMsForLines,
  cellAt,
  type GameState,
} from './tetrisLogic';

const CELL_COLORS = [
  '',
  '#38bdf8',
  '#facc15',
  '#c084fc',
  '#4ade80',
  '#f87171',
  '#60a5fa',
  '#fb923c',
];

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = readGamePalette();

  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = cellAt(game, col, row);
      if (!cell) continue;
      ctx.fillStyle = CELL_COLORS[cell] ?? palette.accentAlt;
      ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  ctx.strokeStyle = palette.grid;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(COLS * CELL, y * CELL);
    ctx.stroke();
  }

  if (game.gameOver) {
    ctx.fillStyle = overlayRgba();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('game over', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`puntuación: ${game.score}`, canvas.width / 2, canvas.height / 2 + 12);
    ctx.fillText('espacio para reiniciar', canvas.width / 2, canvas.height / 2 + 28);
  }
}

interface TetrisGameProps {
  active: boolean;
}

export default function TetrisGame({ active }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(initialState);
  const { best, reportScore } = useGameHighScore('tetris');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, game);
  }, [game]);

  useEffect(() => {
    if (game.gameOver) reportScore(game.score);
  }, [game.gameOver, game.score, reportScore]);

  const restart = useCallback(() => setGame(initialState()), []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.gameOver) restart();
        else setGame((prev) => hardDrop(prev));
        return true;
      }
      if (game.gameOver) return false;
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        setGame((prev) => moveHorizontal(prev, -1));
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        setGame((prev) => moveHorizontal(prev, 1));
        return true;
      }
      if (event.key === 'ArrowUp' || event.key === 'w') {
        setGame((prev) => rotate(prev));
        return true;
      }
      if (event.key === 'ArrowDown' || event.key === 's') {
        setGame((prev) => tickDown(prev));
        return true;
      }
      return false;
    },
    [game.gameOver, restart],
  );

  useGameControls(active, handleKeyDown);

  const tick = useCallback(() => {
    setGame((prev) => tickDown(prev));
  }, []);

  useGameLoop(active, tick, tickMsForLines(game.lines));

  return (
    <GameShell
      hint="← → mover · ↑ girar · ↓ bajar · espacio soltar"
      score={`puntos: ${game.score}`}
      bestScore={best}
      overlay={<GameOverOverlay show={game.gameOver} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} aria-label="Tetris" />
    </GameShell>
  );
}
