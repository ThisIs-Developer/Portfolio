import assert from "node:assert/strict";

export async function refinementChecks(page, load) {
  await load(page, "/");
  assert.equal(
    await page.locator(".home-archive,.about-copy,.experience-details").count(),
    0,
  );
  assert.match(
    await page
      .locator(":root")
      .evaluate((el) => getComputedStyle(el).getPropertyValue("--dot")),
    /0?\.3\)/,
  );
  const project = page.locator('a.folder[href="/work/body-language"]');
  await project.scrollIntoViewIfNeeded();
  assert.match(
    await project.locator("img").first().getAttribute("src"),
    /assets\/work\/body-language/,
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll('a[href="/work/body-language"] img')].every(
      (img) => img.complete && img.naturalWidth,
    ),
  );
  for (const width of [320, 440, 768]) {
    await page.setViewportSize({ width, height: 950 });
    const overlapping = await page
      .locator(".writing-card")
      .evaluateAll((cards) =>
        cards
          .filter((card) => {
            const art = card
              .querySelector(".editorial-art")
              .getBoundingClientRect();
            const copy = card
              .querySelector(".writing-copy")
              .getBoundingClientRect();
            const title = card.querySelector("h3").getBoundingClientRect();
            return (
              (Math.min(art.right, copy.right) >
                Math.max(art.left, copy.left) + 1 &&
                Math.min(art.bottom, copy.bottom) >
                  Math.max(art.top, copy.top) + 1) ||
              title.right > copy.right + 1 ||
              title.bottom > copy.bottom + 1
            );
          })
          .map((card) => card.innerText),
      );
    assert.deepEqual(
      overlapping,
      [],
      "Complete article headlines have their own space at " + width,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#work-title").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const dotMasks = await page.evaluate(() => {
    const canvas = document.querySelector(".cursor-dot-layer");
    const ctx = canvas.getContext("2d"),
      scale = canvas.width / innerWidth;
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#work-title"));
    const rect = range.getBoundingClientRect();
    const pixels = ctx.getImageData(
      Math.floor(rect.left * scale),
      Math.floor(rect.top * scale),
      Math.floor(rect.width * scale),
      Math.floor(rect.height * scale),
    ).data;
    const all = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return {
      heading: pixels.some((n, i) => i % 4 === 3 && n > 0),
      background: all.some((n, i) => i % 4 === 3 && n > 0),
    };
  });
  assert.deepEqual(
    dotMasks,
    { heading: false, background: true },
    "Dots remain in empty areas and are erased beneath the heading",
  );

  const clockContext = await page
    .context()
    .browser()
    .newContext({ viewport: page.viewportSize() });
  const timed = await clockContext.newPage();
  try {
    await timed.clock.install();
    await load(timed, "/");
    await timed.locator("[data-capabilities]").scrollIntoViewIfNeeded();
    await timed.waitForFunction(
      () =>
        document.querySelector("[data-capabilities]").dataset
          .activeCapability === "1",
    );
    await timed.clock.fastForward(4200);
    assert.equal(
      await timed
        .locator("[data-capabilities]")
        .getAttribute("data-active-capability"),
      "2",
      "Timer advances the first capability",
    );
    await timed.locator(".capability summary").nth(3).click();
    assert.equal(await timed.locator(".capability[open]").count(), 1);
    await timed.clock.fastForward(1900);
    assert.equal(
      await timed
        .locator("[data-capabilities]")
        .getAttribute("data-active-capability"),
      "4",
      "Manual selection restarts its full timer",
    );
    await timed.clock.fastForward(2300);
    assert.equal(
      await timed
        .locator("[data-capabilities]")
        .getAttribute("data-active-capability"),
      "5",
    );
    await timed.clock.fastForward(4200);
    assert.equal(
      await timed
        .locator("[data-capabilities]")
        .getAttribute("data-active-capability"),
      "1",
      "Capability cycle wraps",
    );
  } finally {
    await clockContext.close();
  }

  await load(page, "/about");
  const photos = page.locator("[data-photo-card]");
  assert.equal(await photos.count(), 7);
  await photos.nth(3).focus();
  await photos.nth(3).press("ArrowRight");
  assert.equal(await photos.nth(4).getAttribute("aria-pressed"), "true");
  await photos.nth(4).press("Escape");
  assert.equal(await page.locator(".is-photo-active").count(), 0);
  assert.equal(
    await page.locator(".current-location .location-icon svg").count(),
    1,
  );
  assert.deepEqual(
    await page.locator(".selected-tool > span:last-child").allTextContents(),
    [
      "JavaScript",
      "Python",
      "Java",
      "Selenium",
      "TensorFlow",
      "OpenCV",
      "Docker",
      "Jenkins",
      "Git",
      "Cloudflare",
      "Vercel",
      "Figma",
    ],
  );
  await page.locator(".selected-tools").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".selected-tool img")].every(
      (img) => img.complete && img.naturalWidth,
    ),
  );
  await load(page, "/work");
  assert.equal(await page.locator(".folder-item .folder").count(), 12);
  assert.equal(await page.locator(".archive-card").count(), 0);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    assert.deepEqual(
      await page
        .locator(".folder")
        .evaluateAll((cards) =>
          cards
            .filter(
              (card) =>
                card.querySelector(".folder-bottom").getBoundingClientRect()
                  .bottom >
                card.querySelector(".folder-front").getBoundingClientRect()
                  .bottom +
                  1,
            )
            .map((card) => card.innerText),
        ),
      [],
      "All twelve folders contain their full text and actions at " + width,
    );
  }
}
