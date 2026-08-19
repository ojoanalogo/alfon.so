import { describe, it, expect } from 'vitest';
import { initialState, moveHorizontal, rotate, tickDown } from './tetrisLogic';

describe('tetrisLogic', () => {
  it('starts with an empty board and a piece', () => {
    const state = initialState();
    expect(state.board.every((row) => row.every((cell) => cell === 0))).toBe(true);
    expect(state.gameOver).toBe(false);
    expect(state.score).toBe(0);
  });

  it('moves the piece horizontally when space allows', () => {
    const state = initialState();
    const moved = moveHorizontal(state, 1);
    expect(moved.x).toBe(state.x + 1);
  });

  it('rotates the piece', () => {
    const state = initialState();
    const rotated = rotate(state);
    expect(rotated.rotation).toBe(state.rotation + 1);
  });

  it('locks the piece after repeated ticks', () => {
    let state = initialState();
    for (let i = 0; i < 25; i++) {
      state = tickDown(state);
    }
    expect(state.gameOver || state.y > 0 || state.score > 0).toBe(true);
  });
});
