// Post-build fix: Chrome forbids unpacked-extension files/folders starting
// with "_" (e.g. Next's `_next/` dir, `_not-found.html`, `__next*.txt`).
// This renames `_next` -> `app-assets` and rewrites every reference to it.
import { readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OLD_DIR = 'app-assets';
const OUT_PATH = join(process.cwd(), 'out');

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    visit(full);
    if (statSync(full).isDirectory()) walk(full, visit);
  }
}

// 1. Drop Next internals that are illegal (leading "_") or useless in the popup.
// NOTE: `_next` itself is kept here and renamed in step 2.
for (const entry of readdirSync(OUT_PATH)) {
  if (entry === '_next') continue;
  if (entry.startsWith('_') || entry.startsWith('__next')) {
    rmSync(join(OUT_PATH, entry), { recursive: true, force: true });
    console.log('removed', entry);
  }
}

// 2. Rename the hashed-asset directory.
renameSync(join(OUT_PATH, '_next'), join(OUT_PATH, OLD_DIR));
console.log('renamed _next ->', OLD_DIR);

// 3. Rewrite asset URLs: "./_next/" and "/_next/" (NOT "__next" runtime vars).
walk(OUT_PATH, (file) => {
  if (!/\.(html|js|css|json)$/.test(file)) return;
  const raw = readFileSync(file, 'utf8');
  if (!raw.includes('_next')) return;
  const patched = raw
    .split('./_next/').join(`./${OLD_DIR}/`)
    .split('/_next/').join(`/${OLD_DIR}/`);
  if (patched !== raw) {
    writeFileSync(file, patched);
    console.log('patched', file.replace(OUT_PATH, 'out'));
  }
});

console.log('extension dir ready:', OUT_PATH);
