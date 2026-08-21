import { useCallback, useEffect, useRef, useState } from 'react';
import GameShell, { GameOverOverlay } from '../GameShell';
import { readGamePalette, overlayRgba } from '../gamePalette';
import { useGameHighScore } from '../useGameHighScore';
import { useAxisControls } from '../useAxisControls';
import { useGameControls } from '../useGameControls';
import { useGameLoop } from '../useGameLoop';
import {
  HEIGHT,
  SHIP_R,
  TICK_MS,
  WIDTH,
  initialState,
  stepGame,
  type GameState,
} from './asteroidsLogic';

function drawFrame(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = readGamePalette();

  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = palette.grid;
  ctx.strokeRect(0.5, 0.5, WIDTH - 1, HEIGHT - 1);

  game.asteroids.forEach((asteroid) => {
    ctx.strokeStyle = palette.textMuted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(asteroid.x, asteroid.y, asteroid.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = palette.warning;
  game.bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(game.shipX, game.shipY);
  ctx.rotate(game.angle);
  ctx.fillStyle = palette.accentAlt;
  ctx.beginPath();
  ctx.moveTo(SHIP_R + 2, 0);
  ctx.lineTo(-SHIP_R, SHIP_R * 0.7);
  ctx.lineTo(-SHIP_R * 0.4, 0);
  ctx.lineTo(-SHIP_R, -SHIP_R * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = palette.text;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`puntos: ${game.score}`, 8, 16);

  if (game.gameOver) {
    ctx.fillStyle = overlayRgba();
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('game over', WIDTH / 2, HEIGHT / 2 - 8);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('espacio para reiniciar', WIDTH / 2, HEIGHT / 2 + 12);
    ctx.textAlign = 'left';
  }
}

interface AsteroidsGameProps {
  active: boolean;
}

export default function AsteroidsGame({ active }: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(initialState);
  const rotateRef = useRef(0);
  const thrustRef = useRef(false);
  const fireRef = useRef(false);
  const { best, reportScore } = useGameHighScore('asteroids');
  useAxisControls(active, rotateRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawFrame(canvas, game);
  }, [game]);

  useEffect(() => {
    if (game.gameOver) reportScore(game.score);
  }, [game.gameOver, game.score, reportScore]);

  const restart = useCallback(() => {
    rotateRef.current = 0;
    thrustRef.current = false;
    fireRef.current = false;
    setGame(initialState());
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (game.gameOver) restart();
        else fireRef.current = true;
        return true;
      }
      if (game.gameOver) return false;
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        rotateRef.current = -1;
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        rotateRef.current = 1;
        return true;
      }
      if (event.key === 'ArrowUp' || event.key === 'w') {
        thrustRef.current = true;
        return true;
      }
      return false;
    },
    [game.gameOver, restart],
  );

  useGameControls(active, handleKeyDown);

  const tick = useCallback(() => {
    setGame((prev) =>
      stepGame(prev, {
        rotate: rotateRef.current,
        thrust: thrustRef.current,
        fire: fireRef.current,
      }),
    );
    thrustRef.current = false;
    fireRef.current = false;
  }, []);

  useGameLoop(active, tick, TICK_MS);

  return (
    <GameShell
      hint="← → girar · ↑ acelerar · espacio disparar"
      score={`puntos: ${game.score}`}
      bestScore={best}
      overlay={<GameOverOverlay show={game.gameOver} onRestart={restart} />}
    >
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Asteroids" />
    </GameShell>
  );
}
