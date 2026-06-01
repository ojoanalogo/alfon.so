import type { AppDefinition } from '@desktop/wrappers';
import type { WindowDef } from '../types';
import { cascadeOffset } from './cascadePositions';

/** Anchors for apps that omit explicit geometry — cascade down-right by order. */
const CASCADE_BASE = { baseX: 96, baseY: 48 };
const BASE_Z = 10;

/**
 * Convert an AppDefinition's geometry to a WindowDef the window manager
 * understands. Apps that omit `defaultX/Y` cascade from their registry order,
 * and `initialZ` defaults to `BASE_Z + index`, so the common case is zero-config.
 */
export function appToWindowDef(app: AppDefinition, index = 0): WindowDef {
  const geometry = app.geometry;
  const cascaded = cascadeOffset(index, CASCADE_BASE);
  return {
    id: app.id,
    title: typeof app.title === 'string' ? app.title : app.id,
    ...geometry,
    defaultX: geometry.defaultX ?? cascaded.x,
    defaultY: geometry.defaultY ?? cascaded.y,
    initialZ: geometry.initialZ ?? BASE_Z + index,
  };
}
