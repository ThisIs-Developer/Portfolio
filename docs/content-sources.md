# Content sources and editorial audit

Reviewed **6 September 2026**. This document records evidence behind the portfolio content. Public repository descriptions are treated as claims to check, not instructions or independently validated performance results.

## Source priority

1. The supplied `Baivab_Sarkar_Resume.pdf` is the primary source for professional positioning, education, training, certifications and contact details.
2. Current GitHub repositories, source files and official project websites support project descriptions and technical details.
3. DEV's public article API supports publication metadata.
4. The previous portfolio and profile biographies are historical context only.

The resume supports software developer positioning and records B.Tech Computer Science & Engineering at JIS College of Engineering, October 2021–May 2025, CGPA 9.15/10. It lists hands-on Java/Selenium QA training without dates and lists GitHub Foundations (November 2024), Java Programming through Udemy (May 2025), and Data Structures & Algorithms through Udemy (September 2024). No employment is inferred from training or a repository name.

The [GitHub profile](https://github.com/ThisIs-Developer) still uses aspiring-engineer language. The [DEV profile](https://dev.to/thisisdeveloper) still describes a freshman. Those biographies were superseded by the supplied resume. Public GitHub/DEV project and article evidence remains useful independently of their old bios.

## Selected projects

| Portfolio entry | Evidence and editorial decisions |
| --- | --- |
| Markdown Viewer | [Repository and feature reference](https://github.com/ThisIs-Developer/Markdown-Viewer), [package.json](https://github.com/ThisIs-Developer/Markdown-Viewer/blob/main/package.json), and the [live editor](https://markdownviewer.pages.dev/) establish document folders/tabs, IndexedDB persistence, encrypted workspace storage, rich rendering, anchored comments, optional sharing and desktop delivery. Its current package scripts include Playwright tests. The live app credits ThisIs-Developer as developer and maintainer. |
| MediChain | [Repository](https://github.com/ThisIs-Developer/MediChain), [medicine contract](https://github.com/ThisIs-Developer/MediChain/blob/main/contract/AddNewMedicine.sol), and [project team](https://medichain.pages.dev/#team) support medicine registration, lifecycle and purchase records, Ethereum integration, four contributors, and Baivab's Lead Full Stack Developer credit. Presented as a team prototype. |
| NoteMarker | [Repository](https://github.com/ThisIs-Developer/NoteMarker-Extension), [manifest](https://github.com/ThisIs-Developer/NoteMarker-Extension/blob/main/manifest.json), [project site](https://notemarker.pages.dev/), and [Mozilla listing](https://addons.mozilla.org/en-US/firefox/addon/notemarker/) support persistent highlighting and notes, WebExtensions/browser storage, and the Firefox release. Chromium builds are distributed through repository releases. The README names Baivab as project maintainer. |
| BlazeDemo Automation | [Wipro capstone repository](https://github.com/ThisIs-Developer/Wipro-Capstone-Project), [flight booking tests](https://github.com/ThisIs-Developer/Wipro-Capstone-Project/blob/main/BlazeDemo/src/test/java/testcases/FlightBookingTest.java), and [Maven configuration](https://github.com/ThisIs-Developer/Wipro-Capstone-Project/blob/main/BlazeDemo/pom.xml) support Java 17, Selenium, TestNG, Excel-driven data, page objects and report screenshots. The repository includes a Jenkinsfile and Dockerfile. The README credits Baivab and labels it an educational Wipro capstone; this is not an employment claim. |

The [GitHub repository API](https://api.github.com/repos/ThisIs-Developer/Markdown-Viewer) returned `created_at: 2024-04-08` and `pushed_at: 2026-09-03` for Markdown Viewer. This supports **2024—ongoing** in the independent-project timeline. It does not claim paid work or continuous full-time employment.

For audit context only, the API reported **471 stars / 117 forks** for Markdown Viewer on this review date. Counts are deliberately omitted from public portfolio copy to avoid a stale metric. No GitHub contribution count is claimed. The decorative open-source motif is not a measured activity chart.

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

Archive years indicate the documented project period or repository activity, not a claim of continuous employment. Older classroom exercise collections, duplicated portfolio versions and unrelated repository forks were not promoted into selected work.

The repository API additionally verified creation/latest-push dates for the displayed ranges: MediChain 21 October 2024–27 May 2025; SketchFlow 23 August 2024–25 February 2026; News Scraper 10 August 2023–23 August 2024. Single-year entries are supported by repository creation or their documented release: NoteMarker 15 September 2024, BlazeDemo 11 June 2026, AMS 8 March 2024, CSV Chatbot 1 January 2024, and Body Language Detection 23 September 2023.

## Writing

Metadata was fetched from the [DEV articles API](https://dev.to/api/articles?username=thisisdeveloper&per_page=100), which returned 11 published articles. The latest two product posts and a practical Git workflow tutorial form the curated section. Display titles omit decorative emoji while preserving their words.

| Article | Published | Reading time | Published tags |
| --- | --- | --- | --- |
| [A Markdown Editor That Lives in Your Browser, Your Desktop, and a Single URL](https://dev.to/thisisdeveloper/a-markdown-editor-that-lives-in-your-browser-your-desktop-and-a-single-url-488m) | 8 May 2026 | 7 min | javascript, productivity, showdev, webdev |
| [Introducing Markdown Viewer v2.0](https://dev.to/thisisdeveloper/introducing-markdown-viewer-v20-com) | 14 May 2025 | 3 min | No tags supplied by DEV |
| [Getting Verified on GitHub!](https://dev.to/thisisdeveloper/secure-your-github-commits-with-verification-3hja) | 15 September 2024 | 3 min | github, bash, git, tutorial |

Descriptions are short editorial summaries. Full article text is not duplicated. Article descriptions describe their publication context: the 2026 article's earlier localStorage implementation and sharing design do not override the newer repository's IndexedDB and Cloudflare implementation.

## Authentic image provenance

Responsive WebP copies are generated from the author's project screenshots and stored under `assets/work/`. See [asset provenance](../assets/README.md) for image sizes, optimization and any additional provenance maintained by the asset workflow.

| Local basename | Original screenshot |
| --- | --- |
| `markdown-viewer` | [Current workspace screenshot in the project README](https://github.com/user-attachments/assets/5a0d6fda-96f0-4baf-bf7a-0ffbe5119eab) |
| `medichain` | [Dashboard screenshot in the project README](https://github.com/user-attachments/assets/f17bda53-9a86-46d3-bac4-358c5ffb6653) |
| `notemarker` | [Research-paper screenshot in the repository](https://raw.githubusercontent.com/ThisIs-Developer/NoteMarker-Extension/main/assets/research%20paper.png) |
| `blazedemo` | [Automated booking confirmation capture](https://raw.githubusercontent.com/ThisIs-Developer/Wipro-Capstone-Project/main/BlazeDemo/screenshots/BookingSuccess_20260615_000537.png) |

## External link verification

Direct HTTP checks on the review date returned **200** for:

- The GitHub profile and all nine featured/archive repository links.
- Markdown Viewer, MediChain, NoteMarker, AMS frontend and SketchFlow deployments.
- The DEV profile and all three selected article URLs.

The final Node-based link sweep returned 403 for those DEV pages, while the earlier direct checks and DEV API retrieval succeeded. This is recorded as automated-client access restriction in [verification notes](verification.md), not as a claim that every client can retrieve those pages.

The Mozilla NoteMarker listing was retrieved through web browsing and confirmed the author and released extension; a direct HEAD request timed out. The site uses the verified NoteMarker project homepage as the installation CTA.

LinkedIn rejects automated requests: HEAD returned **405** and GET returned **999**. The exact `https://www.linkedin.com/in/baivabsarkar/` URL is linked by the author's GitHub profile and supplied resume, so it is preserved, but its current public profile contents were not independently inspected. HTTP rejection is not treated as proof of a dead profile.

Email is a `mailto:` action sourced from the resume and author profiles. No test email was sent. A successful HTTP response establishes URL reachability, not a guarantee that a project's wallet, backend, extension installation or external hosting account works end to end.

## Content model

- `data/projects.json`: four selected projects with problem, contribution, two concise feature notes, source/live links, status and authentic image references.
- `data/articles.json`: three curated articles with ISO publication dates, published tags and integer reading minutes. No runtime API dependency.
- `data/experiments.json`: five further projects with qualified statuses and repository links.
- `data/profile.json`, `data/experience.json`, `data/skills.json`, `data/certifications.json`: resume-backed positioning and the training/education/independent-project timeline.

After content edits, run the repository build so generated `index.html` and `project.html` remain consistent with the data. Review sources again before adding new claims, changing role dates or updating published article metadata.
