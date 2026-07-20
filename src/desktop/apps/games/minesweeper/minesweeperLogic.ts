export const ROWS = 9;
export const COLS = 9;
export const MINES = 10;

export type CellState = 'hidden' | 'revealed' | 'flagged';

export type Cell = {
  mine: boolean;
  adjacent: number;
  state: CellState;
};

export type Board = Cell[][];

export type RevealResult = {
  board: Board;
  lost: boolean;
  won: boolean;
};

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function neighbors(row: number, col: number): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc)) coords.push([nr, nc]);
    }
  }
  return coords;
}

function countAdjacentMines(board: Board, row: number, col: number): number {
  return neighbors(row, col).reduce((count, [nr, nc]) => count + (board[nr][nc].mine ? 1 : 0), 0);
}

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      adjacent: 0,
      state: 'hidden' as CellState,
    })),
  );
}

function placeMines(board: Board, safeRow: number, safeCol: number, rng: () => number): Board {
  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  const forbidden = new Set(
    neighbors(safeRow, safeCol)
      .concat([[safeRow, safeCol]])
      .map(([row, col]) => `${row},${col}`),
  );

  const candidates: Array<[number, number]> = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!forbidden.has(`${row},${col}`)) candidates.push([row, col]);
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (let i = 0; i < MINES && i < candidates.length; i++) {
    const [row, col] = candidates[i];
    next[row][col].mine = true;
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      next[row][col].adjacent = countAdjacentMines(next, row, col);
    }
  }

  return next;
}

export function createBoard(
  safeRow: number,
  safeCol: number,
  rng: () => number = Math.random,
): Board {
  return placeMines(createEmptyBoard(), safeRow, safeCol, rng);
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function revealRecursive(board: Board, row: number, col: number): Board {
  const next = cloneBoard(board);
  const stack: Array<[number, number]> = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const cell = next[r][c];
    if (cell.state !== 'hidden') continue;
    cell.state = 'revealed';
    if (cell.adjacent === 0 && !cell.mine) {
      for (const [nr, nc] of neighbors(r, c)) {
        if (next[nr][nc].state === 'hidden') stack.push([nr, nc]);
      }
    }
  }

  return next;
}

export function isWon(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && cell.state !== 'revealed') return false;
    }
  }
  return true;
}

export function revealCell(
  board: Board | null,
  row: number,
  col: number,
  rng: () => number = Math.random,
): RevealResult {
  const active = board ?? createBoard(row, col, rng);
  const cell = active[row][col];
  if (cell.state === 'flagged' || cell.state === 'revealed') {
    return { board: active, lost: false, won: isWon(active) };
  }

  if (cell.mine) {
    const lostBoard = cloneBoard(active);
    lostBoard[row][col].state = 'revealed';
    for (const rowCells of lostBoard) {
      for (const mineCell of rowCells) {
        if (mineCell.mine) mineCell.state = 'revealed';
      }
    }
    return { board: lostBoard, lost: true, won: false };
  }

  const revealed = revealRecursive(active, row, col);
  return { board: revealed, lost: false, won: isWon(revealed) };
}

export function toggleFlag(board: Board, row: number, col: number): Board {
  const next = cloneBoard(board);
  const cell = next[row][col];
  if (cell.state === 'revealed') return next;
  cell.state = cell.state === 'flagged' ? 'hidden' : 'flagged';
  return next;
}

export function countFlags(board: Board): number {
  return board.reduce(
    (total, row) => total + row.filter((cell) => cell.state === 'flagged').length,
    0,
  );
}
