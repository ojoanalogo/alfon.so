import { useMemo } from 'react';
import type { TrashController } from '@desktop/wrappers';
import type { DesktopIconsState } from './useDesktopIcons';

export function useTrashController(
  icons: DesktopIconsState,
  openWindow: (id: string) => void,
): TrashController {
  return useMemo<TrashController>(
    () => ({
      items: icons.trashedIcons.map((icon) => ({
        id: icon.id,
        label: icon.label,
        iconSrc: icon.iconSrc,
      })),
      onOpenFile: openWindow,
      onRestore: (id: string) => icons.restoreIcons([id]),
      onRestoreAll: icons.restoreAll,
      onEmpty: icons.emptyTrash,
    }),
    [icons, openWindow],
  );
}
