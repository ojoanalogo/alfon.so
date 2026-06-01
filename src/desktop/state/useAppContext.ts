import { useCallback, useMemo } from 'react';
import { BROWSER_APP_ID, postWindowId } from '../apps/postWindow';
import type { AppContext, TrashController } from '@desktop/wrappers';
import type { BlogPostSummary, WindowGeometry } from '../types';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import type { BrowserHistories } from '../wrappers/browser/useBrowserHistories';

interface UseAppContextParams {
  posts: BlogPostSummary[];
  openWindow: (id: string) => void;
  browsers: BrowserHistories;
  trash: TrashController;
  desktopIconUrls: DesktopIconUrls;
  setGeometry: (id: string, geometry: Partial<WindowGeometry>) => void;
}

export function useAppContext({
  posts,
  openWindow,
  browsers,
  trash,
  desktopIconUrls,
  setGeometry,
}: UseAppContextParams): AppContext {
  const handleOpenLink = useCallback(
    (url: string) => {
      const normalized = browsers.navigate(BROWSER_APP_ID, url);
      if (!normalized) return;
      setGeometry(BROWSER_APP_ID, { height: 520 });
      openWindow(BROWSER_APP_ID);
    },
    [browsers, openWindow, setGeometry],
  );

  return useMemo<AppContext>(
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
}
