# Portfolio design system

The portfolio uses a warm dotted canvas, expressive serif type, translucent pastel objects and a compact floating navigation dock. The same language extends across the home, About, Work, Blog, individual reading pages, Play Lab and 404.

## Foundations

| Token | Value |
| --- | --- |
| Canvas | #f5f4f0 |
| Ink | #1a1a1a |
| Accent | #3b5bdb |
| Grid | 28px dots, rgb(80 80 75 / 0.36); dark rgb(200 200 210 / 0.23), masked beneath content |
| Display | Instrument Serif, regular and italic |
| Body and controls | Instrument Sans, 400â€“700 |
| Handwritten asides | Nanum Pen Script |
| Foreground surfaces | Opaque light/dark surfaces over the dotted canvas |
| Navigation glass | 26px blur, 160% saturation, translucent theme tint, fine rim and inset highlight |
| Contact canvas | #0a0a0a |

The six folder tints are #b8f0d8, #d4c9f5, #b8cef5, #f5d4b8, #f2a65a and #c8e6c0. Folder labels use dark ink for readable contrast. Each folder has three fanned sheets, a frosted front starting at 32% height, and a 400:340 proportion.

## Page composition

- Home: centered 88svh introduction, six featured project folders, timed capabilities, selected writing, personal cards and dark contact/game ending.
- About: centered introduction, seven fanned images, a narrow 740px reading column, a profile panel, interests, tools and experience.
- Work: a centered heading, shared category/search controls, six featured folders and six archive folders. Curated order is preserved until an explicit date sort. Four private-work cards use original illustrations, sans-serif headlines and the article indexâ€™s clean art-and-copy layout.
- Blog: a left-aligned engineering publication header, featured article, search/filter/sort controls and a card grid with original vector artwork. Local readers use clear sans-serif titles, an author byline, a sidebar section index, a generous text column and code panels.
- Project details: large left-aligned title, rounded metadata tray, genuine project imagery or a labeled placeholder, sticky section navigation and next-project link.
- Play Lab: a rounded canvas with an editable sticky note, focus timer, checklist, personal vote, colour mixer, clock and project widget. Drag any non-control surface or use arrow keys; releases carry momentum and bounce softly at the canvas edges. The canvas uses a near-viewport rounded blue frame, six pastel swatches with a separate background reset, a floating pan/zoom hint, centered zoom/reset controls, and three draggable pins. The seven original widgets retain their content and visual design, joined by a browsable calendar, calculator, and daily mood check-in saved locally. Ten cards use spaced slots that expand into the existing finite world as needed. Desktop and mobile start in Canvas view with the closer card scale. A fresh visit shuffles cards into spaced slots with varied offsets and angles; List view is available for reading. The instructions hide on the first canvas activity, including pointer movement, dragging, scrolling, zooming, typing or keyboard navigation. The palette reset uses a centered SVG icon aligned with the swatches.
- 404: a centered message, playable Bug Run panel and return-home link.

Mobile uses top identity/menu controls, one-column collections, smaller type, two-column metadata with the third item spanning both, and a compact bottom reading index. Native links and article content remain usable without JavaScript.

## Motion

Folder transforms and hover lifts use ease-out and spring-like curves. Pointer movement locally enlarges dots within a soft radius. Word-sized masks protect visible text with one pixel of padding; rounded masks protect painted UI surfaces. Transparent links and layout wrappers do not clear their surrounding area, and hovering controls keeps nearby dots reactive. Normal dots retain uniform opacity through all four edges and corners; only the pointer highlight blends back into the grid over a 225px radius. Pointer falloff blends dot size and opacity; dark mode uses a quieter base and highlight. Hover dot radii peak at 3px in light mode and 2.35px in dark mode; highlight colors and opacity remain unchanged. Touch and reduced-motion devices retain only static dots; rendering stops when idle. Without JavaScript, the page uses the plain canvas color. Soft shadows replace decorative borders. Mouse focus avoids oversized rings while keyboard focus remains visible. The game starts only on input. Reduced-motion styles suppress decorative movement.

The Interactions section of Play Lab contains six working demos: shape switching, selectable spring motion, a tilting/turning studio pass, click celebration, an adjustable spinning petal bloom and a tactile ripple pond with three palettes. A keyboard-accessible segmented control shows exactly one panel at a time, with a short entrance transition. The canvas camera pans independently of cards within finite world boundaries; wheel scrolling zooms around the pointer from 65% to 165%, while scrolling outside the canvas or in List view scrolls the page. Zooming out reveals the same finite world. The finite world is established for the responsive layout to include all space revealed at minimum zoom. Card positions, drag offsets, and limits use that world coordinate system independently of camera translation and current zoom. Boundaries include the rotated/lifted card footprint. Panning changes only the camera; card dragging changes only the selected card, with edge panning to reach distant space. Text/image selection is suppressed while dragging. Dragging near a viewport edge pans the camera to reach the rest of the world, stopping at its boundary. Dragging and throwing cards preserves momentum, while mobile offers a readable List view alongside its initial Canvas view. Pins can only be placed by dragging and dropping onto a card; selecting the card pin unpins it. View reset restores the initial random positions, zoom, and pins, while background reset only resets the canvas colour. The physics demo integrates a damped spring with drag velocity and three response presets. Celebration has a clear burst and halo. The water demo draws soft, low-opacity pastel wave bands without refraction, caustics or specular reflections, then settles; reduced motion produces a still wave pattern. The Depth card tilts over 600ms and flips over 900ms. Physics keeps its draggable spring motion without a visible coil or anchor ring. Keyboard, touch and reduced-motion feedback remain available.

## Self-hosted font assets and licenses


All four fonts were obtained directly from the [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=Instrument+Serif:ital@0;1&family=Nanum+Pen+Script&display=swap), using its Latin WOFF2 subsets. They total 88,224 bytes.

| Local asset | Bytes | Official binary source |
| --- | ---: | --- |
| `assets/fonts/instrument-sans-latin-variable.woff2` | 30,092 | [Instrument Sans, weights 400â€“700](https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2) |
| `assets/fonts/instrument-serif-latin-regular.woff2` | 21,032 | [Instrument Serif regular](https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2) |
| `assets/fonts/instrument-serif-latin-italic.woff2` | 22,128 | [Instrument Serif italic](https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7M.woff2) |
| `assets/fonts/nanum-pen-script-latin-regular.woff2` | 14,972 | [Nanum Pen Script](https://fonts.gstatic.com/s/nanumpenscript/v25/daaDSSYiLGqEal3MvdA_FOL_3FkN6zn0aQ.woff2) |

Each binary's WOFF2 signature was verified. The SIL Open Font License texts (with trailing whitespace normalized) are saved alongside the assets as `OFL-Instrument-Sans.txt`, `OFL-Instrument-Serif.txt`, and `OFL-Nanum-Pen-Script.txt`, from Google's official [Instrument Sans](https://github.com/google/fonts/blob/main/ofl/instrumentsans/OFL.txt), [Instrument Serif](https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt), and [Nanum Pen Script](https://github.com/google/fonts/blob/main/ofl/nanumpenscript/OFL.txt) repositories.


## Replaceable images

The generated SVGs in assets/about and assets/placeholders are explicitly labeled placeholders. To replace personal photos, update the photo strip in scripts/site-pages.mjs and publish the matching image asset. To replace a project image, set its image, imageAlt, imageWidth and imageHeight in the project JSON and supply the responsive variants used by the folder renderer. Keep real screenshots separate from private enterprise summaries.

Capabilities open the first row when visible, fill a bright green progress ring over four seconds, then cycle forward. Each detail is one concise paragraph with no hover state. Selecting any row closes the previous one and restarts the timer. Offscreen and hidden tabs stop the cycle. Homeâ€™s personal cards share one integrated Quick Ask surface; mobile users can swipe through all five cards. The About photo fan lifts, tilts and pins individual photos with pointer, tap and keyboard controls.

Desktop navigation is fully expanded at the top (within 1px), collapses as soon as scrolling moves downward, and reopens when returning to the top. A focused navigation link returns focus to the menu button on collapse. Width transitions use a restrained 4px opening overshoot and 3px closing undershoot, settling over 600ms and 500ms respectively. The menu button reopens it, and mobile keeps its compact initial menu. Navigation width changes use a short spring-shaped transition. Button presses, tabs, expandable content and cards have restrained motion. Reduced-motion preferences disable animated transitions and momentum without removing control feedback. The compact wallet shares a single white chat surface; messages load for at least two seconds, remain for ten seconds, and close on an outside click.

Wallet cards are 175px tall, their decorative top starts at 0px, and the wallet margin is 44px auto -20px at every breakpoint. Mobile retains a horizontally scrollable fan.
