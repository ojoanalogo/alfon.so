import { lazy, Suspense } from 'react';
import { gameApp } from '../gameApp';
import AppLoading from '../../AppLoading';

const BreakoutGame = lazy(() => import('./BreakoutGame'));

export default gameApp({
  id: 'breakout',
  title: 'breakout',
  iconKey: 'games',
  geometry: { defaultX: 260, defaultY: 88, defaultWidth: 360, defaultHeight: 400, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Breakout',
  bodyClassName: 'snake-window__body',
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <BreakoutGame active={active} />
    </Suspense>
  ),
});
