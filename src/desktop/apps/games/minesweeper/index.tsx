import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const MinesweeperGame = lazy(() => import('./MinesweeperGame'));

export default gameApp({
  id: 'minesweeper',
  title: 'minesweeper',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 420, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Minesweeper',
  bodyClassName: 'minesweeper-window__body',
  gameMeta: {
    launcherLabel: 'minesweeper.exe',
    graphic: '💣',
    hint: 'Minesweeper — clic para revelar, clic derecho para bandera',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <MinesweeperGame active={active} />
    </Suspense>
  ),
});
