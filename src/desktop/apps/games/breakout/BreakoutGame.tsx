import { useCallback, useEffect, useRef, useState } from 'react';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';
import GameShell from '../GameShell';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';

const WIDTH = 320;
const HEIGHT = 280;
const PADDLE_W = 56;
const PADDLE_H = 8;
const BALL = 7;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 36;
const BRICK_H = 12;
const BRICK_GAP = 4;
const BRICK_OFFSET_X = 8;
const BRICK_OFFSET_Y = 28;
const TICK_MS = 16;

const BRICK_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8'];

type GameState = {
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  bricks: boolean[][];
  score: number;
  won: boolean;
  gameOver: boolean;
};

function createBricks(): boolean[][] {
  return Array.from({ length: BRICK_ROWS }, () => Array.from({ length: BRICK_COLS }, () => true));
}

function initialState(): GameState {
  return {
    paddleX: WIDTH / 2 - PADDLE_W / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT - 40,
    ballVx: 2.2,
    ballVy: -2.6,
    bricks: createBricks(),
    score: 0,
    won: false,
    gameOver: false,
  };
}

function remainingBricks(bricks: boolean[][]) {
  return bricks.flat().filter(Boolean).length;
}

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  game.bricks.forEach((row, rowIndex) => {
    row.forEach((alive, colIndex) => {
      if (!alive) return;
      const x = BRICK_OFFSET_X + colIndex * (BRICK_W + BRICK_GAP);
      const y = BRICK_OFFSET_Y + rowIndex * (BRICK_H + BRICK_GAP);
      ctx.fillStyle = BRICK_COLORS[rowIndex % BRICK_COLORS.length];
      ctx.fillRect(x, y, BRICK_W, BRICK_H);
    });
  });

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(game.paddleX, HEIGHT - PADDLE_H - 10, PADDLE_W, PADDLE_H);

  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.arc(game.ballX, game.ballY, BALL / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`puntos: ${game.score}`, 8, 16);

  if (game.won || game.gameOver) {
    ctx.fillStyle = 'rgb(0 0 0 / 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.won ? '¡ganaste!' : 'game over', WIDTH / 2, HEIGHT / 2 - 8);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('espacio para reiniciar', WIDTH / 2, HEIGHT / 2 + 12);
    ctx.textAlign = 'left';
  }
}

function stepGame(prev: GameState, move: number): GameState {
  if (prev.gameOver || prev.won) return prev;

  const paddleX = Math.max(0, Math.min(WIDTH - PADDLE_W, prev.paddleX + move));
  let { ballX, ballY, ballVx, ballVy, score, bricks } = prev;

  ballX += ballVx;
  ballY += ballVy;

  if (ballX <= BALL / 2 || ballX >= WIDTH - BALL / 2) ballVx *= -1;
  if (ballY <= BALL / 2) ballVy *= -1;

  const paddleTop = HEIGHT - PADDLE_H - 10;
  if (
    ballVy > 0 &&
    ballY + BALL / 2 >= paddleTop &&
    ballY - BALL / 2 <= paddleTop + PADDLE_H &&
    ballX >= paddleX &&
    ballX <= paddleX + PADDLE_W
  ) {
    ballVy = -Math.abs(ballVy);
    ballY = paddleTop - BALL / 2;
    ballVx += (ballX - (paddleX + PADDLE_W / 2)) * 0.05;
  }

  bricks = bricks.map((row) => [...row]);
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (!bricks[row][col]) continue;
      const x = BRICK_OFFSET_X + col * (BRICK_W + BRICK_GAP);
      const y = BRICK_OFFSET_Y + row * (BRICK_H + BRICK_GAP);
      if (
        ballX + BALL / 2 >= x &&
        ballX - BALL / 2 <= x + BRICK_W &&
        ballY + BALL / 2 >= y &&
        ballY - BALL / 2 <= y + BRICK_H
      ) {
        bricks[row][col] = false;
        score += 10;
        ballVy *= -1;
      }
    }
  }

  if (ballY > HEIGHT) {
    return { ...prev, paddleX, gameOver: true };
  }

  const won = remainingBricks(bricks) === 0;
  return { paddleX, ballX, ballY, ballVx, ballVy, bricks, score, won, gameOver: false };
}

interface BreakoutGameProps {
  active: boolean;
}

export default function BreakoutGame({ active }: BreakoutGameProps) {
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
        if (game.gameOver || game.won) restart();
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
    [game.gameOver, game.won, restart],
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
      hint="← → / a d · rompe los bloques"
      score={`puntos: ${game.score}`}
      overlay={
        game.gameOver || game.won ? (
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <button type="button" className={WINDOW_ACTION_BTN} onClick={restart}>
              jugar de nuevo
            </button>
          </div>
        ) : null
      }
    >
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Breakout" />
    </GameShell>
  );
}
