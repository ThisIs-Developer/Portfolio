import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compileLocalArticle } from "./local-articles.mjs";

const title = process.argv[2];
if (!title || title.startsWith("--")) {
  console.error(
    'Usage: node scripts/new-post.mjs "Your article title" [--slug your-article-title]',
  );
  process.exit(1);
}
const slugIndex = process.argv.indexOf("--slug");
const slug =
  slugIndex < 0
    ? title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : process.argv[slugIndex + 1];
const post = {
  slug,
  title,
  summary:
    "Replace this with a short, factual description of what the reader will learn.",
  date: new Date().toISOString().slice(0, 10),
  draft: true,
  featured: false,
  category: "Notes",
  art: "document",
  tags: [],
  blocks: [
    {
      type: "paragraph",
      text: "Introduce the problem, who it affects and why it matters.",
    },
    { type: "heading", text: "The approach" },
    {
      type: "paragraph",
      text: "Describe what you built, the decisions you made and the evidence behind them.",
    },
    { type: "heading", text: "What I learned" },
    {
      type: "paragraph",
      text: "Share the outcome and any useful limitations or next steps.",
    },
  ],
};
compileLocalArticle(post);
const directory = fileURLToPath(new URL("../content/posts/", import.meta.url));
await mkdir(directory, { recursive: true });
const filename = path.join(directory, `${slug}.json`);
await writeFile(filename, `${JSON.stringify(post, null, 2)}\n`, { flag: "wx" });
console.log(
  `Created draft: ${filename}\nEdit its content, set draft to false when ready, then run npm run build.`,
);
