#!/usr/bin/env node
/**
 * Render src/images/icon.svg to PNG icons at the 3 sizes the manifest needs
 * (plus a 512×512 master for store listings). Uses sharp.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(here, '..', 'src', 'images');
const svgPath = path.join(imagesDir, 'icon.svg');

const svg = await fs.readFile(svgPath);

// 16/48/128 are required by the manifest. 512 is a handy master for the
// Chrome Web Store / Firefox AMO listing thumbnails.
const sizes = [16, 48, 128, 512];

for (const size of sizes) {
  const out =
    size === 512
      ? path.join(imagesDir, 'icon-master.png')
      : path.join(imagesDir, `icon-${size}.png`);
  await sharp(svg, { density: Math.max(72, size * 4) })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${path.basename(out)} (${size}×${size})`);
}
