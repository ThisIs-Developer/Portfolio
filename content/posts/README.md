# Writing a new article

Posts in this folder belong to the website. Publishing does not require an external blogging account, API key or network request.

Create a draft from the repository root:

```sh
node scripts/new-post.mjs "Your article title"
```

Edit the generated JSON file, then set `draft` to `false` and run `npm run build`. The build validates content, adds the article to `/blog`, creates its reader and includes it in the sitemap. Drafts stay out of the public build. Commit and push the change to publish through the existing deployment pipeline.

See [the authoring guide](../../docs/publishing-articles.md) for supported content and a ready-to-use example. You can also supply article details in plain text to the coding assistant using the brief in that guide.
