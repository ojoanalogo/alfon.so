import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DESKTOP_COLORS,
  resolveDesktopColorValue,
  type DesktopColorOption,
} from '../apps/settings/desktopColors';
import { useTheme } from './ThemeContext';
import {
  iconLabelToneFromLuminance,
  resolveSurfaceLuminance,
  sampleWallpaperLuminance,
  type IconLabelTone,
} from '../lib/iconLabelTone';
import type { WallpaperOption } from '../types';
import { defaultWallpaperId } from '@/config/wallpapers';

export type WallpaperStatus = 'loading' | 'ready' | 'error';

interface WallpaperContextValue {
  wallpapers: WallpaperOption[];
  desktopColors: DesktopColorOption[];
  wallpaperId: string | null;
  backgroundColorId: string;
  activeWallpaper: WallpaperOption | null;
  desktopBackgroundColor: string;
  status: WallpaperStatus;
  iconLabelTone: IconLabelTone;
  bootContentReady: boolean;
  setBackgroundColor: (id: string) => void;
}

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

function initialWallpaperId(wallpapers: WallpaperOption[]): string | null {
  return defaultWallpaperId(new Set(wallpapers.map((wallpaper) => wallpaper.id)));
}

export function WallpaperProvider({
  wallpapers,
  children,
}: {
  wallpapers: WallpaperOption[];
  children: ReactNode;
}) {
  const [wallpaperId, setWallpaperId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : initialWallpaperId(wallpapers),
  );
  const [backgroundColorId, setBackgroundColorId] = useState('default');
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
  }, [activeWallpaper, desktopBackgroundColor, hydrated, status, theme]);

  const setBackgroundColor = useCallback((id: string) => {
    if (!DESKTOP_COLORS.some((color) => color.id === id)) return;
    setBackgroundColorId(id);
    setLoadedWallpaper(null);
    setWallpaperId(null);
  }, []);

  const bootContentReady = hydrated && !(wallpaperId !== null && status === 'loading');

  const value = useMemo(
    () => ({
      wallpapers,
      desktopColors: DESKTOP_COLORS,
      wallpaperId,
      backgroundColorId,
      activeWallpaper,
      desktopBackgroundColor,
      status,
      iconLabelTone,
      bootContentReady,
      setBackgroundColor,
    }),
    [
      wallpapers,
      wallpaperId,
      backgroundColorId,
      activeWallpaper,
      desktopBackgroundColor,
      status,
      iconLabelTone,
      bootContentReady,
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
