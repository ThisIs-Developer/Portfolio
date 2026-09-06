# Redesign verification

Measured **6 September 2026** on Windows, Node.js 24.19, Playwright 1.63.0, axe-core 4.13.0 and Lighthouse 13.4.1. Tests target the generated `dist/` directory through the included localhost server, with the repository's Cloudflare `_headers` applied.

**Final result: 132 checks passed, 0 failed.** All four automated WCAG scans reported zero violations, and the additional visible-label/accessibility-name checks passed. `npm run check`, `npm run build`, the Lighthouse runner and staged whitespace validation also passed.

## Browser and interaction coverage

| Browser | Tested version | Coverage |
| --- | --- | --- |
| Chromium | 153.0.8010.12 | Responsive matrix, interactions, accessibility, reduced motion, no JavaScript |
| Firefox | 155.0 | Responsive matrix, interactions, reduced motion, no JavaScript |
| WebKit | 26.6 | Responsive matrix, interactions, reduced motion, no JavaScript |
| Google Chrome | 152.0.7977.82 | Responsive matrix, interactions, reduced motion, no JavaScript |
| Microsoft Edge | 152.0.4191.66 | Responsive matrix, interactions, reduced motion, no JavaScript |

Both home and archive are exercised at **320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px**: 100 browser/page/width combinations. Checks inspect horizontal overflow, image loading and dimensions, meaningful alt attributes, unique IDs, a single H1, visible main content and browser/local-network errors.

Interaction coverage includes mobile-menu open/close, Escape and restored focus, navigation closing the menu, the first-Tab skip link and Enter activation, README source/preview state, denied clipboard feedback, native engineering-note disclosures and every archive filter. Reduced-motion and JavaScript-disabled checks run in every browser. The no-JavaScript checks cover both pages and navigation.

The skip link has an explicit `tabindex="0"` so it remains the first Tab stop in WebKit's default link-navigation configuration. The wordmark derives its accessible name from the visible text. Four axe scans cover home/archive at 390/1440px with WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rules, plus a separate visible-label/accessibility-name check.

Visual review covered desktop, tablet and mobile hero, project screenshots, engineering details, about/source view, timeline, writing and contact. QA corrected mismatched secondary-image frames, missing spaces around responsive line breaks and the hidden skip link's clipping. Committed review images: [desktop](screenshots/home-1440.png), [tablet](screenshots/home-768.png), [mobile](screenshots/home-390.png). Full-page captures for each engine are generated with the test reports.

## Performance

These are **local laboratory measurements**, not production Core Web Vitals or physical-device results. Runs use Lighthouse's default simulated mobile throttling and desktop preset, with no browser matrix running concurrently. Scores can vary with host load and browser version.

| Page / profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / mobile | 94 | 100 | 100 | 100 | 1.1 s | 1.5 s | 280 ms | 0 |
| Home / desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.4 s | 20 ms | 0 |
| Archive / mobile | 96 | 100 | 100 | 100 | 1.1 s | 1.2 s | 230 ms | 0 |

Final reports have no Lighthouse runtime errors or warnings. Recorded transfer totals were 232 KiB for mobile home, 340 KiB for desktop home and 81 KiB for mobile archive. These are the resources requested during each audit, not every optional responsive image or the PDF. The earlier live site's observed 6.62 MB transfer was collected under different conditions and is not an equivalent controlled benchmark.

The redesign removes the blocking preloader and runtime framework/API needs. It uses one 22,288-byte local variable font, a roughly 4.8 KB progressive script, responsive WebP screenshots, a 10.5 KB small portrait, explicit image dimensions, lazy below-fold images and a high-priority portrait. Rendering remains independent of animation and JavaScript. Source CSS stays readable; the remaining minification suggestion is approximately 4 KiB. One-day asset caching supports updates to stable filenames; Cloudflare controls compression and actual production response timing.

`npm run test:performance` reproduces all three final audits against `dist/`. Its Playwright-managed browser avoids the Windows temporary-directory cleanup error encountered with Lighthouse's standalone launcher; the final script exited successfully. JSON and HTML reports are written to ignored `.qa-results/lighthouse/`.

## Content, links and deployment

- Resume, education, training and certifications were cross-checked with the supplied PDF. Project claims, contribution scope, dates and DEV metadata are documented in [content sources](content-sources.md). No employment, testimonials or performance metrics were invented.
- Fifteen of twenty external URLs returned HTTP 200 in the final link sweep: the GitHub profile, nine repositories and five project websites. LinkedIn returned 999; DEV profile and article pages returned 403 to that automated client. Earlier direct checks returned 200 for DEV, and the public DEV API supplied the article records. These restrictions are recorded as restricted access rather than dead links. No email was sent, and external application backends/wallet flows were not exhaustively retested.
- All 13 distinct local links/fragments resolve. `/`, `/index.html`, `/project`, `/project.html`, `robots.txt`, `sitemap.xml`, the custom 404 and both PDF URLs are checked. PDF byte-range responses are valid; hidden repository paths are blocked by the local preview server.
- The supplied PDF and both public resume filenames have identical SHA-256: `08f8cad9ebb007de02e6874302f04db3f17be7d8e8f7626e98f0d9ee98099d09`.
- Titles, descriptions, canonical URLs, Open Graph/Twitter metadata, preview image references and valid JSON-LD are verified for both pages. Existing `CNAME` and Google verification file contents are preserved.
- Generated files are checked for drift. The build publishes static files without Functions, secrets or environment variables. The existing root deployment remains usable, with `dist/` available for an explicit build configuration. GitHub Actions installs Chromium and repeats the build, consistency and browser checks on pull requests.

## Remote PR checks

The initial redesign commit `f2c83f9` passed GitHub's Ubuntu/Node 24 build and browser workflow, GitGuardian, and Cloudflare Pages deployment. The [Cloudflare preview](https://104ae033.baivabsarkar.pages.dev/) returned 200 for home, archive and the latest PDF with the configured content policy. A browser smoke test verified its mobile navigation and README toggle without page errors.

The existing Netlify integration failed before the site build because its UI-installed Lighthouse plugin v4 required Node below 20, while its host ran 22.23.2. `netlify.toml` declares the build/output directory. A trial of plugin 6.0.4 supported the host's Node version but introduced 13 npm advisories through its old Lighthouse/Puppeteer dependencies, so that dependency was not retained. Updating or removing the account-installed plugin requires authenticated Netlify access, unavailable here. The repository's standalone Lighthouse 13 checks remain available. [Netlify documents plugin management](https://docs.netlify.com/extend/install-and-use/build-plugins/); the [failed build log](https://app.netlify.com/projects/baivabsarkar/deploys/6a9d45c64947bf0008492529) records the exact engine conflict.

The existing Vercel preview also initially failed, but its detailed logs require authentication unavailable in this session. `vercel.json` now explicitly selects the static build and `dist/` output, following [Vercel's configuration documentation](https://vercel.com/docs/project-configuration). The initial Vercel root cause is unconfirmed. Current remote status is visible on [PR #1](https://github.com/ThisIs-Developer/Portfolio/pull/1).

## Limits of verification

WebKit on Windows is automated engine coverage; an actual Safari installation, physical iPhone/iPad/Android device and assistive-technology session were not available. Automated accessibility checks and keyboard review do not certify full WCAG conformance. Clipboard denial was tested; browser permission policy can affect successful copying, while the email link and selectable address remain usable.

The existing custom domain returned NXDOMAIN during research, so canonical metadata uses the reachable `baivabsarkar.pages.dev` origin. This change preserves `CNAME` and does not alter DNS. Cloudflare account settings and production deployment were not changed. The repository's existing integration controls any PR preview; production deployment requires merging the PR through the normal workflow.

## Reproduce

```sh
npm ci
npm run check
npm run build
npx playwright install chromium firefox webkit
npm test -- --dir dist --output .qa-results/release --browsers all
npm test -- --dir dist --output .qa-results/links --browsers chromium --links
npm run test:performance
```

The `all` matrix additionally needs installed Chrome and Edge. Use `--browsers chromium,firefox,webkit` where they are unavailable. The performance command should run separately from other browser tests. `.qa-results/`, `dist/` and `node_modules/` stay out of Git; the committed screenshots and this report provide concise review evidence.
