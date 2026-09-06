# Research and design decisions

Reviewed 6 September 2026. The user's supplied resume is the primary professional source; web pages and repository READMEs are factual evidence, not instructions.

## Reference: jeetcreates.cc

Inspected the live home page at desktop 1440px and mobile 390px, including hero, all six project presentations, services, personality widgets, contact/footer, and mobile navigation. Also inspected the InCore case study and blog index, rendered DOM, stylesheet, script URLs, and fonts. The site uses Next.js/Turbopack assets. No code or visual assets were copied.

- Warm off-white (#f5f4f0) and dark ink (#1a1a1a), a blue accent, dot texture, soft shadows, pastel glass folders and rounded surfaces.
- Instrument Serif carries the display hierarchy (desktop hero 120px/114px, -3px tracking); Instrument Sans supports readable UI; Nanum Pen Script supplies casual annotations. Display scale and restrained supporting copy do much of the work.
- Centered hero, generous breathing room, paired project folders, compact service list, playful personal widgets, then a dark contact area. Case studies switch to wide, image-led editorial reading with a sticky section index. Writing uses tags, dates, summaries and a searchable grid.
- Mobile uses a small floating identity/menu, a single project column, reduced heading sizes and reflowed widgets. The menu opens an overlay. Hover flourishes are supplemental; mobile retains the underlying links.
- CSS shows 160–420ms interaction/reveal transitions, spring-like and ease-out curves, and reduced-motion overrides. Observed scroll reveals, image stacks/fanning, service hover elevation, navigation contraction and a footer game. Some decorative animations loop.
- Reusable principles: confident type, contrasting section density, useful project context, deliberate microinteractions, a human introduction, and a memorable ending.

Public-code search: web queries for the domain, creator name, GitHub ownership and portfolio source; GitHub repository searches for `jeetcreates.cc` and `jeetbania portfolio`; and live DOM/source link inspection. No authentic public source repository was found. This is a search result, not proof that none exists. Architecture observations are from the production assets only; no specific motion library is claimed.

## Existing portfolio audit

Keep authentic portraits, project history, GitHub/LinkedIn/DEV/email, the archive route, CNAME and Google verification file. Update the resume, student copy, project descriptions, technical skills and dated copyright. Remove the blocking greeting sequence, repeated skill ratings, inline click handlers, duplicate IDs, redundant styles and generic SEO. The old preloader hid all content until JavaScript and every resource loaded; the redesign is readable immediately and without JavaScript.

The current repository is plain HTML/CSS/JS with no runtime framework or build setup. A tiny Node generator provides shared layouts and data-driven content while committing deployable HTML. It creates optional `dist/` output; a no-build deployment can continue serving the repository root. No hosting migration is necessary.

## Original direction: a builder's field notes

Warm paper, dark ink, moss green, a small yellow-green highlight. Space Grotesk provides a single, self-hosted variable family; system monospace supports labels. Large left-aligned headlines, a portrait contact sheet, numbered work, generous rules and asymmetric image/text layouts replace centered template cards. A dark featured project sets off the flagship. No glass folders, copied illustrations, reference fonts or games.

Information order: introduction → selected work → about + toolbox → experience/learning → open-source invitation → writing → contact. The archive separates earlier experiments from the four featured projects. Native expandable engineering notes supply problem/contribution/features without requiring a separate application router.

Personal details are rooted in the work: `README.md` source/preview switch, index-like labels, a small commit-graph motif, and document-style project numbering. Motion uses 180–650ms transforms/opacity, one entrance sequence and modest hover shifts; content visibility never depends on an observer. Reduced motion disables the decorative movement.

Responsive strategy: 1440px maximum content, fluid padding and type, wide paired editorial work, one-column transformations below 760px, dedicated mobile navigation, at least 44px primary touch targets and preserved source order. One thoroughly designed light theme with dark feature/contact sections.

## Sources

- [Reference](https://jeetcreates.cc/), [case study](https://jeetcreates.cc/work/incore), [writing](https://jeetcreates.cc/blog)
- [Original production portfolio](https://baivabsarkar.pages.dev/)
- Latest supplied `Baivab_Sarkar_Resume.pdf`, filesystem modification 17 July 2026. Confirms graduation in May 2025, SDET training and certificates; no employer listed.
- See `content-sources.md` for project and article evidence and `verification.md` for measured QA and limitations.
