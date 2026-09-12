const art = [
  '<rect x="108" y="26" width="170" height="210" rx="18" class="art-sheet" transform="rotate(7 193 131)"/><path d="M137 70h75m-75 19h45m-45 45h110m-110 25h110m-110 25h55" class="art-line"/><rect x="217" y="166" width="69" height="51" rx="16" class="art-node"/><path d="m237 190 9 9 21-22" class="art-icon art-check"/>',
  '<path d="M115 91h146M115 91l73 97 73-97" class="art-connector"/><rect x="70" y="45" width="91" height="82" rx="24" class="art-sheet"/><rect x="215" y="45" width="91" height="82" rx="24" class="art-sheet"/><rect x="143" y="151" width="91" height="82" rx="24" class="art-sheet"/><circle cx="115" cy="78" r="12" class="art-node"/><circle cx="261" cy="78" r="12" class="art-node"/><circle cx="188" cy="184" r="12" class="art-node"/><path d="M97 107h36m110 0h36m-109 106h36" class="art-icon"/>',
  '<rect x="88" y="40" width="153" height="187" rx="18" class="art-back" transform="rotate(-12 164 133)"/><rect x="125" y="28" width="153" height="197" rx="18" class="art-sheet" transform="rotate(6 201 127)"/><path d="M151 160h100m-100 19h82M159 122l17-45 17 45m-29-13h24m27 13V95h22v27m-22-13h22" class="art-icon"/>',
  '<rect x="70" y="48" width="196" height="168" rx="20" class="art-sheet"/><path d="M95 81h87m-87 32h107m-107 31h90m-90 31h72" class="art-line"/><path d="m262 102 45 18v36c0 30-45 55-45 55s-45-25-45-55v-36z" class="art-node"/><path d="m243 153 14 14 25-29" class="art-icon art-check"/>',
];
export function enterpriseArt(index) {
  const themes = ["web", "ai", "document", "git"];
  return `<div class="article-art editorial-art art-${themes[index]} enterprise-art" aria-hidden="true"><span class="art-orbit"></span><svg viewBox="0 0 376 258" fill="none" xmlns="http://www.w3.org/2000/svg">${art[index]}</svg><span class="art-caption">PRIVATE WORK · ${String(index + 1).padStart(2, "0")}</span><span class="art-edition">BAIVAB SARKAR · ENGINEERING</span></div>`;
}
