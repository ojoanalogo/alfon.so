import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const MinesweeperGame = lazy(() => import('./MinesweeperGame'));

export default gameApp({
  id: 'minesweeper',
  title: 'minesweeper',
  iconKey: 'games',
  geometry: { defaultX: 240, defaultY: 100, defaultWidth: 360, defaultHeight: 420, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Minesweeper',
  bodyClassName: 'minesweeper-window__body',
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <MinesweeperGame active={active} />
    </Suspense>
  ),
});
