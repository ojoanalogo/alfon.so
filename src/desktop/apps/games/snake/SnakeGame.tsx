import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import { readGamePalette, overlayRgba } from '../gamePalette';
import { useGameHighScore } from '../useGameHighScore';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';
import {
  CELL,
  COLS,
  KEY_TO_DIRECTION,
  OPPOSITE,
  ROWS,
  TICK_MS,
  initialState,
  stepGame,
  type GameState,
} from './snakeLogic';

function tickMsForScore(score: number): number {
  return Math.max(55, TICK_MS - Math.floor(score / 3) * 10);
}

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = readGamePalette();

  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  if (game.food) {
    ctx.fillStyle = palette.danger;
    ctx.fillRect(game.food.x * CELL + 2, game.food.y * CELL + 2, CELL - 4, CELL - 4);
  }

  game.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? palette.accent : '#16a34a';
    ctx.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
  });

  if (game.gameOver || game.won) {
    ctx.fillStyle = overlayRgba();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.won ? '¡ganaste!' : 'game over', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`puntuación: ${game.score}`, canvas.width / 2, canvas.height / 2 + 12);
    ctx.fillText('espacio para reiniciar', canvas.width / 2, canvas.height / 2 + 28);
  }
}

interface SnakeGameProps {
  active: boolean;
}

export default function SnakeGame({ active }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(initialState);
  const pendingRef = useRef(game.direction);
  const lastMovedRef = useRef(game.direction);
  const { best, reportScore } = useGameHighScore('snake');

  useEffect(() => {
    lastMovedRef.current = game.direction;
  }, [game.direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, game);
  }, [game]);

  useEffect(() => {
    if (game.gameOver || game.won) reportScore(game.score);
  }, [game.gameOver, game.won, game.score, reportScore]);

  const restart = useCallback(() => {
    const next = initialState();
    pendingRef.current = next.direction;
    lastMovedRef.current = next.direction;
    setGame(next);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.gameOver || game.won) restart();
        return true;
      }

      const next = KEY_TO_DIRECTION[event.key];
      if (!next) return false;
      if (game.gameOver || game.won) return true;
      if (OPPOSITE[next] === lastMovedRef.current) return true;
      pendingRef.current = next;
      return true;
    },
    [game.gameOver, game.won, restart],
  );

  useGameControls(active, handleKeyDown);

  const tick = useCallback(() => {
    setGame((prev) => stepGame(prev, pendingRef.current));
  }, []);

  useGameLoop(active, tick, tickMsForScore(game.score));

  return (
    <GameShell
      hint="flechas / wasd · espacio reinicia"
      score={`puntos: ${game.score}`}
      bestScore={best}
      overlay={<GameOverOverlay show={game.gameOver || game.won} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} aria-label="Snake" />
    </GameShell>
  );
}
