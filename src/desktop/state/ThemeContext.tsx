import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Private mode / quota — theme still applies for this session.
  }
  window.dispatchEvent(new CustomEvent('devfolio-theme-change', { detail: { theme } }));
}

export function readTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    function syncTheme() {
      setThemeState(readTheme());
    }

    syncTheme();
    window.addEventListener('devfolio-theme-change', syncTheme);
    return () => window.removeEventListener('devfolio-theme-change', syncTheme);
  }, []);

  function setTheme(next: ThemeMode) {
    applyTheme(next);
    setThemeState(next);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  const value: ThemeContextValue = {
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
