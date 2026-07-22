import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import { useAxisControls } from '../useAxisControls';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';
import {
  HEIGHT,
  PLANE_H,
  PLANE_W,
  TICK_MS,
  WIDTH,
  initialState,
  stepGame,
  type GameState,
} from './planeLogic';

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0c4a6e';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgb(255 255 255 / 0.08)';
  for (let i = 0; i < 6; i++) {
    const y = ((game.tick * 0.6 + i * 70) % (HEIGHT + 40)) - 20;
    ctx.fillRect(20 + i * 48, y, 24, 4);
  }

  game.obstacles.forEach((obstacle) => {
    ctx.fillStyle = '#71717a';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.fillStyle = '#a1a1aa';
    ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.w - 8, obstacle.h - 8);
  });

  const planeY = HEIGHT - PLANE_H - 16;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(game.planeX + PLANE_W / 2, planeY);
  ctx.lineTo(game.planeX, planeY + PLANE_H);
  ctx.lineTo(game.planeX + PLANE_W, planeY + PLANE_H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(game.planeX + PLANE_W / 2 - 3, planeY + 6, 6, 8);

  ctx.fillStyle = '#fafafa';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`puntos: ${game.score}`, 8, 16);

  if (game.gameOver) {
    ctx.fillStyle = 'rgb(0 0 0 / 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('game over', WIDTH / 2, HEIGHT / 2 - 8);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('espacio para reiniciar', WIDTH / 2, HEIGHT / 2 + 12);
    ctx.textAlign = 'left';
  }
}

interface PlaneGameProps {
  active: boolean;
}

export default function PlaneGame({ active }: PlaneGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(initialState);
  const moveRef = useRef(0);
  useAxisControls(active, moveRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, game);
  }, [game]);

  const restart = useCallback(() => {
    moveRef.current = 0;
    setGame(initialState());
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.gameOver) restart();
        return true;
      }
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        moveRef.current = -5;
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        moveRef.current = 5;
        return true;
      }
      return false;
    },
    [game.gameOver, restart],
  );

  useGameControls(active, handleKeyDown);

  const tick = useCallback(() => {
    setGame((prev) => stepGame(prev, moveRef.current));
  }, []);

  useGameLoop(active, tick, TICK_MS);

  return (
    <GameShell
      hint="← → / a d · esquiva obstáculos"
      score={`puntos: ${game.score}`}
      overlay={<GameOverOverlay show={game.gameOver} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Plane" />
    </GameShell>
  );
}
