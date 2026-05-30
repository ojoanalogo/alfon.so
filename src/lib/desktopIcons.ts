import about from '../assets/icons/desktop/about.svg?url';
import blog from '../assets/icons/desktop/blog.svg?url';
import classified from '../assets/icons/desktop/classified.svg?url';
import photos from '../assets/icons/desktop/photos.svg?url';
import projects from '../assets/icons/desktop/projects.svg?url';
import settings from '../assets/icons/desktop/settings.svg?url';
import startup from '../assets/icons/desktop/startup.svg?url';
import terminal from '../assets/icons/desktop/terminal.svg?url';
import trashFull from '../assets/icons/desktop/trash-full.svg?url';
import trash from '../assets/icons/desktop/trash.svg?url';
import video from '../assets/icons/desktop/video.svg?url';
import type { DesktopIconDefinition, DesktopIcon } from '../config';

export type DesktopIconUrls = Record<string, string>;

export const DESKTOP_ICON_URLS: DesktopIconUrls = {
  about,
  blog,
  classified,
  photos,
  projects,
  settings,
  startup,
  terminal,
  'trash-full': trashFull,
  trash,
  video,
};

export function resolveIconUrl(urls: DesktopIconUrls, key: string): string {
  return urls[key] ?? '';
}

export function resolveDesktopIcons(
  definitions: DesktopIconDefinition[],
  urls: DesktopIconUrls,
): DesktopIcon[] {
  return definitions.map((definition) => ({
    ...definition,
    iconSrc: resolveIconUrl(urls, definition.iconKey ?? definition.id),
  }));
}
