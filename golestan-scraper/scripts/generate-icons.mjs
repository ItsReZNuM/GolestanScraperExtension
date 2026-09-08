// Generates privacy-safe PNG icons without external deps.
// Solid indigo/cyan gradient-look background + white "G" mark.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    crc32.table = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, c]);
}

// Simple raster: indigo background with centered white rounded rect + "G"
function makePng(size) {
  const w = size, h = size;
  const bg = [99, 102, 241]; // #6366f1
  const bg2 = [6, 182, 212]; // cyan accent for gradient effect
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter 0
    const t = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const off = rowStart + 1 + x * 4;
      // vertical gradient between bg and bg2 slightly
      const r = Math.round(bg[0] * (1 - t * 0.35) + bg2[0] * t * 0.35);
      const g = Math.round(bg[1] * (1 - t * 0.35) + bg2[1] * t * 0.35);
      const b = Math.round(bg[2] * (1 - t * 0.35) + bg2[2] * t * 0.35);
      // white "badge" in center: rounded rect
      const cx = w / 2, cy = h / 2;
      const rx = w * 0.34, ry = h * 0.34;
      const dx = Math.abs(x + 0.5 - cx), dy = Math.abs(y + 0.5 - cy);
      const inRect = dx < rx && dy < ry && (dx < rx - 3 || dy < ry - 3 || (dx - (rx - 3)) ** 2 + (dy - (ry - 3)) ** 2 < 9);
      // white "G" approximation: draw thick G shape inside rect
      let isG = false;
      if (inRect) {
        const gx = (x - (cx - rx * 0.55)) / (rx * 1.1);
        const gy = (y - (cy - ry * 0.45)) / (ry * 0.9);
        // crude G: outer ellipse stroke + horizontal bar
        const nx = (gx - 0.5) * 2, ny = (gy - 0.5) * 2;
        const dist = Math.sqrt(nx * nx * 1.1 + ny * ny);
        const inOuter = dist > 0.55 && dist < 0.9;
        const inBar = gx > 0.45 && gx < 0.95 && gy > 0.42 && gy < 0.58;
        const inNotch = gx > 0.55 && gy < 0.42 && dist < 0.9;
        isG = (inOuter && !inNotch) || inBar;
      }
      if (inRect) {
        if (isG) { raw[off] = 99; raw[off + 1] = 102; raw[off + 2] = 241; raw[off + 3] = 255; }
        else { raw[off] = 255; raw[off + 1] = 255; raw[off + 2] = 255; raw[off + 3] = 255; }
      } else {
        raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = join(process.cwd(), 'public', 'icons');
mkdirSync(outDir, { recursive: true });
for (const s of [16, 48, 128]) {
  writeFileSync(join(outDir, `icon${s}.png`), makePng(s));
  console.log('wrote icon', s);
}
