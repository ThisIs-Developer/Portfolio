const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

export function articleCategory(article) {
  if (article.category) return article.category;
  if (/markdown|viewer|editor/i.test(article.title)) return "Projects";
  if (/git|github/i.test(article.title)) return "Git & tooling";
  if (/python|chatbot|llama|ai|machine|opencv/i.test(article.title))
    return "AI & data";
  return "Notes";
}

const illustrations = {
  document:
    '<rect x="94" y="31" width="154" height="196" rx="15" class="art-sheet art-back" transform="rotate(-12 171 129)"/><rect x="122" y="34" width="154" height="196" rx="15" class="art-sheet" transform="rotate(8 199 132)"/><g transform="rotate(8 199 132)"><path d="M151 79h92M151 93h69M151 166h92M151 180h71M151 194h83" class="art-line"/><path d="M158 144v-29l14 18 14-18v29m20-28v28m-8-8 8 8 8-8" class="art-icon"/></g>',
  git: '<path d="M128 47v160m0-98c0 34 108 9 108 53v45" class="art-connector"/><circle cx="128" cy="58" r="17" class="art-node"/><circle cx="128" cy="121" r="17" class="art-node"/><circle cx="128" cy="198" r="17" class="art-node"/><circle cx="236" cy="198" r="17" class="art-node"/><circle cx="236" cy="70" r="32" class="art-sheet"/><path d="m224 70 9 9 15-18" class="art-icon"/>',
  ai: '<path d="m96 66 91 62 82-78M96 192l91-64 87 68M96 66v126m173-142 5 146" class="art-connector"/><circle cx="96" cy="66" r="23" class="art-node"/><circle cx="96" cy="192" r="23" class="art-node"/><circle cx="269" cy="50" r="23" class="art-node"/><circle cx="274" cy="196" r="23" class="art-node"/><rect x="148" y="90" width="78" height="78" rx="22" class="art-sheet"/><path d="m172 129 9 9 20-20" class="art-icon"/>',
  vision:
    '<rect x="80" y="30" width="211" height="197" rx="24" class="art-sheet"/><rect x="112" y="59" width="147" height="138" rx="15" class="art-back"/><circle cx="185" cy="128" r="47" class="art-connector"/><circle cx="185" cy="128" r="22" class="art-node"/><path d="M133 90V78h12m82 12V78h-12m-82 87v12h12m82-12v12h-12" class="art-icon"/>',
  audio:
    '<rect x="69" y="61" width="236" height="136" rx="28" class="art-sheet"/><path d="M101 120v18m21-36v53m21-78v103m21-68v36m21-102v164m21-117v71m21-48v26m21-67v108m21-74v37" class="art-connector"/>',
  web: '<rect x="63" y="43" width="251" height="177" rx="19" class="art-sheet"/><path d="M63 79h251" class="art-line"/><circle cx="84" cy="62" r="4" class="art-node"/><circle cx="99" cy="62" r="4" class="art-node"/><circle cx="114" cy="62" r="4" class="art-node"/><rect x="86" y="102" width="77" height="94" rx="10" class="art-back"/><path d="M187 115h95m-95 18h70m-70 40h95m-95 18h70" class="art-line"/>',
};

export function articleArt(article, extraClass = "") {
  const kind =
    article.art ||
    (/opencv/i.test(article.title)
      ? "vision"
      : /audio/i.test(article.title)
        ? "audio"
        : /git|github/i.test(article.title) && !/markdown/i.test(article.title)
          ? "git"
          : /llama|chatbot/i.test(article.title)
            ? "ai"
            : /markdown/i.test(article.title)
              ? "document"
              : "web");
  const safeKind = Object.hasOwn(illustrations, kind) ? kind : "document";
  return `<div class="article-art editorial-art art-${safeKind} ${esc(extraClass)}" aria-hidden="true"><span class="art-orbit"></span><svg viewBox="0 0 376 258" fill="none" xmlns="http://www.w3.org/2000/svg">${illustrations[safeKind]}</svg><span class="art-caption">${esc(articleCategory(article))}</span><span class="art-edition">BAIVAB SARKAR · ENGINEERING</span></div>`;
}
