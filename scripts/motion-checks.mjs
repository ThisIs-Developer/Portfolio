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
  await page.mouse.move(before.x + before.width / 2 < box.x + box.width / 2 ? box.x + box.width - 110 : box.x + 110, body.y + body.height / 2, {
    steps: 16,
  });
  await page.waitForTimeout(160);
  const held = await card.boundingBox();
  assert(
    Math.abs(held.x - before.x) > 100,
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
  const snapshot = () => page.locator("[data-playground-card]").evaluateAll(cards => cards.map(card => {
    const transform = new DOMMatrix(getComputedStyle(card).transform);
    return { id: card.dataset.widgetId, x: card.offsetLeft + transform.m41,
      y: card.offsetTop + transform.m42, width: card.offsetWidth, height: card.offsetHeight };
  }));
  const worldSize = () => page.locator(".playground-world").evaluate(w => [w.offsetWidth, w.offsetHeight]);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await load(page, "/play-lab#canvas");
    await page.reload({ waitUntil: "networkidle" });
    const board = page.locator("[data-playground-board]");
    const world = page.locator(".playground-world");
    const reset = page.locator("[data-playground-reset]");
    const clock = page.locator(".playground-clock");
    const initial = await snapshot();
    const dimensions = await worldSize();
    const boxes = await page.locator("[data-playground-card]").evaluateAll(cards => cards.map(c => {
      const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
    }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const overlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
        Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      assert(overlap / Math.min(a.w * a.h, b.w * b.h) < .03, "Random starting cards have clear spacing");
    }
    await board.scrollIntoViewIfNeeded();
    let rect = await board.boundingBox();
    const cameraBefore = await world.getAttribute("style");
    await page.mouse.move(rect.x + 5, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + 90, rect.y + rect.height / 2, { steps: 10 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    assert.notEqual(await world.getAttribute("style"), cameraBefore, "Dragging empty space pans the camera");
    assert.deepEqual(await snapshot(), initial, "Panning never changes card world coordinates");

    for (const zoom of [.65, 1, 1.65]) {
      await reset.click();
      const direction = zoom < 1 ? "out" : "in";
      for (let i = 0; i < (zoom < 1 ? 3 : zoom > 1 ? 5 : 0); i++)
        await page.locator(`[data-playground-zoom="${direction}"]`).click();
      assert.deepEqual(await worldSize(), dimensions, "Zoom cannot change world dimensions");
      // Position the clock centrally with ordinary keyboard panning before dragging.
      await clock.evaluate(el => el.focus({ preventScroll: true }));
      for (let i = 0; i < 12; i++) {
        const box = await clock.boundingBox(); rect = await board.boundingBox();
        const dx = rect.x + rect.width / 2 - box.x - box.width / 2;
        const dy = rect.y + rect.height / 2 - box.y - box.height / 2;
        if (Math.abs(dx) > 55) await board.dispatchEvent("keydown", { key: dx > 0 ? "ArrowLeft" : "ArrowRight", shiftKey: true });
        if (Math.abs(dy) > 55) await board.dispatchEvent("keydown", { key: dy > 0 ? "ArrowUp" : "ArrowDown", shiftKey: true });
      }
      await board.scrollIntoViewIfNeeded();
      rect = await board.boundingBox();
      const before = await snapshot();
      const scale = await world.evaluate(w => new DOMMatrix(getComputedStyle(w).transform).a);
      const box = await clock.boundingBox();
      const camera = await world.getAttribute("style");
      const dx = box.x + box.width / 2 > rect.x + rect.width / 2 ? -48 : 48;
      await clock.locator("p").last().evaluate(el => window.getSelection().selectAllChildren(el));
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(300);
      await page.mouse.up();
      const after = await snapshot();
      const from = before.find(c => c.id === "clock"), to = after.find(c => c.id === "clock");
      assert(Math.abs(to.x - from.x - dx / scale) < 2, `${width} at ${zoom}: pointer movement is converted to world units (${JSON.stringify({from, to, dx, scale, box, rect})})`);
      assert.equal(await world.getAttribute("style"), camera, "Dragging a card away from edges does not pan the camera");
      assert.deepEqual(after.filter(c => c.id !== "clock"), before.filter(c => c.id !== "clock"), "Only the dragged card moves");
      assert.equal(await page.evaluate(() => getSelection().toString()), "", "Dragging clears accidental text selection");
      assert(await page.locator(".playground-work img").evaluate(img => !img.draggable));
    }
    // Moving to a world edge must reach the same position before and after zooming out.
    await reset.click();
    await clock.focus();
    for (let i = 0; i < 65; i++) await clock.dispatchEvent("keydown", { key: "ArrowRight", shiftKey: true });
    const edgeAt100 = (await snapshot()).find(c => c.id === "clock");
    for (let i = 0; i < 3; i++) await page.locator('[data-playground-zoom="out"]').click();
    for (let i = 0; i < 65; i++) await clock.dispatchEvent("keydown", { key: "ArrowRight", shiftKey: true });
    const edgeAt65 = (await snapshot()).find(c => c.id === "clock");
    assert.equal(edgeAt100.x, edgeAt65.x, "World edge is independent of zoom or camera");
    const visibleClock = await clock.boundingBox(); rect = await board.boundingBox();
    assert(visibleClock.x >= rect.x - 1 && visibleClock.x + visibleClock.width <= rect.x + rect.width + 1,
      "Zooming out exposes usable space beyond the initial view");
    assert(edgeAt65.x + edgeAt65.width > dimensions[0] * .9, "Cards can reach the full world edge");
    assert(edgeAt65.x + edgeAt65.width <= dimensions[0], "Cards stay inside the finite world");
    await reset.click();
    assert.deepEqual(await snapshot(), initial, "Reset restores the original random arrangement");
    for (let i = 0; i < 5; i++) await page.locator('[data-playground-zoom="in"]').click();
    for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      for (let i = 0; i < 65; i++) await board.dispatchEvent("keydown", { key, shiftKey: true });
      const edge = await world.getAttribute("style");
      await board.dispatchEvent("keydown", { key, shiftKey: true });
      assert.equal(await world.getAttribute("style"), edge, `${width}: finite ${key} camera boundary`);
    }
    await page.reload({ waitUntil: "networkidle" });
    assert.notDeepEqual(await snapshot(), initial, "A fresh visit starts with a new random arrangement");
  }
}