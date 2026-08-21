export const COLS = 10;
export const ROWS = 20;
export const CELL = 16;
export const BASE_TICK_MS = 520;

export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type GameState = {
  board: Cell[][];
  piece: PieceKind;
  rotation: number;
  x: number;
  y: number;
  score: number;
  lines: number;
  gameOver: boolean;
};

const SHAPES: Record<PieceKind, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  T: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
};

export const PIECE_COLORS: Record<PieceKind, Cell> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
};

const KINDS: PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as Cell));
}

function randomPiece(): PieceKind {
  return KINDS[Math.floor(Math.random() * KINDS.length)];
}

function shapeMatrix(piece: PieceKind, rotation: number): number[][] {
  const rotations = SHAPES[piece];
  return rotations[rotation % rotations.length];
}

function collides(
  board: Cell[][],
  piece: PieceKind,
  rotation: number,
  x: number,
  y: number,
): boolean {
  const matrix = shapeMatrix(piece, rotation);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (!matrix[row][col]) continue;
      const bx = x + col;
      const by = y + row;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

function spawnPiece(): Pick<GameState, 'piece' | 'rotation' | 'x' | 'y'> {
  const piece = randomPiece();
  return { piece, rotation: 0, x: 3, y: 0 };
}

export function initialState(): GameState {
  return {
    board: emptyBoard(),
    ...spawnPiece(),
    score: 0,
    lines: 0,
    gameOver: false,
  };
}

function lockPiece(state: GameState): GameState {
  const matrix = shapeMatrix(state.piece, state.rotation);
  const board = state.board.map((row) => [...row]);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (!matrix[row][col]) continue;
      const by = state.y + row;
      const bx = state.x + col;
      if (by >= 0) {
        board[by][bx] = PIECE_COLORS[state.piece];
      }
    }
  }

  const cleared = board.filter((row) => row.some((cell) => cell === 0));
  const linesCleared = ROWS - cleared.length;
  while (cleared.length < ROWS) {
    cleared.unshift(Array.from({ length: COLS }, () => 0 as Cell));
  }

  const nextSpawn = spawnPiece();
  const next: GameState = {
    board: cleared,
    ...nextSpawn,
    score: state.score + [0, 100, 300, 500, 800][linesCleared],
    lines: state.lines + linesCleared,
    gameOver: false,
  };

  if (collides(next.board, next.piece, next.rotation, next.x, next.y)) {
    return { ...next, gameOver: true };
  }
  return next;
}

export function tickDown(state: GameState): GameState {
  if (state.gameOver) return state;
  const nextY = state.y + 1;
  if (!collides(state.board, state.piece, state.rotation, state.x, nextY)) {
    return { ...state, y: nextY };
  }
  return lockPiece(state);
}

export function moveHorizontal(state: GameState, delta: number): GameState {
  if (state.gameOver) return state;
  const nextX = state.x + delta;
  if (collides(state.board, state.piece, state.rotation, nextX, state.y)) return state;
  return { ...state, x: nextX };
}

export function rotate(state: GameState): GameState {
  if (state.gameOver) return state;
  const nextRotation = state.rotation + 1;
  if (!collides(state.board, state.piece, nextRotation, state.x, state.y)) {
    return { ...state, rotation: nextRotation };
  }
  return state;
}

export function hardDrop(state: GameState): GameState {
  if (state.gameOver) return state;
  let y = state.y;
  while (!collides(state.board, state.piece, state.rotation, state.x, y + 1)) {
    y += 1;
  }
  return lockPiece({ ...state, y });
}

export function tickMsForLines(lines: number): number {
  return Math.max(120, BASE_TICK_MS - lines * 24);
}

export function cellAt(state: GameState, col: number, row: number): Cell {
  const matrix = shapeMatrix(state.piece, state.rotation);
  for (let py = 0; py < 4; py++) {
    for (let px = 0; px < 4; px++) {
      if (!matrix[py][px]) continue;
      if (state.x + px === col && state.y + py === row) {
        return PIECE_COLORS[state.piece];
      }
    }
  }
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 0;
  return state.board[row][col];
}
