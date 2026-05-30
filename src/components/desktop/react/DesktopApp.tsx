import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { resolveIconUrl, type DesktopIconUrls } from '../../../lib/desktopIcons';
import { APPS, createPostApps } from './apps/registry';
import { resolveDesktopShellIcons } from './apps/desktopIcons';
import { appToWindowDef, renderApp } from './apps/renderApp';
import { BROWSER_APP_ID, postWindowId } from './apps/postWindow';
import { getTrashWindowMeta } from './apps/data';
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
import { MIN_HEIGHT, TASKBAR_HEIGHT } from './useWindowManager';
import { useViewportSize } from './utils/useViewportSize';
import {
  effectiveMinWidth,
  isMobileViewport,
  mobileWindowGeometry,
} from './utils/viewport';

const EDGE_MARGIN = 16;

interface DesktopAppProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}

export default function DesktopApp({ posts, wallpapers, desktopIconUrls }: DesktopAppProps) {
  const viewport = useViewportSize();
  const apps = useMemo<AppDefinition[]>(() => {
    // Hide the blog app if there are no posts.
    const filtered = posts.length > 0 ? [...APPS] : APPS.filter((app) => app.id !== 'blog');
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
    () => desktopIcons.filter((icon) => icon.kind === 'window' && icon.windowId),
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
    [icons.trashedIcons, icons.restoreIcons, icons.restoreAll, icons.emptyTrash, openWindow],
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
      focusedWindowId: wm.focusedId,
      trash,
      iconUrls: desktopIconUrls,
    }),
    [posts, openWindow, handleOpenLink, browsers, wm.focusedId, trash, desktopIconUrls],
  );

  const meta = useMemo<Record<string, WindowMeta>>(() => {
    const base: Record<string, WindowMeta> = {};
    for (const app of apps) {
      const label = typeof app.title === 'string' ? app.title : app.id;
      base[app.id] = {
        iconSrc: resolveIconUrl(desktopIconUrls, app.iconKey),
        label,
        tooltip: app.taskbarTooltip ?? label,
      };
    }
    // Trash junk PDFs become real windows on activate — give them taskbar meta too.
    for (const file of getTrashWindowMeta(desktopIconUrls)) {
      base[file.windowId] = {
        iconSrc: file.iconSrc,
        label: file.label,
        tooltip: file.label,
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
        const win = wm.windows[def.id];
        if (mobile) {
          if (win?.open && !win.minimized) {
            setGeometry(def.id, mobileWindowGeometry(vw, vh));
          } else if (def.defaultOpen) {
            setGeometry(def.id, mobileWindowGeometry(vw, vh));
          }
          return;
        }

        const minW = effectiveMinWidth(def, vw);
        const width = Math.max(minW, Math.min(def.defaultWidth, vw - EDGE_MARGIN * 2));

        if (def.center) {
          const el = document.querySelector<HTMLElement>(`[data-window-id="${def.id}"]`);
          const measuredHeight =
            el?.getBoundingClientRect().height ?? def.defaultHeight ?? MIN_HEIGHT;
          const x = Math.max(EDGE_MARGIN, (vw - width) / 2);
          const y = Math.max(EDGE_MARGIN, (vh - TASKBAR_HEIGHT - measuredHeight) / 2);
          setGeometry(def.id, { width, x, y });
          return;
        }

        const maxX = Math.max(EDGE_MARGIN, vw - width - EDGE_MARGIN);
        setGeometry(def.id, { width, x: Math.min(def.defaultX, maxX) });
      });
    }

    applyLayout();
    requestAnimationFrame(applyLayout);
    if (!mobile && defs.some((def) => def.center)) {
      requestAnimationFrame(() => requestAnimationFrame(applyLayout));
    }
  }, [defs, setGeometry, wm.windows, viewport.width, viewport.height, layoutEpoch]);

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
        onOpenLink={handleOpenLink}
        onDesktopClick={unfocus}
      />

      <div className="desktop-windows">
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
        onOpen={() => openWindow('trash')}
      />
    </>
  );
}
