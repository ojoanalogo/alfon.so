import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider } from '@desktop/state/ThemeContext';
import { WallpaperProvider } from '@desktop/state/WallpaperContext';
import { DESKTOP_COLORS } from '@desktop/lib/desktopColors';
import type { WallpaperOption } from '@desktop/types';
import { stubMatchMedia } from '@test/helpers';
import AppearanceSection from './AppearanceSection';

const WALLPAPERS: WallpaperOption[] = [
  { id: '1', label: 'Uno', src: '/wp/1.jpg', thumbSrc: '/wp/1-thumb.jpg' },
  { id: '4', label: 'Cuatro', src: '/wp/4.jpg', thumbSrc: '/wp/4-thumb.jpg' },
  { id: '7', label: 'Siete', src: '/wp/7.jpg', thumbSrc: '/wp/7-thumb.jpg' },
];

function renderSection(wallpapers: WallpaperOption[] = WALLPAPERS) {
  return render(
    <ThemeProvider>
      <WallpaperProvider wallpapers={wallpapers}>
        <AppearanceSection />
      </WallpaperProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AppearanceSection', () => {
  it('renders the theme control plus the fill-color and wallpaper sections', () => {
    renderSection();

    expect(screen.getByRole('group', { name: 'Tema' })).toBeTruthy();
    expect(screen.getByText('Color de relleno')).toBeTruthy();
    expect(screen.getByText('Imágenes')).toBeTruthy();
  });

  it('renders one swatch per desktop color, labelled by its label', () => {
    renderSection();

    for (const color of DESKTOP_COLORS) {
      expect(screen.getByRole('button', { name: color.label })).toBeTruthy();
    }
  });

  it('renders one wallpaper button per wallpaper with its thumbnail', () => {
    const { container } = renderSection();

    for (const wallpaper of WALLPAPERS) {
      expect(screen.getByRole('button', { name: wallpaper.label })).toBeTruthy();
    }

    const thumbs = Array.from(container.querySelectorAll('img')).map((img) =>
      img.getAttribute('src'),
    );
    expect(thumbs).toContain('/wp/4-thumb.jpg');
  });

  it('marks the default-stored wallpaper (id 4) as pressed', () => {
    renderSection();

    const four = screen.getByRole('button', { name: 'Cuatro' });
    expect(four.getAttribute('aria-pressed')).toBe('true');
    const seven = screen.getByRole('button', { name: 'Siete' });
    expect(seven.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking a wallpaper selects it and persists the id', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Siete' }));

    expect(localStorage.getItem('devfolio.wallpaper')).toBe('7');
    expect(screen.getByRole('button', { name: 'Siete' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Cuatro' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('clicking a fill color clears the wallpaper and marks the swatch selected', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));

    // setBackgroundColor clears the wallpaper preference.
    expect(localStorage.getItem('devfolio.desktop-color')).toBe('blue');
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('true');
    // No wallpaper is selected anymore.
    expect(screen.getByRole('button', { name: 'Cuatro' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('selecting a color then a wallpaper moves selection back to the wallpaper', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    fireEvent.click(screen.getByRole('button', { name: 'Uno' }));

    expect(localStorage.getItem('devfolio.wallpaper')).toBe('1');
    expect(screen.getByRole('button', { name: 'Uno' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('the theme control toggles the document theme via setTheme', () => {
    renderSection();

    fireEvent.click(screen.getByText('Oscuro'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('shows the empty-state message and no wallpaper list when there are no wallpapers', () => {
    renderSection([]);

    expect(screen.getByText(/No hay fondos/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cuatro' })).toBeNull();
    // Color swatches still render.
    expect(screen.getByRole('button', { name: 'Azul' })).toBeTruthy();
  });
});
