import { useCallback, useEffect, useMemo, useState } from 'react';
import { DESKTOP_ICON_DEFS } from '../../../config';
import { resolveDesktopIcons, resolveIconUrl, type DesktopIconUrls } from '../../../lib/desktopIcons';
import {
  getWindowAppEntry,
  renderWindowApp,
  type WindowAppContext,
} from './apps/registry';
import { resolveWindowChrome, resolveWindowTitle } from './apps/types';
import {
  BROWSER_WINDOW_ID,
  createPostWindowDefs,
  getTrashWindowMeta,
  postWindowId,
  WINDOW_DEFS,
} from './apps/windowApps';
import { normalizeBrowserUrl } from './browserUtils';
import type { TrashController } from './apps/types';
import { WindowManagerProvider, useWindowManagerContext } from './context/WindowManagerContext';
import { WallpaperProvider } from './context/WallpaperContext';
import DesktopWallpaper from './DesktopWallpaper';
import DesktopBootOverlay from './DesktopBootOverlay';
import Papelera from './Papelera';
import DesktopIcons from './DesktopIcons';
import Taskbar, { type WindowMeta } from './Taskbar';
import Window from './window';
import ExplorerWindow from './window/ExplorerWindow';
import { useDesktopIcons } from './useDesktopIcons';
import { minWidthForDef, MIN_HEIGHT, TASKBAR_HEIGHT } from './useWindowManager';
import type { BlogPostSummary, WallpaperOption, WindowDef } from './types';

const INITIAL_VIEWPORT = { width: 1280, height: 800 };
const EDGE_MARGIN = 16;

interface DesktopAppProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}

export default function DesktopApp({ posts, wallpapers, desktopIconUrls }: DesktopAppProps) {
  const defs = useMemo(() => {
    const base = posts.length > 0 ? WINDOW_DEFS : WINDOW_DEFS.filter((def) => def.id !== 'blog');
    return [...base, ...createPostWindowDefs(posts)];
  }, [posts]);

  return (
    <WindowManagerProvider
      defs={defs}
      viewportWidth={INITIAL_VIEWPORT.width}
      viewportHeight={INITIAL_VIEWPORT.height}
    >
      <DesktopAppContent
        posts={posts}
        defs={defs}
        wallpapers={wallpapers}
        desktopIconUrls={desktopIconUrls}
      />
    </WindowManagerProvider>
  );
}

function DesktopAppContent({
  posts,
  defs,
  wallpapers,
  desktopIconUrls,
}: {
  posts: BlogPostSummary[];
  defs: WindowDef[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}) {
  const wm = useWindowManagerContext();
  const { setGeometry, open, unfocus } = wm;

  const desktopIcons = useMemo(
    () => resolveDesktopIcons(DESKTOP_ICON_DEFS, desktopIconUrls),
    [desktopIconUrls],
  );
  const startMenuApps = useMemo(
    () => desktopIcons.filter((icon) => icon.kind === 'window' && icon.windowId),
    [desktopIcons],
  );

  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [browserReloadKey, setBrowserReloadKey] = useState(0);

  const handleBrowserReload = useCallback(() => {
    setBrowserReloadKey((key) => key + 1);
  }, []);

  const handleBrowserNavigate = useCallback(
    (input: string) => {
      const normalized = normalizeBrowserUrl(input);
      if (!normalized) return;
      setBrowserUrl(normalized);
      setGeometry(BROWSER_WINDOW_ID, { height: 520 });
      open(BROWSER_WINDOW_ID);
    },
    [open, setGeometry],
  );

  const handleOpenLink = useCallback(
    (url: string) => {
      handleBrowserNavigate(url);
    },
    [handleBrowserNavigate],
  );

  const icons = useDesktopIcons(desktopIcons);

  const trash = useMemo<TrashController>(
    () => ({
      items: icons.trashedIcons.map((icon) => ({
        id: icon.id,
        label: icon.label,
        iconSrc: icon.iconSrc,
      })),
      onOpenFile: open,
      onRestore: (id: string) => icons.restoreIcons([id]),
      onRestoreAll: icons.restoreAll,
      onEmpty: icons.emptyTrash,
    }),
    [icons.trashedIcons, icons.restoreIcons, icons.restoreAll, icons.emptyTrash, open],
  );

  const appContext = useMemo<WindowAppContext>(
    () => ({
      posts,
      browserUrl,
      browserReloadKey,
      onOpenPost: (slug: string) => open(postWindowId(slug)),
      onOpenLink: handleOpenLink,
      onBrowserReload: handleBrowserReload,
      onBrowserNavigate: handleBrowserNavigate,
      focusedWindowId: wm.focusedId,
      trash,
      iconUrls: desktopIconUrls,
    }),
    [posts, browserUrl, browserReloadKey, open, trash, handleBrowserReload, handleBrowserNavigate, handleOpenLink, wm.focusedId, desktopIconUrls],
  );

  const meta = useMemo<Record<string, WindowMeta>>(() => {
    const base = Object.fromEntries(
      desktopIcons
        .filter((icon) => icon.kind === 'window' && icon.windowId)
        .map((icon) => [
          icon.windowId as string,
          { iconSrc: icon.iconSrc, label: icon.label, tooltip: icon.tooltip },
        ]),
    );
    base[BROWSER_WINDOW_ID] = {
      iconSrc: resolveIconUrl(desktopIconUrls, 'startup'),
      label: 'web browser',
      tooltip: 'Navegador web',
    };
    base.trash = {
      iconSrc: resolveIconUrl(desktopIconUrls, 'trash'),
      label: 'Papelera',
      tooltip: 'Papelera',
    };
    for (const file of getTrashWindowMeta(desktopIconUrls)) {
      base[file.windowId] = {
        iconSrc: file.iconSrc,
        label: file.label,
        tooltip: file.label,
      };
    }
    for (const post of posts) {
      base[postWindowId(post.slug)] = {
        iconSrc: resolveIconUrl(desktopIconUrls, 'blog'),
        label: `${post.slug}.md`,
        tooltip: post.title,
      };
    }
    return base;
  }, [desktopIcons, desktopIconUrls, posts]);

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    function applyLayout() {
      defs.forEach((def) => {
        const minW = minWidthForDef(def);
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
    if (defs.some((def) => def.center)) {
      requestAnimationFrame(applyLayout);
    }
  }, [defs, setGeometry]);

  function handleTaskbarSelect(id: string) {
    const win = wm.windows[id];
    if (!win) return;
    if (win.minimized) {
      wm.open(id);
    } else {
      wm.focus(id);
    }
  }

  const handleCloseAllWindows = useCallback(() => {
    defs.forEach((def) => wm.close(def.id));
  }, [defs, wm]);

  return (
    <WallpaperProvider wallpapers={wallpapers}>
      <DesktopWallpaper />
      <DesktopBootOverlay />

      <DesktopIcons
        state={icons}
        onOpenWindow={wm.open}
        onOpenLink={handleOpenLink}
        onDesktopClick={unfocus}
      />

      <div className="desktop-windows">
        {defs.map((def) => {
          const state = wm.windows[def.id];
          if (!state) return null;

          const entry = getWindowAppEntry(def.id);
          const chrome = resolveWindowChrome(entry, def, appContext);
          const title = resolveWindowTitle(entry, def, appContext);

          const windowProps = {
            state,
            title,
            minWidth: minWidthForDef(def),
            windowClassName: chrome.windowClassName,
            bodyClassName: chrome.bodyClassName,
            focused: wm.focusedId === def.id,
            onFocus: () => wm.focus(def.id),
            onClose: () => wm.close(def.id),
            onMinimize: () => wm.minimize(def.id),
            onToggleMaximize: () => wm.toggleMaximize(def.id),
            onGeometryChange: (geometry: Parameters<typeof wm.setGeometry>[1]) =>
              wm.setGeometry(def.id, geometry),
          };

          if (entry?.explorer) {
            return (
              <ExplorerWindow key={def.id} {...windowProps}>
                {renderWindowApp(def.id, appContext)}
              </ExplorerWindow>
            );
          }

          return (
            <Window key={def.id} {...windowProps} titleContent={chrome.titleContent}>
              {renderWindowApp(def.id, appContext)}
            </Window>
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
        onOpenWindow={wm.open}
        onCloseAllWindows={handleCloseAllWindows}
      />

      <Papelera
        trashedCount={icons.trashedCount}
        iconUrls={desktopIconUrls}
        onOpen={() => wm.open('trash')}
      />
    </WallpaperProvider>
  );
}
