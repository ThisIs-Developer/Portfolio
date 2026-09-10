(() => {
  const surfaces = [...document.querySelectorAll(".page-surface")];
  if (!surfaces.length) return;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const ui =
    "a,button,input,textarea,select,summary,label,figure,table,pre,blockquote,.folder,.writing-card,.journal-card,.private-card,.wallet-card,.playground-card,.photo-fan,.profile-board,.capabilities,.capability-intro,.ask-widget,.collection-controls,.project-facts,.case-meta,.page-toc";
  const maskedBlocks = ui + ",p,li,dt,dd,figcaption";
  const fields = surfaces
    .map((surface) => {
      const canvas = document.createElement("canvas");
      canvas.className = "cursor-dot-layer";
      canvas.setAttribute("aria-hidden", "true");
      surface.prepend(canvas);
      return {
        surface,
        canvas,
        context: canvas.getContext("2d"),
        masks: [],
        dirty: true,
      };
    })
    .filter((field) => field.context);
  let frame = 0,
    pointer = null,
    strength = 0,
    previous = 0,
    movingUntil = 0;
  let width = innerWidth,
    height = innerHeight;
  const interactive = () => finePointer.matches && !reducedMotion.matches;
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
    true,
  );
  function schedule(dirty = false) {
    if (dirty) fields.forEach((field) => (field.dirty = true));
    if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function measure(field) {
    const masks = [];
    const add = (rect, pad = 4) => {
      if (
        rect.width &&
        rect.height &&
        rect.bottom > -20 &&
        rect.top < height + 20
      )
        masks.push([
          rect.left - pad,
          rect.top - pad,
          rect.width + pad * 2,
          rect.height + pad * 2,
        ]);
    };
    // Reserve complete UI and paragraph areas. Text ranges protect unwrapped
    // headings and inline labels without changing their own backgrounds.
    field.surface.querySelectorAll(maskedBlocks).forEach((element) => {
      if (!element.closest("[hidden],.sr-only,svg,[aria-hidden='true']"))
        add(
          element.getBoundingClientRect(),
          element.matches("p,li,dt,dd") ? 4 : 1,
        );
    });
    const walker = document.createTreeWalker(
      field.surface,
      NodeFilter.SHOW_TEXT,
    );
    const range = document.createRange();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        !node.textContent.trim() ||
        node.parentElement.closest(
          "script,style,svg,[hidden],[aria-hidden='true'],.sr-only",
        )
      )
        continue;
      if (node.parentElement.closest(maskedBlocks)) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) add(rect, 5);
    }
    field.masks = masks;
    field.dirty = false;
  }
  function draw(time) {
    frame = 0;
    const target = pointer && interactive() ? 1 : 0;
    const elapsed = Math.min(50, time - (previous || time - 16));
    previous = time;
    strength += (target - strength) * (1 - Math.exp(-elapsed / 85));
    if (strength < 0.005) strength = 0;
    for (const field of fields) {
      const { context, canvas, surface } = field;
      const bounds = surface.getBoundingClientRect();
      context.clearRect(0, 0, width, height);
      if (bounds.bottom < 0 || bounds.top > height) continue;
      if (field.dirty || time < movingUntil) measure(field);
      const base = getComputedStyle(surface).getPropertyValue("--dot").trim();
      const highlight =
        document.documentElement.dataset.theme === "dark"
          ? "rgb(207 216 255 / .56)"
          : "rgb(45 52 73 / .52)";
      context.save();
      context.beginPath();
      context.rect(
        bounds.left,
        Math.max(0, bounds.top),
        bounds.width,
        Math.min(height, bounds.bottom) - Math.max(0, bounds.top),
      );
      context.clip();
      const left = bounds.left + 14 + Math.floor(-bounds.left / 28) * 28;
      const top = bounds.top + 14 + Math.floor(-bounds.top / 28) * 28;
      for (let y = top; y < Math.min(height, bounds.bottom); y += 28) {
        for (let x = left; x < Math.min(width, bounds.right); x += 28) {
          const proximity =
            pointer && pointer.surface === surface
              ? Math.max(
                  0,
                  1 - Math.hypot(x - pointer.x, y - pointer.y) / 185,
                ) * strength
              : 0;
          context.fillStyle = proximity > 0.03 ? highlight : base;
          context.beginPath();
          context.arc(x, y, 0.85 + proximity * 2.15, 0, Math.PI * 2);
          context.fill();
        }
      }
      // Erase the decoration beneath readable content, preserving every
      // card's own color and artwork instead of painting backgrounds on text.
      for (const rect of field.masks) context.clearRect(...rect);
      context.restore();
      canvas.dataset.dotField = "ready";
    }
    if (Math.abs(target - strength) > 0.005 || time < movingUntil) schedule();
    else previous = 0;
  }
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    fields.forEach(({ canvas, context }) => {
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
    });
    schedule(true);
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      const surface = event.target.closest?.(".page-surface");
      const nextPointer =
        interactive() &&
        event.pointerType !== "touch" &&
        surface &&
        !event.target.closest(ui)
          ? { x: event.clientX, y: event.clientY, surface }
          : null;
      if (!nextPointer && !pointer && strength === 0) return;
      pointer = nextPointer;
      schedule();
    },
    { passive: true },
  );
  const leave = () => {
    pointer = null;
    if (!interactive()) strength = 0;
    schedule();
  };
  document.documentElement.addEventListener("pointerleave", leave, {
    passive: true,
  });
  window.addEventListener("blur", leave);
  window.addEventListener("scroll", () => schedule(true), { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    leave();
    schedule(true);
  });
  document.addEventListener("keydown", leave, { passive: true });
  finePointer.addEventListener("change", leave);
  reducedMotion.addEventListener("change", leave);
  new MutationObserver(() => schedule(true)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  for (const field of fields) {
    new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.target !== field.canvas &&
            !record.target.matches?.(".capability-progress"),
        )
      )
        schedule(true);
    }).observe(field.surface, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "open", "aria-expanded"],
    });
    new ResizeObserver(() => schedule(true)).observe(field.surface);
    field.surface.addEventListener("load", () => schedule(true), true);
    field.surface.addEventListener("transitionend", () => schedule(true), true);
    field.surface.addEventListener(
      "transitionrun",
      () => {
        movingUntil = performance.now() + 700;
        schedule(true);
      },
      true,
    );
    field.surface.addEventListener("portfolio:motion", (event) => {
      movingUntil = Math.max(
        movingUntil,
        performance.now() +
          Math.min(2000, Number(event.detail?.duration) || 650),
      );
      schedule(true);
    });
  }
  document.fonts.ready.then(() => schedule(true));
  resize();
})();
