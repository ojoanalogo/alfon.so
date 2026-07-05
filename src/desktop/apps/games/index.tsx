import { explorerApp } from '@desktop/wrappers';
import { GAME_LAUNCHER_ITEMS } from './gameLauncher';

export default explorerApp({
  id: 'games',
  title: 'juegos/',
  iconKey: 'games',
  defaultMode: 'grid',
  items: () => [...GAME_LAUNCHER_ITEMS],
  onActivate: (id, ctx) => ctx.onOpenApp(id),
  geometry: { defaultX: 200, defaultY: 88, defaultWidth: 480, defaultHeight: 340, initialZ: 13 },
  desktopIcon: { label: 'games', tooltip: 'Juegos' },
  taskbarTooltip: 'Juegos',
});
