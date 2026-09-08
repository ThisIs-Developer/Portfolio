# Design and content decisions

Updated 8 September 2026. The site is a complete portfolio with shared navigation and page templates, rather than a single landing page with external reading links.

All published articles are readable locally. The import command reads the author's public DEV articles, sanitizes the HTML, rewrites links between imported posts and stores images locally. Published dates remain visible; an editorial clarification qualifies the older model-training claim in the CSV chatbot article.

Project details describe observed public repository features and the owner's supplied context. Sei-Sangeet-Bangla is listed with private source. Enterprise applications use only the descriptions supplied by Baivab and retain a clear confidentiality notice; no private source, client data or system architecture is published.

The supplied screen recording was reviewed for navigation, folder motion, services, personal cards, search/filter behavior, the contact game and the cursor-driven dots. Page layouts were also inspected at desktop and mobile widths. The resulting tokens and components are documented in the [design system](design-system.md).

The runtime remains static HTML, CSS and JavaScript. The build generates individual HTML files, shared metadata and a complete sitemap, preserving the legacy project route and resume URLs. Search, filters, small interactions and game state execute locally. No browser framework or runtime content API is needed.

See [content evidence](content-sources.md), [assets](../assets/README.md) and [verification](verification.md) for provenance and measured checks.
