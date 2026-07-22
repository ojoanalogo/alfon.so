import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MinesweeperGame from './MinesweeperGame';
import { COLS, ROWS } from './minesweeperLogic';

function cellButton(row: number, col: number): HTMLElement {
  return screen.getByRole('button', { name: `celda ${row + 1},${col + 1}` });
}

describe('MinesweeperGame', () => {
  it('renders the full board of hidden cells', () => {
    render(<MinesweeperGame active={true} />);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        expect(cellButton(row, col)).toBeTruthy();
      }
    }
    expect(screen.queryByRole('button', { name: /jugar de nuevo/i })).toBeNull();
  });

  it('ignores a flag attempt before the first reveal (board is born on reveal)', () => {
    render(<MinesweeperGame active={true} />);

    fireEvent.contextMenu(cellButton(0, 0));

    // No board yet → nothing flagged, every cell still actionable.
    expect(cellButton(0, 0).textContent).toBe('');
    expect(cellButton(0, 0).className).not.toContain('mines-cell--flagged');
  });

  it('never loses on the first reveal, even after a right-click came first', () => {
    // Regression: flagging first used to forge the mine-free zone around the
    // flagged cell, so the first real reveal elsewhere could hit a mine.
    render(<MinesweeperGame active={true} />);

    fireEvent.contextMenu(cellButton(0, 0));
    fireEvent.click(cellButton(4, 4));

    expect(cellButton(4, 4).className).toContain('mines-cell--revealed');
    // Not lost: no game-over overlay, no mine shown.
    expect(screen.queryByRole('button', { name: /jugar de nuevo/i })).toBeNull();
    expect(document.querySelector('.mines-cell--mine')).toBeNull();
  });

  it('flags and unflags a hidden cell once the game has started', () => {
    render(<MinesweeperGame active={true} />);

    fireEvent.click(cellButton(4, 4)); // start the game
    // The flood fill may reveal any cell — pick one that is still hidden.
    const hidden = screen
      .getAllByRole('button', { name: /^celda / })
      .find((el) => el.className.includes('mines-cell--hidden'));
    expect(hidden).toBeTruthy();

    fireEvent.contextMenu(hidden!);
    expect(hidden!.className).toContain('mines-cell--flagged');

    fireEvent.contextMenu(hidden!);
    expect(hidden!.className).not.toContain('mines-cell--flagged');
  });

  it('does not respond to input while inactive', () => {
    render(<MinesweeperGame active={false} />);

    fireEvent.click(cellButton(4, 4));
    expect(cellButton(4, 4).className).not.toContain('mines-cell--revealed');
  });
});
