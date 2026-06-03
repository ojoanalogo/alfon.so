import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const TerminalApp = lazy(() => import('./TerminalApp'));

export default defineApp({
  id: 'terminal',
  title: 'terminal — guest@alfon.so',
  iconKey: 'terminal',
  geometry: { defaultX: 88, defaultY: 36, defaultWidth: 560, defaultHeight: 380, initialZ: 10 },
  desktopIcon: { label: 'terminal', tooltip: 'Terminal' },
  taskbarTooltip: 'Terminal',
  bodyClassName: 'terminal-window__body',
  body: (ctx, win) => (
    <Suspense fallback={<AppLoading />}>
      <TerminalApp posts={ctx.posts} focused={win?.focused ?? false} />
    </Suspense>
  ),
});
