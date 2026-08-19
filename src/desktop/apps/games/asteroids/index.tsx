import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const AsteroidsGame = lazy(() => import('./AsteroidsGame'));

export default gameApp({
  id: 'asteroids',
  title: 'asteroids',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 420, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Asteroids',
  bodyClassName: 'game-window__body',
  gameMeta: {
    launcherLabel: 'asteroids.exe',
    graphic: '☄️',
    hint: 'Asteroids — ← → girar, ↑ acelerar, espacio disparar',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <AsteroidsGame active={active} />
    </Suspense>
  ),
});
