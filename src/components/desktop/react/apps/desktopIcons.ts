import type { DesktopIconDefinition } from '../../../../config';
import type { DesktopIconUrls } from '../../../../lib/desktopIcons';
import { resolveDesktopIcons } from '../../../../lib/desktopIcons';
import { appLabel, type AppDefinition } from './defineApp';

/**
 * External link icons rendered alongside the app icons. Add a new "leaves the
 * site" tile by appending here. Not full apps — they just `window.location.assign()`.
 *
 * To open a URL inside a desktop window instead, use `defineBrowserApp` in the
 * registry (with `hideTitle: true` for a chrome-only site launcher).
 */
export const DESKTOP_LINKS: DesktopIconDefinition[] = [];

/** Derive desktop icon definitions from the app registry. */
export function appsToIconDefinitions(apps: readonly AppDefinition[]): DesktopIconDefinition[] {
  return apps
    .filter((app) => app.desktopIcon !== false)
    .map((app) => {
      const cfg = typeof app.desktopIcon === 'object' && app.desktopIcon ? app.desktopIcon : {};
      return {
        id: app.id,
        label: cfg.label ?? appLabel(app),
        iconKey: app.iconKey,
        kind: 'window' as const,
        windowId: app.id,
        defaultOpen: app.geometry.defaultOpen,
        tooltip: cfg.tooltip ?? (typeof app.title === 'string' ? app.title : app.id),
      };
    });
}

/** Full ordered list of icon definitions: apps first, then external links. */
export function resolveDesktopShellIcons(
  apps: readonly AppDefinition[],
  iconUrls: DesktopIconUrls,
) {
  const definitions = [...appsToIconDefinitions(apps), ...DESKTOP_LINKS];
  return resolveDesktopIcons(definitions, iconUrls);
}
