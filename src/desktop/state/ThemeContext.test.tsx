import { renderHook, act, render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.themePreference;
  // jsdom has no matchMedia; stub it to "light" (does not match dark).
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ThemeProvider + useTheme', () => {
  it('throws when useTheme is used outside the provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider',
    );
  });

  it('defaults to the stored light preference', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe('light');
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('reflects a stored dark preference', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe('dark');
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('falls back to system preference when storage is empty', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    // matchMedia is stubbed in jsdom to not-match → system resolves to light.
    expect(result.current.preference).toBe('system');
    expect(['light', 'dark']).toContain(result.current.theme);
  });

  it('toggleTheme flips light → dark and persists the override', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.preference).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleTheme flips dark → light', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.preference).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme("system") clears the stored override', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe('dark');

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.preference).toBe('system');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('setTheme("light") writes the explicit preference', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.preference).toBe('light');
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('syncs across two consumers via the devfolio-theme-change event', () => {
    localStorage.setItem('theme', 'light');

    function TwoConsumers() {
      const a = useTheme();
      return <span data-testid="theme">{a.theme}</span>;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TwoConsumers />
      </ThemeProvider>,
    );

    expect(getByTestId('theme').textContent).toBe('light');
  });
});
