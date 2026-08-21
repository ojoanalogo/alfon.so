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
  applyThemePreference,
  ensureThemeRuntime,
  getEffectiveTheme,
  getThemePreference,
  syncThemeFromPreference,
  THEME_CHANGE,
  toggleThemePreference,
  type ThemeMode,
  type ThemePreference,
} from '@/lib/theme';

export type { ThemeMode, ThemePreference };

export interface ThemeContextValue {
  /** Stored preference; `system` follows OS light/dark. */
  preference: ThemePreference;
  /** Resolved light/dark applied to the document. */
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSnapshot() {
  return {
    preference: getThemePreference(),
    theme: getEffectiveTheme(),
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ preference, theme }, setSnapshot] = useState(readSnapshot);

  useEffect(() => {
    function syncFromDocument() {
      setSnapshot(readSnapshot());
    }

    ensureThemeRuntime();
    syncThemeFromPreference();
    syncFromDocument();
    window.addEventListener(THEME_CHANGE, syncFromDocument);

    return () => {
      window.removeEventListener(THEME_CHANGE, syncFromDocument);
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    applyThemePreference(next);
    setSnapshot(readSnapshot());
  }, []);

  const toggleTheme = useCallback(() => {
    toggleThemePreference();
    setSnapshot(readSnapshot());
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [preference, theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
