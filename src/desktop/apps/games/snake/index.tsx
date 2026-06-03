import { lazy, Suspense } from 'react';
import { gameApp } from '../gameApp';
import AppLoading from '../../AppLoading';

const SnakeGame = lazy(() => import('./SnakeGame'));

export default gameApp({
  id: 'snake',
  title: 'snake',
  iconKey: 'games',
  geometry: { defaultX: 220, defaultY: 96, defaultWidth: 360, defaultHeight: 420, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Snake',
  bodyClassName: 'snake-window__body',
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <SnakeGame active={active} />
    </Suspense>
  ),
});
