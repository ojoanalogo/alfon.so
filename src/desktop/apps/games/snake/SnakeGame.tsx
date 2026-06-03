import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';

const CELL = 16;
const COLS = 20;
const ROWS = 20;
const TICK_MS = 110;

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';

type GameState = {
  snake: Point[];
  direction: Direction;
  food: Point;
  score: number;
  gameOver: boolean;
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  let point: Point;
  do {
    point = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (occupied.has(`${point.x},${point.y}`));
  return point;
}

function initialState(): GameState {
  const snake: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  return {
    snake,
    direction: 'right',
    food: randomFood(snake),
    score: 0,
    gameOver: false,
  };
}

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

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(game.food.x * CELL + 2, game.food.y * CELL + 2, CELL - 4, CELL - 4);

  game.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#22c55e' : '#16a34a';
    ctx.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
  });

  if (game.gameOver) {
    ctx.fillStyle = 'rgb(0 0 0 / 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('game over', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`puntuación: ${game.score}`, canvas.width / 2, canvas.height / 2 + 12);
    ctx.fillText('espacio para reiniciar', canvas.width / 2, canvas.height / 2 + 28);
  }
}

function stepGame(prev: GameState, direction: Direction): GameState {
  if (prev.gameOver) return prev;

  const head = prev.snake[0];
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const nextHead = {
    x: head.x + delta[direction].x,
    y: head.y + delta[direction].y,
  };

  const hitWall = nextHead.x < 0 || nextHead.x >= COLS || nextHead.y < 0 || nextHead.y >= ROWS;
  const willEat = nextHead.x === prev.food.x && nextHead.y === prev.food.y;
  const body = willEat ? prev.snake : prev.snake.slice(0, -1);
  const hitSelf = body.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitWall || hitSelf) {
    return { ...prev, gameOver: true };
  }

  const nextSnake = [nextHead, ...prev.snake];
  if (!willEat) nextSnake.pop();

  return {
    snake: nextSnake,
    direction,
    food: willEat ? randomFood(nextSnake) : prev.food,
    score: willEat ? prev.score + 1 : prev.score,
    gameOver: false,
  };
}

interface SnakeGameProps {
  active: boolean;
}

export default function SnakeGame({ active }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(initialState);
  const directionRef = useRef(game.direction);

  useEffect(() => {
    directionRef.current = game.direction;
  }, [game.direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, game);
  }, [game]);

  const restart = useCallback(() => {
    const next = initialState();
    directionRef.current = next.direction;
    setGame(next);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.gameOver) restart();
        return true;
      }

      const next = KEY_TO_DIRECTION[event.key];
      if (!next) return false;
      if (game.gameOver) return true;
      if (OPPOSITE[next] === directionRef.current) return true;
      directionRef.current = next;
      setGame((prev) => ({ ...prev, direction: next }));
      return true;
    },
    [game.gameOver, restart],
  );

  useGameControls(active, handleKeyDown);

  const tick = useCallback(() => {
    setGame((prev) => stepGame(prev, directionRef.current));
  }, []);

  useGameLoop(active, tick, TICK_MS);

  return (
    <GameShell
      hint="flechas / wasd · espacio reinicia"
      score={`puntos: ${game.score}`}
      overlay={<GameOverOverlay show={game.gameOver} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} aria-label="Snake" />
    </GameShell>
  );
}
