import type { AppDefinition } from '@desktop/wrappers';
import { GAME_IDS } from './gameLauncher';

const LOADERS: Record<(typeof GAME_IDS)[number], () => Promise<{ default: AppDefinition }>> = {
  snake: () => import('./snake'),
  pong: () => import('./pong'),
  breakout: () => import('./breakout'),
  plane: () => import('./plane'),
  minesweeper: () => import('./minesweeper'),
  tetris: () => import('./tetris'),
  asteroids: () => import('./asteroids'),
};

/** Lazy-loads each game app into its own chunk. */
export async function loadGameApps(): Promise<AppDefinition[]> {
  const modules = await Promise.all(GAME_IDS.map((id) => LOADERS[id]()));
  return modules.map((mod) => mod.default);
}
