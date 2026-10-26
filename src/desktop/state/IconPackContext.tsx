import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import {
  DEFAULT_ICON_PACK_ID,
  ICON_PACKS,
  resolveIconPackId,
  type IconPack,
  type IconPackId,
} from '@desktop/lib/iconPacks';
import { readStorageItem, removeStorageItem, STORAGE_KEYS, writeStorageItem } from '@/lib/storage';

interface IconPackContextValue {
  packId: IconPackId;
  packs: IconPack[];
  urls: DesktopIconUrls;
  setPackId: (id: string) => void;
}

const IconPackContext = createContext<IconPackContextValue | null>(null);

export function IconPackProvider({
  classicUrls,
  children,
}: {
  classicUrls: DesktopIconUrls;
  children: ReactNode;
}) {
  const packs = useMemo(
    () => ICON_PACKS.map((pack) => (pack.id === 'classic' ? { ...pack, urls: classicUrls } : pack)),
    [classicUrls],
  );
  const [packId, setPackIdState] = useState<IconPackId>(() =>
    resolveIconPackId(readStorageItem(STORAGE_KEYS.iconPack)),
  );

  useEffect(() => {
    function syncFromStorage() {
      setPackIdState(resolveIconPackId(readStorageItem(STORAGE_KEYS.iconPack)));
    }
    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const setPackId = useCallback((id: string) => {
    const next = resolveIconPackId(id);
    if (next === DEFAULT_ICON_PACK_ID) {
      removeStorageItem(STORAGE_KEYS.iconPack);
    } else {
      writeStorageItem(STORAGE_KEYS.iconPack, next);
    }
    setPackIdState(next);
  }, []);

  const urls = packs.find((pack) => pack.id === packId)?.urls ?? classicUrls;

  const value = useMemo(
    () => ({
      packId,
      packs,
      urls,
      setPackId,
    }),
    [packId, packs, urls, setPackId],
  );

  return <IconPackContext.Provider value={value}>{children}</IconPackContext.Provider>;
}

export function useIconPack(): IconPackContextValue {
  const context = useContext(IconPackContext);
  if (!context) {
    throw new Error('useIconPack must be used within IconPackProvider');
  }
  return context;
}
