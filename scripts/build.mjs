import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPages } from "./templates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readData = async (name) =>
  JSON.parse(await readFile(path.join(root, "data", `${name}.json`), "utf8"));
const [
  profile,
  projects,
  articles,
  experiments,
  experience,
  skills,
  certifications,
] = await Promise.all(
  [
    "profile",
    "projects",
    "articles",
    "experiments",
    "experience",
    "skills",
    "certifications",
  ].map(readData),
);
const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function metadata(archive = false) {
  const title = archive
    ? "Project archive — Baivab Sarkar"
    : "Baivab Sarkar — Software Developer & Open-Source Builder";
  const description = archive
    ? "Explore Baivab Sarkar’s software projects, test automation, AI experiments, browser tools, and earlier web work."
    : profile.description;
  const canonical = `${profile.site}${archive ? "/project" : "/"}`;
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
        "@type": archive ? "CollectionPage" : "ProfilePage",
        "@id": `${canonical}#page`,
        url: canonical,
        name: title,
        description,
        mainEntity: { "@id": `${profile.site}/#person` },
        isPartOf: { "@id": `${profile.site}/#website` },
      },
    ],
  };
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#f5f4f0">
  <meta name="color-scheme" content="light dark">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Baivab Sarkar">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${profile.site}/assets/social-preview.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Baivab Sarkar — Thoughtful software for real-world problems.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${profile.site}/assets/social-preview.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/instrument-serif-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/instrument-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/instrument-serif-latin-italic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css?v=20260907">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
  <script src="/script.js?v=20260907" defer></script>`;
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
    },
    metadata,
  ),
  "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${profile.site}/</loc></url><url><loc>${profile.site}/project</loc></url></urlset>\n`,
  "robots.txt": `User-agent: *\nAllow: /\nSitemap: ${profile.site}/sitemap.xml\n`,
};
const check = process.argv.includes("--check");
for (const [filename, content] of Object.entries(outputs)) {
  if (check) {
    if ((await readFile(path.join(root, filename), "utf8")) !== content)
      throw new Error(`${filename} is stale; run npm run build.`);
  } else await writeFile(path.join(root, filename), content);
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
    "script.js",
    "game.js",
    "favicon.svg",
    "favicon.png",
    "404.html",
    "_headers",
    "CNAME",
    "google67e0cac1e39b6336.html",
  ];
  for (const filename of publicFiles)
    await cp(path.join(root, filename), path.join(dist, filename));
  for (const directory of ["fonts", "work"])
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
