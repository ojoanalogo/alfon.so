/**
 * The app registry.
 *
 * Adding a new desktop app:
 * 1. Create the app module (`defineApp`, `explorerApp`, `browserApp`, or `gameApp`).
 * 2. Import it and append to `CORE_APPS` below (games go in `games/` and load lazily).
 * 3. If it has a desktop icon: add its id to `DESKTOP_ICON_ORDER` in `appIcons.ts`
 *    (dev throws if you forget).
 * 4. If it is a game: add its id to `GAME_IDS` in `games/gameLauncher.ts` and a loader
 *    in `games/loadGameApps.ts`.
 * 5. If terminal should `cat` it: add content in `lib/siteContent.ts` or `commands.ts`.
 */

import type { AppDefinition } from '@desktop/wrappers';
import terminalApp from './terminal';
import aboutApp from './about';
import projectsApp from './projects';
import blogApp from './blog';
import photosApp from './photos';
import startupApp from './startup';
import settingsApp from './settings';
import happyApp from './happy';
import trashApp from './trash';
import browserApp from './browser';
import notesApp from './notes';
import contactoApp from './contacto';
import cvApp from './cv';
import gamesApp from './games';

// ---------------------------------------------------------------------------
// CORE_APPS — static registry (games load asynchronously via loadGameApps).
// Order here is the fallback initialZ stack when geometry.initialZ is omitted.
// Desktop icons and start menu order come from DESKTOP_ICON_ORDER in appIcons.ts.
// ---------------------------------------------------------------------------

export const CORE_APPS = [
  terminalApp,
  aboutApp,
  projectsApp,
  blogApp,
  notesApp,
  contactoApp,
  cvApp,
  gamesApp,
  photosApp,
  startupApp,
  settingsApp,
  happyApp,
  trashApp,
  browserApp,
] as const satisfies readonly AppDefinition[];

/** @deprecated Use CORE_APPS — games merge in at runtime via useDesktopApps. */
export const APPS = CORE_APPS;

export type AppId = (typeof CORE_APPS)[number]['id'];

/** Static registry lookup (tests and tooling). Runtime UI uses `AppContext.findApp`. */
export function findApp(id: string): AppDefinition | undefined {
  return CORE_APPS.find((app) => app.id === id);
}

export { loadGameApps } from './games/loadGameApps';
export { GAME_IDS } from './games/gameLauncher';

// ---------------------------------------------------------------------------
// Dynamic per-post apps
// ---------------------------------------------------------------------------

export { createPostApps, findPostBySlug } from './post/postApp';
