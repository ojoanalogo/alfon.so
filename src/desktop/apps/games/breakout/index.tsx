import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const BreakoutGame = lazy(() => import('./BreakoutGame'));

export default gameApp({
  id: 'breakout',
  title: 'breakout',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 400, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Breakout',
  bodyClassName: 'game-window__body',
  gameMeta: {
    launcherLabel: 'breakout.exe',
    graphic: '🧱',
    hint: 'Breakout — rompe todos los bloques',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <BreakoutGame active={active} />
    </Suspense>
  ),
});
