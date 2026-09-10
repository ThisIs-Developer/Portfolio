import { projectCollections } from "./project-selection.mjs";
// Only already-public portfolio fields become Quick Ask context.
export function buildKnowledge({
  profile,
  projects,
  experiments,
  projectAdditions,
  experience,
  skills,
  enterprise,
  articles,
}) {
  const fact = (id, title, text, url, keywords) => ({
    id,
    title,
    text,
    url,
    keywords,
  });
  const { all, featured, archive } = projectCollections({
    projects,
    experiments,
    projectAdditions,
  });
  return [
    fact(
      "about",
      "About Baivab",
      `${profile.intro} ${profile.about}`,
      "/about",
      "about introduce who baivab sarkar yourself background",
    ),
    fact(
      "education",
      "Education",
      `I completed my ${profile.education.replace("Graduated", "I graduated")} ${
        experience
          .find((x) => /B.Tech/.test(x.title))
          .description.replace("Graduated with", "My final result was")
          .split(". ")[0]
      }.`,
      "/about#experience",
      "education college degree study studied graduate graduated cgpa university school jis qualification",
    ),
    fact(
      "contact",
      "Get in touch",
      `You can reach me at ${profile.email}. You’ll find my resume and public social profiles in the contact section, too.`,
      "/#contact",
      "contact email reach hire hiring opportunity available availability work together resume cv linkedin",
    ),
    fact(
      "location",
      "Location",
      `I’m based in ${profile.location}. On GitHub, you’ll find me as ThisIs-Developer.`,
      "/about",
      "where location located live lives from based bengal india github username",
    ),
    fact(
      "skills",
      "Skills & tools",
      `${profile.approach} My tools include ${[...new Set(skills.flatMap((x) => x.tools))].join(", ")}.`,
      "/about",
      "skill skills stack language languages technology technologies tech tools java javascript python development programming",
    ),
    fact(
      "experience",
      "Experience",
      `I’ve worked on private freelance enterprise applications, open-source tools and team projects. My Java/Selenium SDET training covered ${
        experience
          .find((x) => /Selenium/.test(x.title))
          .description.replace(/^UI/, "UI")
          .split(". ")[0]
      }.`,
      "/about#experience",
      "experience training job career employment wipro qa sdet test testing automation selenium",
    ),
    fact(
      "projects",
      "Selected projects",
      `My featured projects are ${featured.map((p) => p.title).join(", ")}. You’ll find more of my work in the archive: ${archive.map((p) => p.title).join(", ")}.`,
      "/work",
      "projects project portfolio work build built building creations apps applications",
    ),
    ...all.map((p) =>
      fact(
        `project-${p.id}`,
        p.title,
        `Here’s ${p.title}: ${p.summary} ${p.contribution ? `I ${p.contribution.charAt(0).toLowerCase()}${p.contribution.slice(1)} ` : ""}The stack includes ${p.stack.join(", ")}.`,
        `/work/${p.id}`,
        `${p.id.replaceAll("-", " ")} ${p.title} ${p.stack.join(" ")}`,
      ),
    ),
    fact(
      "enterprise",
      "Private freelance work",
      `${enterprise.intro} That includes invoice, collaboration, proposal and audit tools. I can share the public overview, but source code, architecture and client data stay private.`,
      "/work/enterprise",
      "enterprise freelance private client clients invoice proposal audit ntpc bluestar collaboration compliance confidential",
    ),
    fact(
      "writing",
      "Writing",
      `I write about developer tools, Markdown Viewer, GitHub workflows, testing and AI experiments. You can read the full articles right here — no need to leave the site.`,
      "/blog",
      "writing write blog blogs article articles post posts dev dev.to tutorial tutorials",
    ),
    ...articles.map((a) =>
      fact(
        `article-${a.id}`,
        a.title,
        `In “${a.title}”, I share this story: ${a.summary}`,
        a.localPath,
        `${a.title} ${a.tags.join(" ")}`,
      ),
    ),
  ];
}
