/**
 * Render 1600×900 HTML infographics to PNG via Chrome headless.
 * Usage: node docs/illustrations/render.mjs
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const articles = ['serverless-db-2026', 'muirouter-architecture'];

const results = [];

for (const article of articles) {
  const htmlDir = resolve(__dirname, article, 'html');
  const outDir = resolve(__dirname, article);
  mkdirSync(outDir, { recursive: true });
  if (!existsSync(htmlDir)) continue;

  const files = readdirSync(htmlDir)
    .filter((f) => f.endsWith('.html'))
    .sort();

  for (const file of files) {
    const htmlPath = join(htmlDir, file);
    const slug = basename(file, '.html');
    const pngPath = join(outDir, `${slug}.png`);
    const url = pathToFileURL(htmlPath).href;

    const r = spawnSync(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=1600,900`,
        `--screenshot=${pngPath}`,
        '--default-background-color=00000000',
        '--virtual-time-budget=3000',
        url,
      ],
      { encoding: 'utf8' },
    );

    const ok = existsSync(pngPath) && r.status === 0;
    results.push({
      article,
      file,
      png: pngPath,
      ok,
      status: r.status,
      stderr: (r.stderr || '').slice(-200),
    });
    console.log(ok ? `OK  ${article}/${slug}.png` : `FAIL ${article}/${slug} status=${r.status}`);
  }
}

writeFileSync(resolve(__dirname, 'render-log.json'), JSON.stringify(results, null, 2));
console.log('done', results.filter((x) => x.ok).length, '/', results.length);
