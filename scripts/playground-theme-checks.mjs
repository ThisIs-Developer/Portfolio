import assert from "node:assert/strict";

export async function playgroundThemeChecks(page, load) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, "/play-lab#canvas");
  const toggle = page.locator(".theme-toggle");
  const setTheme = async dark => {
    if (await toggle.getAttribute("aria-pressed") !== String(dark)) await toggle.dispatchEvent("click");
  };
  const luminance = color => {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
      v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    });
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const dark of [false, true]) {
    await setTheme(dark);
    await page.waitForTimeout(300);
    const tabs = await page.locator(".play-lab-switch a").evaluateAll(links => links.map(link => ({
      color: getComputedStyle(link).color,
      background: getComputedStyle(link).backgroundColor === "rgba(0, 0, 0, 0)"
        ? getComputedStyle(link.parentElement).backgroundColor : getComputedStyle(link).backgroundColor,
    })));
    for (const tab of tabs) {
      const values = [luminance(tab.color), luminance(tab.background)].sort((a, b) => b - a);
      assert((values[0] + .05) / (values[1] + .05) >= 4.5, "Both section tabs remain readable");
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      if (await page.locator("[data-playground-view]").getAttribute("aria-pressed") !== "true")
        await page.locator("[data-playground-view]").click();
      await page.locator("[data-calendar-today]").click();
      const circles = await page.locator(".calendar-navigation button, .calendar-grid button").evaluateAll(buttons => buttons.map(button => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height, radius: getComputedStyle(button).borderRadius };
      }));
      assert(circles.every(c => Math.abs(c.width - c.height) < .05 && c.radius === "50%"), `${width} ${dark}: calendar controls are circles`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  const cards = await page.locator("[data-playground-card]").evaluateAll(cards => cards.map(card => ({
    name: card.dataset.widgetId, background: getComputedStyle(card).backgroundColor,
  })));
  for (const card of cards) assert(luminance(card.background) < .1, `${card.name} has a dark surface`);
  const text = await page.locator(".playground-calendar > p, .playground-calendar [aria-pressed=true], .calculator-display, .mood-options button").evaluateAll(elements => elements.map(el => {
    let parent = el;
    while (parent && getComputedStyle(parent).backgroundColor === "rgba(0, 0, 0, 0)") parent = parent.parentElement;
    return { color: getComputedStyle(el).color, background: getComputedStyle(parent).backgroundColor };
  }));
  for (const item of text) {
    const levels = [luminance(item.color), luminance(item.background)].sort((a, b) => b - a);
    assert((levels[0] + .05) / (levels[1] + .05) >= 4.5, "New widget text remains readable in dark mode");
  }
  await page.locator("[data-playground-view]").click();
  for (const color of ["blue", "pink", "peach", "cream", "green", "lilac"]) {
    await page.locator(`[data-playground-color="${color}"]`).click();
    assert(luminance(await page.locator(".playground-board").evaluate(el => getComputedStyle(el).backgroundColor)) < .1, `${color} canvas has a dark counterpart`);
  }
  await page.locator("[data-playground-background-reset]").click();
  assert.equal(await page.locator(".playground-board").getAttribute("data-canvas-color"), "blue");
  await page.locator("#interactions-tab").click();
  for (const color of ["sky", "mint", "rose"]) {
    await page.locator(`[data-ripple-colour="${color}"]`).click();
    const stages = await page.locator(".playground-experiment-stage").evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
    assert(stages.every(color => luminance(color) < .1), "Every interaction stage stays dark with each ripple palette");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setTheme(false);
  const pond = page.locator("[data-ripple-pond]"), water = page.locator("[data-ripple-water]");
  await pond.click();
  const lightWave = await water.evaluate(canvas => canvas.toDataURL());
  await setTheme(true);
  await page.waitForFunction(previous => document.querySelector("[data-ripple-water]").toDataURL() !== previous, lightWave);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await setTheme(false);
}
