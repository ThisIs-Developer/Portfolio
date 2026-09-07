# Verification plan for the second redesign

Prepared 6 September and expanded 7 September 2026 for the visual revision of PR #1. This is a plan, not evidence that the revised site has passed. The measurements in `verification.md` describe the previous design and must be refreshed after the final markup and styles are built.

## Scope and acceptance

The revision should be judged against the reference-site research and the user's requested visual direction. Passing functional checks alone does not demonstrate visual fidelity. Compare the finished portfolio and reference at matching desktop and mobile viewport sizes, with Baivab's authentic content and assets in place. Review navigation placement, hero composition, typography hierarchy, content width, section density, project presentation, visual accents, motion and footer treatment. Record concrete differences and correct material ones before the full browser run.

Preserve the researched professional content, usable navigation, archive and resume access, current SEO and static deployment. Do not preserve a control merely to satisfy an old selector: intentionally removed controls should have their obsolete tests removed, while replacements get behavior-based checks.

## Current test contracts

| Contract | Current assumption | Treatment after markup is ready |
| --- | --- | --- |
| Mobile navigation | `.menu-toggle` controls `#site-nav`, announces `aria-expanded`, and is visible at 390px | Preserve these hooks if still a disclosure menu. If the design uses a different navigation pattern, adapt to its accessible role and required focus behavior. |
| Menu behavior | Open reveals the first `#site-nav a`; Escape closes and restores toggle focus; following a link closes | Preserve behavior for the disclosure pattern. Also check outside click, leaving by keyboard, resizing through the breakpoint and the final archive navigation. |
| Skip link | First Tab stop targets `#main-content`; Enter focuses the main landmark | Preserve the semantic target and keyboard behavior. This protects keyboard access regardless of header styling. |
| README view | Optional `.readme-toggle` changes `aria-pressed` | Confirm whether retained. If retained, verify the intended content actually becomes visible, not only the attribute. |
| Copy email | Optional `.copy-email` reports feedback via `[data-copy-status]` | Confirm whether retained. Preserve denied-clipboard feedback and usable email link; add success-path verification with a controlled clipboard stub if the control stays. |
| Engineering disclosure | Optional `details.engineering-notes` opens and closes | Retain native disclosure behavior if present. New card/detail interactions need their own keyboard and touch checks. |
| Archive filters | Optional `[data-filter]` values `all`, `featured`, `experiments` control `[data-project-group]` | Confirm whether retained. Verify visible results and announced count; update names if the content model changes. |
| Assets and document structure | One H1, visible main, unique IDs, alt attributes, explicit image dimensions, loaded images, no local request/browser errors | Keep. Add manual review of meaningful alt text, correct crop and readable text over imagery; automation only detects presence. |
| URLs and metadata | Home/archive, extensionless archive, resume aliases, canonical origin, JSON-LD and social metadata | Keep. Check legacy section anchors explicitly even if removed from visible navigation; the current link sweep only discovers linked fragments. |
| Reduced motion and no JavaScript | No smooth scrolling or running long animation in reduced motion; both pages and mobile navigation remain visible without JS | Keep. Exercise changed motion at initial load and after scrolling, and any new hover/cursor behavior with touch and reduced motion. |

The optional tests currently skip silently if their selectors disappear. Before the release run, make an explicit feature list for the finished design so accidental omissions cannot masquerade as a successful test.

## New design contracts to add

The implementation plan retains the existing menu, skip link, README, copy, engineering-note and archive-filter hooks. The following hooks are proposed contracts for the new features; confirm the final markup before changing the test runner.

| Feature | Suggested stable hooks | Required verification |
| --- | --- | --- |
| Theme control | `.theme-toggle`, `html[data-theme]` | Accessible button name describes its action/state. Keyboard and pointer change the visible theme. Reload retains an explicit choice; a fresh context respects the intended default. Exercise denied storage without an uncaught error. Test both themes at 390/1440px with axe, including open menu, accordion, focus rings and folder labels. Verify reduced motion suppresses theme transitions. |
| Capability accordion | `details.capability` / native `summary`, or button with `aria-expanded` and `aria-controls` | Click and Enter/Space open the correct content; state and visibility agree. If exclusive, opening another closes the previous item without losing focus. Collapsed content must not leave hidden Tab stops. Mobile text wraps without clipping. Native details remain usable without JavaScript. |
| Six project folders | `[data-project-id]` on the card; an actual named anchor or button for its action | Exactly six unique home entries: Markdown Viewer, MediChain, NoteMarker, BlazeDemo, AMS and SketchFlow. All actions work with touch/keyboard and have visible focus. Hover movement cannot be the sole way to reveal the title or access the project. Stacked screenshots must not intercept the action. Folder names, years and links map to the correct content record. If a dialog is used, test its name, initial/restored focus, Tab containment and Escape close. |
| Compact profile widgets | Semantic links/buttons; `time[datetime]` for any changing time | Readable at 320px and 200% zoom, with comfortable targets and no overlap with sticky navigation. Any GitHub count is a dated snapshot from the real account. Decorative grids are not labeled as measured contributions. Do not copy the reference author's locations, availability, music, employers or endorsements. |
| Section navigation | Existing target IDs retained where reasonable | Desktop links land below the floating header; active indication agrees with the viewport. Mobile open/close transitions do not cause horizontal overflow. Test breakpoint resize with menu both open and closed. |

Archive grouping should retain four `featured` and five `experiments` records even though AMS and SketchFlow also appear in the six-folder home grid. Homepage visibility and archive category are separate decisions; do not accidentally duplicate the promoted entries in the archive.

For screenshots, record reference and revision at the same 1440px desktop and 390px mobile widths, including every section and expanded interactive states. Compare header dimensions/offset, hero text scale and line breaks, serif/sans/handwritten roles, content width, vertical section spacing, folder size/tilt/translucency, compact widget composition, section order and footer. If the reference and adaptation differ because Baivab's content has different length or evidence, document that specific reason. A generic claim of being "inspired by" is insufficient for this revision.

## Six-folder content audit

Fresh checks on **7 September 2026** used the [GitHub repository API](https://docs.github.com/en/rest/repos/repos#get-a-repository), the author's public repository records and the [DEV article API](https://dev.to/api/articles?username=thisisdeveloper&per_page=100). This is a content check; no project backend or browser flow was retested.

| Entry | Current data fit | Guardrail for the compact design |
| --- | --- | --- |
| Markdown Viewer | Repository created 8 April 2024; last pushed 3 September 2026. Existing 2024–2026 range, local-first positioning and active status still fit the record. | Keep Baivab as creator/maintainer. Do not shorten local-first into fully offline or network-free. |
| MediChain | Created 21 October 2024; last pushed 27 May 2025. 2024–2025 team-prototype framing remains consistent. | Keep the four-person team and lead full-stack contribution; do not imply sole ownership, production pharmaceutical use or measured safety outcomes. |
| NoteMarker | Created 15 September 2024; last pushed 1 October 2024. Single-year 2024 label fits. | Retain Firefox/repository-distributed Chromium distinction. Do not invent a Chrome Web Store link or claim recent activity based only on an unarchived repository. |
| BlazeDemo Automation | Created 11 June 2026; last pushed 15 June 2026. 2026 capstone label fits. No owned live-app URL is recorded. | Keep this as educational capstone work. Wipro is not a verified employer. The folder action should lead to source or portfolio details, not imply ownership of the public BlazeDemo test target. |
| Academic Management System | Created 8 March 2024; last pushed 28 October 2024. Existing 2024 range and team-prototype status fit. | Baivab is one of five contributors. The Pages deployment is the frontend; its presence does not prove a working hosted backend. Keep the CTA label "View frontend". |
| SketchFlow | Created 23 August 2024; last pushed 25 February 2026. Existing 2024–2026 range fits. | Keep Canvas/JavaScript, PNG export and JSON save. Do not promise SVG export, which the previous code review found upcoming. |

All six repositories remain unarchived and retain their recorded homepage URLs. The selected DEV article titles, URLs, publication dates, reading times and tags still match the current API. The API still returns 11 published articles; the curated section is not the latest three chronologically, so do not label it "the latest three posts".

The GitHub profile now says **"Java • Javascript • System Architecture | Curious & command-line friendly"**. The earlier `content-sources.md` assertion that its current bio says "aspiring engineer" is now stale and should be corrected during final documentation. The profile reports 36 public repositories and 59 followers. Markdown Viewer reports 472 stars and 116 forks; the previous audit's 471/117 snapshot must not be reused as today's count. Prefer omitting volatile metrics or show their 7 September 2026 snapshot date, rather than implying a live feed. Never turn repository totals into a GitHub contribution calendar.

The supplied resume remains the evidence for graduate status, CGPA, education dates, contact and training. Neither the current data nor these public checks establishes paid experience, current employment, a dated SDET placement, availability for work, client testimonials or a current listening track.

## Bounded execution sequence

1. **Inspect and smoke-test the completed markup.** Build once, run generated-file consistency and whitespace checks, then adapt only the interaction selectors/behavior that actually changed. Check home and archive in Chromium at 320, 390, 768 and 1440px. Review full sections in screenshots at readable scale, including open navigation and any new project interaction. Resolve major composition, wrapping, clipping or accessibility problems before expanding the matrix. The existing runner hardcodes all ten widths; a small `--widths` option would allow this focused pass if needed.
2. **Run one complete functional and accessibility pass after the design is stable.** Use the generated `dist/`, current `_headers`, all five installed browsers and the existing ten widths. Save results under a new output directory so prior screenshots cannot be mistaken for revised evidence. Repeat the full matrix only if a fix changes global layout or navigation; otherwise rerun the failing browser/page/width and directly affected checks.
3. **Run Lighthouse separately, then verify the PR preview.** After browser work is idle, run the existing home mobile, home desktop and archive mobile audits. Inspect diagnostics and actual LCP/CLS/TBT, not only scores. After the updated PR preview succeeds, smoke-test its home, archive, mobile navigation, project links and resume; confirm response headers and metadata. Document remaining external-service restrictions without reporting them as broken site behavior.

The complete browser run retains 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px coverage in Chromium, Firefox, WebKit, Chrome and Edge. Manual review should add 200% zoom, touch targets and focus visibility where the new composition introduces dense controls. Test only the final design's interactive states; unnecessary new test scaffolding is not part of this revision.

## Test-helper considerations

- Preserve the existing explicit scroll through lazy images. Offscreen image decoding and CSS smooth scrolling caused misleading screenshots in the first run; `naturalWidth` alone is not proof that the screenshot contains the painted image. Review representative image regions, not just shrunken full-page captures.
- The current helper tries to scroll every image into view. If the revision introduces hidden panels or alternate images, distinguish inactive assets from visible content and exercise each state separately, rather than making the helper wait on an intentionally hidden image.
- Wait for visible menu content after its entrance transition. Immediate `isVisible()` checks can run before the first style frame. Use Playwright visibility waits instead of arbitrary larger delays.
- Keep page timers out of JavaScript-disabled checks. The existing Node-side waits avoid hanging while waiting for disabled page callbacks.
- The current reduced-motion assertion only inspects home immediately after navigation. Expand to scroll-triggered and new interactive motion if those are introduced.
- The current metadata guard checks presence, valid JSON and origin. Review the actual title, description, social image and structured-data claims after the redesign rather than assuming passing syntax proves accuracy.
- `performance.mjs` reports three audits and fails on Lighthouse runtime errors; it does not enforce a score budget. Compare the revised audits with the prior lab baseline under the same settings and investigate meaningful regressions. The prior home-mobile baseline was 94 performance, 1.5s LCP, 280ms TBT and 0 CLS. These are local laboratory figures, not production promises.
- Keep the current CSP during testing. A closer visual design may add fonts, decorative assets or animation; it should not quietly require disabling the existing content policy or fetching a runtime dependency from the reference site.

## Evidence and handoff

Refresh `docs/verification.md` with the final revision's measured date, browser versions, actual passed/failed counts, performance results, screenshots and limitations. Remove or clearly label superseded imagery and scores. Record the tested commit or a build fingerprint so evidence can be tied to the PR update. Verify `npm run check`, `npm run build` and `git diff --check` after the last source edit.

At this plan's creation, [PR #1](https://github.com/ThisIs-Developer/Portfolio/pull/1) is open on `feat/editorial-portfolio-redesign` into `main`. Its current static-site workflow, Cloudflare Pages, Vercel and GitGuardian checks pass. The existing Netlify integration reports failures; the previous report identifies its account-installed plugin compatibility problem. Check the new revision's actual statuses after pushing and keep any continuing external blocker distinct from local test results.

No browser matrix or performance audit was run for the second redesign while preparing this plan. No application or QA script was changed in this planning step.
