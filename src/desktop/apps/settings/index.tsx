import { defineApp, type SettingsSection } from '@desktop/wrappers';
import SettingsBody from './SettingsBody';
import AppearanceSection from './AppearanceSection';

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'apariencia', title: 'Apariencia', render: () => <AppearanceSection /> },
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
