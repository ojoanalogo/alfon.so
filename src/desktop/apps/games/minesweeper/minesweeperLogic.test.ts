import { describe, it, expect } from 'vitest';
import { COLS, MINES, ROWS, createBoard, isWon, revealCell, toggleFlag } from './minesweeperLogic';

describe('minesweeperLogic', () => {
  it('creates a board with the expected mine count away from the first click', () => {
    const board = createBoard(4, 4, () => 0.99);
    let mines = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.mine) mines++;
      }
    }
    expect(mines).toBe(MINES);
    expect(board[4][4].mine).toBe(false);
  });

  it('reveals a safe first click and never loses immediately', () => {
    const result = revealCell(null, 0, 0, () => 0.5);
    expect(result.lost).toBe(false);
    expect(result.board).toBeTruthy();
    expect(result.board![0][0].state).toBe('revealed');
  });

  it('toggles flags on hidden cells', () => {
    const board = createBoard(0, 0, () => 0.1);
    const flagged = toggleFlag(board, 0, 1);
    expect(flagged[0][1].state).toBe('flagged');
    const unflagged = toggleFlag(flagged, 0, 1);
    expect(unflagged[0][1].state).toBe('hidden');
  });

  it('detects a win when every non-mine cell is revealed', () => {
    const board = createBoard(0, 0, () => 0.1);
    const cleared = board.map((row) =>
      row.map((cell) => ({
        ...cell,
        state: cell.mine ? ('hidden' as const) : ('revealed' as const),
      })),
    );
    expect(isWon(cleared)).toBe(true);
    expect(ROWS).toBeGreaterThan(0);
    expect(COLS).toBeGreaterThan(0);
  });
});
