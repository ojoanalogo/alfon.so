export type IconLabelTone = 'light' | 'dark';

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function luminanceFromRgb(r: number, g: number, b: number): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function luminanceFromHex(hex: string): number | null {
  const normalized = hex.trim().replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.length === 6
        ? normalized
        : null;

  if (!value) return null;

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;

  return luminanceFromRgb(r, g, b);
}

export function luminanceFromCssColor(color: string): number | null {
  const trimmed = color.trim();

  if (trimmed.startsWith('#')) {
    return luminanceFromHex(trimmed);
  }

  const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (!rgbMatch) return null;

  const parts = rgbMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some((part) => Number.isNaN(part))) return null;

  return luminanceFromRgb(parts[0], parts[1], parts[2]);
}

export function iconLabelToneFromLuminance(luminance: number): IconLabelTone {
  return luminance > 0.58 ? 'dark' : 'light';
}

export function readThemeBackgroundLuminance(): number {
  const background = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-background')
    .trim();
  return luminanceFromCssColor(background) ?? 0.72;
}

export function resolveSurfaceLuminance(backgroundColor: string): number {
  if (backgroundColor.startsWith('var(')) {
    return readThemeBackgroundLuminance();
  }
  return luminanceFromCssColor(backgroundColor) ?? readThemeBackgroundLuminance();
}

export function sampleWallpaperLuminance(src: string): Promise<number> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const sampleWidth = 96;
      const sampleHeight = 192;
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        resolve(0.35);
        return;
      }

      const sourceWidth = image.naturalWidth * 0.4;
      const sourceHeight = image.naturalHeight * 0.55;
      context.drawImage(image, 0, 0, sourceWidth, sourceHeight, 0, 0, sampleWidth, sampleHeight);

      const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
      let total = 0;
      let count = 0;

      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3] / 255;
        if (alpha < 0.05) continue;

        total += luminanceFromRgb(data[index], data[index + 1], data[index + 2]);
        count += 1;
      }

      resolve(count > 0 ? total / count : 0.35);
    };

    image.onerror = () => resolve(0.35);
    image.src = src;
  });
}
