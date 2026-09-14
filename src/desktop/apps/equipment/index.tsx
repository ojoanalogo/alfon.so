import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const EquipmentContent = lazy(() => import('./EquipmentContent'));

export default defineApp({
  id: 'equipment',
  title: 'equipo',
  iconKey: 'equipment',
  geometry: { defaultWidth: 760, defaultHeight: 500, minWidth: 520, initialZ: 12 },
  desktopIcon: { label: 'equipo', tooltip: 'Mi equipo' },
  taskbarTooltip: 'Equipo',
  bodyClassName: 'card-body--equipment',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <EquipmentContent />
    </Suspense>
  ),
});
