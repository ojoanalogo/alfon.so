import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
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

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#27272a';
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
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(game.food.x * CELL + 2, game.food.y * CELL + 2, CELL - 4, CELL - 4);
  }

  game.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#22c55e' : '#16a34a';
    ctx.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
  });

  if (game.gameOver || game.won) {
    ctx.fillStyle = 'rgb(0 0 0 / 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fafafa';
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
  // `game.direction` is the last applied move; `pendingRef` queues the input the
  // next tick will apply. `lastMovedRef` lets the key handler reject reversals
  // against the last move without re-binding the listener every tick.
  const pendingRef = useRef(game.direction);
  const lastMovedRef = useRef(game.direction);

  useEffect(() => {
    lastMovedRef.current = game.direction;
  }, [game.direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, game);
  }, [game]);

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
      // Reject only a direct reversal of the last move; stepGame guards the rest.
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

  useGameLoop(active, tick, TICK_MS);

  return (
    <GameShell
      hint="flechas / wasd · espacio reinicia"
      score={`puntos: ${game.score}`}
      overlay={<GameOverOverlay show={game.gameOver || game.won} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} aria-label="Snake" />
    </GameShell>
  );
}
