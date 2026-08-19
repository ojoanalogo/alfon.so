import { lazy, Suspense } from 'react';
import { gameApp } from '@desktop/wrappers';
import AppLoading from '../../AppLoading';

const PongGame = lazy(() => import('./PongGame'));

export default gameApp({
  id: 'pong',
  title: 'pong',
  iconKey: 'games',
  geometry: { defaultWidth: 360, defaultHeight: 380, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Pong',
  bodyClassName: 'game-window__body',
  gameMeta: {
    launcherLabel: 'pong.exe',
    graphic: '🏓',
    hint: 'Pong — rebota la pelota con la paleta',
  },
  body: ({ active }) => (
    <Suspense fallback={<AppLoading />}>
      <PongGame active={active} />
    </Suspense>
  ),
});
