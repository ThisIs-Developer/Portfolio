import assert from "node:assert/strict";

// Pixel checks inspect the decorative layer itself, so text and artwork cannot
// accidentally hide a missing background or a broad rectangular mask.
async function pixels(page, rect) {
  return page.evaluate((rect) => {
    const canvas = document.querySelector(".cursor-dot-layer"),
      scale = canvas.width / innerWidth,
      x = Math.max(0, Math.floor(rect.x * scale)),
      y = Math.max(0, Math.floor(rect.y * scale)),
      width = Math.min(canvas.width - x, Math.ceil(rect.width * scale)),
      height = Math.min(canvas.height - y, Math.ceil(rect.height * scale));
    const data = canvas.getContext("2d").getImageData(x, y, width, height).data;
    let max = 0,
      sum = 0;
    for (let i = 3; i < data.length; i += 4) {
      max = Math.max(max, data[i]);
      sum += data[i];
    }
    return { max, sum };
  }, rect);
}

async function waitForPixels(page, rect, predicate) {
  const deadline = Date.now() + 5000;
  let sample;
  do {
    sample = await pixels(page, rect);
    if (predicate(sample)) return sample;
    await page.waitForTimeout(100);
  } while (Date.now() < deadline);
  return sample;
}

export async function dotChecks(page, load) {
  const context = await page
    .context()
    .browser()
    .newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
      colorScheme: "light",
    });
  const test = await context.newPage();
  try {
    await load(test, "/");
    await test
      .locator(".cursor-dot-layer[data-dot-field='ready']")
      .waitFor({ state: "attached" });
    await test.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await test.waitForTimeout(350);
    const unusedLine = await test.evaluate(() => {
      const paragraph = document.querySelector(".hero-tagline"),
        parent = paragraph.getBoundingClientRect(),
        range = document.createRange();
      range.selectNodeContents(paragraph);
      const right = Math.max(
        ...[...range.getClientRects()].map((rect) => rect.right),
      );
      return {
        x: right + 8,
        y: parent.top + 3,
        width: parent.right - right - 16,
        height: parent.height - 6,
      };
    });
    assert(
      unusedLine.width > 28,
      "Hero paragraph has unused space beside its visible lines",
    );
    assert(
      (await pixels(test, unusedLine)).sum > 0,
      "Dots resume inside the paragraph layout box beside the text",
    );

    const textProtected = await test.evaluate(() => {
      const canvas = document.querySelector(".cursor-dot-layer"),
        ctx = canvas.getContext("2d"),
        scale = canvas.width / innerWidth,
        range = document.createRange();
      for (const element of document.querySelectorAll(
        ".hero .eyebrow,.hero h1,.hero-tagline,.hero-note",
      )) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const word of node.textContent.matchAll(/\S+/gu)) {
            range.setStart(node, word.index);
            range.setEnd(node, word.index + word[0].length);
            for (const rect of range.getClientRects()) {
              const data = ctx.getImageData(
                Math.floor(rect.left * scale),
                Math.floor(rect.top * scale),
                Math.max(1, Math.floor(rect.width * scale)),
                Math.max(1, Math.floor(rect.height * scale)),
              ).data;
              if (data.some((value, index) => index % 4 === 3 && value > 0))
                return false;
            }
          }
        }
      }
      return true;
    });
    assert(
      textProtected,
      "Hero words remain clear while the surrounding layout contains dots",
    );

    for (const selector of [
      ".hero-actions .text-link",
      ".hero-actions .button",
    ]) {
      await test.mouse.move(1500, 1100);
      await test.waitForTimeout(500);
      const before = await test.locator(selector).boundingBox();
      const beside = {
        x: selector.endsWith(".button")
          ? before.x - 78
          : before.x + before.width + 5,
        y: before.y + before.height / 2 - 22,
        width: 70,
        height: 44,
      };
      const normal = await pixels(test, beside);
      await test.locator(selector).hover();
      await test.waitForTimeout(500);
      const hovered = await pixels(test, beside);
      assert(
        hovered.sum > normal.sum * 1.15,
        `${selector}: hover glow remains active around the control's perimeter`,
      );
    }

    for (const width of [320, 768, 1440]) {
      await test.setViewportSize({ width, height: 1000 });
      const wallet = await test.locator(".wallet").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          top: style.marginTop,
          bottom: style.marginBottom,
          cards: [...element.querySelectorAll(".wallet-card")].map((card) => ({
            height: getComputedStyle(card).height,
            cap: getComputedStyle(card, "::before").top,
          })),
        };
      });
      assert.equal(wallet.top, "44px", `Wallet top margin at ${width}px`);
      assert.equal(wallet.bottom, "-20px", `Wallet overlap at ${width}px`);
      assert(
        wallet.cards.length === 5 &&
          wallet.cards.every(
            (card) => card.height === "175px" && card.cap === "0px",
          ),
        `All wallet cards use the requested dimensions at ${width}px`,
      );
    }

    // An empty section provides matching grid points at each edge without
    // depending on where the page happens to position real text or cards.
    await test.setViewportSize({ width: 1440, height: 1000 });
    await test.evaluate(() => {
      const fixture = document.createElement("section");
      fixture.style.height = "1000px";
      fixture.dataset.dotFixture = "";
      fixture.setAttribute("aria-hidden", "true");
      const surface = document.querySelector(".page-surface");
      surface.insertBefore(fixture, surface.firstChild.nextSibling);
      scrollTo({ top: 0, behavior: "instant" });
    });
    await test.emulateMedia({ reducedMotion: "reduce" });
    await test.waitForTimeout(350);
    const point = (x, y) =>
      pixels(test, { x: x - 3, y: y - 3, width: 6, height: 6 });
    const center = await point(714, 490);
    const edges = await Promise.all([
      point(14, 490),
      point(1414, 490),
      point(714, 14),
      point(714, 994),
    ]);
    const corner = await point(14, 14);
    assert(
      center.max > 0 &&
        edges.every((edge) => edge.max > 0 && edge.max < center.max),
      "All four edges fade while the center keeps its normal opacity",
    );
    assert(
      corner.max < Math.min(edges[0].max, edges[2].max),
      "Corner fade blends both intersecting edges",
    );

    await test.emulateMedia({ reducedMotion: "no-preference" });
    await test.waitForTimeout(100);
    await test.mouse.move(680, 450);
    await test.mouse.move(714, 490);
    await test.waitForTimeout(500);
    const lightActive = await point(714, 490);
    const pointerState = await test.evaluate(() => ({
      fine: matchMedia("(hover: hover) and (pointer: fine)").matches,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      target: document.elementFromPoint(714, 490)?.outerHTML.slice(0, 200),
      hidden: document.hidden,
      scrollY,
    }));
    await test.evaluate(
      () => (document.documentElement.dataset.theme = "dark"),
    );
    const centerRect = { x: 711, y: 487, width: 6, height: 6 };
    const darkActive = await waitForPixels(
      test,
      centerRect,
      (sample) =>
        sample.max > 32 && sample.max < lightActive.max && sample.max <= 64,
    );
    await test.emulateMedia({ reducedMotion: "reduce" });
    const darkNormal = await waitForPixels(
      test,
      centerRect,
      (sample) => sample.max <= 23 && sample.max < center.max,
    );
    assert(
      darkNormal.max < center.max,
      `Dark mode reduces normal dot opacity: ${JSON.stringify({ center, darkNormal })}`,
    );
    assert(
      darkActive.max > darkNormal.max &&
        darkActive.max < lightActive.max &&
        darkActive.max <= 64,
      `Dark hover stays visible but substantially quieter than light mode: ${JSON.stringify({ lightActive, darkActive, darkNormal, pointerState })}`,
    );
    return { center, edges, corner, lightActive, darkActive, darkNormal };
  } finally {
    await context.close();
  }
}
