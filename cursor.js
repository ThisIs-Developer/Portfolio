(() => {
  const surfaces = [...document.querySelectorAll(".page-surface")];
  if (!surfaces.length) return;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const paintedElements =
    "a,button,input,textarea,select,summary,label,figure,table,pre,blockquote,div,span,nav,aside,details,img,svg,canvas";
  const fields = surfaces
    .map((surface) => {
      const canvas = document.createElement("canvas");
      canvas.className = "cursor-dot-layer";
      canvas.setAttribute("aria-hidden", "true");
      const context = canvas.getContext("2d");
      surface.prepend(canvas);
      return {
        surface,
        canvas,
        context,
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
    const add = (rect, pad = 1, radius = 0) => {
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
          radius,
        ]);
    };
    // A transparent layout box is never a mask. Painted surfaces protect their
    // own silhouette; text links and paragraphs are handled word by word below.
    const walker = document.createTreeWalker(
      field.surface,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node === field.canvas ||
              node.matches("script,style,[hidden],.sr-only")
            )
              return NodeFilter.FILTER_REJECT;
            if (node.matches(paintedElements)) {
              const rect = node.getBoundingClientRect();
              if (
                rect.width &&
                rect.height &&
                rect.bottom > 0 &&
                rect.top < height
              ) {
                const style = getComputedStyle(node);
                if (style.visibility === "hidden" || style.display === "none")
                  return NodeFilter.FILTER_REJECT;
                const alpha = style.backgroundColor
                  .match(/[\d.]+/g)
                  ?.map(Number);
                const painted =
                  style.backgroundImage !== "none" ||
                  alpha?.length === 3 ||
                  (alpha?.[3] ?? 0) > 0;
                const media = node.matches("img,svg,canvas");
                if (painted || media) {
                  // Rotated artwork already occludes the dots with its actual
                  // painted shape. Never erase its larger axis-aligned box.
                  if (style.transform === "none") {
                    const radius = style.borderTopLeftRadius;
                    add(
                      rect,
                      0,
                      radius.includes("%")
                        ? (Math.min(rect.width, rect.height) *
                            parseFloat(radius)) /
                            100
                        : parseFloat(radius) || 0,
                    );
                  }
                  return NodeFilter.FILTER_REJECT;
                }
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
          return node.textContent.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      },
    );
    const range = document.createRange();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      const bounds = parent.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= height) continue;
      for (const word of node.textContent.matchAll(/\S+/gu)) {
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        for (const rect of range.getClientRects()) add(rect);
      }
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
      if (bounds.bottom <= 0 || bounds.top >= height || bounds.width <= 0) continue;
      if (field.dirty || time < movingUntil) measure(field);
      const channels = getComputedStyle(surface)
        .getPropertyValue("--dot")
        .match(/[\d.]+/g)
        .map(Number);
      // Hex colors avoid Canvas's CSS color resolver forcing style calculation.
      const dark = document.documentElement.dataset.theme === "dark";
      const highlight = dark ? [170, 180, 210, 0.24] : [45, 52, 73, 0.48];
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
      const dots = Array.from({ length: 25 }, () => []);
      for (let y = top; y < Math.min(height, bounds.bottom); y += 28) {
        for (let x = left; x < Math.min(width, bounds.right); x += 28) {
          const distance =
            pointer && pointer.surface === surface
              ? Math.max(
                  0,
                  1 - Math.hypot(x - pointer.x, y - pointer.y) / 185,
                ) * strength
              : 0;
          const proximity = distance * distance * (3 - 2 * distance);
          dots[Math.round(proximity * 24)].push([x, y]);
        }
      }
      dots.forEach((points, index) => {
        if (!points.length) return;
        const proximity = index / 24;
        const radius = 1.15 + proximity * (dark ? 1.2 : 1.85);
        context.fillStyle =
          "#" +
          channels
            .map((value, channel) => {
              const mixed = value + (highlight[channel] - value) * proximity;
              return Math.round(mixed * (channel === 3 ? 255 : 1))
                .toString(16)
                .padStart(2, "0");
            })
            .join("");
        context.beginPath();
        for (const [x, y] of points) {
          context.moveTo(x + radius, y);
          context.arc(x, y, radius, 0, Math.PI * 2);
        }
        context.fill();
      });
      // Multiply two gradients: all four sides and corners dissolve while the
      // middle stays at full strength. This is independent of cursor falloff.
      const edgeX = Math.min(120, bounds.width * 0.15);
      const visibleTop = Math.max(0, bounds.top);
      const visibleBottom = Math.min(height, bounds.bottom);
      const edgeY = Math.min(100, (visibleBottom - visibleTop) * 0.18);
      context.globalCompositeOperation = "destination-in";
      for (const [start, end, fade, vertical] of [
        [bounds.left, bounds.right, edgeX, false],
        [visibleTop, visibleBottom, edgeY, true],
      ]) {
        const gradient = vertical
          ? context.createLinearGradient(0, start, 0, end)
          : context.createLinearGradient(start, 0, end, 0);
        const stop = fade / (end - start);
        gradient.addColorStop(0, "#0000");
        gradient.addColorStop(stop * 0.35, "#0003");
        gradient.addColorStop(stop, "#000f");
        gradient.addColorStop(1 - stop, "#000f");
        gradient.addColorStop(1 - stop * 0.35, "#0003");
        gradient.addColorStop(1, "#0000");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      }
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "#000";
      context.beginPath();
      for (const [x, y, w, h, radius] of field.masks)
        context.roundRect(x, y, w, h, radius);
      context.fill();
      context.restore();
      if (!canvas.dataset.dotField) canvas.dataset.dotField = "ready";
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
        interactive() && event.pointerType !== "touch" && surface
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
