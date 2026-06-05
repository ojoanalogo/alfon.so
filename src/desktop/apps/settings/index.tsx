import { lazy, Suspense } from 'react';
import { defineApp, type SettingsSection } from '@desktop/wrappers';
import SettingsBody from './SettingsBody';
import AppLoading from '../AppLoading';

// Split the appearance UI (color swatches, wallpaper grid, theme control) out of
// the initial island bundle; it loads when the settings window first opens.
const AppearanceSection = lazy(() => import('./AppearanceSection'));

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'apariencia',
    title: 'Apariencia',
    render: () => (
      <Suspense fallback={<AppLoading />}>
        <AppearanceSection />
      </Suspense>
    ),
  },
];

export default defineApp({
  id: 'settings',
  title: 'ajustes',
  iconKey: 'settings',
  geometry: {
    defaultX: 240,
    defaultY: 72,
    defaultWidth: 580,
    defaultHeight: 420,
    initialZ: 18,
  },
  desktopIcon: { label: 'settings', tooltip: 'Ajustes del escritorio' },
  taskbarTooltip: 'Ajustes',
  bodyClassName: 'card-body--settings',
  body: () => <SettingsBody sections={SETTINGS_SECTIONS} />,
});
