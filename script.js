const nav = document.querySelector("#site-nav");
const menu = document.querySelector(".menu-toggle");
const backdrop = document.querySelector(".nav-backdrop");
const smallScreen = matchMedia("(max-width: 767px)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let navMotion, shellMotion;
function setMenu(open, restoreFocus = false) {
  if (nav.dataset.open === String(open)) {
    nav.inert = !open && smallScreen.matches;
    backdrop.hidden = !open || !smallScreen.matches;
    if (restoreFocus) menu.focus();
    return;
  }
  const changed = nav.dataset.open !== undefined;
  const shell = document.querySelector(".nav-shell");
  const previousWidth =
    changed && !smallScreen.matches && !reducedMotion.matches
      ? shell.getBoundingClientRect().width
      : 0;
  navMotion?.cancel();
  shellMotion?.cancel();
  delete nav.dataset.closing;
  nav.dataset.open = String(open);
  nav.inert = !open && smallScreen.matches;
  menu.setAttribute("aria-expanded", String(open));
  menu.querySelector("[data-menu-label]").textContent = open ? "Close" : "Menu";
  backdrop.hidden = !open || !smallScreen.matches;
  if (
    changed &&
    !reducedMotion.matches &&
    document.documentElement.classList.contains("nav-ready")
  ) {
    const nextWidth = smallScreen.matches
      ? 0
      : shell.getBoundingClientRect().width;
    if (!open) nav.dataset.closing = "true";
    navMotion = nav.animate(
      open
        ? [
            { opacity: 0, transform: "translateY(-7px) scale(.97)" },
            {
              opacity: 1,
              transform: "translateY(2px) scale(1.008)",
              offset: 0.72,
            },
            { opacity: 1, transform: "none" },
          ]
        : [
            { opacity: 1, transform: "none" },
            { opacity: 1, transform: "translateY(1px) scale(1.004)", offset: 0.18 },
            { opacity: 0, transform: "translateY(-5px) scale(.97)" },
          ],
      { duration: open ? 580 : 460, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    navMotion.onfinish = () => {
      delete nav.dataset.closing;
    };
    if (!smallScreen.matches && Math.abs(previousWidth - nextWidth) > 1) {
      shellMotion = shell.animate(
        [
          { width: previousWidth + "px" },
          { width: nextWidth + (open ? 4 : -3) + "px", offset: 0.76 },
          { width: nextWidth + "px" },
        ],
        { duration: open ? 600 : 500, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
  }
  if (restoreFocus) menu.focus();
}
if (nav && menu) {
  document.documentElement.classList.add("nav-ready");
  menu.hidden = false;
  const atTop = () => window.scrollY <= 1;
  const syncNavigation = () => setMenu(!smallScreen.matches && atTop());
  syncNavigation();
  menu.addEventListener("click", () =>
    setMenu(menu.getAttribute("aria-expanded") !== "true"),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true")
      setMenu(false, true);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-shell")) setMenu(false);
  });
  nav.querySelectorAll("a").forEach((anchor) =>
    anchor.addEventListener("click", () => {
      const url = new URL(anchor.href);
      const destination =
        url.pathname === location.pathname && url.hash
          ? document.getElementById(url.hash.slice(1))
          : null;
      setMenu(false);
      if (destination) {
        if (destination.matches("details")) destination.open = true;
        destination.setAttribute("tabindex", "-1");
        destination.focus({ preventScroll: true });
      }
    }),
  );
  smallScreen.addEventListener("change", syncNavigation);
  window.addEventListener("pageshow", syncNavigation);
  let previousScroll = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const currentScroll = Math.max(0, window.scrollY);
      if (!smallScreen.matches) {
        if (atTop()) setMenu(true);
        else if (currentScroll > previousScroll)
          setMenu(false, nav.contains(document.activeElement));
      }
      previousScroll = currentScroll;
    },
    { passive: true },
  );
}

const themeToggle = document.querySelector(".theme-toggle");
if (themeToggle) {
  const placeTheme = () =>
    (smallScreen.matches ? nav : document.querySelector(".nav-shell")).append(
      themeToggle,
    );
  placeTheme();
  smallScreen.addEventListener("change", placeTheme);
  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(dark));
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#18191c" : "#f5f4f0");
  }
  // Adopt the theme already applied by the head script before first paint.
  applyTheme(document.documentElement.dataset.theme === "dark");
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    try {
      applyTheme(localStorage.getItem("portfolio-theme") === "dark");
    } catch {
      /* Keep this page's theme when storage is unavailable. */
    }
  });
  themeToggle.hidden = false;
  themeToggle.addEventListener("click", () => {
    const dark = themeToggle.getAttribute("aria-pressed") !== "true";
    applyTheme(dark);
    try {
      localStorage.setItem("portfolio-theme", dark ? "dark" : "light");
    } catch {
      /* Theme still works for this visit. */
    }
  });
}

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          nav?.querySelectorAll("[data-section]").forEach((anchor) => {
            if (anchor.dataset.section === entry.target.id)
              anchor.setAttribute("aria-current", "location");
            else anchor.removeAttribute("aria-current");
          });
        }
    },
    { rootMargin: "-15% 0px -65% 0px" },
  );
  document
    .querySelectorAll("section[id]")
    .forEach((section) => sectionObserver.observe(section));
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          if (!reducedMotion.matches) {
            entry.target.dispatchEvent(
              new CustomEvent("portfolio:motion", {
                bubbles: true,
                detail: { duration: 650 },
              }),
            );
            entry.target.animate(
              [
                { transform: "translateY(18px)" },
                { transform: "translateY(0)" },
              ],
              { duration: 650, easing: "cubic-bezier(.23,1,.32,1)" },
            );
          }
          reveal.unobserve(entry.target);
        }
    },
    { threshold: 0.12 },
  );
  document
    .querySelectorAll(".section-heading,.writing-card")
    .forEach((element) => reveal.observe(element));
}

document.querySelectorAll('a[href="#experience"]').forEach((anchor) =>
  anchor.addEventListener("click", () => {
    const experience = document.querySelector("#experience");
    if (experience) experience.open = true;
  }),
);
if (location.hash === "#experience")
  document.querySelector("#experience")?.setAttribute("open", "");

// A visible capability always has a finite turn; selecting a different row
// resets that turn. Offscreen sections do not keep running background timers.
const capabilityGroup = document.querySelector("[data-capabilities]");
if (capabilityGroup) {
  const items = [...capabilityGroup.querySelectorAll(".capability")];
  const duration = 4000;
  let active = 0,
    started = 0,
    frame = 0,
    visible = false;
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  function select(index) {
    active = index;
    items.forEach((item, i) => {
      item.open = i === index;
      item.querySelector(".capability-progress").style.strokeDashoffset = "100";
    });
    started = performance.now();
    capabilityGroup.dataset.activeCapability = String(index + 1);
    stop();
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    const fraction = Math.min(1, (time - started) / duration);
    const progress = reducedMotion.matches
      ? Math.floor(fraction * 4) / 4
      : fraction;
    items[active].querySelector(".capability-progress").style.strokeDashoffset =
      String(100 - progress * 100);
    if (fraction >= 1) select((active + 1) % items.length);
    else frame = requestAnimationFrame(tick);
  }
  items.forEach((item, index) => {
    item.open = false;
    item.querySelector("summary").addEventListener("click", (event) => {
      event.preventDefault();
      select(index);
    });
  });
  new IntersectionObserver(
    (entries) => {
      const nextVisible = entries[0].isIntersecting;
      if (visible === nextVisible) return;
      visible = nextVisible;
      if (visible) select(0);
      else {
        stop();
        items.forEach((item) => (item.open = false));
      }
    },
    { threshold: 0, rootMargin: "-60px 0px -40px" },
  ).observe(capabilityGroup);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      items.forEach((item) => (item.open = false));
    } else if (visible) select(active);
  });
}

const wallet = document.querySelector(".wallet");
if (wallet) {
  const cards = [...wallet.querySelectorAll(".wallet-card")];
  const switcher = wallet.querySelector(".wallet-switcher");
  const choices = [...switcher.querySelectorAll("button")];
  let selected = "wallet-me";
  function showWalletCard(id = selected) {
    selected = id;
    cards.forEach((card) => {
      card.hidden = smallScreen.matches && card.id !== selected;
    });
    choices.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.getAttribute("aria-controls") === selected));
    });
    switcher.hidden = !smallScreen.matches;
  }
  choices.forEach((button) => {
    button.addEventListener("click", () => showWalletCard(button.getAttribute("aria-controls")));
  });
  smallScreen.addEventListener("change", () => {
    const focusedCard = cards.find((card) => card.contains(document.activeElement));
    const focusedChoice = switcher.contains(document.activeElement);
    showWalletCard(focusedCard?.id || selected);
    if (!smallScreen.matches && focusedChoice) document.getElementById(selected).focus();
  });
  wallet.dataset.walletReady = "";
  showWalletCard();
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (smallScreen.matches || reducedMotion.matches || event.pointerType === "touch") return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty(
        "--wallet-lean",
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 7 + "deg",
      );
    });
    card.addEventListener("pointerleave", () =>
      card.style.removeProperty("--wallet-lean"),
    );
    card.addEventListener("dragstart", (event) => event.preventDefault());
  });
}

const copyEmail = document.querySelector(".copy-email");
if (copyEmail && navigator.clipboard?.writeText) {
  copyEmail.hidden = false;
  copyEmail.addEventListener("click", async () => {
    const status = document.querySelector("[data-copy-status]");
    try {
      await navigator.clipboard.writeText(
        document.querySelector(".email-link").textContent.trim(),
      );
      status.textContent = "Email copied";
    } catch {
      status.textContent = "Select the email address to copy it.";
    }
  });
}

const filters = document.querySelector(".archive-filters");
if (filters) {
  filters.hidden = false;
  filters.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filters
        .querySelectorAll("[data-filter]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      let visible = 0;
      document.querySelectorAll("[data-project-group]").forEach((item) => {
        item.hidden = filter !== "all" && item.dataset.projectGroup !== filter;
        if (!item.hidden) visible++;
      });
      document.querySelector("[data-filter-status]").textContent =
        `${visible} projects`;
    }),
  );
}
reducedMotion.addEventListener("change", (event) => {
  if (event.matches)
    document.getAnimations().forEach((animation) => animation.cancel());
});
