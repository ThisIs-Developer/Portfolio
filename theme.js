// This small, parser-blocking script runs before stylesheets or page content.
(() => {
  let dark = false;
  try {
    dark = localStorage.getItem("portfolio-theme") === "dark";
  } catch {
    // Keep the default light theme when storage is unavailable.
  }
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#18191c" : "#f5f4f0");
})();
