import { browserApp } from '@desktop/wrappers';

export default browserApp({
  id: 'photos',
  title: 'photos.jpg',
  iconKey: 'photos',
  initialUrl: 'https://ojoanalogo.com',
  hideTitle: true,
  geometry: { defaultX: 200, defaultY: 96, defaultWidth: 880, initialZ: 31 },
  desktopIcon: { label: 'photos.jpg', tooltip: 'Mi vida en fotos' },
  taskbarTooltip: 'Mi vida en fotos',
});
