# Portfolio design system

The portfolio uses a warm dotted canvas, expressive serif type, translucent pastel objects and a compact floating navigation dock. The same language extends across the home, About, Work, Blog, individual reading pages, Play Lab and 404.

## Foundations

| Token | Value |
| --- | --- |
| Canvas | #f5f4f0 |
| Ink | #1a1a1a |
| Accent | #3b5bdb |
| Grid | 28px dots, with localized pointer growth |
| Display | Instrument Serif, regular and italic |
| Body and controls | Instrument Sans, 400–700 |
| Handwritten asides | Nanum Pen Script |
| Foreground surfaces | Opaque light/dark surfaces over the dotted canvas |
| Navigation blur | 22px |
| Contact canvas | #0a0a0a |

The six folder tints are #b8f0d8, #d4c9f5, #b8cef5, #f5d4b8, #f2a65a and #c8e6c0. Folder labels use dark ink for readable contrast. Each folder has three fanned sheets, a frosted front starting at 32% height, and a 400:340 proportion.

## Page composition

- Home: centered 88svh introduction, six featured project folders, six compact archive links, capabilities, selected writing, personal cards and dark contact/game ending.
- About: centered introduction, seven fanned images, a narrow 740px reading column, a profile panel, interests, tools and experience.
- Work: a centered heading, shared category/search controls, six featured folders and six archive cards. Curated order is preserved until an explicit date sort. Four private-work cards use original illustrations, sans-serif headlines and the article index’s clean art-and-copy layout.
- Blog: a left-aligned engineering publication header, featured article, search/filter/sort controls and a card grid with original vector artwork. Local readers use clear sans-serif titles, an author byline, a sidebar section index, a generous text column and code panels.
- Project details: large left-aligned title, rounded metadata tray, genuine project imagery or a labeled placeholder, sticky section navigation and next-project link.
- Play Lab: a rounded canvas with an editable sticky note, focus timer, checklist, personal vote, colour mixer, clock and project widget. Drag their headings or use arrow keys. Mobile starts in List view for readable controls.
- 404: a centered message, playable Bug Run panel and return-home link.

Mobile uses top identity/menu controls, one-column collections, smaller type, two-column metadata with the third item spanning both, and a compact bottom reading index. Native links and article content remain usable without JavaScript.

## Motion

Folder transforms and hover lifts use ease-out and spring-like curves. Pointer movement locally enlarges dots within a soft radius; the effect fades over controls and widgets, creates no canvas on touch or reduced-motion devices and stops drawing when idle. Opaque foreground surfaces keep dots behind controls and cards. Soft shadows replace decorative borders. Mouse focus avoids oversized rings while keyboard focus remains visible. The game starts only on input. Reduced-motion styles suppress decorative movement.

The Interactions section of Play Lab contains six working demos: shape switching, selectable spring motion, a tilting/turning studio pass, click celebration, an adjustable spinning petal bloom and a tactile ripple pond with three palettes. The canvas and experiments have direct section links on one page. Keyboard, touch and reduced-motion feedback remain available.

## Self-hosted font assets and licenses


All four fonts were obtained directly from the [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=Instrument+Serif:ital@0;1&family=Nanum+Pen+Script&display=swap), using its Latin WOFF2 subsets. They total 88,224 bytes.

| Local asset | Bytes | Official binary source |
| --- | ---: | --- |
| `assets/fonts/instrument-sans-latin-variable.woff2` | 30,092 | [Instrument Sans, weights 400–700](https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2) |
| `assets/fonts/instrument-serif-latin-regular.woff2` | 21,032 | [Instrument Serif regular](https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2) |
| `assets/fonts/instrument-serif-latin-italic.woff2` | 22,128 | [Instrument Serif italic](https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7M.woff2) |
| `assets/fonts/nanum-pen-script-latin-regular.woff2` | 14,972 | [Nanum Pen Script](https://fonts.gstatic.com/s/nanumpenscript/v25/daaDSSYiLGqEal3MvdA_FOL_3FkN6zn0aQ.woff2) |

Each binary's WOFF2 signature was verified. The SIL Open Font License texts (with trailing whitespace normalized) are saved alongside the assets as `OFL-Instrument-Sans.txt`, `OFL-Instrument-Serif.txt`, and `OFL-Nanum-Pen-Script.txt`, from Google's official [Instrument Sans](https://github.com/google/fonts/blob/main/ofl/instrumentsans/OFL.txt), [Instrument Serif](https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt), and [Nanum Pen Script](https://github.com/google/fonts/blob/main/ofl/nanumpenscript/OFL.txt) repositories.


## Replaceable images

The generated SVGs in assets/about and assets/placeholders are explicitly labeled placeholders. To replace personal photos, update the photo strip in scripts/site-pages.mjs and publish the matching image asset. To replace a project image, set its image, imageAlt, imageWidth and imageHeight in the project JSON and supply the responsive variants used by the folder renderer. Keep real screenshots separate from private enterprise summaries.
