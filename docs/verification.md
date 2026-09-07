# Reference-adapted redesign verification

Measured **7 September 2026** on Windows with Node.js 24.19, Playwright 1.63.0, axe-core 4.13.0 and Lighthouse 13.4.1. This report replaces the first paper-and-moss revision's results. Tests serve the generated `dist/` through the repository server with the actual Cloudflare `_headers` policy.

## Visual comparison

The reference's desktop/mobile hero, all six work folders, services, personal widgets, navigation, contact and game were inspected. The first PR's split hero, large sans-serif headings, moss accents, dark project panels and editorial sections were replaced with the reference's centered Instrument Serif typography, blue emphasis, dotted warm-white canvas, pastel glass folders, narrow capabilities, personal-card fan, floating dock and dark contact ending.

The [measured reference audit](reference-style-audit.md) maps reference dimensions and behaviors to the implementation and documents deliberate adaptations. Baivab's own content and real screenshots remain the basis of the page. Folder labels use darker ink for contrast; writing and career details preserve his DEV articles and resume evidence.

Final visual review covers 390px mobile, 768px tablet and 1440px desktop: hero, folders, capabilities, writing, personal cards, experience disclosure, contact, game and archive. Refinements corrected hero alignment/type scale, mobile menu placement, folder accessible names, visible game controls and mobile canvas proportions. Updated renders: [desktop hero](screenshots/home-1440.png), [mobile hero](screenshots/home-390.png), [folders](screenshots/folders-1440.png), [mobile about](screenshots/about-390.png), [full desktop](screenshots/full-1440.png), [full mobile](screenshots/full-390.png).

## Browser and interaction checks

The ten-width matrix exercises both home and archive at **320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px**. Chromium, Chrome and Edge passed; Firefox's separate complete rerun passed all 34 checks. Combined coverage gives **134 successful checks across four local browsers**, including 80 page/width combinations. No browser/page layout failure remains in those engines.

| Browser | Version | Local outcome |
| --- | --- | --- |
| Chromium | 153.0.8010.12 | Full responsive and interaction checks passed |
| Firefox | 155.0 | Full separate rerun passed |
| Chrome | 152.0.7977.82 | Full responsive and interaction checks passed |
| Edge | 152.0.4191.66 | Full responsive and interaction checks passed |
| WebKit | Installed Playwright build 2359 | Could not launch on this Windows host; CI now runs WebKit on Ubuntu |

The initial combined run recorded 104 passes and 31 failures after Firefox reported `RenderCompositorSWGL failed mapping default framebuffer` and stopped responding. The successful isolated Firefox rerun supersedes its cascading errors. WebKit launch returned `spawn UNKNOWN` in both attempts; this is an explicit local coverage limit, not a passing result. The [PR workflow](../.github/workflows/verify.yml) now installs and tests Chromium, Firefox and WebKit on Ubuntu; consult the PR checks and uploaded artifacts for that independent result.

Checks cover menu opening/closing, backdrop, Escape/focus restoration, breakpoint resizing, first-Tab skip navigation, persistent light/dark theme and unavailable storage, all six folder destinations, five capability disclosures, curated Quick Ask topics, game start/pause/reset/keyboard behavior, successful/denied clipboard feedback, all archive filters, and engineering details. Reduced-motion and JavaScript-disabled paths are exercised in each available engine. The game never autoplays, pauses offscreen, and initializes its canvas only when it enters view.

Eight axe scans cover both pages at 390/1440px in light and dark themes with WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rules. They report **zero violations**; separate visible-label/accessibility-name checks pass. Automated checks complement visual and keyboard review and do not certify full WCAG conformance. Physical devices, actual Safari and screen-reader sessions were not available.

After the final performance and initialization refinements, a fresh **70-check smoke pass completed with zero failures** across Chromium, Firefox, Chrome and Edge at 390/1440px, including all interactions, dark-theme scans, reduced motion and no JavaScript.

The first Ubuntu run on redesign commit `2e5f1c0` launched all three engines, including WebKit, and recorded 100 passes and two navigation assertion failures. On **8 September 2026**, the test was corrected to wait for the actual breakpoint handler to finish between consecutive mobile/desktop resizes; its assertions and application behavior are unchanged. Fifty rapid mobile–desktop–mobile cycles then passed across Chromium and Firefox. CI artifact upload now explicitly includes the hidden `.qa-results/` directory. The latest PR workflow run records the independent rerun result.

## Performance

These are local lab results, using simulated mobile throttling and the desktop preset with other portfolio browser tests idle. The server does not simulate Cloudflare's compression. Host load produced noticeable TBT variation during iterations; these are measured runs, not production Core Web Vitals guarantees. Home was measured after deferring game initialization; archive was remeasured independently after prioritizing its first visible image.

| Page/profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home-mobile | 94 | 100 | 100 | 100 | 1.2 s | 2.6 s | 200 ms | 0.001 |
| home-desktop | 99 | 100 | 100 | 100 | 0.4 s | 0.6 s | 120 ms | 0 |
| archive-mobile | 98 | 100 | 100 | 100 | 1.1 s | 2.3 s | 0 ms | 0.001 |

Performance refinements reserve navigation/filter space before JavaScript initializes, preload the three primary font files, use dedicated 400px folder thumbnails, prioritize the archive's first screenshot, and avoid synchronous offscreen canvas layout during the hero's first render. The four licensed font files total 88,224 bytes. No runtime library, API, third-party font request, analytics or external embed is needed.

## Content, links and deployment

- The latest supplied resume remains byte-identical at both supported PDF URLs. Project, training, education, certification and article evidence is in [content sources](content-sources.md); image/font provenance is in [assets](../assets/README.md).
- All local links/fragments, both home/archive URL forms, sitemap, robots, custom 404, CNAME, Google verification and PDF byte ranges pass. Twenty external URLs were checked: fifteen returned 200; LinkedIn returned 999 and four DEV URLs returned 403 to the automated client. Those are recorded as access restrictions, not missing pages. No email was sent.
- `npm run build`, `npm run check`, whitespace validation and `npm audit` pass; npm reports zero vulnerabilities. Runtime remains static and dependency-free.
- The redesign is pushed to the existing `feat/editorial-portfolio-redesign` branch and [PR #1](https://github.com/ThisIs-Developer/Portfolio/pull/1). Cloudflare and Vercel deployed commit `2e5f1c0` successfully. Live checks on the [Cloudflare branch preview](https://feat-editorial-portfolio-red.baivabsarkar.pages.dev/) passed at 390/1440px: new hero/font, all six folders, menu, matching archive entry and notes, game controls, CSP and no page errors. The deployed resume's full SHA-256 matches the supplied PDF. The PR remains unmerged and DNS is unchanged.
- The existing Netlify account plugin previously rejected Node 22 because its installed Lighthouse v4 plugin required Node below 20. Its account-level configuration was not changed. Cloudflare, Vercel and GitHub checks should be read from the updated PR, rather than inferred from the prior revision.

The final generated home and archive SHA-256 prefixes are `5f32c26a2250` and `92f0fe43a5b7`, respectively. Full logs and per-engine screenshots stay in ignored `.qa-results/`; committed review images and this report provide concise evidence.

## Reproduce

```sh
npm ci
npm run build
npm run check
npx playwright install --with-deps chromium firefox webkit
npm test -- --dir dist --browsers chromium,firefox,webkit --output .qa-results/release
npm test -- --dir dist --browsers all --widths 390,1440 --output .qa-results/smoke
npm run test:performance
# Rerun one changed performance target:
npm run test:performance -- --page archive-mobile
```

`--browsers all` also requires installed Chrome and Edge. Run Lighthouse separately from functional browser tests. WebKit on Linux or Windows is engine coverage, not proof of Safari or physical-iPhone compatibility.
