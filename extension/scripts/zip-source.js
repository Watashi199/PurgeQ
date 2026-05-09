#!/usr/bin/env node
/**
 * Build a source archive that Firefox AMO reviewers can use to reproduce
 * the published extension package. The output zip contains everything
 * needed to run `npm install && npm run package` and get the same dist
 * archive that was submitted for distribution.
 *
 * Output: extension/purgeq-source-<version>.zip
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deflateRawSync } from 'zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const manifest = JSON.parse(
  await fs.readFile(path.join(root, 'manifest.json'), 'utf-8')
);
const out = path.join(root, `purgeq-source-${manifest.version}.zip`);

// Allow-list approach: ship only the files reviewers actually need.
const include = [
  'manifest.json',
  'manifest.firefox.json',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  '.eslintrc',
  '.prettierrc',
  'REVIEWER_NOTES.md',
];
const includeDirs = ['src', 'scripts'];

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function* walk(dir, base = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, rel);
    } else {
      yield { full, rel: rel.replace(/\\/g, '/') };
    }
  }
}

const files = [];
for (const f of include) {
  const full = path.join(root, f);
  try {
    await fs.access(full);
    files.push({ full, rel: f });
  } catch {
    // optional file (e.g. REVIEWER_NOTES.md when first running)
  }
}
for (const dir of includeDirs) {
  const full = path.join(root, dir);
  try {
    await fs.access(full);
    for await (const item of walk(full, dir)) files.push(item);
  } catch {
    // skip if missing
  }
}

function dosTime(date) {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    (Math.floor(date.getSeconds() / 2) & 0x1f);
  const day =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { time, day };
}

const ZIP_VERSION = 20;
const COMPRESS_DEFLATE = 8;
const chunks = [];
const centralEntries = [];
let offset = 0;

for (const { full, rel } of files) {
  const data = await fs.readFile(full);
  const compressed = deflateRawSync(data, { level: 9 });
  const useDeflate = compressed.length < data.length;
  const stored = useDeflate ? compressed : data;
  const method = useDeflate ? COMPRESS_DEFLATE : 0;
  const crc = crc32(data);
  const stat = await fs.stat(full);
  const { time, day } = dosTime(stat.mtime);
  const nameBuf = Buffer.from(rel, 'utf-8');

  const local = Buffer.alloc(30 + nameBuf.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(ZIP_VERSION, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(day, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(stored.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  nameBuf.copy(local, 30);
  chunks.push(local, stored);

  const central = Buffer.alloc(46 + nameBuf.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(ZIP_VERSION, 4);
  central.writeUInt16LE(ZIP_VERSION, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(day, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(stored.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(offset, 42);
  nameBuf.copy(central, 46);
  centralEntries.push(central);

  offset += local.length + stored.length;
}

const centralStart = offset;
let centralSize = 0;
for (const c of centralEntries) {
  chunks.push(c);
  centralSize += c.length;
}

const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(centralEntries.length, 8);
eocd.writeUInt16LE(centralEntries.length, 10);
eocd.writeUInt32LE(centralSize, 12);
eocd.writeUInt32LE(centralStart, 16);
eocd.writeUInt16LE(0, 20);
chunks.push(eocd);

await fs.writeFile(out, Buffer.concat(chunks));
console.log(`✓ Source archive: ${path.basename(out)} (${files.length} files)`);
