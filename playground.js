(() => {
  const sectionLinks = [...document.querySelectorAll(".play-lab-switch a")];
  const setSection = (hash) =>
    sectionLinks.forEach((link) => {
      if (link.hash === hash) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  setSection(location.hash === "#interactions" ? "#interactions" : "#canvas");
  sectionLinks.forEach((link) =>
    link.addEventListener("click", () => setSection(link.hash)),
  );
  window.addEventListener("hashchange", () =>
    setSection(location.hash === "#interactions" ? "#interactions" : "#canvas"),
  );
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
    let list = matchMedia("(max-width: 767px)").matches;
    let drag = null;
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
      if (list) return;
      fit = Math.min(
        (board.clientWidth - 12) / world.offsetWidth,
        (board.clientHeight - 88) / world.offsetHeight,
        1,
      );
      const scale = fit * zoom;
      const x = (board.clientWidth - world.offsetWidth * scale) / 2;
      const y = (board.clientHeight - 60 - world.offsetHeight * scale) / 2;
      world.style.transform = `translate(${x}px, ${Math.max(18, y)}px) scale(${scale})`;
      label.value = `${Math.round(zoom * 100)}%`;
    }
    function paint(card) {
      const position = positions.get(card);
      card.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) rotate(calc(var(--card-angle) + ${position.tilt}deg)) scale(${1 + position.lift * 0.035})`;
    }
    function bounds(card) {
      // Leave room around the rotated corners so a thrown card stays recoverable.
      return {
        left: 18 - card.offsetLeft,
        right: world.offsetWidth - card.offsetLeft - card.offsetWidth - 18,
        top: 18 - card.offsetTop,
        bottom: world.offsetHeight - card.offsetTop - card.offsetHeight - 18,
      };
    }
    function clampPosition(card) {
      const p = positions.get(card),
        b = bounds(card);
      p.x = Math.max(b.left, Math.min(b.right, p.x));
      p.y = Math.max(b.top, Math.min(b.bottom, p.y));
    }
    function wake() {
      if (!frame && !list) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(animateCards);
      }
    }
    function animateCards(now) {
      frame = 0;
      const dt = Math.min(32, Math.max(1, now - lastFrame));
      lastFrame = now;
      let moving = false;
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
        zoom = Math.min(
          1.65,
          Math.max(
            0.65,
            zoom + (button.dataset.playgroundZoom === "in" ? 0.15 : -0.15),
          ),
        );
        arrange();
        announce(`Canvas zoom ${Math.round(zoom * 100)} percent.`);
      }),
    );
    board
      .querySelector("[data-playground-reset]")
      .addEventListener("click", () => {
        stopMovement();
        zoom = 1;
        for (const [card, position] of positions) {
          position.x = 0;
          position.y = 0;
          card.style.zIndex = "";
          paint(card);
        }
        arrange();
        announce("Cards and zoom reset.");
      });
    view.addEventListener("click", () => {
      stopMovement();
      list = !list;
      board.classList.toggle("is-list", list);
      view.setAttribute("aria-pressed", String(list));
      view.textContent = list ? "Canvas view" : "List view";
      for (const card of cards) card.tabIndex = list ? -1 : 0;
      arrange();
      announce(
        list
          ? "Cards are shown in reading order."
          : "Interactive canvas restored.",
      );
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
          event.target.closest(
            "button, a, input, textarea, select, label, [contenteditable]",
          )
        )
          return;
        event.preventDefault();
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
  let spring = "snappy",
    right = false,
    animation;
  document.querySelectorAll("[data-spring-character]").forEach((button) =>
    button.addEventListener("click", () => {
      spring = button.dataset.springCharacter;
      document
        .querySelectorAll("[data-spring-character]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      document.querySelector("[data-spring-status]").textContent =
        `${spring} motion selected.`;
    }),
  );
  document
    .querySelector("[data-spring-launch]")
    ?.addEventListener("click", () => {
      const from = getComputedStyle(ball).transform;
      animation?.cancel();
      right = !right;
      const target = right ? ball.parentElement.clientWidth - 43 : -34;
      ball.style.transform = `translateX(${target}px)`;
      if (!motion.matches) {
        const bounce = spring === "bouncy" ? 28 : spring === "soft" ? 5 : 12;
        animation = ball.animate(
          [
            { transform: from },
            {
              transform: `translateX(${target + (right ? bounce : -bounce)}px) scaleX(.92)`,
              offset: 0.65,
            },
            {
              transform: `translateX(${target - (right ? bounce / 3 : -bounce / 3)}px)`,
              offset: 0.83,
            },
            { transform: `translateX(${target}px)` },
          ],
          {
            duration: { soft: 1000, snappy: 500, bouncy: 1100 }[spring],
            easing: "cubic-bezier(.2,.7,.3,1)",
          },
        );
      }
      document.querySelector("[data-spring-status]").textContent =
        `Moved to the ${right ? "right" : "left"} with ${spring} motion.`;
    });
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
  const rings = document.querySelector("[data-ripple-rings]");
  const rippleStatus = document.querySelector("[data-ripple-status]");
  let ripples = 0;
  let pondAnimation;
  pond?.addEventListener("click", (event) => {
    const r = pond.getBoundingClientRect();
    const x = event.detail
      ? Math.max(0, Math.min(r.width, event.clientX - r.left))
      : r.width / 2;
    const y = event.detail
      ? Math.max(0, Math.min(r.height, event.clientY - r.top))
      : r.height / 2;
    pond.classList.add("has-rippled");
    pondAnimation?.cancel();
    if (!motion.matches)
      pondAnimation = pond.animate(
        [
          { transform: "scale(.94)" },
          { transform: "scale(1.035)", offset: 0.38 },
          { transform: "scale(.99)", offset: 0.68 },
          { transform: "scale(1)" },
        ],
        { duration: 800, easing: "cubic-bezier(.2,.7,.3,1)" },
      );
    // Keep rapid taps bounded, and retain a still ripple when motion is reduced.
    if (motion.matches) rings.replaceChildren();
    while (rings.childElementCount >= 9) rings.firstElementChild.remove();
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement("i");
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      rings.append(ring);
      if (motion.matches) {
        ring.style.transform = `translate(-50%, -50%) scale(${0.28 + i * 0.22})`;
        ring.style.opacity = String(0.95 - i * 0.15);
      } else {
        ring
          .animate(
            [
              { transform: "translate(-50%, -50%) scale(.04)", opacity: 1 },
              { opacity: 0.95, offset: 0.4 },
              { opacity: 0.65, offset: 0.75 },
              { transform: "translate(-50%, -50%) scale(1.65)", opacity: 0 },
            ],
            {
              duration: 2200,
              delay: i * 190,
              fill: "both",
              easing: "cubic-bezier(.15,.55,.3,1)",
            },
          )
          .finished.then(() => ring.remove())
          .catch(() => ring.remove());
      }
    }
    ripples++;
    rippleStatus.textContent = `${ripples} ${ripples === 1 ? "ripple" : "ripples"} made. A little calm, on demand.`;
  });
  document.querySelectorAll("[data-ripple-colour]").forEach((button) => {
    button.addEventListener("click", () => {
      pond.closest(".interaction-ripple-stage").dataset.rippleTheme =
        button.dataset.rippleColour;
      document
        .querySelectorAll("[data-ripple-colour]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      rippleStatus.textContent = `${button.textContent} water selected. Make a ripple.`;
    });
  });
  motion.addEventListener("change", () => {
    if (motion.matches) {
      animation?.cancel();
      spinAnimation?.cancel();
      flipAnimation?.cancel();
      pondAnimation?.cancel();
      [joyButton, joyHalo].forEach((element) =>
        element?.getAnimations().forEach((a) => a.cancel()),
      );
      resetTilt();
      resetBloom();
      particles.forEach((p) => p.getAnimations().forEach((a) => a.cancel()));
      rings
        ?.querySelectorAll("i")
        .forEach((ring) => ring.getAnimations().forEach((a) => a.cancel()));
    }
  });
})();
