import assert from "node:assert/strict";

export async function walletChecks(browser, url) {
  const context = await browser.newContext({ hasTouch: true });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const destinations = ["/work/markdown-viewer", "/about", "/about#experience", "/blog"];
    for (const width of [320, 390, 440, 767]) {
      await page.setViewportSize({ width, height: 956 });
      await page.goto(`${url}/#about`, { waitUntil: "networkidle" });
      for (const dark of [false, true]) {
        if (await page.locator(".theme-toggle").getAttribute("aria-pressed") !== String(dark))
          await page.locator(".theme-toggle").dispatchEvent("click");
        await page.locator(".wallet").scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const cards = page.locator(".wallet-card:visible");
        assert.equal(await cards.count(), 4, "Four cards are visible together on mobile");
        assert.deepEqual(await cards.evaluateAll(links => links.map(link => link.getAttribute("href"))), destinations);
        assert.equal(await page.locator(".wallet-switcher").count(), 0, "No card switching buttons");
        const layout = await page.locator(".wallet").evaluate(wallet => {
          const cards = [...wallet.querySelectorAll(".wallet-card")].filter(el => el.getClientRects().length);
          const boxes = cards.map(el => el.getBoundingClientRect());
          return {
            noScroll: wallet.scrollWidth <= wallet.clientWidth && document.documentElement.scrollWidth <= innerWidth,
            compact: wallet.getBoundingClientRect().height <= 310,
            twoColumns: Math.abs(boxes[0].top - boxes[1].top) < 16 && Math.abs(boxes[2].top - boxes[3].top) < 16 && boxes[2].top > boxes[0].top + 90,
            inBounds: boxes.every(box => box.left >= 0 && box.right <= innerWidth),
            readable: cards.every(card => [...card.querySelectorAll("small, strong, span:last-child")].every(el => {
              const box = el.getBoundingClientRect();
              const hit = document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
              return card.contains(hit);
            })),
          };
        });
        assert.deepEqual(layout, { noScroll: true, compact: true, twoColumns: true, inBounds: true, readable: true }, `${width}px ${dark ? "dark" : "light"}: readable overlapping cards with no scrolling`);
      }
    }
    assert.equal(await page.getByRole("link", { name: "A little more about me", exact: true }).count(), 0);
    assert(await page.locator('.social-links a[href="https://github.com/ThisIs-Developer"]').count(), "GitHub remains available in the footer");
    await page.setViewportSize({ width: 440, height: 956 });
    await page.locator("#wallet-work").tap();
    await page.waitForURL(`${url}/work/markdown-viewer`);
    await page.goto(`${url}/#about`, { waitUntil: "networkidle" });
    await page.locator("#wallet-notes").focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`${url}/blog`);
    await page.goto(`${url}/#about`, { waitUntil: "networkidle" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page.locator(".wallet-card:visible").count(), 5, "Desktop keeps its five-card fan");
    await page.setViewportSize({ width: 390, height: 956 });
    assert.equal(await page.locator(".wallet-card:visible").count(), 4);
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert(await page.locator("#wallet-work").evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) <= 0.001), "Reduced motion suppresses the card transition");
    await page.locator("#quick-question").fill("hello");
    await page.locator("#quick-question").press("Enter");
    await page.locator('#ask-answer[data-state="ready"]').waitFor();
    assert.deepEqual(errors, [], "No wallet-related browser errors");
  } finally {
    await context.close();
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 956 } });
  try {
    const page = await noJs.newPage();
    await page.goto(`${url}/#about`);
    assert.equal(await page.locator(".wallet-card:visible").count(), 4, "Mobile cards work without JavaScript");
    assert(await page.locator(".wallet").evaluate(el => el.scrollWidth <= el.clientWidth));
  } finally {
    await noJs.close();
  }
}
