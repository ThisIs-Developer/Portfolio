import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPages } from "./templates.mjs";
import { buildKnowledge } from "./knowledge.mjs";
import { loadLocalArticles, mergeArticles } from "./local-articles.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readData = async (name) =>
  JSON.parse(await readFile(path.join(root, "data", `${name}.json`), "utf8"));
const [
  profile,
  projects,
  importedArticles,
  experiments,
  experience,
  skills,
  certifications,
  enterprise,
  projectAdditions,
] = await Promise.all(
  [
    "profile",
    "projects",
    "articles",
    "experiments",
    "experience",
    "skills",
    "certifications",
    "enterprise",
    "project-additions",
  ].map(readData),
);
const articles = mergeArticles(importedArticles, await loadLocalArticles(root));
const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function metadata(options = {}) {
  const title =
    options.title || "Baivab Sarkar — Software Developer & Open-Source Builder";
  const description = options.description || profile.description;
  const canonical = `${profile.site}${options.path || "/"}`;
  const person = {
    "@type": "Person",
    "@id": `${profile.site}/#person`,
    name: profile.name,
    url: `${profile.site}/`,
    image: `${profile.site}/assets/profile/baivab-800.webp`,
    description: profile.description,
    sameAs: profile.socials.map((item) => item.url),
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "JIS College of Engineering",
    },
  };
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "WebSite",
        "@id": `${profile.site}/#website`,
        url: `${profile.site}/`,
        name: "Baivab Sarkar",
        inLanguage: "en",
      },
      {
        "@type": options.type || (options.page ? "WebPage" : "ProfilePage"),
        "@id": `${canonical}#page`,
        url: canonical,
        name: title,
        description,
        mainEntity: { "@id": `${profile.site}/#person` },
        isPartOf: { "@id": `${profile.site}/#website` },
        ...(options.article
          ? {
              headline: options.article.title,
              datePublished: options.article.date,
              dateModified:
                options.article.editorialUpdated || options.article.sourceUpdatedAt || options.article.date,
              author: { "@id": `${profile.site}/#person` },
              ...(options.article.cover?.src
                ? { image: `${profile.site}${options.article.cover.src}` }
                : {}),
            }
          : {}),
      },
    ],
  };
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${options.noindex ? '<meta name="robots" content="noindex">' : ""}
  <meta name="theme-color" content="#f5f4f0">
  <meta name="color-scheme" content="light dark">
  <script src="/theme.js?v=20260913"></script>
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${options.article ? "article" : "website"}">
  <meta property="og:site_name" content="Baivab Sarkar">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${profile.site}/assets/social-preview.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Baivab Sarkar — Thoughtful software for real-world problems.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${profile.site}/assets/social-preview.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/instrument-serif-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/instrument-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/instrument-serif-latin-italic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css?v=20260913c">
  ${options.page ? '<link rel="stylesheet" href="/pages.css?v=20260910">' : ""}
  <link rel="stylesheet" href="/cursor.css?v=20260910">
  <link rel="stylesheet" href="/editorial.css?v=20260913">
  ${!options.page ? '<link rel="stylesheet" href="/quick-ask.css?v=20260910"><script type="module" src="/quick-ask.js?v=20260910"></script>' : ""}
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
  <script src="/script.js?v=20260913" defer></script>
  ${options.page ? '<script src="/pages.js?v=20260910" defer></script>' : ""}
  <script src="/cursor.js?v=20260912b" defer></script>`.replace(
    /\n[ \t]+\n/g,
    "\n\n",
  );
}

const outputs = {
  ...renderPages(
    {
      profile,
      projects,
      articles,
      experiments,
      experience,
      skills,
      certifications,
      enterprise,
      projectAdditions,
    },
    metadata,
  ),
  "robots.txt": `User-agent: *\nAllow: /\nSitemap: ${profile.site}/sitemap.xml\n`,
  "assets/portfolio-knowledge.json": JSON.stringify(buildKnowledge({profile,projects,experiments,projectAdditions,experience,skills,enterprise,articles})),
};
const serverKnowledge = `// Generated from public portfolio content by npm run build.\nexport default ${outputs["assets/portfolio-knowledge.json"]};\n`;
if(process.argv.includes('--check')) {
  if(await readFile(path.join(root,'server/knowledge.js'),'utf8')!==serverKnowledge) throw new Error('Assistant knowledge is stale; run npm run build.');
} else {
  await mkdir(path.join(root,'server'),{recursive:true});
  await writeFile(path.join(root,'server/knowledge.js'),serverKnowledge);
}
outputs["sitemap.xml"] =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
    outputs,
  )
    .filter(
      (name) =>
        name.endsWith(".html") && !["404.html", "project.html"].includes(name),
    )
    .map(
      (name) =>
        `<url><loc>${profile.site}${name === "index.html" ? "/" : `/${name.replace(/\.html$/, "")}`}</loc></url>`,
    )
    .join("")}</urlset>\n`;
function placeholder(label, symbol, color = "#c8e6f7", height = 900) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${height}" viewBox="0 0 1400 ${height}"><title>${esc(label)} — replaceable image</title><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#f5f4f0"/></linearGradient><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1" fill="#1a1a1a" opacity=".15"/></pattern></defs><rect width="1400" height="${height}" fill="url(#bg)"/><rect width="1400" height="${height}" fill="url(#dots)"/><rect x="130" y="130" width="1140" height="${height - 260}" rx="48" fill="#fff" fill-opacity=".38" stroke="#fff" stroke-width="3"/><text x="700" y="${height * 0.45}" fill="#3b5bdb" font-size="150" font-family="Georgia,serif" text-anchor="middle">${esc(symbol)}</text><text x="700" y="${height * 0.65}" fill="#333742" font-size="42" font-family="Arial,sans-serif" text-anchor="middle">${esc(label)}</text><text x="700" y="${height * 0.76}" fill="#575c69" font-size="20" font-family="Arial,sans-serif" text-anchor="middle" letter-spacing="4">IMAGE PLACEHOLDER</text></svg>\n`;
}
for (const [i, p] of [
  ...projects,
  ...experiments,
  ...projectAdditions,
].entries()) {
  if (!p.image && !["ams", "sketchflow"].includes(p.id))
    outputs[`assets/placeholders/${p.id}.svg`] = placeholder(
      p.title.length > 44 ? p.title.slice(0, 41) + "…" : p.title,
      ["{ }", "Aa", "↗", "~"][i % 4],
      ["#c8e6f7", "#d4c9f5", "#b8f0d8", "#f5d4b8"][i % 4],
    );
}
for (const [name, label, symbol, color] of [
  ["desk", "At my desk", "{ }", "#c8e6f7"],
  ["campus", "My learning journey", "2025", "#f5d4b8"],
  ["moments", "Little moments", "✳", "#d4c9f5"],
])
  outputs[`assets/about/${name}.svg`] = placeholder(label, symbol, color, 1508);
const check = process.argv.includes("--check");
for (const [filename, content] of Object.entries(outputs)) {
  if (check) {
    if ((await readFile(path.join(root, filename), "utf8")) !== content)
      throw new Error(`${filename} is stale; run npm run build.`);
  } else {
    await mkdir(path.dirname(path.join(root, filename)), { recursive: true });
    await writeFile(path.join(root, filename), content);
  }
}
if (!check) {
  const dist = path.join(root, "dist");
  if (path.dirname(dist) !== root || path.basename(dist) !== "dist")
    throw new Error("Build output must stay inside the repository.");
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  const publicFiles = [
    ...Object.keys(outputs),
    "style.css",
    "theme.js",
    "script.js",
    "game.js",
    "pages.css",
    "pages.js",
    "cursor.css",
    "cursor.js",
    "editorial.css",
    "quick-ask.css",
    "quick-ask.js",
    "quick-ask-core.js",
    "_routes.json",
    "_redirects",
    "playground.css",
    "playground.js",
    "favicon.svg",
    "favicon.png",
    "_headers",
    "CNAME",
    "google67e0cac1e39b6336.html",
  ];
  for (const filename of publicFiles) {
    await mkdir(path.dirname(path.join(dist, filename)), { recursive: true });
    await cp(path.join(root, filename), path.join(dist, filename));
  }
  for (const directory of ["fonts", "work", "articles", "tools"])
    await cp(
      path.join(root, "assets", directory),
      path.join(dist, "assets", directory),
      { recursive: true },
    );
  for (const filename of [
    "profile/baivab-480.webp",
    "profile/baivab-800.webp",
    "social-preview.png",
    "apple-touch-icon.png",
    "resume/Baivab_Sarkar_Resume.pdf",
    "resume/CV-BAIVAB SARKAR.pdf",
  ]) {
    const destination = path.join(dist, "assets", filename);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(root, "assets", filename), destination);
  }
}
console.log(
  check
    ? "Generated pages are up to date."
    : "Built static pages in the repository root and dist/.",
);
