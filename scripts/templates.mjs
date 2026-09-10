import { renderCapabilities, renderHomeAbout } from "./home-sections.mjs";
import { renderQuickAsk } from "./quick-ask.mjs";
import { renderSitePages } from "./site-pages.mjs";
import { articleArt } from "./editorial.mjs";
import { projectCollections } from "./project-selection.mjs";
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
const tags = (items) =>
  `<ul class="tags" aria-label="Technologies">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
const link = (url, text, cls = "text-link") =>
  `<a class="${cls}" href="${esc(url)}">${esc(text)}${arrow}</a>`;
const heading = (eyebrow, title, id) =>
  `<div class="section-heading"><p class="eyebrow">${eyebrow}</p><h2 id="${id}">${title}</h2></div>`;
export function renderPages(data, metadata) {
  const {
    profile,
    projects,
    experiments,
    articles,
    experience,
    certifications,
  } = data;
  const collections = projectCollections(data);
  const all = collections.all.map((p) =>
    p.id === "ams"
      ? {
          ...p,
          image: "assets/work/ams-1400.webp",
          imageHeight: 1400,
          imageAlt:
            "Academic Management System attendance dashboard on two mobile screens.",
        }
      : p.id === "sketchflow"
        ? {
            ...p,
            image: "assets/work/sketchflow-1400.webp",
            imageHeight: 764,
            imageAlt:
              "SketchFlow drawing canvas with a colorful circular sketch.",
          }
        : p,
  );
  const selected = all.slice(0, collections.featured.length);
  const archive = all.slice(collections.featured.length);
  const nav = (page = "home") =>
    `<a class="skip-link" href="#main-content" tabindex="0">Skip to content</a><header class="site-header"><div class="nav-shell"><button class="menu-toggle" type="button" aria-controls="site-nav" aria-expanded="false" hidden><span class="menu-glyph" aria-hidden="true"><i></i><i></i></span><span data-menu-label>Menu</span></button><a class="wordmark" href="/">Baivab<span> Sarkar</span></a><nav id="site-nav" aria-label="Main navigation">${[
      ["/about", "About", "about"],
      ["/play-lab", "Play Lab", "playground"],
      ["/work", "Work", "work"],
      ["/blog", "Blog", "blog"],
      ["/#contact", "Contact", "contact"],
    ]
      .map(
        ([href, label, key]) =>
          `<a href="${href}"${page === key ? ' aria-current="page"' : ""}>${label}</a>`,
      )
      .join(
        "",
      )}</nav><button type="button" class="theme-toggle" aria-label="Dark theme" aria-pressed="false" hidden><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg></button></div></header><div class="nav-backdrop" hidden></div>`;
  const gamePanel = () =>
    `<div class="game-panel"><div class="game-heading"><div class="game-identity"><span class="game-logo" aria-hidden="true">{;}</span><div><h3>Bug Run</h3><p>A tiny break between builds.</p></div></div><div class="game-stats"><div><span>Score</span><strong id="game-score">0</strong></div><div><span>Best</span><strong id="game-best">0</strong></div><button id="game-reset" type="button" aria-label="Reset game" hidden>↻</button></div></div><canvas id="bug-run" width="800" height="180" tabindex="0" aria-label="Bug Run: jump over bugs. Use the Start / jump button or press Space while the game is focused." aria-describedby="game-status">An optional jumping game. The rest of this portfolio works without JavaScript.</canvas><div class="game-bottom"><p id="game-status" role="status">Space or tap to start. Dodge a few bugs.</p><div class="game-controls"><button id="game-jump" type="button" hidden>Start / jump</button><button id="game-pause" type="button" hidden>Pause</button></div></div></div>`;
  const footer = (game) =>
    `<section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="contact-inner"><p class="contact-kicker">An idea, an opportunity, or just a hello?</p><h2 id="contact-title">Build with me.</h2><div class="email-row"><button class="copy-email button" type="button" hidden><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M15 8V4H4v11h4"/></svg>Copy email</button><a class="email-link" href="mailto:${profile.email}">${profile.email}</a><span class="copy-status" role="status" data-copy-status></span></div><div class="social-links"><a href="${profile.resume}" class="social-circle" aria-label="Download resume (PDF)" download><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6"/></svg></a>${profile.socials.map((s, i) => `<a class="social-circle" href="${esc(s.url)}" aria-label="${s.label}"><span aria-hidden="true">${['<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 19c-4.3 1.3-4.3-2.1-6-2.5M15 22v-3.8c0-1.1.4-1.8 1-2.2 3.3-.4 6-1.5 6-6A4.7 4.7 0 0 0 20.7 6c.1-.4.6-2-0.1-4 0 0-1.2-.4-4 1.5a13.4 13.4 0 0 0-7.2 0C6.6 1.6 5.4 2 5.4 2c-.7 2-.2 3.6-.1 4A4.7 4.7 0 0 0 4 10c0 4.5 2.7 5.6 6 6-.5.4-1 1.2-1 2.2V22"/></svg>', "in", "DEV"][i]}</span></a>`).join("")}</div>${game ? gamePanel() : ""}</div></section><footer class="site-footer"><div><p>© ${profile.reviewed.slice(0, 4)} Baivab Sarkar</p><p>A little curiosity. A lot of code.</p><a href="#top">Back to top ↑</a></div></footer>`;
  const picture = (p, cls = "") =>
    `<img class="${cls}" src="/${p.image.replace("-1400.webp", "-800.webp")}" srcset="/${p.image.replace("-1400.webp", "-800.webp")} 800w, /${p.image} 1400w" sizes="(max-width: 767px) 90vw, 440px" width="1400" height="${p.imageHeight}" alt="${esc(p.imageAlt)}" loading="${p.id === "markdown-viewer" ? "eager" : "lazy"}" ${p.id === "markdown-viewer" ? 'fetchpriority="high"' : ""} decoding="async">`;
  const folder = (p, i) =>
    `<a class="folder folder-${i + 1}" href="/work/${p.id}"><span class="folder-back" aria-hidden="true"></span><span class="folder-sheets" aria-hidden="true">${[1, 0, 2].map((peek, j) => `<span class="folder-sheet sheet-${j + 1}"><img src="/${peek && ["markdown-viewer", "medichain", "notemarker"].includes(p.id) ? `assets/work/${p.id}-peek-${peek}.webp` : p.image ? p.image.replace("-1400.webp", "-400.webp") : `assets/placeholders/${p.id}.svg`}" width="400" height="${peek && ["markdown-viewer", "medichain", "notemarker"].includes(p.id) ? 260 : Math.round((p.imageHeight || 900) / 3.5)}" alt="" loading="lazy" decoding="async"></span>`).join("")}</span><span class="folder-front"><span class="folder-category"><span class="project-number">${p.number}</span>${esc(p.category.split(" · ")[0])}</span><span class="folder-title">${esc(p.title)}</span><span class="folder-description">${esc(p.summary)}</span><span class="folder-bottom"><span class="folder-tags">${p.stack
      .slice(0, 2)
      .map((t) => `<span>${esc(t)}</span>`)
      .join(
        "",
      )}</span><span class="folder-arrow">${arrow}</span></span></span></a>`;
  const caps = [
    [
      "Web applications",
      "Thoughtful interfaces, useful workflows, and the code behind them.",
      ["JavaScript", "HTML & CSS", "Spring"],
      "From Markdown Viewer’s local-first workspace to role-based academic and medicine supply-chain interfaces.",
    ],
    [
      "Test automation",
      "Confidence in the happy path. And all the other paths.",
      ["Java", "Selenium", "TestNG", "Jenkins"],
      "Page objects, data-driven checks, reports and continuous integration in my test automation practice.",
    ],
    [
      "Browser extensions",
      "Small tools that make the everyday web a little better.",
      ["WebExtensions", "Browser Storage"],
      "NoteMarker keeps highlights and sticky notes on the pages that inspired them.",
    ],
    [
      "Java development",
      "A solid foundation, from objects to application logic.",
      ["Java", "OOP", "SQL", "Maven"],
      "Computer science fundamentals, hands-on SDET training, and team application development.",
    ],
    [
      "AI experiments",
      "Curiosity, grounded in code and data.",
      ["Python", "LangChain", "FAISS"],
      "A CSV question-answering prototype using retrieval and a pretrained Llama 2 model.",
    ],
  ];
  const home = `<section class="hero" id="profile" aria-labelledby="hero-title"><div class="foliage" aria-hidden="true"></div><div class="hero-copy"><p class="eyebrow">SOFTWARE DEVELOPMENT & TEST AUTOMATION</p><h1 id="hero-title">Baivab Sarkar</h1><p class="hero-tagline">I build thoughtful software<br>for <em>real-world problems.</em></p><p class="handwritten hero-note">a little curious. a lot of code. <span aria-hidden="true">⤴</span></p><div class="hero-actions"><a class="button" href="#contact">Let’s talk ${arrow}</a><a class="text-link" href="#projects">View work <span aria-hidden="true">↓</span></a></div></div><a class="scroll-note" href="#projects">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></section>
 <section class="work-section section-space" id="projects" aria-labelledby="work-title">${heading("A FEW THINGS I’VE BUILT", "Featured <em>projects.</em>", "work-title")}<p class="handwritten section-note">Open the folders. There’s good stuff inside.</p><div class="folder-grid">${selected.map(folder).join("")}</div></section>
 ${renderCapabilities(caps, heading)}
 <section class="writing-section section-space" id="writing" aria-labelledby="writing-title">${heading("NOTES FROM THE PROCESS", "Build. Learn. <em>Write.</em>", "writing-title")}<div class="writing-grid">${articles
   .filter((a) => a.featured ?? true)
   .slice(0, 3)
   .map(
     (a, i) =>
       `<article class="writing-card"><a href="${esc(a.localPath || "/blog")}">${articleArt(a)}<div class="writing-copy"><p class="article-meta"><time datetime="${a.date}">${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(a.date))}</time> · ${a.readingTime} min read</p><h3>${esc(a.title)}</h3><span class="article-read">Read article ${arrow}</span></div></a></article>`,
   )
   .join(
     "",
   )}</div><div class="section-bottom">${link("/blog", "All articles")}</div></section>
 ${renderHomeAbout(heading, renderQuickAsk, link)}`;
  const shell = (content, options = {}) => `<!doctype html>
<!-- Generated by scripts/build.mjs. Edit data/ or scripts/, then npm run build. -->
<html lang="en" id="top"><head>${metadata(options)}<script src="/game.js?v=20260908" defer></script>${options.playground ? '<link rel="stylesheet" href="/playground.css?v=20260910"><script src="/playground.js?v=20260910" defer></script>' : ""}</head><body data-page="${options.page || "home"}">${nav(options.page)}<main id="main-content" tabindex="-1"><div class="page-surface">${content}</div>${options.footer === false ? "" : footer(true)}</main></body></html>`;
  return {
    "index.html": shell(home),
    ...renderSitePages(data, {
      all,
      selected,
      archive,
      folder,
      shell,
      gamePanel,
    }),
  };
}
