import { describe, expect, it } from 'vitest';
import { BALL, WIDTH, initialState, stepGame } from './PongGame';

describe('pong stepGame', () => {
  it('clamps the ball inside the wall after reflecting (no sticky-wall jitter)', () => {
    const game = {
      ...initialState(),
      ballX: WIDTH - BALL / 2 + 1, // already past the right wall
      ballY: 120, // mid-court, clear of the paddle
      ballVx: 4, // still moving into the wall
      ballVy: -2,
    };

    const next = stepGame(game, 0);

    expect(next.ballX).toBe(WIDTH - BALL / 2);
    expect(next.ballVx).toBeLessThan(0);
  });

  it('reflects deterministically off the left wall', () => {
    const game = {
      ...initialState(),
      ballX: BALL / 2 - 1, // past the left wall
      ballY: 120,
      ballVx: -4,
      ballVy: -2,
    };

    const next = stepGame(game, 0);

    expect(next.ballX).toBe(BALL / 2);
    expect(next.ballVx).toBeGreaterThan(0);
  });

  it('caps ballVx at the paddle so long rallies cannot tunnel through it', () => {
    // Ball lands on the paddle's right edge (max positive kick) already near
    // the speed cap: unbounded growth would eventually skip over the paddle.
    // Positions account for the ball moving one step before collision checks.
    const paddleX = initialState().paddleX;
    const game = {
      ...initialState(),
      ballX: paddleX + 64 - 5.9, // post-step: right paddle edge (PADDLE_W = 64)
      ballY: 222 - BALL / 2 - 2, // post-step: touching paddleTop (222)
      ballVx: 5.9,
      ballVy: 2, // moving down onto the paddle
    };

    const next = stepGame(game, 0);

    expect(next.ballVy).toBeLessThan(0); // bounced
    expect(next.ballVx).toBeLessThanOrEqual(6);
    expect(next.score).toBe(1);
  });
});
