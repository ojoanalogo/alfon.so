/**
 * The app registry.
 *
 * Adding a new desktop app:
 * 1. Create the app module (`defineApp`, `explorerApp`, `browserApp`, or `gameApp`).
 * 2. Import it and append to `APPS` below.
 * 3. If it has a desktop icon: add its id to `DESKTOP_ICON_ORDER` in `appIcons.ts`
 *    (dev throws if you forget).
 * 4. If it is a game in the folder: add launcher metadata to `games/gameLauncher.ts`.
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
import snakeApp from './games/snake';
import pongApp from './games/pong';
import breakoutApp from './games/breakout';
import planeApp from './games/plane';
import minesweeperApp from './games/minesweeper';

// ---------------------------------------------------------------------------
// APPS — the canonical registry. Order here is the fallback initialZ stack
// (BASE_Z + index via appToWindowDef) when geometry.initialZ is omitted.
// Desktop icons and start menu order come from DESKTOP_ICON_ORDER in appIcons.ts.
// ---------------------------------------------------------------------------

export const APPS = [
  terminalApp,
  aboutApp,
  projectsApp,
  blogApp,
  notesApp,
  contactoApp,
  cvApp,
  gamesApp,
  snakeApp,
  pongApp,
  breakoutApp,
  planeApp,
  minesweeperApp,
  photosApp,
  startupApp,
  settingsApp,
  happyApp,
  trashApp,
  browserApp,
] as const satisfies readonly AppDefinition[];

export type AppId = (typeof APPS)[number]['id'];

/** Static registry lookup (tests and tooling). Runtime UI uses `AppContext.findApp`. */
export function findApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}

// ---------------------------------------------------------------------------
// Dynamic per-post apps
// ---------------------------------------------------------------------------

export { createPostApps, findPostBySlug } from './post/postApp';
