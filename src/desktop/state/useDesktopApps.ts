import { useEffect, useMemo, useState } from 'react';
import { CORE_APPS, createPostApps, loadGameApps } from '../apps/registry';
import { appToWindowDef } from '../apps/appToWindowDef';
import type { AppDefinition } from '@desktop/wrappers';
import type { BlogPostSummary, WindowDef } from '../types';

export function useDesktopApps(posts: BlogPostSummary[]): {
  apps: AppDefinition[];
  defs: WindowDef[];
  gamesReady: boolean;
} {
  const [gameApps, setGameApps] = useState<AppDefinition[]>([]);
  const [gamesReady, setGamesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadGameApps().then((loaded) => {
      if (!cancelled) {
        setGameApps(loaded);
        setGamesReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const apps = useMemo<AppDefinition[]>(() => {
    const filtered = CORE_APPS.filter((app) => app.availableWhen?.({ posts }) ?? true);
    return [...filtered, ...gameApps, ...createPostApps(posts)];
  }, [posts, gameApps]);

  const defs = useMemo<WindowDef[]>(
    () => apps.map((app, index) => appToWindowDef(app, index)),
    [apps],
  );

  return { apps, defs, gamesReady };
}
