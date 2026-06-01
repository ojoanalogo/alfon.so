import { browserApp } from '@desktop/wrappers';
import { BROWSER_APP_ID } from '../postWindow';

export default browserApp({
  id: BROWSER_APP_ID,
  title: 'web browser',
  iconKey: 'startup',
  initialUrl: null,
  geometry: { defaultX: 180, defaultY: 80, defaultWidth: 800, initialZ: 30 },
  taskbarTooltip: 'Navegador web',
});
