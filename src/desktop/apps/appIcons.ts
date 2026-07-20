import type { DesktopIconDefinition } from '@/config';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import { formatWindowTitle } from '@desktop/lib/formatWindowTitle';
import { resolveDesktopIcons, resolveIconUrl } from '@desktop/lib/desktopIcons';
import { appLabel, type AppContext, type AppDefinition } from '@desktop/wrappers';
import type { AppId } from './registry';

/** Left-column stack order (independent of APPS / start menu order). */
const DESKTOP_ICON_ORDER: AppId[] = [
  'about',
  'blog',
  'photos',
  'startup',
  'projects',
  'contacto',
  'settings',
  'games',
  'notes',
  'terminal',
  'cv',
];

function desktopIconSortIndex(id: string): number {
  const index = DESKTOP_ICON_ORDER.indexOf(id as AppId);
  return index === -1 ? DESKTOP_ICON_ORDER.length : index;
}

/** Desktop label as shown in terminal `ls` (registry label, else title, else id). */
export function desktopAppLabel(app: AppDefinition): string {
  const cfg = typeof app.desktopIcon === 'object' && app.desktopIcon ? app.desktopIcon : {};
  return cfg.label ?? (typeof app.title === 'string' ? app.title : app.id);
}

export function isDesktopIconApp(app: AppDefinition): boolean {
  return app.desktopIcon !== false;
}

type DesktopVisibilityCtx = Pick<AppContext, 'posts'>;

/** Icon-bearing apps sorted like the desktop column (no `availableWhen` — caller filters). */
export function desktopIconApps(apps: readonly AppDefinition[]): AppDefinition[] {
  return apps
    .filter(isDesktopIconApp)
    .sort((a, b) => desktopIconSortIndex(a.id) - desktopIconSortIndex(b.id));
}

/** Icon-bearing apps visible on the desktop, sorted like the icon column. */
export function desktopVisibleApps(
  apps: readonly AppDefinition[],
  ctx: DesktopVisibilityCtx = { posts: [] },
): AppDefinition[] {
  return apps
    .filter((app) => isDesktopIconApp(app) && (app.availableWhen?.(ctx) ?? true))
    .sort((a, b) => desktopIconSortIndex(a.id) - desktopIconSortIndex(b.id));
}

/** Desktop labels for terminal `ls`, matching icon order and `availableWhen`. */
export function desktopAppLabels(
  apps: readonly AppDefinition[],
  ctx: DesktopVisibilityCtx = { posts: [] },
): string[] {
  return desktopVisibleApps(apps, ctx).map(desktopAppLabel);
}

/** Resolve an app's icon URL, preferring a co-located `iconUrl` over `iconKey`. */
export function appIconSrc(app: AppDefinition, urls: DesktopIconUrls): string {
  return app.iconUrl ?? (app.iconKey ? resolveIconUrl(urls, app.iconKey) : '');
}

/** Derive desktop icon definitions from the app registry. */
export function appsToIconDefinitions(apps: readonly AppDefinition[]): DesktopIconDefinition[] {
  const iconApps = desktopIconApps(apps);

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

  return iconApps.map((app) => {
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
