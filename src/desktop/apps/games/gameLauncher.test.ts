import { describe, it, expect } from 'vitest';
import { APPS, findApp } from '../registry';
import { GAME_IDS, GAME_LAUNCHER_ITEMS } from './gameLauncher';

describe('game launcher ↔ registry sync', () => {
  it('registers every launcher game id in APPS', () => {
    for (const id of GAME_IDS) {
      const app = findApp(id);
      expect(app, `missing registry app for game id "${id}"`).toBeDefined();
      expect(app!.id).toBe(id);
    }
  });

  it('lists every standalone game app in GAME_IDS', () => {
    const gameIds = new Set<string>(GAME_IDS);
    const standaloneGames = APPS.filter(
      (app) => app.desktopIcon === false && app.iconKey === 'games',
    );
    for (const app of standaloneGames) {
      expect(gameIds.has(app.id), `game "${app.id}" missing from GAME_IDS`).toBe(true);
    }
  });

  it('derives GAME_IDS from launcher items', () => {
    expect(GAME_IDS).toEqual(GAME_LAUNCHER_ITEMS.map((item) => item.id));
  });
});
