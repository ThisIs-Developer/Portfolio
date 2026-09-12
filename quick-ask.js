import {
  retrieve,
  compose,
  conversationReply,
} from "./quick-ask-core.js?v=20260910b";

const form = document.querySelector(".quick-ask");
if (form) {
  const widget = form.closest(".ask-widget");
  const output = widget.querySelector("#ask-answer");
  const extras = widget.querySelector(".ask-extras");
  const input = form.elements.question;
  const submit = form.querySelector('[type="submit"]');
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const cache = new Map();
  const timers = new Set();
  let active = 0,
    controller,
    factsPromise,
    motion;
  const later = (callback, delay) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  };
  const clearTimers = () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  };
  const facts = () =>
    (factsPromise ||= fetch("/assets/portfolio-knowledge.json")
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
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

  function animateHeight(from, to, closing = false) {
    motion?.cancel();
    if (reducedMotion.matches) return null;
    document.dispatchEvent(
      new CustomEvent("portfolio:motion", { detail: { duration: 320 } }),
    );
    motion = output.animate(
      [
        { height: `${from}px`, opacity: closing ? 1 : from ? 0.7 : 0 },
        { height: `${to}px`, opacity: closing ? 0 : 1 },
      ],
      { duration: closing ? 220 : 320, easing: "cubic-bezier(.22,.8,.25,1)" },
    );
    return motion;
  }

  function reveal(content, state) {
    const previous = output.hidden ? 0 : output.getBoundingClientRect().height;
    motion?.cancel();
    output.hidden = false;
    output.inert = false;
    output.dataset.state = state;
    output.replaceChildren(content);
    animateHeight(previous, output.scrollHeight);
  }

  function resetRequest() {
    ++active;
    controller?.abort();
    controller = null;
    clearTimers();
    form.removeAttribute("aria-busy");
    submit.setAttribute("aria-label", "Send a message");
  }

  function dismiss(immediate = false) {
    resetRequest();
    if (output.hidden) return;
    output.dataset.state = "closing";
    output.inert = true;
    const closing =
      !immediate &&
      animateHeight(output.getBoundingClientRect().height, 0, true);
    const id = active;
    const finish = () => {
      if (id !== active) return;
      output.hidden = true;
      output.replaceChildren();
      delete output.dataset.state;
    };
    if (closing) closing.finished.then(finish).catch(() => {});
    else {
      motion?.cancel();
      finish();
    }
  }

  function pending(question, id) {
    const inner = element("div", "ask-answer-inner");
    const thinking = element("div", "ask-thinking");
    const spinner = element("span", "ask-thinking-spinner");
    spinner.setAttribute("aria-hidden", "true");
    const label = element("span", "ask-thinking-label", "Sending…");
    thinking.append(spinner, label);
    inner.append(thinking);
    reveal(inner, "sending");
    later(() => {
      if (id !== active) return;
      output.dataset.state = "loading";
      label.textContent = "Let me think…";
    }, 320);
    later(() => {
      if (id !== active) return;
      label.textContent = /contact|email|reach|touch/i.test(question)
        ? "Getting my contact details…"
        : /experience|education|study|background/i.test(question)
          ? "Putting my background into a few words…"
          : /project|work|markdown|chatbot/i.test(question)
            ? "Picking out the useful details…"
            : "Putting that together…";
    }, 1400);
  }

  function show(result, question, id) {
    if (id !== active) return;
    clearTimers();
    form.removeAttribute("aria-busy");
    submit.setAttribute("aria-label", "Send a message");
    if (input.value.trim() === question) input.value = "";
    const body = element("div", "ask-answer-inner ask-reply-body");
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
        const link = element("a", "", source.title);
        link.href = target.pathname + target.search + target.hash;
        const arrow = element("span", "", "↗");
        arrow.setAttribute("aria-hidden", "true");
        link.append(arrow);
        links.append(link);
      }
      if (links.children.length) body.append(links);
    }
    if (result.notice) body.append(element("small", "", result.notice));
    reveal(body, "ready");
    later(() => dismiss(), 10000);
  }

  async function answer(question, requestController) {
    const key = question.toLowerCase();
    const saved = conversationReply(question) || cache.get(key);
    if (saved) return saved;
    let requestTimer;
    try {
      requestTimer = setTimeout(() => requestController.abort(), 6500);
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
      if (cache.size >= 40) cache.delete(cache.keys().next().value);
      cache.set(key, result);
      return result;
    } catch {
      const known = await facts();
      return known.length
        ? compose(retrieve(question, known).slice(0, 1))
        : {
            answer:
              "That didn’t come through. You can find my background and projects below, or give this another try in a moment.",
            mode: "portfolio",
            sources: [
              { title: "My background", url: "/about" },
              { title: "Explore my work", url: "/work" },
            ],
          };
    } finally {
      clearTimeout(requestTimer);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    resetRequest();
    const id = active;
    const started = performance.now();
    controller = new AbortController();
    form.setAttribute("aria-busy", "true");
    submit.setAttribute("aria-label", "Send another message");
    pending(question, id);
    const result = await answer(question, controller);
    if (id !== active) return;
    // Greetings and cached replies share the same readable sending/thinking rhythm.
    later(
      () => show(result, question, id),
      Math.max(0, 2000 - (performance.now() - started)),
    );
  });
  widget.querySelectorAll("[data-question]").forEach((button) =>
    button.addEventListener("click", () => {
      input.value = button.dataset.question;
      form.requestSubmit();
    }),
  );
  document.addEventListener("pointerdown", (event) => {
    if (!widget.contains(event.target)) dismiss(true);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dismiss();
  });
  window.addEventListener("pagehide", () => dismiss(true));
}
