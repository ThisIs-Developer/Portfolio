(() => {
  const sectionLinks = [...document.querySelectorAll(".play-lab-switch a")];
  const tabMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let panelAnimation;
  const setSection = (hash, animate = true) => {
    const selected = hash === "#interactions" ? "#interactions" : "#canvas";
    panelAnimation?.cancel();
    sectionLinks.forEach((link) => {
      const active = link.hash === selected;
      link.setAttribute("aria-selected", String(active));
      link.tabIndex = active ? 0 : -1;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
      const panel = document.querySelector(link.hash);
      panel.hidden = !active;
      panel.inert = !active;
      if (active && animate && !tabMotion.matches)
        panelAnimation = panel.animate(
          [
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" },
        );
    });
    document.dispatchEvent(
      new CustomEvent("playlab:panelchange", {
        detail: { panel: selected.slice(1) },
      }),
    );
  };
  const activate = (link) => {
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    setSection(link.hash);
  };
  setSection(location.hash, false);
  sectionLinks.forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      activate(link);
    }),
  );
  sectionLinks.forEach((link, index) =>
    link.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? sectionLinks.length - 1
            : (index +
                (event.key === "ArrowRight" ? 1 : -1) +
                sectionLinks.length) %
              sectionLinks.length;
      sectionLinks[next].focus();
      activate(sectionLinks[next]);
    }),
  );
  window.addEventListener("hashchange", () => setSection(location.hash));
  const board = document.querySelector("[data-playground-board]");
  if (board) {
    const world = board.querySelector(".playground-world");
    const cards = [...board.querySelectorAll("[data-playground-card]")];
    const view = document.querySelector("[data-playground-view]");
    const label = board.querySelector("[data-playground-zoom-label]");
    const status = document.querySelector("[data-playground-status]");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const positions = new Map(
      cards.map((card) => [
        card,
        { x: 0, y: 0, vx: 0, vy: 0, lift: 0, tilt: 0 },
      ]),
    );
    let frame = 0;
    let lastFrame = 0;
    let zoom = 1;
    let fit = 1;
    const compactScreen = matchMedia("(max-width: 767px)");
    let list = compactScreen.matches;
    let drag = null;
    let panDrag = null;
    const camera = { x: 0, y: 0, vx: 0, vy: 0, ready: false };
    let layer = 2;
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem("portfolio-playground") || "{}");
    } catch {
      saved = {};
    }
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};

    function announce(message) {
      if (status) status.textContent = message;
    }
    function arrange() {
      if (list || !board.clientWidth) return;
      fit = Math.max(
        0.8,
        Math.min(
          (board.clientWidth - 12) / world.offsetWidth,
          (board.clientHeight - 88) / world.offsetHeight,
          1,
        ),
      );
      const scale = fit * zoom;
      if (!camera.ready) {
        camera.x = compactScreen.matches
          ? -10
          : (board.clientWidth - world.offsetWidth * scale) / 2;
        camera.y = Math.max(
          18,
          (board.clientHeight - 88 - world.offsetHeight * scale) / 2,
        );
        camera.ready = true;
      }
      paintCamera();
      label.value = `${Math.round(zoom * 100)}%`;
      board.querySelector('[data-playground-zoom="out"]').disabled =
        zoom <= 0.65;
      board.querySelector('[data-playground-zoom="in"]').disabled =
        zoom >= 1.65;
    }
    function paintCamera() {
      const scale = fit * zoom;
      world.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${scale})`;
      board.style.backgroundPosition = `${camera.x}px ${camera.y}px`;
      board.style.backgroundSize = `${24 * scale}px ${24 * scale}px`;
    }
    function paint(card) {
      const position = positions.get(card);
      card.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) rotate(calc(var(--card-angle) + ${position.tilt}deg)) scale(${1 + position.lift * 0.035})`;
    }
    function bounds(card) {
      // The usable world is the current camera viewport, not the original card
      // arrangement. Zooming out therefore creates real space on every side.
      const scale = fit * zoom;
      const pad = 18;
      return {
        left: (pad - camera.x) / scale - card.offsetLeft,
        right:
          (board.clientWidth - pad - camera.x) / scale -
          card.offsetLeft -
          card.offsetWidth,
        top: (pad - camera.y) / scale - card.offsetTop,
        bottom:
          (board.clientHeight - 92 - camera.y) / scale -
          card.offsetTop -
          card.offsetHeight,
      };
    }
    function clampPosition(card) {
      const p = positions.get(card),
        b = bounds(card);
      p.x = Math.max(b.left, Math.min(b.right, p.x));
      p.y = Math.max(b.top, Math.min(b.bottom, p.y));
    }
    function wake() {
      if (!frame && !list && !board.closest("[hidden]")) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(animateCards);
      }
    }
    function animateCards(now) {
      frame = 0;
      const dt = Math.min(32, Math.max(1, now - lastFrame));
      lastFrame = now;
      let moving = false;
      if (panDrag) {
        const ease = 1 - Math.pow(0.42, dt / 16.67);
        camera.x += (panDrag.targetX - camera.x) * ease;
        camera.y += (panDrag.targetY - camera.y) * ease;
        moving = true;
        paintCamera();
      } else if (Math.abs(camera.vx) + Math.abs(camera.vy) > 0.018) {
        camera.x += camera.vx * dt;
        camera.y += camera.vy * dt;
        camera.vx *= Math.pow(0.87, dt / 16.67);
        camera.vy *= Math.pow(0.87, dt / 16.67);
        moving = true;
        paintCamera();
      } else camera.vx = camera.vy = 0;
      for (const [card, p] of positions) {
        const held = drag?.card === card;
        const ease = 1 - Math.pow(0.45, dt / 16.67);
        if (held) {
          p.x += (drag.targetX - p.x) * ease;
          p.y += (drag.targetY - p.y) * ease;
          moving = true;
        } else if (Math.abs(p.vx) + Math.abs(p.vy) > 0.018) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const b = bounds(card);
          if (p.x < b.left || p.x > b.right) p.vx *= -0.32;
          if (p.y < b.top || p.y > b.bottom) p.vy *= -0.32;
          clampPosition(card);
          const friction = Math.pow(0.91, dt / 16.67);
          p.vx *= friction;
          p.vy *= friction;
          moving = true;
        } else {
          p.vx = p.vy = 0;
        }
        const targetLift = held ? 1 : 0;
        const targetTilt = Math.max(
          -7,
          Math.min(7, (held ? drag.vx : p.vx) * 4),
        );
        p.lift += (targetLift - p.lift) * ease;
        p.tilt += (targetTilt - p.tilt) * ease;
        if (
          Math.abs(targetLift - p.lift) > 0.002 ||
          Math.abs(targetTilt - p.tilt) > 0.02
        )
          moving = true;
        else {
          p.lift = targetLift;
          p.tilt = targetTilt;
        }
        card.classList.toggle(
          "is-moving",
          held || Math.abs(p.vx) + Math.abs(p.vy) > 0.018,
        );
        paint(card);
      }
      if (moving && !list && !motion.matches)
        frame = requestAnimationFrame(animateCards);
    }
    function stopMovement() {
      cancelAnimationFrame(frame);
      frame = 0;
      const held = drag;
      drag = null;
      const heldPan = panDrag;
      panDrag = null;
      camera.vx = camera.vy = 0;
      board.classList.remove("is-panning");
      if (heldPan && board.hasPointerCapture(heldPan.id))
        board.releasePointerCapture(heldPan.id);
      if (held?.card.hasPointerCapture(held.id))
        held.card.releasePointerCapture(held.id);
      for (const [card, p] of positions) {
        p.vx = p.vy = p.lift = p.tilt = 0;
        card.classList.remove("is-dragging", "is-moving");
        paint(card);
      }
    }
    function save() {
      try {
        localStorage.setItem("portfolio-playground", JSON.stringify(saved));
      } catch {
        /* The canvas also works without browser storage. */
      }
    }
    const note = board.querySelector("[data-widget-note]");
    if (typeof saved.note === "string") note.value = saved.note.slice(0, 240);
    const countNote = () =>
      (board.querySelector("[data-widget-note-count]").textContent =
        `${note.value.length} / 240`);
    countNote();
    note.addEventListener("input", () => {
      saved.note = note.value;
      countNote();
      save();
    });
    const votes = [...board.querySelectorAll("[data-widget-vote]")];
    function vote(value) {
      for (const button of votes)
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.widgetVote === value),
        );
      const chosen = votes.find((b) => b.dataset.widgetVote === value);
      if (chosen)
        board.querySelector("[data-widget-vote-status]").textContent =
          `Your pick: ${chosen.querySelector("span").textContent}. Saved only in this browser.`;
    }
    vote(saved.vote);
    for (const button of votes)
      button.addEventListener("click", () => {
        saved.vote = button.dataset.widgetVote;
        vote(saved.vote);
        save();
      });
    const checks = [...board.querySelectorAll("[data-playground-check]")];
    function taskProgress() {
      const count = checks.filter((x) => x.checked).length;
      board.querySelector("[data-widget-task-progress]").style.width =
        `${(count / 3) * 100}%`;
      board.querySelector("[data-widget-task-count]").textContent =
        `${count} of 3 little wins`;
    }
    board.addEventListener("change", taskProgress);
    const hue = board.querySelector("[data-widget-hue-input]");
    if (Number.isInteger(saved.hue) && saved.hue >= 0 && saved.hue <= 359)
      hue.value = saved.hue;
    let colour;
    function mix() {
      const h = Number(hue.value),
        s = 0.58,
        l = 0.85;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => {
        const k = (n + h / 30) % 12;
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };
      colour =
        "#" +
        [f(0), f(8), f(4)]
          .map((n) =>
            Math.round(n * 255)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
          .toUpperCase();
      board.querySelector(
        "[data-widget-colour-preview]",
      ).style.backgroundColor = colour;
      board.querySelector("[data-widget-colour-code]").textContent = colour;
      board.querySelector("[data-widget-hue]").textContent = `${h}°`;
    }
    mix();
    hue.addEventListener("input", () => {
      saved.hue = Number(hue.value);
      mix();
      save();
    });
    board
      .querySelector("[data-widget-colour-copy]")
      .addEventListener("click", async () => {
        const status = board.querySelector("[data-widget-colour-status]");
        try {
          await navigator.clipboard.writeText(colour);
          status.textContent = `Copied ${colour}`;
        } catch {
          status.textContent = `Select and copy ${colour} from the colour swatch.`;
        }
      });
    let duration = 300,
      remaining = 300,
      deadline = 0,
      ticking = null;
    const timer = board.querySelector("[data-widget-timer]"),
      toggle = board.querySelector("[data-widget-timer-toggle]");
    const timerStatus = board.querySelector("[data-widget-timer-status]");
    function displayTime() {
      timer.value = `${Math.floor(remaining / 60)
        .toString()
        .padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
      board
        .querySelector(".widget-timer-ring")
        .style.setProperty(
          "--timer-progress",
          `${(remaining / duration) * 100}%`,
        );
    }
    function pause() {
      clearInterval(ticking);
      ticking = null;
      toggle.textContent =
        remaining === duration ? "Start focus" : "Resume focus";
    }
    function tick() {
      remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      displayTime();
      if (!remaining) {
        pause();
        toggle.textContent = "Start again";
        timerStatus.textContent =
          "Focus session complete. Take a moment to rest.";
      }
    }
    toggle.addEventListener("click", () => {
      if (ticking) {
        tick();
        pause();
        timerStatus.textContent = "Focus session paused.";
      } else {
        if (!remaining) remaining = duration;
        deadline = Date.now() + remaining * 1000;
        ticking = setInterval(tick, 250);
        toggle.textContent = "Pause focus";
        timerStatus.textContent = "Focus session started.";
        tick();
      }
    });
    board
      .querySelector("[data-widget-timer-reset]")
      .addEventListener("click", () => {
        remaining = duration;
        pause();
        displayTime();
        timerStatus.textContent = "Timer reset.";
      });
    board.querySelectorAll("[data-widget-duration]").forEach((button) =>
      button.addEventListener("click", () => {
        duration = Number(button.dataset.widgetDuration) * 60;
        remaining = duration;
        pause();
        displayTime();
        board
          .querySelectorAll("[data-widget-duration]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        timerStatus.textContent = `${duration / 60} minute session selected.`;
      }),
    );
    window.addEventListener("pagehide", pause);
    document.addEventListener("visibilitychange", () => {
      if (ticking) tick();
    });
    function setColor(color) {
      board.dataset.canvasColor = color;
      board
        .querySelectorAll("[data-playground-color]")
        .forEach((button) =>
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.playgroundColor === color),
          ),
        );
    }
    if (["blue", "cream", "green", "lilac", "pink"].includes(saved.color))
      setColor(saved.color);
    board.querySelectorAll("[data-playground-check]").forEach((input) => {
      input.checked = saved[input.dataset.playgroundCheck] === true;
      input.addEventListener("change", () => {
        saved[input.dataset.playgroundCheck] = input.checked;
        save();
      });
    });
    taskProgress();
    board.querySelectorAll("[data-playground-color]").forEach((button) =>
      button.addEventListener("click", () => {
        saved.color = button.dataset.playgroundColor;
        setColor(saved.color);
        save();
      }),
    );
    board.querySelectorAll("[data-playground-zoom]").forEach((button) =>
      button.addEventListener("click", () => {
        stopMovement();
        const oldScale = fit * zoom;
        const centerX = board.clientWidth / 2,
          centerY = (board.clientHeight - 88) / 2;
        const worldX = (centerX - camera.x) / oldScale,
          worldY = (centerY - camera.y) / oldScale;
        zoom = Math.min(
          1.65,
          Math.max(
            0.65,
            Math.round(
              (zoom + (button.dataset.playgroundZoom === "in" ? 0.15 : -0.15)) *
                100,
            ) / 100,
          ),
        );
        arrange();
        camera.x = centerX - worldX * fit * zoom;
        camera.y = centerY - worldY * fit * zoom;
        paintCamera();
        announce(`Canvas zoom ${Math.round(zoom * 100)} percent.`);
      }),
    );
    board
      .querySelector("[data-playground-reset]")
      .addEventListener("click", () => {
        stopMovement();
        zoom = 1;
        camera.ready = false;
        for (const [card, position] of positions) {
          position.x = 0;
          position.y = 0;
          card.style.zIndex = "";
          paint(card);
        }
        arrange();
        announce("Cards and zoom reset.");
      });
    function setList(next) {
      stopMovement();
      list = next;
      board.classList.toggle("is-list", list);
      view.setAttribute("aria-pressed", String(list));
      view.textContent = list ? "Canvas view" : "List view";
      for (const card of cards) card.tabIndex = list ? -1 : 0;
      board.tabIndex = list ? -1 : 0;
      arrange();
      announce(
        list
          ? "Cards are shown in reading order."
          : "Interactive canvas restored.",
      );
    }
    view.addEventListener("click", () => setList(!list));
    compactScreen.addEventListener("change", () => {
      camera.ready = false;
      setList(compactScreen.matches);
    });
    board.addEventListener("pointerdown", (event) => {
      if (
        list ||
        event.button !== 0 ||
        drag ||
        event.target.closest("[data-playground-card], button, input, a")
      )
        return;
      event.preventDefault();
      stopMovement();
      board.focus({ preventScroll: true });
      panDrag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startX: camera.x,
        startY: camera.y,
        targetX: camera.x,
        targetY: camera.y,
        lastX: event.clientX,
        lastY: event.clientY,
        time: performance.now(),
        vx: 0,
        vy: 0,
      };
      board.setPointerCapture(event.pointerId);
      board.classList.add("is-panning");
    });
    board.addEventListener("pointermove", (event) => {
      if (!panDrag || panDrag.id !== event.pointerId) return;
      const now = performance.now(),
        dt = Math.max(8, now - panDrag.time);
      panDrag.targetX = panDrag.startX + event.clientX - panDrag.x;
      panDrag.targetY = panDrag.startY + event.clientY - panDrag.y;
      panDrag.vx = Math.max(
        -2,
        Math.min(2, (event.clientX - panDrag.lastX) / dt),
      );
      panDrag.vy = Math.max(
        -2,
        Math.min(2, (event.clientY - panDrag.lastY) / dt),
      );
      panDrag.lastX = event.clientX;
      panDrag.lastY = event.clientY;
      panDrag.time = now;
      if (motion.matches) {
        camera.x = panDrag.targetX;
        camera.y = panDrag.targetY;
        paintCamera();
      } else wake();
    });
    function releasePan(event) {
      if (!panDrag || panDrag.id !== event.pointerId) return;
      const held = panDrag;
      panDrag = null;
      const glide =
        event.type === "pointerup" &&
        !motion.matches &&
        performance.now() - held.time < 100;
      camera.vx = glide ? held.vx : 0;
      camera.vy = glide ? held.vy : 0;
      board.classList.remove("is-panning");
      if (board.hasPointerCapture(event.pointerId))
        board.releasePointerCapture(event.pointerId);
      if (!motion.matches) wake();
    }
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
      board.addEventListener(type, releasePan),
    );
    board.addEventListener("keydown", (event) => {
      if (
        list ||
        event.target !== board ||
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      stopMovement();
      const step = event.shiftKey ? 100 : 40;
      camera.x +=
        event.key === "ArrowLeft"
          ? step
          : event.key === "ArrowRight"
            ? -step
            : 0;
      camera.y +=
        event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0;
      paintCamera();
      announce("Canvas panned. Reset returns to the original arrangement.");
    });
    for (const card of cards) {
      card.querySelectorAll("img").forEach((img) => {
        img.draggable = false;
      });
      card.addEventListener("dragstart", (event) => event.preventDefault());
      card.addEventListener("pointerdown", (event) => {
        if (
          list ||
          event.button !== 0 ||
          drag ||
          panDrag ||
          event.target.closest(
            "button, a, input, textarea, select, label, [contenteditable]",
          )
        )
          return;
        event.preventDefault();
        camera.vx = camera.vy = 0;
        card.focus({ preventScroll: true });
        const position = positions.get(card);
        position.vx = position.vy = 0;
        drag = {
          card,
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          startX: position.x,
          startY: position.y,
          targetX: position.x,
          targetY: position.y,
          lastX: event.clientX,
          lastY: event.clientY,
          time: performance.now(),
          vx: 0,
          vy: 0,
          moved: false,
        };
        card.setPointerCapture(event.pointerId);
        card.style.zIndex = String(++layer);
        card.classList.add("is-dragging");
        if (!motion.matches) wake();
      });
      card.addEventListener("pointermove", (event) => {
        if (!drag || drag.card !== card || drag.id !== event.pointerId) return;
        const scale = fit * zoom;
        const now = performance.now(),
          dt = Math.max(8, now - drag.time),
          b = bounds(card);
        drag.targetX = Math.max(
          b.left,
          Math.min(b.right, drag.startX + (event.clientX - drag.x) / scale),
        );
        drag.targetY = Math.max(
          b.top,
          Math.min(b.bottom, drag.startY + (event.clientY - drag.y) / scale),
        );
        drag.vx = Math.max(
          -1.8,
          Math.min(
            1.8,
            ((event.clientX - drag.lastX) / scale / dt) * 0.7 + drag.vx * 0.3,
          ),
        );
        drag.vy = Math.max(
          -1.8,
          Math.min(
            1.8,
            ((event.clientY - drag.lastY) / scale / dt) * 0.7 + drag.vy * 0.3,
          ),
        );
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        drag.time = now;
        drag.moved ||=
          Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4;
        if (motion.matches) {
          const p = positions.get(card);
          p.x = drag.targetX;
          p.y = drag.targetY;
          paint(card);
        } else wake();
      });
      const release = (event) => {
        if (drag?.card !== card || drag.id !== event.pointerId) return;
        const held = drag,
          p = positions.get(card);
        const throwCard =
          event.type === "pointerup" &&
          held.moved &&
          !motion.matches &&
          performance.now() - held.time < 100;
        p.vx = throwCard ? held.vx : 0;
        p.vy = throwCard ? held.vy : 0;
        if (motion.matches || !held.moved) {
          p.x = held.targetX;
          p.y = held.targetY;
        }
        drag = null;
        card.classList.remove("is-dragging");
        if (card.hasPointerCapture(event.pointerId))
          card.releasePointerCapture(event.pointerId);
        if (!motion.matches) wake();
        else paint(card);
      };
      card.addEventListener("pointerup", release);
      card.addEventListener("pointercancel", release);
      card.addEventListener("lostpointercapture", release);
      card.addEventListener("keydown", (event) => {
        if (
          list ||
          event.target !== card ||
          !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        stopMovement();
        const position = positions.get(card);
        const step = event.shiftKey ? 40 : 12;
        position.x +=
          event.key === "ArrowLeft"
            ? -step
            : event.key === "ArrowRight"
              ? step
              : 0;
        position.y +=
          event.key === "ArrowUp"
            ? -step
            : event.key === "ArrowDown"
              ? step
              : 0;
        clampPosition(card);
        card.style.zIndex = String(++layer);
        paint(card);
      });
    }
    motion.addEventListener("change", () => {
      if (motion.matches) stopMovement();
    });
    window.addEventListener("blur", stopMovement);
    document.addEventListener("playlab:panelchange", (event) => {
      stopMovement();
      if (event.detail.panel === "canvas") requestAnimationFrame(arrange);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopMovement();
    });
    function updateClock() {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(now);
      const hour = Number(parts.find((part) => part.type === "hour").value);
      const minute = Number(parts.find((part) => part.type === "minute").value);
      const time = board.querySelector("[data-playground-time]");
      time.textContent = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
      }).format(now);
      time.dateTime = now.toISOString();
      board.querySelector(".playground-clock-hour").style.transform =
        `rotate(${hour * 30 + minute / 2}deg)`;
      board.querySelector(".playground-clock-minute").style.transform =
        `rotate(${minute * 6}deg)`;
    }
    board.classList.toggle("is-list", list);
    board.tabIndex = list ? -1 : 0;
    view.setAttribute("aria-pressed", String(list));
    view.textContent = list ? "Canvas view" : "List view";
    for (const card of cards) card.tabIndex = list ? -1 : 0;
    board.classList.add("playground-ready");
    view.hidden = false;
    board.querySelector(".playground-palette").hidden = false;
    board.querySelector(".playground-controls").hidden = false;
    new ResizeObserver(arrange).observe(board);
    arrange();
    updateClock();
    const clockTimer = setInterval(() => {
      if (!document.hidden) updateClock();
    }, 60_000);
    window.addEventListener(
      "pagehide",
      () => {
        clearInterval(clockTimer);
        pause();
        stopMovement();
      },
      {
        once: true,
      },
    );
  }
})();

(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const shape = document.querySelector("[data-interaction-shape]");
  document.querySelectorAll("[data-shape-choice]").forEach((button) =>
    button.addEventListener("click", () => {
      shape.dataset.interactionShape = button.dataset.shapeChoice;
      shape.querySelector("span").textContent = {
        flower: "✳",
        circle: "◉",
        square: "▦",
        star: "✦",
      }[button.dataset.shapeChoice];
      document
        .querySelectorAll("[data-shape-choice]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      document.querySelector("[data-shape-status]").textContent =
        `${button.textContent} shape selected.`;
    }),
  );
  const ball = document.querySelector(".interaction-spring-ball");
  const springTrack = ball?.parentElement;
  const springStatus = document.querySelector("[data-spring-status]");
  const springState = { x: 0, velocity: 0, target: 0 };
  let spring = "snappy",
    springFrame = 0,
    springTime = 0,
    springDrag = null,
    suppressSpringClick = false;
  const springSettings = {
    soft: [70, 14],
    snappy: [260, 23],
    bouncy: [150, 7.5],
  };
  function paintSpring() {
    if (!ball) return;
    const speed = motion.matches
      ? 0
      : Math.min(0.17, Math.abs(springState.velocity) / 5000);
    ball.style.transform = `translateX(${springState.x - 38.5}px) scale(${1 + speed}, ${1 - speed * 0.7})`;
    springTrack.style.setProperty("--spring-anchor", `${springState.target}px`);
    springTrack.style.setProperty(
      "--spring-length",
      `${Math.abs(springState.x - springState.target)}px`,
    );
    springTrack.style.setProperty(
      "--spring-left",
      `${Math.min(springState.x, springState.target)}px`,
    );
    ball.dataset.springState = springFrame || springDrag ? "moving" : "settled";
  }
  function stopSpring() {
    cancelAnimationFrame(springFrame);
    springFrame = 0;
    const held = springDrag;
    springDrag = null;
    if (held && ball.hasPointerCapture(held.id))
      ball.releasePointerCapture(held.id);
    springState.velocity = 0;
    ball?.classList.remove("is-held");
    paintSpring();
  }
  function springTick(now) {
    springFrame = 0;
    if (springDrag || document.hidden || springTrack.closest("[hidden]"))
      return;
    const elapsed = Math.min(0.032, Math.max(0.001, (now - springTime) / 1000));
    springTime = now;
    const [stiffness, damping] = springSettings[spring];
    // Small integration steps preserve momentum across rapid retargeting.
    const steps = Math.ceil(elapsed / 0.008),
      dt = elapsed / steps;
    for (let i = 0; i < steps; i++) {
      springState.velocity +=
        (-stiffness * (springState.x - springState.target) -
          damping * springState.velocity) *
        dt;
      springState.x += springState.velocity * dt;
      const edge = springTrack.clientWidth;
      if (springState.x < -28 || springState.x > edge + 28) {
        springState.x = Math.max(-28, Math.min(edge + 28, springState.x));
        springState.velocity *= -0.5;
      }
    }
    if (
      Math.abs(springState.x - springState.target) < 0.08 &&
      Math.abs(springState.velocity) < 0.5
    ) {
      springState.x = springState.target;
      springState.velocity = 0;
    } else springFrame = requestAnimationFrame(springTick);
    paintSpring();
  }
  function wakeSpring() {
    if (motion.matches) {
      stopSpring();
      springState.x = springState.target;
      paintSpring();
    } else if (!springFrame) {
      springTime = performance.now();
      springFrame = requestAnimationFrame(springTick);
    }
  }
  function nudgeSpring() {
    const right = springState.target < springTrack.clientWidth / 2;
    springState.target = right ? springTrack.clientWidth : 0;
    wakeSpring();
    springStatus.textContent = `Moved to the ${right ? "right" : "left"} with ${spring} motion.`;
  }
  document.querySelectorAll("[data-spring-character]").forEach((button) =>
    button.addEventListener("click", () => {
      spring = button.dataset.springCharacter;
      document
        .querySelectorAll("[data-spring-character]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      springStatus.textContent = `${spring} motion selected. Pull the ball or give it a nudge.`;
      if (Math.abs(springState.x - springState.target) > 0.1) wakeSpring();
    }),
  );
  document
    .querySelector("[data-spring-launch]")
    ?.addEventListener("click", nudgeSpring);
  ball?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    stopSpring();
    ball.focus({ preventScroll: true });
    springDrag = {
      id: event.pointerId,
      start: event.clientX,
      x: springState.x,
      last: event.clientX,
      time: performance.now(),
      moved: false,
    };
    suppressSpringClick = false;
    ball.setPointerCapture(event.pointerId);
    ball.classList.add("is-held");
  });
  ball?.addEventListener("pointermove", (event) => {
    if (!springDrag || springDrag.id !== event.pointerId) return;
    const now = performance.now();
    springState.velocity = Math.max(
      -1800,
      Math.min(
        1800,
        ((event.clientX - springDrag.last) /
          Math.max(8, now - springDrag.time)) *
          1000,
      ),
    );
    springState.x = Math.max(
      -28,
      Math.min(
        springTrack.clientWidth + 28,
        springDrag.x + event.clientX - springDrag.start,
      ),
    );
    springDrag.moved ||= Math.abs(event.clientX - springDrag.start) > 4;
    springDrag.last = event.clientX;
    springDrag.time = now;
    paintSpring();
  });
  function releaseSpring(event) {
    if (!springDrag || springDrag.id !== event.pointerId) return;
    const held = springDrag;
    springDrag = null;
    suppressSpringClick = held.moved;
    if (event.type !== "pointerup" || performance.now() - held.time > 100)
      springState.velocity = 0;
    springState.target =
      springState.x + springState.velocity * 0.08 > springTrack.clientWidth / 2
        ? springTrack.clientWidth
        : 0;
    ball.classList.remove("is-held");
    if (ball.hasPointerCapture(held.id)) ball.releasePointerCapture(held.id);
    if (held.moved) {
      springStatus.textContent = `Released with ${spring} motion. Watch it settle.`;
      wakeSpring();
    }
  }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
    ball?.addEventListener(type, releaseSpring),
  );
  ball?.addEventListener("click", () => {
    if (!suppressSpringClick) nudgeSpring();
    suppressSpringClick = false;
  });
  ball?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    springState.target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? springTrack.clientWidth
          : Math.max(
              0,
              Math.min(
                springTrack.clientWidth,
                springState.target + (event.key === "ArrowRight" ? 50 : -50),
              ),
            );
    wakeSpring();
    springStatus.textContent = `${spring} spring moved. Use arrow keys to adjust it.`;
  });
  if (springTrack)
    new ResizeObserver(() => {
      if (!springTrack.clientWidth) return;
      springState.target = Math.min(
        springTrack.clientWidth,
        springState.target,
      );
      if (!springFrame && !springDrag) {
        springState.x = springState.target;
        paintSpring();
      }
    }).observe(springTrack);
  const depth = document.querySelector("[data-depth-card]");
  let flipAnimation;
  depth?.addEventListener("click", () => {
    const back = depth.getAttribute("aria-pressed") !== "true";
    depth.setAttribute("aria-pressed", String(back));
    depth.querySelector(".depth-card-front").hidden = back;
    depth.querySelector(".depth-card-back").hidden = !back;
    flipAnimation?.cancel();
    if (!motion.matches)
      flipAnimation = depth.animate(
        [
          { transform: "rotateY(-70deg) rotate(-7deg) scale(.94)" },
          {
            transform: "rotateY(7deg) rotate(-7deg) scale(1.02)",
            offset: 0.72,
          },
          { transform: "rotateY(0deg) rotate(-7deg) scale(1)" },
        ],
        { duration: 560, easing: "cubic-bezier(.18,.7,.2,1)" },
      );
  });
  const resetTilt = () => {
    depth?.style.setProperty("--tilt-x", "0deg");
    depth?.style.setProperty("--tilt-y", "0deg");
  };
  depth?.addEventListener("pointermove", (event) => {
    if (motion.matches || event.pointerType === "touch") return;
    const r = depth.getBoundingClientRect();
    depth.style.setProperty(
      "--tilt-x",
      `${((event.clientY - r.top - r.height / 2) / r.height) * -28}deg`,
    );
    depth.style.setProperty(
      "--tilt-y",
      `${((event.clientX - r.left - r.width / 2) / r.width) * 28}deg`,
    );
  });
  depth?.addEventListener("pointerleave", resetTilt);
  depth?.addEventListener("blur", resetTilt);
  let joys = 0;
  const particles = [
    ...document.querySelectorAll(".interaction-joy-orbit>span"),
  ];
  const joyButton = document.querySelector("[data-joy-button]");
  const joyStage = joyButton?.closest(".interaction-joy-stage");
  const joyHalo = joyStage?.querySelector(".interaction-joy-halo");
  joyButton?.addEventListener("click", () => {
    joys++;
    joyStage.classList.add("has-celebrated");
    document.querySelector("[data-joy-status]").textContent =
      `${joys} little ${joys === 1 ? "moment" : "moments"} of joy. Keep going.`;
    if (motion.matches) return;
    [joyButton, joyHalo].forEach((element) =>
      element.getAnimations().forEach((a) => a.cancel()),
    );
    joyButton.animate(
      [
        { transform: "scale(.88) rotate(-4deg)" },
        { transform: "scale(1.13) rotate(3deg)", offset: 0.42 },
        { transform: "scale(.98) rotate(-1deg)", offset: 0.72 },
        { transform: "scale(1) rotate(0)" },
      ],
      { duration: 720, easing: "cubic-bezier(.2,.7,.25,1)" },
    );
    joyHalo.animate(
      [
        { transform: "translate(-50%,-50%) scale(.45)", opacity: 0 },
        { opacity: 0.8, offset: 0.16 },
        { transform: "translate(-50%,-50%) scale(2.5)", opacity: 0 },
      ],
      { duration: 1400, easing: "cubic-bezier(.12,.6,.3,1)" },
    );
    particles.forEach((p, i) => {
      p.getAnimations().forEach((a) => a.cancel());
      const angle = (i / particles.length) * Math.PI * 2;
      const distance =
        Math.min(joyStage.clientWidth * 0.46, 220) * (i % 2 ? 0.85 : 1);
      const x = Math.cos(angle) * distance,
        y = Math.sin(angle) * 150;
      p.animate(
        [
          { opacity: 0, transform: "translate(-50%,-50%) scale(.15)" },
          {
            opacity: 1,
            transform: `translate(calc(-50% + ${x * 0.78}px),calc(-50% + ${y * 0.78}px)) rotate(${i * 30}deg) scale(1.2)`,
            offset: 0.32,
          },
          { opacity: 1, offset: 0.66 },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${x}px),calc(-50% + ${y + 38}px)) rotate(${i * 60}deg) scale(.65)`,
          },
        ],
        {
          duration: 1700,
          delay: (i % 3) * 30,
          easing: "cubic-bezier(.12,.66,.35,1)",
          fill: "both",
        },
      );
    });
  });
  const bloom = document.querySelector("[data-bloom]");
  const spread = document.querySelector("[data-bloom-spread]");
  let spinAnimation;
  let turns = 0;
  spread?.addEventListener("input", () => {
    const value = Number(spread.value);
    bloom.style.setProperty("--bloom-spread", `${12 + value * 0.58}px`);
    bloom.style.setProperty("--bloom-twist", `${value * 0.45}deg`);
    document.querySelector("[data-bloom-value]").value = `${value}%`;
  });
  document.querySelector("[data-bloom-spin]")?.addEventListener("click", () => {
    turns++;
    spinAnimation?.cancel();
    document.querySelector("[data-bloom-status]").textContent =
      `${turns} ${turns === 1 ? "spin" : "spins"}. Petals open ${spread.value} percent.`;
    if (motion.matches) return;
    spinAnimation = bloom.animate(
      [
        { transform: "rotate(0) scale(1)" },
        { transform: "rotate(190deg) scale(.87)", offset: 0.48 },
        { transform: "rotate(365deg) scale(1.03)", offset: 0.86 },
        { transform: "rotate(360deg) scale(1)" },
      ],
      { duration: 1400, easing: "cubic-bezier(.2,.75,.25,1)" },
    );
  });
  const bloomStage = bloom?.closest(".interaction-bloom-stage");
  const resetBloom = () => {
    bloom?.style.setProperty("--bloom-x", "0px");
    bloom?.style.setProperty("--bloom-y", "0px");
  };
  bloomStage?.addEventListener("pointermove", (event) => {
    if (motion.matches || event.pointerType === "touch") return;
    const r = bloomStage.getBoundingClientRect();
    bloom.style.setProperty(
      "--bloom-x",
      `${(event.clientX - r.left - r.width / 2) * 0.035}px`,
    );
    bloom.style.setProperty(
      "--bloom-y",
      `${(event.clientY - r.top - r.height / 2) * 0.035}px`,
    );
  });
  bloomStage?.addEventListener("pointerleave", resetBloom);
  const pond = document.querySelector("[data-ripple-pond]");
  const water = document.querySelector("[data-ripple-water]");
  const waterContext = water?.getContext("2d", { alpha: false });
  const rippleStatus = document.querySelector("[data-ripple-status]");
  let ripples = 0,
    waterFrame = 0,
    waterTime = 0,
    waterUntil = 0,
    trailTime = 0;
  let waterWidth = 0,
    waterHeight = 0,
    heights,
    previousHeights,
    waterPixels,
    bedPixels;
  function waterBed() {
    if (!waterWidth) return;
    const theme = pond.closest(".interaction-ripple-stage").dataset.rippleTheme;
    const palette = {
      sky: [92, 163, 181],
      mint: [116, 162, 131],
      rose: [183, 129, 151],
    }[theme];
    bedPixels = new Uint8ClampedArray(waterWidth * waterHeight * 3);
    for (let y = 0; y < waterHeight; y++)
      for (let x = 0; x < waterWidth; x++) {
        // A shallow textured bed gives moving surface normals something to refract.
        const depth = Math.hypot(
          (x / waterWidth - 0.33) * 0.9,
          (y / waterHeight - 0.23) * 0.75,
        );
        const caustic =
          Math.sin(x * 0.105 + Math.sin(y * 0.074) * 2.2) *
          Math.sin(y * 0.091 + Math.cos(x * 0.07) * 2.4);
        const light = 37 - depth * 46 + Math.pow(Math.max(0, caustic), 5) * 48;
        const grain = Math.sin(x * 23.7 + y * 11.3) * 1.8;
        const index = (y * waterWidth + x) * 3;
        for (let c = 0; c < 3; c++)
          bedPixels[index + c] = palette[c] + light + grain;
      }
  }
  function paintWater() {
    if (!waterContext || !waterWidth) return;
    const pixels = waterPixels.data;
    for (let y = 0; y < waterHeight; y++)
      for (let x = 0; x < waterWidth; x++) {
        const i = y * waterWidth + x;
        const dx = (heights[i - 1] || 0) - (heights[i + 1] || 0);
        const dy =
          (heights[i - waterWidth] || 0) - (heights[i + waterWidth] || 0);
        const rx = Math.max(
          0,
          Math.min(waterWidth - 1, Math.round(x + dx * 1.7)),
        );
        const ry = Math.max(
          0,
          Math.min(waterHeight - 1, Math.round(y + dy * 1.7)),
        );
        const sample = (ry * waterWidth + rx) * 3;
        const slope = Math.max(-30, Math.min(40, dx * -4 + dy * -6));
        const reflection = Math.min(
          100,
          Math.max(0, dx * -0.5 + dy * -0.8) ** 2 * 9,
        );
        for (let c = 0; c < 3; c++)
          pixels[i * 4 + c] = bedPixels[sample + c] + slope + reflection;
        pixels[i * 4 + 3] = 255;
      }
    waterContext.putImageData(waterPixels, 0, 0);
  }
  function sizeWater() {
    if (!waterContext || !pond.clientWidth) return;
    const width = Math.min(240, Math.round(pond.clientWidth)),
      height = Math.round((width * pond.clientHeight) / pond.clientWidth);
    if (width === waterWidth && height === waterHeight) return;
    waterWidth = water.width = width;
    waterHeight = water.height = height;
    heights = new Float32Array(width * height);
    previousHeights = new Float32Array(width * height);
    waterPixels = waterContext.createImageData(width, height);
    waterBed();
    paintWater();
    pond.dataset.waterState = "resting";
  }
  function stepWater() {
    let energy = 0;
    // Discrete wave equation: neighbouring heights propagate a disturbance;
    // previous heights preserve momentum, with damping so the water settles.
    for (let y = 1; y < waterHeight - 1; y++)
      for (let x = 1; x < waterWidth - 1; x++) {
        const i = y * waterWidth + x;
        const next =
          ((heights[i - 1] +
            heights[i + 1] +
            heights[i - waterWidth] +
            heights[i + waterWidth]) *
            0.5 -
            previousHeights[i]) *
          0.982;
        previousHeights[i] = next;
        energy = Math.max(energy, Math.abs(next));
      }
    [heights, previousHeights] = [previousHeights, heights];
    return energy;
  }
  function stopWater(reset = false) {
    cancelAnimationFrame(waterFrame);
    waterFrame = 0;
    if (reset && heights) {
      heights.fill(0);
      previousHeights.fill(0);
      paintWater();
    }
    if (pond) pond.dataset.waterState = motion.matches ? "still" : "resting";
  }
  function waterTick(now) {
    waterFrame = 0;
    if (document.hidden || pond.closest("[hidden]")) return;
    const steps = Math.max(
      1,
      Math.min(3, Math.round((now - waterTime) / 16.67)),
    );
    waterTime = now;
    let energy = 0;
    for (let i = 0; i < steps; i++) energy = stepWater();
    paintWater();
    if (energy > 0.025 && now < waterUntil && !motion.matches)
      waterFrame = requestAnimationFrame(waterTick);
    else stopWater(true);
  }
  function disturbWater(clientX, clientY, announce = true) {
    sizeWater();
    if (!waterWidth) return;
    const rect = pond.getBoundingClientRect();
    const cx =
      clientX == null
        ? waterWidth / 2
        : ((clientX - rect.left) / rect.width) * waterWidth;
    const cy =
      clientY == null
        ? waterHeight / 2
        : ((clientY - rect.top) / rect.height) * waterHeight;
    if (motion.matches) {
      heights.fill(0);
      previousHeights.fill(0);
    }
    const radius = announce ? 8 : 5;
    for (
      let y = Math.max(1, Math.floor(cy - radius));
      y < Math.min(waterHeight - 1, cy + radius);
      y++
    )
      for (
        let x = Math.max(1, Math.floor(cx - radius));
        x < Math.min(waterWidth - 1, cx + radius);
        x++
      ) {
        const distance = Math.hypot(x - cx, y - cy) / radius;
        if (distance < 1)
          heights[y * waterWidth + x] +=
            Math.cos((distance * Math.PI) / 2) * (announce ? 24 : 10);
      }
    water.dataset.rippleOrigin = `${Math.round(cx)},${Math.round(cy)}`;
    if (announce) {
      ripples++;
      pond.dataset.rippleCount = String(ripples);
      rippleStatus.textContent = `${ripples} ${ripples === 1 ? "ripple" : "ripples"} made. Watch the light follow the water.`;
    }
    if (motion.matches) {
      for (let i = 0; i < 22; i++) stepWater();
      paintWater();
      pond.dataset.waterState = "still";
    } else {
      waterUntil = performance.now() + 7000;
      pond.dataset.waterState = "moving";
      if (!waterFrame) {
        waterTime = performance.now();
        waterFrame = requestAnimationFrame(waterTick);
      }
    }
  }
  pond?.addEventListener("pointerdown", (event) => {
    if (event.button === 0) disturbWater(event.clientX, event.clientY);
  });
  pond?.addEventListener("pointermove", (event) => {
    if (
      event.buttons === 1 &&
      !motion.matches &&
      performance.now() - trailTime > 65
    ) {
      trailTime = performance.now();
      disturbWater(event.clientX, event.clientY, false);
    }
  });
  pond?.addEventListener("click", (event) => {
    if (!event.detail) disturbWater();
  });
  if (pond) new ResizeObserver(sizeWater).observe(pond);
  document.querySelectorAll("[data-ripple-colour]").forEach((button) => {
    button.addEventListener("click", () => {
      pond.closest(".interaction-ripple-stage").dataset.rippleTheme =
        button.dataset.rippleColour;
      document
        .querySelectorAll("[data-ripple-colour]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      rippleStatus.textContent = `${button.textContent} water selected. Make a ripple.`;
      waterBed();
      paintWater();
    });
  });
  motion.addEventListener("change", () => {
    if (motion.matches) {
      stopSpring();
      springState.x = springState.target;
      paintSpring();
      spinAnimation?.cancel();
      flipAnimation?.cancel();
      stopWater();
      [joyButton, joyHalo].forEach((element) =>
        element?.getAnimations().forEach((a) => a.cancel()),
      );
      resetTilt();
      resetBloom();
      particles.forEach((p) => p.getAnimations().forEach((a) => a.cancel()));
    }
  });
  function pauseExperiments() {
    stopSpring();
    stopWater();
  }
  document.addEventListener("playlab:panelchange", (event) => {
    if (event.detail.panel !== "interactions") pauseExperiments();
    else requestAnimationFrame(sizeWater);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseExperiments();
  });
  window.addEventListener("pagehide", pauseExperiments);
})();
