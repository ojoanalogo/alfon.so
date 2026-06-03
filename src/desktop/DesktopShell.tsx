import { Fragment, useCallback, useRef } from 'react';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import { resolveDesktopShellIcons } from './apps/desktopIcons';
import { TRASH_APP_ID } from './apps/postWindow';
import { useBrowserHistories } from './wrappers/browser/useBrowserHistories';
import { useWindowManagerContext } from './state/WindowManagerContext';
import type { AppDefinition, WindowChromeProps } from '@desktop/wrappers';
import type { BlogPostSummary, WindowDef, WindowGeometry } from './types';
import Wallpaper from './shell/Wallpaper';
import BootOverlay from './shell/BootOverlay';
import DesktopIcons from './shell/icons/DesktopIcons';
import Taskbar from './shell/taskbar/Taskbar';
import Papelera from './shell/trash/Papelera';
import { useDesktopIcons } from './state/useDesktopIcons';
import { useResponsiveLayout } from './state/useResponsiveLayout';
import { useTrashController } from './state/useTrashController';
import { useAppContext } from './state/useAppContext';
import { useTaskbarMeta } from './state/useTaskbarMeta';
import { isMobileViewport, minWidthForDef } from './lib/layoutConstants';
import { useMemo, useEffect } from 'react';

interface DesktopShellProps {
  apps: AppDefinition[];
  defs: WindowDef[];
  posts: BlogPostSummary[];
  desktopIconUrls: DesktopIconUrls;
  viewport: { width: number; height: number };
}

export default function DesktopShell({
  apps,
  defs,
  posts,
  desktopIconUrls,
  viewport,
}: DesktopShellProps) {
  const wm = useWindowManagerContext();
  const { setGeometry, unfocus } = wm;
  const browsers = useBrowserHistories();

  const { openWindow, fitWindowToMobile } = useResponsiveLayout(wm, defs, viewport);

  // Hydrate per-app initial URLs once per app definition.
  useEffect(() => {
    for (const app of apps) {
      if (app.initialBrowserUrl) {
        browsers.hydrateInitial(app.id, app.initialBrowserUrl);
      }
    }
  }, [apps, browsers]);

  const desktopIcons = useMemo(
    () => resolveDesktopShellIcons(apps, desktopIconUrls),
    [apps, desktopIconUrls],
  );
  const startMenuApps = useMemo(
    () => desktopIcons.filter((icon) => Boolean(icon.windowId)),
    [desktopIcons],
  );

  const icons = useDesktopIcons(desktopIcons);
  const trashRef = useRef<HTMLButtonElement>(null);
  const suppressTrashClickRef = useRef(false);

  const trash = useTrashController(icons, openWindow);

  const appContext = useAppContext({
    posts,
    openWindow,
    browsers,
    trash,
    desktopIconUrls,
    setGeometry,
  });

  const meta = useTaskbarMeta(apps, desktopIconUrls);

  function handleTaskbarSelect(id: string) {
    const win = wm.windows[id];
    if (!win) return;
    if (win.minimized) {
      openWindow(id);
    } else {
      wm.focus(id);
      if (isMobileViewport()) {
        fitWindowToMobile(id);
      }
    }
  }

  const handleCloseAllWindows = useCallback(() => {
    defs.forEach((def) => wm.close(def.id));
  }, [defs, wm]);

  return (
    <>
      <Wallpaper />
      <BootOverlay />

      <DesktopIcons
        state={icons}
        onOpenWindow={openWindow}
        onDesktopClick={unfocus}
        trashRef={trashRef}
        suppressTrashClickRef={suppressTrashClickRef}
      />

      <div className="pointer-events-none relative min-h-[calc(100dvh-5rem)]">
        {apps.map((app) => {
          const state = wm.windows[app.id];
          const def = defs.find((d) => d.id === app.id);
          if (!state || !def) return null;
          const win: WindowChromeProps = {
            state,
            focused: wm.focusedId === app.id,
            minWidth: minWidthForDef(def),
            defaultWidth: def.defaultWidth,
            defaultHeight: def.defaultHeight,
            minHeight: def.minHeight,
            center: def.center,
            onFocus: () => wm.focus(app.id),
            onClose: () => wm.close(app.id),
            onMinimize: () => wm.minimize(app.id),
            onToggleMaximize: () => wm.toggleMaximize(app.id),
            onGeometryChange: (geometry: Partial<WindowGeometry>) =>
              wm.setGeometry(app.id, geometry),
          };
          return <Fragment key={app.id}>{app.render(appContext, win)}</Fragment>;
        })}
      </div>

      <Taskbar
        windows={wm.windows}
        order={wm.order}
        focusedId={wm.focusedId}
        meta={meta}
        startMenuApps={startMenuApps}
        onSelect={handleTaskbarSelect}
        onMinimize={wm.minimize}
        onClose={wm.close}
        onOpenExternal={appContext.onOpenLink}
        onOpenWindow={openWindow}
        onCloseAllWindows={handleCloseAllWindows}
      />

      <Papelera
        trashedCount={icons.trashedCount}
        iconUrls={desktopIconUrls}
        onOpen={() => openWindow(TRASH_APP_ID)}
        trashRef={trashRef}
        suppressNextClickRef={suppressTrashClickRef}
      />
    </>
  );
}
