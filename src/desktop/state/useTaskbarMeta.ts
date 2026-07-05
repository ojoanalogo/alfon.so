import { useMemo } from 'react';
import { formatWindowTitle } from '@desktop/lib/formatWindowTitle';
import { TRASH_JUNK_TASKBAR_NAMES } from '@desktop/lib/trashJunk';
import { appIconSrc } from '../apps/appIcons';
import type { AppDefinition } from '@desktop/wrappers';
import type { WindowMeta } from '../types';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';

export function useTaskbarMeta(
  apps: AppDefinition[],
  desktopIconUrls: DesktopIconUrls,
): Record<string, WindowMeta> {
  return useMemo<Record<string, WindowMeta>>(() => {
    const base: Record<string, WindowMeta> = {};
    for (const app of apps) {
      const rawLabel =
        TRASH_JUNK_TASKBAR_NAMES.get(app.id) ??
        (typeof app.title === 'string' ? app.title : app.id);
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
