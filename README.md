# Baivab Sarkar — Portfolio

An original, editorial portfolio for a software developer working across Java, JavaScript, open-source products and test automation.

[Production](https://baivabsarkar.pages.dev/) · [GitHub](https://github.com/ThisIs-Developer) · [Writing](https://dev.to/thisisdeveloper)

## Run locally

Node.js 22 or newer is required for the development tools. There are **no runtime dependencies** and no client framework.

```sh
npm ci
npm run build
npm run serve
```

Open `http://127.0.0.1:4173`. The server binds to localhost, supports the extensionless `/project` route, applies Cloudflare `_headers`, and serves the custom 404. To preview the deployment output, use `node scripts/serve.mjs --dir dist --port 4173`.

## Update content

Edit the JSON files in `data/`, then run `npm run build`. Commit both the edited source and generated HTML/SEO files. Do not hand-edit `index.html` or `project.html`; `npm run check` detects drift. The build is deterministic and recreates only the repository's `dist/` directory.

| File | Content |
| --- | --- |
| `data/profile.json` | Introduction, about copy, contact, social URLs and canonical origin |
| `data/projects.json` | Four selected projects, authentic image references, links and engineering notes |
| `data/experiments.json` | Additional archive projects and qualified statuses |
| `data/articles.json` | Curated DEV writing and verified publication metadata |
| `data/experience.json` | Independent projects, training and education |
| `data/skills.json` | Tools grouped by demonstrated use |
| `data/certifications.json` | Resume-backed certifications |
| `scripts/build.mjs` | Shared semantic page templates and metadata |
| `style.css` | Design tokens, layouts, motion, responsive and print styles |
| `script.js` | Progressive mobile navigation, section state, source toggle, filters and clipboard feedback |

Content renders without JavaScript. No GitHub/DEV requests run in the visitor's browser. The source toggle and project filters enhance an already readable page; the email link works even when clipboard access is unavailable. Native `<details>` expose problem, contribution and implementation notes without JavaScript. The decorative commit motif is not a live contributions chart.

## Verify

```sh
npx playwright install chromium
npm run check
npm test
```

The default tests start their own local server and check home/archive at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. They cover overflow, images, landmarks/headings, duplicate IDs, metadata, links, mobile menu, keyboard flow, reduced motion, source toggle, filters, copy fallback, PDF paths, no-JS behavior and automated WCAG A/AA checks.

For the extended browser matrix:

```sh
npx playwright install chromium firefox webkit
npm test -- --browsers all --links
```

`all` also requires locally installed Google Chrome and Microsoft Edge. Use `--browsers chromium,firefox,webkit` on systems without them. Link checks classify sites that block automation separately from dead links. Reports and screenshots go to ignored `.qa-results/`. Tests can target the deployment directory with `npm test -- --dir dist --output .qa-results/dist`.

See [verification notes](docs/verification.md) for actual measured results and limitations; automated accessibility checks complement visual and keyboard review and do not certify WCAG conformance.

Run `npm run build` followed by `npm run test:performance` for Lighthouse on home (mobile and desktop) and archive (mobile). This starts its own server against `dist/`, uses the installed Playwright Chromium, and saves HTML/JSON reports in `.qa-results/lighthouse/`. Run performance measurements separately from the browser matrix to reduce CPU contention.

## Cloudflare Pages

The existing no-build deployment can continue publishing the **repository root** because generated HTML/CSS/JS are committed. Alternatively, use build command `npm run build` and output directory `dist`; `dist` includes only the public files and optimized assets. No Functions, SPA rewrites, environment variables, API keys or server runtime are required.

- Home remains `/`; both `/project.html` and Cloudflare's canonical `/project` remain supported.
- Existing home anchors `#profile`, `#projects`, `#about`, `#experience` and `#contact` remain available.
- `CNAME` and `google67e0cac1e39b6336.html` retain their original contents.
- Both resume URLs serve the supplied latest PDF; the older filename is retained as a static alias.
- `_headers` adds a same-origin content policy, anti-framing protection, referrer controls and one-day asset caching. No third-party script/font/embed is needed.
- Canonical metadata uses the verified `pages.dev` origin. The existing `baivabsarkar.me` domain returned NXDOMAIN during review; this redesign preserves its configuration and does not change DNS.

The PR does not merge or deploy the production branch. Any connected Cloudflare preview is controlled by the repository's existing integration.

The repository also has existing Netlify and Vercel preview integrations. `netlify.toml` and `vercel.json` explicitly build and publish `dist/`. Netlify's account-installed Lighthouse plugin v4 rejects Node 22 and must be updated or removed in that account; the repository already provides current Lighthouse 13 checks. The trial v6 plugin dependency was not retained because its obsolete transitive audit dependencies introduced 13 npm advisories. See verification notes for remote-check status and access limitations.

## Research and assets

- [Design research and audit](docs/design-research.md)
- [Project, resume and article evidence](docs/content-sources.md)
- [Image/font provenance](assets/README.md)

The redesign takes visual quality principles from [jeetcreates.cc](https://jeetcreates.cc/) without reusing its code, layouts, branding or assets. It uses an original paper/ink/moss palette, Space Grotesk with system serif accents, numbered work, a portrait contact sheet and Markdown-inspired details.

The MIT license covers the code. The included font has its own SIL Open Font License. Personal photographs, resume content and project screenshots remain attributed to their respective owners; replace personal material when adapting the portfolio.
