(() => {
  const surfaces = [...document.querySelectorAll(".page-surface")];
  if (!surfaces.length) return;

  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const controls =
    "a, button, input, textarea, select, summary, [role='button'], .quick-ask, .ask-answer, .game-panel, .playground-card, .widget-card, .nav-shell";
  // Browsers keep text fields focus-visible after mouse clicks. Track modality
  // so keyboard users retain a clear ring without outlining clicked controls.
  document.addEventListener(
    "pointerdown",
    () => {
      document.documentElement.dataset.inputModality = "pointer";
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Tab" || event.key.startsWith("Arrow"))
        document.documentElement.dataset.inputModality = "keyboard";
    },
    { capture: true },
  );

  const spacing = 28;
  const radius = 200;
  const dots = new Map();
  let canvas;
  let context;
  let surface;
  let frame = 0;
  let pointer = null;
  let previousTime = 0;
  let previousBounds;
  let width = 0;
  let height = 0;
  let color = "rgb(45 52 73 / 0.4)";

  const enabled = () => finePointer.matches && !reducedMotion.matches;

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    pointer = null;
    previousTime = 0;
    previousBounds = null;
    dots.clear();
    context?.clearRect(0, 0, width, height);
  }

  function resize() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    previousBounds = null;
    schedule();
  }

  function updateColor() {
    color =
      document.documentElement.dataset.theme === "dark"
        ? "rgb(207 216 255 / 0.48)"
        : "rgb(45 52 73 / 0.4)";
    schedule();
  }

  function schedule() {
    if (canvas && !frame && enabled() && !document.hidden)
      frame = requestAnimationFrame(draw);
  }

  function draw(time) {
    frame = 0;
    const bounds = surface.getBoundingClientRect();
    const amount =
      1 -
      Math.pow(
        0.84,
        Math.min((time - (previousTime || time - 16.7)) / 16.7, 3),
      );
    previousTime = time;
    if (previousBounds) context.clearRect(...previousBounds);

    const inside =
      pointer &&
      pointer.x >= bounds.left &&
      pointer.x <= bounds.right &&
      pointer.y >= bounds.top &&
      pointer.y <= bounds.bottom;
    if (inside) {
      const firstColumn = Math.floor(
        (pointer.x - bounds.left - radius) / spacing,
      );
      const firstRow = Math.floor((pointer.y - bounds.top - radius) / spacing);
      for (let row = firstRow; row <= firstRow + 15; row++) {
        for (let column = firstColumn; column <= firstColumn + 15; column++) {
          const x = column * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;
          if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) continue;
          const distance = Math.hypot(
            x + bounds.left - pointer.x,
            y + bounds.top - pointer.y,
          );
          if (distance < radius && !dots.has(`${column},${row}`))
            dots.set(`${column},${row}`, { x, y, size: 0 });
        }
      }
    }

    context.fillStyle = color;
    let unsettled = false;
    let left = width;
    let top = height;
    let right = 0;
    let bottom = 0;
    for (const [key, dot] of dots) {
      const x = dot.x + bounds.left;
      const y = dot.y + bounds.top;
      const distance = inside
        ? Math.hypot(x - pointer.x, y - pointer.y)
        : radius;
      const target = Math.max(0, 1 - distance / radius);
      dot.size += (target - dot.size) * amount;
      if (dot.size < 0.003 && target === 0) {
        dots.delete(key);
        continue;
      }
      if (Math.abs(target - dot.size) > 0.003) unsettled = true;
      if (x < 0 || y < 0 || x > width || y > height) continue;
      context.globalAlpha = Math.min(1, dot.size * 4);
      context.beginPath();
      context.arc(x, y, 0.75 + 2.05 * dot.size, 0, Math.PI * 2);
      context.fill();
      left = Math.min(left, x - 4);
      top = Math.min(top, y - 4);
      right = Math.max(right, x + 4);
      bottom = Math.max(bottom, y + 4);
    }
    context.globalAlpha = 1;
    previousBounds =
      right > left ? [left, top, right - left, bottom - top] : null;
    if (unsettled) schedule();
    else previousTime = 0;
  }

  function move(event) {
    if (!enabled() || event.pointerType === "touch") return;
    const nextSurface = event.target.closest?.(".page-surface");
    if (!nextSurface || event.target.closest?.(controls)) return leave();
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "cursor-dot-layer";
      canvas.setAttribute("aria-hidden", "true");
      context = canvas.getContext("2d");
      if (!context) return;
      surface = nextSurface;
      surface.prepend(canvas);
      resize();
    } else if (surface !== nextSurface) {
      clear();
      surface = nextSurface;
      surface.prepend(canvas);
    }
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  }

  function leave() {
    pointer = null;
    schedule();
  }

  function mediaChanged() {
    if (!enabled()) clear();
  }

  document.addEventListener("pointermove", move, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave, {
    passive: true,
  });
  window.addEventListener("blur", clear);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("keydown", leave, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  finePointer.addEventListener("change", mediaChanged);
  reducedMotion.addEventListener("change", mediaChanged);
  new MutationObserver(updateColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  updateColor();
})();
