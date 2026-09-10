import {
  retrieve,
  compose,
  conversationReply,
} from "./quick-ask-core.js?v=20260910";

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
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  form.hidden = false;
  extras.hidden = false;
  input.addEventListener("focus", facts, { once: true });

  function replyShell(question, state, detail) {
    output.replaceChildren();
    output.dataset.state = state;
    const sent = element("div", "ask-sent");
    const label = element("span", "ask-sent-label", "You asked");
    const message = element("p", "ask-sent-message", question);
    sent.append(label, message);
    const reply = element("div", "ask-reply");
    const identity = element("div", "ask-reply-heading");
    identity.append(element("span", "ask-answer-label", detail));
    const body = element("div", "ask-reply-body");
    reply.append(identity, body);
    output.append(sent, reply);
    output.hidden = false;
    return body;
  }

  function pending(question) {
    const body = replyShell(question, "loading", "Portfolio assistant");
    const thinking = element("div", "ask-thinking");
    const dots = element("span", "ask-typing-dots");
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) dots.append(element("i", ""));
    thinking.append(dots, element("span", "", "Let me think…"));
    body.append(thinking);
  }

  function show(result, question) {
    const body = replyShell(
      question,
      "ready",
      result.mode === "ai"
        ? "Portfolio assistant · AI"
        : result.mode === "conversation"
          ? "Portfolio assistant"
          : result.mode === "restricted"
            ? "Here for portfolio questions"
            : "From Baivab’s portfolio",
    );
    for (const text of result.answer.split("\n\n"))
      body.append(element("p", "", text));
    if (result.sources?.length) {
      const links = element("div", "ask-sources");
      for (const source of result.sources) {
        if (
          typeof source.url !== "string" ||
          !source.url.startsWith("/") ||
          source.url.startsWith("//")
        )
          continue;
        const target = new URL(source.url, location.origin);
        if (target.origin !== location.origin) continue;
        const a = element("a", "", source.title);
        a.href = target.pathname + target.search + target.hash;
        const arrow = element("span", "", "↗");
        arrow.setAttribute("aria-hidden", "true");
        a.append(arrow);
        links.append(a);
      }
      if (links.children.length) body.append(links);
    }
    if (result.notice) body.append(element("small", "", result.notice));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    const id = ++active;
    controller?.abort();
    const key = question.toLowerCase();
    input.value = "";
    input.placeholder = "What else would you like to know?";
    const immediate = conversationReply(question) || cache.get(key);
    if (immediate) {
      show(immediate, question);
      submit.disabled = false;
      form.removeAttribute("aria-busy");
      return;
    }
    controller = new AbortController();
    const requestController = controller;
    form.setAttribute("aria-busy", "true");
    submit.disabled = true;
    pending(question);
    const timer = setTimeout(() => requestController.abort(), 6500);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: requestController.signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const result = await response.json();
      if (typeof result.answer !== "string" || !Array.isArray(result.sources))
        throw new Error("invalid response");
      if (id !== active) return;
      show(result, question);
      if (cache.size >= 40) cache.delete(cache.keys().next().value);
      cache.set(key, result);
    } catch {
      const known = await facts();
      if (id !== active) return;
      show(
        known.length
          ? compose(retrieve(question, known).slice(0, 1))
          : {
              answer:
                "I can’t look that up right now, but you can still explore Baivab’s background and projects here. Give me another try in a moment.",
              mode: "portfolio",
              sources: [
                { title: "About Baivab", url: "/about" },
                { title: "Explore the work", url: "/work" },
              ],
            },
        question,
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
