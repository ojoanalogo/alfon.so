import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const CvContent = lazy(() => import('./CvContent'));

export default defineApp({
  id: 'cv',
  title: 'mi_cv_final_FINAL_v7.doc',
  iconKey: 'cv',
  geometry: { defaultX: 160, defaultY: 56, defaultWidth: 520, defaultHeight: 480, initialZ: 12 },
  desktopIcon: { label: 'cv', tooltip: 'Currículum' },
  taskbarTooltip: 'CV',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <CvContent />
    </Suspense>
  ),
});
