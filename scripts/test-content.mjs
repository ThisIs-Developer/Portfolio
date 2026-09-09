import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  compileLocalArticle,
  loadLocalArticles,
  mergeArticles,
} from "./local-articles.mjs";
const post = {
  slug: "test-post",
  title: "An example",
  summary: "A factual summary.",
  date: "2026-09-09",
  draft: false,
  category: "Projects",
  art: "document",
  tags: ["javascript"],
  blocks: [
    { type: "paragraph", text: "<script>alert(1)</script>" },
    { type: "heading", text: "The approach" },
    { type: "heading", text: "The approach" },
    {
      type: "code",
      language: "JavaScript",
      code: "const value = 1;\nconsole.log(value);",
    },
    {
      type: "paragraph",
      text: ["Read ", { text: "the project", href: "/work/markdown-viewer" }],
    },
  ],
};
const article = compileLocalArticle(post);
assert(!article.bodyHtml.includes("<script>"));
assert(article.bodyHtml.includes("&lt;script&gt;"));
assert(article.bodyHtml.includes("const value = 1;\nconsole.log(value);"));
assert.equal(article.headings[1].id, "article-the-approach-2");
assert(article.bodyHtml.includes('href="/work/markdown-viewer"'));
for (const href of [
  "javascript:alert(1)",
  "//malicious.test",
  "/\\malicious.test",
  "data:text/html,<script>",
])
  assert.throws(() =>
    compileLocalArticle({
      ...post,
      blocks: [{ type: "paragraph", text: [{ text: "bad", href }] }],
    }),
  );
for (const patch of [
  { slug: "../bad" },
  { date: "2026-02-31" },
  { draft: undefined },
  {
    blocks: [
      {
        type: "image",
        src: "/assets/articles/../../secret.png",
        alt: "Image",
        width: 1,
        height: 1,
      },
    ],
  },
])
  assert.throws(() => compileLocalArticle({ ...post, ...patch }));
assert.throws(() => mergeArticles([article], [article]), /Duplicate/);
const temporary = await mkdtemp(path.join(tmpdir(), "portfolio-posts-"));
try {
  await mkdir(path.join(temporary, "content/posts"), { recursive: true });
  await writeFile(
    path.join(temporary, "content/posts/test-post.json"),
    JSON.stringify({ ...post, draft: true }),
  );
  assert.equal((await loadLocalArticles(temporary)).length, 0);
  await writeFile(
    path.join(temporary, "content/posts/test-post.json"),
    JSON.stringify(post),
  );
  assert.equal(
    (await loadLocalArticles(temporary))[0].localPath,
    "/blog/test-post",
  );
  await writeFile(
    path.join(temporary, "content/posts/test-post.json"),
    JSON.stringify({
      ...post,
      blocks: [
        {
          type: "image",
          src: "/assets/articles/missing.webp",
          alt: "Missing example",
          width: 800,
          height: 400,
        },
      ],
    }),
  );
  await assert.rejects(loadLocalArticles(temporary), /Invalid local article/);
} finally {
  if (
    path.dirname(temporary) !== path.resolve(tmpdir()) ||
    !path.basename(temporary).startsWith("portfolio-posts-")
  )
    throw Error("Invalid temporary path");
  await rm(temporary, { recursive: true, force: true });
}
console.log(
  "Article authoring checks passed: drafts, publication, links, markup escaping, dates, routes, code and missing images.",
);
