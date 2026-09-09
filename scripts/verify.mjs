import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";
import { loadLocalArticles, mergeArticles } from "./local-articles.mjs";
import { projectCollections } from "./project-selection.mjs";

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
const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
const articleData = mergeArticles(
  JSON.parse(
    await readFile(path.join(sourceRoot, "data/articles.json"), "utf8"),
  ),
  await loadLocalArticles(sourceRoot),
);
const projectSources = await Promise.all(
  ["projects", "experiments", "project-additions"].map(async (name) =>
    JSON.parse(
      await readFile(path.join(sourceRoot, "data", `${name}.json`), "utf8"),
    ),
  ),
);
const projectData = projectCollections({
  projects: projectSources[0],
  experiments: projectSources[1],
  projectAdditions: projectSources[2],
}).all;
const featuredIds = [
  "markdown-viewer",
  "sei-sangeet-bangla",
  "medical-chatbot",
  "body-language",
  "medichain",
  "ams",
];
const archiveIds = [
  "notemarker",
  "sketchflow",
  "csv-chatbot",
  "news-scraper",
  "taskflow",
  "simon",
];
const legacyRoutes = [
  ["/playground", "/play-lab"],
  ["/playground.html", "/play-lab"],
  ["/interactions", "/play-lab#interactions"],
  ["/interactions.html", "/play-lab#interactions"],
  ["/tools", "/work"],
  ["/tools.html", "/work"],
  ["/work/blazedemo", "/work"],
  ["/work/blazedemo.html", "/work"],
];
const pageRoutes = [
  "/",
  "/about",
  "/work",
  "/blog",
  "/play-lab",
  "/work/markdown-viewer",
  articleData[0].localPath,
  "/404",
];
const routeName = (route) =>
  route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "-");
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
  assert(
    result.description?.length >= 35,
    "Useful page-specific meta description",
  );
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
  await page.waitForURL("**/about");
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
      document
        .querySelector(".theme-toggle")
        ?.parentElement?.matches(".nav-shell") &&
      !document.querySelector("#site-nav")?.inert,
    null,
    { timeout: 8000 },
  );
  await menuLink.waitFor({ state: "visible" });
  assert(
    !(await page.locator("#site-nav").evaluate((element) => element.inert)),
    "Desktop navigation available after breakpoint resize",
  );
  const labLink = page.locator('#site-nav a[href="/play-lab"]');
  assert.equal(
    await labLink.count(),
    1,
    "Navigation has one combined Play Lab destination",
  );
  assert.match(
    await labLink.innerText(),
    /Play Lab/i,
    "Navigation uses the renamed page title",
  );
  assert.equal(
    await page
      .locator(
        '#site-nav a[href="/tools"], #site-nav a[href="/playground"], #site-nav a[href="/interactions"]',
      )
      .count(),
    0,
    "Navigation no longer advertises the removed or superseded pages",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () =>
      document.querySelector(".theme-toggle")?.parentElement?.id ===
        "site-nav" &&
      document.querySelector(".menu-toggle")?.getAttribute("aria-expanded") ===
        "false" &&
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
  await load(page, "/work");
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
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const clipped = await folders.evaluateAll((cards) =>
      cards
        .filter(
          (card) =>
            card.querySelector(".folder-bottom").getBoundingClientRect()
              .bottom >
            card.querySelector(".folder-front").getBoundingClientRect().bottom +
              1,
        )
        .map((card) => card.querySelector(".folder-title").textContent),
    );
    assert.deepEqual(
      clipped,
      [],
      `Full project names and actions fit their folders at ${width}px`,
    );
  }
  const expected = featuredIds;
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
    destinations.map((item) => item.pathname),
    expected.map((id) => `/work/${id}`),
    "Folder links match the selected projects",
  );
  assert(
    destinations.every(
      (item) => item.pathname.startsWith("/work/") && item.title,
    ),
    "Folders have visible titles and dedicated local project destinations",
  );
  const archiveLinks = page.locator(".home-archive .archive-link");
  assert.deepEqual(
    await archiveLinks.evaluateAll((elements) =>
      elements.map((element) => new URL(element.href).pathname),
    ),
    archiveIds.map((id) => `/work/${id}`),
    "Home archive includes exactly the six requested projects in their curated order",
  );
  assert.deepEqual(
    await page.locator("#projects .project-number").allTextContents(),
    Array.from({ length: 12 }, (_, index) =>
      String(index + 1).padStart(2, "0"),
    ),
    "Home project numbering runs from 01 to 12 across both collections",
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
  await page.waitForURL("**/work/markdown-viewer");
  assert(
    await page.locator(".reading-header h1").isVisible(),
    "Keyboard opens the matching full project story",
  );
  assert.match(await page.locator("h1").innerText(), /Markdown Viewer/);
  assert(
    await page.locator("#project-notes").isVisible(),
    "Project engineering notes are readable",
  );
  await load(page, "/work");
  for (const id of [...featuredIds, ...archiveIds])
    assert.equal(
      await page.locator(`#project-${id}`).count(),
      1,
      `${id} has one work entry`,
    );
  assert.equal(
    await page.locator(".private-card").count(),
    4,
    "Behind the scenes contains exactly four private engagements",
  );
  assert.equal(
    new Set(
      await page
        .locator(".private-card")
        .evaluateAll((cards) => cards.map((card) => card.getAttribute("href"))),
    ).size,
    4,
    "Private engagement cards have four distinct destinations",
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
    [
      "Tell me about your projects",
      /Featured projects: Markdown Viewer.*MediChain.*More work.*NoteMarker/s,
    ],
    ["What is your experience?", /Java\/Selenium SDET training/],
    ["How can I contact you?", /baivabsarkar@gmail\.com/],
    ["an unrelated question", /verified information/],
  ]) {
    await input.fill(question);
    await input.press("Enter");
    await answer.waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.querySelector(".quick-ask").hasAttribute("aria-busy"),
    );
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

async function game(page, route = "/") {
  await load(page, route);
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
  await collections(page);
}

async function curatedWorkGroups(page) {
  const groups = page.locator("[data-project-group]");
  assert.equal(
    await groups.count(),
    2,
    "Work separates featured projects from the archive",
  );
  const actual = await groups.evaluateAll((elements) =>
    elements.map((group) =>
      [...group.querySelectorAll("[data-collection-item]")].map((item) =>
        item.id.replace(/^project-/, ""),
      ),
    ),
  );
  assert.deepEqual(
    actual,
    [featuredIds, archiveIds],
    "Both work collections preserve the requested project order",
  );
}

async function collections(page) {
  for (const route of ["/work", "/blog"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await load(page, route);
    const items = page.locator("[data-collection-item]");
    const total = await items.count();
    assert(total >= 9, `${route} includes the full collection`);
    if (route === "/work") {
      assert.equal(
        total,
        12,
        "Work contains exactly the twelve requested public projects",
      );
      await curatedWorkGroups(page);
    }
    if (route === "/blog")
      assert.equal(
        total,
        articleData.length,
        "Every imported post is available",
      );
    for (const filter of await page.locator("button[data-category]").all()) {
      const category = await filter.getAttribute("data-category");
      await filter.click();
      assert.equal(await filter.getAttribute("aria-pressed"), "true");
      const states = await items.evaluateAll((elements) =>
        elements.map((element) => ({
          category: element.dataset.category,
          hidden: element.hidden,
        })),
      );
      assert(
        states.every(
          (item) =>
            item.hidden === (category !== "All" && item.category !== category),
        ),
        `${route} category ${category} selects the right items`,
      );
      if (route === "/work") await curatedWorkGroups(page);
    }
    await page.locator('button[data-category="All"]').click();
    const search = page.locator("[data-search]");
    await search.fill("zz-no-matching-item");
    assert.equal(
      await page.locator("[data-collection-item]:visible").count(),
      0,
    );
    assert(
      await page.locator(".collection-empty").isVisible(),
      "No-result state is visible",
    );
    assert.match(
      await page.locator("[data-collection-status]").innerText(),
      /^0 /,
    );
    await search.fill("Markdown");
    assert(
      (await page.locator("[data-collection-item]:visible").count()) > 0,
      "Search finds genuine project/article content",
    );
    assert(
      !(await page.locator(".collection-empty").isVisible()),
      "Results replace empty state",
    );
    if (route === "/work") {
      await search.fill("Simon");
      assert.equal(
        await page.locator("[data-collection-item]:visible").count(),
        1,
        "Search reaches projects in the archive",
      );
      assert(
        await page.locator("#project-simon").isVisible(),
        "Archive search returns Simon",
      );
      await search.fill("Medical Chatbot");
      assert.equal(
        await page.locator("[data-collection-item]:visible").count(),
        1,
        "Search also reaches featured projects",
      );
      assert(
        await page.locator("#project-medical-chatbot").isVisible(),
        "Featured search returns the medical chatbot",
      );
      await curatedWorkGroups(page);
    }
    await search.fill("");
    assert.equal(
      await page.locator("[data-collection-item]:visible").count(),
      total,
    );
    if (route === "/work") await curatedWorkGroups(page);
    for (const ascending of route === "/work" ? [false, true] : [true, false]) {
      await page.locator("[data-sort]").click();
      const datesByGroup = await page
        .locator("[data-collection-grid]")
        .evaluateAll((grids) =>
          grids.map((grid) =>
            [...grid.querySelectorAll("[data-collection-item]")].map(
              (element) => Date.parse(element.dataset.date),
            ),
          ),
        );
      assert(
        datesByGroup.every((dates) =>
          dates.every(
            (date, i) =>
              !i || (ascending ? dates[i - 1] <= date : dates[i - 1] >= date),
          ),
        ),
        `${route} date sort is ${ascending ? "ascending" : "descending"}`,
      );
      if (route === "/work") {
        const members = await page
          .locator("[data-project-group]")
          .evaluateAll((groups) =>
            groups.map((group) =>
              [...group.querySelectorAll("[data-collection-item]")]
                .map((item) => item.id.replace(/^project-/, ""))
                .sort(),
            ),
          );
        assert.deepEqual(
          members,
          [[...featuredIds].sort(), [...archiveIds].sort()],
          "Sorting never moves projects between featured work and the archive",
        );
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileFilter = page.locator(".collection-mobile-filter select");
    assert(
      await mobileFilter.isVisible(),
      "Mobile collection filter is accessible",
    );
    await mobileFilter.selectOption({ index: 1 });
    const selected = await mobileFilter.inputValue();
    assert.equal(
      await page
        .locator(`button[data-category="${selected}"]`)
        .getAttribute("aria-pressed"),
      "true",
      "Mobile and desktop filter controls stay synchronized",
    );
    const visibleCategories = await page
      .locator("[data-collection-item]:visible")
      .evaluateAll((elements) =>
        elements.map((element) => element.dataset.category),
      );
    assert(visibleCategories.every((category) => category === selected));
    await mobileFilter.selectOption("All");
    const first = page
      .locator(route === "/blog" ? ".journal-card" : ".folder")
      .first();
    const destination = await first.getAttribute("href");
    await first.click();
    await page.waitForURL(`${preview.url}${destination}`);
    assert(
      await page.locator(".reading-main").isVisible(),
      "Collection item opens a full local reader",
    );
  }
}

async function readers(page) {
  for (const project of projectData) {
    await load(page, `/work/${project.id}`);
    assert.equal(
      await page.locator("h1").innerText(),
      project.title,
      "Each requested project has its own reader",
    );
    assert(await page.locator("#contribution").isVisible());
    assert.equal(
      await page
        .locator(".case-actions a")
        .filter({ hasText: "Source code" })
        .count(),
      project.source ? 1 : 0,
      "Private source URLs are not exposed",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const article of articleData) {
    await load(page, article.localPath);
    assert.equal(
      await page.locator("h1").innerText(),
      article.title,
      "The requested article title is rendered",
    );
    const body = page.locator(".article-body");
    const authoredText = await page.evaluate(
      (html) =>
        new DOMParser()
          .parseFromString(html, "text/html")
          .body.textContent.replace(/\s+/g, "")
          .trim(),
      article.bodyHtml,
    );
    const renderedText = (await body.textContent()).replace(/\s+/g, "").trim();
    assert.equal(
      renderedText,
      authoredText,
      "The complete imported article is readable locally",
    );
    assert(renderedText.length > 100, "Article contains authored text");
    assert.equal(
      await body.locator("h1,script,iframe,form,object,embed,svg,math").count(),
      0,
      "Imported prose contains no executable embeds or extra primary headings",
    );
    const attributes = await body
      .locator("*")
      .evaluateAll((elements) =>
        elements.flatMap((element) =>
          [...element.attributes]
            .filter((attribute) => /^on|^style$/i.test(attribute.name))
            .map((attribute) => attribute.name),
        ),
      );
    assert.deepEqual(
      attributes,
      [],
      "Imported markup has no event handlers or inline styles",
    );
    const images = await body.locator("img").evaluateAll((elements) =>
      elements.map((image) => ({
        src: image.getAttribute("src"),
        width: image.width,
        height: image.height,
      })),
    );
    assert(
      images.every(
        (image) =>
          image.src.startsWith("/assets/articles/") &&
          image.width > 0 &&
          image.height > 0,
      ),
      "Article images are local and dimensioned",
    );
    if (article.editorNote)
      assert(
        (await page.locator(".article-editor-note").innerText()).includes(
          article.editorNote,
        ),
        "Technical correction accompanies the historical article",
      );
    const ownLinks = await body
      .locator('a[href^="https://dev.to/thisisdeveloper/"]')
      .count();
    assert.equal(ownLinks, 0, "Links to own articles stay inside this website");
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((elements) => elements.map((anchor) => anchor.href))) {
      if (href.startsWith(preview.url)) localLinks.add(href);
    }
    const tocLink = page.locator(".reading-toc a").first();
    if (await tocLink.count()) {
      const toc = page.locator(".reading-toc");
      assert(
        !(await toc.evaluate((element) => element.open)),
        "Mobile table of contents starts compact",
      );
      await toc.locator("summary").click();
      const fragment = await tocLink.getAttribute("href");
      await tocLink.click();
      assert(
        !(await toc.evaluate((element) => element.open)),
        "Choosing a section closes the mobile table of contents",
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        fragment.slice(1),
        "Section links move keyboard focus into the article",
      );
    }
  }
  const missing = await fetch(`${preview.url}/missing-page-for-verification`);
  assert.equal(missing.status, 404, "Unknown routes preserve the 404 status");
  const html = await missing.text();
  assert(
    html.includes('id="bug-run"'),
    "The actual 404 response includes the playable game",
  );
  assert(
    /name="robots"[^>]*noindex/.test(html),
    "404 page is excluded from search indexing",
  );
  await game(page, "/404");
  await page.locator('a[href="/"]').last().click();
  await page.waitForURL(`${preview.url}/`);
}

async function playground(page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, "/play-lab");
  assert.match(
    await page.locator("h1").innerText(),
    /Play Lab/i,
    "The combined page has its new title",
  );
  assert.equal(
    await page.locator("#canvas").count(),
    1,
    "Canvas has a direct section link",
  );
  assert.equal(
    await page.locator("#interactions").count(),
    1,
    "Interactions live on the same page",
  );
  const board = page.locator("[data-playground-board]");
  const card = page.locator("[data-playground-card]").first();
  assert.equal(await page.locator("[data-playground-card]").count(), 7);
  await card.focus();
  const before = await card.boundingBox();
  await card.press("ArrowRight");
  const after = await card.boundingBox();
  assert(after.x > before.x, "Arrow keys move the focused canvas card");
  await page.locator('[data-playground-zoom="in"]').click();
  assert.equal(
    await page.locator("[data-playground-zoom-label]").innerText(),
    "115%",
  );
  await page.locator("[data-playground-reset]").click();
  assert.equal(
    await page.locator("[data-playground-zoom-label]").innerText(),
    "100%",
  );
  await page.locator('[data-playground-color="green"]').click();
  assert.equal(await board.getAttribute("data-canvas-color"), "green");
  await page.locator("[data-playground-view]").click();
  assert(
    await board.evaluate((element) => element.classList.contains("is-list")),
    "List view presents cards in reading order",
  );
  const checkbox = page.locator('[data-playground-check="read"]');
  await checkbox.check();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await board.getAttribute("data-canvas-color"),
    "green",
    "Canvas color persists",
  );
  assert(await checkbox.isChecked(), "Checklist progress persists");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-playground-view]").click();
  assert.equal(
    await page.locator("[data-playground-card]:visible").count(),
    7,
    "All cards remain readable on mobile",
  );
  await page.locator('a[href="#interactions"]').click();
  assert.equal(
    new URL(page.url()).pathname,
    "/play-lab",
    "Opening interactions stays in Play Lab",
  );
  assert.equal(new URL(page.url()).hash, "#interactions");

  assert.equal(await page.locator(".playground-experiment").count(), 6);
  await page.locator('[data-shape-choice="star"]').click();
  assert.equal(
    await page
      .locator("[data-interaction-shape]")
      .getAttribute("data-interaction-shape"),
    "star",
  );
  await page.locator('[data-spring-character="bouncy"]').click();
  await page.locator("[data-spring-launch]").click();
  assert.match(
    await page.locator("[data-spring-status]").innerText(),
    /right.*bouncy/,
  );
  const pass = page.locator("[data-depth-card]");
  await pass.click();
  assert.equal(await pass.getAttribute("aria-pressed"), "true");
  assert(await page.locator(".depth-card-back").isVisible());
  await page.locator("[data-joy-button]").click();
  assert.match(
    await page.locator("[data-joy-status]").innerText(),
    /1 little moment/,
  );
  const bloomSpread = page.locator("[data-bloom-spread]");
  await bloomSpread.focus();
  await bloomSpread.press("End");
  assert.equal(
    await bloomSpread.inputValue(),
    "100",
    "Keyboard opens the bloom petals fully",
  );
  assert.equal(await page.locator("[data-bloom-value]").innerText(), "100%");
  await page.locator("[data-bloom-spin]").click();
  assert.match(
    await page.locator("[data-bloom-status]").innerText(),
    /1 spin.*100 percent/,
  );
  const rippleColour = page.locator('[data-ripple-colour="rose"]');
  await rippleColour.click();
  assert.equal(await rippleColour.getAttribute("aria-pressed"), "true");
  assert.equal(
    await page
      .locator(".interaction-ripple-stage")
      .getAttribute("data-ripple-theme"),
    "rose",
  );
  const pond = page.locator("[data-ripple-pond]");
  await pond.focus();
  await pond.press("Enter");
  assert.match(
    await page.locator("[data-ripple-status]").innerText(),
    /1 ripple made/,
  );
  assert.equal(
    await page.locator("[data-ripple-rings] > *").count(),
    3,
    "Keyboard activation creates a visible ripple",
  );
  await load(page, "/play-lab");
  const note = page.locator("[data-widget-note]");
  await note.fill("A useful new idea.");
  await page.locator('[data-widget-vote="tool"]').click();
  await page.locator('[data-widget-duration="15"]').click();
  assert.equal(await page.locator("[data-widget-timer]").innerText(), "15:00");
  await page.locator("[data-widget-timer-toggle]").click();
  assert.match(
    await page.locator("[data-widget-timer-toggle]").innerText(),
    /Pause/,
  );
  await page.locator("[data-widget-timer-reset]").click();
  const hue = page.locator("[data-widget-hue-input]");
  await hue.focus();
  await hue.press("End");
  assert.equal(await page.locator("[data-widget-hue]").innerText(), "359°");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await note.inputValue(), "A useful new idea.");
  assert.equal(
    await page
      .locator('[data-widget-vote="tool"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await hue.inputValue(), "359");
}

async function cursorDots(page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, "/about");
  await page.mouse.move(700, 180);
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".cursor-dot-layer");
    return (
      canvas &&
      canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.some((value, index) => index % 4 === 3 && value > 0)
    );
  });
  assert.equal(
    await page.locator(".cursor-dot-layer").getAttribute("aria-hidden"),
    "true",
    "Decorative cursor is hidden from assistive technology",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".cursor-dot-layer");
    return (
      !canvas ||
      !canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.some((value, index) => index % 4 === 3 && value > 0)
    );
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
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
      ...pageRoutes,
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
    for (const [route, destination] of legacyRoutes) {
      const response = await fetch(`${preview.url}${route}`, {
        redirect: "manual",
      });
      assert.equal(response.status, 301, `${route} permanently redirects`);
      assert.equal(
        response.headers.get("location"),
        destination,
        `${route} redirects to its intended replacement`,
      );
      await response.body?.cancel();
    }
    const sitemap = await fetch(`${preview.url}/sitemap.xml`).then((response) =>
      response.text(),
    );
    assert(
      sitemap.includes("https://baivabsarkar.pages.dev/play-lab"),
      "Sitemap contains Play Lab",
    );
    for (const [route] of legacyRoutes)
      assert(
        !sitemap.includes(`https://baivabsarkar.pages.dev${route}</loc>`),
        `${route} is no longer indexed`,
      );
    assert.deepEqual(
      projectData.map((project) => project.id),
      [...featuredIds, ...archiveIds],
      "Project data publishes exactly the requested twelve projects",
    );
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
      page.setDefaultNavigationTimeout(30000);
      let errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.url().startsWith(preview.url) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });

      for (const route of pageRoutes) {
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
            if ([375, 390, 768, 1440].includes(width)) {
              const filename = `${name}-${routeName(route)}-${width}.png`;
              await page.screenshot({
                path: path.join(output, filename),
                fullPage: true,
              });
            }
            if (name === "chromium" && [390, 1440].includes(width)) {
              await accessibility(page, `${routeName(route)}-${width}-light`);
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
        ["grounded Quick Ask", () => quickAsk(page)],
        ["game start, pause, reset and keyboard", () => game(page)],
        ["clipboard success and denial", () => clipboard(browser)],
        ["work and blog search, filters and sort", () => archive(page)],
        [
          "all project and article readers and playable 404",
          () => readers(page),
        ],
        [
          "combined Play Lab widgets and creative interaction controls",
          () => playground(page),
        ],
        ["cursor highlights and reduced motion", () => cursorDots(page)],
      ]) {
        await check(`${name}: ${label}`, async () => {
          errors = [];
          await callback();
          assert.deepEqual(errors, [], "No interaction-related browser errors");
        });
      }

      if (name === "chromium") {
        for (const route of pageRoutes) {
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
                await accessibility(page, `${routeName(route)}-${width}-dark`);
                await page.screenshot({
                  path: path.join(
                    output,
                    `chromium-${routeName(route)}-${width}-dark.png`,
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
        for (const route of [
          "/",
          "/work",
          "/about",
          "/blog",
          articleData[0].localPath,
          "/play-lab",
        ]) {
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
          const disclosure = fallback.locator("details").first();
          if (await disclosure.count()) {
            const opened = await disclosure.evaluate((element) => element.open);
            await disclosure.locator("summary").click();
            assert.notEqual(
              await disclosure.evaluate((element) => element.open),
              opened,
              `${route} native details work without JavaScript`,
            );
          }
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
            assert.equal(
              await fallback.locator(".home-archive .archive-link").count(),
              6,
              "All archive projects remain available without JavaScript",
            );
          }
          if (route === "/work") await curatedWorkGroups(fallback);
          if (route === "/play-lab") {
            assert.equal(
              await fallback.locator("[data-playground-card]").count(),
              7,
              "Play Lab keeps the seven canvas widgets readable without JavaScript",
            );
            assert.equal(
              await fallback.locator(".playground-experiment").count(),
              6,
              "The six interaction descriptions remain available without JavaScript",
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
      assert(
        !legacyRoutes.some(([route]) => route === url.pathname),
        `${url.pathname} links directly to its current destination`,
      );
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
