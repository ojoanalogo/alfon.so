import type { AppDefinition } from '@desktop/wrappers';
import type { WindowDef } from '../types';

const BASE_Z = 10;

/** Convert an app definition into window-manager metadata. Placement is resolved at runtime. */
export function appToWindowDef(app: AppDefinition, index = 0): WindowDef {
  const geometry = app.geometry;
  return {
    id: app.id,
    ...geometry,
    initialZ: geometry.initialZ ?? BASE_Z + index,
  };
}
