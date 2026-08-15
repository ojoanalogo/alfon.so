import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const HappyContent = lazy(() => import('./HappyContent'));

export default defineApp({
  id: 'happy',
  title: 'Easter egg',
  iconKey: 'video',
  geometry: { defaultX: 280, defaultY: 84, defaultWidth: 600, initialZ: 16 },
  desktopIcon: false,
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <HappyContent />
    </Suspense>
  ),
});
