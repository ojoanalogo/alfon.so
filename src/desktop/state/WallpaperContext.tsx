import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { readStorageItem, writeStorageItem, STORAGE_KEYS } from '@/lib/storage';
import {
  DESKTOP_COLORS,
  resolveDesktopColorValue,
  type DesktopColorOption,
} from '../lib/desktopColors';
import { DESKTOP_PATTERNS, resolvePatternId } from '../lib/desktopPatterns';
import { useTheme } from './ThemeContext';
import {
  iconLabelToneFromLuminance,
  resolveSurfaceLuminance,
  sampleWallpaperLuminance,
  type IconLabelTone,
} from '../lib/iconLabelTone';
import type { DesktopPatternOption, WallpaperOption } from '../types';
import { resolveWallpaperId } from '@/config/wallpapers';

export type WallpaperStatus = 'loading' | 'ready' | 'error';

interface WallpaperContextValue {
  wallpapers: WallpaperOption[];
  desktopColors: DesktopColorOption[];
  desktopPatterns: DesktopPatternOption[];
  wallpaperId: string | null;
  patternId: string | null;
  backgroundColorId: string;
  activeWallpaper: WallpaperOption | null;
  activePattern: DesktopPatternOption | null;
  desktopBackgroundColor: string;
  status: WallpaperStatus;
  iconLabelTone: IconLabelTone;
  bootContentReady: boolean;
  setWallpaper: (id: string | null) => void;
  setPattern: (id: string | null) => void;
  setBackgroundColor: (id: string) => void;
}

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

type WallpaperPreference = 'unset' | 'color' | string;

function readWallpaperPreference(): WallpaperPreference {
  const stored = readStorageItem(STORAGE_KEYS.wallpaper);
  if (stored === null) return 'unset';
  if (stored === '') return 'color';
  return stored;
}

function readStoredBackgroundColorId(): string | null {
  return readStorageItem(STORAGE_KEYS.desktopColor);
}

function readStoredPatternId(): string | null {
  return readStorageItem(STORAGE_KEYS.desktopPattern);
}

function persistWallpaperId(id: string | null) {
  if (id) {
    writeStorageItem(STORAGE_KEYS.wallpaper, id);
  } else {
    writeStorageItem(STORAGE_KEYS.wallpaper, '');
  }
}

function persistBackgroundColorId(id: string) {
  writeStorageItem(STORAGE_KEYS.desktopColor, id);
}

function persistPatternId(id: string | null) {
  if (id) {
    writeStorageItem(STORAGE_KEYS.desktopPattern, id);
  } else {
    writeStorageItem(STORAGE_KEYS.desktopPattern, '');
  }
}

function resolveStoredPreferences(wallpapers: WallpaperOption[]) {
  const availableWallpaperIds = new Set(wallpapers.map((wallpaper) => wallpaper.id));
  const availablePatternIds = new Set(DESKTOP_PATTERNS.map((pattern) => pattern.id));
  const wallpaperPreference = readWallpaperPreference();

  let nextWallpaperId: string | null;
  if (wallpaperPreference === 'unset' || wallpaperPreference === 'color') {
    nextWallpaperId = null;
  } else {
    nextWallpaperId = resolveWallpaperId(wallpaperPreference, availableWallpaperIds);
    if (nextWallpaperId !== wallpaperPreference) {
      persistWallpaperId(nextWallpaperId);
    }
  }

  const storedPattern = readStoredPatternId();
  let nextPatternId = resolvePatternId(
    storedPattern === '' ? null : storedPattern,
    availablePatternIds,
  );
  if (storedPattern && storedPattern !== '' && nextPatternId === null) {
    persistPatternId(null);
  }

  if (nextWallpaperId) {
    nextPatternId = null;
    if (storedPattern && storedPattern !== '') {
      persistPatternId(null);
    }
  }

  const storedColor = readStoredBackgroundColorId();
  const nextColorId =
    storedColor && DESKTOP_COLORS.some((color) => color.id === storedColor)
      ? storedColor
      : 'default';
  if (storedColor && nextColorId === 'default' && storedColor !== 'default') {
    persistBackgroundColorId('default');
  }

  return {
    wallpaperId: nextWallpaperId,
    patternId: nextPatternId,
    backgroundColorId: nextColorId,
  };
}

export function WallpaperProvider({
  wallpapers,
  children,
}: {
  wallpapers: WallpaperOption[];
  children: ReactNode;
}) {
  const [initialPreferences] = useState(() =>
    typeof window === 'undefined'
      ? {
          wallpaperId: null as string | null,
          patternId: null as string | null,
          backgroundColorId: 'default',
        }
      : resolveStoredPreferences(wallpapers),
  );
  const [wallpaperId, setWallpaperId] = useState<string | null>(initialPreferences.wallpaperId);
  const [patternId, setPatternId] = useState<string | null>(initialPreferences.patternId);
  const [backgroundColorId, setBackgroundColorId] = useState(initialPreferences.backgroundColorId);
  const [loadedWallpaper, setLoadedWallpaper] = useState<{
    id: string;
    status: 'ready' | 'error';
  } | null>(null);
  const [iconLabelTone, setIconLabelTone] = useState<IconLabelTone>('dark');
  const { theme } = useTheme();

  const hydrated = typeof window !== 'undefined';

  const activeWallpaper = useMemo(() => {
    if (!wallpaperId) return null;
    return wallpapers.find((wallpaper) => wallpaper.id === wallpaperId) ?? null;
  }, [wallpaperId, wallpapers]);

  const activePattern = useMemo(() => {
    if (!patternId || wallpaperId) return null;
    return DESKTOP_PATTERNS.find((pattern) => pattern.id === patternId) ?? null;
  }, [patternId, wallpaperId]);

  const desktopBackgroundColor = useMemo(
    () => resolveDesktopColorValue(backgroundColorId),
    [backgroundColorId],
  );

  const status = useMemo((): WallpaperStatus => {
    if (!hydrated) return 'loading';
    if (!activeWallpaper) return 'ready';
    if (loadedWallpaper?.id !== activeWallpaper.id) return 'loading';
    return loadedWallpaper.status;
  }, [hydrated, activeWallpaper, loadedWallpaper]);

  useEffect(() => {
    if (!hydrated || !activeWallpaper) return;
    if (loadedWallpaper?.id === activeWallpaper.id) return;

    let cancelled = false;
    const wallpaperIdToLoad = activeWallpaper.id;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) {
        setLoadedWallpaper({ id: wallpaperIdToLoad, status: 'ready' });
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setLoadedWallpaper({ id: wallpaperIdToLoad, status: 'error' });
      }
    };
    image.src = activeWallpaper.src;

    return () => {
      cancelled = true;
    };
  }, [activeWallpaper, hydrated, loadedWallpaper?.id]);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function resolveIconLabelTone() {
      if (activeWallpaper && status === 'ready') {
        const luminance = await sampleWallpaperLuminance(activeWallpaper.src);
        if (!cancelled) {
          setIconLabelTone(iconLabelToneFromLuminance(luminance));
        }
        return;
      }

      const luminance = resolveSurfaceLuminance(desktopBackgroundColor);
      if (!cancelled) {
        setIconLabelTone(iconLabelToneFromLuminance(luminance));
      }
    }

    void resolveIconLabelTone();

    return () => {
      cancelled = true;
    };
  }, [activeWallpaper, desktopBackgroundColor, hydrated, status, theme, activePattern]);

  const setWallpaper = useCallback(
    (id: string | null) => {
      if (id !== null && !wallpapers.some((wallpaper) => wallpaper.id === id)) return;
      setWallpaperId(id);
      persistWallpaperId(id);
      persistBackgroundColorId(backgroundColorId);
      if (id) {
        setPatternId(null);
        persistPatternId(null);
      }
      if (!id) {
        setLoadedWallpaper(null);
      }
    },
    [wallpapers, backgroundColorId],
  );

  const setPattern = useCallback((id: string | null) => {
    if (id !== null && !DESKTOP_PATTERNS.some((pattern) => pattern.id === id)) return;
    setPatternId(id);
    persistPatternId(id);
    if (id) {
      setWallpaperId(null);
      persistWallpaperId(null);
      setLoadedWallpaper(null);
    }
  }, []);

  const setBackgroundColor = useCallback((id: string) => {
    if (!DESKTOP_COLORS.some((color) => color.id === id)) return;
    setBackgroundColorId(id);
    persistBackgroundColorId(id);
    setWallpaperId(null);
    persistWallpaperId(null);
    setLoadedWallpaper(null);
  }, []);

  const bootContentReady = hydrated && !(wallpaperId !== null && status === 'loading');

  const value = useMemo(
    () => ({
      wallpapers,
      desktopColors: DESKTOP_COLORS,
      desktopPatterns: DESKTOP_PATTERNS,
      wallpaperId,
      patternId,
      backgroundColorId,
      activeWallpaper,
      activePattern,
      desktopBackgroundColor,
      status,
      iconLabelTone,
      bootContentReady,
      setWallpaper,
      setPattern,
      setBackgroundColor,
    }),
    [
      wallpapers,
      wallpaperId,
      patternId,
      backgroundColorId,
      activeWallpaper,
      activePattern,
      desktopBackgroundColor,
      status,
      iconLabelTone,
      bootContentReady,
      setWallpaper,
      setPattern,
      setBackgroundColor,
    ],
  );

  return <WallpaperContext.Provider value={value}>{children}</WallpaperContext.Provider>;
}

export function useWallpaper() {
  const context = useContext(WallpaperContext);
  if (!context) {
    throw new Error('useWallpaper must be used within WallpaperProvider');
  }
  return context;
}
