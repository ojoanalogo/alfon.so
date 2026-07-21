export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

const STORAGE_KEY = 'theme';
const THEME_CHANGE = 'devfolio-theme-change';

/** Absent or invalid localStorage → follow OS light/dark. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private mode */
  }
  return DEFAULT_THEME_PREFERENCE;
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
    updateThemeDropdowns();
  });

  window.addEventListener(THEME_CHANGE, updateThemeDropdowns);
}

export function updateThemeDropdowns() {
  const preference = document.documentElement.dataset.themePreference ?? 'system';
  const isDark = document.documentElement.classList.contains('dark');
  const followSystem = preference === 'system';

  document.querySelectorAll('[data-theme-dropdown]').forEach((dropdown) => {
    dropdown.querySelectorAll('.auto-icon').forEach((icon) => {
      icon.classList.toggle('hidden', !followSystem);
    });
    dropdown.querySelectorAll('.sun-icon').forEach((icon) => {
      icon.classList.toggle('hidden', followSystem || isDark);
    });
    dropdown.querySelectorAll('.moon-icon').forEach((icon) => {
      icon.classList.toggle('hidden', followSystem || !isDark);
    });

    dropdown.querySelectorAll<HTMLButtonElement>('.theme-dropdown-option').forEach((option) => {
      const selected = option.dataset.themeValue === preference;
      option.setAttribute('aria-selected', String(selected));
      option.classList.toggle('font-semibold', selected);
      option.classList.toggle('text-primary', selected);
    });
  });
}

function closeThemeDropdowns(except?: Element) {
  document
    .querySelectorAll('[data-theme-dropdown][data-theme-bound="true"]')
    .forEach((dropdown) => {
      if (dropdown === except) return;
      const trigger = dropdown.querySelector<HTMLButtonElement>('.theme-dropdown-trigger');
      const menu = dropdown.querySelector('.theme-dropdown-menu');
      trigger?.setAttribute('aria-expanded', 'false');
      menu?.classList.add('hidden');
    });
}

let themeDropdownDocumentListenerAttached = false;

/** Astro header dropdown only — React taskbar uses ThemeContext.onClick. */
export function setupThemeDropdowns() {
  document.querySelectorAll('[data-theme-dropdown]').forEach((dropdown) => {
    if (dropdown.getAttribute('data-theme-bound') === 'true') return;
    dropdown.setAttribute('data-theme-bound', 'true');

    const trigger = dropdown.querySelector<HTMLButtonElement>('.theme-dropdown-trigger');
    const menu = dropdown.querySelector('.theme-dropdown-menu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      closeThemeDropdowns();
      trigger.setAttribute('aria-expanded', String(!isOpen));
      menu.classList.toggle('hidden', isOpen);
    });

    menu.querySelectorAll<HTMLButtonElement>('.theme-dropdown-option').forEach((option) => {
      option.addEventListener('click', () => {
        const value = option.dataset.themeValue;
        if (value === 'light' || value === 'dark' || value === 'system') {
          applyThemePreference(value);
          updateThemeDropdowns();
        }
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.add('hidden');
      });
    });
  });

  if (!themeDropdownDocumentListenerAttached) {
    themeDropdownDocumentListenerAttached = true;
    document.addEventListener('click', () => closeThemeDropdowns());
  }

  updateThemeDropdowns();
}

export function bootstrapThemeUi() {
  ensureThemeRuntime();
  syncThemeFromPreference();
  setupThemeDropdowns();
}
