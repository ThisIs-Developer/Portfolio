import assert from "node:assert/strict";

export async function playgroundWidgetChecks(page, load) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, "/play-lab#canvas");
  assert.equal(await page.locator("[data-playground-card]").count(), 10);
  await page.locator("[data-playground-view]").click();
  const month = page.locator("[data-calendar-month]");
  const currentMonth = await month.innerText();
  const expectedDays = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  });
  assert.equal(await page.locator("[data-calendar-grid] button").count(), expectedDays);
  await page.locator('[data-calendar-step="1"]').click();
  assert.notEqual(await month.innerText(), currentMonth);
  await page.locator('[data-calendar-step="-1"]').click();
  assert.equal(await month.innerText(), currentMonth);
  await page.locator("[data-calendar-grid] button").first().click();
  assert.equal(await page.locator('[data-calendar-grid] button[aria-pressed="true"]').count(), 1);
  await page.locator("[data-calendar-today]").click();
  assert.equal(await page.locator('[data-calendar-grid] button[aria-current="date"]').getAttribute("aria-pressed"), "true");
  const calculator = page.locator(".playground-calculator");
  await calculator.focus();
  for (const key of ["1", "2", ".", "5", "+", "7", ".", "5", "Enter"]) await calculator.press(key);
  assert.equal(await page.locator("[data-calculator-display]").innerText(), "20");
  for (const key of ["C", "9", "÷", "0", "="]) await page.locator(`[data-calculator-key="${key}"]`).click();
  assert.equal(await page.locator("[data-calculator-display]").innerText(), "Error");
  await page.locator('[data-calculator-key="3"]').click();
  assert.equal(await page.locator("[data-calculator-display]").innerText(), "3");
  await page.locator('[data-mood="good"]').click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-playground-view]").click();
  assert.equal(await page.locator('[data-mood="good"]').getAttribute("aria-pressed"), "true");
  await page.locator("[data-mood-clear]").click();
  assert.equal(await page.locator('[data-mood][aria-pressed="true"]').count(), 0);
}
