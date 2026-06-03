import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const NotesApp = lazy(() => import('./NotesApp'));

export default defineApp({
  id: 'notes',
  title: 'notas',
  iconKey: 'notes',
  geometry: { defaultX: 230, defaultY: 80, defaultWidth: 840, defaultHeight: 440, initialZ: 14 },
  desktopIcon: { label: 'notes', tooltip: 'Notas' },
  taskbarTooltip: 'Notas',
  bodyClassName: 'notes-window__body',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <NotesApp />
    </Suspense>
  ),
});
