import { useCallback, useEffect, useRef, useState } from 'react';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';
import GameShell from '../GameShell';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';

const WIDTH = 320;
const HEIGHT = 400;
const PLANE_W = 28;
const PLANE_H = 20;
const OBSTACLE_W = 36;
const OBSTACLE_H = 16;
const TICK_MS = 16;

type Obstacle = { x: number; y: number; w: number; h: number };

type GameState = {
  planeX: number;
  obstacles: Obstacle[];
  tick: number;
  score: number;
  gameOver: boolean;
};

function initialState(): GameState {
  return {
    planeX: WIDTH / 2 - PLANE_W / 2,
    obstacles: [],
    tick: 0,
    score: 0,
    gameOver: false,
  };
}

function spawnObstacle(): Obstacle {
  const w = OBSTACLE_W + Math.floor(Math.random() * 20);
  return {
    x: Math.random() * (WIDTH - w),
    y: -OBSTACLE_H,
    w,
    h: OBSTACLE_H,
  };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

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

function stepGame(prev: GameState, move: number): GameState {
  if (prev.gameOver) return prev;

  const planeX = Math.max(0, Math.min(WIDTH - PLANE_W, prev.planeX + move));
  const planeY = HEIGHT - PLANE_H - 16;
  const tick = prev.tick + 1;
  let obstacles = prev.obstacles
    .map((obstacle) => ({ ...obstacle, y: obstacle.y + 2.4 + tick * 0.002 }))
    .filter((obstacle) => obstacle.y < HEIGHT + OBSTACLE_H);

  if (tick % 55 === 0) {
    obstacles = [...obstacles, spawnObstacle()];
  }

  const hit = obstacles.some((obstacle) =>
    rectsOverlap(planeX, planeY, PLANE_W, PLANE_H, obstacle.x, obstacle.y, obstacle.w, obstacle.h),
  );

  if (hit) {
    return { ...prev, planeX, obstacles, tick, gameOver: true };
  }

  return {
    planeX,
    obstacles,
    tick,
    score: prev.score + 1,
    gameOver: false,
  };
}

interface PlaneGameProps {
  active: boolean;
}

export default function PlaneGame({ active }: PlaneGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(initialState);
  const moveRef = useRef(0);

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

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) {
      moveRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      moveRef.current = 0;
      return;
    }
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [active, handleKeyUp]);

  useGameControls(active, handleKeyDown);

  const tick = useCallback(() => {
    setGame((prev) => stepGame(prev, moveRef.current));
  }, []);

  useGameLoop(active, tick, TICK_MS);

  return (
    <GameShell
      hint="← → / a d · esquiva obstáculos"
      score={`puntos: ${game.score}`}
      overlay={
        game.gameOver ? (
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <button type="button" className={WINDOW_ACTION_BTN} onClick={restart}>
              jugar de nuevo
            </button>
          </div>
        ) : null
      }
    >
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Plane" />
    </GameShell>
  );
}
