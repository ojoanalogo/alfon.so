import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type GridIconSize = 'small' | 'medium' | 'large';
export type GridSpacing = 'compact' | 'normal' | 'roomy';
export type GridSortBy = 'name' | 'kind';

export interface GridSettings {
  iconSize: GridIconSize;
  spacing: GridSpacing;
  sortBy: GridSortBy;
  /** When set, overrides the auto-detected icon label color (`auto` lets WallpaperContext decide). */
  labelTone: 'auto' | 'light' | 'dark';
}

const DEFAULT_SETTINGS: GridSettings = {
  iconSize: 'medium',
  spacing: 'normal',
  sortBy: 'name',
  labelTone: 'auto',
};

const STORAGE_KEY = 'devfolio.grid-settings';

function readPersistedSettings(): GridSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GridSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface GridSettingsContextValue {
  settings: GridSettings;
  setIconSize: (size: GridIconSize) => void;
  setSpacing: (spacing: GridSpacing) => void;
  setSortBy: (sortBy: GridSortBy) => void;
  setLabelTone: (tone: GridSettings['labelTone']) => void;
  reset: () => void;
}

const GridSettingsContext = createContext<GridSettingsContextValue | null>(null);

export function GridSettingsProvider({ children }: { children: ReactNode }) {
  // Lazy initializer reads localStorage once; the desktop tree is client-only,
  // so there's no SSR mismatch to worry about.
  const [settings, setSettings] = useState<GridSettings>(readPersistedSettings);

  const persist = useCallback((next: GridSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy mode */
    }
  }, []);

  const setIconSize = useCallback(
    (iconSize: GridIconSize) => persist({ ...settings, iconSize }),
    [persist, settings],
  );
  const setSpacing = useCallback(
    (spacing: GridSpacing) => persist({ ...settings, spacing }),
    [persist, settings],
  );
  const setSortBy = useCallback(
    (sortBy: GridSortBy) => persist({ ...settings, sortBy }),
    [persist, settings],
  );
  const setLabelTone = useCallback(
    (labelTone: GridSettings['labelTone']) => persist({ ...settings, labelTone }),
    [persist, settings],
  );
  const reset = useCallback(() => persist(DEFAULT_SETTINGS), [persist]);

  const value = useMemo(
    () => ({ settings, setIconSize, setSpacing, setSortBy, setLabelTone, reset }),
    [settings, setIconSize, setSpacing, setSortBy, setLabelTone, reset],
  );

  return <GridSettingsContext.Provider value={value}>{children}</GridSettingsContext.Provider>;
}

export function useGridSettings(): GridSettingsContextValue {
  const ctx = useContext(GridSettingsContext);
  if (!ctx) throw new Error('useGridSettings must be used within GridSettingsProvider');
  return ctx;
}

/** Pixel sizes derived from the qualitative `iconSize`. */
export const ICON_SIZE_PX: Record<GridIconSize, number> = {
  small: 24,
  medium: 32,
  large: 48,
};
