// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'alfon.so';
export const SITE_DESCRIPTION = 'Bienvenido a mi terrenito en internet';

export interface NavLink {
  title: string;
  id?: string;
  url?: string;
  redirect?: string;
  tooltip?: string;
}

export const NAV_LINKS: NavLink[] = [
  {
    title: 'index.html',
    id: 'home',
    url: '/',
    tooltip: 'Inicio',
  },
  {
    title: 'blog.sql',
    id: 'blog',
    url: '/blog',
    tooltip: 'Mis posts',
  },
  {
    title: 'photos.jpg',
    redirect: 'https://ojoanalogo.com',
    tooltip: 'Mi vida en fotos',
  },
  {
    title: 'startup.sh',
    redirect: 'https://molecula.digital',
    tooltip: 'Mi startup de productos digitales',
  },
];

export type DesktopIconKind = 'window' | 'link';

export interface DesktopIconDefinition {
  id: string;
  label: string;
  /** Asset filename stem in src/assets/icons/desktop. Defaults to id. */
  iconKey?: string;
  kind: DesktopIconKind;
  windowId?: string;
  href?: string;
  external?: boolean;
  defaultOpen?: boolean;
  tooltip?: string;
}

export interface DesktopIcon extends DesktopIconDefinition {
  iconSrc: string;
}

export const DESKTOP_ICON_DEFS: DesktopIconDefinition[] = [
  {
    id: 'terminal',
    label: 'terminal.sh',
    kind: 'window',
    windowId: 'terminal',
    tooltip: 'Terminal',
  },
  {
    id: 'about',
    label: 'about.txt',
    kind: 'window',
    windowId: 'about',
    defaultOpen: true,
    tooltip: 'Mi info',
  },
  {
    id: 'projects',
    label: 'proyectos',
    kind: 'window',
    windowId: 'projects',
    tooltip: 'Mis proyectos',
  },
  {
    id: 'blog',
    label: 'blog.sql',
    kind: 'window',
    windowId: 'blog',
    tooltip: 'Mis posts',
  },
  {
    id: 'settings',
    label: 'ajustes',
    kind: 'window',
    windowId: 'settings',
    tooltip: 'Ajustes del escritorio',
  },
  {
    id: 'photos',
    label: 'photos.jpg',
    kind: 'link',
    href: 'https://ojoanalogo.com',
    external: true,
    tooltip: 'Mi vida en fotos',
  },
  {
    id: 'startup',
    label: 'startup.sh',
    kind: 'link',
    href: 'https://molecula.digital',
    external: true,
    tooltip: 'Mi startup de productos digitales',
  },
];

export type SocialPlatform = 'twitter' | 'github' | 'instagram' | 'linkedin';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'twitter',
    url: 'https://twitter.com/ojoanalogo/',
    label: 'X',
  },
  {
    platform: 'github',
    url: 'https://github.com/ojoanalogo/',
    label: 'Github',
  },
  {
    platform: 'instagram',
    url: 'https://instagram.com/ojo.analogo/',
    label: 'Instagram',
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/in/ojoanalogo',
    label: 'Linkedin',
  },
];
