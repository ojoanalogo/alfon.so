import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new CustomEvent('devfolio-theme-change', { detail: { theme } }));
}

export function readTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
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

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };
}
