# Publishing articles

The website has its own article publishing workflow. New posts are authored in `content/posts/`; the checked-in legacy article collection remains in `data/articles.json`. Builds merge both collections by publication date. No external publishing service is needed.

## Send an article brief

Provide these details to the coding assistant, or use them when filling in a draft:

- Title and a two-sentence summary.
- Publication date, and whether this is a draft or ready to publish.
- The reader's problem and what the article should help them do.
- Your actual implementation, decisions, examples, results and limitations.
- Sections, code snippets, source links and screenshots with captions.
- Category: Projects, Git & tooling, AI & data, or Notes.

Use verified details. The template should not be treated as evidence for project results or measurements.

## Create and publish

```sh
node scripts/new-post.mjs "Building a better document workflow"
```

This creates `content/posts/building-a-better-document-workflow.json` as a draft. An existing file is never overwritten. Use `--slug your-chosen-slug` for a custom URL.

Edit the file. Keep its filename equal to its slug, and keep the slug stable after publishing so existing links continue to work. Set `draft: false` when the article is ready, then run:

```sh
npm run build
npm run check
```

Review `/blog` and `/blog/your-slug` locally. Commit and push the content file and generated pages through the existing PR/deployment workflow. Draft files are never copied into the public website, and draft articles are excluded from cards, readers and the sitemap.

## Post format

```json
{
  "slug": "a-new-article",
  "title": "Your article title",
  "summary": "A concise, factual description of what the reader will learn.",
  "date": "2026-09-09",
  "draft": true,
  "featured": false,
  "category": "Projects",
  "art": "document",
  "tags": ["javascript"],
  "blocks": [
    { "type": "paragraph", "text": "Your opening paragraph." },
    { "type": "heading", "text": "The approach" },
    { "type": "paragraph", "text": ["Read the ", { "text": "project details", "href": "/work/markdown-viewer" }, " for context."] },
    { "type": "list", "items": ["First point.", "Second point."] },
    { "type": "code", "language": "JavaScript", "code": "const message = 'Hello';\nconsole.log(message);" }
  ]
}
```

`featured: true` makes the post eligible for the three most recent featured articles on the homepage. `updated` optionally records a later date in `YYYY-MM-DD` format. Reading time and section navigation are generated automatically.

Artwork is generated locally from original vector compositions. Choose `document`, `git`, `ai`, `vision`, `audio`, or `web`; no cover upload is required. Imported covers are not used in the article cards or headers. Existing screenshots within article bodies remain available.

## Content blocks

| Type | Fields |
| --- | --- |
| `heading` | `text`; optional `level` of 2, 3 or 4. Level 2 headings appear in the table of contents. |
| `paragraph` | `text`, as a string or rich-text array. |
| `list` | `items`, each a string or rich-text array; optional `ordered: true`. |
| `code` | `code` with preserved line breaks; optional `language` label. |
| `quote` | `text`; optional `attribution`. |
| `image` | `src`, `alt`, pixel `width` and `height`; optional `caption`. |
| `table` | `headers` and `rows` with the same number of cells; optional `caption`. |

Rich-text arrays combine strings with objects such as `{ "text": "project", "href": "/work/markdown-viewer" }` or `{ "text": "important", "emphasis": "strong" }`. Emphasis may be `strong`, `em`, or `code`. Links support local paths, section anchors, HTTPS and email URLs. Raw HTML is escaped, so pasted markup cannot execute in the reader.

Put article images under `assets/articles/` and reference them with an absolute site path, for example `/assets/articles/my-post/screenshot.webp`. Supply real dimensions, meaningful alt text and any necessary attribution. Published builds reject missing files. Use WebP when possible and resize large screenshots before adding them.

The manual historical article importer remains available for refreshing older posts; it is separate from this local authoring workflow. It preserves curated titles and summaries.
