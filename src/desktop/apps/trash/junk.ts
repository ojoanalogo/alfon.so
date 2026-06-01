export interface TrashJunkItem {
  id: string;
  name: string;
  kind: string;
  icon: string;
  /**
   * Registry id of the app this file opens on double-click; the list/grid icon
   * is taken from that app. Resolved via `findApp` at runtime (an unknown id
   * renders an inert, disabled item). Omit for inert junk (emoji only).
   */
  appId?: string;
  /** Folders show "—" for size in the list view. */
  isFolder?: boolean;
}

/** Permanent papelera contents — folder-style junk drawer. */
export const TRASH_JUNK: TrashJunkItem[] = [
  { id: 'area51', name: 'area51.pdf', kind: 'PDF', icon: '📄', appId: 'area51' },
  { id: 'ovnis', name: 'ovnis.pdf', kind: 'PDF', icon: '📄', appId: 'ovnis' },
  { id: 'happy', name: 'no_abrir.mp4', kind: 'Video', icon: '🎬', appId: 'happy' },
  { id: 'cv', name: 'mi_cv_final_FINAL_v7.doc', kind: 'Documento', icon: '📄' },
  { id: 'cv-copy', name: 'mi_cv_final_FINAL_v7 (copia).doc', kind: 'Documento', icon: '📄' },
  { id: 'node_modules', name: 'node_modules', kind: 'Carpeta', icon: '📁', isFolder: true },
  { id: 'ideas', name: 'ideas_de_negocio.txt', kind: 'Texto', icon: '📝' },
  { id: 'screenshot', name: 'captura_muy_importante.png', kind: 'Imagen', icon: '🖼️' },
  { id: 'zip', name: 'backup_backup.zip', kind: 'Carpeta comprimida', icon: '🗜️', isFolder: true },
  { id: 'exe', name: 'totally_not_a_virus.exe', kind: 'Aplicación', icon: '⚙️' },
  { id: 'todo', name: 'hacer_algo_productivo.md', kind: 'Markdown', icon: '📝' },
  { id: 'readme', name: 'leer_esto.txt', kind: 'Texto', icon: '📄' },
];
