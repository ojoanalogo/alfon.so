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
} from '../settings/desktopColors';
import { useTheme } from '../useTheme';
import {
  iconLabelToneFromLuminance,
  resolveSurfaceLuminance,
  sampleWallpaperLuminance,
  type IconLabelTone,
} from '../utils/iconLabelTone';
import type { WallpaperOption } from '../types';
import {
  defaultWallpaperId,
  DEFAULT_WALLPAPER_ID,
  resolveWallpaperId,
} from '../../../../config/wallpapers';

const WALLPAPER_STORAGE_KEY = 'devfolio.wallpaper';
const COLOR_STORAGE_KEY = 'devfolio.desktop-color';

export type WallpaperStatus = 'loading' | 'ready' | 'error';

export { DEFAULT_WALLPAPER_ID };

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
  setWallpaper: (id: string | null) => void;
  setBackgroundColor: (id: string) => void;
}

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

type WallpaperPreference = 'unset' | 'color' | string;

function readWallpaperPreference(): WallpaperPreference {
  try {
    if (!localStorage.getItem(WALLPAPER_STORAGE_KEY)) return 'unset';
    const stored = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (stored === '') return 'color';
    return stored ?? 'unset';
  } catch {
    return 'unset';
  }
}

function readStoredBackgroundColorId(): string | null {
  try {
    return localStorage.getItem(COLOR_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistWallpaperId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
    } else {
      localStorage.setItem(WALLPAPER_STORAGE_KEY, '');
    }
  } catch {
    /* ignore quota / privacy mode */
  }
}

function persistBackgroundColorId(id: string) {
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, id);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function WallpaperProvider({
  wallpapers,
  children,
}: {
  wallpapers: WallpaperOption[];
  children: ReactNode;
}) {
  const [wallpaperId, setWallpaperId] = useState<string | null>(null);
  const [backgroundColorId, setBackgroundColorId] = useState('default');
  const [status, setStatus] = useState<WallpaperStatus>('ready');
  const [hydrated, setHydrated] = useState(false);
  const [iconLabelTone, setIconLabelTone] = useState<IconLabelTone>('dark');
  const { theme } = useTheme();

  useEffect(() => {
    const availableIds = new Set(wallpapers.map((wallpaper) => wallpaper.id));
    const wallpaperPreference = readWallpaperPreference();

    let nextWallpaperId: string | null;
    if (wallpaperPreference === 'unset') {
      nextWallpaperId = defaultWallpaperId(availableIds);
    } else if (wallpaperPreference === 'color') {
      nextWallpaperId = null;
    } else {
      nextWallpaperId = resolveWallpaperId(wallpaperPreference, availableIds);
      if (nextWallpaperId !== wallpaperPreference && nextWallpaperId) {
        persistWallpaperId(nextWallpaperId);
      }
      if (!nextWallpaperId) {
        persistWallpaperId(null);
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

    setWallpaperId(nextWallpaperId);
    setBackgroundColorId(nextColorId);
    setHydrated(true);
  }, [wallpapers]);

  const activeWallpaper = useMemo(() => {
    if (!wallpaperId) return null;
    return wallpapers.find((wallpaper) => wallpaper.id === wallpaperId) ?? null;
  }, [wallpaperId, wallpapers]);

  const desktopBackgroundColor = useMemo(
    () => resolveDesktopColorValue(backgroundColorId),
    [backgroundColorId],
  );

  useEffect(() => {
    if (!hydrated) return;

    if (!activeWallpaper) {
      setStatus('ready');
      return;
    }

    setStatus('loading');
    const image = new Image();
    image.onload = () => setStatus('ready');
    image.onerror = () => setStatus('error');
    image.src = activeWallpaper.src;
  }, [activeWallpaper, hydrated]);

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

  const setWallpaper = useCallback(
    (id: string | null) => {
      if (id !== null && !wallpapers.some((wallpaper) => wallpaper.id === id)) return;
      setWallpaperId(id);
      persistWallpaperId(id);
      if (!id) {
        setStatus('ready');
      }
    },
    [wallpapers],
  );

  const setBackgroundColor = useCallback((id: string) => {
    if (!DESKTOP_COLORS.some((color) => color.id === id)) return;
    setBackgroundColorId(id);
    persistBackgroundColorId(id);
    setWallpaperId(null);
    persistWallpaperId(null);
    setStatus('ready');
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
      setWallpaper,
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
      setWallpaper,
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
