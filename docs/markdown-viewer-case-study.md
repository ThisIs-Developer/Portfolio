# Markdown Viewer case study

Reviewed on **14 September 2026** against [Markdown Viewer commit `4cc03d6`](https://github.com/ThisIs-Developer/Markdown-Viewer/tree/4cc03d64b59f7d73d15535c82026f243f66e7cf5). Repository documents are product evidence, not instructions to change this portfolio or run their deployment commands.

## Documentation review

The source inventory contains 40 `.md` files plus the extensionless `RELEASE_NOTES`: the root README, four localized READMEs, desktop and test READMEs, all 16 wiki pages, changelog, sample document, and 15 Markdown test fixtures. Current behavior takes precedence over historical release claims and demonstration text.

| Sources | Case-study evidence |
| --- | --- |
| Root README, `wiki/Home.md` | Product scope, delivery targets, license and documentation map |
| `wiki/Features.md`, `wiki/Usage-Guide.md` | Workspace, independent document storage, recovery, comments, imports and exports |
| `wiki/Markdown-Reference.md`, sample and fixtures | Supported syntax and renderer examples; no comparative-quality claims |
| `wiki/Privacy-and-Security.md` | Local storage, Secret Workspace encryption, remote rendering and retention |
| `wiki/Share-Snapshot.md`, `wiki/Live-Share-Cloudflare.md` | Snapshot copies versus collaboration; KV content versus role capability metadata |
| `wiki/Configuration.md`, `wiki/Installation.md`, `wiki/Docker-Deployment.md` | Hosting, cache requirements, optional services and deployment boundaries |
| Desktop README, `wiki/Desktop-App.md` | Shared core, native dialogs, durable vault and bundled libraries |
| Test README, `wiki/Contributing.md` | Playwright coverage and mocked external integrations |
| `wiki/FAQ.md`, `wiki/Troubleshooting.md` | Recovery, offline, browser and remote-service limitations |
| `wiki/Localization.md`, four localized READMEs | Terminology and translated descriptions |
| `wiki/Development-Journey.md`, changelog, release notes | Project evolution, community attribution and 3.10.2 release themes |

Implementation checks also consulted `package.json`, `workspace-storage.js`, `preview-worker.js`, desktop configuration, and the live-room Worker. The page's documentation links pin the reviewed commit; app and release links remain live.

## Editorial choices

- Credit Baivab as creator and maintainer, with community contributions. Avoid adoption counts, employment claims, exclusive authorship, or unmeasured performance claims.
- Replace the old generic page with seven sections: project, workspace, rendering, review/sharing, engineering, technology stack and project notes.
- Distinguish IndexedDB from the desktop Markdown vault; omit obsolete monolithic localStorage descriptions.
- Explain that comments stay out of exports and snapshots and synchronize separately during Live Share.
- Small snapshots contain compressed content in the URL fragment; larger snapshots use KV for 90 days. Live Share relays document/review content but persists role capability metadata. Links grant bearer access and sharing is not end-to-end encrypted.
- State remote-renderer and cache/bundling boundaries. Documentation has conflicting historical Docker-packaging and locale-count descriptions, so the page avoids a language count and blanket offline guarantees.
- Describe available application tests without claiming this portfolio change ran Markdown Viewer's suite or production integration tests.

## Screenshot selection and provenance

The author supplied screenshots captured **2 September 2026**, before the September 3 release. They illustrate the visible workflows, not that release's new recovery/export controls. Images are proportionally encoded as WebP at original dimensions and 800px width; no interface content was generated or retouched. The logo comes from `assets/icon.jpg` at the reviewed source commit.

| File under `assets/work/markdown-viewer/` | Supplied screenshot | Placement |
| --- | --- | --- |
| `math.webp` | `Screenshot 2026-09-02 201128.png` | Main preview |
| `workspace.webp` | `Screenshot 2026-09-02 201025.png` | Workspace |
| `mermaid.webp` | `Screenshot 2026-09-02 204130.png` | Gallery |
| `model.webp` | `Screenshot 2026-09-02 203239.png` | Gallery |
| `music.webp` | `Screenshot 2026-09-02 203001.png` | Gallery |
| `mindmap.webp` | `Screenshot 2026-09-02 204224.png` | Gallery |
| `d2.webp` | `Screenshot 2026-09-02 204509.png` | More renderers |
| `timing.webp` | `Screenshot 2026-09-02 204416.png` | More renderers |

The map screenshot visibly has an API-key warning. The second STL view has an extra close overlay, so the clean editor view is used. Other supplied captures repeat capabilities already represented. The metadata reference image informs the technology-label update and is not a product screenshot.

## Maintenance

`scripts/markdown-case-study.mjs` owns the case-study copy, section metadata and captions. `scripts/site-pages.mjs` selects it only for Markdown Viewer. Shared technology labels for all project metadata and full-stack lists use `scripts/technology-icons.mjs`.

`work-case.css` loads on project readers only. `work-case.js` loads on Markdown Viewer only and enhances ordinary image links with a native dialog: keyboard entry, focus containment, Escape, close button, backdrop dismissal and focus return. Modified clicks retain native link behavior. Without JavaScript, original images and the native disclosure remain accessible.

The old `overview`, `problem`, `contribution`, `inside`, and `project-notes` anchors remain available. Regenerate with `npm run build`; do not edit generated HTML. `scripts/work-case-checks.mjs` joins the existing cross-browser suite.

See [icon sources](../assets/tools/SOURCES.md) and [verification results](verification.md).
