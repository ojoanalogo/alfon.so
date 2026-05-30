import { createWindowApps } from './windowApps';
import type { WindowAppContext, WindowAppRegistry } from './types';

export type { WindowAppContext, WindowAppRegistry };

const WINDOW_APPS: WindowAppRegistry = createWindowApps();

export function renderWindowApp(id: string, ctx: WindowAppContext) {
  const entry = getWindowAppEntry(id);
  return entry?.render(ctx, id) ?? null;
}

export function getWindowAppEntry(id: string): WindowAppRegistry[string] | undefined {
  if (WINDOW_APPS[id]) return WINDOW_APPS[id];
  if (id.startsWith('post:')) return WINDOW_APPS['post:*'];
  return undefined;
}
