import assert from "node:assert/strict";

export async function conversationTiming(page, load) {
  const clockContext = await page
    .context()
    .browser()
    .newContext({ viewport: page.viewportSize() });
  const timed = await clockContext.newPage();
  try {
    await timed.clock.install();
    await load(timed, "/");
    await timed.clock.pauseAt(
      new Date((await timed.evaluate(() => Date.now())) + 1000),
    );
    const input = timed.locator("#quick-question");
    const output = timed.locator("#ask-answer");
    await input.fill("hello");
    await input.press("Enter");
    await timed.clock.runFor(1750);
    assert.equal(
      await timed.locator(".quick-ask").getAttribute("aria-busy"),
      "true",
      "Reply waits for the two-second sending state",
    );
    await timed.clock.runFor(300);
    assert.equal(await output.getAttribute("data-state"), "ready");
    assert.match(await output.innerText(), /Hey!.*my work/);
    assert.doesNotMatch(await output.innerText(), /assistant|AI/);
    await timed.clock.runFor(9600);
    assert(await output.isVisible(), "Reply remains available for ten seconds");
    await timed.clock.runFor(650);
    await output.waitFor({ state: "hidden" });
    assert(!(await output.isVisible()), "Reply closes after ten seconds");
    await input.fill("thanks");
    await input.press("Enter");
    await timed.clock.runFor(2100);
    await timed.locator("#about-title").click();
    assert(
      !(await output.isVisible()),
      "Outside click hides the reply immediately",
    );
    await input.fill("hello");
    await input.press("Enter");
    await timed.clock.runFor(500);
    await input.fill("bye");
    await input.press("Enter");
    await timed.clock.runFor(2100);
    assert.match(await output.innerText(), /See you around/);
    assert.doesNotMatch(await output.innerText(), /Glad you stopped/);
  } finally {
    await clockContext.close();
  }
}

export async function canvasMotion(page, load) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, "/play-lab");
  const board = page.locator("[data-playground-board]");
  const world = page.locator(".playground-world");
  const card = page.locator(".playground-clock");
  for (let i = 0; i < 3; i++)
    await page.locator('[data-playground-zoom="out"]').click();
  assert.equal(
    await page.locator("[data-playground-zoom-label]").innerText(),
    "65%",
  );
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const box = await board.boundingBox();
  const before = await card.boundingBox();
  const body = await card.locator("time").boundingBox();
  await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 110, body.y + body.height / 2, {
    steps: 16,
  });
  await page.waitForTimeout(160);
  const held = await card.boundingBox();
  assert(
    held.x > before.x + 100,
    "A card moves into newly exposed space at 65% zoom",
  );
  await page.mouse.up();
  await page.waitForTimeout(1400);
  const after = await card.boundingBox();
  assert(
    after.x + after.width <= box.x + box.width + 8,
    "The thrown card settles within the canvas edge",
  );
  await board.focus();
  const previous = await world.getAttribute("style");
  await board.press("ArrowRight");
  assert.notEqual(
    await world.getAttribute("style"),
    previous,
    "Camera pans independently of the cards",
  );
  await page.locator("[data-playground-reset]").click();
  await page.locator("#interactions-tab").click();
  assert(!(await board.isVisible()));
  await page.locator("#interactions-tab").press("ArrowLeft");
  assert(await board.isVisible());
  await page.locator("#canvas-tab").press("ArrowRight");
  const ball = page.locator(".interaction-spring-ball");
  await page.locator('[data-spring-character="bouncy"]').click();
  const initialBall = await ball.boundingBox();
  await page.locator("[data-spring-launch]").click();
  await page.waitForTimeout(250);
  assert(
    (await ball.boundingBox()).x > initialBall.x + 50,
    "Spring responds promptly to a nudge",
  );
  await page.waitForFunction(
    () =>
      document.querySelector(".interaction-spring-ball").dataset.springState ===
      "settled",
  );
  const pond = page.locator("[data-ripple-pond]");
  const water = page.locator("[data-ripple-water]");
  await pond.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("[data-ripple-water]").width > 0,
  );
  const still = await water.evaluate((c) => c.toDataURL());
  await pond.click({ position: { x: 65, y: 60 } });
  await page.waitForTimeout(300);
  assert.notEqual(
    await water.evaluate((c) => c.toDataURL()),
    still,
    "A pointer disturbance changes the water surface",
  );
  assert.equal(await pond.getAttribute("data-water-state"), "moving");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await pond.press("Enter");
  const reduced = await water.evaluate((c) => c.toDataURL());
  await page.waitForTimeout(300);
  assert.equal(
    await water.evaluate((c) => c.toDataURL()),
    reduced,
    "Reduced-motion water gives still feedback",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
}
