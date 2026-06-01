import { browserApp } from '@desktop/wrappers';

export default browserApp({
  id: 'startup',
  title: 'startup.sh',
  iconKey: 'startup',
  initialUrl: 'https://molecula.digital',
  hideTitle: true,
  geometry: { defaultX: 220, defaultY: 112, defaultWidth: 880, initialZ: 32 },
  desktopIcon: { label: 'startup.sh', tooltip: 'Mi startup de productos digitales' },
  taskbarTooltip: 'Molécula Digital',
});
