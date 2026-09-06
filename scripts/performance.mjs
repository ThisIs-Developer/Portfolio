import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';
import { startServer } from './serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.qa-results', 'lighthouse');
await mkdir(output, { recursive: true });
const preview = await startServer({ root: path.join(root, 'dist'), port: 0 });
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));

// Playwright owns browser cleanup, avoiding Chrome Launcher's Windows temp-file race.
let browser;
try {
  browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
  for (const [name, route, config] of [['home-mobile', '/', undefined], ['home-desktop', '/', desktop], ['archive-mobile', '/project.html', undefined]]) {
    const result = await lighthouse(`${preview.url}${route}`, {
      port, output: ['json', 'html'], logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    }, config);
    assert(result && !result.lhr.runtimeError, result?.lhr.runtimeError?.message || 'Lighthouse did not produce a report');
    await writeFile(path.join(output, `${name}.json`), result.report[0]);
    await writeFile(path.join(output, `${name}.html`), result.report[1]);
    console.log(name, Object.fromEntries(Object.entries(result.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)])));
  }
} finally {
  await browser?.close();
  preview.server.closeAllConnections();
  await new Promise(resolve => preview.server.close(resolve));
}
