/**
 * Generates the ReuXs icon set without any image dependency.
 * Run: node tools/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../windows/src-tauri/icons");
const SUPERSAMPLE = 3;

/* ------------------------------------------------------------------ drawing */

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** signed distance to a rounded rectangle */
function sdRoundRect(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside - radius;
}

function mix(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * clamp01(t)));
}

/** colour + coverage for one sample point in 0..1 space */
function sample(px, py) {
  const bgSdf = sdRoundRect(px, py, 0.5, 0.5, 0.5, 0.5, 0.235);
  if (bgSdf > 0) return [0, 0, 0, 0];

  const glow = clamp01(1 - Math.hypot(px - 0.5, py - 0.18) / 0.62);
  let color = mix([10, 4, 4], [69, 10, 10], Math.pow(clamp01(py * 0.85 + glow * 0.55), 1.15));
  color = mix(color, [127, 29, 29], glow * glow * 0.55);

  const capsuleSdf = sdRoundRect(px, py, 0.5, 0.52, 0.33, 0.145, 0.145);
  const innerSdf = sdRoundRect(px, py, 0.5, 0.52, 0.275, 0.09, 0.09);
  const dotSdf = Math.hypot(px - 0.66, py - 0.52) - 0.048;

  if (capsuleSdf < 0) color = [20, 6, 6];
  if (capsuleSdf < 0 && capsuleSdf > -0.028) color = [239, 68, 68];
  if (innerSdf < 0) color = mix([28, 7, 7], [88, 14, 14], clamp01((py - 0.42) / 0.3));
  if (dotSdf < 0) color = [248, 113, 113];

  return [...color, 255];
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const px = (x + (sx + 0.5) / SUPERSAMPLE) / size;
          const py = (y + (sy + 0.5) / SUPERSAMPLE) / size;
          const [sr, sg, sb, sa] = sample(px, py);
          const alpha = sa / 255;
          r += sr * alpha;
          g += sg * alpha;
          b += sb * alpha;
          a += alpha;
        }
      }
      const index = (y * size + x) * 4;
      if (a > 0) {
        rgba[index] = Math.round(r / a);
        rgba[index + 1] = Math.round(g / a);
        rgba[index + 2] = Math.round(b / a);
        rgba[index + 3] = Math.round((a / (SUPERSAMPLE * SUPERSAMPLE)) * 255);
      }
    }
  }
  return rgba;
}

/* -------------------------------------------------------------- png encoding */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

/* -------------------------------------------------------------- ico encoding */

function encodeIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + pngs.length * 16;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngs.map((item) => item.data)]);
}

/* ---------------------------------------------------------------------- main */

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "32x32.png", size: 32 },
  { file: "128x128.png", size: 128 },
  { file: "128x128@2x.png", size: 256 },
  { file: "icon.png", size: 512 }
];

const cache = new Map();
for (const { file, size } of targets) {
  const rgba = render(size);
  cache.set(size, rgba);
  writeFileSync(resolve(OUT_DIR, file), encodePng(size, rgba));
}

const icoSizes = [16, 32, 48, 64, 128, 256];
const icoPngs = icoSizes.map((size) => {
  const rgba = cache.get(size) ?? render(size);
  return { size, data: encodePng(size, rgba) };
});
writeFileSync(resolve(OUT_DIR, "icon.ico"), encodeIco(icoPngs));

console.log(`ReuXs icons written to ${OUT_DIR}`);
