import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../src/assets/icons');
const OUT_DIR = path.join(ICONS_DIR, 'packs');

/** Icon key → source file in src/assets/icons. */
const SOURCES = {
  about: 'paper.png',
  blog: 'book-pencil.png',
  notes: 'notes.png',
  games: 'controller.png',
  photos: 'photos.png',
  projects: 'open-folder.png',
  settings: 'settings.png',
  startup: 'dna.png',
  terminal: 'terminal.png',
  trash: 'trash.png',
  video: 'video.png',
  contacto: 'mail2.png',
  cv: 'paper.png',
};

/** Dark → light stops. Luminance picks a stop; a little of the original color remains. */
const PACKS = {
  graphite: [
    [39, 39, 42],
    [113, 113, 122],
    [212, 212, 216],
    [250, 250, 250],
  ],
  cream: [
    [62, 48, 32],
    [140, 112, 74],
    [214, 190, 156],
    [247, 241, 230],
  ],
  ocean: [
    [12, 36, 68],
    [30, 90, 160],
    [96, 165, 230],
    [224, 242, 254],
  ],
  rose: [
    [76, 16, 36],
    [185, 28, 68],
    [244, 114, 142],
    [255, 228, 232],
  ],
  forest: [
    [12, 46, 28],
    [22, 120, 58],
    [74, 190, 110],
    [220, 247, 228],
  ],
  violet: [
    [42, 16, 78],
    [109, 40, 200],
    [167, 139, 230],
    [237, 233, 254],
  ],
};

const PALETTE_MIX = 0.82;

function sample(stops, t) {
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const blend = scaled - index;
  return stops[index].map((channel, channelIndex) =>
    Math.round(channel + (stops[index + 1][channelIndex] - channel) * blend),
  );
}

async function recolor(sourcePath, stops) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const pixels = Buffer.from(data);

  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3] === 0) continue;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    const [nextRed, nextGreen, nextBlue] = sample(stops, luminance);
    pixels[offset] = Math.round(nextRed * PALETTE_MIX + red * (1 - PALETTE_MIX));
    pixels[offset + 1] = Math.round(nextGreen * PALETTE_MIX + green * (1 - PALETTE_MIX));
    pixels[offset + 2] = Math.round(nextBlue * PALETTE_MIX + blue * (1 - PALETTE_MIX));
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

async function main() {
  let count = 0;
  for (const [packId, stops] of Object.entries(PACKS)) {
    const packDir = path.join(OUT_DIR, packId);
    await mkdir(packDir, { recursive: true });
    for (const [key, fileName] of Object.entries(SOURCES)) {
      const png = await recolor(path.join(ICONS_DIR, fileName), stops);
      await sharp(png).toFile(path.join(packDir, `${key}.png`));
      count += 1;
    }
  }
  console.log(`Wrote ${count} icons across ${Object.keys(PACKS).length} packs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
