/**
 * Post-build script for the Chrome extension.
 *
 * Vite already copies `public/` into `out/` and uses relative paths (`./`).
 * We just need to ensure no `_` prefixed files/folders remain (Chrome blocks
 * unpacked extensions from loading files starting with `_`).
 */
import { readdirSync, statSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'out');

function removeIllegalEntries(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry.startsWith('_')) {
        console.log(`removed ${fullPath}`);
        rmdirSync(fullPath, { recursive: true });
      } else {
        removeIllegalEntries(fullPath);
      }
    } else if (entry.startsWith('_')) {
      console.log(`removed ${fullPath}`);
      unlinkSync(fullPath);
    }
  }
}

removeIllegalEntries(outDir);
console.log(`extension dir ready: ${outDir}`);
