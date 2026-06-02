import { useMemo } from 'react';
import { formatWindowTitle } from '@desktop/lib/formatWindowTitle';
import { TRASH_JUNK } from '../apps/trash/junk';
import { appIconSrc } from '../apps/desktopIcons';
import type { AppDefinition } from '@desktop/wrappers';
import type { WindowMeta } from '../types';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';

export function useTaskbarMeta(
  apps: AppDefinition[],
  desktopIconUrls: DesktopIconUrls,
): Record<string, WindowMeta> {
  return useMemo<Record<string, WindowMeta>>(() => {
    // Trash-junk apps (area51/ovnis/happy) show their bare filename in the
    // taskbar rather than the flavored window title.
    const trashNames = new Map(
      TRASH_JUNK.flatMap((entry) => (entry.appId ? [[entry.appId, entry.name] as const] : [])),
    );
    const base: Record<string, WindowMeta> = {};
    for (const app of apps) {
      const rawLabel = trashNames.get(app.id) ?? (typeof app.title === 'string' ? app.title : app.id);
      const label = formatWindowTitle(rawLabel);
      base[app.id] = {
        iconSrc: appIconSrc(app, desktopIconUrls),
        label,
        tooltip: app.taskbarTooltip ?? label,
      };
    }
    return base;
  }, [apps, desktopIconUrls]);
}
