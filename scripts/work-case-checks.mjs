import assert from 'node:assert/strict';

export async function workCaseChecks(page, load) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await load(page, '/work/markdown-viewer');
  const dialog = page.getByRole('dialog');
  const screenshots = page.locator('[data-screenshot]');
  assert.equal(await screenshots.count(), 8, 'Eight curated product screenshots');
  assert.equal(await page.locator('.mv-meta .technology-list li').count(), 3);
  assert.equal(await page.locator('.mv-stack-item').count(), 6);
  const anchors = await page.locator('.reading-toc a').evaluateAll(links => links.map(link => link.hash.slice(1)));
  for (const id of anchors) assert(await page.locator(`#${id}`).isVisible(), `Section ${id} exists`);
  await page.locator('.mv-more summary').click();
  assert(await page.locator('.mv-more').evaluate(element => element.open));
  for (const link of await screenshots.all()) {
    await link.scrollIntoViewIfNeeded();
    await link.locator(':scope > img').evaluate(image => image.decode());
    const expectedSrc = await link.getAttribute('href');
    const expectedAlt = await link.locator(':scope > img').getAttribute('alt');
    await link.press('Enter');
    assert(await dialog.isVisible(), 'Screenshot opens from the keyboard');
    assert.equal(await dialog.locator('.mv-lightbox-image img').getAttribute('src'), new URL(expectedSrc, page.url()).href);
    assert.equal(await dialog.locator('.mv-lightbox-image img').getAttribute('alt'), expectedAlt);
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Focus enters the dialog');
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Focus stays within the modal');
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Tab cycles within the modal');
    await page.keyboard.press('Shift+Tab');
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Reverse Tab cycles within the modal');
    assert.equal(await dialog.locator('[data-original-screenshot]').getAttribute('href'), new URL(expectedSrc, page.url()).href);
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    assert(await link.evaluate(element => element === document.activeElement), 'Focus returns to the screenshot');
  }
  await screenshots.first().click();
  await page.getByRole('button', { name: 'Close screenshot', exact: true }).click();
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await page.locator('html').evaluate(element => element.classList.contains('mv-screenshot-open')), false);
  await screenshots.first().click();
  await page.mouse.click(1, 1);
  assert.equal(await dialog.isVisible(), false, 'Backdrop dismisses the screenshot');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await screenshots.last().scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Expanded gallery fits ${width}px`);
    await screenshots.last().click();
    const bounds = await dialog.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= width, `Screenshot dialog fits ${width}px`);
    await page.keyboard.press('Escape');
  }
  await page.locator('.mv-more summary').click();
}
