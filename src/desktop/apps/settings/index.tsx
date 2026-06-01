import { createElement } from 'react';
import { defineApp, type SettingsSection } from '@desktop/wrappers';
import SettingsBody from './SettingsBody';
import AppearanceSection from './AppearanceSection';
import GridSettingsSection from './GridSettingsSection';

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'apariencia', title: 'Apariencia', render: () => createElement(AppearanceSection) },
  { id: 'escritorio', title: 'Escritorio', render: () => createElement(GridSettingsSection) },
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
  desktopIcon: { label: 'ajustes', tooltip: 'Ajustes del escritorio' },
  taskbarTooltip: 'Ajustes',
  bodyClassName: 'card-body--settings',
  body: () => createElement(SettingsBody, { sections: SETTINGS_SECTIONS }),
});
