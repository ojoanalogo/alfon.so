import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const PlaneGame = lazy(() => import('./PlaneGame'));

export default gameApp({
  id: 'plane',
  title: 'plane',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 480, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Plane',
  bodyClassName: 'game-window__body',
  gameMeta: {
    launcherLabel: 'plane.exe',
    graphic: '✈️',
    hint: 'Plane — esquiva obstáculos con ← → / A D',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <PlaneGame active={active} />
    </Suspense>
  ),
});
