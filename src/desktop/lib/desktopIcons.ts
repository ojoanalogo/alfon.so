import about from '../../assets/icons/desktop/about.svg?url';
import blog from '../../assets/icons/desktop/blog.svg?url';
import notes from '../../assets/icons/desktop/notes.svg?url';
import games from '../../assets/icons/desktop/games.svg?url';
import classified from '../../assets/icons/desktop/classified.svg?url';
import photos from '../../assets/icons/desktop/photos.svg?url';
import projects from '../../assets/icons/desktop/projects.svg?url';
import settings from '../../assets/icons/desktop/settings.svg?url';
import startup from '../../assets/icons/desktop/startup.svg?url';
import terminal from '../../assets/icons/desktop/terminal.svg?url';
import trashFull from '../../assets/icons/desktop/trash-full.svg?url';
import trash from '../../assets/icons/desktop/trash.svg?url';
import video from '../../assets/icons/desktop/video.svg?url';
import type { DesktopIconDefinition, DesktopIcon } from '@/config';

export const DESKTOP_ICON_URLS = {
  about,
  blog,
  notes,
  games,
  classified,
  photos,
  projects,
  settings,
  startup,
  terminal,
  'trash-full': trashFull,
  trash,
  video,
} as const;

export type IconKey = keyof typeof DESKTOP_ICON_URLS;
export type DesktopIconUrls = Record<string, string>;

export function resolveIconUrl(urls: DesktopIconUrls, key: string): string {
  const url = urls[key];
  if (!url) {
    if (import.meta.env.DEV) {
      throw new Error(
        `[desktopIcons] Unknown icon key "${key}". Add the SVG to src/assets/icons/desktop/ and register it in DESKTOP_ICON_URLS.`,
      );
    }
    return '';
  }
  return url;
}

export function resolveDesktopIcons(
  definitions: DesktopIconDefinition[],
  urls: DesktopIconUrls,
): DesktopIcon[] {
  return definitions.map((definition) => ({
    ...definition,
    iconSrc: definition.iconUrl ?? resolveIconUrl(urls, definition.iconKey ?? definition.id),
  }));
}
