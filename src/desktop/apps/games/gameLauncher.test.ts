import { describe, it, expect } from 'vitest';
import { loadGameApps } from './loadGameApps';
import { GAME_IDS, gameLauncherItemsFromApps, isGameApp } from './gameLauncher';

describe('game launcher ↔ registry sync', () => {
  it('registers every launcher game id with gameMeta', async () => {
    const games = await loadGameApps();
    const items = gameLauncherItemsFromApps(games);
    expect(items).toHaveLength(GAME_IDS.length);
    for (const id of GAME_IDS) {
      const app = games.find((candidate) => candidate.id === id);
      expect(app, `missing game app for id "${id}"`).toBeDefined();
      expect(isGameApp(app!)).toBe(true);
    }
  });

  it('derives launcher items from gameMeta in canonical order', async () => {
    const games = await loadGameApps();
    const items = gameLauncherItemsFromApps(games);
    expect(items.map((item) => item.id)).toEqual([...GAME_IDS]);
    expect(items[0]?.label).toMatch(/\.exe$/);
  });
});
