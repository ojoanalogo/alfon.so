import type { ReactNode } from 'react';

/**
 * Static, content-only data for individual apps. Pulled out of the app
 * definitions so the registry stays a thin list of `defineApp()` calls.
 */

export interface ProjectEntry {
  title: string;
  description: string;
  link: string;
  icon: string;
}

export const PROJECTS: ProjectEntry[] = [
  {
    title: 'sofia',
    description: 'registra tus gastos con un solo mensaje de WhatsApp.',
    link: 'https://sofinanzas.mx',
    icon: '💸',
  },
  {
    title: 'terminus',
    description:
      'plantilla de Astro para sitios web personales, inspirada en una terminal de comandos.',
    link: 'https://github.com/ojoanalogo/terminus-astro-template',
    icon: '💻',
  },
  {
    title: 'hilitos',
    description: 'marketplaces para pequeños emprendedores, como Etsy.',
    link: 'https://hilitos.app',
    icon: '🧵',
  },
  {
    title: 'dotfiles',
    description: 'dale un vistazo a la configuración de mi equipo personal.',
    link: 'https://github.com/ojoanalogo/dotfiles',
    icon: '🔧',
  },
  {
    title: 'wawa',
    description: 'framework para construir flujos conversacionales en whatsapp.',
    icon: '💬',
    link: '',
  },
];

export const TECH_STACK: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  'node.js': 'Node',
  astro: 'This site is built on astro',
  python: 'Python',
  sql: 'SQL',
  'claude-code': 'Best tool ever',
  'next.js': 'Next.js',
  aws: 'AWS',
  gcp: 'GCP',
  docker: 'Docker',
  tf: 'Terraform',
};

export interface ClassifiedDoc {
  code: string;
  heading: string;
  file: string;
  intro: ReactNode;
  bullets: ReactNode[];
}

export interface TrashJunkItem {
  id: string;
  name: string;
  kind: string;
  icon: string;
  /** Window opened on double-click; omit for inert junk. */
  windowId?: string;
  /** Icon key for the list/grid view (omit for emoji-only). */
  iconKey?: string;
}

/** Permanent papelera contents — folder-style junk drawer. */
export const TRASH_JUNK: TrashJunkItem[] = [
  { id: 'area51', name: 'area51.pdf', kind: 'PDF', icon: '📄', windowId: 'area51', iconKey: 'classified' },
  { id: 'ovnis', name: 'ovnis.pdf', kind: 'PDF', icon: '📄', windowId: 'ovnis', iconKey: 'classified' },
  { id: 'happy', name: 'no_abrir.mp4', kind: 'Video', icon: '🎬', windowId: 'happy', iconKey: 'video' },
  { id: 'cv', name: 'mi_cv_final_FINAL_v7.doc', kind: 'Documento', icon: '📄' },
  { id: 'cv-copy', name: 'mi_cv_final_FINAL_v7 (copia).doc', kind: 'Documento', icon: '📄' },
  { id: 'node_modules', name: 'node_modules', kind: 'Carpeta', icon: '📁' },
  { id: 'ideas', name: 'ideas_de_negocio.txt', kind: 'Texto', icon: '📝' },
  { id: 'screenshot', name: 'captura_muy_importante.png', kind: 'Imagen', icon: '🖼️' },
  { id: 'zip', name: 'backup_backup.zip', kind: 'Carpeta comprimida', icon: '🗜️' },
  { id: 'exe', name: 'totally_not_a_virus.exe', kind: 'Aplicación', icon: '⚙️' },
  { id: 'todo', name: 'hacer_algo_productivo.md', kind: 'Markdown', icon: '📝' },
  { id: 'readme', name: 'leer_esto.txt', kind: 'Texto', icon: '📄' },
];

export function getTrashWindowMeta(iconUrls: Record<string, string>) {
  return TRASH_JUNK.filter(
    (entry): entry is TrashJunkItem & { windowId: string; iconKey: string } =>
      Boolean(entry.windowId && entry.iconKey),
  ).map((entry) => ({
    windowId: entry.windowId,
    label: entry.name,
    iconSrc: iconUrls[entry.iconKey] ?? '',
  }));
}
