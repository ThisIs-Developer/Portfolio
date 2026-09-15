import { technologyIcon, technologyList } from './technology-icons.mjs';

const repo = 'https://github.com/ThisIs-Developer/Markdown-Viewer';
const docs = `${repo}/blob/4cc03d64b59f7d73d15535c82026f243f66e7cf5/wiki`;
const asset = '/assets/work/markdown-viewer';
const icon = (name) => `<img class="mv-symbol" src="/assets/tools/lucide/${name}.svg" width="24" height="24" alt="" aria-hidden="true">`;
const arrow = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const shots = {
  math: ['Equations, in context', 'LaTeX source and live MathJax output in the same workspace.', 'Markdown Viewer split view with LaTeX source, the quadratic formula, binomial theorem and calculus in the preview.'],
  workspace: ['A place for every document', 'Folders, open tabs, and a clear starting point for the next draft.', 'Markdown Viewer showing its document Explorer, Workspace and locked Secret Workspace alongside the Quick start screen.'],
  mermaid: ['Diagrams from source', 'Mermaid turns a text definition into a readable database diagram.', 'Mermaid source beside a rendered entity relationship diagram connecting users, posts, tags and comments.'],
  model: ['An extra dimension', 'Inspect STL geometry with solid, surface-angle, and wireframe views.', 'STL source in the editor alongside a blue three-dimensional model on a grid in the preview.'],
  music: ['Notes become notation', 'ABCJS renders ABC notation as sheet music, with playback support.', 'ABC music notation source beside a rendered multi-part musical score in Markdown Viewer.'],
  mindmap: ['Space to explore an idea', 'Markmap expands an outline into an interactive mind map.', 'Expanded Diagram Viewer showing a software development mind map with planning, development, testing and deployment branches.'],
  timing: ['Timing, made visible', 'WaveDrom visualizes digital signals through the remote renderer.', 'WaveDrom timing diagram showing clock, reset, CPU, DMA, bus, cache, memory and interrupt signals.'],
  d2: ['Architecture in a document', 'D2 diagrams render through Kroki and can be opened in a larger viewer.', 'D2 source and its enterprise banking architecture diagram in the editor and preview.'],
};

function screenshot(name, { hero = false, compact = false } = {}) {
  const [title, caption, alt] = shots[name];
  const width = name === 'model' ? 1361 : 1366;
  const height = name === 'model' ? 767 : 768;
  return `<figure class="mv-shot${hero ? ' mv-hero' : ''}"><a class="mv-image-link" href="${asset}/${name}.webp" data-screenshot data-caption="${title}" aria-label="Enlarge screenshot: ${title}"><img src="${asset}/${name}.webp" srcset="${asset}/${name}-800.webp 800w, ${asset}/${name}.webp ${width}w" sizes="${compact ? '(max-width: 600px) calc(100vw - 48px), (max-width: 1000px) 44vw, 440px' : '(max-width: 767px) calc(100vw - 48px), (max-width: 1100px) 70vw, 980px'}" width="${width}" height="${height}" alt="${alt}" loading="${hero ? 'eager' : 'lazy'}" decoding="async"${hero ? ' fetchpriority="high"' : ''}><span class="mv-enlarge" aria-hidden="true">${icon('maximize-2')}</span></a><figcaption><span>${title}</span><p>${caption}</p></figcaption></figure>`;
}

const sectionHeading = (number, label, title) => `<div class="mv-section-heading"><p class="eyebrow"><span>${number}</span> ${label}</p><h2>${title}</h2></div>`;
const feature = (symbol, title, text) => `<div class="mv-feature">${icon(symbol)}<div><h3>${title}</h3><p>${text}</p></div></div>`;

export const markdownCaseEntries = [
  { id: 'overview', text: 'The project' }, { id: 'workspace', text: 'The workspace' },
  { id: 'rendering', text: 'Beyond plain text' }, { id: 'collaboration', text: 'Review & sharing' },
  { id: 'engineering', text: 'Engineering choices' }, { id: 'built-with', text: 'Built with' },
  { id: 'project-notes', text: 'Project notes' },
];

export function renderMarkdownCaseStudy({ sidebar, next }) {
  return `<div class="reading-layout case-layout mv-layout">${sidebar}<article class="reading-main mv-case">
    <header class="reading-header mv-header">
      <div class="mv-kicker"><p class="detail-category">Developer tools · Open source</p><span class="mv-status"><span aria-hidden="true"></span>Actively maintained</span></div>
      <div class="mv-title"><img src="${asset}/logo.webp" alt="" width="64" height="64"><h1>Markdown Viewer</h1></div>
      <p class="reading-deck">A home for your Markdown.<br><em>And everything it can become.</em></p>
      <p class="mv-intro">Write, organize, and preview technical documents in one local-first workspace. Bring diagrams, equations, 3D models, and review conversations into the same flow.</p>
      <div class="case-actions"><a class="button" href="https://markdownviewer.pages.dev/">Open Markdown Viewer${arrow}</a><a class="text-link" href="${repo}">${icon('github')}Source code${arrow}</a></div>
      <dl class="mv-meta"><div><dt>My role</dt><dd>Creator &amp; maintainer</dd></div><div><dt>Period</dt><dd>2024–ongoing</dd></div><div><dt>Built with</dt><dd>${technologyList(['JavaScript', 'IndexedDB', 'Cloudflare'])}</dd></div></dl>
    </header>
    ${screenshot('math', { hero: true })}
    <div class="mv-content">
      <section id="overview">${sectionHeading('01', 'THE PROJECT', 'One document. A complete workflow.')}
        <div class="mv-overview"><p class="mv-lead">It started with a simple idea: make Markdown easier to read, edit, and share.</p><div><p id="problem">Technical writing quickly outgrows a single preview pane. A README needs code examples. Research notes need equations. An architecture proposal needs diagrams and feedback. Moving between separate tools interrupts that work.</p><p id="contribution">I created Markdown Viewer and maintain its editor, document storage, rendering pipeline, and web and desktop delivery. Community feedback and contributions have helped shape it into an open-source workspace for that whole process.</p></div></div>
      </section>
      <section id="workspace">${sectionHeading('02', 'THE WORKSPACE', 'Pick up where you left off.')}
        <p class="mv-section-intro">A document explorer keeps files and folders together. Tabs, independent scroll positions, and Editor, Split, and Preview modes let the workspace follow the task.</p>
        ${screenshot('workspace')}
        <div class="mv-feature-grid">
          ${feature('folder-open', 'Organize without friction', 'Nested folders, favorites, recent files, search, and bulk actions. Import a GitHub repository while preserving its Markdown directory structure.')}
          ${feature('database', 'Save each document independently', 'Browser documents use IndexedDB; desktop documents live as ordinary Markdown files in a durable vault. Content loads when a document opens.')}
          ${feature('history', 'Build recovery into the workflow', 'Recover deleted files from a 30-day Trash, preserve conflicting edits as copies, and export a folder-preserving workspace ZIP.')}
          ${feature('lock-keyhole', 'Keep a private local space', 'Secret Workspace encrypts file contents and folder names with a password-derived AES-GCM key. The unlocked key stays in memory.')}
        </div>
      </section>
      <section id="rendering"><span id="inside"></span>${sectionHeading('03', 'BEYOND PLAIN TEXT', 'Write the source. See the idea.')}
        <p class="mv-section-intro">GitHub-style Markdown is the foundation. Rich code fences turn technical material into diagrams, charts, maps, models, and music, right beside the source.</p>
        <div class="mv-gallery">${['mermaid', 'model', 'music', 'mindmap'].map(name => screenshot(name, { compact: true })).join('')}</div>
        <details class="mv-more"><summary><span>${icon('workflow')}More from the rendering toolkit</span><span class="mv-details-plus" aria-hidden="true">+</span></summary><div class="mv-gallery">${['d2', 'timing'].map(name => screenshot(name, { compact: true })).join('')}</div></details>
        <div class="mv-renderer-note"><p><strong>Also supported</strong> PlantUML, Graphviz/DOT, Vega-Lite, GeoJSON, and TopoJSON, alongside MathJax for LaTeX.</p><p>Mermaid, math, maps, STL, ABC, and Markmap render in the client after their libraries load. PlantUML, D2, Graphviz, Vega-Lite, and WaveDrom use remote services; map tiles and some diagram previews also use the network.</p></div>
      </section>
      <section id="collaboration">${sectionHeading('04', 'REVIEW & SHARING', 'From your draft to a shared conversation.')}
        <p class="mv-section-intro">Feedback belongs next to the content it discusses. Anchored comments and threaded replies keep review attached to text, images, diagrams, and equations while leaving the Markdown source intact.</p>
        <div class="mv-share-grid"><div>${icon('link')}<p class="eyebrow">SHARE SNAPSHOT</p><h3>Send a point-in-time copy.</h3><p>Choose View only or Can edit. Small documents are compressed into the link; larger snapshots are stored in Cloudflare KV for 90 days. Recipients edit their own copy.</p><a class="text-link" href="${docs}/Share-Snapshot.md">Snapshot details${arrow}</a></div><div>${icon('users')}<p class="eyebrow">LIVE SHARE</p><h3>Work on the same document.</h3><p>Yjs synchronizes edits, cursors, and review threads through a Cloudflare Durable Object. Host, editor, and viewer capabilities are checked by the relay; viewers can still comment.</p><a class="text-link" href="${docs}/Live-Share-Cloudflare.md">Collaboration details${arrow}</a></div></div>
        <p class="mv-footnote">Snapshot and live invitations grant access to anyone holding the link. Live Share is not end-to-end encrypted. The relay does not persist document or comment content, but it does retain role capability metadata. Comments stay out of exports and snapshot links.</p>
      </section>
      <section id="engineering">${sectionHeading('05', 'ENGINEERING CHOICES', 'More capability. A focused core.')}
        <p class="mv-section-intro">The application stays mostly vanilla JavaScript. The work is in how storage, parsing, rendering, and export fit together.</p>
        <ol class="mv-pipeline" aria-label="Document rendering pipeline"><li>${icon('file-code-2')}<strong>Markdown source</strong><span>A plain-text editor</span></li><li>${icon('shield-check')}<strong>Parse &amp; sanitize</strong><span>Marked + DOMPurify</span></li><li>${icon('panels-top-left')}<strong>Preview &amp; export</strong><span>Rich-content preparation</span></li></ol>
        <div class="mv-engineering-list"><div><span>01</span><div><h3>Keep typing responsive</h3><p>Size-aware debouncing, optional Web Worker parsing for large documents, cached blocks, and selective DOM updates reduce repeated work. Heavy renderer libraries load when needed.</p></div></div><div><span>02</span><div><h3>Make the exported document complete</h3><p>PDF and PNG use an off-screen snapshot that waits for fonts, images, math, and visual renderers. Markdown and standalone HTML offer other ways out, with remembered appearance choices for visual exports.</p></div></div><div><span>03</span><div><h3>Share a core across web and desktop</h3><p>A Neutralinojs wrapper reuses the web application, adds native file dialogs and a durable vault, and bundles renderer libraries. The web app also supports PWA installation and static or Docker hosting.</p></div></div><div><span>04</span><div><h3>Check the workflows that matter</h3><p>The repository includes Playwright coverage for editing, rich rendering, import/export, storage, sharing, keyboard interaction, and responsive layouts, plus Chromium, Firefox, and WebKit smoke tests. External integrations are mocked in the local suite.</p></div></div></div>
      </section>
      <section id="built-with">${sectionHeading('06', 'BUILT WITH', 'The tools behind the workspace.')}
        <div class="mv-stack">${[
          ['JavaScript', 'Application core', 'Editor behavior, preview orchestration, and browser APIs.'],
          ['IndexedDB', 'Local persistence', 'Independent document records, metadata, and encrypted storage.'],
          ['Cloudflare', 'Optional connected features', 'Pages hosting, KV snapshots, and Durable Object live rooms.'],
          ['Neutralinojs', 'Desktop delivery', 'A shared web core with native dialogs and a durable file vault.'],
          ['Docker', 'Self-hosting', 'An Nginx container for serving the static web application.'],
          ['Playwright', 'Workflow verification', 'Browser automation for document, rendering, and interaction flows.'],
        ].map(([name, purpose, description]) => `<div class="mv-stack-item">${technologyIcon(name)}<div><h3>${name}</h3><span>${purpose}</span><p>${description}</p></div></div>`).join('')}</div>
      </section>
      <section id="project-notes">${sectionHeading('07', 'PROJECT NOTES', 'Built in public. Still moving forward.')}
        <p>Markdown Viewer has grown from a small preview tool into a document workspace through ongoing iteration and community contributions. The recent 3.10.2 release focuses on recovery, rendering correctness, review stability, and complete visual exports.</p>
        <p>Its local-first approach keeps everyday writing on the device. Connected features have explicit service boundaries, and offline behavior depends on cached or bundled assets. The documentation records those tradeoffs alongside current capabilities.</p>
        <div class="mv-source-links"><a class="text-link" href="${docs}/Features.md">Feature reference${arrow}</a><a class="text-link" href="${docs}/Privacy-and-Security.md">Data &amp; privacy${arrow}</a><a class="text-link" href="${repo}/releases">Releases &amp; downloads${arrow}</a><a class="text-link" href="${docs}/Development-Journey.md">Development journey${arrow}</a></div>
        <p class="mv-footnote">Project documentation reviewed September 14, 2026. Product screenshots supplied by the author, captured September 2, 2026. Markdown Viewer is licensed under Apache 2.0.</p>
      </section>
      <div class="mv-closing"><img src="${asset}/logo.webp" alt="" width="48" height="48"><div><h2>Make room for your next idea.</h2><p>Open the workspace and start with a document.</p></div><a class="button" href="https://markdownviewer.pages.dev/">Try Markdown Viewer${arrow}</a></div>
    </div>
    <a class="next-reading" href="/work/${next.id}"><span>Next project</span><strong>${next.title}</strong>${arrow}</a>
    <dialog class="mv-lightbox" aria-labelledby="mv-lightbox-title"><div class="mv-lightbox-bar"><h2 id="mv-lightbox-title">Project screenshot</h2><button type="button" data-close-screenshot aria-label="Close screenshot">${icon('x')}</button></div><div class="mv-lightbox-image"><img alt="" width="1366" height="768"></div><div class="mv-lightbox-footer"><a data-original-screenshot target="_blank" rel="noopener">Open original image${arrow}</a><p>Press Escape to close</p></div></dialog>
  </article></div>`;
}
