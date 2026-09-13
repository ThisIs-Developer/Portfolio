import assert from "node:assert/strict";

const luminance = (color) => {
  const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

export async function themeChecks(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light", // A saved choice must beat the operating system theme.
    storageState: { cookies: [], origins: [{ origin: url, localStorage: [
      { name: "portfolio-theme", value: "dark" },
    ] }] },
  });
  try {
    await context.addInitScript(() => {
      window.themeFrames = [];
      const sample = () => {
        const surface = document.querySelector(".page-surface");
        if (surface && window.themeFrames.length < 30) {
          window.themeFrames.push({
            theme: document.documentElement.dataset.theme,
            scheme: getComputedStyle(document.documentElement).colorScheme,
            background: getComputedStyle(surface).backgroundColor,
          });
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/violates.*Content Security Policy|Refused to execute/i.test(message.text()))
        errors.push(message.text());
    });
    await page.goto(`${url}/blog`, { waitUntil: "networkidle" });
    const article = await page.locator(".journal-card").first().getAttribute("href");
    const routes = ["/", "/blog", "/work", article, "/work/markdown-viewer", "/about",
      "/play-lab#canvas", "/play-lab#interactions", "/missing-theme-check"];
    for (const route of routes) {
      // Force a fresh document even when two routes differ only by their hash.
      await page.goto("about:blank");
      let release;
      const hold = new Promise((resolve) => { release = resolve; });
      const handler = async (request) => { await hold; await request.continue(); };
      await page.route(/\/script\.js(?:\?|$)/, handler);
      try {
        await page.goto(`${url}${route}`, { waitUntil: "commit" });
        await page.waitForFunction(() => window.themeFrames?.length >= 3);
        assert.equal(await page.locator(".theme-toggle").getAttribute("hidden"), "",
          `${route}: main script is still delayed`);
        const frames = await page.evaluate(() => window.themeFrames);
        assert(frames.every((frame) => frame.theme === "dark" && frame.scheme === "dark"
          && frame.background === "rgb(24, 25, 28)"),
        `${route}: content is dark from the first rendered frame, before deferred initialization`);
        assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"), "#18191c");
      } finally {
        release();
        await page.waitForLoadState("networkidle");
        await page.unroute(/\/script\.js(?:\?|$)/, handler);
      }
      assert.equal(await page.locator(".theme-toggle").getAttribute("aria-pressed"), "true");
    }

    // Real navigation, reload, back/forward, and switching in both directions.
    await page.goto(`${url}/blog`, { waitUntil: "networkidle" });
    await page.locator(".journal-card").first().click();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.locator(".theme-toggle").dispatchEvent("click");
    await page.goBack({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    assert.equal(await page.locator(".theme-toggle").getAttribute("aria-pressed"), "false");
    await page.locator(".theme-toggle").dispatchEvent("click");
    await page.goForward({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["/blog", "/work", "/", article]) {
        await page.goto(`${url}${route}`, { waitUntil: "networkidle" });
        for (const dark of [true, false]) {
          if (await page.locator(".theme-toggle").getAttribute("aria-pressed") !== String(dark))
            await page.locator(".theme-toggle").dispatchEvent("click");
          const artwork = await page.locator(".editorial-art").evaluateAll((elements) => elements.map((el) => ({
            background: getComputedStyle(el).backgroundColor,
            color: getComputedStyle(el).color,
            sheets: [...el.querySelectorAll(".art-sheet")].map((sheet) => getComputedStyle(sheet).fill),
          })));
          assert(artwork.length, `${route}: artwork exists`);
          for (const art of artwork) {
            assert(dark ? luminance(art.background) < 0.1 : luminance(art.background) > 0.7,
              `${route}: illustration background matches ${dark ? "dark" : "light"} theme`);
            if (dark) {
              assert(contrast(art.color, art.background) >= 4.5, "Artwork labels retain contrast");
              for (const fill of art.sheets) {
                // Browsers serialize color-mix as color(srgb ...) with normalized channels.
                const rgb = fill.startsWith("color(srgb")
                  ? `rgb(${fill.match(/[\d.]+/g).slice(0, 3).map((v) => Number(v) * 255).join(", ")})`
                  : fill;
                assert(luminance(rgb) < 0.2, "Illustrated sheets use dark surfaces");
              }
            }
          }
          if (dark) {
            const folders = await page.locator(".folder").evaluateAll((elements) => elements.map((el) => ({
              background: getComputedStyle(el.querySelector(".folder-back")).backgroundColor,
              color: getComputedStyle(el.querySelector(".folder-front")).color,
              filter: getComputedStyle(el.querySelector("img")).filter,
            })));
            for (const folder of folders) {
              assert(luminance(folder.background) < 0.1, "Project folders use dark tints");
              assert(contrast(folder.color, folder.background) >= 4.5, "Folder text remains readable");
              assert.equal(folder.filter, "none", "Original project screenshots keep their colours");
            }
          }
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${route} at ${width}: no horizontal overflow`);
        }
        await page.locator(".theme-toggle").dispatchEvent("click");
      }
    }
    assert.deepEqual(errors, [], "Theme initialization works under the production CSP without browser errors");
  } finally {
    await context.close();
  }

  const blocked = await browser.newContext();
  try {
    await blocked.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage unavailable"); } });
    });
    const page = await blocked.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}/blog`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    await page.locator(".theme-toggle").dispatchEvent("click");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.deepEqual(errors, [], "Theme toggle still works when storage is unavailable");
  } finally {
    await blocked.close();
  }
}
