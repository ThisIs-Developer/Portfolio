import { renderPlayground } from "./playground.mjs";
import { articleArt, articleCategory } from "./editorial.mjs";
import { enterpriseArt } from "./enterprise-art.mjs";

const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const arrow =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const devLogo =
  '<svg class="dev-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 32 448 448" width="28" height="28" role="img" aria-label="DEV"><rect y="32" width="448" height="448" rx="44" fill="#000"/><path fill="#fff" fill-rule="evenodd" d="M120.12 208.29c-3.88-2.9-7.77-4.35-11.65-4.35H91.03v104.47h17.45c3.88 0 7.77-1.45 11.65-4.35 3.88-2.9 5.82-7.25 5.82-13.06v-69.65c-.01-5.8-1.96-10.16-5.83-13.06zM154.2 291.19c0 18.81-11.61 47.31-48.36 47.25h-46.4V172.98h47.38c35.44 0 47.36 28.46 47.37 47.28l.01 70.93zm100.68-88.66H201.6v38.42h32.57v29.57H201.6v38.41h53.29v29.57h-62.18c-11.16.29-20.44-8.53-20.72-19.69V193.7c-.27-11.15 8.56-20.41 19.71-20.69h63.19l-.01 29.52zm103.64 115.29c-13.2 30.75-36.85 24.63-47.44 0l-38.53-144.8h32.57l29.71 113.72 29.57-113.72h32.58l-38.46 144.8z"/></svg>';
const date = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
const link = (href, label, cls = "text-link") =>
  `<a class="${cls}" href="${esc(href)}">${esc(label)}${arrow}</a>`;
const title = (eyebrow, heading, description = "") =>
  `<header class="page-intro"><p class="eyebrow">${esc(eyebrow)}</p><h1>${heading}</h1>${description ? `<p class="page-description">${description}</p>` : ""}</header>`;
const photo = (src, alt, width = 1400, height = 900, cls = "", eager = false) =>
  `<img src="${esc(src.startsWith("/") ? src : `/${src}`)}" alt="${esc(alt)}" width="${width}" height="${height}" class="${cls}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>`;
const projectImage = (p, eager = false) =>
  photo(
    p.image || `/assets/placeholders/${p.id}.svg`,
    p.imageAlt || `${p.title} — replaceable project image`,
    p.imageWidth || 1400,
    p.imageHeight || 900,
    "",
    eager,
  );
const category = (p) =>
  /AI|vision|Notebook|Retrieval/i.test(p.category)
    ? "AI & data"
    : /Test|Automation|Python/i.test(p.category)
      ? "Automation"
      : /tools|extension|Canvas|Creative/i.test(p.category)
        ? "Tools"
        : "Web apps";
const metaPanel = (entries) =>
  `<dl class="detail-meta">${entries.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
function toc(entries, back = "/work", label = "Back to work") {
  if (!entries.length)
    return `<aside class="reading-sidebar"><a class="reading-back" href="${back}">← ${label}</a></aside>`;
  return `<aside class="reading-sidebar"><a class="reading-back" href="${back}">← ${label}</a><details class="reading-toc" open><summary>On this page <span aria-hidden="true">⌄</span></summary><nav aria-label="On this page">${entries.map((entry, i) => `<a href="#${esc(entry.id)}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(entry.text)}</a>`).join("")}</nav></details></aside>`;
}
function controls(kind, categories) {
  return `<div class="collection-toolbar" hidden><div class="collection-filters" role="group" aria-label="Filter ${kind}">${["All", ...categories].map((x, i) => `<button type="button" data-category="${esc(x)}" aria-pressed="${!i}">${esc(x)}</button>`).join("")}</div><div class="collection-search"><label><span class="sr-only">Search ${kind}</span><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" placeholder="Search ${kind}" data-search></label><button type="button" class="sort-button" data-sort aria-label="Sort ${kind}: newest first">↑ Newest</button></div></div>`;
}
function articleCard(a, i) {
  return `<a class="journal-card" href="${esc(a.localPath)}" data-collection-item data-category="${esc(articleCategory(a))}" data-date="${a.date}" data-search-text="${esc(`${a.title} ${a.summary} ${a.tags.join(" ")}`)}">${articleArt(a)}<div class="journal-copy"><p class="article-meta"><time datetime="${a.date}">${date(a.date)}</time> · ${a.readingTime} min read</p><h2>${esc(a.title)}</h2><p class="journal-summary">${esc(a.summary)}</p><div class="journal-author">${photo("/assets/profile/baivab-480.webp", "", 480, 517)}<span>Baivab Sarkar</span><span class="card-arrow">${arrow}</span></div></div></a>`;
}

const caseToolIcons = {
  JavaScript: "javascript",
  Cloudflare: "cloudflare",
  Docker: "docker",
};
const caseTech = (name) => {
  const slug = caseToolIcons[name];
  const icon = slug
    ? `<img src="/assets/tools/${slug}.svg" alt="" width="18" height="18" loading="lazy" decoding="async" draggable="false" style="width:18px;height:18px;margin:0;border-radius:0;object-fit:contain">`
    : "";
  return `<span style="display:inline-flex;align-items:center;gap:8px">${icon}${esc(name)}</span>`;
};
const caseTechList = (items) => items.map(caseTech).join("");
const paragraphs = (items = []) => items.map((item) => `<p>${esc(item)}</p>`).join("");

function renderMarkdownViewerCase(p, next, entries) {
  const gallery = (p.gallery || []).map((item) =>
    photo(item.src, item.alt, item.width || 400, item.height || 225),
  ).join("");
  const featureGroups = (p.featureGroups || []).map((item) =>
    `<h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>`,
  ).join("");
  const builtWith = p.stack.slice(0, 3).map((name) =>
    `<span style="display:inline-flex;align-items:center;gap:6px;margin:2px 8px 2px 0;white-space:nowrap">${caseToolIcons[name] ? `<img src="/assets/tools/${caseToolIcons[name]}.svg" alt="" width="16" height="16" loading="eager" decoding="async" draggable="false" style="width:16px;height:16px;object-fit:contain">` : ""}${esc(name)}</span>`,
  ).join("");
  const meta = `<dl class="detail-meta"><div><dt>Project</dt><dd>${esc(p.status)}</dd></div><div><dt>Period</dt><dd>${esc(p.year)}</dd></div><div><dt>Built with</dt><dd>${builtWith}</dd></div></dl>`;
  return `<div class="reading-layout case-layout">${toc(entries)}<article class="reading-main"><header class="reading-header"><p class="detail-category">${esc(p.category)}</p><h1>${esc(p.title)}</h1><p class="reading-deck">${esc(p.detailDeck || p.summary)}</p>${meta}</header><figure class="case-hero">${projectImage(p, true)}</figure><div class="case-actions">${p.live ? link(p.live, p.liveLabel || "Visit project", "button") : ""}${p.source ? link(p.source, "Source code") : ""}</div><div class="prose"><section id="overview"><h2>Overview</h2>${paragraphs(p.overview?.length ? p.overview : [p.summary, p.contribution])}</section><section id="problem"><h2>The problem</h2>${paragraphs(p.problemDetails?.length ? p.problemDetails : [p.problem])}</section><section id="contribution"><h2>My contribution</h2>${paragraphs(p.contributionDetails?.length ? p.contributionDetails : [p.contribution])}<div class="project-facts">${caseTechList(p.stack)}</div></section><section id="inside"><h2>Inside the build</h2>${featureGroups || `<ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`}${gallery ? `<div class="case-gallery">${gallery}</div>` : ""}</section><section id="project-notes"><h2>Project notes</h2><div class="project-note-panel"><p class="eyebrow">${esc(p.status)}</p><p>${esc(p.note || `${p.title} is part of my work in ${p.category.toLowerCase()}.`)}</p></div></section></div><a class="next-reading" href="/work/${next.id}"><span>Next project</span><strong>${esc(next.title)}</strong>${arrow}</a></article></div>`;
}

export function renderSitePages(data, ui) {
  const { profile, articles, experience, certifications, enterprise } = data;
  const { all, selected, archive, folder, shell, gamePanel } = ui;
  const pages = {};
  const enterpriseCards = `<div class="private-grid">${enterprise.projects.map((p, i) => `<a class="private-card" href="/work/enterprise#${p.id}">${enterpriseArt(i)}<div class="private-copy"><p class="eyebrow">${esc(p.label)}</p><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><span class="private-card-footer"><span>Private engagement</span>${arrow}</span></div></a>`).join("")}</div>`;
  const enterpriseSection = `<section class="enterprise-section" aria-labelledby="private-title"><div class="enterprise-heading"><p class="eyebrow">PRIVATE FREELANCE WORK</p><h2 id="private-title">Behind the scenes.</h2><p>${esc(enterprise.intro)}</p></div>${enterpriseCards}<p class="confidential-note"><strong>Confidentiality notice.</strong> ${esc(enterprise.notice)}</p></section>`;
  const projectItem = (p, i) =>
    `<div class="folder-item" id="project-${p.id}" data-collection-item data-category="${category(p)}" data-date="${p.year.match(/\d{4}/g)?.at(-1) || "2024"}" data-search-text="${esc(`${p.title} ${p.summary} ${p.stack.join(" ")}`)}">${folder(p, i)}</div>`;
  const work = `<div class="collection-page work-page"><header class="page-intro"><p class="eyebrow">SELECTED WORK</p><h1>A closer look at what<br>I've built.</h1></header><section class="collection work-collection" data-collection data-curated aria-label="Public projects">${controls("projects", ["Web apps", "Tools", "AI & data", "Automation"]).replace("↑ Newest", "↕ Curated").replace("newest first", "curated order")}<p class="collection-status sr-only" role="status" data-collection-status>${all.length} projects</p><section class="project-group" data-project-group aria-labelledby="featured-title"><div class="project-group-heading"><p class="eyebrow">01—06 / FEATURED PROJECTS</p><h2 id="featured-title">Featured projects.</h2></div><div class="folder-grid" data-collection-grid>${selected.map((p, i) => projectItem(p, i)).join("")}</div></section><section class="project-group" data-project-group id="archive" aria-labelledby="archive-title"><div class="project-group-heading"><p class="eyebrow">07—12 / MORE WORK</p><h2 id="archive-title">Project archive.</h2></div><div class="folder-grid" data-collection-grid>${archive.map((p, i) => projectItem(p, i)).join("")}</div></section><p class="collection-empty" hidden>No projects match that search. Try another word or choose All.</p></section>${enterpriseSection}</div>`;
  pages["work.html"] = shell(work, {
    path: "/work",
    title: "Work — Baivab Sarkar",
    description:
      "Open-source tools, full-stack projects, AI experiments and private enterprise applications by Baivab Sarkar.",
    page: "work",
  });
  pages["project.html"] = pages["work.html"];
  const blog = `<div class="collection-page journal-page editorial-index">${title("ENGINEERING & IDEAS", "Built with care.<br>Shared in detail.", "Inside the software I build: product decisions, practical guides and lessons from working with code.")}<section class="collection" data-collection aria-label="Blog articles">${controls("posts", ["Projects", "Git & tooling", "AI & data", "Notes"])}<p class="collection-status sr-only" role="status" data-collection-status>${articles.length} posts</p><div class="journal-grid" data-collection-grid>${articles.map(articleCard).join("")}</div><p class="collection-empty" hidden>No posts match that search. Try another word or choose All.</p></section></div>`;
  pages["blog.html"] = shell(blog, {
    path: "/blog",
    title: "Blog — Baivab Sarkar",
    description:
      "Read Baivab Sarkar’s articles about software, developer tools and experiments.",
    page: "blog",
    type: "CollectionPage",
  });
  for (const [i, a] of articles.entries()) {
    const entries = a.headings?.filter((x) => x.level === 2) || [];
    const next = articles[(i + 1) % articles.length];
    const editorNote = a.editorNote
      ? `<aside class="article-editor-note"><strong>Author’s update</strong><p>${esc(a.editorNote)}</p></aside>`
      : "";
    const content = `<div class="reading-layout article-layout editorial-reader">${toc(entries, "/blog", "Back to blog")}<article class="reading-main"><header class="reading-header"><p class="detail-category">${esc(articleCategory(a))}</p><h1>${esc(a.title)}</h1><p class="reading-deck">${esc(a.summary)}</p><div class="editorial-byline">${photo("/assets/profile/baivab-480.webp", "", 480, 517)}<div><strong>${esc(profile.name)}</strong><p><time datetime="${a.date}">${date(a.date)}</time> · ${a.readingTime} min read</p></div></div></header>${articleArt(a, "article-hero-art")}${editorNote}<div class="prose article-body">${a.bodyHtml || ""}</div><div class="article-credit">${a.url ? `<a class="text-link dev-publication" href="${esc(a.url)}"><span>View in</span>${devLogo}${arrow}</a>` : `<span>Published on this website.</span>`}</div>${next && next !== a ? `<a class="next-reading" href="${esc(next.localPath)}"><span>Continue reading</span><strong>${esc(next.title)}</strong>${arrow}</a>` : ""}</article></div>`;
    pages[`blog/${a.slug}.html`] = shell(content, {
      path: a.localPath,
      title: `${a.title} — Baivab Sarkar`,
      description: a.summary,
      page: "article",
      type: "BlogPosting",
      article: a,
    });
  }
  const caseEntries = [
    { id: "overview", text: "Overview" },
    { id: "problem", text: "The problem" },
    { id: "contribution", text: "My contribution" },
    { id: "inside", text: "Inside the build" },
    { id: "project-notes", text: "Project notes" },
  ];
  for (const [i, p] of all.entries()) {
    const next = all[(i + 1) % all.length];
    const content = p.id === "markdown-viewer"
      ? renderMarkdownViewerCase(p, next, caseEntries)
      : `<div class="reading-layout case-layout">${toc(caseEntries)}<article class="reading-main"><header class="reading-header"><p class="detail-category">${esc(p.category)}</p><h1>${esc(p.title)}</h1><p class="reading-deck">${esc(p.summary)}</p>${metaPanel(
      [
        ["Project", p.status],
        ["Period", p.year],
        ["Built with", p.stack.slice(0, 3).join(", ")],
      ],
    )}</header><figure class="case-hero">${projectImage(p, true)}${!p.image ? "<figcaption>Project image placeholder</figcaption>" : ""}</figure><div class="case-actions">${p.live ? link(p.live, p.liveLabel || "Visit project", "button") : ""}${p.source ? link(p.source, "Source code") : ""}</div><div class="prose"><section id="overview"><h2>Overview</h2><p>${esc(p.summary)}</p><p>${esc(p.contribution)}</p></section><section id="problem"><h2>The problem</h2><p>${esc(p.problem)}</p></section><section id="contribution"><h2>My contribution</h2><p>${esc(p.contribution)}</p><div class="project-facts">${p.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</div></section><section id="inside"><h2>Inside the build</h2><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>${["markdown-viewer", "medichain", "notemarker"].includes(p.id) ? `<div class="case-gallery">${[1, 2].map((j) => photo(`/assets/work/${p.id}-peek-${j}.webp`, `${p.title}, interface detail ${j}`, 400, p.id === "markdown-viewer" ? 175 : p.id === "medichain" && j === 1 ? 174 : 225)).join("")}</div>` : ""}</section><section id="project-notes"><h2>Project notes</h2><div class="project-note-panel"><p class="eyebrow">${esc(p.status)}</p><p>${esc(p.note || `${p.title} is part of my work in ${p.category.toLowerCase()}. The links above provide the available project and implementation details.`)}</p></div></section></div><a class="next-reading" href="/work/${next.id}"><span>Next project</span><strong>${esc(next.title)}</strong>${arrow}</a></article></div>`;
    pages[`work/${p.id}.html`] = shell(content, {
      path: `/work/${p.id}`,
      title: `${p.title} — Baivab Sarkar`,
      description: p.summary,
      page: "case-study",
    });
  }
  const privateEntries = enterprise.projects.map((x) => ({
    id: x.id,
    text: x.title.replace("Enterprise ", ""),
  }));
  pages["work/enterprise.html"] = shell(
    `<div class="reading-layout case-layout">${toc(privateEntries)}<article class="reading-main"><header class="reading-header"><p class="detail-category">Private freelance work</p><h1>Enterprise applications.</h1><p class="reading-deck">${enterprise.intro}</p>${metaPanel(
      [
        ["Engagement", "Private freelance"],
        ["Focus", "Business automation"],
        ["Availability", "Confidential"],
      ],
    )}</header><div class="prose">${enterprise.projects.map((p) => `<section id="${p.id}">${p.id === "audit-management" ? '<span id="enterprise-support" aria-hidden="true"></span>' : ""}<p class="eyebrow">${p.label}</p><h2>${p.title}</h2><p>${p.summary}</p></section>`).join("")}<aside class="confidential-note"><h2>Confidentiality notice</h2><p>${enterprise.notice}</p></aside></div></article></div>`,
    {
      path: "/work/enterprise",
      title: "Enterprise applications — Baivab Sarkar",
      description: enterprise.intro,
      page: "case-study",
    },
  );
  const interests = [
    "Open source",
    "JavaScript",
    "Java",
    "Test automation",
    "Browser tools",
    "Computer science",
    "Developer experience",
    "Creative coding",
  ];
  const strip = [
    ["/assets/about/desk.svg", "A space for ideas", "Desk illustration"],
    ["/assets/work/notemarker-800.webp", "NoteMarker", "NoteMarker project"],
    ["/assets/about/campus.svg", "Always learning", "Campus illustration"],
    ["/assets/profile/baivab-480.webp", "Hello, I’m Baivab", "Baivab Sarkar"],
    [
      "/assets/work/markdown-viewer-800.webp",
      "Markdown Viewer",
      "Markdown Viewer project",
    ],
    ["/assets/work/sketchflow-800.webp", "SketchFlow", "SketchFlow project"],
    [
      "/assets/about/moments.svg",
      "Room for curiosity",
      "Personal moments illustration",
    ],
  ];
  const about = `<div class="about-page"><header class="about-intro"><h1>Hey, I’m Baivab.</h1><p>I build useful software, follow my curiosity,<br>and keep learning along the way.</p></header><div class="photo-fan" data-photo-fan role="group" aria-label="A few snapshots from my world"><p class="sr-only" id="photo-fan-help">Hover or select a photo to bring it forward. Use the arrow keys to explore, and Escape to put it back.</p>${strip.map(([src, caption, alt], i) => `<button type="button" class="photo-fan-card photo-${i}" data-photo-card data-photo-caption="${esc(caption)}" aria-label="${esc(alt)}" aria-describedby="photo-fan-help" aria-pressed="false">${photo(src, "", 480, 517, "", true).replace("<img ", '<img draggable="false" ')}<span class="sr-only">${esc(caption)}</span></button>`).join("")}<span class="photo-bubble bubble-left" data-photo-caption aria-hidden="true"></span><span class="photo-bubble bubble-right" aria-hidden="true">a little of my world</span><p class="sr-only" role="status" data-photo-status></p></div><div class="about-reading"><div class="about-story"><p>${profile.about}</p><p>${profile.intro}</p><p>${profile.approach}</p></div><section class="profile-board" aria-label="Currently and interests"><p class="eyebrow">CURRENTLY</p><div class="profile-board-inner"><div class="current-location"><span class="location-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.8"/></svg></span><div><strong>${profile.location}</strong><p>Building tools. Learning in public.</p></div></div><div class="interest-section"><p class="eyebrow">THINGS I ENJOY WORKING WITH</p><div class="interest-marquee">${[interests, interests.slice().reverse()].map((row, i) => `<div class="interest-track track-${i}">${[...row, ...row].map((s, j) => `<span${j >= row.length ? ' aria-hidden="true"' : ""}>${s}</span>`).join("")}</div>`).join("")}</div></div><div class="selected-tools"><p class="eyebrow">SELECTED TOOLS</p><div>${[
    ["javascript", "JavaScript"],
    ["python", "Python"],
    ["java", "Java"],
    ["selenium", "Selenium"],
    ["tensorflow", "TensorFlow"],
    ["opencv", "OpenCV"],
    ["docker", "Docker"],
    ["jenkins", "Jenkins"],
    ["git", "Git"],
    ["cloudflare", "Cloudflare"],
    ["vercel", "Vercel"],
    ["figma", "Figma"],
  ]
    .map(
      ([slug, label]) =>
        `<span class="selected-tool"><span class="tool-icon"><img src="/assets/tools/${slug}.svg" alt="" width="32" height="32" loading="lazy" decoding="async" draggable="false"></span><span>${label}</span></span>`,
    )
    .join(
      "",
    )}</div></div></div></section><section class="about-prose"><h2>What I enjoy working on</h2><p>I’m drawn to the small problems that keep getting in the way: a document that needs a better workspace, information that needs to move between people, or a workflow that needs reliable tests.</p><p>That has taken me from Markdown Viewer and NoteMarker to MediChain, academic applications and private enterprise tools.</p><h2>My process</h2><p>I start with the workflow: what someone needs to do, where the friction is, and what a useful first version would look like. Then I build, test and refine the details.</p><p>My Java and Selenium training has made testing part of that process. I want the interface and the behavior behind it to make sense together.</p><h2>Learning in public</h2><p>My public repositories and blog are a record of that learning. There are polished tools, team prototypes and earlier experiments. Each has something that led to the next one.</p>${link("/blog", "Read my notes")}<h2 id="experience">Experience & learning</h2><div class="about-timeline">${experience.map((x) => `<article><p class="eyebrow">${esc(x.period)}</p><h3>${esc(x.title)}</h3><p><strong>${esc(x.organization)}</strong></p><p>${esc(x.description)}</p>${x.link ? link(x.link, x.linkLabel) : ""}</article>`).join("")}<article><p class="eyebrow">PRIVATE FREELANCE WORK</p><h3>Enterprise applications & automation</h3><p>${enterprise.intro}</p>${link("/work/enterprise", "Private work overview")}</article></div><div class="certification-list">${certifications.map((x) => `<p><strong>${esc(x.title)}</strong><span>${esc(x.date)}</span></p>`).join("")}</div><div class="section-bottom">${link(profile.resume, "Download my resume", "button")}</div></section></div></div>`;
  pages["about.html"] = shell(about, {
    path: "/about",
    title: "About — Baivab Sarkar",
    description: profile.description,
    page: "about",
  });
  pages["play-lab.html"] = shell(renderPlayground({ profile, projects: all }), {
    path: "/play-lab",
    title: "Play Lab — Baivab Sarkar",
    description:
      "A little space for curiosity, experiments and things in progress.",
    page: "playground",
    playground: true,
  });
  pages["404.html"] = shell(
    `<div class="error-page">${title("404", "A small detour.", "This page took a wrong turn. <br>Jump a few bugs, then find your way back.")}<div class="error-game">${gamePanel()}</div><div class="section-bottom">${link("/", "Take me home", "button")}</div></div>`,
    {
      path: "/404",
      title: "Page not found — Baivab Sarkar",
      description:
        "This page could not be found. Play Bug Run or return to the portfolio.",
      page: "404",
      noindex: true,
      footer: false,
    },
  );
  return pages;
}
