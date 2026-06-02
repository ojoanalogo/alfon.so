export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

const STORAGE_KEY = 'theme';
const THEME_CHANGE = 'devfolio-theme-change';

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private mode */
  }
  return 'system';
}

export function getEffectiveTheme(): ThemeMode {
  const preference = getThemePreference();
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeToDocument(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function syncThemePreferenceAttribute(preference: ThemePreference) {
  document.documentElement.dataset.themePreference = preference;
}

function dispatchThemeChange() {
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE, {
      detail: {
        preference: getThemePreference(),
        theme: getEffectiveTheme(),
      },
    }),
  );
}

export function applyThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    /* private mode */
  }

  applyThemeToDocument(getEffectiveTheme());
  syncThemePreferenceAttribute(preference);
  dispatchThemeChange();
}

/** Manual override; clears `system` and writes light/dark to localStorage. */
export function toggleThemePreference() {
  const effective = getEffectiveTheme();
  applyThemePreference(effective === 'dark' ? 'light' : 'dark');
}

/** @deprecated Use getEffectiveTheme — kept for call sites that expect readTheme. */
export function readTheme(): ThemeMode {
  return getEffectiveTheme();
}

export function syncThemeFromPreference() {
  applyThemeToDocument(getEffectiveTheme());
  syncThemePreferenceAttribute(getThemePreference());
  dispatchThemeChange();
}

export function attachSystemThemeListener(onSystemChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getThemePreference() !== 'system') return;
    applyThemeToDocument(getEffectiveTheme());
    onSystemChange();
    dispatchThemeChange();
  };

  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}

let themeRuntimeInitialized = false;

/** One global listener: OS theme changes while preference is `system`. */
export function ensureThemeRuntime() {
  if (themeRuntimeInitialized || typeof window === 'undefined') return;
  themeRuntimeInitialized = true;

  attachSystemThemeListener(() => {
    updateThemeToggleIcons();
  });

  window.addEventListener(THEME_CHANGE, updateThemeToggleIcons);
}

export function updateThemeToggleIcons() {
  const preference = document.documentElement.dataset.themePreference ?? 'system';
  const isDark = document.documentElement.classList.contains('dark');
  const followSystem = preference === 'system';

  document.querySelectorAll('.theme-toggle .system-icon').forEach((icon) => {
    icon.classList.toggle('hidden', !followSystem);
  });
  document.querySelectorAll('.theme-toggle .sun-icon').forEach((icon) => {
    icon.classList.toggle('hidden', followSystem || isDark);
  });
  document.querySelectorAll('.theme-toggle .moon-icon').forEach((icon) => {
    icon.classList.toggle('hidden', followSystem || !isDark);
  });
}

/** Astro header toggle only — React taskbar uses ThemeContext.onClick. */
export function setupThemeToggles() {
  document.querySelectorAll('.theme-toggle').forEach((button) => {
    if (button.getAttribute('data-theme-bound') === 'true') return;
    button.setAttribute('data-theme-bound', 'true');
    button.addEventListener('click', () => {
      toggleThemePreference();
      updateThemeToggleIcons();
    });
  });
  updateThemeToggleIcons();
}

export function bootstrapThemeUi() {
  ensureThemeRuntime();
  syncThemeFromPreference();
  setupThemeToggles();
}
