import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  applyThemePreference,
  ensureThemeRuntime,
  getEffectiveTheme,
  getThemePreference,
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
    syncFromDocument();
    window.addEventListener('devfolio-theme-change', syncFromDocument);

    return () => {
      window.removeEventListener('devfolio-theme-change', syncFromDocument);
    };
  }, []);

  function setTheme(next: ThemePreference) {
    applyThemePreference(next);
    setSnapshot(readSnapshot());
  }

  function toggleTheme() {
    toggleThemePreference();
    setSnapshot(readSnapshot());
  }

  const value: ThemeContextValue = {
    preference,
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
