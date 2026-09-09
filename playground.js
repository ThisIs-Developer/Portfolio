(() => {
  const board = document.querySelector("[data-playground-board]");
  if (board) {
    const world = board.querySelector(".playground-world");
    const cards = [...board.querySelectorAll("[data-playground-card]")];
    const view = document.querySelector("[data-playground-view]");
    const label = board.querySelector("[data-playground-zoom-label]");
    const status = document.querySelector("[data-playground-status]");
    const positions = new Map(cards.map((card) => [card, { x: 0, y: 0 }]));
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
      card.style.transform = `translate(${position.x}px, ${position.y}px) rotate(var(--card-angle))`;
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
      card.addEventListener("pointerdown", (event) => {
        if (
          list ||
          event.button !== 0 ||
          !event.target.closest(".widget-heading")
        )
          return;
        const position = positions.get(card);
        drag = {
          card,
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          startX: position.x,
          startY: position.y,
        };
        card.setPointerCapture(event.pointerId);
        card.style.zIndex = String(++layer);
        card.classList.add("is-dragging");
      });
      card.addEventListener("pointermove", (event) => {
        if (!drag || drag.card !== card || drag.id !== event.pointerId) return;
        const position = positions.get(card);
        const scale = fit * zoom;
        position.x = Math.max(
          -card.offsetLeft,
          Math.min(
            world.offsetWidth - card.offsetLeft - card.offsetWidth,
            drag.startX + (event.clientX - drag.x) / scale,
          ),
        );
        position.y = Math.max(
          -card.offsetTop,
          Math.min(
            world.offsetHeight - card.offsetTop - card.offsetHeight,
            drag.startY + (event.clientY - drag.y) / scale,
          ),
        );
        paint(card);
      });
      const release = () => {
        if (drag?.card === card) {
          card.classList.remove("is-dragging");
          drag = null;
        }
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
        position.x = Math.max(
          -card.offsetLeft,
          Math.min(
            world.offsetWidth - card.offsetLeft - card.offsetWidth,
            position.x,
          ),
        );
        position.y = Math.max(
          -card.offsetTop,
          Math.min(
            world.offsetHeight - card.offsetTop - card.offsetHeight,
            position.y,
          ),
        );
        card.style.zIndex = String(++layer);
        paint(card);
      });
    }
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
    window.addEventListener("pagehide", () => clearInterval(clockTimer), {
      once: true,
    });
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
  depth?.addEventListener("click", () => {
    const back = depth.getAttribute("aria-pressed") !== "true";
    depth.setAttribute("aria-pressed", String(back));
    depth.querySelector(".depth-card-front").hidden = back;
    depth.querySelector(".depth-card-back").hidden = !back;
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
      `${((event.clientY - r.top - r.height / 2) / r.height) * -18}deg`,
    );
    depth.style.setProperty(
      "--tilt-y",
      `${((event.clientX - r.left - r.width / 2) / r.width) * 18}deg`,
    );
  });
  depth?.addEventListener("pointerleave", resetTilt);
  depth?.addEventListener("blur", resetTilt);
  let joys = 0;
  const particles = [
    ...document.querySelectorAll(".interaction-joy-orbit>span"),
  ];
  document.querySelector("[data-joy-button]")?.addEventListener("click", () => {
    joys++;
    document.querySelector("[data-joy-status]").textContent =
      `${joys} little ${joys === 1 ? "moment" : "moments"} of joy. Keep going.`;
    if (motion.matches) return;
    particles.forEach((p, i) => {
      p.getAnimations().forEach((a) => a.cancel());
      const angle = (i / particles.length) * Math.PI * 2;
      p.animate(
        [
          { opacity: 0, transform: "translate(-50%,-50%) scale(.3)" },
          { opacity: 1, offset: 0.18 },
          {
            opacity: 0,
            transform: `translate(${Math.cos(angle) * 150}px,${Math.sin(angle) * 105}px) rotate(${i * 60}deg) scale(1)`,
          },
        ],
        { duration: 800, easing: "cubic-bezier(.12,.66,.35,1)" },
      );
    });
  });
  const tabs = [...document.querySelectorAll("[data-flow-tab]")];
  const flowContent = {
    idea: [
      "Start with a what if.",
      "A question. A scribble. A possibility worth exploring.",
      "01 / THE SPARK",
    ],
    build: [
      "Make the idea tangible.",
      "A small prototype turns a possibility into something you can try.",
      "02 / THE MAKING",
    ],
    ship: [
      "Share it with the world.",
      "Put it in someone’s hands. Listen, learn, and make it better.",
      "03 / THE HELLO",
    ],
  };
  function select(tab) {
    tabs.forEach((t) => {
      t.setAttribute("aria-selected", String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    const key = tab.dataset.flowTab;
    document.querySelector("[data-flow]").dataset.flow = key;
    document
      .querySelector("#flow-panel")
      .setAttribute("aria-labelledby", tab.id);
    const [title, description, step] = flowContent[key];
    document.querySelector("[data-flow-title]").textContent = title;
    document.querySelector("[data-flow-description]").textContent = description;
    document.querySelector("[data-flow-step]").textContent = step;
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      let index;
      if (event.key === "ArrowRight") index = (i + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        index = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") index = 0;
      else if (event.key === "End") index = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[index]);
      tabs[index].focus();
    });
  });
  motion.addEventListener("change", () => {
    if (motion.matches) {
      animation?.cancel();
      resetTilt();
      particles.forEach((p) => p.getAnimations().forEach((a) => a.cancel()));
    }
  });
})();
