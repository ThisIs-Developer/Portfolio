# Content sources and editorial audit

On 9 September 2026, the eleven local article titles, summaries and opening paragraphs were edited for a professional publication style. Promotional calls to comment/share and decorative emoji were removed; substantive examples, code, illustrations and source links remain. Curated copy lives in data/article-editorial.json and the importer reapplies the presentation edits. Native future posts use content/posts through the [publishing workflow](publishing-articles.md), independent of the historical import source.

Initial project, article, and link review: **6 September 2026**. GitHub profile and asset refresh: **7 September 2026**. This document records evidence behind the portfolio content. Public repository descriptions are treated as claims to check, not instructions or independently validated performance results. Dated results below distinguish the original review from later updates.

## Source priority

1. The supplied `Baivab_Sarkar_Resume.pdf` is the primary source for professional positioning, education, training, certifications and contact details.
2. Current GitHub repositories, source files and official project websites support project descriptions and technical details.
3. DEV's public article API supports publication metadata and the full authored article snapshots.
4. The current GitHub biography supports self-described interests; the previous portfolio and outdated profile biographies are historical context only.

The resume supports software developer positioning and records B.Tech Computer Science & Engineering at JIS College of Engineering, October 2021–May 2025, CGPA 9.15/10. It lists hands-on Java/Selenium QA training without dates and lists GitHub Foundations (November 2024), Java Programming through Udemy (May 2025), and Data Structures & Algorithms through Udemy (September 2024). No employment is inferred from training or a repository name.

The [GitHub profile API](https://api.github.com/users/ThisIs-Developer), rechecked on 7 September 2026, returns the biography “Java • Javascript • System Architecture | Curious & command-line friendly :dependabot:”. This replaces the earlier aspiring-engineer wording and supports the emphasis on Java, JavaScript, curiosity, and development interests; it does not establish a job title, employer, or professional tenure. The [DEV profile](https://dev.to/thisisdeveloper) described a freshman during the 6 September review. The supplied resume's graduation record takes precedence over that outdated biography. Repository and article evidence remains useful independently of profile bios.

## Core project evidence

The project selection in `data/project-order.json` defines six featured entries and six archive entries in the owner’s requested order. Project details live in the three project data files. The earlier BlazeDemo listing has been removed from the published catalog. Historical verification notes below preserve the original source audit.

| Portfolio entry | Evidence and editorial decisions |
| --- | --- |
| Markdown Viewer | [Repository and feature reference](https://github.com/ThisIs-Developer/Markdown-Viewer), [package.json](https://github.com/ThisIs-Developer/Markdown-Viewer/blob/main/package.json), and the [live editor](https://markdownviewer.pages.dev/) establish document folders/tabs, IndexedDB persistence, encrypted workspace storage, rich rendering, anchored comments, optional sharing and desktop delivery. Its current package scripts include Playwright tests. The live app credits ThisIs-Developer as developer and maintainer. |
| MediChain | [Repository](https://github.com/ThisIs-Developer/MediChain), [medicine contract](https://github.com/ThisIs-Developer/MediChain/blob/main/contract/AddNewMedicine.sol), and [project team](https://medichain.pages.dev/#team) support medicine registration, lifecycle and purchase records, Ethereum integration, four contributors, and Baivab's Lead Full Stack Developer credit. Presented as a team prototype. |
| NoteMarker | [Repository](https://github.com/ThisIs-Developer/NoteMarker-Extension), [manifest](https://github.com/ThisIs-Developer/NoteMarker-Extension/blob/main/manifest.json), [project site](https://notemarker.pages.dev/), and [Mozilla listing](https://addons.mozilla.org/en-US/firefox/addon/notemarker/) support persistent highlighting and notes, WebExtensions/browser storage, and the Firefox release. Chromium builds are distributed through repository releases. The README names Baivab as project maintainer. |
| BlazeDemo Automation | [Wipro capstone repository](https://github.com/ThisIs-Developer/Wipro-Capstone-Project), [flight booking tests](https://github.com/ThisIs-Developer/Wipro-Capstone-Project/blob/main/BlazeDemo/src/test/java/testcases/FlightBookingTest.java), and [Maven configuration](https://github.com/ThisIs-Developer/Wipro-Capstone-Project/blob/main/BlazeDemo/pom.xml) support Java 17, Selenium, TestNG, Excel-driven data, page objects and report screenshots. The repository includes a Jenkinsfile and Dockerfile. The README credits Baivab and labels it an educational Wipro capstone; this is not an employment claim. |

The [GitHub repository API](https://api.github.com/repos/ThisIs-Developer/Markdown-Viewer) returned `created_at: 2024-04-08` and `pushed_at: 2026-09-03` for Markdown Viewer. This supports **2024—ongoing** in the independent-project timeline. It does not claim paid work or continuous full-time employment.

For audit context only, the API reported **471 stars / 117 forks** for Markdown Viewer on 6 September 2026. Counts are deliberately omitted from public portfolio copy to avoid a stale metric. No GitHub contribution count is claimed. The revised design has no contribution-chart motif.

### Claims deliberately omitted or qualified

- MediChain README latency, concurrent-user, scalability and security claims have no reproducible supporting benchmark in the reviewed evidence. They are omitted. Its contracts are prototype code; the portfolio does not promise production security, validated drug authenticity, or proven health outcomes.
- Markdown Viewer is **local-first**, not network-free. GitHub imports, remote diagram renderers, snapshot storage and Live Share can use network services. The portfolio does not make a blanket offline/privacy claim.
- BlazeDemo's README suite pass percentages are historical project claims, not measurements of the portfolio or an independently rerun test suite. They are omitted. The public BlazeDemo test target is not Baivab's own deployed product, so no misleading live-app CTA is used.
- NoteMarker's released status does not imply a current Chrome Web Store listing; the project site explains installation options.

## Project archive

| Entry | Evidence | Presentation |
| --- | --- | --- |
| Academic Management System | [Repository README](https://github.com/ThisIs-Developer/AMS) documents Spring, Redis, PostgreSQL/JPA, role-specific attendance workflows and five contributors. | Team prototype; Baivab is a contributor, not presented as sole author. The hosted Pages link is labeled **View frontend** because the documented backend requires separate local setup. |
| Llama 2 CSV Chatbot | [Implementation](https://github.com/ThisIs-Developer/Llama-2-GGML-CSV-Chatbot/blob/main/model.py) and [dependencies](https://github.com/ThisIs-Developer/Llama-2-GGML-CSV-Chatbot/blob/main/requirements.txt) show CSV ingestion, sentence-transformer embeddings, FAISS, LangChain, Streamlit and quantized Llama 2 inference. | Research prototype with a source link. Code resets conversation history per query, so persistent multi-turn memory is not claimed. It loads a pretrained quantized model; the portfolio does not claim Baivab fine-tuned the model. |
| SketchFlow | [Repository](https://github.com/ThisIs-Developer/SketchFlow) and [live canvas](https://sketchflow.pages.dev/) document vanilla JavaScript/Canvas tools, drawing styles, zoom, PNG output and JSON saving. | Open-source experiment. SVG export is marked upcoming in the source README, so it is not claimed. |
| Body Language Detection | [Archived repository](https://github.com/ThisIs-Developer/Body-Language-Detection-with-MediaPipe-and-OpenCV) documents landmark collection, scikit-learn pipelines and TensorFlow Lite export. | Archived research experiment. No accuracy figure or reliable emotion/mental-state inference is claimed. |
| News Scraper | [Archived repository](https://github.com/ThisIs-Developer/News-Scraping-using-BeautyfulSoup-Selenium-with-Django) documents Django, BeautifulSoup, Selenium, concurrent collection and Excel/MySQL output. | Archived experiment with a source link. No current production service or continued compatibility with publisher sites is promised. |

The [CSV chatbot Space API](https://huggingface.co/api/spaces/ThisIs-Developer/Llama-2-GGML-CSV-Chatbot) returned a `SLEEPING` runtime during review. Its repository remains available, but its Space is not used as an **Open app** link.

Archive years indicate the documented project period or repository activity, not a claim of continuous employment. AMS is featured and SketchFlow appears in the archive; both retain their team-prototype/open-source-experiment qualifications. Older classroom exercise collections, duplicated portfolio versions and unrelated repository forks were not promoted into selected work.

The repository API additionally verified creation/latest-push dates for the displayed ranges: MediChain 21 October 2024–27 May 2025; SketchFlow 23 August 2024–25 February 2026; News Scraper 10 August 2023–23 August 2024. Single-year entries are supported by repository creation or their documented release: NoteMarker 15 September 2024, BlazeDemo 11 June 2026, AMS 8 March 2024, CSV Chatbot 1 January 2024, and Body Language Detection 23 September 2023.

## Writing

Metadata was fetched from the [DEV articles API](https://dev.to/api/articles?username=thisisdeveloper&per_page=100), which returned 11 published articles. The latest two product posts and a practical Git workflow tutorial form the curated section. Display titles are edited for readability; each original publication title is preserved in the article data.

| Article | Published | Reading time | Published tags |
| --- | --- | --- | --- |
| [A Markdown Editor That Lives in Your Browser, Your Desktop, and a Single URL](https://dev.to/thisisdeveloper/a-markdown-editor-that-lives-in-your-browser-your-desktop-and-a-single-url-488m) | 8 May 2026 | 7 min | javascript, productivity, showdev, webdev |
| [Introducing Markdown Viewer v2.0](https://dev.to/thisisdeveloper/introducing-markdown-viewer-v20-com) | 14 May 2025 | 3 min | No tags supplied by DEV |
| [Getting Verified on GitHub!](https://dev.to/thisisdeveloper/secure-your-github-commits-with-verification-3hja) | 15 September 2024 | 3 min | github, bash, git, tutorial |

Descriptions are short editorial summaries. All 11 full articles are now stored as sanitized HTML and readable on local blog routes, with locally stored images. Article descriptions describe their publication context: the 2026 article's earlier localStorage implementation and sharing design do not override the newer repository's IndexedDB and Cloudflare implementation.

## Authentic image provenance

Responsive WebP copies are generated from the author's project screenshots and stored under `assets/work/`. See [asset provenance](../assets/README.md) for image sizes, optimization and any additional provenance maintained by the asset workflow.

| Local basename | Original screenshot |
| --- | --- |
| `markdown-viewer` | [Current workspace screenshot in the project README](https://github.com/user-attachments/assets/5a0d6fda-96f0-4baf-bf7a-0ffbe5119eab) |
| `medichain` | [Dashboard screenshot in the project README](https://github.com/user-attachments/assets/f17bda53-9a86-46d3-bac4-358c5ffb6653) |
| `notemarker` | [Research-paper screenshot in the repository](https://raw.githubusercontent.com/ThisIs-Developer/NoteMarker-Extension/main/assets/research%20paper.png) |
| `blazedemo` | [Automated booking confirmation capture](https://raw.githubusercontent.com/ThisIs-Developer/Wipro-Capstone-Project/main/BlazeDemo/screenshots/BookingSuccess_20260615_000537.png) |
| `ams` | Existing author-created `assets/projects/project-5.jpg`, mapped to AMS in the original portfolio; preserves its two-phone attendance-dashboard composition |
| `sketchflow` | [Canvas screenshot in the repository](https://raw.githubusercontent.com/ThisIs-Developer/SketchFlow/main/assets/art.png) |

Six additional 400px folder peeks show Markdown Viewer's diagram workspace and Live Share, MediChain's order history and medicine tracking, and NoteMarker annotations on LeetCode and YouTube. These were retrieved from the author READMEs and visually inspected on 7 September 2026. Exact URLs, dimensions, and byte counts are in [asset provenance](../assets/README.md).

## External link verification

Direct HTTP checks on 6 September 2026 returned **200** for:

- The GitHub profile and all nine featured/archive repository links.
- Markdown Viewer, MediChain, NoteMarker, AMS frontend and SketchFlow deployments.
- The DEV profile and all three selected article URLs.

The first revision's Node-based link sweep returned 403 for those DEV pages, while the earlier direct checks and DEV API retrieval succeeded. This is recorded as automated-client access restriction in [verification notes](verification.md), not as a claim that every client can retrieve those pages. These historical checks do not replace verification of the revised design.

The Mozilla NoteMarker listing was retrieved through web browsing and confirmed the author and released extension; a direct HEAD request timed out. The site uses the verified NoteMarker project homepage as the installation CTA.

LinkedIn rejects automated requests: HEAD returned **405** and GET returned **999**. The exact `https://www.linkedin.com/in/baivabsarkar/` URL is linked by the author's GitHub profile and supplied resume, so it is preserved, but its current public profile contents were not independently inspected. HTTP rejection is not treated as proof of a dead profile.

Email is a `mailto:` action sourced from the resume and author profiles. No test email was sent. A successful HTTP response establishes URL reachability, not a guarantee that a project's wallet, backend, extension installation or external hosting account works end to end.

## Content model

- `data/projects.json`: Markdown Viewer, MediChain and NoteMarker Extension, with evidence-backed detail and images.
- `data/articles.json`: 11 full published articles with local routes, sanitized body HTML, local images, ISO dates and reading minutes; three are marked featured. No runtime API dependency.
- `data/experiments.json`: AMS, the CSV chatbot, SketchFlow, Body Language Detection and News Scraping Platform. `data/project-additions.json` holds the Bengali music app, medical chatbot, TaskFlow and Simon.
- `data/profile.json`, `data/experience.json`, `data/skills.json`, `data/certifications.json`: resume-backed positioning and the training/education/independent-project timeline.

The five capability disclosures summarize demonstrated skills. Quick Ask uses the same curated project selection and public portfolio data; see `docs/quick-ask.md` for Workers AI validation and fallback behavior.

After content edits, run the repository build so all generated pages and the sitemap remain consistent with the data. Review sources again before adding new claims, changing role dates or updating published article metadata.

## Owner-supplied update — 8 September 2026

Baivab explicitly supplied the private freelance application descriptions in data/enterprise.json: invoice management, collaboration/workflow, proposal generation, audit management and enterprise audit/project support associated with NTPC, Bluestar and other enterprise environments. These are presented as his descriptions, without implying direct employment or disclosing architecture, source code or client data. The confidentiality notice is retained.

Additional projects in data/project-additions.json include TaskFlow, Llama 2 GGML Medical Chatbot and Sei-Sangeet-Bangla. TaskFlow’s public repository supports customizable columns, drag/drop tasks, search, task details and localStorage persistence; assignee fields are not a hosted collaboration backend. The medical chatbot implementation uses LangChain RetrievalQA, FAISS, sentence-transformer embeddings and a pretrained model. It is a research prototype with no clinical validation or training claim. Sei-Sangeet-Bangla is included from the owner’s project list with a public site link and private-source status; no private repository contents are published.

Both historical chatbot articles retain their original prose alongside visible technical corrections about pretrained inference and retrieval. The medical article also carries its non-clinical qualification, and a malformed code fence was repaired to restore its setup steps, screenshots and notes. Publication dates distinguish historical article details from current project capabilities.

## Curated project update

Featured: Markdown Viewer, Sei-Sangeet-Bangla, Llama 2 GGML Medical Chatbot, Body Language Detection, MediChain and AMS. Archive: NoteMarker Extension, SketchFlow, Llama 2 GGML CSV Chatbot, News Scraping Platform, TaskFlow and Simon.

[Simon source](https://github.com/ThisIs-Developer/Simon) and [live game](https://simonsays.pages.dev/) were verified on 9 September 2026. Its HTML/CSS/JavaScript implements a growing colour sequence, sound/flash feedback, restart/help controls and a highest score stored in localStorage. Bootstrap is not claimed because the inspected HTML does not import it. Its project image is a replaceable placeholder. The two audit-related private engagements are consolidated into one card, for four private-work entries overall.
