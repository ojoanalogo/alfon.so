import { formatWindowTitle } from '@desktop/lib/formatWindowTitle';
import type { AppDefinition } from '@desktop/wrappers';
import type { WindowDef } from '../types';

const BASE_Z = 10;

/** Convert an app definition into window-manager metadata. Placement is resolved at runtime. */
export function appToWindowDef(app: AppDefinition, index = 0): WindowDef {
  const geometry = app.geometry;
  return {
    id: app.id,
    title: formatWindowTitle(typeof app.title === 'string' ? app.title : app.id),
    ...geometry,
    defaultX: 0,
    defaultY: 0,
    initialZ: geometry.initialZ ?? BASE_Z + index,
  };
}
