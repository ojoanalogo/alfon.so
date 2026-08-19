import { lazy, Suspense } from 'react';
import { defineApp } from '@desktop/wrappers';
import AppLoading from '../AppLoading';

const ContactContent = lazy(() => import('./ContactContent'));

export default defineApp({
  id: 'contacto',
  title: 'Nuevo mensaje',
  iconKey: 'contacto',
  geometry: { defaultWidth: 560, defaultHeight: 440, initialZ: 13 },
  desktopIcon: { label: 'contacto', tooltip: 'Contacto' },
  taskbarTooltip: 'Contacto',
  bodyClassName: 'mail-window__body',
  body: () => (
    <Suspense fallback={<AppLoading />}>
      <ContactContent />
    </Suspense>
  ),
});
