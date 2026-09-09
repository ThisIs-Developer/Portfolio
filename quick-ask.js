import { retrieve, compose } from "./quick-ask-core.js";

const form = document.querySelector(".quick-ask");
if (form) {
  const output = document.querySelector("#ask-answer");
  const extras = document.querySelector(".ask-extras");
  const input = form.elements.question;
  const submit = form.querySelector('[type="submit"]');
  const cache = new Map();
  let active = 0,
    controller,
    factsPromise;
  const facts = () =>
    (factsPromise ||= fetch("/assets/portfolio-knowledge.json")
      .then((r) => {
        if (!r.ok) throw new Error("unavailable");
        return r.json();
      })
      .catch(() => []));
  form.hidden = false;
  extras.hidden = false;
  input.addEventListener("focus", facts, { once: true });
  function show(result) {
    output.replaceChildren();
    const label = document.createElement("span");
    label.className = "ask-answer-label";
    label.textContent =
      result.mode === "ai"
        ? "AI · Grounded in my portfolio"
        : result.mode === "restricted"
          ? "About Baivab only"
          : "From my portfolio";
    output.append(label);
    for (const text of result.answer.split("\n\n")) {
      const p = document.createElement("p");
      p.textContent = text;
      output.append(p);
    }
    if (result.sources?.length) {
      const links = document.createElement("div");
      links.className = "ask-sources";
      for (const source of result.sources) {
        if (!source.url?.startsWith("/") || source.url.startsWith("//"))
          continue;
        const a = document.createElement("a");
        a.href = source.url;
        a.textContent = `${source.title} ↗`;
        links.append(a);
      }
      output.append(links);
    }
    if (result.notice) {
      const note = document.createElement("small");
      note.textContent = result.notice;
      output.append(note);
    }
    output.hidden = false;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    const id = ++active;
    controller?.abort();
    controller = new AbortController();
    const requestController = controller;
    const key = question.toLowerCase();
    if (cache.has(key)) {
      show(cache.get(key));
      submit.disabled = false;
      form.removeAttribute("aria-busy");
      return;
    }
    form.setAttribute("aria-busy", "true");
    submit.disabled = true;
    output.hidden = false;
    output.textContent = "Finding the right detail…";
    const timer = setTimeout(() => requestController.abort(), 6500);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const result = await response.json();
      if (typeof result.answer !== "string" || !Array.isArray(result.sources))
        throw new Error("invalid response");
      if (id !== active) return;
      show(result);
      cache.set(key, result);
    } catch {
      const known = await facts();
      if (id !== active) return;
      show(
        known.length
          ? compose(retrieve(question, known).slice(0, 1))
          : {
              answer:
                "Quick Ask is temporarily unavailable. You can still explore my background and projects below.",
              mode: "portfolio",
              sources: [
                { title: "About me", url: "/about" },
                { title: "My work", url: "/work" },
              ],
            },
      );
    } finally {
      clearTimeout(timer);
      if (id === active) {
        submit.disabled = false;
        form.removeAttribute("aria-busy");
      }
    }
  });
  document.querySelectorAll("[data-question]").forEach((button) =>
    button.addEventListener("click", () => {
      input.value = button.dataset.question;
      form.requestSubmit();
    }),
  );
}
