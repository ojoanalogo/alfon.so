import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import { useAxisControls } from '../useAxisControls';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';

export const WIDTH = 320;
const HEIGHT = 240;
const PADDLE_W = 64;
const PADDLE_H = 10;
export const BALL = 8;
const TICK_MS = 16;

type GameState = {
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  score: number;
  gameOver: boolean;
};

export function initialState(): GameState {
  return {
    paddleX: WIDTH / 2 - PADDLE_W / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT / 2,
    ballVx: 2.4,
    ballVy: -2.8,
    score: 0,
    gameOver: false,
  };
}

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = '#3f3f46';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 2);
  ctx.lineTo(WIDTH, HEIGHT / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(game.paddleX, HEIGHT - PADDLE_H - 8, PADDLE_W, PADDLE_H);

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(game.ballX, game.ballY, BALL / 2, 0, Math.PI * 2);
  ctx.fill();

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

export function stepGame(prev: GameState, move: number): GameState {
  if (prev.gameOver) return prev;

  const paddleX = Math.max(0, Math.min(WIDTH - PADDLE_W, prev.paddleX + move));
  let { ballX, ballY, ballVx, ballVy, score } = prev;

  ballX += ballVx;
  ballY += ballVy;

  // Reflect off walls direction-deterministically and clamp back inside, so a
  // frame that overshoots the edge can't flip velocity every tick (sticky-wall jitter).
  if (ballX <= BALL / 2) {
    ballX = BALL / 2;
    ballVx = Math.abs(ballVx);
  } else if (ballX >= WIDTH - BALL / 2) {
    ballX = WIDTH - BALL / 2;
    ballVx = -Math.abs(ballVx);
  }
  if (ballY <= BALL / 2) {
    ballY = BALL / 2;
    ballVy = Math.abs(ballVy);
  }

  const paddleTop = HEIGHT - PADDLE_H - 8;
  if (
    ballVy > 0 &&
    ballY + BALL / 2 >= paddleTop &&
    ballY - BALL / 2 <= paddleTop + PADDLE_H &&
    ballX >= paddleX &&
    ballX <= paddleX + PADDLE_W
  ) {
    ballVy = -Math.abs(ballVy);
    ballY = paddleTop - BALL / 2;
    score += 1;
    ballVx += (ballX - (paddleX + PADDLE_W / 2)) * 0.04;
  }

  if (ballY > HEIGHT) {
    return { ...prev, paddleX, gameOver: true };
  }

  return { paddleX, ballX, ballY, ballVx, ballVy, score, gameOver: false };
}

interface PongGameProps {
  active: boolean;
}

export default function PongGame({ active }: PongGameProps) {
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
        moveRef.current = -6;
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        moveRef.current = 6;
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
      hint="← → / a d · rebota la pelota"
      score={`puntos: ${game.score}`}
      overlay={<GameOverOverlay show={game.gameOver} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Pong" />
    </GameShell>
  );
}
