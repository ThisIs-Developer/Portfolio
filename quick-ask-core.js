export const restrictedAnswer =
  "I can help with Baivab’s background, projects, skills, experience and writing. I don’t have verified information for that question. Try a portfolio topic below.";
const words = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
const stop = new Set(
  "what when how why are is was were can could would will do does did the a an of in to for and or with on me you your his he him tell about please baivab sarkar question questions information details detail".split(
    " ",
  ),
);
const unsafe =
  /ignore.{0,40}(instruction|previous|rule)|system\s*(prompt|message)|developer\s*message|pretend|roleplay|jailbreak|disregard|instead\s+(write|answer)|api\s*key|password|secret|home\s*address|phone\s*number|salary|net\s*worth|religion|politic|recipe|weather|president|stock\s*price|write\s+(a\s+)?(poem|essay|code)|diagnos|treatment/i;

export function retrieve(question, facts) {
  if (!question || question.length > 240 || unsafe.test(question)) return [];
  const query = question.toLowerCase().trim();
  const terms = [...new Set(words(query).filter((w) => !stop.has(w)))];
  if (!terms.length)
    return /who|introduce|about|yourself/.test(query)
      ? facts.filter((f) => f.id === "about")
      : [];
  const scores = facts
    .map((fact) => {
      const keys = new Set(words(`${fact.title} ${fact.keywords}`));
      const title = fact.title.toLowerCase();
      const exact = title.length > 3 && query.includes(title);
      return {
        fact,
        score:
          (exact ? 30 : 0) +
          terms.reduce((n, t) => n + (keys.has(t) ? 4 : 0), 0),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scores.length) return [];
  // A specific project should win over an article that happens to mention it.
  const project = scores.find(
    (x) => x.fact.id.startsWith("project-") && x.score >= 30,
  );
  if (project)
    return [
      project.fact,
      ...scores
        .filter((x) => x !== project)
        .slice(0, 5)
        .map((x) => x.fact),
    ];
  return scores.slice(0, 6).map((x) => x.fact);
}

export function compose(facts, mode = "portfolio") {
  const selected = facts.slice(0, 2);
  return {
    answer: selected.length
      ? selected.map((f) => f.text).join("\n\n")
      : restrictedAnswer,
    sources: selected.map(({ title, url }) => ({ title, url })),
    mode: selected.length ? mode : "restricted",
  };
}
