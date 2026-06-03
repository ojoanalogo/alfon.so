/**
 * The app registry.
 *
 * Adding a new app: append one `defineApp / browserApp / explorerApp` call to APPS.
 * The runtime derives window defs, desktop icons, taskbar metadata, and the start
 * menu from this list — there is no second place to update.
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
import gamesApp from './games';
import snakeApp from './games/snake';
import pongApp from './games/pong';
import breakoutApp from './games/breakout';
import planeApp from './games/plane';

// ---------------------------------------------------------------------------
// APPS — the canonical registry. Order here drives the start menu and the
// derived desktop icon order.
// ---------------------------------------------------------------------------

export const APPS = [
  terminalApp,
  aboutApp,
  projectsApp,
  blogApp,
  notesApp,
  gamesApp,
  snakeApp,
  pongApp,
  breakoutApp,
  planeApp,
  photosApp,
  startupApp,
  settingsApp,
  happyApp,
  trashApp,
  browserApp,
] as const satisfies readonly AppDefinition[];

export type AppId = (typeof APPS)[number]['id'];

export function findApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}

// ---------------------------------------------------------------------------
// Dynamic per-post apps
// ---------------------------------------------------------------------------

export { createPostApps, findPostBySlug } from './post/postApp';
