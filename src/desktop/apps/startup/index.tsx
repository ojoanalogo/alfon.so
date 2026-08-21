import { browserApp } from '@desktop/wrappers';

export default browserApp({
  id: 'startup',
  title: 'startup.sh',
  iconKey: 'startup',
  initialUrl: 'https://molecula.digital',
  hideTitle: true,
  geometry: { defaultWidth: 880, initialZ: 32 },
  desktopIcon: { label: 'startup', tooltip: 'Mi startup de productos digitales' },
  taskbarTooltip: 'Molécula Digital',
});
