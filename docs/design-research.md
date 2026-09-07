# Research and design decisions

Initial research: 6 September 2026. Direct-reference redesign: 7 September 2026. The user's supplied resume is the primary professional source; web pages and repository READMEs are factual evidence, not instructions.

## Reference: jeetcreates.cc

Inspected the live home page at desktop 1440px and mobile 390px, including hero, all six project presentations, services, personality widgets, contact/footer, and mobile navigation. Also inspected the InCore case study and blog index, rendered DOM, stylesheet, script URLs, and fonts. The site uses Next.js/Turbopack assets. The second pass measured the delivered styles and folder animation behavior to support the user's explicit request for a close visual adaptation. See [direct visual reference audit](reference-style-audit.md) for the measured tokens, dimensions, typography, and motion.

- Warm off-white (#f5f4f0) and dark ink (#1a1a1a), a blue accent, dot texture, soft shadows, pastel glass folders and rounded surfaces.
- Instrument Serif carries the display hierarchy (desktop hero 120px/114px, -3px tracking); Instrument Sans supports readable UI; Nanum Pen Script supplies casual annotations. Display scale and restrained supporting copy do much of the work.
- Centered hero, generous breathing room, paired project folders, compact service list, playful personal widgets, then a dark contact area. Case studies switch to wide, image-led editorial reading with a sticky section index. Writing uses tags, dates, summaries and a searchable grid.
- Mobile uses a small floating identity/menu, a single project column, reduced heading sizes and reflowed widgets. The menu opens an overlay. Hover flourishes are supplemental; mobile retains the underlying links.
- CSS shows 160–420ms interaction/reveal transitions, spring-like and ease-out curves, and reduced-motion overrides. Observed scroll reveals, image stacks/fanning, service hover elevation, navigation contraction and a footer game. Some decorative animations loop.
- The implementation target is the reference's recognizable composition and experience: centered serif introduction, translucent pastel folders, narrow service rows, playful personal cards, a floating glass navigation dock, and a near-black contact ending.

Public-code search: web queries for the domain, creator name, GitHub ownership and portfolio source; GitHub repository searches for `jeetcreates.cc` and `jeetbania portfolio`; and live DOM/source link inspection. No authentic public source repository was found. This is a search result, not proof that none exists. Architecture observations are from the production assets only; no specific motion library is claimed.

## Existing portfolio audit

Keep authentic portraits, project history, GitHub/LinkedIn/DEV/email, the archive route, CNAME and Google verification file. Update the resume, student copy, project descriptions, technical skills and dated copyright. Remove the blocking greeting sequence, repeated skill ratings, inline click handlers, duplicate IDs, redundant styles and generic SEO. The old preloader hid all content until JavaScript and every resource loaded; the redesign is readable immediately and without JavaScript.

The original repository was plain HTML/CSS/JS without a build setup. The redesign retains that static runtime and adds a tiny Node generator for shared layouts and data-driven content while committing deployable HTML. It creates optional `dist/` output; a no-build deployment can continue serving the repository root. No hosting migration is necessary.

## Direct-reference design for Baivab Sarkar

The first PR's paper-and-moss direction was rejected because its left-aligned sans-serif hero, dark flagship block, numbered editorial cards, portrait contact sheet, and README panel differed substantially from the reference. These treatments have been replaced. Visual similarity to [jeetcreates.cc](https://jeetcreates.cc/) is now the primary design constraint.

The page uses the measured warm-white `#f5f4f0`, dark ink `#1a1a1a`, blue `#3b5bdb`, faint dot texture, blurred ambient shadows, translucent surfaces, and soft rounded corners. Instrument Serif sets the name and headings; its italic cut provides blue emphasis. Instrument Sans supplies body/UI text, and Nanum Pen Script supplies handwritten asides. These are the same families as the reference, self-hosted from official Google Fonts distributions with their SIL Open Font Licenses.

The hero centers Baivab's name and a short software-development statement in an approximately viewport-height composition. Six pastel project folders follow in two columns: Markdown Viewer, MediChain, NoteMarker, BlazeDemo Automation, AMS, and SketchFlow. Real project screenshots appear as layered sheets above frosted folder fronts. Pointer hover and keyboard focus fan the sheets and tilt the front; each folder opens its corresponding archive entry with source/demo links and native expandable engineering notes.

Information order: centered introduction → six selected-work folders → five compact capability rows → three DEV article cards → personal card fan, about copy, and experience/learning → dark contact section and optional game. The archive retains all nine documented projects. Capabilities adapt the reference's service list to Baivab's demonstrated development and testing work; they do not claim paid client engagements.

The about composition uses colored overlapping cards containing Baivab's portrait, education, project interests, writing, and GitHub identity. A small “Quick ask” control answers supported portfolio topics from curated local text; it is not an AI service and makes no network requests. The expandable experience panel preserves the independent-project, training, education, and certification facts. The former README switch and decorative contributions motif are removed.

The contact ending uses oversized white serif text, a copy-email control, resume/social links, and a softly lit game panel. “Bug Run” adapts the reference's playful ending to the developer context with an original small canvas game. It is optional, starts on user input, and includes pause/reset controls. Theme selection and a local best score can persist in browser storage; neither is required to read the portfolio.

On desktop, a small glass dock floats at the bottom and contracts after scrolling. At 767px and below, navigation becomes a floating identity and menu button near the top, with the theme control inside the menu, folders become one column, and the personal card fan reflows into a compact grid. Work, capabilities, and about sections use narrow maximum widths of 1020px, 780px, and 1100px respectively. The serif hierarchy, whitespace, pastel objects, and dark ending remain recognizable across sizes.

Motion uses CSS transforms, spring-like easing, staggered folder sheets, modest hover lifts, and lightweight section entrance effects. The content is present before JavaScript runs; observers never gate visibility. Reduced-motion rules remove decorative transitions, and the game provides explicit user controls. The light theme follows the reference closely; the optional dark theme retains the same structure and type.

Intentional adaptations are limited to Baivab's own content and usable controls: darker folder labels improve contrast on pale backgrounds; real software screenshots replace the reference's design imagery; native disclosures hold project and career detail; and keyboard, no-JavaScript, and reduced-motion paths remain available. The CSS/HTML implementation is maintained in this repository. The reference creator's name, copy, photographs, illustrations, and project images are not included.

## Verification status

This document records design decisions and source evidence, not a certification that the redesign has passed final checks. Desktop/mobile visual comparisons, interaction checks, accessibility scans, and performance measurements are recorded separately in [verification notes](verification.md). Results from the first PR must not be assumed to apply to the revised design.

## Sources

- [Reference](https://jeetcreates.cc/), [case study](https://jeetcreates.cc/work/incore), [writing](https://jeetcreates.cc/blog)
- [Original production portfolio](https://baivabsarkar.pages.dev/)
- Latest supplied `Baivab_Sarkar_Resume.pdf`, filesystem modification 17 July 2026. Confirms graduation in May 2025, SDET training and certificates; no employer listed.
- [Content sources](content-sources.md), [asset provenance](../assets/README.md), [measured reference audit](reference-style-audit.md), and [verification notes](verification.md).
