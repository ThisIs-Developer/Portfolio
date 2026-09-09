// Runs on the already-sanitized document in the importer's isolated DOM.
export function polishArticle({ bodyHtml, editorial }) {
  const doc = new DOMParser().parseFromString(bodyHtml, "text/html");
  const body = doc.body;
  const promo =
    /show some love|drop\s+(a\s+|your\s+)?comment|drop your (thoughts|feedback)|happy (writing|coding)|thanks? (you )?for reading|if you.ve made it this far|if you (find|love) (this|it)|#ShareYourThoughts|#OpenCVAdventures|#ImageAlchemy|#OpenCVMagic|#CodeYourDreams|flaunt your|found this helpful|share it with your network|star it on github|elevate your Markdown experience|your favorite Markdown tool/i;
  for (const element of [...body.querySelectorAll("p,blockquote,h2,h3,h4")]) {
    if (
      !element.querySelector("img,pre") &&
      promo.test(element.textContent.replace(/\s+/g, " "))
    )
      element.remove();
  }
  for (const item of [...body.querySelectorAll("li")]) {
    if (
      !item.querySelector("img,pre,code") &&
      /star it on github|share it with your network|drop your feedback/i.test(
        item.textContent,
      )
    )
      item.remove();
  }
  for (const list of body.querySelectorAll("ul,ol"))
    if (!list.children.length) list.remove();
  for (const heading of body.querySelectorAll("h2,h3,h4")) {
    const walker = doc.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
      walker.currentNode.textContent = walker.currentNode.textContent
        .replace(
          /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu,
          "",
        )
        .trim();
  }
  const replacements = [
    [/ChatBot Conversession/gi, "Conversation examples"],
    [/Ready, Set, Let's Do It!/gi, "Setup"],
    [/What Exactly is Markdown\?/gi, "Understanding Markdown"],
    [/What’s New\?/gi, "Release highlights"],
    [/Development Specs/gi, "Implementation overview"],
  ];
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest("pre,code")) continue;
    for (const [match, value] of replacements)
      node.textContent = node.textContent.replace(match, value);
    node.textContent = node.textContent.replace(
      /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu,
      "",
    );
    node.textContent = node.textContent.replace(
      /It is trained on the pdf/gi,
      "It retrieves reference passages from the PDF",
    );
    node.textContent = node.textContent.replace(
      /but it has the potential to be a valuable tool for patients, healthcare professionals, and researchers/gi,
      "and has not been validated for clinical use",
    );
  }
  if (editorial) {
    const first = body.firstElementChild;
    if (first?.matches("p,blockquote") && !first.querySelector("img,pre,code"))
      first.remove();
    const opening = doc.createElement("p");
    opening.textContent = editorial.intro;
    body.prepend(opening);
  }
  for (const element of body.querySelectorAll("p"))
    if (!element.textContent.trim() && !element.querySelector("img"))
      element.remove();
  const headings = [...body.querySelectorAll("h2,h3,h4")]
    .filter((h) => h.id)
    .map((h) => ({
      id: h.id,
      text: h.textContent.trim(),
      level: Number(h.tagName.slice(1)),
    }));
  return { bodyHtml: body.innerHTML.trim().replace(/[\t ]+$/gm, ""), headings };
}
