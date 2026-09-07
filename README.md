# Baivab Sarkar — Portfolio

A portfolio for Baivab Sarkar, a software developer working across Java, JavaScript, open-source products and test automation. Its visual direction closely adapts [jeetcreates.cc](https://jeetcreates.cc/): centered serif typography, translucent pastel project folders, handwritten details, a floating navigation dock, and a dark, playful contact section.

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
| `data/projects.json` | Four core projects, authentic image references, links and engineering notes |
| `data/experiments.json` | Five additional projects and qualified statuses; AMS and SketchFlow also appear in the six home folders |
| `data/articles.json` | Curated DEV writing and verified publication metadata |
| `data/experience.json` | Independent projects, training and education |
| `data/skills.json` | Maintained inventory of tools grouped by demonstrated use |
| `data/certifications.json` | Resume-backed certifications |
| `scripts/build.mjs` | Data loading, metadata, deterministic output and public-file packaging |
| `scripts/templates.mjs` | Shared semantic layouts, six-folder selection, capability copy and project archive |
| `style.css` | Design tokens, layouts, motion, responsive and print styles |
| `script.js` | Progressive navigation, theme toggle, local Quick ask answers, filters and clipboard feedback |
| `game.js` | Optional Bug Run canvas game, keyboard/touch controls and local best score |

Content renders without JavaScript. No GitHub/DEV requests run in the visitor's browser. Native `<details>` expose capabilities, experience, and project engineering notes; folder links lead to matching archive entries. The email link works even when clipboard access is unavailable. Navigation, filters, and theme selection enhance an already readable page.

“Quick ask” provides curated local answers about Baivab's projects, skills, education, experience, writing, location, and contact details. It does not call an AI service or send the question anywhere. Keep its answers in `script.js` synchronized when changing those facts. Visible capability rows are maintained in `scripts/templates.mjs`.

Bug Run is an optional game in the contact section. It begins on user input and supports keyboard/touch play, pause, and reset. The theme preference and best score use local browser storage when available; storage failure does not prevent the page or game from working.

## Verify

```sh
npx playwright install chromium
npm run check
npm test
```

The default tests start their own local server and check home/archive at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. They cover overflow, images, landmarks/headings, duplicate IDs, metadata, links, navigation, keyboard flow, reduced motion, archive filters, copy fallback, PDF paths, no-JS behavior and automated WCAG A/AA checks. The revised interaction checks cover theme persistence, folder destinations, capability disclosures, Quick ask answers, and game controls.

For the extended browser matrix:

```sh
npx playwright install chromium firefox webkit
npm test -- --browsers all --links
```

`all` also requires locally installed Google Chrome and Microsoft Edge. Use `--browsers chromium,firefox,webkit` on systems without them. Link checks classify sites that block automation separately from dead links. Reports and screenshots go to ignored `.qa-results/`. Tests can target the deployment directory with `npm test -- --dir dist --output .qa-results/dist`.

See [verification notes](docs/verification.md) for dated measured results and limitations. The final reference-adapted revision has its own browser, accessibility, visual and performance evidence. Automated accessibility checks complement visual and keyboard review and do not certify WCAG conformance.

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

The repository also has existing Netlify and Vercel preview integrations. `netlify.toml` and `vercel.json` explicitly build and publish `dist/`. The first PR's Netlify check was blocked by its account-installed Lighthouse v4 plugin rejecting Node 22; the account integration needs an update or removal of that plugin. The repository provides Lighthouse 13 checks without that plugin dependency. See verification notes for dated remote-check status and access limitations.

## Research and assets

- [Design research and audit](docs/design-research.md)
- [Direct visual reference measurements](docs/reference-style-audit.md)
- [Project, resume and article evidence](docs/content-sources.md)
- [Image/font provenance](assets/README.md)

The design intentionally follows the reference's composition, typography, spacing, color, folder geometry, and motion closely. It uses Instrument Serif, Instrument Sans, and Nanum Pen Script from official Google Fonts distributions, self-hosted with their licenses. Baivab's name, portrait, project screenshots, source-backed content, and contact details replace the reference creator's material. The previous paper-and-moss direction is superseded.

The MIT license covers the code. Included fonts have their own SIL Open Font Licenses. Personal photographs, resume content and project screenshots remain attributed to their respective owners; replace personal material when adapting the portfolio.
