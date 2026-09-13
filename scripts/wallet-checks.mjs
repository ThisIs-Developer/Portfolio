import assert from "node:assert/strict";

export async function walletChecks(browser, url) {
  const context = await browser.newContext({ hasTouch: true });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const destinations = {
      work: "/work/markdown-viewer", me: "/about", study: "/about#experience",
      notes: "/blog", code: "https://github.com/ThisIs-Developer",
    };
    for (const width of [320, 390, 440, 767]) {
      await page.setViewportSize({ width, height: 956 });
      await page.goto("about:blank");
      await page.goto(`${url}/#about`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".wallet-card:visible").getAttribute("id"), "wallet-me");
      for (const dark of [false, true]) {
        if (await page.locator(".theme-toggle").getAttribute("aria-pressed") !== String(dark))
          await page.locator(".theme-toggle").dispatchEvent("click");
        for (const [choice, href] of Object.entries(destinations)) {
          const button = page.locator(`[data-wallet-select="${choice}"]`);
          await button.tap();
          await page.waitForTimeout(450);
          const card = page.locator(".wallet-card:visible");
          assert.equal(await card.count(), 1, "Only the selected link is exposed");
          assert.equal(await card.getAttribute("href"), href, "Every destination remains available");
          assert.equal(await button.getAttribute("aria-pressed"), "true");
          assert.equal(await page.locator('.wallet-switcher [aria-pressed="true"]').count(), 1);
          const layout = await page.locator(".wallet").evaluate((wallet) => {
            const selected = wallet.querySelector(".wallet-card:not([hidden])");
            const cardBox = selected.getBoundingClientRect();
            const switcher = wallet.querySelector(".wallet-switcher").getBoundingClientRect();
            return {
              scrolls: wallet.scrollWidth > wallet.clientWidth || wallet.scrollHeight > wallet.clientHeight,
              overflow: document.documentElement.scrollWidth > innerWidth,
              height: wallet.getBoundingClientRect().height,
              inBounds: cardBox.left >= 0 && cardBox.right <= innerWidth,
              clearControls: cardBox.bottom <= switcher.top - 4,
              clearAsk: document.querySelector(".quick-ask").getBoundingClientRect().top >= switcher.bottom,
              targets: [...wallet.querySelectorAll("button")].every((el) => el.clientHeight >= 44 && el.clientWidth >= 44),
              readable: [...selected.querySelectorAll("small, strong, span:last-child")].every((el) => {
                const box = el.getBoundingClientRect();
                return box.left >= cardBox.left && box.right <= cardBox.right
                  && box.top >= cardBox.top && box.bottom <= cardBox.bottom;
              }),
            };
          });
          assert.deepEqual(layout, {
            scrolls: false, overflow: false, height: 192, inBounds: true,
            clearControls: true, clearAsk: true, targets: true, readable: true,
          }, `${width}px ${dark ? "dark" : "light"} ${choice}: compact, readable, and no scrolling`);
        }
      }
    }
    await page.setViewportSize({ width: 440, height: 956 });
    await page.locator('[data-wallet-select="notes"]').focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator(".wallet-card:visible").getAttribute("id"), "wallet-notes");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('[data-wallet-select="work"]').tap();
    assert.equal(await page.locator(".wallet-card:visible").evaluate(el => getComputedStyle(el).animationName), "none");
    await page.locator(".wallet-card:visible").tap();
    await page.waitForURL(`${url}/work/markdown-viewer`);

    await page.goto(`${url}/#about`, { waitUntil: "networkidle" });
    await page.locator('[data-wallet-select="notes"]').focus();
    await page.keyboard.press("Space");
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page.locator(".wallet-card:visible").count(), 5, "Desktop keeps its full fan");
    assert.equal(await page.locator(".wallet-switcher").isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), "wallet-notes", "Resize keeps focus on the selected destination");
    await page.locator("#wallet-code").focus();
    await page.setViewportSize({ width: 390, height: 956 });
    assert.equal(await page.locator(".wallet-card:visible").getAttribute("id"), "wallet-code", "Focused desktop card stays available after resizing");
    await page.locator("#quick-question").fill("hello");
    await page.locator("#quick-question").press("Enter");
    await page.locator('#ask-answer[data-state="ready"]').waitFor();
    assert.deepEqual(errors, [], "Wallet switching does not cause browser errors");
  } finally {
    await context.close();
  }

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 956 } });
  try {
    const page = await noJs.newPage();
    await page.goto(`${url}/#about`);
    assert.equal(await page.locator(".wallet-card:visible").count(), 5, "All links are available without JavaScript");
    assert.equal(await page.locator(".wallet-switcher").isVisible(), false);
    assert(await page.locator(".wallet").evaluate(el => el.scrollWidth <= el.clientWidth), "The fallback also avoids horizontal scrolling");
  } finally {
    await noJs.close();
  }
}
