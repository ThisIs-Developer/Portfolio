import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = path.resolve(option('--dir', fileURLToPath(new URL('../', import.meta.url))));
const output = path.resolve(option('--output', path.join(root, '.qa-results')));
const require = createRequire(import.meta.url);
function dependency(name) {
  try { return require(name); } catch (error) {
    if (process.env.PORTFOLIO_TOOLING_ROOT) return require(path.join(process.env.PORTFOLIO_TOOLING_ROOT, name));
    throw new Error(`Install development dependencies with npm install before testing (${name}).`, { cause: error });
  }
}
const playwright = dependency('playwright');
const AxeBuilder = dependency('@axe-core/playwright').default;
const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const names = option('--browsers', 'chromium').split(',');
const browsers = names.includes('all') ? ['chromium', 'firefox', 'webkit', 'chrome', 'msedge'] : names;
const report = { date: new Date().toISOString(), root, checks: [], failures: [], links: [], performance: [] };
const externalLinks = new Set();
const localLinks = new Set();
await mkdir(output, { recursive: true });
const preview = await startServer({ root, port: 0 });

async function check(name, callback) {
  try {
    const detail = await callback();
    report.checks.push({ name, status: 'passed', ...(detail ? { detail } : {}) });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.failures.push({ name, message: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function load(page, route, noJs = false) {
  await page.goto(`${preview.url}${route}`, { waitUntil: 'networkidle' });
  if (!noJs) await page.evaluate(() => document.fonts.ready);
}

async function inspectLayout(page, noJs = false) {
  // Visit the whole page so lazy assets and viewport-triggered transitions run.
  const geometry = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, step: Math.max(500, innerHeight - 100) }));
  for (let top = 0; top < geometry.height; top += geometry.step) {
    await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), top);
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  // Scroll each lazy image into view before waiting; decode() alone can wait
  // indefinitely when the browser has not started an offscreen request.
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    if (noJs) await page.waitForTimeout(200);
    else {
      const src = await image.getAttribute('src');
      await page.waitForFunction(src => {
        const image = [...document.images].find(item => item.getAttribute('src') === src);
        return image?.complete && image.naturalWidth > 0;
      }, src, { timeout: 8000 });
    }
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(750);
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      h1Count: document.querySelectorAll('h1').length,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src),
      missingAlt: [...document.images].filter(image => !image.hasAttribute('alt')).map(image => image.src),
      undimensionedImages: [...document.images].filter(image => !image.hasAttribute('width') || !image.hasAttribute('height')).map(image => image.src),
      links: [...document.querySelectorAll('a[href]')].map(anchor => anchor.href),
      mainVisible: Boolean(document.querySelector('main')?.getBoundingClientRect().height),
    };
  });
}

async function metadata(page) {
  const result = await page.evaluate(() => {
    const content = selector => document.querySelector(selector)?.getAttribute('content');
    return {
      title: document.title,
      description: content('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogTitle: content('meta[property="og:title"]'),
      ogDescription: content('meta[property="og:description"]'),
      ogImage: content('meta[property="og:image"]'),
      twitter: content('meta[name="twitter:card"]'),
      theme: content('meta[name="theme-color"]'),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent)),
    };
  });
  assert(result.title.includes('Baivab Sarkar') && result.title.length > 15, 'Descriptive page title');
  assert(result.description?.length >= 70, 'Useful meta description');
  assert(result.canonical?.startsWith('https://baivabsarkar.pages.dev/'), 'Canonical points to verified production origin');
  for (const key of ['ogTitle', 'ogDescription', 'ogImage', 'twitter', 'theme']) assert(result[key], `Missing ${key}`);
  assert(result.jsonLd.length > 0, 'Structured data present and valid JSON');
  return result;
}

async function interactions(page, context) {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, '/');
  const toggle = page.locator('.menu-toggle');
  assert(await toggle.isVisible(), 'Mobile menu toggle visible');
  assert.equal(await toggle.getAttribute('aria-controls'), 'site-nav');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  const menuLink = page.locator('#site-nav a').first();
  await menuLink.waitFor({ state: 'visible' });
  assert(await menuLink.isVisible(), 'Opened menu links visible');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Escape closes menu');
  assert(await toggle.evaluate(element => element === document.activeElement), 'Escape restores menu-button focus');
  await toggle.click();
  await menuLink.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Menu closes after navigation');

  await load(page, '/');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#main-content', 'Skip link is first keyboard stop');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content', 'Skip link focuses main content');

  const sourceToggle = page.locator('.readme-toggle');
  if (await sourceToggle.count()) {
    const before = await sourceToggle.getAttribute('aria-pressed');
    await sourceToggle.click();
    assert.notEqual(await sourceToggle.getAttribute('aria-pressed'), before, 'README toggle announces selected state');
    await sourceToggle.click();
    assert.equal(await sourceToggle.getAttribute('aria-pressed'), before);
  }

  const copy = page.locator('.copy-email');
  if (await copy.count()) {
    // Exercise a denied clipboard path; the UI must communicate a usable fallback.
    await context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Clipboard unavailable')) } }));
    await load(page, '/');
    await copy.click();
    await page.waitForFunction(() => document.querySelector('[data-copy-status]')?.textContent.trim());
    assert((await page.locator('[data-copy-status]').innerText()).trim(), 'Copy feedback announced');
  }

  const details = page.locator('details.engineering-notes').first();
  if (await details.count()) {
    await details.locator('summary').click();
    assert(await details.evaluate(element => element.open), 'Engineering details open');
    await details.locator('summary').click();
    assert(!(await details.evaluate(element => element.open)), 'Engineering details close');
  }

  await load(page, '/project.html');
  const filters = page.locator('[data-filter]');
  if (await filters.count()) {
    for (const group of ['featured', 'experiments', 'all']) {
      await page.locator(`[data-filter="${group}"]`).click();
      assert.equal(await page.locator(`[data-filter="${group}"]`).getAttribute('aria-pressed'), 'true');
      const items = await page.locator('[data-project-group]').evaluateAll(elements => elements.map(element => ({ group: element.dataset.projectGroup, hidden: element.hidden })));
      assert(items.some(item => !item.hidden), `${group} filter displays projects`);
      assert(items.every(item => item.hidden === (group !== 'all' && item.group !== group)), `${group} filter has correct result set`);
    }
  }
}

try {
  await check('Preserved deployment files and legacy routes', async () => {
    assert.equal((await readFile(path.join(root, 'CNAME'), 'utf8')).trim(), 'baivabsarkar.me');
    const token = 'google67e0cac1e39b6336.html';
    assert.equal((await fetch(`${preview.url}/${token}`).then(response => response.text())).trim(), `google-site-verification: ${token}`);
    for (const route of ['/', '/index.html', '/project', '/project.html', '/robots.txt', '/sitemap.xml']) {
      const response = await fetch(`${preview.url}${route}`);
      assert.equal(response.status, 200, route);
      assert(response.headers.get('content-security-policy')?.includes("script-src 'self'"), `${route} CSP applied`);
    }
    const missing = await fetch(`${preview.url}/does-not-exist`);
    assert.equal(missing.status, 404);
    assert((await missing.text()).includes('Baivab'), 'Custom 404 page served');
    assert.equal((await fetch(`${preview.url}/.git/config`)).status, 403);
    for (const resume of ['/assets/resume/CV-BAIVAB%20SARKAR.pdf', '/assets/resume/Baivab_Sarkar_Resume.pdf']) {
      const response = await fetch(`${preview.url}${resume}`, { headers: { Range: 'bytes=0-4' } });
      assert.equal(response.status, 206, `${resume} available with byte-range requests`);
      assert.equal(response.headers.get('content-type'), 'application/pdf');
      assert.equal(await response.text(), '%PDF-', `${resume} valid PDF signature`);
    }
  });

  for (const name of browsers) {
    let browser;
    await check(`${name}: browser starts`, async () => {
      const engine = ['chrome', 'msedge'].includes(name) ? playwright.chromium : playwright[name];
      assert(engine, `Unknown browser ${name}`);
      browser = await engine.launch({ headless: true, ...(['chrome', 'msedge'].includes(name) ? { channel: name } : {}) });
      return browser.version();
    });
    if (!browser) continue;
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      let errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.url().startsWith(preview.url) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

      for (const route of ['/', '/project.html']) {
        for (const width of widths) {
          await check(`${name}: ${route} at ${width}px`, async () => {
            errors = [];
            await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
            await load(page, route);
            const layout = await inspectLayout(page);
            assert(layout.documentWidth <= width + 1, `Horizontal overflow: ${layout.documentWidth}px at ${width}px`);
            assert.equal(layout.h1Count, 1, 'Exactly one primary heading');
            assert(layout.mainVisible, 'Main content visible');
            for (const property of ['duplicateIds', 'brokenImages', 'missingAlt', 'undimensionedImages']) assert.deepEqual(layout[property], [], property);
            assert.deepEqual(errors, [], 'No browser or local network errors');
            for (const href of layout.links) {
              if (href.startsWith(preview.url)) localLinks.add(href);
              else if (/^https?:/.test(href)) externalLinks.add(href);
            }
            if ([375, 768, 1440].includes(width)) {
              const filename = `${name}-${route === '/' ? 'home' : 'projects'}-${width}.png`;
              await page.screenshot({ path: path.join(output, filename), fullPage: true });
            }
            if (name === 'chromium' && [390, 1440].includes(width)) {
              const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
              await writeFile(path.join(output, `axe-${route === '/' ? 'home' : 'projects'}-${width}.json`), JSON.stringify(accessibility, null, 2));
              assert.deepEqual(accessibility.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => node.target) })), [], 'No automated WCAG A/AA violations');
              const labelNames = await new AxeBuilder({ page }).withRules(['label-content-name-mismatch']).analyze();
              assert.deepEqual(labelNames.violations.map(violation => violation.nodes.map(node => node.target)), [], 'Visible labels match accessible names');
            }
          });
        }
        await check(`${name}: ${route} metadata`, () => metadata(page));
      }
      await check(`${name}: keyboard, menu, README and copy feedback`, () => interactions(page, context));

      await check(`${name}: reduced motion`, async () => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await load(page, '/');
        const motion = await page.evaluate(() => ({
          preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
          smoothScroll: getComputedStyle(document.documentElement).scrollBehavior,
          activeAnimations: document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect?.getComputedTiming().duration > 20).length,
        }));
        assert(motion.preference);
        assert.notEqual(motion.smoothScroll, 'smooth', 'Reduced motion disables smooth scrolling');
        assert.equal(motion.activeAnimations, 0, 'No ongoing motion under reduced-motion preference');
      });

      await check(`${name}: JavaScript unavailable`, async () => {
        const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 844 } });
        const fallback = await noJs.newPage();
        for (const route of ['/', '/project.html']) {
          await load(fallback, route, true);
          assert(await fallback.locator('main').isVisible(), `${route} content visible without JS`);
          assert(await fallback.locator('#site-nav a').first().isVisible(), `${route} navigation available without JS`);
          const result = await inspectLayout(fallback, true);
          assert(result.documentWidth <= 376, `${route} no-JS overflow`);
          assert.deepEqual(result.brokenImages, []);
        }
        await noJs.close();
      });
      await context.close();
    } finally {
      await browser.close();
    }
  }

  await check('Every local link and fragment resolves', async () => {
    const documents = new Map();
    for (const href of localLinks) {
      const url = new URL(href);
      const fragment = decodeURIComponent(url.hash.slice(1));
      url.hash = '';
      if (!documents.has(url.href)) {
        const response = await fetch(url);
        assert.equal(response.status, 200, url.pathname);
        documents.set(url.href, { type: response.headers.get('content-type'), text: await response.text() });
      }
      const document = documents.get(url.href);
      if (fragment && document.type.includes('text/html')) {
        const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        assert(new RegExp(`id=["']${escaped}["']`).test(document.text), `${url.pathname}#${fragment} target exists`);
      }
    }
    return `${localLinks.size} links and fragments`;
  });

  if (args.includes('--links')) {
    // External services may block automation; report response evidence without mislabelling it a dead link.
    for (const url of externalLinks) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 Portfolio link verification' } });
        report.links.push({ url, status: response.status, destination: response.url, state: response.ok ? 'verified' : [401, 403, 429, 999].includes(response.status) ? 'access-restricted' : 'review' });
        await response.body?.cancel();
      } catch (error) {
        report.links.push({ url, state: 'unverified', reason: error.message });
      }
    }
    console.log(`External links: ${report.links.filter(link => link.state === 'verified').length}/${report.links.length} verified; inspect report for restrictions.`);
  }
} finally {
  preview.server.closeAllConnections();
  await new Promise(resolve => preview.server.close(resolve));
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
}

console.log(`\n${report.checks.length} checks passed; ${report.failures.length} failed. Results: ${output}`);
if (report.failures.length) process.exitCode = 1;
