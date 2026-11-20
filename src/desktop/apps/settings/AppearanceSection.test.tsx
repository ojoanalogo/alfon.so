import { render, screen, fireEvent } from '@testing-library/react';
import { STORAGE } from '@/lib/storage';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider } from '@desktop/state/ThemeContext';
import { WallpaperProvider } from '@desktop/state/WallpaperContext';
import { IconPackProvider } from '@desktop/state/IconPackContext';
import { WindowTransparencyProvider } from '@desktop/state/WindowTransparencyContext';
import { DESKTOP_ICON_URLS } from '@desktop/lib/desktopIcons';
import { DESKTOP_COLORS } from '@desktop/lib/desktopColors';
import { stubMatchMedia } from '@test/helpers';
import AppearanceSection from './AppearanceSection';

function renderSection() {
  return render(
    <ThemeProvider>
      <WindowTransparencyProvider>
        <IconPackProvider classicUrls={DESKTOP_ICON_URLS}>
          <WallpaperProvider wallpapers={[]}>
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
  it('renders the theme control plus the fill-color and patterns sections', () => {
    renderSection();

    expect(screen.getByRole('group', { name: 'Tema' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Color de relleno' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Patrones' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Imágenes' })).toBeNull();
  });

  it('renders one swatch per desktop color, labelled by its label', () => {
    renderSection();

    const colorSection = screen.getByRole('region', { name: 'Color de relleno' });
    expect(colorSection.querySelectorAll('li')).toHaveLength(DESKTOP_COLORS.length);

    for (const color of DESKTOP_COLORS) {
      expect(screen.getByRole('button', { name: color.label })).toBeTruthy();
    }
  });

  it('marks the default fill color as pressed when no preference is stored', () => {
    renderSection();

    expect(screen.getByRole('button', { name: 'Automático' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('clicking a fill color marks the swatch selected', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));

    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('blue');
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
    expect(screen.getByRole('button', { name: 'Azul' }).getAttribute('aria-pressed')).toBe('true');
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
});
