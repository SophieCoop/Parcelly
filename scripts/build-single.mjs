/**
 * Bundles the app into one self-contained HTML file with no external requests:
 * the Heebo subsets, the stylesheet and the script are all inlined.
 *
 * Output: dist-single/parcelly.html
 *
 *   node scripts/build-single.mjs
 *
 * The build routes through the URL hash so the file works when opened directly
 * or served from a host that can't rewrite unknown paths to index.html.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'dist-single');
const OUT_FILE = join(OUT_DIR, 'parcelly.html');

const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap';
/** Only the subsets the app actually renders, to keep the file small. */
const WANTED_SUBSETS = ['hebrew', 'latin'];

/** Inline every @font-face src as a data: URI, dropping unused subsets. */
async function buildFontCss() {
  const response = await fetch(FONT_CSS_URL, {
    headers: {
      // Google serves woff2 only to browsers that advertise support.
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });
  if (!response.ok) throw new Error(`font css: HTTP ${response.status}`);
  const css = await response.text();

  const blocks = css.split('/*').slice(1);
  const kept = [];
  for (const block of blocks) {
    const subset = block.slice(0, block.indexOf('*/')).trim();
    if (!WANTED_SUBSETS.includes(subset)) continue;

    const face = block.slice(block.indexOf('*/') + 2);
    const url = face.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) continue;

    const font = await fetch(url);
    if (!font.ok) throw new Error(`font ${url}: HTTP ${font.status}`);
    const base64 = Buffer.from(await font.arrayBuffer()).toString('base64');
    kept.push(
      face.replace(url, `data:font/woff2;base64,${base64}`).trim(),
    );
  }
  if (kept.length === 0) throw new Error('no font faces matched');
  return kept.join('\n');
}

function readAsset(extension) {
  const dir = join(DIST, 'assets');
  const name = readdirSync(dir).find((file) => file.endsWith(extension));
  if (!name) throw new Error(`no ${extension} asset in ${dir}`);
  return readFileSync(join(dir, name), 'utf8');
}

console.log('building…');
execFileSync('npx', ['vite', 'build'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_HASH_ROUTER: '1' },
});

let fontCss = '';
try {
  console.log('inlining fonts…');
  fontCss = await buildFontCss();
} catch (error) {
  console.warn(`! fonts not inlined (${error.message}); falling back to system fonts`);
}

const appCss = readAsset('.css');
const appJs = readAsset('.js');

// A closing script tag inside a JS string literal would end the block early.
// Hebrew is escaped to \\uXXXX so the script survives a host that serves the
// page without declaring UTF-8 — mis-decoded bytes are a syntax error, not just
// mojibake. Surrogate halves escape individually and still pair up at runtime.
const safeJs = appJs
  .replaceAll('</script', '<\\/script')
  .replace(/[^\x00-\x7F]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);

const html = `<meta charset="utf-8" />
<title>Parcelly</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>
${fontCss}
${appCss}
</style>
<div id="root" dir="rtl" lang="he"></div>
<script type="module">
document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';
${safeJs}
</script>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html);
console.log(`wrote ${OUT_FILE} (${(html.length / 1024).toFixed(0)} KB)`);
