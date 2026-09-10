import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const EquipmentContent = lazy(() => import('./EquipmentContent'));

export default defineApp({
  id: 'equipment',
  title: 'equipo',
  iconKey: 'equipment',
  geometry: { defaultWidth: 560, defaultHeight: 480, initialZ: 12 },
  desktopIcon: { label: 'equipo', tooltip: 'Mi equipo' },
  taskbarTooltip: 'Equipo',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <EquipmentContent />
    </Suspense>
  ),
});
