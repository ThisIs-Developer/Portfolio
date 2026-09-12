// Broad geometry audit. Run after building; failures require visual review.
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { startServer } from "./serve.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const localPreview = args.includes("--origin")
  ? null
  : await startServer({ root: path.resolve("dist"), port: 0 });
const origin = option("--origin", localPreview?.url);
const output = option("--output", ".qa-results/responsive-audit");
const widths = option(
  "--widths",
  "320,360,375,390,412,440,600,768,820,912,1024,1152,1280,1440,1600,1920",
)
  .split(",")
  .map(Number);
const sizes = widths.map((width) => ({
  width,
  height: width < 600 ? 844 : 1000,
}));
if (!args.includes("--no-landscape"))
  sizes.push(
    ...[
      { width: 568, height: 320 },
      { width: 667, height: 375 },
      { width: 844, height: 390 },
      { width: 1024, height: 768 },
    ],
  );
const sitemap = await readFile("dist/sitemap.xml", "utf8");
const allRoutes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .concat("/404");
const routes = option("--routes", "").split(",").filter(Boolean);
if (!routes.length) routes.push(...allRoutes);
await mkdir(output, { recursive: true });
const report = {
  date: new Date().toISOString(),
  origin,
  sizes,
  routes,
  results: [],
  errors: [],
};
const browser = await chromium.launch();

async function geometry(page) {
  return page.evaluate(() => {
    const issues = [];
    const warnings = [];
    const selector = (el) =>
      el.id
        ? `#${el.id}`
        : `${el.tagName.toLowerCase()}${[...el.classList]
            .slice(0, 3)
            .map((c) => `.${c}`)
            .join("")}`;
    const visible = (el) => {
      if (
        !el.getClientRects().length ||
        el.closest('[hidden], [inert], .sr-only, [aria-hidden="true"]')
      )
        return false;
      for (
        let node = el;
        node && node !== document.documentElement;
        node = node.parentElement
      ) {
        const style = getComputedStyle(node);
        if (style.visibility === "hidden" || style.display === "none")
          return false;
      }
      return true;
    };
    // World coordinates and deliberate photo/wallet/marquee clipping are audited
    // through their controls, not treated as accidental page overflow.
    const intentional = (el) =>
      el.closest(
        ".playground-world, .photo-fan, .wallet, .wallet-cards, .wallet-stack, .interest-marquee, .interaction-joy-orbit, .folder-peek",
      );
    if (document.documentElement.scrollWidth > innerWidth + 1)
      issues.push({
        kind: "page-overflow",
        actual: document.documentElement.scrollWidth,
        expected: innerWidth,
      });
    for (const el of document.querySelectorAll(
      "h1,h2,h3,h4,p,li,button,label,a,input,textarea,select,img,canvas,summary",
    )) {
      if (!visible(el) || intentional(el)) continue;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (!rect.width || !rect.height) continue;
      if (
        (rect.left < -2 || rect.right > innerWidth + 2) &&
        !el.closest("pre, .table-scroll, .collection-filters, .skip-link")
      ) {
        issues.push({
          kind: "element-outside-viewport",
          selector: selector(el),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          text: el.textContent.trim().slice(0, 65),
        });
      }
      if (el.matches("img") && el.complete && !el.naturalWidth)
        issues.push({
          kind: "broken-image",
          selector: selector(el),
          src: el.currentSrc,
        });
      if (
        el.matches("h1,h2,h3,h4,p,li,label,button,a") &&
        el.textContent.trim()
      ) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const textRects = [...range.getClientRects()].filter(
          (r) => r.width && r.height,
        );
        const ownText = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
        );
        if (
          ownText &&
          parseFloat(style.fontSize) < 12 &&
          !el.closest(
            ".folder-category, .folder-meta, .tags, .article-art, .widget-title, .game-panel",
          )
        )
          warnings.push({
            kind: "small-type",
            selector: selector(el),
            size: style.fontSize,
            text: el.textContent.trim().slice(0, 65),
          });
        // A clipping ancestor is a stronger signal than scrollWidth: a tall art
        // panel could cover text while the page itself has no horizontal scroll.
        for (
          let parent = el;
          parent && parent !== document.body;
          parent = parent.parentElement
        ) {
          const parentStyle = getComputedStyle(parent);
          if (
            parentStyle.display === "contents" ||
            !/(hidden|clip)/.test(parentStyle.overflowX + parentStyle.overflowY)
          )
            continue;
          if (
            parent.closest(
              ".interest-marquee, .playground-board, .photo-fan, .wallet-cards, .wallet-stack",
            ) ||
            parent.matches(
              ".page-surface, main, .folder, .folder-cover, .article-art, .game-panel",
            )
          )
            continue;
          const bounds = parent.getBoundingClientRect();
          const clipped = textRects.some(
            (r) =>
              (/(hidden|clip)/.test(parentStyle.overflowX) &&
                (r.left < bounds.left - 3 || r.right > bounds.right + 3)) ||
              (/(hidden|clip)/.test(parentStyle.overflowY) &&
                (r.top < bounds.top - 3 || r.bottom > bounds.bottom + 3)),
          );
          if (clipped) {
            issues.push({
              kind: "clipped-text",
              selector: selector(el),
              ancestor: selector(parent),
              text: el.textContent.trim().slice(0, 65),
            });
            break;
          }
        }
      }
      if (
        el.matches(
          'button,input:not([type="checkbox"]):not([type="radio"]),select,summary',
        ) &&
        Math.min(rect.width, rect.height) < 24
      )
        warnings.push({
          kind: "small-target",
          selector: selector(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
    }
    for (const card of document.querySelectorAll(
      ".writing-card, .journal-card",
    )) {
      const art = card.querySelector(".article-art");
      const copy = card.querySelector(".writing-copy, .journal-copy");
      if (!art || !copy || !visible(card)) continue;
      const a = art.getBoundingClientRect(),
        b = copy.getBoundingClientRect();
      if (
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2
      )
        issues.push({
          kind: "article-art-overlaps-copy",
          selector: selector(card),
        });
    }
    return {
      issues: [...new Map(issues.map((v) => [JSON.stringify(v), v])).values()],
      warnings: [
        ...new Map(warnings.map((v) => [JSON.stringify(v), v])).values(),
      ],
    };
  });
}

const queue = [...routes];
async function worker() {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: sizes[0],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    report.errors.push({
      route: new URL(page.url()).pathname,
      message: error.message,
    }),
  );
  while (queue.length) {
    const route = queue.shift();
    try {
      await page.goto(origin + route, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map(async (img) => {
            img.loading = "eager";
            await img.decode().catch(() => {});
          }),
        );
      });
      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(100);
        const result = {
          route,
          ...size,
          state: "default",
          ...(await geometry(page)),
        };
        report.results.push(result);
        if (result.issues.length) {
          const file = `${route.replaceAll("/", "-") || "home"}-${size.width}x${size.height}.png`;
          result.screenshot = file;
          await page.screenshot({
            path: path.join(output, file),
            fullPage: true,
          });
        }
        const toggle = page.locator(".menu-toggle");
        if (route === "/" && (await toggle.isVisible())) {
          await toggle.click();
          await page.waitForTimeout(150);
          report.results.push({
            route,
            ...size,
            state: "navigation-open",
            ...(await geometry(page)),
          });
          await page.keyboard.press("Escape");
          await page.waitForTimeout(50);
        }
        if (route === "/play-lab") {
          const interactions = page.locator(
            '.play-lab-switch a[href="#interactions"]',
          );
          await interactions.click();
          await page.waitForTimeout(150);
          report.results.push({
            route,
            ...size,
            state: "interactions",
            ...(await geometry(page)),
          });
          await page.locator('.play-lab-switch a[href="#canvas"]').click();
          await page.waitForTimeout(50);
        }
      }
      const items = report.results.filter((item) => item.route === route);
      console.log(
        `${route}: ${items.length} viewport/states, ${items.reduce((n, item) => n + item.issues.length, 0)} geometry findings`,
      );
    } catch (error) {
      report.errors.push({ route, message: error.message });
      console.error(`${route}: ${error.message}`);
    }
    await writeFile(
      path.join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
  }
  await context.close();
}
try {
  await Promise.all([worker(), worker(), worker()]);
} finally {
  await browser.close();
  if (localPreview)
    await new Promise((resolve) => localPreview.server.close(resolve));
}
const issueStates = report.results.filter((item) => item.issues.length);
report.summary = {
  states: report.results.length,
  issueStates: issueStates.length,
  issues: issueStates.reduce((n, item) => n + item.issues.length, 0),
  errors: report.errors.length,
};
await writeFile(
  path.join(output, "report.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report.summary));
if (report.errors.length || issueStates.length) process.exitCode = 1;
