import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const TetrisGame = lazy(() => import('./TetrisGame'));

export default gameApp({
  id: 'tetris',
  title: 'tetris',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 480, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Tetris',
  bodyClassName: 'game-window__body',
  gameMeta: {
    launcherLabel: 'tetris.exe',
    graphic: '🧩',
    hint: 'Tetris — flechas o WASD, espacio para soltar',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <TetrisGame active={active} />
    </Suspense>
  ),
});
