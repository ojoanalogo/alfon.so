import about from '../../assets/icons/paper.png?url';
import blog from '../../assets/icons/book-pencil.png?url';
import notes from '../../assets/icons/notes.png?url';
import games from '../../assets/icons/games.png?url';
import photos from '../../assets/icons/photos-folder.png?url';
import projects from '../../assets/icons/open-folder.png?url';
import settings from '../../assets/icons/settings.png?url';
import startup from '../../assets/icons/rocket.png?url';
import terminal from '../../assets/icons/terminal.png?url';
import video from '../../assets/icons/video.png?url';
// Trashcan keeps the original SVG icons.
import trashFull from '../../assets/icons/trash-full.svg?url';
import trash from '../../assets/icons/trash.svg?url';
import type { DesktopIconDefinition, DesktopIcon } from '@/config';

export const DESKTOP_ICON_URLS = {
  about,
  blog,
  notes,
  games,
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
        `[desktopIcons] Unknown icon key "${key}". Add the icon to src/assets/icons/ and register it in DESKTOP_ICON_URLS.`,
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
