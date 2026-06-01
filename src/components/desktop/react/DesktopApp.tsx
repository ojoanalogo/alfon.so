import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopIconUrls } from '../../../lib/desktopIcons';
import { APPS, createPostApps } from './apps/registry';
import { appIconSrc, resolveDesktopShellIcons } from './apps/desktopIcons';
import { appToWindowDef, renderApp } from './apps/renderApp';
import { BROWSER_APP_ID, TRASH_APP_ID, postWindowId } from './apps/postWindow';
import { TRASH_JUNK } from './apps/data';
import { useBrowserHistories } from './browser/useBrowserHistories';
import { GridSettingsProvider } from './context/GridSettingsContext';
import { WallpaperProvider } from './context/WallpaperContext';
import { WindowManagerProvider, useWindowManagerContext } from './context/WindowManagerContext';
import type { AppDefinition } from './apps/defineApp';
import type { WindowAppContext, TrashController } from './apps/types';
import type { BlogPostSummary, WallpaperOption, WindowDef } from './types';
import DesktopWallpaper from './DesktopWallpaper';
import DesktopBootOverlay from './DesktopBootOverlay';
import Papelera from './Papelera';
import DesktopIcons from './DesktopIcons';
import Taskbar, { type WindowMeta } from './Taskbar';
import { useDesktopIcons } from './useDesktopIcons';
import { useViewportSize } from './utils/useViewportSize';
import {
  isMobileViewport,
  mobileWindowGeometry,
  resolveWindowGeometry,
} from './utils/viewport';

interface DesktopAppProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}

export default function DesktopApp({ posts, wallpapers, desktopIconUrls }: DesktopAppProps) {
  const viewport = useViewportSize();
  const apps = useMemo<AppDefinition[]>(() => {
    const filtered = APPS.filter((app) => app.availableWhen?.({ posts }) ?? true);
    return [...filtered, ...createPostApps(posts)];
  }, [posts]);

  const defs = useMemo<WindowDef[]>(() => apps.map(appToWindowDef), [apps]);

  return (
    <WindowManagerProvider
      defs={defs}
      viewportWidth={viewport.width}
      viewportHeight={viewport.height}
    >
      <WallpaperProvider wallpapers={wallpapers}>
        <GridSettingsProvider>
          <DesktopAppContent
            apps={apps}
            defs={defs}
            posts={posts}
            desktopIconUrls={desktopIconUrls}
            viewport={viewport}
          />
        </GridSettingsProvider>
      </WallpaperProvider>
    </WindowManagerProvider>
  );
}

interface DesktopAppContentProps {
  apps: AppDefinition[];
  defs: WindowDef[];
  posts: BlogPostSummary[];
  desktopIconUrls: DesktopIconUrls;
  viewport: { width: number; height: number };
}

function DesktopAppContent({ apps, defs, posts, desktopIconUrls, viewport }: DesktopAppContentProps) {
  const wm = useWindowManagerContext();
  const { setGeometry, unfocus } = wm;
  const browsers = useBrowserHistories();
  const [layoutEpoch, setLayoutEpoch] = useState(0);

  // Read window state inside the relayout effect without making it a dependency:
  // otherwise a drag (which mutates wm.windows on every pointer move) re-fires
  // the effect, which clamps x/y back to defaults and fights the drag.
  const windowsRef = useRef(wm.windows);
  useEffect(() => {
    windowsRef.current = wm.windows;
  });

  useEffect(() => {
    function bumpLayout() {
      setLayoutEpoch((epoch) => epoch + 1);
    }
    window.addEventListener('resize', bumpLayout);
    window.visualViewport?.addEventListener('resize', bumpLayout);
    return () => {
      window.removeEventListener('resize', bumpLayout);
      window.visualViewport?.removeEventListener('resize', bumpLayout);
    };
  }, []);

  const fitWindowToMobile = useCallback(
    (id: string) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = mobileWindowGeometry(vw, vh);
      setGeometry(id, mobile);
    },
    [setGeometry],
  );

  const openWindow = useCallback(
    (id: string) => {
      wm.open(id);
      if (isMobileViewport()) {
        fitWindowToMobile(id);
      }
    },
    [wm, fitWindowToMobile],
  );

  // Hydrate per-app initial URLs once per app definition.
  useEffect(() => {
    for (const app of apps) {
      if (app.layout.kind === 'browser' && app.layout.initialUrl) {
        browsers.hydrateInitial(app.id, app.layout.initialUrl);
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

  const trash = useMemo<TrashController>(
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

  const handleOpenLink = useCallback(
    (url: string) => {
      const normalized = browsers.navigate(BROWSER_APP_ID, url);
      if (!normalized) return;
      setGeometry(BROWSER_APP_ID, { height: 520 });
      openWindow(BROWSER_APP_ID);
    },
    [browsers, openWindow, setGeometry],
  );

  const appContext = useMemo<WindowAppContext>(
    () => ({
      posts,
      onOpenPost: (slug: string) => openWindow(postWindowId(slug)),
      onOpenLink: handleOpenLink,
      browsers,
      trash,
      iconUrls: desktopIconUrls,
    }),
    [posts, openWindow, handleOpenLink, browsers, trash, desktopIconUrls],
  );

  const meta = useMemo<Record<string, WindowMeta>>(() => {
    // Trash-junk apps (area51/ovnis/happy) show their bare filename in the
    // taskbar rather than the flavored window title.
    const trashNames = new Map(
      TRASH_JUNK.flatMap((entry) => (entry.appId ? [[entry.appId, entry.name] as const] : [])),
    );
    const base: Record<string, WindowMeta> = {};
    for (const app of apps) {
      const label = trashNames.get(app.id) ?? (typeof app.title === 'string' ? app.title : app.id);
      base[app.id] = {
        iconSrc: appIconSrc(app, desktopIconUrls),
        label,
        tooltip: app.taskbarTooltip ?? label,
      };
    }
    return base;
  }, [apps, desktopIconUrls]);

  // Clamp window geometry to the current viewport (desktop centering or mobile fit).
  useEffect(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : viewport.width;
    const vh = typeof window !== 'undefined' ? window.innerHeight : viewport.height;
    const mobile = isMobileViewport(vw);

    function applyLayout() {
      defs.forEach((def) => {
        const win = windowsRef.current[def.id];
        if (mobile) {
          if ((win?.open && !win.minimized) || def.defaultOpen) {
            setGeometry(def.id, mobileWindowGeometry(vw, vh));
          }
          return;
        }

        let measuredHeight: number | undefined;
        if (def.center) {
          const el = document.querySelector<HTMLElement>(`[data-window-id="${def.id}"]`);
          measuredHeight = el?.getBoundingClientRect().height;
        }
        const geo = resolveWindowGeometry(def, vw, vh, measuredHeight);
        // Non-center windows keep their initial y; only width/x are reclamped.
        setGeometry(def.id, def.center ? { width: geo.width, x: geo.x, y: geo.y } : { width: geo.width, x: geo.x });
      });
    }

    applyLayout();
    requestAnimationFrame(applyLayout);
    if (!mobile && defs.some((def) => def.center)) {
      requestAnimationFrame(() => requestAnimationFrame(applyLayout));
    }
  }, [defs, setGeometry, viewport.width, viewport.height, layoutEpoch]);

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
      <DesktopWallpaper />
      <DesktopBootOverlay />

      <DesktopIcons
        state={icons}
        onOpenWindow={openWindow}
        onDesktopClick={unfocus}
      />

      <div className="pointer-events-none relative min-h-[calc(100dvh-5rem)]">
        {apps.map((app) => {
          const state = wm.windows[app.id];
          const def = defs.find((d) => d.id === app.id);
          if (!state || !def) return null;
          return (
            <Fragment key={app.id}>
              {renderApp({
                app,
                def,
                state,
                focused: wm.focusedId === app.id,
                ctx: appContext,
                callbacks: wm,
              })}
            </Fragment>
          );
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
        onOpenExternal={handleOpenLink}
        onOpenWindow={openWindow}
        onCloseAllWindows={handleCloseAllWindows}
      />

      <Papelera
        trashedCount={icons.trashedCount}
        iconUrls={desktopIconUrls}
        onOpen={() => openWindow(TRASH_APP_ID)}
      />
    </>
  );
}
