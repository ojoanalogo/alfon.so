import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const SnakeGame = lazy(() => import('./SnakeGame'));

export default gameApp({
  id: 'snake',
  title: 'snake',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 420, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Snake',
  bodyClassName: 'game-window__body',
  gameMeta: {
    launcherLabel: 'snake.exe',
    graphic: '🐍',
    hint: 'Snake — flechas o WASD',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <SnakeGame active={active} />
    </Suspense>
  ),
});
