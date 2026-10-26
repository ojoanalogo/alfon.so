import { DESKTOP_ICON_URLS, type DesktopIconUrls, type IconKey } from './desktopIcons';

const PACK_LABELS = {
  graphite: 'Carbón',
  cream: 'Crema',
  ocean: 'Océano',
  rose: 'Coral',
  forest: 'Bosque',
  violet: 'Violeta',
} as const;

export type IconPackId = 'classic' | keyof typeof PACK_LABELS;

const packIcons = import.meta.glob<string>('../../assets/icons/packs/*/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

function urlsForPack(packId: string): DesktopIconUrls {
  const urls: DesktopIconUrls = { ...DESKTOP_ICON_URLS };
  for (const key of Object.keys(DESKTOP_ICON_URLS) as IconKey[]) {
    const match = Object.entries(packIcons).find(([filePath]) =>
      filePath.endsWith(`/packs/${packId}/${key}.png`),
    );
    if (match) urls[key] = match[1];
  }
  return urls;
}

export interface IconPack {
  id: IconPackId;
  label: string;
  urls: DesktopIconUrls;
}

export const ICON_PACKS: IconPack[] = [
  { id: 'classic', label: 'Clásico', urls: { ...DESKTOP_ICON_URLS } },
  ...(Object.keys(PACK_LABELS) as Array<keyof typeof PACK_LABELS>).map((id) => ({
    id,
    label: PACK_LABELS[id],
    urls: urlsForPack(id),
  })),
];

export const DEFAULT_ICON_PACK_ID: IconPackId = 'classic';

const PREVIEW_KEYS = ['projects', 'terminal', 'notes', 'contacto'] as const;

export function iconPackPreviewUrls(pack: IconPack): string[] {
  return PREVIEW_KEYS.map((key) => pack.urls[key]).filter((url): url is string => Boolean(url));
}

export function resolveIconPackId(stored: string | null): IconPackId {
  const match = ICON_PACKS.find((pack) => pack.id === stored);
  return match?.id ?? DEFAULT_ICON_PACK_ID;
}
