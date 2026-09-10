document.querySelectorAll("[data-collection]").forEach((collection) => {
  const toolbar = collection.querySelector(".collection-toolbar");
  if (!toolbar) return;
  toolbar.hidden = false;
  const grids = [...collection.querySelectorAll("[data-collection-grid]")];
  const search = collection.querySelector("[data-search]");
  const sort = collection.querySelector("[data-sort]");
  const categories = [
    ...collection.querySelectorAll("[data-category][aria-pressed]"),
  ];
  const curated = collection.hasAttribute("data-curated");
  let selected = "All",
    order = curated ? "curated" : "newest";
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
    for (const grid of grids) {
      const items = [...grid.querySelectorAll("[data-collection-item]")];
      items.forEach((item, index) => {
        item.dataset.curatedIndex ??= String(index);
      });
      const sorted = items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          if (order === "curated")
            return (
              Number(a.item.dataset.curatedIndex) -
              Number(b.item.dataset.curatedIndex)
            );
          const difference =
            Date.parse(b.item.dataset.date) - Date.parse(a.item.dataset.date);
          return (
            (order === "newest" ? difference : -difference) ||
            Number(a.item.dataset.curatedIndex) -
              Number(b.item.dataset.curatedIndex)
          );
        });
      for (const { item } of sorted) {
        item.hidden =
          !(selected === "All" || item.dataset.category === selected) ||
          !item.dataset.searchText.toLowerCase().includes(query);
        if (!item.hidden) count++;
        grid.append(item);
      }
      const group = grid.closest("[data-project-group]");
      if (group) group.hidden = !items.some((item) => !item.hidden);
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
    order =
      order === "curated"
        ? "newest"
        : order === "newest"
          ? "oldest"
          : curated
            ? "curated"
            : "newest";
    sort.textContent =
      order === "curated"
        ? "↕ Curated"
        : order === "newest"
          ? "↑ Newest"
          : "↓ Oldest";
    sort.setAttribute(
      "aria-label",
      `Sort ${collection.classList.contains("work-collection") ? "projects" : "posts"}: ${order === "curated" ? "curated order" : `${order} first`}`,
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

const photoFan = document.querySelector("[data-photo-fan]");
if (photoFan) {
  const photos = [...photoFan.querySelectorAll("[data-photo-card]")];
  const caption = photoFan.querySelector(".photo-bubble[data-photo-caption]");
  const status = photoFan.querySelector("[data-photo-status]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let activePhoto = null;
  let pinnedPhoto = null;
  let frame = 0;

  const resetTilt = (photo) => {
    photo?.style.removeProperty("--tilt-x");
    photo?.style.removeProperty("--tilt-y");
  };
  const activate = (photo, announce = false) => {
    cancelAnimationFrame(frame);
    resetTilt(activePhoto);
    activePhoto = photo;
    photos.forEach((item) => {
      item.classList.toggle("is-photo-active", item === photo);
      item.setAttribute("aria-pressed", String(item === photo));
    });
    photoFan.classList.toggle("has-active-photo", Boolean(photo));
    if (photo) caption.textContent = photo.dataset.photoCaption;
    if (announce)
      status.textContent = photo
        ? photo.dataset.photoCaption
        : "Photos put back.";
  };

  photos.forEach((photo, index) => {
    photo.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") activate(photo);
    });
    photo.addEventListener("pointermove", (event) => {
      if (
        event.pointerType === "touch" ||
        reducedMotion.matches ||
        activePhoto !== photo
      )
        return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (activePhoto !== photo) return;
        const rect = photo.getBoundingClientRect();
        const x = Math.max(
          -1,
          Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
        );
        const y = Math.max(
          -1,
          Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
        );
        photo.style.setProperty("--tilt-x", `${x * 6}deg`);
        photo.style.setProperty("--tilt-y", `${-y * 5}deg`);
      });
    });
    photo.addEventListener("pointerleave", () => {
      if (activePhoto !== photo) return;
      activate(
        pinnedPhoto ||
          (photos.includes(document.activeElement)
            ? document.activeElement
            : null),
      );
    });
    photo.addEventListener("focus", () => activate(photo));
    photo.addEventListener("click", () => {
      pinnedPhoto = pinnedPhoto === photo ? null : photo;
      activate(pinnedPhoto, true);
    });
    photo.addEventListener("keydown", (event) => {
      const keyOffsets = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
      };
      if (event.key in keyOffsets) {
        event.preventDefault();
        photos[
          (index + keyOffsets[event.key] + photos.length) % photos.length
        ].focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        photos[event.key === "Home" ? 0 : photos.length - 1].focus();
      }
    });
    photo.addEventListener("dragstart", (event) => event.preventDefault());
  });
  photoFan.addEventListener("focusout", (event) => {
    if (!photoFan.contains(event.relatedTarget)) activate(pinnedPhoto);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!photoFan.contains(event.target)) {
      pinnedPhoto = null;
      activate(null);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activePhoto) {
      pinnedPhoto = null;
      activate(null, true);
    }
  });
  reducedMotion.addEventListener("change", () => {
    cancelAnimationFrame(frame);
    photos.forEach(resetTilt);
  });
}
