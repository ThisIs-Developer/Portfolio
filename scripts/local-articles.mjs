import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const categories = ["Projects", "Git & tooling", "AI & data", "Notes"];
const kinds = ["document", "git", "ai", "vision", "audio", "web"];
function text(value, label, max = 20000) {
  assert(
    typeof value === "string" && value.trim() && value.length <= max,
    `${label} must be nonempty text, at most ${max} characters.`,
  );
  return value.trim();
}
function date(value, label) {
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    `${label} must be a valid YYYY-MM-DD date.`,
  );
  return value;
}
function safeLink(value) {
  text(value, "Link URL", 2000);
  assert(
    !/[\u0000-\u0020\u007f\\]/.test(value),
    "Link URL contains unsafe characters.",
  );
  if (/^\/(?!\/)/.test(value) || /^#[a-z0-9-]+$/i.test(value)) return value;
  const url = new URL(value);
  assert(
    ["https:", "mailto:"].includes(url.protocol) &&
      !url.username &&
      !url.password,
    "Links must be local paths, HTTPS URLs or email links.",
  );
  return value;
}
function inline(value) {
  if (typeof value === "string") return esc(text(value, "Block text"));
  assert(
    Array.isArray(value) && value.length,
    "Rich text must be a nonempty array of text or link parts.",
  );
  return value
    .map((part) => {
      if (typeof part === "string") return esc(part);
      assert(part && typeof part === "object", "Invalid rich text part.");
      const content = esc(text(part.text, "Inline text"));
      if (part.href)
        return `<a href="${esc(safeLink(part.href))}">${content}</a>`;
      if (part.emphasis === "strong") return `<strong>${content}</strong>`;
      if (part.emphasis === "code") return `<code>${content}</code>`;
      if (part.emphasis === "em") return `<em>${content}</em>`;
      throw new Error(
        "Rich text objects need href or emphasis (strong, code, em).",
      );
    })
    .join("");
}

export function compileLocalArticle(post) {
  assert(
    post && typeof post === "object" && !Array.isArray(post),
    "Post must be an object.",
  );
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) && post.slug.length <= 120,
    "Post slug must use lowercase letters, digits and single hyphens.",
  );
  assert(
    typeof post.draft === "boolean",
    "Set draft explicitly to true or false.",
  );
  const title = text(post.title, "Post title", 160);
  const summary = text(post.summary, "Post summary", 360);
  const published = date(post.date, "Post date");
  assert(
    categories.includes(post.category),
    "Post category must be Projects, Git & tooling, AI & data or Notes.",
  );
  assert(
    kinds.includes(post.art),
    "Post art must be document, git, ai, vision, audio or web.",
  );
  assert(
    Array.isArray(post.tags) &&
      post.tags.every((tag) => typeof tag === "string" && tag.length <= 40),
    "Post tags must be a list of short strings.",
  );
  assert(
    Array.isArray(post.blocks) && post.blocks.length > 0,
    "Post needs at least one content block.",
  );
  const headings = [],
    assets = [],
    ids = new Set();
  const bodyHtml = post.blocks
    .map((block) => {
      assert(block && typeof block === "object", "Invalid content block.");
      switch (block.type) {
        case "heading": {
          const headingText = text(block.text, "Heading", 200);
          const level = block.level ?? 2;
          assert([2, 3, 4].includes(level), "Heading level must be 2, 3 or 4.");
          const stem = `article-${
            headingText
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") || "section"
          }`;
          let id = stem;
          for (let suffix = 2; ids.has(id); suffix++) id = `${stem}-${suffix}`;
          ids.add(id);
          headings.push({ id, text: headingText, level });
          return `<h${level} id="${id}" tabindex="-1">${esc(headingText)}</h${level}>`;
        }
        case "paragraph":
          return `<p>${inline(block.text)}</p>`;
        case "list": {
          assert(
            Array.isArray(block.items) && block.items.length,
            "List needs items.",
          );
          const tag = block.ordered ? "ol" : "ul";
          return `<${tag}>${block.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`;
        }
        case "code": {
          text(block.code, "Code");
          return `<pre tabindex="0" aria-label="${esc(block.language || "Code example")}"><code>${esc(block.code)}</code></pre>`;
        }
        case "quote":
          return `<blockquote><p>${inline(block.text)}</p>${block.attribution ? `<cite>${esc(text(block.attribution, "Quote attribution", 200))}</cite>` : ""}</blockquote>`;
        case "image": {
          assert(
            /^\/assets\/articles\/[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(webp|png|jpe?g|avif)$/.test(
              block.src,
            ),
            "Images must be local raster files under /assets/articles/.",
          );
          const alt = text(block.alt, "Image alt text", 300);
          assert(
            Number.isInteger(block.width) &&
              block.width > 0 &&
              block.width <= 10000 &&
              Number.isInteger(block.height) &&
              block.height > 0 &&
              block.height <= 10000,
            "Images need positive pixel width and height, at most 10000.",
          );
          assets.push({
            src: block.src,
            width: block.width,
            height: block.height,
          });
          return `<figure><img src="${esc(block.src)}" alt="${esc(alt)}" width="${block.width}" height="${block.height}" loading="lazy" decoding="async">${block.caption ? `<figcaption>${inline(block.caption)}</figcaption>` : ""}</figure>`;
        }
        case "table": {
          assert(
            Array.isArray(block.headers) &&
              block.headers.length > 0 &&
              Array.isArray(block.rows) &&
              block.rows.every(
                (row) =>
                  Array.isArray(row) && row.length === block.headers.length,
              ),
            "Tables need headers and rows of matching length.",
          );
          return `<table tabindex="0">${block.caption ? `<caption>${esc(block.caption)}</caption>` : ""}<thead><tr>${block.headers.map((header) => `<th scope="col">${inline(header)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
        }
        default:
          throw new Error(`Unsupported content block: ${block.type}`);
      }
    })
    .join("\n");
  const words = bodyHtml
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/).length;
  return {
    id: `local-${post.slug}`,
    slug: post.slug,
    localPath: `/blog/${post.slug}`,
    title,
    summary,
    date: published,
    sourceUpdatedAt: post.updated
      ? date(post.updated, "Updated date")
      : published,
    tags: post.tags,
    category: post.category,
    art: post.art,
    readingTime: Math.max(1, Math.ceil(words / 220)),
    featured: post.featured === true,
    draft: post.draft,
    source: "local",
    url: null,
    cover: null,
    assets,
    headings,
    bodyHtml,
  };
}

export async function loadLocalArticles(root) {
  const directory = path.join(root, "content", "posts");
  let filenames;
  try {
    filenames = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const articles = [];
  for (const filename of filenames
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    try {
      const post = JSON.parse(
        await readFile(path.join(directory, filename), "utf8"),
      );
      const article = compileLocalArticle(post);
      assert(
        filename === `${article.slug}.json`,
        "Filename must match the post slug.",
      );
      if (article.draft) continue;
      for (const asset of article.assets)
        await access(path.join(root, asset.src.slice(1)));
      articles.push(article);
    } catch (error) {
      throw new Error(`Invalid local article ${filename}: ${error.message}`, {
        cause: error,
      });
    }
  }
  return articles;
}

export function mergeArticles(imported, local) {
  const articles = [...imported, ...local];
  const paths = new Set();
  for (const article of articles) {
    assert(
      !paths.has(article.localPath),
      `Duplicate article route: ${article.localPath}`,
    );
    paths.add(article.localPath);
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date));
}
