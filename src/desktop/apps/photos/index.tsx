import { browserApp } from '@desktop/wrappers';

export default browserApp({
  id: 'photos',
  title: 'photos.jpg',
  iconKey: 'photos',
  initialUrl: 'https://ojoanalogo.com',
  hideTitle: true,
  geometry: { defaultWidth: 880, initialZ: 31 },
  desktopIcon: { label: 'fotos', tooltip: 'Mi vida en fotos' },
  taskbarTooltip: 'Mi vida en fotos',
});
