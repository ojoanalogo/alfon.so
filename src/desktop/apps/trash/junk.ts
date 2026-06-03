import paper from '../../../assets/icons/paper.png?url';
import notes from '../../../assets/icons/notes.png?url';
import folder from '../../../assets/icons/folder.png?url';
import photos from '../../../assets/icons/photos-folder.png?url';
import settings from '../../../assets/icons/settings.png?url';
import video from '../../../assets/icons/video.png?url';

export interface TrashJunkItem {
  id: string;
  name: string;
  kind: string;
  /** Styled PNG url used as the list/grid icon for inert junk. */
  iconSrc: string;
  /**
   * Registry id of the app this file opens on double-click; when set, the
   * list/grid icon is taken from that app instead of `iconSrc`. Resolved via
   * `findApp` at runtime (an unknown id renders an inert, disabled item).
   */
  appId?: string;
  /** Folders show "—" for size in the list view, unless `size` is set. */
  isFolder?: boolean;
  /** Pre-formatted size override for the list view. */
  size?: string;
}

/** Permanent papelera contents — folder-style junk drawer. */
export const TRASH_JUNK: TrashJunkItem[] = [
  { id: 'area51', name: 'area51.pdf', kind: 'PDF', iconSrc: paper },
  { id: 'ovnis', name: 'ovnis.pdf', kind: 'PDF', iconSrc: paper },
  { id: 'happy', name: 'no_abrir.mp4', kind: 'Video', iconSrc: video, appId: 'happy' },
  { id: 'cv', name: 'mi_cv_final_FINAL_v7.doc', kind: 'Documento', iconSrc: paper },
  { id: 'cv-copy', name: 'mi_cv_final_FINAL_v7 (copia).doc', kind: 'Documento', iconSrc: paper },
  {
    id: 'node_modules',
    name: 'node_modules',
    kind: 'Carpeta',
    iconSrc: folder,
    isFolder: true,
    size: '1 PB',
  },
  { id: 'ideas', name: 'ideas_de_negocio.txt', kind: 'Texto', iconSrc: notes },
  { id: 'screenshot', name: 'captura_muy_importante.png', kind: 'Imagen', iconSrc: photos },
  {
    id: 'zip',
    name: 'backup_backup.zip',
    kind: 'Carpeta comprimida',
    iconSrc: folder,
    isFolder: true,
  },
  { id: 'exe', name: 'totally_not_a_virus.exe', kind: 'Aplicación', iconSrc: settings },
  { id: 'todo', name: 'hacer_algo_productivo.md', kind: 'Markdown', iconSrc: notes },
  { id: 'readme', name: 'leer_esto.txt', kind: 'Texto', iconSrc: paper },
];
