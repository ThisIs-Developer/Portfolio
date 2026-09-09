const nav = document.querySelector("#site-nav");
const menu = document.querySelector(".menu-toggle");
const backdrop = document.querySelector(".nav-backdrop");
const smallScreen = matchMedia("(max-width: 767px)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function setMenu(open, restoreFocus = false) {
  nav.dataset.open = String(open);
  nav.inert = !open && smallScreen.matches;
  menu.setAttribute("aria-expanded", String(open));
  menu.querySelector("[data-menu-label]").textContent = open ? "Close" : "Menu";
  backdrop.hidden = !open || !smallScreen.matches;
  if (restoreFocus) menu.focus();
}
if (nav && menu) {
  document.documentElement.classList.add("nav-ready");
  menu.hidden = false;
  setMenu(false);
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
  smallScreen.addEventListener("change", () => setMenu(!smallScreen.matches));
  let previousScroll = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (
        !smallScreen.matches &&
        Math.abs(window.scrollY - previousScroll) > 150
      ) {
        if (!nav.contains(document.activeElement)) setMenu(false);
        previousScroll = window.scrollY;
      }
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
  let saved;
  try {
    saved = localStorage.getItem("portfolio-theme");
  } catch {
    /* The default theme works without storage. */
  }
  applyTheme(saved === "dark");
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
          if (!reducedMotion.matches)
            entry.target.animate(
              [
                { transform: "translateY(18px)" },
                { transform: "translateY(0)" },
              ],
              { duration: 650, easing: "cubic-bezier(.23,1,.32,1)" },
            );
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
