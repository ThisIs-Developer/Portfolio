(() => {
  "use strict";

  const canvas = document.querySelector("#bug-run");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const jumpButton = document.querySelector("#game-jump");
  const pauseButton = document.querySelector("#game-pause");
  const resetButton = document.querySelector("#game-reset");
  const scoreOutput = document.querySelector("#game-score");
  const bestOutput = document.querySelector("#game-best");
  const statusOutput = document.querySelector("#game-status");
  if (!context || !jumpButton || !pauseButton || !resetButton) return;
  for (const button of [jumpButton, pauseButton, resetButton])
    button.hidden = false;

  let WIDTH = 800;
  let HEIGHT = 180;
  let GROUND = 139;
  let ROBOT_X = 76;
  const ROBOT_WIDTH = 28;
  const ROBOT_HEIGHT = 32;
  const STORAGE_KEY = "baivab-bug-run-best";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const instructions =
    "Jump over the bugs. Select Start, tap the game, or focus it and press Space.";
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (!canvas.hasAttribute("tabindex")) canvas.tabIndex = 0;

  let state = "idle";
  let score = 0;
  let best = 0;
  let height = 0;
  let velocity = 0;
  let elapsed = 0;
  let distanceToNextBug = 310;
  let obstacles = [];
  let frameId = null;
  let previousTime = 0;
  let visible = true;
  let canvasReady = false;

  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isSafeInteger(stored) && stored > 0) best = stored;
  } catch {
    /* Storage is optional, including in private browsing. */
  }

  function announce(message) {
    if (statusOutput) statusOutput.textContent = message;
  }

  function updateControls() {
    if (scoreOutput) scoreOutput.textContent = String(score);
    if (bestOutput) bestOutput.textContent = String(best);
    jumpButton.textContent =
      state === "idle"
        ? "Start / jump"
        : state === "over"
          ? "Play again"
          : state === "paused"
            ? "Resume / jump"
            : "Jump";
    pauseButton.textContent = state === "paused" ? "Resume" : "Pause";
    pauseButton.disabled = state !== "running" && state !== "paused";
    canvas.dataset.state = state;
  }

  function stopFrame() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = 0;
  }

  function saveBest() {
    if (score <= best) return;
    best = score;
    try {
      localStorage.setItem(STORAGE_KEY, String(best));
    } catch {
      /* The run still works without storage. */
    }
  }

  function reset() {
    stopFrame();
    state = "idle";
    score = 0;
    height = 0;
    velocity = 0;
    elapsed = 0;
    distanceToNextBug = 310;
    obstacles = [];
    updateControls();
    announce(instructions);
    draw();
  }

  function scheduleFrame() {
    if (state === "running" && frameId === null)
      frameId = requestAnimationFrame(tick);
  }

  function jump() {
    if (document.hidden || !visible) return;
    if (state === "idle" || state === "over") {
      reset();
      state = "running";
      announce(
        "Running. Press Space or select Jump to clear each bug. Pause is available below.",
      );
    } else if (state === "paused") {
      state = "running";
      announce("Resumed. Press Space or select Jump to clear each bug.");
    }
    if (height === 0) velocity = 11.2;
    updateControls();
    scheduleFrame();
  }

  function pause(reason = "Paused. Select Resume when you are ready.") {
    if (state !== "running") return;
    state = "paused";
    stopFrame();
    updateControls();
    announce(reason);
    draw();
  }

  function resume() {
    if (state !== "paused" || document.hidden || !visible) return;
    state = "running";
    updateControls();
    announce("Resumed. Press Space or select Jump to clear each bug.");
    scheduleFrame();
  }

  function finish() {
    state = "over";
    stopFrame();
    saveBest();
    updateControls();
    announce(
      `A bug caught you. You cleared ${score} ${score === 1 ? "bug" : "bugs"}. Select Play again to try another run.`,
    );
  }

  function advance(step) {
    elapsed += step;
    height = Math.max(0, height + velocity * step);
    velocity = height > 0 ? velocity - 0.58 * step : 0;
    const speed = Math.min(6.5, 4 + score * 0.09);
    distanceToNextBug -= speed * step;
    if (distanceToNextBug <= 0) {
      obstacles.push({ x: WIDTH + 24, width: 24, height: 17, passed: false });
      distanceToNextBug = 300 + Math.random() * 180;
    }
    const robotBottom = GROUND - height;
    for (const bug of obstacles) {
      bug.x -= speed * step;
      const overlapsX =
        ROBOT_X + ROBOT_WIDTH - 5 > bug.x + 3 &&
        ROBOT_X + 5 < bug.x + bug.width - 3;
      const overlapsY =
        robotBottom - 3 > GROUND - bug.height &&
        robotBottom - ROBOT_HEIGHT + 3 < GROUND;
      if (overlapsX && overlapsY) {
        finish();
        return;
      }
      if (!bug.passed && bug.x + bug.width < ROBOT_X) {
        bug.passed = true;
        score += 1;
        saveBest();
        updateControls();
      }
    }
    obstacles = obstacles.filter((bug) => bug.x > -40);
  }

  function tick(time) {
    frameId = null;
    if (state !== "running") return;
    // Small bounded substeps keep collision behavior consistent across refresh rates.
    let remaining = previousTime
      ? Math.min((time - previousTime) / (1000 / 60), 3)
      : 1;
    previousTime = time;
    while (remaining > 0 && state === "running") {
      const step = Math.min(remaining, 1);
      advance(step);
      remaining -= step;
    }
    draw();
    scheduleFrame();
  }

  function pixelRobot(x, y) {
    context.fillStyle = "#658bff";
    context.fillRect(x + 4, y, 20, 18);
    context.fillRect(x, y + 7, 4, 8);
    context.fillRect(x + 24, y + 7, 4, 8);
    context.fillRect(x + 8, y + 18, 12, 9);
    const stride =
      state === "running" && height === 0 && !reducedMotion.matches
        ? (Math.floor(elapsed / 7) % 2) * 3
        : 0;
    context.fillRect(x + 4, y + 24, 8, 8 - stride);
    context.fillRect(x + 16, y + 24, 8, 5 + stride);
    context.fillStyle = "#c6d5ff";
    context.fillRect(x + 5, y + 2, 18, 3);
    context.fillStyle = "#101523";
    context.fillRect(x + 8, y + 7, 4, 4);
    context.fillRect(x + 17, y + 7, 4, 4);
    context.fillRect(x + 12, y + 13, 5, 2);
  }

  function pixelBug(bug) {
    const x = Math.round(bug.x);
    const y = GROUND - bug.height;
    context.fillStyle = "#c697fb";
    context.fillRect(x + 5, y + 3, 14, 11);
    context.fillRect(x + 8, y, 8, 5);
    context.fillRect(x, y + 5, 5, 3);
    context.fillRect(x + 19, y + 5, 5, 3);
    context.fillRect(x + 1, y + 12, 5, 5);
    context.fillRect(x + 18, y + 12, 5, 5);
    context.fillStyle = "#21172d";
    context.fillRect(x + 8, y + 5, 3, 3);
    context.fillRect(x + 14, y + 5, 3, 3);
  }

  function draw() {
    if (!canvasReady) return;
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#373943";
    context.fillRect(24, GROUND + 1, WIDTH - 48, 1);
    // Motion preference affects decoration; gameplay begins only by explicit choice.
    const drift = reducedMotion.matches ? 0 : elapsed * 0.65;
    context.fillStyle = "#24262e";
    for (let index = 0; index < 14; index += 1) {
      const x = (((index * 67 - drift) % WIDTH) + WIDTH) % WIDTH;
      context.fillRect(
        Math.round(x),
        GROUND + 13 + (index % 3) * 5,
        index % 2 ? 7 : 13,
        2,
      );
    }
    pixelRobot(ROBOT_X, Math.round(GROUND - ROBOT_HEIGHT - height));
    obstacles.forEach(pixelBug);
    if (state !== "running") {
      context.textAlign = "center";
      context.fillStyle = "#a8abb8";
      context.font = "13px ui-monospace, monospace";
      const label =
        state === "paused"
          ? "PAUSED — RESUME WHEN READY"
          : state === "over"
            ? "BUG FOUND. ONE MORE TRY?"
            : "A LITTLE BREAK. JUMP THE BUGS.";
      context.fillText(label, WIDTH / 2, 69);
      context.fillStyle = "#747887";
      context.font = "11px ui-monospace, monospace";
      context.fillText(
        state === "idle"
          ? "SPACE / TAP / START"
          : state === "over"
            ? `${score} CLEARED  ·  BEST ${best}`
            : "YOUR RUN IS SAVED HERE",
        WIDTH / 2,
        91,
      );
    }
  }

  jumpButton.addEventListener("click", jump);
  pauseButton.addEventListener("click", () =>
    state === "paused" ? resume() : pause(),
  );
  resetButton.addEventListener("click", reset);
  canvas.addEventListener("click", () => {
    canvas.focus({ preventScroll: true });
    jump();
  });
  canvas.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      if (!event.repeat) jump();
    } else if (event.code === "Escape") {
      pause();
    }
  });
  // Native buttons already translate their own Space/Enter activation into click.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden)
      pause("Paused while this tab is hidden. Select Resume to continue.");
  });
  reducedMotion.addEventListener("change", () => {
    if (state !== "running") draw();
  });
  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.round(bounds.width);
    const height = Math.round(bounds.height);
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    if (
      canvasReady && WIDTH === width && HEIGHT === height &&
      canvas.width === Math.round(width * scale) &&
      canvas.height === Math.round(height * scale)
    ) return;
    canvasReady = true;
    WIDTH = width;
    HEIGHT = height;
    GROUND = HEIGHT - 41;
    ROBOT_X = Math.min(76, Math.round(WIDTH * 0.16));
    canvas.width = Math.round(WIDTH * scale);
    canvas.height = Math.round(HEIGHT * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    if (state === "running")
      pause("Paused after resizing. Select Resume to continue.");
    draw();
  }
  const resizeObserver =
    "ResizeObserver" in window ? new ResizeObserver(resizeCanvas) : null;
  // The optional game initializes its drawing surface only when it comes into view.
  // This keeps canvas sizing and font measurement out of the hero's first render.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          resizeCanvas();
          resizeObserver?.observe(canvas);
        } else {
          resizeObserver?.unobserve(canvas);
          pause(
            "Paused while the game is offscreen. Select Resume to continue.",
          );
        }
      },
      { threshold: 0.01 },
    ).observe(canvas);
  } else {
    resizeCanvas();
    resizeObserver?.observe(canvas);
  }
  reset();
})();
