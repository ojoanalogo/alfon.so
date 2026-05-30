/**
 * The app registry.
 *
 * Adding a new app: append one `defineApp / defineBrowserApp / defineExplorerApp /
 * defineSettingsApp / defineTerminalApp / defineCustomApp` call to APPS. The
 * runtime derives window defs, desktop icons, taskbar metadata, and the start
 * menu from this list — there is no second place to update.
 *
 * To make an app that's a "sub-class of browser" (e.g. a fixed-URL site
 * launcher), use `defineBrowserApp({ id, title, initialUrl })`.
 */

import { createElement } from 'react';
import {
  defineBrowserApp,
  defineCustomApp,
  defineExplorerApp,
  defineSettingsApp,
  defineTerminalApp,
  type AppDefinition,
  type SettingsSection,
} from './defineApp';
import { cascadeOffset } from './cascadePositions';
import AboutContent from './contents/AboutContent';
import ClassifiedContent from './contents/ClassifiedContent';
import { CLASSIFIED_DOCS } from './contents/classifiedDocs';
import HappyContent from './contents/HappyContent';
import PostContent from './contents/PostContent';
import TrashFooter from './contents/TrashFooter';
import AppearanceSection from '../settings/AppearanceSection';
import GridSettingsSection from '../settings/GridSettingsSection';
import { PROJECTS, TRASH_JUNK } from './data';
import { BROWSER_APP_ID, postSlugFromWindowId, postWindowId } from './postWindow';
import type { ListItem, BlogPostSummary } from '../../../../types/desktop';

// ---------------------------------------------------------------------------
// Static apps
// ---------------------------------------------------------------------------

const terminalApp = defineTerminalApp({
  id: 'terminal',
  title: 'terminal — guest@alfon.so',
  geometry: { defaultX: 88, defaultY: 36, defaultWidth: 560, defaultHeight: 380, initialZ: 10 },
  desktopIcon: { label: 'terminal.sh', tooltip: 'Terminal' },
  taskbarTooltip: 'Terminal',
});

const aboutApp = defineCustomApp({
  id: 'about',
  title: 'about.txt',
  iconKey: 'about',
  render: () => createElement(AboutContent),
  geometry: {
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 576,
    minWidth: 520,
    initialZ: 11,
    center: true,
    defaultOpen: true,
  },
  desktopIcon: { label: 'about.txt', tooltip: 'Mi info' },
  taskbarTooltip: 'about.txt',
});

const projectsApp = defineExplorerApp({
  id: 'projects',
  title: 'proyectos',
  iconKey: 'projects',
  items: () =>
    PROJECTS.map<ListItem>((project) => ({
      id: project.title,
      label: project.title,
      kind: 'Proyecto',
      graphic: project.icon,
      title: project.description,
      disabled: !project.link,
    })),
  onActivate: (id, ctx) => {
    const project = PROJECTS.find((entry) => entry.title === id);
    if (project?.link) ctx.onOpenLink(project.link);
  },
  geometry: { defaultX: 128, defaultY: 64, defaultWidth: 576, initialZ: 12 },
  desktopIcon: { label: 'proyectos', tooltip: 'Mis proyectos' },
  taskbarTooltip: 'Proyectos',
});

const blogApp = defineExplorerApp({
  id: 'blog',
  title: '✍️ últimos posts',
  iconKey: 'blog',
  defaultMode: 'list',
  items: (ctx) =>
    ctx.posts.map<ListItem>((post) => ({
      id: post.slug,
      label: post.title,
      kind: 'Post',
      iconSrc: ctx.iconUrls.blog,
      title: post.description ?? post.title,
    })),
  onActivate: (id, ctx) => ctx.onOpenPost(id),
  geometry: { defaultX: 160, defaultY: 96, defaultWidth: 576, initialZ: 13 },
  desktopIcon: { label: 'blog.sql', tooltip: 'Mis posts' },
  taskbarTooltip: 'Blog',
});

const area51App = defineCustomApp({
  id: 'area51',
  title: 'area51.pdf — CLASIFICADO',
  iconKey: 'classified',
  render: () => createElement(ClassifiedContent, { doc: CLASSIFIED_DOCS.area51! }),
  geometry: { defaultX: 220, defaultY: 120, defaultWidth: 560, initialZ: 14 },
  desktopIcon: false,
  startMenu: false,
});

const ovnisApp = defineCustomApp({
  id: 'ovnis',
  title: 'ovnis.pdf — SOLO LECTURA',
  iconKey: 'classified',
  render: () => createElement(ClassifiedContent, { doc: CLASSIFIED_DOCS.ovnis! }),
  geometry: { defaultX: 250, defaultY: 150, defaultWidth: 560, initialZ: 15 },
  desktopIcon: false,
  startMenu: false,
});

const happyApp = defineCustomApp({
  id: 'happy',
  title: 'no_abrir.mp4',
  iconKey: 'video',
  render: () => createElement(HappyContent),
  geometry: { defaultX: 280, defaultY: 84, defaultWidth: 600, initialZ: 16 },
  desktopIcon: false,
  startMenu: false,
});

const trashApp = defineExplorerApp({
  id: 'trash',
  title: '🗑 Papelera',
  iconKey: 'trash',
  items: (ctx) => {
    const junk = TRASH_JUNK.map<ListItem>((entry) => ({
      id: entry.id,
      label: entry.name,
      kind: entry.kind,
      graphic: entry.icon,
      iconSrc: entry.iconKey ? ctx.iconUrls[entry.iconKey] : undefined,
      disabled: !entry.windowId,
    }));
    const deleted = ctx.trash.items.map<ListItem>((item) => ({
      id: item.id,
      label: item.label,
      kind: 'Icono eliminado',
      iconSrc: item.iconSrc,
    }));
    return [...junk, ...deleted];
  },
  onActivate: (id, ctx) => {
    const junk = TRASH_JUNK.find((entry) => entry.id === id);
    if (junk?.windowId) {
      ctx.trash.onOpenFile(junk.windowId);
      return;
    }
    if (ctx.trash.items.some((item) => item.id === id)) {
      ctx.trash.onRestore(id);
    }
  },
  footer: (ctx) => createElement(TrashFooter, { trash: ctx.trash }),
  geometry: { defaultX: 320, defaultY: 140, defaultWidth: 420, initialZ: 17 },
  desktopIcon: false,
  startMenu: false,
});

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'apariencia', title: 'Apariencia', render: () => createElement(AppearanceSection) },
  { id: 'escritorio', title: 'Escritorio', render: () => createElement(GridSettingsSection) },
];

const settingsApp = defineSettingsApp({
  id: 'settings',
  title: 'ajustes',
  sections: SETTINGS_SECTIONS,
  geometry: {
    defaultX: 240,
    defaultY: 72,
    defaultWidth: 580,
    defaultHeight: 420,
    initialZ: 18,
  },
  desktopIcon: { label: 'ajustes', tooltip: 'Ajustes del escritorio' },
  taskbarTooltip: 'Ajustes',
});

const browserApp = defineBrowserApp({
  id: BROWSER_APP_ID,
  title: 'web browser',
  iconKey: 'startup',
  initialUrl: null,
  geometry: { defaultX: 180, defaultY: 80, defaultWidth: 800, initialZ: 30 },
  taskbarTooltip: 'Navegador web',
});

// "Sub-app extending browser" examples: site launchers with only the URL bar.
const photosApp = defineBrowserApp({
  id: 'photos',
  title: 'photos.jpg',
  iconKey: 'photos',
  initialUrl: 'https://ojoanalogo.com',
  hideTitle: true,
  geometry: { defaultX: 200, defaultY: 96, defaultWidth: 880, initialZ: 31 },
  desktopIcon: { label: 'photos.jpg', tooltip: 'Mi vida en fotos' },
  startMenu: { show: true },
  taskbarTooltip: 'Mi vida en fotos',
});

const startupApp = defineBrowserApp({
  id: 'startup',
  title: 'startup.sh',
  iconKey: 'startup',
  initialUrl: 'https://molecula.digital',
  hideTitle: true,
  geometry: { defaultX: 220, defaultY: 112, defaultWidth: 880, initialZ: 32 },
  desktopIcon: { label: 'startup.sh', tooltip: 'Mi startup de productos digitales' },
  startMenu: { show: true },
  taskbarTooltip: 'Molécula Digital',
});

// ---------------------------------------------------------------------------
// APPS — the canonical registry. Order here drives the start menu and the
// derived desktop icon order.
// ---------------------------------------------------------------------------

export const APPS = [
  terminalApp,
  aboutApp,
  projectsApp,
  blogApp,
  photosApp,
  startupApp,
  settingsApp,
  area51App,
  ovnisApp,
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

/**
 * One `AppDefinition` per blog post. Cascaded so windows don't overlap. The
 * registry returns these alongside `APPS` so the rest of the runtime treats
 * post windows like any other app (titles, taskbar entry, geometry).
 */
export function createPostApps(posts: BlogPostSummary[]): AppDefinition[] {
  return posts.map((post, index) => {
    const offset = cascadeOffset(index, { baseX: 180, baseY: 108, pitch: 28 });
    return defineCustomApp({
      id: postWindowId(post.slug),
      title: `${post.slug}.md`,
      iconKey: 'blog',
      render: () => createElement(PostContent, { post }),
      geometry: {
        defaultX: offset.x,
        defaultY: offset.y,
        defaultWidth: 640,
        initialZ: 20 + index,
      },
      desktopIcon: false,
      startMenu: false,
      taskbarTooltip: post.title,
    });
  });
}

export function isPostApp(id: string): boolean {
  return id.startsWith('post:');
}

export { findPostBySlug };
function findPostBySlug(posts: BlogPostSummary[], windowId: string) {
  const slug = postSlugFromWindowId(windowId);
  return posts.find((post) => post.slug === slug);
}
