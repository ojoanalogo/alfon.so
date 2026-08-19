import { explorerApp } from '@desktop/wrappers';
import { GAME_IDS, gameLauncherItemsFromApps } from './gameLauncher';

export default explorerApp({
  id: 'games',
  title: 'juegos/',
  iconKey: 'games',
  defaultMode: 'grid',
  items: (ctx) =>
    gameLauncherItemsFromApps(
      GAME_IDS.map((id) => ctx.findApp(id)).filter((app) => app !== undefined),
    ),
  onActivate: (id, ctx) => ctx.onOpenApp(id),
  geometry: { defaultWidth: 480, defaultHeight: 340, initialZ: 13 },
  desktopIcon: { label: 'juegos', tooltip: 'Juegos' },
  taskbarTooltip: 'Juegos',
});
