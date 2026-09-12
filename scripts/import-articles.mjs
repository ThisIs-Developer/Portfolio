import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { polishArticle } from "./article-editorial.mjs";

// Run manually when new writing is published. Normal builds use the checked-in
// snapshot and do not contact DEV or require a browser.
const root = fileURLToPath(new URL("../", import.meta.url));
const username = "thisisdeveloper";
const cache = path.join(root, ".qa-results", "article-import");
const assetDirectory = path.join(root, "assets", "articles");
const articlesFile = path.join(root, "data", "articles.json");
const cached = process.argv.includes("--cached");
const selectedArticle = process.argv.includes("--article")
  ? Number(process.argv[process.argv.indexOf("--article") + 1])
  : null;
const editorNotes = {
  1819015:
    "Technical clarification: this project uses a pretrained, quantized Llama 2 model with retrieval. It does not train or fine-tune the model.",
  1817634:
    "Technical clarification: this prototype retrieves passages from a reference PDF and passes them to a pretrained, quantized Llama 2 model. It does not train or fine-tune the model on the PDF. It has not been clinically validated and is not a substitute for professional medical advice.",
};

// This published article has unmatched code fences that hide its second half
// inside a code block. Restore that known section without changing its wording.
export function repairArticleHtml(article) {
  if (
    article.id !== 1817634 ||
    !article.body_html.includes("![ChatBot Conversession img-4]")
  )
    return article.body_html;
  const marker = article.body_html.search(/<h2>\s*<a name="quickstart"/);
  assert(
    marker >= 0,
    "Medical article's malformed section changed; review its formatting before importing.",
  );
  return (
    article.body_html.slice(0, marker) +
    `
<h2><a name="quickstart"></a>🚀 Quickstart</h2>
<ol>
<li>Open Git Bash.</li>
<li>Change the current working directory to the location where you want the cloned directory.</li>
<li>Type <code>git clone</code>, and then paste the URL you copied earlier.
<pre class="highlight shell"><code>git clone https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot.git</code></pre>
<p>Press Enter to create your local clone.</p></li>
<li>Install the pip packages in requirements.txt
<pre class="highlight shell"><code>pip install -r requirements.txt</code></pre></li>
<li>Now run it!
<pre class="highlight shell"><code>chainlit run model.py -w</code></pre></li>
</ol>
<p><img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5ff39l5g3if62ftm0lr9.jpeg" alt="Image description"></p>
<h2><a name="chatbot-conversession"></a>📖 ChatBot Conversession</h2>
<h3>⛓️Chainlit ver. on <a href="https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot/releases/tag/v1.0.1.dev20230913">#v1.0.1.dev20230913</a></h3>
<p><img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rlafb9c4mxegzahjrbxg.png" alt="Image description"></p>
<h3>⚡Streamlit ver. on <a href="https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot/releases/tag/v2.0.1.dev20231230">#v2.0.1.dev20231230</a></h3>
<p><img src="https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot/assets/109382325/583002bd-22a7-4ff0-8982-6067c1bcaade" alt="ChatBot Conversession img-4"></p>
<h3>Video of Conversation</h3>
<p><a href="https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot/assets/109382325/6756fb69-40c0-4d49-b392-aa6906dca786">Video of Conversation</a></p>
<h3>Long Chats</h3>
<p><img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7vidnv2djynyvkzxhmkh.png" alt="ChatBot Conversession img-2"></p>
<p><img src="https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot/assets/109382325/d10d949f-37e5-4ec4-868d-2e62d8ad69dc" alt="ChatBot Conversession img-3"></p>
<h3>PDF</h3>
<p><a href="https://github.com/ThisIs-Developer/Llama-2-GGML-Medical-Chatbot/blob/main/conversession%20e.g/ChatBot%20Conversession%20img-3.pdf">ChatBot Conversession img-3.pdf</a></p>
<p><img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/g0fttj6hsaebhvht0h61.gif" alt="Image description"></p>
<h2><a name="important-notes"></a>📌 Important Notes</h2>
<ul><li>While powerful, this chatbot isn't a substitute for professional medical advice.</li></ul>`
  );
}

// This function runs inside an isolated browser page. It creates a new tree,
// never copies arbitrary HTML attributes, and never inserts source markup into
// the live document. This handles malformed HTML through the platform parser.
export function sanitizeArticle({ html, images, articleLinks, sourceUrl }) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const output = document.implementation.createHTMLDocument("");
  const allowed = new Set([
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "pre",
    "code",
    "strong",
    "b",
    "em",
    "i",
    "s",
    "del",
    "blockquote",
    "br",
    "hr",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "a",
    "img",
    "figure",
    "figcaption",
    "details",
    "summary",
    "sup",
    "sub",
    "kbd",
    "samp",
    "mark",
    "abbr",
  ]);
  const blocked = new Set([
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "math",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "option",
    "object",
    "embed",
    "link",
    "meta",
    "base",
    "title",
    "canvas",
  ]);
  const headings = [];
  const ids = new Set();
  const anchorIds = new Map();
  const safeUrl = (value) => {
    if (!value || /[\u0000-\u0020\u007f]/.test(value.trim())) return null;
    try {
      const url = new URL(value.trim(), sourceUrl);
      if (!["https:", "http:", "mailto:"].includes(url.protocol)) return null;
      if (url.username || url.password) return null;
      const local =
        articleLinks[`${url.origin}${url.pathname.replace(/\/$/, "")}`];
      return local
        ? `${local}${url.hash ? `#article-${url.hash.slice(1)}` : ""}`
        : url.href;
    } catch {
      return null;
    }
  };
  for (const heading of parsed.body.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    if (heading.closest(".c-embed,.ltag__link,.highlight__panel")) continue;
    const name = heading.querySelector("a[name]")?.getAttribute("name");
    const text = heading.textContent.replace(/\s+/g, " ").trim();
    const stem =
      name ||
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      "section";
    let id = `article-${stem}`;
    for (let suffix = 2; ids.has(id); suffix++)
      id = `article-${stem}-${suffix}`;
    ids.add(id);
    if (name) anchorIds.set(name, id);
    if (heading.id) anchorIds.set(heading.id, id);
    heading.dataset.articleHeadingId = id;
  }
  const link = (href, text) => {
    const target = output.createElement("a");
    target.href = href;
    if (!href.startsWith("/") && !href.startsWith("#"))
      target.rel = "noopener noreferrer";
    target.textContent = text;
    return target;
  };
  const appendChildren = (source, target) => {
    for (const child of source.childNodes) target.append(convert(child));
    return target;
  };
  const convert = (node) => {
    if (node.nodeType === Node.TEXT_NODE)
      return output.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE)
      return output.createDocumentFragment();
    const tag = node.localName.toLowerCase();
    if (
      node.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
      blocked.has(tag) ||
      node.matches(".highlight__panel,.js-actions-panel")
    )
      return output.createDocumentFragment();
    if (node.matches(".c-embed,.ltag__link")) {
      const source = node.querySelector("h2 a[href],h3 a[href],a[href]");
      const href = safeUrl(source?.getAttribute("href"));
      if (!href) return output.createDocumentFragment();
      const paragraph = output.createElement("p");
      paragraph.append(
        link(
          href,
          source.textContent.trim() || new URL(href, sourceUrl).hostname,
        ),
      );
      const description = node.querySelector("p")?.textContent.trim();
      if (description)
        paragraph.append(output.createTextNode(` — ${description}`));
      return paragraph;
    }
    if (["iframe", "video", "audio"].includes(tag)) {
      const href = safeUrl(
        node.getAttribute("src") ||
          node.querySelector("source")?.getAttribute("src"),
      );
      if (!href) return output.createDocumentFragment();
      const paragraph = output.createElement("p");
      paragraph.append(
        link(href, node.getAttribute("title") || "Open the original media"),
      );
      return paragraph;
    }
    if (!allowed.has(tag))
      return appendChildren(node, output.createDocumentFragment());
    if (tag === "a") {
      if (
        node.hasAttribute("name") &&
        !node.textContent.trim() &&
        !node.querySelector("img")
      )
        return output.createDocumentFragment();
      // The local image is already full resolution; wrappers need no external navigation.
      if (node.matches(".article-body-image-wrapper"))
        return appendChildren(node, output.createDocumentFragment());
      const raw = node.getAttribute("href");
      const href = raw?.startsWith("#")
        ? `#${anchorIds.get(raw.slice(1)) || raw.slice(1).replace(/[^a-z0-9_-]/gi, "")}`
        : safeUrl(raw);
      if (!href) return appendChildren(node, output.createDocumentFragment());
      return appendChildren(node, link(href, ""));
    }
    if (tag === "img") {
      const image = images[node.getAttribute("src")];
      if (!image) {
        const href = safeUrl(node.getAttribute("src"));
        return href
          ? link(
              href,
              node.getAttribute("alt")?.trim() ||
                "View the original article image",
            )
          : output.createDocumentFragment();
      }
      const result = output.createElement("img");
      result.src = image.src;
      result.width = image.width;
      result.height = image.height;
      result.alt = node.getAttribute("alt")?.trim() || "";
      result.loading = "lazy";
      result.decoding = "async";
      return result;
    }
    const result = output.createElement(tag === "h1" ? "h2" : tag);
    if (["pre", "table"].includes(tag)) result.tabIndex = 0;
    if (/^h[1-6]$/.test(tag)) {
      result.id = node.dataset.articleHeadingId;
      headings.push({
        id: result.id,
        text: node.textContent.replace(/\s+/g, " ").trim(),
        level: Number(result.tagName.slice(1)),
      });
    }
    if (tag === "ol" && /^\d{1,5}$/.test(node.getAttribute("start") || ""))
      result.setAttribute("start", node.getAttribute("start"));
    if (["th", "td"].includes(tag)) {
      for (const attribute of ["colspan", "rowspan"]) {
        const value = Number(node.getAttribute(attribute));
        if (Number.isInteger(value) && value > 1 && value < 100)
          result.setAttribute(attribute, String(value));
      }
      if (tag === "th")
        result.setAttribute("scope", node.closest("thead") ? "col" : "row");
    }
    if (tag === "code") {
      const language = (node.parentElement?.className || "").match(
        /\bhighlight\s+(\w+)/,
      )?.[1];
      if (language) result.setAttribute("data-language", language);
    }
    return appendChildren(node, result);
  };
  appendChildren(parsed.body, output.body);
  return { bodyHtml: output.body.innerHTML.trim().replace(/[\t ]+$/gm, ""), headings };
}

async function get(url, type = "json") {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: {
        Accept:
          type === "json"
            ? "application/vnd.forem.api-v1+json"
            : "image/webp,image/png,image/jpeg,image/gif;q=0.9",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 429 && attempt < 3) {
      const delay = Math.max(
        1,
        Math.min(30, Number(response.headers.get("retry-after")) || 10),
      );
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      continue;
    }
    if (!response.ok)
      throw new Error(`${response.status} while importing ${url}`);
    return type === "json" ? response.json() : response;
  }
}

async function snapshot(name, url) {
  const file = path.join(cache, `${name}.json`);
  if (cached) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      /* Fetch missing cache entries. */
    }
  }
  const data = await get(url);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

async function selfTest(page) {
  const sourceUrl = "https://dev.to/thisisdeveloper/example";
  const output = await page.evaluate(sanitizeArticle, {
    html: '<h2><a name="hello"></a>Hello</h2><p onclick="alert(1)">Safe <strong>text</strong><a href="javascript:alert(1)">bad</a><a href="&#106;avascript:alert(1)">encoded</a><a href="#hello">jump</a><img src="https://images.example/a.png" onerror="alert(1)" style="position:fixed" alt="example"></p><script>alert(1)</script><iframe src="https://example.com/video"></iframe><form>discard<input></form><svg><a href="javascript:alert(1)">discard</a></svg><pre><code>&lt;script&gt;safe code&lt;/script&gt;</code></pre><p><a href="https://dev.to/thisisdeveloper/other">other article</a></p>',
    images: {
      "https://images.example/a.png": {
        src: "/assets/articles/example.png",
        width: 800,
        height: 400,
      },
    },
    articleLinks: { "https://dev.to/thisisdeveloper/other": "/blog/other" },
    sourceUrl,
  });
  assert(
    !/<(?:script|iframe|form|svg)\b|javascript:|\bon(?:click|error)=|\bstyle=/.test(
      output.bodyHtml,
    ),
  );
  assert(output.bodyHtml.includes("&lt;script&gt;safe code&lt;/script&gt;"));
  assert(output.bodyHtml.includes('href="/blog/other"'));
  assert(output.bodyHtml.includes('href="#article-hello"'));
  assert(output.bodyHtml.includes('width="800" height="400"'));
  assert.deepEqual(output.headings, [
    { id: "article-hello", text: "Hello", level: 2 },
  ]);
  const repaired = repairArticleHtml({
    id: 1817634,
    body_html:
      '<p>Opening text.</p><h2><a name="quickstart"></a>Quickstart</h2><pre><code>![ChatBot Conversession img-4]</code></pre>',
  });
  const medical = await page.evaluate(sanitizeArticle, {
    html: repaired,
    images: {},
    articleLinks: {},
    sourceUrl,
  });
  assert(medical.bodyHtml.startsWith("<p>Opening text.</p>"));
  assert(
    medical.headings.some(
      (heading) => heading.id === "article-chatbot-conversession",
    ),
  );
  assert(
    medical.headings.some(
      (heading) => heading.id === "article-important-notes",
    ),
  );
  assert.equal((medical.bodyHtml.match(/<pre\b/g) || []).length, 3);
  assert(
    medical.bodyHtml.includes('<pre tabindex="0">'),
    "Code blocks support keyboard scrolling",
  );
  assert(!medical.bodyHtml.includes("![ChatBot"));
  console.log(
    "Article sanitizer: executable markup removed; text, code, local images and internal links preserved.",
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // Parsing source HTML must not trigger requests to any embedded resource.
  await page.route("**/*", (route) => route.abort());
  try {
    await selfTest(page);
    if (process.argv.includes("--self-test")) return;
    await mkdir(cache, { recursive: true });
    await mkdir(assetDirectory, { recursive: true });
    const existing = JSON.parse(await readFile(articlesFile, "utf8"));
    const prior = new Map(existing.map((article) => [article.url, article]));
    const listing = await snapshot(
      "listing",
      `https://dev.to/api/articles?username=${username}&per_page=100`,
    );
    assert(
      Array.isArray(listing) && listing.length,
      "DEV returned no articles; existing data was kept.",
    );
    assert(
      listing.every((article) => article.user.username === username),
      "Unexpected author in DEV response.",
    );
    if (selectedArticle !== null)
      assert(
        Number.isInteger(selectedArticle) &&
          listing.some((article) => article.id === selectedArticle),
        "Unknown --article id.",
      );
    const articleLinks = Object.fromEntries(
      listing.map((article) => [article.url, `/blog/${article.slug}`]),
    );
    const localAssets = await readdir(assetDirectory);
    const imported = [];
    let imageCount = 0;
    for (const summary of listing.sort((a, b) =>
      b.published_at.localeCompare(a.published_at),
    )) {
      if (selectedArticle !== null && summary.id !== selectedArticle) continue;
      assert(/^[a-z0-9-]+$/.test(summary.slug), "Unsafe article slug.");
      const article = await snapshot(
        String(summary.id),
        `https://dev.to/api/articles/${summary.id}`,
      );
      assert(
        article.user.username === username && article.body_html,
        "Unexpected article response.",
      );
      const sourceHtml = repairArticleHtml(article);
      const refs = await page.evaluate((html) => {
        const body = new DOMParser().parseFromString(html, "text/html").body;
        return [...body.querySelectorAll("img[src]")]
          .filter((image) => !image.closest(".c-embed,.ltag__link"))
          .map((image) => image.getAttribute("src"));
      }, sourceHtml);
      const images = {};
      for (const url of [
        ...new Set([article.cover_image, ...refs].filter(Boolean)),
      ]) {
        if (new URL(url).protocol !== "https:") continue;
        const role =
          url === article.cover_image
            ? "cover"
            : createHash("sha256").update(url).digest("hex").slice(0, 12);
        const cachedAsset =
          cached &&
          (localAssets.find(
            (filename) => filename === `${article.id}-${role}.webp`,
          ) ||
            localAssets.find((filename) =>
              filename.startsWith(`${article.id}-${role}.`),
            ));
        const response = cachedAsset ? null : await get(url, "image");
        const mime = cachedAsset
          ? {
              ".webp": "image/webp",
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".gif": "image/gif",
              ".avif": "image/avif",
            }[path.extname(cachedAsset)]
          : response.headers.get("content-type")?.split(";")[0];
        const extension = {
          "image/webp": "webp",
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/gif": "gif",
          "image/avif": "avif",
        }[mime];
        assert(extension, `Unsupported article image type ${mime}`);
        const bytes = cachedAsset
          ? await readFile(path.join(assetDirectory, cachedAsset))
          : Buffer.from(await response.arrayBuffer());
        assert(bytes.length < 12_000_000, "Article image exceeds 12 MB.");
        const optimized = await page.evaluate(
          async ({ base64, type, limit }) => {
            const bytes = Uint8Array.from(atob(base64), (char) =>
              char.charCodeAt(0),
            );
            const image = await createImageBitmap(new Blob([bytes], { type }));
            const width = Math.min(image.width, limit);
            const height = Math.round((image.height * width) / image.width);
            const result = { width, height };
            if (type !== "image/webp" || image.width > limit) {
              const canvas = new OffscreenCanvas(width, height);
              canvas.getContext("2d").drawImage(image, 0, 0, width, height);
              const blob = await canvas.convertToBlob({
                type: "image/webp",
                quality: 0.84,
              });
              result.bytes = Array.from(
                new Uint8Array(await blob.arrayBuffer()),
              );
            }
            image.close();
            return result;
          },
          {
            base64: bytes.toString("base64"),
            type: mime,
            limit: role === "cover" ? 1000 : 800,
          },
        );
        const filename = `${article.id}-${role}.webp`;
        if (!cachedAsset || optimized.bytes)
          await writeFile(
            path.join(assetDirectory, filename),
            optimized.bytes ? Buffer.from(optimized.bytes) : bytes,
          );
        images[url] = {
          src: `/assets/articles/${filename}`,
          width: optimized.width,
          height: optimized.height,
        };
        imageCount++;
      }
      let sanitized = await page.evaluate(sanitizeArticle, {
        html: sourceHtml,
        images,
        articleLinks,
        sourceUrl: article.url,
      });
      const editorial = JSON.parse(await readFile(path.join(root,'data/article-editorial.json'),'utf8'))[article.id];
      sanitized = await page.evaluate(polishArticle,{...sanitized,editorial});
      const previous = prior.get(article.url);
      const cleanTitle = article.title
        .replace(
          /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\s]+|[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\s]+$/gu,
          "",
        )
        .trim();
      imported.push({
        id: article.id,
        title: editorial?.title || previous?.title || cleanTitle,
        originalTitle: article.title,
        slug: article.slug,
        localPath: `/blog/${article.slug}`,
        url: article.url,
        date: article.published_at.slice(0, 10),
        sourceUpdatedAt: article.edited_at || article.published_at,
        tags: article.tags || summary.tag_list,
        readingTime: article.reading_time_minutes,
        summary: editorial?.summary || previous?.summary || article.description,
        ...(previous?.editorialUpdated ? {editorialUpdated:previous.editorialUpdated} : {}),
        featured: previous ? (previous.featured ?? true) : false,
        cover: images[article.cover_image]
          ? {
              ...images[article.cover_image],
              alt: `${cleanTitle} — article cover`,
            }
          : null,
        ...(editorNotes[article.id]
          ? { editorNote: editorNotes[article.id] }
          : {}),
        assets: Object.entries(images).map(([source, image]) => ({
          source,
          ...image,
        })),
        ...sanitized,
      });
      console.log(
        `Imported ${article.id}: ${cleanTitle} (${sanitized.headings.length} sections, ${refs.length} body images).`,
      );
    }
    const result =
      selectedArticle === null
        ? imported
        : existing.map(
            (article) =>
              imported.find((updated) => updated.id === article.id) || article,
          );
    await writeFile(articlesFile, `${JSON.stringify(result, null, 2)}\n`);
    console.log(
      `Saved ${imported.length} complete articles and ${imageCount} local images.`,
    );
  } finally {
    await browser.close();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
