import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const HappyContent = lazy(() => import('./HappyContent'));

export default defineApp({
  id: 'happy',
  title: 'Easter egg',
  iconKey: 'video',
  geometry: { defaultWidth: 600, initialZ: 16 },
  desktopIcon: false,
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <HappyContent />
    </Suspense>
  ),
});
