import type { DesktopIconDefinition } from '@/config';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import { formatWindowTitle } from '@desktop/lib/formatWindowTitle';
import { resolveDesktopIcons, resolveIconUrl } from '@desktop/lib/desktopIcons';
import { appLabel, type AppDefinition } from '@desktop/wrappers';
import type { AppId } from './registry';

/** Left-column stack order (independent of APPS / start menu order). */
const DESKTOP_ICON_ORDER: AppId[] = [
  'about',
  'blog',
  'photos',
  'startup',
  'projects',
  'settings',
  'games',
  'notes',
  'terminal',
];

function desktopIconSortIndex(id: string): number {
  const index = DESKTOP_ICON_ORDER.indexOf(id as AppId);
  return index === -1 ? DESKTOP_ICON_ORDER.length : index;
}

/** Resolve an app's icon URL, preferring a co-located `iconUrl` over `iconKey`. */
export function appIconSrc(app: AppDefinition, urls: DesktopIconUrls): string {
  return app.iconUrl ?? (app.iconKey ? resolveIconUrl(urls, app.iconKey) : '');
}

/** Derive desktop icon definitions from the app registry. */
export function appsToIconDefinitions(apps: readonly AppDefinition[]): DesktopIconDefinition[] {
  const iconApps = apps.filter((app) => app.desktopIcon !== false);

  if (import.meta.env.DEV) {
    // Any icon-bearing app missing from DESKTOP_ICON_ORDER would silently sort
    // last (sentinel index). Fail loud during dev so the order list stays in
    // sync with the registry instead of drifting unnoticed.
    const missing = iconApps
      .map((app) => app.id)
      .filter((id) => !DESKTOP_ICON_ORDER.includes(id as AppId));
    if (missing.length > 0) {
      throw new Error(
        `[appIcons] App(s) ${missing.join(', ')} have a desktop icon but are missing ` +
          `from DESKTOP_ICON_ORDER in apps/appIcons.ts (they would silently sort last).`,
      );
    }
  }

  return iconApps
    .sort((a, b) => desktopIconSortIndex(a.id) - desktopIconSortIndex(b.id))
    .map((app) => {
      const cfg = typeof app.desktopIcon === 'object' && app.desktopIcon ? app.desktopIcon : {};
      return {
        id: app.id,
        label: formatWindowTitle(cfg.label ?? appLabel(app)),
        iconKey: app.iconKey,
        iconUrl: app.iconUrl,
        windowId: app.id,
        defaultOpen: app.geometry.defaultOpen,
        tooltip: cfg.tooltip ?? (typeof app.title === 'string' ? app.title : app.id),
      };
    });
}

/** Ordered, URL-resolved desktop icon list derived from the app registry. */
export function resolveDesktopShellIcons(
  apps: readonly AppDefinition[],
  iconUrls: DesktopIconUrls,
) {
  return resolveDesktopIcons(appsToIconDefinitions(apps), iconUrls);
}
