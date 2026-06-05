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
});
