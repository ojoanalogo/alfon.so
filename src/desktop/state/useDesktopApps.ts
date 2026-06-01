import { useMemo } from 'react';
import { APPS, createPostApps } from '../apps/registry';
import { appToWindowDef } from '../apps/appToWindowDef';
import type { AppDefinition } from '@desktop/wrappers';
import type { BlogPostSummary, WindowDef } from '../types';

export function useDesktopApps(posts: BlogPostSummary[]): { apps: AppDefinition[]; defs: WindowDef[] } {
  const apps = useMemo<AppDefinition[]>(() => {
    const filtered = APPS.filter((app) => app.availableWhen?.({ posts }) ?? true);
    return [...filtered, ...createPostApps(posts)];
  }, [posts]);
  const defs = useMemo<WindowDef[]>(() => apps.map(appToWindowDef), [apps]);
  return { apps, defs };
}
