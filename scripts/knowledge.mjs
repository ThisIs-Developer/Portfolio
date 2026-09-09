// Only already-public portfolio fields become assistant context.
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
  const all = [...projects, ...experiments, ...projectAdditions];
  return [
    fact(
      "about",
      "About Baivab",
      `${profile.description} ${profile.about} ${profile.approach}`,
      "/about",
      "about introduce who baivab sarkar yourself background",
    ),
    fact(
      "education",
      "Education",
      `${profile.education} ${experience.find((x) => /B.Tech/.test(x.title)).description}`,
      "/about#experience",
      "education college degree study studied graduate graduated cgpa university school jis qualification",
    ),
    fact(
      "contact",
      "Get in touch",
      `Contact Baivab at ${profile.email}. His resume and public social profiles are available in the contact section.`,
      "/#contact",
      "contact email reach hire hiring opportunity available availability work together resume cv linkedin",
    ),
    fact(
      "location",
      "Location",
      `Baivab is based in ${profile.location}. His GitHub username is ThisIs-Developer.`,
      "/about",
      "where location located live lives from based bengal india github username",
    ),
    fact(
      "skills",
      "Skills & tools",
      `${profile.approach} His tools include ${[...new Set(skills.flatMap((x) => x.tools))].join(", ")}.`,
      "/about",
      "skill skills stack language languages technology technologies tech tools java javascript python development programming",
    ),
    fact(
      "experience",
      "Experience",
      `Baivab’s experience includes private freelance enterprise applications, independent open-source work, team projects, and Java/Selenium SDET training. BlazeDemo is an educational capstone. ${experience.find((x) => /Selenium/.test(x.title)).description}`,
      "/about#experience",
      "experience training job career employment wipro qa sdet test testing automation selenium",
    ),
    fact(
      "projects",
      "Selected projects",
      `Baivab created and maintains Markdown Viewer and NoteMarker, led full-stack development for the MediChain team prototype, and built a Java/Selenium automation capstone. His portfolio also includes ${all
        .filter(
          (p) =>
            ![
              "markdown-viewer",
              "notemarker",
              "medichain",
              "blazedemo",
            ].includes(p.id),
        )
        .map((p) => p.title)
        .join(", ")}.`,
      "/work",
      "projects project portfolio work build built building creations apps applications",
    ),
    ...all.map((p) =>
      fact(
        `project-${p.id}`,
        p.title,
        `${p.title}: ${p.summary} ${p.contribution || ""} ${p.features?.join(" ") || ""} Stack: ${p.stack.join(", ")}. Status: ${p.status}.`,
        `/work/${p.id}`,
        `${p.id.replaceAll("-", " ")} ${p.title} ${p.stack.join(" ")}`,
      ),
    ),
    fact(
      "enterprise",
      "Private freelance work",
      `${enterprise.intro} ${enterprise.projects.map((p) => `${p.title}: ${p.summary}`).join(" ")} ${enterprise.notice}`,
      "/work/enterprise",
      "enterprise freelance private client clients invoice proposal audit ntpc bluestar collaboration compliance confidential",
    ),
    fact(
      "writing",
      "Writing",
      `Read Baivab’s full articles directly on this website. Topics include developer tools, Markdown Viewer, GitHub workflows, testing and AI experiments.`,
      "/blog",
      "writing write blog blogs article articles post posts dev dev.to tutorial tutorials",
    ),
    ...articles.map((a) =>
      fact(
        `article-${a.id}`,
        a.title,
        `${a.title}: ${a.summary}`,
        a.localPath,
        `${a.title} ${a.tags.join(" ")}`,
      ),
    ),
  ];
}
