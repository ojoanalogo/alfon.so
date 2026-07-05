import type { ListItem } from '../../wrappers/explorer/types';

export const GAME_LAUNCHER_ITEMS = [
  {
    id: 'snake',
    label: 'snake.exe',
    kind: 'Juego',
    graphic: '🐍',
    title: 'Snake — flechas o WASD',
  },
  {
    id: 'pong',
    label: 'pong.exe',
    kind: 'Juego',
    graphic: '🏓',
    title: 'Pong — rebota la pelota con la paleta',
  },
  {
    id: 'breakout',
    label: 'breakout.exe',
    kind: 'Juego',
    graphic: '🧱',
    title: 'Breakout — rompe todos los bloques',
  },
  {
    id: 'plane',
    label: 'plane.exe',
    kind: 'Juego',
    graphic: '✈️',
    title: 'Plane — esquiva obstáculos con ← → / A D',
  },
  {
    id: 'minesweeper',
    label: 'minesweeper.exe',
    kind: 'Juego',
    graphic: '💣',
    title: 'Minesweeper — clic para revelar, clic derecho para bandera',
  },
] as const satisfies readonly ListItem[];

export const GAME_IDS = GAME_LAUNCHER_ITEMS.map((item) => item.id);
