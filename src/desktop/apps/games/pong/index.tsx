import { lazy, Suspense } from 'react';
import { gameApp } from '../gameApp';
import AppLoading from '../../AppLoading';

const PongGame = lazy(() => import('./PongGame'));

export default gameApp({
  id: 'pong',
  title: 'pong',
  iconKey: 'games',
  geometry: { defaultX: 240, defaultY: 100, defaultWidth: 360, defaultHeight: 380, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Pong',
  bodyClassName: 'snake-window__body',
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <PongGame active={active} />
    </Suspense>
  ),
});
