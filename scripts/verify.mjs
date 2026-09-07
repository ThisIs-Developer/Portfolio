import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = path.resolve(
  option("--dir", fileURLToPath(new URL("../", import.meta.url))),
);
const output = path.resolve(option("--output", path.join(root, ".qa-results")));
const require = createRequire(import.meta.url);
function dependency(name) {
  try {
    return require(name);
  } catch (error) {
    if (process.env.PORTFOLIO_TOOLING_ROOT)
      return require(path.join(process.env.PORTFOLIO_TOOLING_ROOT, name));
    throw new Error(
      `Install development dependencies with npm install before testing (${name}).`,
      { cause: error },
    );
  }
}
const playwright = dependency("playwright");
const AxeBuilder = dependency("@axe-core/playwright").default;
const widths = option("--widths", "320,360,375,390,430,768,1024,1280,1440,1920")
  .split(",")
  .map(Number);
assert(
  widths.length &&
    widths.every((width) => Number.isInteger(width) && width >= 320),
  "--widths expects comma-separated integer widths of at least 320px",
);
const names = option("--browsers", "chromium").split(",");
const browsers = names.includes("all")
  ? ["chromium", "firefox", "webkit", "chrome", "msedge"]
  : names;
const report = {
  date: new Date().toISOString(),
  root,
  checks: [],
  failures: [],
  links: [],
  performance: [],
};
const externalLinks = new Set();
const localLinks = new Set();
await mkdir(output, { recursive: true });
const preview = await startServer({ root, port: 0 });

async function check(name, callback) {
  try {
    const detail = await callback();
    report.checks.push({
      name,
      status: "passed",
      ...(detail ? { detail } : {}),
    });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.failures.push({ name, message: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function load(page, route, noJs = false) {
  await page.goto(`${preview.url}${route}`, { waitUntil: "networkidle" });
  if (!noJs) await page.evaluate(() => document.fonts.ready);
}

async function inspectLayout(page, noJs = false) {
  // Visit the whole page so lazy assets and viewport-triggered transitions run.
  const geometry = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    step: Math.max(500, innerHeight - 100),
  }));
  for (let top = 0; top < geometry.height; top += geometry.step) {
    await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), top);
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  // Scroll each lazy image into view before waiting; decode() alone can wait
  // indefinitely when the browser has not started an offscreen request.
  for (const image of await page.locator("img").all()) {
    // Inactive panels may intentionally keep lazy images hidden. Their visible
    // state is exercised by the relevant interaction check instead.
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    if (noJs) await page.waitForTimeout(200);
    else {
      const src = await image.getAttribute("src");
      await page.waitForFunction(
        (src) => {
          const image = [...document.images].find(
            (item) => item.getAttribute("src") === src,
          );
          return image?.complete && image.naturalWidth > 0;
        },
        src,
        { timeout: 8000 },
      );
    }
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(750);
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(
      (element) => element.id,
    );
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      h1Count: document.querySelectorAll("h1").length,
      brokenImages: [...document.images]
        .filter(
          (image) =>
            image.getClientRects().length &&
            (!image.complete || !image.naturalWidth),
        )
        .map((image) => image.currentSrc || image.src),
      missingAlt: [...document.images]
        .filter((image) => !image.hasAttribute("alt"))
        .map((image) => image.src),
      undimensionedImages: [...document.images]
        .filter(
          (image) =>
            !image.hasAttribute("width") || !image.hasAttribute("height"),
        )
        .map((image) => image.src),
      links: [...document.querySelectorAll("a[href]")].map(
        (anchor) => anchor.href,
      ),
      mainVisible: Boolean(
        document.querySelector("main")?.getBoundingClientRect().height,
      ),
    };
  });
}

async function metadata(page) {
  const result = await page.evaluate(() => {
    const content = (selector) =>
      document.querySelector(selector)?.getAttribute("content");
    return {
      title: document.title,
      description: content('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogTitle: content('meta[property="og:title"]'),
      ogDescription: content('meta[property="og:description"]'),
      ogImage: content('meta[property="og:image"]'),
      twitter: content('meta[name="twitter:card"]'),
      theme: content('meta[name="theme-color"]'),
      jsonLd: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((script) => JSON.parse(script.textContent)),
    };
  });
  assert(
    result.title.includes("Baivab Sarkar") && result.title.length > 15,
    "Descriptive page title",
  );
  assert(result.description?.length >= 70, "Useful meta description");
  assert(
    result.canonical?.startsWith("https://baivabsarkar.pages.dev/"),
    "Canonical points to verified production origin",
  );
  for (const key of ["ogTitle", "ogDescription", "ogImage", "twitter", "theme"])
    assert(result[key], `Missing ${key}`);
  assert(result.jsonLd.length > 0, "Structured data present and valid JSON");
  return result;
}

async function accessibility(page, name) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  await writeFile(
    path.join(output, `axe-${name}.json`),
    JSON.stringify(result, null, 2),
  );
  assert.deepEqual(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target),
    })),
    [],
    "No automated WCAG A/AA violations",
  );
  const labelNames = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();
  assert.deepEqual(
    labelNames.violations.map((violation) =>
      violation.nodes.map((node) => node.target),
    ),
    [],
    "Visible labels match accessible names",
  );
  return {
    rulesPassed: result.passes.length,
    violations: result.violations.length,
  };
}

async function navigation(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, "/");
  const toggle = page.locator(".menu-toggle");
  assert(await toggle.isVisible(), "Mobile menu toggle visible");
  assert.equal(await toggle.getAttribute("aria-controls"), "site-nav");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  const menuLink = page.locator("#site-nav a").first();
  await menuLink.waitFor({ state: "visible" });
  assert(await menuLink.isVisible(), "Opened menu links visible");
  await page.keyboard.press("Escape");
  assert.equal(
    await toggle.getAttribute("aria-expanded"),
    "false",
    "Escape closes menu",
  );
  assert(
    await toggle.evaluate((element) => element === document.activeElement),
    "Escape restores menu-button focus",
  );
  await toggle.click();
  await menuLink.click();
  assert.equal(
    await toggle.getAttribute("aria-expanded"),
    "false",
    "Menu closes after navigation",
  );

  await load(page, "/");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("href")),
    "#main-content",
    "Skip link is first keyboard stop",
  );
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "main-content",
    "Skip link focuses main content",
  );

  await load(page, "/");
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  // The menu was already visible on mobile. Wait for the breakpoint handler,
  // otherwise two fast viewport changes can precede/coalesce its change event.
  await page.waitForFunction(
    () =>
      document.querySelector(".theme-toggle")?.parentElement?.matches(".nav-shell") &&
      !document.querySelector("#site-nav")?.inert,
    null,
    { timeout: 8000 },
  );
  await menuLink.waitFor({ state: "visible" });
  assert(
    !(await page.locator("#site-nav").evaluate((element) => element.inert)),
    "Desktop navigation available after breakpoint resize",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () =>
      document.querySelector(".theme-toggle")?.parentElement?.id === "site-nav" &&
      document.querySelector(".menu-toggle")?.getAttribute("aria-expanded") === "false" &&
      document.querySelector("#site-nav")?.inert,
    null,
    { timeout: 8000 },
  );
  assert.equal(
    await toggle.getAttribute("aria-expanded"),
    "false",
    "Returning to mobile closes menu",
  );
  await toggle.click();
  await page.locator(".nav-backdrop").click({ position: { x: 10, y: 500 } });
  assert.equal(
    await toggle.getAttribute("aria-expanded"),
    "false",
    "Backdrop closes menu",
  );
}

async function showTheme(page) {
  if (!(await page.locator(".theme-toggle").isVisible()))
    await page.locator(".menu-toggle").click();
}

async function theme(page, browser) {
  await load(page, "/");
  const toggle = page.locator(".theme-toggle");
  await showTheme(page);
  assert(await toggle.isVisible(), "Theme control visible");
  assert.equal(
    await toggle.getAttribute("aria-pressed"),
    "false",
    "Fresh theme is light",
  );
  await toggle.focus();
  await page.keyboard.press("Space");
  assert.equal(
    await toggle.getAttribute("aria-pressed"),
    "true",
    "Keyboard enables dark theme",
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await load(page, "/project.html");
  assert.equal(
    await toggle.getAttribute("aria-pressed"),
    "true",
    "Theme persists across pages",
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator("html").getAttribute("data-theme"),
    "dark",
    "Theme persists after reload",
  );
  await showTheme(page);
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");

  const blocked = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get: () => {
          throw new Error("Storage unavailable");
        },
      }),
    );
    const blockedPage = await blocked.newPage();
    const errors = [];
    blockedPage.on("pageerror", (error) => errors.push(error.message));
    await load(blockedPage, "/");
    await showTheme(blockedPage);
    await blockedPage.locator(".theme-toggle").click();
    assert.equal(
      await blockedPage.locator("html").getAttribute("data-theme"),
      "dark",
      "Theme works when storage is unavailable",
    );
    assert.deepEqual(
      errors,
      [],
      "Unavailable storage causes no uncaught errors",
    );
  } finally {
    await blocked.close();
  }
}

async function foldersAndCapabilities(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, "/");
  const folders = page.locator("a.folder");
  const expected = [
    "markdown-viewer",
    "medichain",
    "notemarker",
    "blazedemo",
    "ams",
    "sketchflow",
  ];
  assert.equal(
    await folders.count(),
    expected.length,
    "Six selected project folders",
  );
  const destinations = await folders.evaluateAll((elements) =>
    elements.map((element) => ({
      pathname: new URL(element.href).pathname,
      hash: new URL(element.href).hash,
      title: element.querySelector(".folder-title")?.textContent.trim(),
    })),
  );
  assert.deepEqual(
    destinations.map((item) => item.hash),
    expected.map((id) => `#project-${id}`),
    "Folder links match the selected projects",
  );
  assert(
    destinations.every(
      (item) => item.pathname === "/project.html" && item.title,
    ),
    "Folders have visible titles and archive destinations",
  );

  const capabilities = page.locator("details.capability");
  assert.equal(await capabilities.count(), 5, "Five capability disclosures");
  for (const item of await capabilities.all()) {
    const summary = item.locator("summary");
    await summary.click();
    assert(await item.evaluate((element) => element.open), "Capability opens");
    assert(
      await item.locator(".capability-detail").isVisible(),
      "Expanded capability content visible",
    );
    await summary.press("Enter");
    assert(
      !(await item.evaluate((element) => element.open)),
      "Keyboard closes capability",
    );
  }

  await folders.first().focus();
  await folders.first().press("Enter");
  await page.waitForURL("**/project.html#project-markdown-viewer");
  assert(
    await page.locator("#project-markdown-viewer").isVisible(),
    "Keyboard opens the matching archive project",
  );
  for (const id of expected)
    assert.equal(
      await page.locator(`#project-${id}`).count(),
      1,
      `${id} has one archive entry`,
    );
}

async function quickAsk(page) {
  await load(page, "/");
  const form = page.locator(".quick-ask");
  assert(await form.isVisible(), "Quick Ask is available");
  const input = form.locator('input[name="question"]');
  const answer = page.locator("#ask-answer");
  assert.equal(
    await answer.getAttribute("role"),
    "status",
    "Answers are announced",
  );
  for (const [question, expected] of [
    ["What did you study?", /JIS College of Engineering.*May 2025.*9\.15/],
    ["Tell me about your projects", /Markdown Viewer.*NoteMarker.*MediChain/],
    ["What is your experience with Wipro?", /educational capstone/],
    ["How can I contact you?", /baivabsarkar@gmail\.com/],
    ["an unrelated question", /curated answers/],
  ]) {
    await input.fill(question);
    await input.press("Enter");
    await answer.waitFor({ state: "visible" });
    assert.match(
      await answer.innerText(),
      expected,
      `Useful curated answer: ${question}`,
    );
  }
  assert.equal(
    await page.locator("#bug-run").getAttribute("data-state"),
    "idle",
    "Typing in Quick Ask does not start the game",
  );
}

async function game(page) {
  await load(page, "/");
  const canvas = page.locator("#bug-run");
  const jump = page.locator("#game-jump");
  const pause = page.locator("#game-pause");
  const reset = page.locator("#game-reset");
  const status = page.locator("#game-status");
  for (const button of [jump, pause, reset])
    assert(await button.isVisible(), "Game control visible");
  assert.equal(
    await canvas.getAttribute("data-state"),
    "idle",
    "Game does not autoplay",
  );
  assert(await pause.isDisabled(), "Pause disabled before starting");
  assert.equal(
    await status.getAttribute("role"),
    "status",
    "Game state announced",
  );
  await canvas.scrollIntoViewIfNeeded();
  await jump.click();
  await page.waitForFunction(
    () => document.querySelector("#bug-run")?.dataset.state === "running",
  );
  assert.match(await status.innerText(), /Running/);
  await pause.click();
  assert.equal(await canvas.getAttribute("data-state"), "paused");
  const pausedScore = await page.locator("#game-score").innerText();
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator("#game-score").innerText(),
    pausedScore,
    "Pause holds score",
  );
  await pause.click();
  assert.equal(
    await canvas.getAttribute("data-state"),
    "running",
    "Resume continues the game",
  );
  await reset.click();
  assert.equal(
    await canvas.getAttribute("data-state"),
    "idle",
    "Reset returns to idle",
  );
  assert.equal(
    await page.locator("#game-score").innerText(),
    "0",
    "Reset clears the score",
  );
  await canvas.focus();
  await canvas.press("Space");
  assert.equal(
    await canvas.getAttribute("data-state"),
    "running",
    "Focused canvas supports Space",
  );
  await canvas.press("Escape");
  assert.equal(
    await canvas.getAttribute("data-state"),
    "paused",
    "Escape pauses the focused game",
  );
  await reset.click();
}

async function clipboard(browser) {
  for (const allowed of [true, false]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    try {
      await context.addInitScript(
        (allowed) =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async (text) => {
                if (!allowed) throw new Error("Clipboard unavailable");
                window.__copiedEmail = text;
              },
            },
          }),
        allowed,
      );
      const page = await context.newPage();
      await load(page, "/");
      const copy = page.locator(".copy-email");
      assert(await copy.isVisible(), "Copy email button available");
      await copy.click();
      await page.waitForFunction(() =>
        document.querySelector("[data-copy-status]")?.textContent.trim(),
      );
      const message = await page.locator("[data-copy-status]").innerText();
      if (allowed) {
        assert.match(message, /copied/i);
        assert.equal(
          await page.evaluate(() => window.__copiedEmail),
          "baivabsarkar@gmail.com",
          "Copy uses the authentic address",
        );
      } else
        assert.match(
          message,
          /select.*email.*copy/i,
          "Clipboard denial provides a usable fallback",
        );
      assert.equal(
        await page.locator(".email-link").getAttribute("href"),
        "mailto:baivabsarkar@gmail.com",
      );
    } finally {
      await context.close();
    }
  }
}

async function archive(page) {
  await load(page, "/project.html");
  const filters = page.locator("[data-filter]");
  assert.equal(await filters.count(), 3, "All archive filters exist");
  assert.equal(
    await page.locator("[data-project-group]").count(),
    9,
    "Nine unique archive projects",
  );
  for (const [group, expected] of [
    ["featured", 4],
    ["experiments", 5],
    ["all", 9],
  ]) {
    await page.locator(`[data-filter="${group}"]`).click();
    assert.equal(
      await page
        .locator(`[data-filter="${group}"]`)
        .getAttribute("aria-pressed"),
      "true",
    );
    const items = await page
      .locator("[data-project-group]")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          group: element.dataset.projectGroup,
          hidden: element.hidden,
        })),
      );
    assert.equal(
      items.filter((item) => !item.hidden).length,
      expected,
      `${group} filter displays expected count`,
    );
    assert(
      items.every(
        (item) => item.hidden === (group !== "all" && item.group !== group),
      ),
      `${group} filter has correct result set`,
    );
    assert.equal(
      await page.locator("[data-filter-status]").innerText(),
      `${expected} projects`,
      "Filtered count announced",
    );
  }
  const details = page.locator("details.engineering-notes").first();
  assert.equal(
    await page.locator("details.engineering-notes").count(),
    9,
    "Every project retains engineering notes",
  );
  await details.locator("summary").click();
  assert(
    await details.evaluate((element) => element.open),
    "Engineering details open",
  );
  assert(
    await details.locator(".notes-body").isVisible(),
    "Engineering content visible",
  );
  await details.locator("summary").press("Enter");
  assert(
    !(await details.evaluate((element) => element.open)),
    "Engineering details close with keyboard",
  );
}

try {
  await check("Preserved deployment files and legacy routes", async () => {
    assert.equal(
      (await readFile(path.join(root, "CNAME"), "utf8")).trim(),
      "baivabsarkar.me",
    );
    const token = "google67e0cac1e39b6336.html";
    assert.equal(
      (
        await fetch(`${preview.url}/${token}`).then((response) =>
          response.text(),
        )
      ).trim(),
      `google-site-verification: ${token}`,
    );
    for (const route of [
      "/",
      "/index.html",
      "/project",
      "/project.html",
      "/robots.txt",
      "/sitemap.xml",
    ]) {
      const response = await fetch(`${preview.url}${route}`);
      assert.equal(response.status, 200, route);
      assert(
        response.headers
          .get("content-security-policy")
          ?.includes("script-src 'self'"),
        `${route} CSP applied`,
      );
    }
    const missing = await fetch(`${preview.url}/does-not-exist`);
    assert.equal(missing.status, 404);
    assert((await missing.text()).includes("Baivab"), "Custom 404 page served");
    assert.equal((await fetch(`${preview.url}/.git/config`)).status, 403);
    for (const resume of [
      "/assets/resume/CV-BAIVAB%20SARKAR.pdf",
      "/assets/resume/Baivab_Sarkar_Resume.pdf",
    ]) {
      const response = await fetch(`${preview.url}${resume}`, {
        headers: { Range: "bytes=0-4" },
      });
      assert.equal(
        response.status,
        206,
        `${resume} available with byte-range requests`,
      );
      assert.equal(response.headers.get("content-type"), "application/pdf");
      assert.equal(
        await response.text(),
        "%PDF-",
        `${resume} valid PDF signature`,
      );
    }
  });

  for (const name of browsers) {
    let browser;
    await check(`${name}: browser starts`, async () => {
      const engine = ["chrome", "msedge"].includes(name)
        ? playwright.chromium
        : playwright[name];
      assert(engine, `Unknown browser ${name}`);
      browser = await engine.launch({
        headless: true,
        ...(["chrome", "msedge"].includes(name) ? { channel: name } : {}),
      });
      return browser.version();
    });
    if (!browser) continue;
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      let errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.url().startsWith(preview.url) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });

      for (const route of ["/", "/project.html"]) {
        for (const width of widths) {
          await check(`${name}: ${route} at ${width}px`, async () => {
            errors = [];
            await page.setViewportSize({
              width,
              height: width < 768 ? 844 : 1000,
            });
            await load(page, route);
            const layout = await inspectLayout(page);
            assert(
              layout.documentWidth <= width + 1,
              `Horizontal overflow: ${layout.documentWidth}px at ${width}px`,
            );
            assert.equal(layout.h1Count, 1, "Exactly one primary heading");
            assert(layout.mainVisible, "Main content visible");
            for (const property of [
              "duplicateIds",
              "brokenImages",
              "missingAlt",
              "undimensionedImages",
            ])
              assert.deepEqual(layout[property], [], property);
            assert.deepEqual(errors, [], "No browser or local network errors");
            for (const href of layout.links) {
              if (href.startsWith(preview.url)) localLinks.add(href);
              else if (/^https?:/.test(href)) externalLinks.add(href);
            }
            if ([375, 768, 1440].includes(width)) {
              const filename = `${name}-${route === "/" ? "home" : "projects"}-${width}.png`;
              await page.screenshot({
                path: path.join(output, filename),
                fullPage: true,
              });
            }
            if (name === "chromium" && [390, 1440].includes(width)) {
              await accessibility(
                page,
                `${route === "/" ? "home" : "projects"}-${width}-light`,
              );
            }
          });
        }
        await check(`${name}: ${route} metadata`, () => metadata(page));
      }
      for (const [label, callback] of [
        ["keyboard and responsive navigation", () => navigation(page)],
        [
          "theme persistence and unavailable storage",
          () => theme(page, browser),
        ],
        [
          "project folders and capabilities",
          () => foldersAndCapabilities(page),
        ],
        ["curated Quick Ask", () => quickAsk(page)],
        ["game start, pause, reset and keyboard", () => game(page)],
        ["clipboard success and denial", () => clipboard(browser)],
        ["archive filters and engineering notes", () => archive(page)],
      ]) {
        await check(`${name}: ${label}`, async () => {
          errors = [];
          await callback();
          assert.deepEqual(errors, [], "No interaction-related browser errors");
        });
      }

      if (name === "chromium") {
        for (const route of ["/", "/project.html"]) {
          for (const width of [390, 1440]) {
            await check(
              `${name}: ${route} dark theme at ${width}px`,
              async () => {
                await page.setViewportSize({
                  width,
                  height: width < 768 ? 844 : 1000,
                });
                await load(page, route);
                await showTheme(page);
                if (
                  (await page.locator("html").getAttribute("data-theme")) !==
                  "dark"
                )
                  await page.locator(".theme-toggle").click();
                const layout = await inspectLayout(page);
                assert(
                  layout.documentWidth <= width + 1,
                  "Dark theme has no horizontal overflow",
                );
                await accessibility(
                  page,
                  `${route === "/" ? "home" : "projects"}-${width}-dark`,
                );
                await page.screenshot({
                  path: path.join(
                    output,
                    `chromium-${route === "/" ? "home" : "projects"}-${width}-dark.png`,
                  ),
                  fullPage: true,
                });
                await showTheme(page);
                await page.locator(".theme-toggle").click();
              },
            );
          }
        }
      }

      await check(`${name}: reduced motion`, async () => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await load(page, "/");
        await page
          .locator("details.capability")
          .first()
          .scrollIntoViewIfNeeded();
        await page.locator("details.capability summary").first().click();
        await showTheme(page);
        await page.locator(".theme-toggle").click();
        const motion = await page.evaluate(() => ({
          preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
          smoothScroll: getComputedStyle(document.documentElement)
            .scrollBehavior,
          activeAnimations: document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === "running" &&
                animation.effect?.getComputedTiming().duration > 20,
            ).length,
        }));
        assert(motion.preference);
        assert.notEqual(
          motion.smoothScroll,
          "smooth",
          "Reduced motion disables smooth scrolling",
        );
        assert.equal(
          motion.activeAnimations,
          0,
          "No ongoing motion under reduced-motion preference",
        );
        assert.equal(
          await page.locator("#bug-run").getAttribute("data-state"),
          "idle",
          "Game stays idle under reduced motion until started",
        );
      });

      await check(`${name}: JavaScript unavailable`, async () => {
        const noJs = await browser.newContext({
          javaScriptEnabled: false,
          viewport: { width: 375, height: 844 },
        });
        const fallback = await noJs.newPage();
        for (const route of ["/", "/project.html"]) {
          await load(fallback, route, true);
          assert(
            await fallback.locator("main").isVisible(),
            `${route} content visible without JS`,
          );
          assert(
            await fallback.locator("#site-nav a").first().isVisible(),
            `${route} navigation available without JS`,
          );
          const result = await inspectLayout(fallback, true);
          assert(result.documentWidth <= 376, `${route} no-JS overflow`);
          assert.deepEqual(result.brokenImages, []);
          const disclosure = fallback
            .locator(
              route === "/"
                ? "details.capability"
                : "details.engineering-notes",
            )
            .first();
          await disclosure.locator("summary").click();
          assert(
            await disclosure.evaluate((element) => element.open),
            `${route} native details work without JavaScript`,
          );
          if (route === "/") {
            assert.equal(
              await fallback.locator("a.folder").count(),
              6,
              "All project folders remain available without JavaScript",
            );
            assert(
              !(await fallback.locator(".quick-ask").isVisible()),
              "Unavailable Quick Ask is hidden without JavaScript",
            );
            assert(
              !(await fallback.locator("#game-jump").isVisible()),
              "Unavailable game controls are hidden without JavaScript",
            );
          }
        }
        await noJs.close();
      });
      await context.close();
    } finally {
      await browser.close();
    }
  }

  await check("Every local link and fragment resolves", async () => {
    const documents = new Map();
    for (const href of localLinks) {
      const url = new URL(href);
      const fragment = decodeURIComponent(url.hash.slice(1));
      url.hash = "";
      if (!documents.has(url.href)) {
        const response = await fetch(url);
        assert.equal(response.status, 200, url.pathname);
        documents.set(url.href, {
          type: response.headers.get("content-type"),
          text: await response.text(),
        });
      }
      const document = documents.get(url.href);
      if (fragment && document.type.includes("text/html")) {
        const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert(
          new RegExp(`id=["']${escaped}["']`).test(document.text),
          `${url.pathname}#${fragment} target exists`,
        );
      }
    }
    return `${localLinks.size} links and fragments`;
  });

  if (args.includes("--links")) {
    // External services may block automation; report response evidence without mislabelling it a dead link.
    for (const url of externalLinks) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(20000),
          headers: { "User-Agent": "Mozilla/5.0 Portfolio link verification" },
        });
        report.links.push({
          url,
          status: response.status,
          destination: response.url,
          state: response.ok
            ? "verified"
            : [401, 403, 429, 999].includes(response.status)
              ? "access-restricted"
              : "review",
        });
        await response.body?.cancel();
      } catch (error) {
        report.links.push({ url, state: "unverified", reason: error.message });
      }
    }
    console.log(
      `External links: ${report.links.filter((link) => link.state === "verified").length}/${report.links.length} verified; inspect report for restrictions.`,
    );
  }
} finally {
  preview.server.closeAllConnections();
  await new Promise((resolve) => preview.server.close(resolve));
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
}

console.log(
  `\n${report.checks.length} checks passed; ${report.failures.length} failed. Results: ${output}`,
);
if (report.failures.length) process.exitCode = 1;
