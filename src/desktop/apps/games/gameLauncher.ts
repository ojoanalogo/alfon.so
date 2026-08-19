import type { AppDefinition, GameMeta } from '@desktop/wrappers';
import type { ListItem } from '../../wrappers/explorer/types';

/** Canonical game load order (matches lazy chunks in loadGameApps). */
export const GAME_IDS = [
  'snake',
  'pong',
  'breakout',
  'plane',
  'minesweeper',
  'tetris',
  'asteroids',
] as const;

export type GameId = (typeof GAME_IDS)[number];

export function isGameApp(app: AppDefinition): app is AppDefinition & { gameMeta: GameMeta } {
  return Boolean(app.gameMeta);
}

export function gameLauncherItemsFromApps(apps: AppDefinition[]): ListItem[] {
  const byId = new Map(apps.filter(isGameApp).map((app) => [app.id, app]));
  return GAME_IDS.flatMap((id) => {
    const app = byId.get(id);
    if (!app) return [];
    return [
      {
        id: app.id,
        label: app.gameMeta.launcherLabel,
        kind: 'Juego' as const,
        graphic: app.gameMeta.graphic,
        title: app.gameMeta.hint,
      },
    ];
  });
}
