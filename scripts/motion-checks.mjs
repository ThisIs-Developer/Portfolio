import assert from "node:assert/strict";

export async function conversationTiming(page, load) {
  const context = await page
    .context()
    .browser()
    .newContext({ viewport: page.viewportSize() });
  const timed = await context.newPage();
  try {
    await load(timed, "/");
    const input = timed.locator("#quick-question"),
      output = timed.locator("#ask-answer");
    const ready = () =>
      timed.locator('#ask-answer[data-state="ready"]').waitFor();
    await input.fill("hello");
    const sent = Date.now();
    await input.press("Enter");
    await timed.waitForTimeout(800);
    assert.equal(
      await timed.locator(".quick-ask").getAttribute("aria-busy"),
      "true",
      "Loading is visible before the reply",
    );
    await ready();
    assert(
      Date.now() - sent >= 1800,
      "The sending state lasts about two seconds",
    );
    assert.match(await output.textContent(), /Hey!.*my work/);
    assert.doesNotMatch(await output.textContent(), /assistant|AI/);
    await timed.waitForTimeout(9000);
    assert(
      await output.isVisible(),
      "Reply remains available through the ninth second",
    );
    await output.waitFor({ state: "hidden", timeout: 3000 });
    await input.fill("thanks");
    await input.press("Enter");
    await ready();
    await timed.locator("#about-title").click();
    assert(
      !(await output.isVisible()),
      "Outside click hides the reply immediately",
    );
    await input.fill("hello");
    await input.press("Enter");
    await timed.waitForTimeout(500);
    await input.fill("bye");
    await input.press("Enter");
    await ready();
    assert.match(await output.textContent(), /See you around/);
    assert.doesNotMatch(await output.textContent(), /Glad you stopped/);
  } finally {
    await context.close();
  }
}

export async function canvasMotion(page, load) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, "/play-lab");
  const board = page.locator("[data-playground-board]");
  const world = page.locator(".playground-world");
  const card = page.locator(".playground-clock");
  assert(await page.locator("#playground-instructions").isVisible());
  await page.locator('[data-pin-colour="gold"]').click();
  assert(!(await page.locator("#playground-instructions").isVisible()));
  await card.focus();
  await card.press("Enter");
  assert.equal(await card.getAttribute("data-pinned"), null, "Click and Enter cannot place a pin");
  const pinTool = await page.locator('[data-pin-colour="gold"]').boundingBox();
  const pinTarget = await card.boundingBox();
  await page.mouse.move(pinTool.x + pinTool.width / 2, pinTool.y + pinTool.height / 2);
  await page.mouse.down();
  await page.mouse.move(pinTarget.x + pinTarget.width / 2, pinTarget.y + 30, { steps: 12 });
  await page.mouse.up();
  assert.equal(await card.getAttribute("data-pinned"), "gold");
  const pinnedX = (await card.boundingBox()).x;
  await card.press("ArrowRight");
  assert.equal((await card.boundingBox()).x, pinnedX, "Pinned cards stay in place");
  await card.locator(".playground-card-pin").click();
  assert.equal(await card.getAttribute("data-pinned"), null);
  await page.locator('[data-playground-color="peach"]').click();
  await page.locator("[data-playground-background-reset]").click();
  assert.equal(await board.getAttribute("data-canvas-color"), "blue");
  await board.scrollIntoViewIfNeeded();
  const zoomLabel = page.locator("[data-playground-zoom-label]");
  const wheelBox = await board.boundingBox();
  await page.mouse.move(wheelBox.x + 12, wheelBox.y + 100);
  const scrollBeforeWheel = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -120);
  await page.waitForFunction(() =>
    parseInt(document.querySelector("[data-playground-zoom-label]").value) > 100);
  assert.equal(await page.evaluate(() => scrollY), scrollBeforeWheel,
    "Scrolling over canvas zooms without scrolling the page");
  await page.mouse.wheel(0, 120);
  await page.waitForFunction(() =>
    document.querySelector("[data-playground-zoom-label]").value === "100%");
  assert.equal(await zoomLabel.innerText(), "100%", "Wheel zoom works in both directions");
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
  await page.mouse.move(box.x + 110, body.y + body.height / 2, {
    steps: 16,
  });
  await page.waitForTimeout(160);
  const held = await card.boundingBox();
  assert(
    held.x < before.x - 100,
    "A card moves across the finite world at 65% zoom",
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
  assert.equal(
    await world.getAttribute("style"),
    previous,
    "Camera stays centered when the finite world fits the viewport",
  );
  await page.locator("[data-playground-reset]").click();
  await page.locator("#interactions-tab").click();
  assert(!(await board.isVisible()));
  await page.locator("#interactions-tab").press("ArrowLeft");
  assert(await board.isVisible());
  await page.locator("#canvas-tab").press("ArrowRight");
  const ball = page.locator(".interaction-spring-ball");
  assert.equal(await page.locator(".spring-tether").count(), 0,
    "Physics ball has no decorative spring wire");
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

export async function canvasBounds(page, load) {
  for (const type of ["pointerdown", "pointermove", "wheel", "keydown", "input", "click"]) {
    await load(page, "/play-lab#canvas");
    await page.reload({ waitUntil: "networkidle" });
    const board = page.locator("[data-playground-board]");
    assert(await page.locator("#playground-instructions").isVisible());
    await board.dispatchEvent(type, type === "wheel" ? { deltaY: -100 } : {});
    assert(!(await page.locator("#playground-instructions").isVisible()), `${type} dismisses instructions`);
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await load(page, "/play-lab#canvas");
    await page.reload({ waitUntil: "networkidle" });
    const board = page.locator("[data-playground-board]");
    const world = page.locator(".playground-world");
    for (let step = 0; step < 5; step++) await page.locator('[data-playground-zoom="in"]').click();
    await board.focus();
    for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      for (let step = 0; step < 25; step++) await board.press(`Shift+${key}`);
      const edge = await world.getAttribute("style");
      await board.press(`Shift+${key}`);
      assert.equal(await world.getAttribute("style"), edge, `${width}: finite ${key} edge`);
    }
    if (width === 1440) {
      const note = page.locator(".playground-note");
      const heading = await note.locator(".widget-heading").boundingBox();
      const rect = await board.boundingBox();
      const initial = await world.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
      await page.mouse.move(heading.x + heading.width / 2, heading.y + heading.height / 2);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width - 3, heading.y + heading.height / 2, { steps: 12 });
      await page.waitForTimeout(1800);
      assert(await world.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41) < initial - 100,
        "Dragging at a zoomed edge pans across the full world");
      await page.mouse.up();
      await page.waitForTimeout(1400);
      assert(await note.evaluate(el => {
        const x = el.offsetLeft + new DOMMatrix(getComputedStyle(el).transform).m41;
        return x >= 17 && x + el.offsetWidth <= el.parentElement.offsetWidth - 17;
      }), "Thrown card remains inside the world");
    }
  }
}
