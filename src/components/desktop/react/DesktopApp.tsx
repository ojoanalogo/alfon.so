import { useCallback, useEffect, useMemo, useState } from 'react';
import { DESKTOP_ICONS } from '../../../config';
import Papelera from './Papelera';
import DesktopIcons from './DesktopIcons';
import Taskbar, { type WindowMeta } from './Taskbar';
import Window from './Window';
import { useDesktopIcons } from './useDesktopIcons';
import { minWidthForDef, useWindowManager } from './useWindowManager';
import {
  BROWSER_WINDOW_ID,
  BrowserTitleContent,
  TRASH_FILES,
  WINDOW_DEFS,
  WindowContent,
  createPostWindowDefs,
  postWindowId,
  type TrashController,
} from './windows';
import type { BlogPostSummary } from './types';

const INITIAL_VIEWPORT = 1280;
const EDGE_MARGIN = 16;
const BLOG_ICON_SRC = '/icons/desktop/blog.svg';
const BROWSER_ICON_SRC = '/icons/desktop/startup.svg';
const TRASH_ICON_SRC = '/icons/desktop/trash.svg';

interface DesktopAppProps {
  posts: BlogPostSummary[];
}

export default function DesktopApp({ posts }: DesktopAppProps) {
  const defs = useMemo(() => {
    const base = posts.length > 0 ? WINDOW_DEFS : WINDOW_DEFS.filter((def) => def.id !== 'blog');
    return [...base, ...createPostWindowDefs(posts)];
  }, [posts]);

  const meta = useMemo<Record<string, WindowMeta>>(() => {
    const base = Object.fromEntries(
      DESKTOP_ICONS.filter((icon) => icon.kind === 'window' && icon.windowId).map((icon) => [
        icon.windowId as string,
        { iconSrc: icon.iconSrc, label: icon.label, tooltip: icon.tooltip },
      ]),
    );
    base[BROWSER_WINDOW_ID] = {
      iconSrc: BROWSER_ICON_SRC,
      label: 'web browser',
      tooltip: 'Navegador web',
    };
    base.trash = {
      iconSrc: TRASH_ICON_SRC,
      label: 'Papelera',
      tooltip: 'Papelera',
    };
    for (const file of TRASH_FILES) {
      base[file.windowId] = {
        iconSrc: file.iconSrc,
        label: file.label,
        tooltip: file.label,
      };
    }
    for (const post of posts) {
      base[postWindowId(post.slug)] = {
        iconSrc: BLOG_ICON_SRC,
        label: `${post.slug}.md`,
        tooltip: post.title,
      };
    }
    return base;
  }, [posts]);

  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [browserReloadKey, setBrowserReloadKey] = useState(0);

  const handleBrowserReload = useCallback(() => {
    setBrowserReloadKey((key) => key + 1);
  }, []);

  const icons = useDesktopIcons(DESKTOP_ICONS);

  const wm = useWindowManager(defs, INITIAL_VIEWPORT);
  const { setGeometry, open } = wm;

  const trash = useMemo<TrashController>(
    () => ({
      items: icons.trashedIcons.map((icon) => ({
        id: icon.id,
        label: icon.label,
        iconSrc: icon.iconSrc,
      })),
      files: TRASH_FILES,
      onOpenFile: open,
      onRestore: (id: string) => icons.restoreIcons([id]),
      onRestoreAll: icons.restoreAll,
      onEmpty: icons.emptyTrash,
    }),
    [icons.trashedIcons, icons.restoreIcons, icons.restoreAll, icons.emptyTrash, open],
  );

  // Clamp windows to the real viewport after hydration (avoids SSR mismatch).
  useEffect(() => {
    const vw = window.innerWidth;
    defs.forEach((def) => {
      const minW = minWidthForDef(def);
      const width = Math.max(minW, Math.min(def.defaultWidth, vw - EDGE_MARGIN * 2));
      const maxX = Math.max(EDGE_MARGIN, vw - width - EDGE_MARGIN);
      setGeometry(def.id, { width, x: Math.min(def.defaultX, maxX) });
    });
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

  function handleOpenPost(slug: string) {
    open(postWindowId(slug));
  }

  const handleOpenLink = useCallback(
    (url: string) => {
      setBrowserUrl(url);
      setGeometry(BROWSER_WINDOW_ID, { height: 520 });
      open(BROWSER_WINDOW_ID);
    },
    [open, setGeometry],
  );

  const handleCloseAllWindows = useCallback(() => {
    defs.forEach((def) => wm.close(def.id));
  }, [defs, wm]);

  const openWindowCount = useMemo(
    () => Object.values(wm.windows).filter((win) => win.open).length,
    [wm.windows],
  );

  return (
    <>
      <DesktopIcons state={icons} onOpenWindow={wm.open} onOpenLink={handleOpenLink} />

      <div
        className={['desktop-windows', openWindowCount > 1 && 'desktop-windows--multi']
          .filter(Boolean)
          .join(' ')}
      >
        {defs.map((def) => {
          const state = wm.windows[def.id];
          if (!state) return null;
          const isBrowser = def.id === BROWSER_WINDOW_ID;
          const isTerminal = def.id === 'terminal';
          return (
            <Window
              key={def.id}
              state={state}
              title={isBrowser ? (browserUrl ?? def.title) : def.title}
              titleContent={
                isBrowser ? (
                  <BrowserTitleContent url={browserUrl} onReload={handleBrowserReload} />
                ) : undefined
              }
              minWidth={minWidthForDef(def)}
              windowClassName={isBrowser ? 'desktop-window--browser' : undefined}
              bodyClassName={
                isBrowser ? 'browser-window__body' : isTerminal ? 'terminal-window__body' : undefined
              }
              focused={wm.focusedId === def.id}
              onFocus={() => wm.focus(def.id)}
              onClose={() => wm.close(def.id)}
              onMinimize={() => wm.minimize(def.id)}
              onToggleMaximize={() => wm.toggleMaximize(def.id)}
              onGeometryChange={(geometry) => wm.setGeometry(def.id, geometry)}
            >
              <WindowContent
                id={def.id}
                posts={posts}
                browserUrl={browserUrl}
                browserReloadKey={browserReloadKey}
                onOpenPost={handleOpenPost}
                onOpenLink={handleOpenLink}
                trash={trash}
              />
            </Window>
          );
        })}
      </div>

      <Taskbar
        windows={wm.windows}
        order={wm.order}
        focusedId={wm.focusedId}
        meta={meta}
        onSelect={handleTaskbarSelect}
        onMinimize={wm.minimize}
        onClose={wm.close}
        onOpenExternal={handleOpenLink}
        onOpenWindow={wm.open}
        onCloseAllWindows={handleCloseAllWindows}
      />

      <Papelera trashedCount={icons.trashedCount} onOpen={() => wm.open('trash')} />
    </>
  );
}
