import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider } from '@desktop/state/ThemeContext';
import { WallpaperProvider } from '@desktop/state/WallpaperContext';
import { DESKTOP_COLORS } from '@desktop/lib/desktopColors';
import type { WallpaperOption } from '@desktop/types';
import { stubMatchMedia } from '@test/helpers';
import AppearanceSection from './AppearanceSection';

const WALLPAPERS: WallpaperOption[] = [
  { id: '01', label: 'Imagen 01', src: '/wp/01.jpg', thumbSrc: '/wp/01-thumb.jpg' },
  { id: '03', label: 'Imagen 03', src: '/wp/03.jpg', thumbSrc: '/wp/03-thumb.jpg' },
  { id: '05', label: 'Imagen 05', src: '/wp/05.jpg', thumbSrc: '/wp/05-thumb.jpg' },
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
    expect(thumbs).toContain('/wp/03-thumb.jpg');
  });

  it('marks the default fill color as pressed when no preference is stored', () => {
    renderSection();

    expect(screen.getByRole('button', { name: 'Automático' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Imagen 03' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('clicking a wallpaper selects it and persists the id', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Imagen 03' }));

    expect(localStorage.getItem('devfolio.wallpaper')).toBe('03');
    expect(screen.getByRole('button', { name: 'Imagen 03' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Imagen 05' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('clicking a fill color clears the wallpaper and marks the swatch selected', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));

    expect(localStorage.getItem('devfolio.desktop-color')).toBe('blue');
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Imagen 03' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('selecting a color then a wallpaper moves selection back to the wallpaper', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    fireEvent.click(screen.getByRole('button', { name: 'Imagen 01' }));

    expect(localStorage.getItem('devfolio.wallpaper')).toBe('01');
    expect(localStorage.getItem('devfolio.desktop-color')).toBe('blue');
    expect(screen.getByRole('button', { name: 'Imagen 01' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('restores a stored fill color when returning from a wallpaper', () => {
    localStorage.setItem('devfolio.desktop-color', 'mint');
    localStorage.setItem('devfolio.wallpaper', '03');
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Menta' }));

    expect(localStorage.getItem('devfolio.desktop-color')).toBe('mint');
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
    expect(screen.getByRole('button', { name: 'Menta' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Imagen 03' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
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
    expect(screen.queryByRole('button', { name: 'Imagen 03' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Azul' })).toBeTruthy();
  });
});
