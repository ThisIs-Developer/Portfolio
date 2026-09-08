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
    let list = false;
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
          event.target.closest("a, button, input, label")
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

  const folder = document.querySelector(".playground-demo-folder");
  folder?.addEventListener("click", () => {
    const open = folder.getAttribute("aria-expanded") !== "true";
    folder.setAttribute("aria-expanded", String(open));
    folder.querySelector(".playground-folder-front small").textContent = open
      ? "CLICK TO CLOSE"
      : "CLICK TO OPEN";
    document.querySelector("#playground-folder-note").hidden = !open;
  });
  const dot = document.querySelector(".playground-dot-demo");
  if (dot) {
    let point = 0;
    const points = [
      [24, 29],
      [74, 40],
      [48, 74],
    ];
    dot.querySelector("[data-playground-dot]").addEventListener("click", () => {
      const [x, y] = points[point++ % points.length];
      dot.style.setProperty("--spot-x", `${x}%`);
      dot.style.setProperty("--spot-y", `${y}%`);
    });
    dot.addEventListener(
      "pointermove",
      (event) => {
        if (
          event.pointerType === "touch" ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const bounds = dot.getBoundingClientRect();
        dot.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
        dot.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
      },
      { passive: true },
    );
  }
  const theme = document.querySelector(".playground-theme-button");
  theme?.addEventListener("click", () => {
    const dark = theme.getAttribute("aria-pressed") !== "true";
    theme.setAttribute("aria-pressed", String(dark));
    theme.closest(".playground-theme-demo").classList.toggle("is-dark", dark);
    theme.querySelector("span").textContent = dark ? "☾" : "☀";
    document.querySelector("[data-playground-theme-caption]").textContent = dark
      ? "After hours."
      : "A brighter idea.";
  });
  const type = document.querySelector("#playground-type-size");
  type?.addEventListener("input", () => {
    document.querySelector(".playground-type-sample").style.fontSize =
      `${type.value}px`;
    document.querySelector("[data-playground-type-output]").value =
      `${type.value} px`;
  });
})();
