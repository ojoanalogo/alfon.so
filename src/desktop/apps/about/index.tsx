import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const AboutContent = lazy(() => import('./AboutContent'));

export default defineApp({
  id: 'about',
  title: 'about.html',
  iconKey: 'about',
  geometry: {
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 576,
    minWidth: 520,
    initialZ: 11,
    center: true,
    defaultOpen: true,
  },
  desktopIcon: { label: 'about', tooltip: 'Mi info' },
  taskbarTooltip: 'about.html',
  body: (ctx) => (
    <Suspense fallback={<AppLoading />}>
      <AboutContent posts={ctx.posts} onOpenPost={ctx.onOpenPost} />
    </Suspense>
  ),
});
