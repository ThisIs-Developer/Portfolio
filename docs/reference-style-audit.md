# Direct visual reference audit

Measured on 7 September 2026 from [jeetcreates.cc](https://jeetcreates.cc/), its delivered stylesheet, inline presentation styles and public folder animation module. These measurements support the requested close visual adaptation. Baivab's content, project screenshots, portrait, links and professional claims remain his own.

## Visual changes required from the first PR

| First PR direction | Reference treatment to implement |
| --- | --- |
| Left-aligned, oversized sans-serif editorial hero | Centered name in a fine, high-contrast serif, with a small uppercase introduction |
| Moss and lime accents | Neutral warm white, blue emphasis and translucent pastel surfaces |
| Dense portfolio dashboard and README panels | Narrow, centered sections with ample whitespace and playful object-based composition |
| Flat screenshot cards and a dark flagship block | Consistent two-column folders with layered previews emerging from frosted fronts |
| Top navigation | Small floating glass dock at the bottom, with an accessible mobile adaptation |
| Large straight-edged labels and section rails | Small uppercase eyebrows, delicate serif headings and handwritten annotations |
| Predominantly static imagery | Gentle spring movement on folders, hovering objects and controls |
| Light contact panel | Full-width near-black contact ending with oversized white serif text |

## Measured tokens

| Token | Reference value |
| --- | --- |
| Page background | `#f5f4f0` |
| Foreground | `#1a1a1a` |
| Muted text | `#6b6b6b` |
| Accent / focus | `#3b5bdb` |
| Blue canvas | `#c8e6f7` |
| Folder tints | `#b8f0d8`, `#d4c9f5`, `#b8cef5`, `#f5d4b8`, `#f2a65a`, `#c8e6c0` |
| Glass / stronger glass | White at 65% / 88% opacity |
| Glass border | White at 75% opacity |
| Floating navigation | Page background at 78% opacity; 22px blur and 180% saturation |
| Hairline | Black at 7% opacity |
| Footer | `#0a0a0a` with white text |
| Ease out | `cubic-bezier(.23, 1, .32, 1)` |
| Spring-like easing | `cubic-bezier(.34, 1.4, .64, 1)` |

## Typography and composition

The exact font families are **Instrument Serif** for display text, **Instrument Sans** for body and interface text, and **Nanum Pen Script** for handwritten asides. Serif italics provide the blue emphasis. Body text is 16px with a 1.6 line height; compact copy is generally 13.5–15px. Eyebrows are 11–12px, uppercase, with 0.1–0.14em tracking.

| Element | Measured sizing and spacing |
| --- | --- |
| Hero | Centered; minimum height 88svh; 24px horizontal padding; top padding `clamp(36px, 6vh, 60px)` |
| Hero name | Serif 400; `clamp(64px, 10vw, 120px)`; line height 0.95; tracking -0.025em |
| Hero tagline | Serif 400; `clamp(19px, 2.7vw, 27px)`; line height 1.4 |
| Handwritten aside | `clamp(20px, 2.8vw, 26px)`; 6–8px separation from the preceding text |
| Hero CTA | 14px / weight 500; pill radius; 10px × 22px padding; subtle inset highlight and shadow |
| Selected work | Maximum outer width 1020px; horizontal padding `clamp(24px, 5vw, 72px)` |
| Work heading | Serif 400; `clamp(34px, 5vw, 56px)`; line height 1.05; tracking -0.02em |
| Work grid | Two equal columns; gap `clamp(14px, 2vw, 24px)` |
| Services | Maximum outer width 780px; vertical padding `clamp(60px, 10vh, 100px)` |
| Services heading | Serif 400; `clamp(30px, 4.5vw, 44px)`; line height 1.12 |
| Services rows | 18px radius; selected row has a light surface, 18px padding and soft shadow; supporting text 13.5px |
| About / playground | Maximum outer width 1100px; centered heading; 26px rounded foreground panel and fanned 18px cards |
| Contact | Minimum height 88svh; centered; serif heading `clamp(48px, 10vw, 110px)`; line height 0.95; tracking -0.03em |
| Dock | Fixed bottom 14px; pill radius; 5px × 8px inner padding; layered, faint shadows |

At 767px and below, the work grid switches to one column with an 18px gap and 20px outer padding. The narrow composition, serif hierarchy and folder object treatment remain present on mobile; it is not simply a compressed desktop grid.

## Folder geometry and motion

- Overall proportion: 400 × 340, or height 85% of width; 900px perspective. The back has a rounded folder tab, with approximately 22–26px corner radii.
- Three preview sheets: widths 30%, 38% and 30%; left offsets 5%, 31% and 65%; all begin 8% from the top. Side sheets use a 2:3 aspect ratio and the center sheet uses 4:3. Preview radii are 10px.
- Front panel: top at 32%, extending to the bottom; radius 18px; padding 16px; transform origin at bottom center. Its tint fades from 35% to 27% opacity, with a 22px blur, 190% saturation and 1.04 brightness.
- At rest the sheets shift horizontally -5%, 0%, +5% and rotate -4°, 0°, +4°. On hover or keyboard focus they shift -18%, 0%, +18% horizontally, rise -20%, -26%, -20%, and rotate -8°, 0°, +8°. The front tilts to -22° on the X axis.
- Front opening spring: 500ms duration and 0.22 bounce. Sheet springs: 460/520/580ms, bounce 0.18/0.14/0.10, staggered 45ms. Closing: 320ms, bounce 0.05, staggered 20ms. Reduced motion uses zero duration.
- Secondary cards rise 4px with 200–220ms spring-like easing. Their arrows shift 2px diagonally over 180ms.

The reference's delivered folder labels are white with partially transparent white descriptions. That combination can have low contrast on the pale tints. Retaining the shape, translucency and motion while using darker labels is an intentional accessibility adjustment.

## Self-hosted font assets and licenses

All four fonts were obtained directly from the [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=Instrument+Serif:ital@0;1&family=Nanum+Pen+Script&display=swap), using its Latin WOFF2 subsets. They total 88,224 bytes. No font binaries were copied from the reference website.

| Local asset | Bytes | Official binary source |
| --- | ---: | --- |
| `assets/fonts/instrument-sans-latin-variable.woff2` | 30,092 | [Instrument Sans, weights 400–700](https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2) |
| `assets/fonts/instrument-serif-latin-regular.woff2` | 21,032 | [Instrument Serif regular](https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2) |
| `assets/fonts/instrument-serif-latin-italic.woff2` | 22,128 | [Instrument Serif italic](https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7M.woff2) |
| `assets/fonts/nanum-pen-script-latin-regular.woff2` | 14,972 | [Nanum Pen Script](https://fonts.gstatic.com/s/nanumpenscript/v25/daaDSSYiLGqEal3MvdA_FOL_3FkN6zn0aQ.woff2) |

Each binary's WOFF2 signature was verified. The SIL Open Font License texts (with trailing whitespace normalized) are saved alongside the assets as `OFL-Instrument-Sans.txt`, `OFL-Instrument-Serif.txt`, and `OFL-Nanum-Pen-Script.txt`, from Google's official [Instrument Sans](https://github.com/google/fonts/blob/main/ofl/instrumentsans/OFL.txt), [Instrument Serif](https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt), and [Nanum Pen Script](https://github.com/google/fonts/blob/main/ofl/nanumpenscript/OFL.txt) repositories.

## Implemented comparison — 7 September 2026

The reference and the first PR preview were inspected before replacing the design. The revised implementation was then rendered at 390, 768 and 1440px and reviewed section by section. These are deliberate close matches, with Baivab's own material:

| Reference feature | Revised portfolio |
| --- | --- |
| Centered serif name, 88svh hero, blue italic line, handwritten aside | Same font families, desktop 120px name, viewport proportion, alignment and emphasis; Baivab's name and software-development copy |
| Warm white dotted canvas and soft edge shadows | Matching #f5f4f0 background, 28px dot grid and CSS-generated ambient shadows |
| Six folders, two desktop columns / one mobile column | Six authentic software projects, matching 400:340 geometry, pastel palette, 32% front offset, blur and fanned screenshot sheets |
| Narrow services heading, blue callout and rounded stacked rows | Five evidence-based development capabilities with native expandable detail |
| Five personal cards / four on mobile, quick-ask pill | Baivab's portrait, education, Markdown Viewer, writing and GitHub identity; local curated answers |
| Bottom glass dock / top mobile identity and menu | Matching fixed placement and translucent treatment; mobile theme control inside the menu |
| Rounded light page meeting a dark, centered footer | Oversized white serif contact heading, copy email, social circles and an original Bug Run game in a pale inset panel |

Refinement corrected the initial hero's vertical placement and mobile type size, moved the mobile theme control into the menu, fixed folder accessible names, restored visible game controls, corrected a code-glyph cover, and made the game canvas scale without stretching on phones. Small folder images now use dedicated 400px variants. The social preview and favicon use the new palette and typography.

Intentional differences: folder labels use darker ink for readable contrast; the writing section preserves Baivab's DEV articles; career detail uses a compact disclosure; the game uses original developer-themed art and explicit controls. No reference creator identity, project imagery, personal interests or professional claims were transplanted.

Review renders: [desktop hero](screenshots/home-1440.png), [mobile hero](screenshots/home-390.png), [desktop folders](screenshots/folders-1440.png), [mobile personal cards](screenshots/about-390.png), [full desktop page](screenshots/full-1440.png), [full mobile page](screenshots/full-390.png). These local browser renders show the implementation; they are not reference-site screenshots or physical-device captures.
