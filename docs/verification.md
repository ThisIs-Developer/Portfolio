# Portfolio verification

## 9 September refinement

The latest revision removes decorative borders and dot bleed over controls, adds a Cloudflare Workers AI fact-selection endpoint, polishes all eleven local articles, introduces native article authoring, and replaces the playground and Interactions demos.

- The local Chromium suite completed 60 passing checks and identified five failures: four contrast scans for the same three demo labels, and one overly broad Quick Ask match. Both causes were corrected. A subsequent targeted run passed all nine groups, including the four corrected light/dark scans, Quick Ask topic restrictions and network fallback, all eleven updated article readers, ten additional responsive views at 320/768px and focus-timer completion. There were no browser exceptions.
- Five separate surface checks passed: dots fade over controls, opaque button surfaces, no mouse-focus rectangles, retained keyboard focus, homepage light/dark accessibility and twelve responsive views. The current widget controls, all six interaction demos, mobile List view, local persistence, reduced motion and no-JavaScript reading passed in the main browser suite.
- Article-authoring validation passed for drafts, publishing, duplicate routes, safe links, escaped markup, dates, code blocks and missing images. Nine server-side Quick Ask groups passed, including invalid model output, topic restrictions, unavailable inference, request validation and burst handling. The article sanitizer and generated-file checks passed; npm audit found no vulnerabilities.
- Wrangler 4.130.0 successfully compiled the Pages Function. Local tests exercise the honest portfolio fallback and a simulated AI binding. Actual deployment/inference results are recorded on [PR #1](https://github.com/ThisIs-Developer/Portfolio/pull/1). The Linux workflow reruns the complete suite on Chromium, Firefox and WebKit.
- Desktop and mobile visual review covered the revised blog, article reader, all widgets, all interaction demos, Quick Ask and Bug Run. New article artwork is original vector code, with no imported cover images in the cards or reading headers.

Reports are generated under `.qa-results/refinements`, `.qa-results/refinements-final` and `.qa-results/surface-polish`. Historical lab performance scores below belong to the 8 September build; they are not measurements of this update.

## 8 September baseline

Verified on Windows with Node.js 24.19, Playwright 1.63.0, axe-core 4.13.0 and Lighthouse 13.4.1. The following baseline covers the initial complete multipage revision.

## Functional and responsive checks

- **65 Chromium/shared checks passed, zero Chromium failures**, including 10 page families at 390/1440px, navigation, local readers, collection filters/search/sort, clipboard, theme persistence, keyboard controls, cursor dots and game behavior. All 12 listed projects and 11 full articles were opened in their local readers.
- **40 light/dark axe scans returned zero automated WCAG A/AA violations**, with separate visible-label/accessibility-name checks. Article code blocks and tables support keyboard scrolling.
- The final independent sweep checked **31 sitemap routes and 44 responsive views** across 320, 390, 768 and 1440px, including enterprise details. It found no horizontal overflow, broken images or browser exceptions. It also checked all article bodies, malformed playground storage, touch behavior, the JavaScript-free card layout, actual 404 responses and the resume hash.
- **136 local links and fragments resolved.** Generated-file consistency, article sanitizer self-tests, whitespace validation and npm audit passed; npm reported zero vulnerabilities.
- JavaScript-disabled navigation, projects and articles remain readable. The playground becomes a normal card grid. Reduced motion disables decorative animation, and touch devices do not create the pointer-dot canvas.

The Windows Firefox run stalled with `RenderCompositorSWGL failed mapping default framebuffer`; the stuck test browser was terminated and its remaining checks did not complete. This is not recorded as a Firefox pass. The PR workflow runs Chromium, Firefox and WebKit on Ubuntu at 320/390/768/1440px, with screenshots and reports uploaded as artifacts. Consult the current [PR checks](https://github.com/ThisIs-Developer/Portfolio/pull/1/checks) for the independent Linux result. Physical devices and screen-reader sessions were not available; automated scans are not a conformance certification.

## Visual review

Review covered full page structures and reading content, then refined cropped covers, card alignment, the mobile playground/menu clearance, section navigation, placeholders and the cursor response. The supplied video was inspected for motion and interaction details.

| Page | Desktop | Mobile |
| --- | --- | --- |
| home | [Desktop](screenshots/home-1440.webp) | [Mobile](screenshots/home-390.webp) |
| about | [Desktop](screenshots/about-1440.webp) | [Mobile](screenshots/about-390.webp) |
| work | [Desktop](screenshots/work-1440.webp) | [Mobile](screenshots/work-390.webp) |
| blog | [Desktop](screenshots/blog-1440.webp) | [Mobile](screenshots/blog-390.webp) |
| article | [Desktop](screenshots/article-1440.webp) | [Mobile](screenshots/article-390.webp) |
| tools | [Desktop](screenshots/tools-1440.webp) | [Mobile](screenshots/tools-390.webp) |
| playground | [Desktop](screenshots/playground-1440.webp) | [Mobile](screenshots/playground-390.webp) |
| interactions | [Desktop](screenshots/interactions-1440.webp) | [Mobile](screenshots/interactions-390.webp) |
| work enterprise | [Desktop](screenshots/work-enterprise-1440.webp) | [Mobile](screenshots/work-enterprise-390.webp) |
| work markdown viewer | [Desktop](screenshots/work-markdown-viewer-1440.webp) | [Mobile](screenshots/work-markdown-viewer-390.webp) |
| 404 | [Desktop](screenshots/404-1440.webp) | [Mobile](screenshots/404-390.webp) |

## Performance

These are local Lighthouse lab measurements with simulated mobile throttling, collected with functional browser tests idle. All measured profiles scored 100 for accessibility, best practices and SEO, with layout shift between 0 and 0.004. Mobile performance is lower than desktop, with main-thread layout/rendering and blocking time still the largest costs on this host. Scores are not production Core Web Vitals guarantees.

| Profile | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home-mobile | 72 | 100 | 100 | 100 | 2.7 s | 1258 ms | 0.000 |
| home-desktop | 99 | 100 | 100 | 100 | 0.6 s | 90 ms | 0.000 |
| work-mobile | 88 | 100 | 100 | 100 | 3.0 s | 310 ms | 0.000 |
| blog-mobile | 88 | 100 | 100 | 100 | 3.0 s | 277 ms | 0.004 |
| article-mobile | 81 | 100 | 100 | 100 | 3.1 s | 500 ms | 0.000 |

The home page omits inner-page CSS/JS; the blog prioritizes its first cover. Fonts and all 88 article images are local. Article imports resize/convert fresh images to WebP; visitors do not need DEV or another image host to read.

## Content and deployment

The Work collection contains the 11 requested projects plus the retained BlazeDemo educational capstone, and five private enterprise summaries. Source code and private client data remain undisclosed. Real public screenshots are used where available; three project visuals and three About photos are clearly labeled placeholders. Both historical chatbot articles carry visible technical corrections.

Both supported resume URLs preserve the supplied PDF. SHA-256: `08f8cad9ebb007de02e6874302f04db3f17be7d8e8f7626e98f0d9ee98099d09`.

The update targets the existing [PR #1](https://github.com/ThisIs-Developer/Portfolio/pull/1) and [Cloudflare branch preview](https://feat-editorial-portfolio-red.baivabsarkar.pages.dev/). The PR remains unmerged. The pre-existing Netlify account-installed Lighthouse v4 plugin has a Node compatibility failure; its account configuration is unchanged. Cloudflare/Vercel and the repository workflow have separate checks.

## Reproduce

```sh
npm ci
npm run build
npm run check
node scripts/import-articles.mjs --self-test
npx playwright install --with-deps chromium firefox webkit
npm test -- --dir dist --browsers chromium,firefox,webkit --widths 320,390,768,1440 --output .qa-results/release
npm run test:performance
```

Run Lighthouse separately from browser tests. Local detailed logs remain in ignored .qa-results; CI publishes equivalent reports as workflow artifacts.
