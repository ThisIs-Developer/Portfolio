# Published assets

All project visuals depict Baivab's own projects. No reference creator photographs, illustrations, project imagery, or stock imagery are included. WebP variants only resize and compress the original screenshots; they do not invent interface details. The design uses the reference's font families through separately obtained official, licensed Google Fonts files.

| Asset | Source | Output dimensions (800 / 1400 widths) | Bytes (800 / 1400) |
| --- | --- | --- | --- |
| `work/markdown-viewer-*.webp` | [Author's current README screenshot](https://github.com/user-attachments/assets/5a0d6fda-96f0-4baf-bf7a-0ffbe5119eab) | 800×450 / 1400×787 | 51,220 / 127,532 |
| `work/medichain-*.webp` | [Author's dashboard screenshot](https://github.com/user-attachments/assets/f17bda53-9a86-46d3-bac4-358c5ffb6653) | 800×350 / 1400×612 | 11,698 / 24,154 |
| `work/notemarker-*.webp` | [Repository research-paper screenshot](https://raw.githubusercontent.com/ThisIs-Developer/NoteMarker-Extension/main/assets/research%20paper.png) | 800×450 / 1400×787 | 70,096 / 179,632 |
| `work/blazedemo-*.webp` | [Repository test-run screenshot](https://raw.githubusercontent.com/ThisIs-Developer/Wipro-Capstone-Project/main/BlazeDemo/screenshots/BookingSuccess_20260615_000537.png) | 800×450 / 1400×788 | 18,504 / 33,038 |
| `work/ams-*.webp` | Existing author-created `projects/project-5.jpg` (4096×4096), mapped to AMS in the original portfolio | 800×800 / 1400×1400 | 34,832 / 70,492 |
| `work/sketchflow-*.webp` | [Repository canvas screenshot](https://raw.githubusercontent.com/ThisIs-Developer/SketchFlow/main/assets/art.png) (1529×834) | 800×436 / 1400×764 | 24,104 / 46,994 |

BlazeDemo's original is 784×441; its larger variant is an enlargement for consistent responsive filenames, not additional detail.

AMS retains the author's original two-phone dashboard composition without cropping or fabricated interface content. SketchFlow depicts the canvas interface captured in its repository, rather than the README's logo-only cover. Both variants were inspected and compressed directly from those originals on September 7, 2026.

The small folder peeks use additional genuine screenshots linked from each author's project README. They are resized to 400 pixels wide, retain their original proportions, and were visually inspected on September 7, 2026.

| Folder peek | Author's source | Dimensions | Bytes |
| --- | --- | --- | --- |
| `work/markdown-viewer-peek-1.webp` | [Diagram workspace](https://github.com/user-attachments/assets/e4560bc1-d6a7-409a-8a93-c054d0a853b3) | 400×175 | 7,216 |
| `work/markdown-viewer-peek-2.webp` | [Live Share session](https://github.com/user-attachments/assets/0b2080e8-6ba8-4dac-a58a-d043fadeeb61) | 400×175 | 8,478 |
| `work/medichain-peek-1.webp` | [Order history](https://github.com/user-attachments/assets/dd6f7ae8-4223-427e-941e-b524eec850e8) | 400×174 | 4,796 |
| `work/medichain-peek-2.webp` | [Medicine tracking](https://github.com/user-attachments/assets/084df5ed-6356-40f8-beaa-e985def44016) | 400×225 | 4,806 |
| `work/notemarker-peek-1.webp` | [LeetCode annotations](https://github.com/user-attachments/assets/dcf498a8-68e8-4e16-ac30-a1e8ed7071e4) | 400×225 | 10,784 |
| `work/notemarker-peek-2.webp` | [YouTube annotations](https://github.com/user-attachments/assets/92114753-c392-4508-9b45-1d02d9eac490) | 400×225 | 19,644 |

`profile/baivab-480.webp` (480×517, 10.5 KB) and `baivab-800.webp` (800×862, 19.4 KB) are compressed from the existing `profile2.png`, preserving the portrait. The original source portraits and historical project JPEGs remain in version control but are not requested by either page or copied into the optional `dist` build.

The active type system matches the reference's families: **Instrument Serif** for display text, **Instrument Sans** for body/UI text, and **Nanum Pen Script** for handwritten asides. Their Latin WOFF2 subsets were downloaded from the official Google Fonts CSS API, not copied from the reference's hosting. All fonts load locally; there are no third-party font requests at runtime. Georgia, Arial, and cursive provide system fallbacks.

| Font asset | Style / weights | Bytes | Included license |
| --- | --- | ---: | --- |
| `fonts/instrument-sans-latin-variable.woff2` | Normal, 400–700 | 30,092 | `fonts/OFL-Instrument-Sans.txt` |
| `fonts/instrument-serif-latin-regular.woff2` | Normal, 400 | 21,032 | `fonts/OFL-Instrument-Serif.txt` |
| `fonts/instrument-serif-latin-italic.woff2` | Italic, 400 | 22,128 | `fonts/OFL-Instrument-Serif.txt` |
| `fonts/nanum-pen-script-latin-regular.woff2` | Normal, 400 | 14,972 | `fonts/OFL-Nanum-Pen-Script.txt` |

These four active files total 88,224 bytes. Exact official binary URLs and Google Fonts license sources are recorded in the [reference audit](../docs/reference-style-audit.md#self-hosted-font-assets-and-licenses). The earlier `fonts/space-grotesk-latin-variable.woff2` and `fonts/OFL-Space-Grotesk.txt` remain in source history/assets but are not requested by the redesigned pages.

`social-preview.png` is an original 1200×630 typographic composition using the portfolio palette and licensed display fonts (rendered by `node scripts/social-preview.mjs`). `apple-touch-icon.png` and the root `favicon.png` are rendered from the original root `favicon.svg` monogram. No AI-generated imagery is used.

`resume/Baivab_Sarkar_Resume.pdf` is the user-supplied July 2026 resume, copied without modification. `resume/CV-BAIVAB SARKAR.pdf` contains the same bytes to preserve old download links. The portfolio's GitHub URL uses the verified profile address; the resume is preserved as provided.

The six `work/*-400.webp` variants are proportional 400px copies of the existing 800px screenshots, optimized for the small folder sheets. Full archive images retain the 800/1400px variants.
