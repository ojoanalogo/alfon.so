import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyThemePreference,
  applyThemeToDocument,
  attachSystemThemeListener,
  bootstrapThemeUi,
  DEFAULT_THEME_PREFERENCE,
  ensureThemeRuntime,
  getEffectiveTheme,
  getThemePreference,
  setupThemeToggles,
  syncThemeFromPreference,
  toggleThemePreference,
  updateThemeToggleIcons,
} from './theme';

const THEME_CHANGE = 'devfolio-theme-change';
const STORAGE_KEY = 'theme';

/**
 * jsdom does not implement window.matchMedia. Install a controllable stub that
 * lets a test pick whether the OS prefers dark, and capture registered
 * `change` listeners so we can simulate a system theme switch.
 */
function stubMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.delete(cb);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  };
  const matchMedia = vi.fn(() => mql);
  // @ts-expect-error – jsdom window has no matchMedia by default.
  window.matchMedia = matchMedia;
  return {
    mql,
    matchMedia,
    setMatches(value: boolean) {
      mql.matches = value;
    },
    fireChange() {
      for (const cb of listeners) cb({ matches: mql.matches } as MediaQueryListEvent);
    },
    listenerCount: () => listeners.size,
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.themePreference;
  // Default: OS prefers light unless a test overrides.
  stubMatchMedia(false);
});

afterEach(() => {
  // @ts-expect-error – remove our stub so it can't leak.
  delete window.matchMedia;
  document.body.innerHTML = '';
});

describe('DEFAULT_THEME_PREFERENCE', () => {
  it('defaults to system', () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe('system');
  });
});

describe('getThemePreference', () => {
  it('returns system when nothing is stored', () => {
    expect(getThemePreference()).toBe('system');
  });

  it('returns the stored light preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    expect(getThemePreference()).toBe('light');
  });

  it('returns the stored dark preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    expect(getThemePreference()).toBe('dark');
  });

  it('falls back to system for an invalid stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'neon');
    expect(getThemePreference()).toBe('system');
  });

  it('falls back to system when localStorage throws (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('private mode');
    });
    expect(getThemePreference()).toBe('system');
    spy.mockRestore();
  });
});

describe('getEffectiveTheme', () => {
  it('returns the explicit light preference regardless of OS', () => {
    stubMatchMedia(true);
    localStorage.setItem(STORAGE_KEY, 'light');
    expect(getEffectiveTheme()).toBe('light');
  });

  it('returns the explicit dark preference regardless of OS', () => {
    stubMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, 'dark');
    expect(getEffectiveTheme()).toBe('dark');
  });

  it('follows OS dark when preference is system', () => {
    stubMatchMedia(true);
    expect(getEffectiveTheme()).toBe('dark');
  });

  it('follows OS light when preference is system', () => {
    stubMatchMedia(false);
    expect(getEffectiveTheme()).toBe('light');
  });
});

describe('applyThemeToDocument', () => {
  it('adds the dark class for dark', () => {
    applyThemeToDocument('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class for light', () => {
    document.documentElement.classList.add('dark');
    applyThemeToDocument('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('applyThemePreference', () => {
  it('removes storage and follows OS when set to system', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    stubMatchMedia(false);
    applyThemePreference('system');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  it('persists dark and applies the dark class', () => {
    applyThemePreference('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.themePreference).toBe('dark');
  });

  it('persists light and removes the dark class', () => {
    document.documentElement.classList.add('dark');
    applyThemePreference('light');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.themePreference).toBe('light');
  });

  it('system preference under OS-dark applies the dark class', () => {
    stubMatchMedia(true);
    applyThemePreference('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.themePreference).toBe('system');
  });

  it('dispatches a devfolio-theme-change event with current preference and theme', () => {
    const handler = vi.fn();
    window.addEventListener(THEME_CHANGE, handler);
    applyThemePreference('dark');
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ preference: 'dark', theme: 'dark' });
    window.removeEventListener(THEME_CHANGE, handler);
  });

  it('event detail reflects system preference + resolved OS theme', () => {
    stubMatchMedia(true);
    const handler = vi.fn();
    window.addEventListener(THEME_CHANGE, handler);
    applyThemePreference('system');
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ preference: 'system', theme: 'dark' });
    window.removeEventListener(THEME_CHANGE, handler);
  });

  it('swallows localStorage write errors (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private mode');
    });
    expect(() => applyThemePreference('dark')).not.toThrow();
    // Document side effects still happen even when persistence fails.
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    spy.mockRestore();
  });
});

describe('toggleThemePreference', () => {
  it('toggles from effective dark to light', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    toggleThemePreference();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles from effective light to dark', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    toggleThemePreference();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('from system+OS-dark toggles to an explicit light preference', () => {
    stubMatchMedia(true);
    toggleThemePreference();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(getThemePreference()).toBe('light');
  });

  it('from system+OS-light toggles to an explicit dark preference', () => {
    stubMatchMedia(false);
    toggleThemePreference();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(getThemePreference()).toBe('dark');
  });
});

describe('syncThemeFromPreference', () => {
  it('applies document state and preference attribute without writing storage', () => {
    stubMatchMedia(true);
    syncThemeFromPreference();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('dispatches a theme-change event', () => {
    const handler = vi.fn();
    window.addEventListener(THEME_CHANGE, handler);
    syncThemeFromPreference();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(THEME_CHANGE, handler);
  });
});

describe('attachSystemThemeListener', () => {
  it('registers a change listener and returns a cleanup that removes it', () => {
    const sys = stubMatchMedia(false);
    const onChange = vi.fn();
    const cleanup = attachSystemThemeListener(onChange);
    expect(sys.listenerCount()).toBe(1);
    cleanup();
    expect(sys.listenerCount()).toBe(0);
  });

  it('invokes the callback and updates document when OS changes and preference is system', () => {
    const sys = stubMatchMedia(false);
    const onChange = vi.fn();
    attachSystemThemeListener(onChange);

    sys.setMatches(true);
    sys.fireChange();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignores OS changes when the preference is an explicit override', () => {
    const sys = stubMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, 'light');
    const onChange = vi.fn();
    attachSystemThemeListener(onChange);

    sys.setMatches(true);
    sys.fireChange();

    expect(onChange).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('dispatches a theme-change event on a system OS change', () => {
    const sys = stubMatchMedia(false);
    const handler = vi.fn();
    window.addEventListener(THEME_CHANGE, handler);
    attachSystemThemeListener(() => {});

    sys.setMatches(true);
    sys.fireChange();

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(THEME_CHANGE, handler);
  });
});

describe('updateThemeToggleIcons', () => {
  function buildToggle() {
    const root = document.createElement('div');
    root.className = 'theme-toggle';
    const system = document.createElement('span');
    system.className = 'system-icon';
    const sun = document.createElement('span');
    sun.className = 'sun-icon';
    const moon = document.createElement('span');
    moon.className = 'moon-icon';
    root.append(system, sun, moon);
    document.body.appendChild(root);
    return { system, sun, moon };
  }

  it('shows the system icon and hides sun/moon when following system', () => {
    const icons = buildToggle();
    document.documentElement.dataset.themePreference = 'system';
    updateThemeToggleIcons();
    expect(icons.system.classList.contains('hidden')).toBe(false);
    expect(icons.sun.classList.contains('hidden')).toBe(true);
    expect(icons.moon.classList.contains('hidden')).toBe(true);
  });

  it('shows the sun icon for explicit light', () => {
    const icons = buildToggle();
    document.documentElement.dataset.themePreference = 'light';
    document.documentElement.classList.remove('dark');
    updateThemeToggleIcons();
    expect(icons.system.classList.contains('hidden')).toBe(true);
    expect(icons.sun.classList.contains('hidden')).toBe(false);
    expect(icons.moon.classList.contains('hidden')).toBe(true);
  });

  it('shows the moon icon for explicit dark', () => {
    const icons = buildToggle();
    document.documentElement.dataset.themePreference = 'dark';
    document.documentElement.classList.add('dark');
    updateThemeToggleIcons();
    expect(icons.system.classList.contains('hidden')).toBe(true);
    expect(icons.sun.classList.contains('hidden')).toBe(true);
    expect(icons.moon.classList.contains('hidden')).toBe(false);
  });

  it('defaults to system when the preference dataset is absent', () => {
    const icons = buildToggle();
    delete document.documentElement.dataset.themePreference;
    updateThemeToggleIcons();
    expect(icons.system.classList.contains('hidden')).toBe(false);
  });
});

describe('setupThemeToggles', () => {
  function buildButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    document.body.appendChild(button);
    return button;
  }

  it('binds a click handler that toggles preference and marks the button bound', () => {
    const button = buildButton();
    localStorage.setItem(STORAGE_KEY, 'light');
    setupThemeToggles();
    expect(button.getAttribute('data-theme-bound')).toBe('true');

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not double-bind an already-bound button', () => {
    const button = buildButton();
    button.setAttribute('data-theme-bound', 'true');
    localStorage.setItem(STORAGE_KEY, 'light');
    setupThemeToggles();

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // No handler attached, so storage remains untouched.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });
});

describe('ensureThemeRuntime + bootstrapThemeUi', () => {
  // ensureThemeRuntime is idempotent via a module-level flag; we can only
  // assert it does not throw and that bootstrap wires the document state.
  it('ensureThemeRuntime is safe to call repeatedly', () => {
    expect(() => {
      ensureThemeRuntime();
      ensureThemeRuntime();
    }).not.toThrow();
  });

  it('bootstrapThemeUi syncs document state and binds toggles', () => {
    stubMatchMedia(true);
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    document.body.appendChild(button);

    bootstrapThemeUi();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(button.getAttribute('data-theme-bound')).toBe('true');
  });
});
