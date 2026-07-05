import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const ContactContent = lazy(() => import('./ContactContent'));

export default defineApp({
  id: 'contacto',
  title: 'contacto — correo',
  iconKey: 'notes', // Reuses notes icon until a dedicated contact asset exists in DESKTOP_ICON_URLS.
  geometry: { defaultX: 180, defaultY: 72, defaultWidth: 640, defaultHeight: 420, initialZ: 13 },
  desktopIcon: { label: 'contacto', tooltip: 'Contacto' },
  taskbarTooltip: 'Contacto',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <ContactContent />
    </Suspense>
  ),
});
