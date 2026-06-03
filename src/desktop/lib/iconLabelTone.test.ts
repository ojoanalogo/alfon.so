import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  iconLabelToneFromLuminance,
  luminanceFromCssColor,
  luminanceFromHex,
  luminanceFromRgb,
  readThemeBackgroundLuminance,
  resolveSurfaceLuminance,
  sampleWallpaperLuminance,
} from './iconLabelTone';

describe('luminanceFromRgb', () => {
  it('returns 0 for pure black', () => {
    expect(luminanceFromRgb(0, 0, 0)).toBe(0);
  });

  it('returns 1 for pure white', () => {
    // 0.2126 + 0.7152 + 0.0722 === 1 when each channel luminance is 1
    expect(luminanceFromRgb(255, 255, 255)).toBeCloseTo(1, 10);
  });

  it('weights green most heavily, then red, then blue', () => {
    const red = luminanceFromRgb(255, 0, 0);
    const green = luminanceFromRgb(0, 255, 0);
    const blue = luminanceFromRgb(0, 0, 255);
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
    // Channel weights at full intensity (channelLuminance(255) === 1)
    expect(red).toBeCloseTo(0.2126, 10);
    expect(green).toBeCloseTo(0.7152, 10);
    expect(blue).toBeCloseTo(0.0722, 10);
  });

  it('applies the linear (low) sRGB branch for small channel values', () => {
    // channel 1 -> value = 1/255 ≈ 0.00392 which is <= 0.03928, so linear branch
    const value = 1 / 255;
    const expectedChannel = value / 12.92;
    expect(luminanceFromRgb(1, 1, 1)).toBeCloseTo(expectedChannel, 12);
  });

  it('applies the gamma (high) sRGB branch for mid/high channel values', () => {
    // channel 128 -> value ≈ 0.50196 > 0.03928, gamma branch
    const value = 128 / 255;
    const expectedChannel = ((value + 0.055) / 1.055) ** 2.4;
    expect(luminanceFromRgb(128, 128, 128)).toBeCloseTo(expectedChannel, 12);
  });
});

describe('luminanceFromHex', () => {
  it('parses a 6-digit hex', () => {
    expect(luminanceFromHex('#ffffff')).toBeCloseTo(1, 10);
    expect(luminanceFromHex('#000000')).toBe(0);
  });

  it('parses without a leading hash', () => {
    expect(luminanceFromHex('ffffff')).toBeCloseTo(1, 10);
  });

  it('expands a 3-digit shorthand hex', () => {
    // #fff expands to #ffffff
    expect(luminanceFromHex('#fff')).toBeCloseTo(luminanceFromHex('#ffffff')!, 12);
    // #f00 expands to #ff0000 (red)
    expect(luminanceFromHex('#f00')).toBeCloseTo(luminanceFromRgb(255, 0, 0), 12);
  });

  it('trims surrounding whitespace', () => {
    expect(luminanceFromHex('  #000000  ')).toBe(0);
  });

  it('returns null for an invalid length', () => {
    expect(luminanceFromHex('#ff')).toBeNull();
    expect(luminanceFromHex('#fffff')).toBeNull();
    expect(luminanceFromHex('#fffffff')).toBeNull();
    expect(luminanceFromHex('')).toBeNull();
  });

  it('returns null for non-hex characters that yield NaN', () => {
    expect(luminanceFromHex('#zzzzzz')).toBeNull();
    // parseInt('gg', 16) is NaN since the leading char is invalid
    expect(luminanceFromHex('#1234gg')).toBeNull();
  });
});

describe('luminanceFromCssColor', () => {
  it('delegates to hex parsing for # colors', () => {
    expect(luminanceFromCssColor('#000000')).toBe(0);
    expect(luminanceFromCssColor('#fff')).toBeCloseTo(1, 10);
  });

  it('parses rgb() colors', () => {
    expect(luminanceFromCssColor('rgb(255, 255, 255)')).toBeCloseTo(1, 10);
    expect(luminanceFromCssColor('rgb(0,0,0)')).toBe(0);
  });

  it('parses rgba() colors (ignoring the alpha channel)', () => {
    expect(luminanceFromCssColor('rgba(255, 255, 255, 0.5)')).toBeCloseTo(1, 10);
    expect(luminanceFromCssColor('rgba(0, 0, 0, 1)')).toBe(0);
  });

  it('is case-insensitive for the rgb token', () => {
    expect(luminanceFromCssColor('RGB(0,0,0)')).toBe(0);
  });

  it('handles floating point channel values', () => {
    expect(luminanceFromCssColor('rgb(255.0, 0.0, 0.0)')).toBeCloseTo(
      luminanceFromRgb(255, 0, 0),
      10,
    );
  });

  it('returns null when there is no rgb match and no hash', () => {
    expect(luminanceFromCssColor('papayawhip')).toBeNull();
    expect(luminanceFromCssColor('hsl(0, 0%, 0%)')).toBeNull();
  });

  it('returns null when rgb has fewer than three components', () => {
    expect(luminanceFromCssColor('rgb(255, 255)')).toBeNull();
  });

  it('returns null when an rgb component is not a number', () => {
    expect(luminanceFromCssColor('rgb(255, foo, 0)')).toBeNull();
  });
});

describe('iconLabelToneFromLuminance', () => {
  it('returns "dark" for luminance above the 0.58 threshold', () => {
    expect(iconLabelToneFromLuminance(0.59)).toBe('dark');
    expect(iconLabelToneFromLuminance(1)).toBe('dark');
  });

  it('returns "light" for luminance at or below the 0.58 threshold', () => {
    expect(iconLabelToneFromLuminance(0.58)).toBe('light');
    expect(iconLabelToneFromLuminance(0.5)).toBe('light');
    expect(iconLabelToneFromLuminance(0)).toBe('light');
  });

  it('treats the boundary value exactly (strictly greater than)', () => {
    // 0.58 is NOT > 0.58, so it is light
    expect(iconLabelToneFromLuminance(0.58)).toBe('light');
    expect(iconLabelToneFromLuminance(0.5800001)).toBe('dark');
  });
});

describe('readThemeBackgroundLuminance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty('--color-background');
  });

  it('reads --color-background and converts it to luminance', () => {
    document.documentElement.style.setProperty('--color-background', '#000000');
    expect(readThemeBackgroundLuminance()).toBe(0);
  });

  it('parses an rgb() custom property value', () => {
    document.documentElement.style.setProperty('--color-background', 'rgb(255, 255, 255)');
    expect(readThemeBackgroundLuminance()).toBeCloseTo(1, 10);
  });

  it('falls back to 0.72 when the property is missing/unparseable', () => {
    // No property set, getPropertyValue returns '' -> luminanceFromCssColor('') is null
    document.documentElement.style.removeProperty('--color-background');
    expect(readThemeBackgroundLuminance()).toBe(0.72);
  });

  it('falls back to 0.72 for a non-rgb/non-hex value', () => {
    document.documentElement.style.setProperty('--color-background', 'rebeccapurple');
    expect(readThemeBackgroundLuminance()).toBe(0.72);
  });
});

describe('resolveSurfaceLuminance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty('--color-background');
  });

  it('reads the theme background for a var() reference', () => {
    document.documentElement.style.setProperty('--color-background', '#000000');
    expect(resolveSurfaceLuminance('var(--color-background)')).toBe(0);
  });

  it('parses a concrete hex surface color directly', () => {
    expect(resolveSurfaceLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('parses a concrete rgb surface color directly', () => {
    expect(resolveSurfaceLuminance('rgb(0, 0, 0)')).toBe(0);
  });

  it('falls back to the theme background when the color is unparseable', () => {
    document.documentElement.style.setProperty('--color-background', '#000000');
    // 'transparent' is neither hex nor rgb -> luminanceFromCssColor null -> theme fallback
    expect(resolveSurfaceLuminance('transparent')).toBe(0);
  });

  it('falls back to 0.72 when both the color and theme are unparseable', () => {
    document.documentElement.style.removeProperty('--color-background');
    expect(resolveSurfaceLuminance('not-a-color')).toBe(0.72);
  });
});

describe('sampleWallpaperLuminance', () => {
  class FakeImage {
    decoding = '';
    naturalWidth = 200;
    naturalHeight = 200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    #src = '';
    static behavior: 'load' | 'error' = 'load';
    set src(value: string) {
      this.#src = value;
      queueMicrotask(() => {
        if (FakeImage.behavior === 'error') {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      });
    }
    get src() {
      return this.#src;
    }
  }

  beforeEach(() => {
    FakeImage.behavior = 'load';
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolves to 0.35 when the image fails to load', async () => {
    FakeImage.behavior = 'error';
    await expect(sampleWallpaperLuminance('broken.png')).resolves.toBe(0.35);
  });

  it('resolves to 0.35 on load when the 2d context is unavailable (jsdom)', async () => {
    // jsdom's canvas getContext('2d') returns null, so the code resolves 0.35 early.
    await expect(sampleWallpaperLuminance('photo.png')).resolves.toBe(0.35);
  });

  it('averages sampled pixel luminance when a 2d context is available', async () => {
    // Provide a fake 2d context returning solid white pixels (alpha 255).
    const pixelCount = 96 * 192;
    const data = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data })),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    );

    const result = await sampleWallpaperLuminance('white.png');
    // All-white opaque pixels -> average luminance ≈ 1
    expect(result).toBeCloseTo(1, 6);
    expect(fakeContext.drawImage).toHaveBeenCalled();
  });

  it('skips fully transparent pixels and resolves 0.35 when none are opaque', async () => {
    const pixelCount = 96 * 192;
    const data = new Uint8ClampedArray(pixelCount * 4);
    // all alpha = 0 -> every pixel skipped, count stays 0
    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data })),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    );

    const result = await sampleWallpaperLuminance('transparent.png');
    expect(result).toBe(0.35);
  });

  it('only counts opaque pixels in the average', async () => {
    const pixelCount = 96 * 192;
    const data = new Uint8ClampedArray(pixelCount * 4);
    // First pixel: opaque black. Second pixel: opaque white. Rest: transparent (skipped).
    data[3] = 255; // pixel 0 alpha, rgb stays 0,0,0 -> luminance 0
    data[4] = 255;
    data[5] = 255;
    data[6] = 255;
    data[7] = 255; // pixel 1 white, opaque -> luminance 1
    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data })),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    );

    const result = await sampleWallpaperLuminance('mixed.png');
    // average of luminance 0 and luminance 1 over 2 opaque pixels -> ~0.5
    expect(result).toBeCloseTo(0.5, 6);
  });
});
