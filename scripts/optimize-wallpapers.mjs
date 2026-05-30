import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLPAPERS_DIR = path.resolve(__dirname, '../src/assets/wallpapers');
const TEMP_DIR = path.resolve(WALLPAPERS_DIR, '.optimize-tmp');

/** First entry becomes 1.jpg (default desktop wallpaper). */
const PRIMARY_SOURCE = 'jp96pwl191o71.jpg';

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;

const IMAGE_PATTERN = /\.(jpe?g|png|webp)$/i;

async function listSources() {
  const entries = await readdir(WALLPAPERS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && IMAGE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'en'));
}

function orderSources(files) {
  const primary = files.find((file) => file === PRIMARY_SOURCE);
  const rest = files.filter((file) => file !== PRIMARY_SOURCE).sort((a, b) => a.localeCompare(b, 'en'));

  if (!primary) {
    console.warn(`Primary wallpaper "${PRIMARY_SOURCE}" not found; using alphabetical order.`);
    return files;
  }

  return [primary, ...rest];
}

async function optimizeToJpeg(sourcePath, targetPath) {
  const image = sharp(sourcePath).rotate().resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
    fit: 'inside',
  });

  await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(targetPath);
}

async function main() {
  const sources = await listSources();
  if (sources.length === 0) {
    console.log('No wallpaper images found.');
    return;
  }

  const ordered = orderSources(sources);
  await rm(TEMP_DIR, { recursive: true, force: true });
  await mkdir(TEMP_DIR, { recursive: true });

  const manifest = [];

  for (const [index, fileName] of ordered.entries()) {
    const id = String(index + 1);
    const sourcePath = path.join(WALLPAPERS_DIR, fileName);
    const targetName = `${id}.jpg`;
    const targetPath = path.join(TEMP_DIR, targetName);
    const beforeStats = await stat(sourcePath);
    await optimizeToJpeg(sourcePath, targetPath);
    const afterStats = await stat(targetPath);

    manifest.push({
      id,
      from: fileName,
      to: targetName,
      beforeKb: Math.round(beforeStats.size / 1024),
      afterKb: Math.round(afterStats.size / 1024),
    });
  }

  for (const fileName of sources) {
    await rm(path.join(WALLPAPERS_DIR, fileName));
  }

  for (const entry of manifest) {
    await copyFile(path.join(TEMP_DIR, entry.to), path.join(WALLPAPERS_DIR, entry.to));
  }

  await rm(TEMP_DIR, { recursive: true, force: true });

  console.log('Wallpapers optimized and renamed:\n');
  for (const entry of manifest) {
    console.log(
      `  ${entry.from} → ${entry.to} (${entry.beforeKb} KB → ${entry.afterKb} KB)`,
    );
  }
  console.log(`\nDefault wallpaper: 1.jpg (was ${PRIMARY_SOURCE})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
