# Portfolio verification scope

Review the home, About, Work, Tools, Blog, project details, article details, enterprise overview, playground, interactions and 404 on desktop and mobile. Check type scale, reading widths, wrapping, image treatment, card spacing, navigation placement and the game. Review actual screenshots at readable scale.

Functional checks cover page-to-page navigation, mobile menu and keyboard focus, persistent theme and unavailable storage, project/blog search and sorting, local article content and links, reading-index navigation, canvas controls, pointer dots and reduced motion, and game input/pause/reset. Missing URLs must return a real 404 with a playable game.

Validate every generated route, local image and fragment, the supplied PDF hash, sitemap, canonical metadata, CSP and generated-file consistency. Run WCAG A/AA scans on each page family in light/dark themes. Automated scans complement visual and keyboard review; they do not replace physical-device or screen-reader testing.

Use Chromium, Firefox and Linux WebKit in CI. Keep Lighthouse separate from functional browser runs. Record actual results and any external deployment limitations in the [verification report](verification.md) and PR description.
