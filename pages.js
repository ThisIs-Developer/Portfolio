document.querySelectorAll("[data-collection]").forEach((collection) => {
  const toolbar = collection.querySelector(".collection-toolbar");
  if (!toolbar) return;
  toolbar.hidden = false;
  const grid = collection.querySelector("[data-collection-grid]");
  const items = [...grid.querySelectorAll("[data-collection-item]")];
  const search = collection.querySelector("[data-search]");
  const sort = collection.querySelector("[data-sort]");
  const categories = [
    ...collection.querySelectorAll("[data-category][aria-pressed]"),
  ];
  let selected = "All",
    newest = true;
  const mobileLabel = document.createElement("label");
  mobileLabel.className = "collection-mobile-filter";
  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = categories[0].parentElement.getAttribute("aria-label");
  const select = document.createElement("select");
  categories.forEach((button) => {
    const option = document.createElement("option");
    option.value = button.dataset.category;
    option.textContent = button.textContent;
    select.append(option);
  });
  mobileLabel.append(label, select);
  collection.append(mobileLabel);
  function apply() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    const sorted = items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const order =
          Date.parse(b.item.dataset.date) - Date.parse(a.item.dataset.date);
        return (newest ? order : -order) || a.index - b.index;
      });
    for (const { item } of sorted) {
      item.hidden =
        !(selected === "All" || item.dataset.category === selected) ||
        !item.dataset.searchText.toLowerCase().includes(query);
      if (!item.hidden) count++;
      grid.append(item);
    }
    categories.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === selected),
      ),
    );
    select.value = selected;
    collection.querySelector("[data-collection-status]").textContent =
      `${count} ${collection.classList.contains("work-collection") ? "projects" : "posts"}${query ? ` matching “${search.value.trim()}”` : ""}`;
    collection.querySelector(".collection-empty").hidden = count !== 0;
  }
  categories.forEach((button) =>
    button.addEventListener("click", () => {
      selected = button.dataset.category;
      apply();
    }),
  );
  select.addEventListener("change", () => {
    selected = select.value;
    apply();
  });
  search.addEventListener("input", apply);
  sort.addEventListener("click", () => {
    newest = !newest;
    sort.textContent = newest ? "↑ Newest" : "↓ Oldest";
    sort.setAttribute(
      "aria-label",
      `Sort ${collection.classList.contains("work-collection") ? "projects" : "posts"}: ${newest ? "newest" : "oldest"} first`,
    );
    apply();
  });
  // Keep the authored ordering until someone chooses a filter or sort.
});

const readingToc = document.querySelector(".reading-toc");
if (readingToc) {
  const mobile = matchMedia("(max-width:767px)");
  const setTocLayout = () => {
    readingToc.open = !mobile.matches;
  };
  setTocLayout();
  mobile.addEventListener("change", setTocLayout);
  const anchors = [...readingToc.querySelectorAll("a")];
  anchors.forEach((anchor) =>
    anchor.addEventListener("click", () => {
      if (mobile.matches) readingToc.open = false;
      const target = document.getElementById(
        decodeURIComponent(anchor.hash.slice(1)),
      );
      target?.setAttribute("tabindex", "-1");
      target?.focus({ preventScroll: true });
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobile.matches && readingToc.open) {
      readingToc.open = false;
      readingToc.querySelector("summary").focus();
    }
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (!current) return;
        anchors.forEach((anchor) => {
          if (anchor.hash === `#${current.target.id}`)
            anchor.setAttribute("aria-current", "location");
          else anchor.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-10% 0px -65% 0px" },
    );
    anchors.forEach((anchor) => {
      const target = document.getElementById(
        decodeURIComponent(anchor.hash.slice(1)),
      );
      if (target) observer.observe(target);
    });
  }
}
