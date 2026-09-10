import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const EquipmentContent = lazy(() => import('./EquipmentContent'));

export default defineApp({
  id: 'equipment',
  title: 'equipo',
  iconKey: 'equipment',
  geometry: { defaultWidth: 560, minWidth: 440, initialZ: 12 },
  desktopIcon: { label: 'equipo', tooltip: 'Mi equipo' },
  taskbarTooltip: 'Equipo',
  windowClassName: 'desktop-window--fit-content',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <EquipmentContent />
    </Suspense>
  ),
});
