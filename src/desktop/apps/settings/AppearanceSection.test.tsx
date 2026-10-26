import { render, screen, fireEvent } from '@testing-library/react';
import { STORAGE } from '@/lib/storage';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider } from '@desktop/state/ThemeContext';
import { WallpaperProvider } from '@desktop/state/WallpaperContext';
import { IconPackProvider } from '@desktop/state/IconPackContext';
import { WindowTransparencyProvider } from '@desktop/state/WindowTransparencyContext';
import { DESKTOP_ICON_URLS } from '@desktop/lib/desktopIcons';
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
      <WindowTransparencyProvider>
        <IconPackProvider classicUrls={DESKTOP_ICON_URLS}>
          <WallpaperProvider wallpapers={wallpapers}>
            <AppearanceSection />
          </WallpaperProvider>
        </IconPackProvider>
      </WindowTransparencyProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.style.removeProperty('--window-transparency');
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
    expect(screen.getByRole('region', { name: 'Color de relleno' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Imágenes' })).toBeTruthy();
  });

  it('renders one swatch per desktop color, labelled by its label', () => {
    renderSection();

    const colorSection = screen.getByRole('region', { name: 'Color de relleno' });
    expect(colorSection.querySelectorAll('li')).toHaveLength(DESKTOP_COLORS.length);

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

    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('03');
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

    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('blue');
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Imagen 03' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('selecting a color then a wallpaper moves selection back to the wallpaper', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    fireEvent.click(screen.getByRole('button', { name: 'Imagen 01' }));

    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('01');
    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('blue');
    expect(screen.getByRole('button', { name: 'Imagen 01' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('restores a stored fill color when returning from a wallpaper', () => {
    localStorage.setItem(STORAGE.desktopColor, 'mint');
    localStorage.setItem(STORAGE.wallpaper, '03');
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Menta' }));

    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('mint');
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
    expect(screen.getByRole('button', { name: 'Menta' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Imagen 03' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('the theme control toggles the document theme via setTheme', () => {
    renderSection();

    fireEvent.click(screen.getByText('Oscuro'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(STORAGE.theme)).toBe('dark');
  });

  it('pattern previews use the active theme background when color is automatic', () => {
    renderSection();

    const cuadricula = screen.getByRole('button', { name: 'Cuadrícula' });
    expect(cuadricula.style.backgroundColor).toBe('var(--color-background)');

    fireEvent.click(screen.getByText('Oscuro'));
    expect(cuadricula.style.backgroundColor).toBe('var(--color-background)');
  });

  it('renders window transparency at the default level', () => {
    renderSection();

    expect(
      screen.getByRole('slider', { name: 'Transparencia de ventanas' }).getAttribute('value'),
    ).toBe('24');
  });

  it('persists a new window transparency level on the document', () => {
    renderSection();

    fireEvent.change(screen.getByRole('slider', { name: 'Transparencia de ventanas' }), {
      target: { value: '60' },
    });

    expect(localStorage.getItem(STORAGE.windowTransparency)).toBe('60');
    expect(document.documentElement.style.getPropertyValue('--window-transparency')).toBe('60');
    expect(
      screen.getByRole('slider', { name: 'Transparencia de ventanas' }).getAttribute('value'),
    ).toBe('60');
  });

  it('renders an icon pack option for each theme and selects it', () => {
    renderSection();

    for (const label of ['Clásico', 'Carbón', 'Crema', 'Océano', 'Coral', 'Bosque', 'Violeta']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole('button', { name: 'Océano' }));
    expect(localStorage.getItem(STORAGE.iconPack)).toBe('ocean');
    expect(screen.getByRole('button', { name: 'Océano' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('shows the empty-state message and no wallpaper list when there are no wallpapers', () => {
    renderSection([]);

    expect(screen.getByText(/No hay fondos/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Imagen 03' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Azul' })).toBeTruthy();
  });
});
