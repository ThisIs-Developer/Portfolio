import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readData = async (name) => JSON.parse(await readFile(path.join(root, 'data', `${name}.json`), 'utf8'));
const [profile, projects, articles, experiments, experience, skills, certifications] = await Promise.all(['profile', 'projects', 'articles', 'experiments', 'experience', 'skills', 'certifications'].map(readData));
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const arrow = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const down = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg>';
const link = (url, text, classes = 'text-link') => `<a class="${classes}" href="${esc(url)}">${esc(text)}${arrow}</a>`;
const label = (number, text) => `<p class="eyebrow section-index"><span>${number}</span> / ${text}</p>`;
const tags = (items) => `<ul class="tags" aria-label="Technologies">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
const date = (value) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

function metadata(archive = false) {
  const title = archive ? 'Project archive — Baivab Sarkar' : 'Baivab Sarkar — Software Developer & Open-Source Builder';
  const description = archive ? 'Explore Baivab Sarkar’s software projects, test automation, AI experiments, browser tools, and earlier web work.' : profile.description;
  const canonical = `${profile.site}${archive ? '/project' : '/'}`;
  const person = { '@type': 'Person', '@id': `${profile.site}/#person`, name: profile.name, url: `${profile.site}/`, image: `${profile.site}/assets/profile/baivab-800.webp`, description: profile.description, sameAs: profile.socials.map((item) => item.url), alumniOf: { '@type': 'CollegeOrUniversity', name: 'JIS College of Engineering' } };
  const schema = { '@context': 'https://schema.org', '@graph': [person, { '@type': 'WebSite', '@id': `${profile.site}/#website`, url: `${profile.site}/`, name: 'Baivab Sarkar', inLanguage: 'en' }, { '@type': archive ? 'CollectionPage' : 'ProfilePage', '@id': `${canonical}#page`, url: canonical, name: title, description, mainEntity: { '@id': `${profile.site}/#person` }, isPartOf: { '@id': `${profile.site}/#website` } }] };
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#f3f1e9">
  <meta name="color-scheme" content="light">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Baivab Sarkar">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${profile.site}/assets/social-preview.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Baivab Sarkar — Curiosity, shipped. Software development, open source, and test automation.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${profile.site}/assets/social-preview.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/space-grotesk-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  <script src="/script.js" defer></script>`;
}

function header(archive = false) {
  const prefix = archive ? '/' : '';
  return `<a class="skip-link" href="#main-content" tabindex="0">Skip to content</a>
  <header class="site-header"><div class="nav-shell container">
    <a class="wordmark" href="/${archive ? '' : '#profile'}"><span class="monogram" aria-hidden="true">bs<span>/</span></span><span class="wordmark-name">Baivab Sarkar<span>Software developer</span></span></a>
    <button class="menu-toggle" type="button" aria-controls="site-nav" aria-expanded="false" hidden><span data-menu-label>Menu</span><span class="menu-glyph" aria-hidden="true"><i></i><i></i></span></button>
    <nav id="site-nav" aria-label="Main navigation">${[['projects', 'Work'], ['about', 'About'], ['experience', 'Experience'], ['writing', 'Writing']].map(([id, text]) => `<a href="${prefix}#${id}" data-section="${id}">${text}</a>`).join('')}<a class="nav-contact" href="${prefix}#contact" data-section="contact">Let’s talk <span aria-hidden="true">↗</span></a></nav>
  </div></header>`;
}

function contact() {
  return `<section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="container">
    ${label('06', 'THE NEXT CONVERSATION')}
    <div class="contact-grid"><div><h2 id="contact-title">Good things start<br> with a <span class="serif">conversation.</span></h2><p>A project, an opportunity, or an interesting problem.<br> I’d love to hear what you’re working on.</p></div><a class="contact-orbit" href="mailto:${profile.email}" aria-label="Email Baivab Sarkar">${arrow}</a></div>
    <div class="contact-bottom"><div class="email-row"><a class="email-link" href="mailto:${profile.email}">${profile.email}</a><button class="copy-email" type="button" aria-label="Copy email address" hidden><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V4H4v11h4"/></svg></button><span class="copy-status" role="status" data-copy-status></span></div><div class="social-links">${profile.socials.map((item) => link(item.url, item.label)).join('')}</div></div>
  </div></section>`;
}
const footer = () => `<footer class="site-footer"><div class="container footer-inner"><p>© ${profile.reviewed.slice(0, 4)} Baivab Sarkar</p><p>Made with care. Built to be useful.</p><a class="text-link back-top" href="#top">Back to top <span aria-hidden="true">↑</span></a></div></footer>`;

function projectVisual(project, featured = false) {
  const base = `/${project.image.replace(/^\//, '')}`;
  const small = base.replace('-1400.webp', '-800.webp');
  return `<div class="project-visual ${esc(project.id)}"><div class="visual-topline"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(project.title)}</span><span aria-hidden="true">↗</span></div><img src="${small}" srcset="${small} 800w, ${base} 1400w" sizes="${featured ? '(max-width: 760px) 92vw, 60vw' : '(max-width: 760px) 92vw, 45vw'}" width="1400" height="${project.imageHeight || 875}" loading="lazy" decoding="async" alt="${esc(project.imageAlt)}"></div>`;
}
function notes(project) {
  return `<details class="engineering-notes"><summary>Engineering notes <span aria-hidden="true">+</span></summary><div class="notes-body"><p><strong>The problem.</strong> ${esc(project.problem)}</p><p><strong>My contribution.</strong> ${esc(project.contribution)}</p>${project.features?.length ? `<ul>${project.features.map((feature) => `<li>${esc(feature)}</li>`).join('')}</ul>` : ''}</div></details>`;
}
function projectCard(project, index) {
  const featured = index === 0 || index === 3;
  return `<article class="work-item ${featured ? 'work-featured' : 'work-secondary'} ${index === 0 ? 'work-flagship' : ''} ${index === 3 ? 'work-automation' : ''}" aria-labelledby="project-${project.id}">
    <div class="work-copy"><p class="eyebrow work-category"><span>${String(index + 1).padStart(2, '0')}</span><span>${esc(project.category)}</span></p><h3 id="project-${project.id}">${esc(project.title)}</h3><p class="work-description">${esc(project.summary)}</p>${tags(project.stack)}<p class="project-status"><span class="status-dot" aria-hidden="true"></span>${esc(project.status)}</p><div class="work-links">${project.live ? link(project.live, project.liveLabel, 'button button-small') : ''}${link(project.source, 'Source code')}</div></div>
    ${projectVisual(project, featured)}${notes(project)}
  </article>`;
}

function home() {
  const readmeSource = `# Baivab Sarkar\n\n${profile.about}\n\n## How I work\n${profile.approach}\n\n## Foundation\n${profile.education}`;
  return `<!doctype html>
<!-- Generated by scripts/build.mjs. Edit data/ or the generator, then npm run build. -->
<html lang="en" id="top"><head>${metadata()}</head><body>${header()}<main id="main-content" tabindex="-1">
  <section class="hero container" id="profile" aria-labelledby="hero-title"><div class="hero-grid">
    <div class="hero-copy"><p class="eyebrow hero-kicker"><span class="status-dot" aria-hidden="true"></span> INDEPENDENT MIND. PRACTICAL CODE.</p><h1 id="hero-title">Curiosity,<br> <span class="hero-last">shipped<span class="accent-dot">.</span></span></h1><p class="hero-intro">${profile.intro}</p><div class="hero-actions"><a class="button" href="#projects">Explore my work ${down}</a><a class="text-link" href="${profile.resume}" download>Get my resume ${arrow}<span class="sr-only"> (PDF download)</span></a></div></div>
    <div class="hero-portrait"><div class="portrait-coordinates eyebrow" aria-hidden="true">PERSON BEHIND THE COMMITS ↙</div><figure class="identity-sheet"><div class="sheet-heading"><span class="eyebrow">BAIVAB_SARKAR</span><span class="sheet-cross" aria-hidden="true">+</span></div><img src="/assets/profile/baivab-480.webp" srcset="/assets/profile/baivab-480.webp 480w, /assets/profile/baivab-800.webp 800w" sizes="(max-width: 760px) 260px, 340px" width="480" height="517" alt="Portrait of Baivab Sarkar" fetchpriority="high"><figcaption><span>Software developer<br> <span class="muted">West Bengal, India</span></span><span class="signature" aria-hidden="true">B.</span></figcaption></figure><div class="build-stamp" aria-hidden="true"><span>BUILD</span><span>TEST ↗</span><span>REFINE</span></div></div>
  </div><div class="hero-meta"><p><span class="small-cross" aria-hidden="true">✳</span> Built with intent, from idea to interface.</p><div class="social-links">${profile.socials.map((item) => link(item.url, item.label)).join('')}</div><a href="#projects" class="scroll-note eyebrow">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div></section>

  <section class="work-section container section-space" id="projects" aria-labelledby="work-title"><div class="section-heading">${label('01', 'SELECTED WORK')}<div class="heading-row"><h2 id="work-title">Less talk.<br> <span class="serif">More building.</span></h2><p>A few things I’ve taken from<br> “what if” to something you can use.<br> <span class="muted">Open source, web & automation.</span></p></div></div><div class="work-grid">${projects.map(projectCard).join('')}</div><div class="section-bottom"><p>There’s always another idea in the notebook.</p>${link('/project.html', 'Browse the project archive')}</div></section>

  <section class="about-section section-space" id="about" aria-labelledby="about-title"><div class="container">${label('02', 'A LITTLE CONTEXT')}<div class="about-grid"><div class="about-heading"><h2 id="about-title">A builder,<br> <span class="serif">by habit.</span></h2><p>The best part of engineering?<br> There’s always more to figure out.</p><div class="about-mark" aria-hidden="true"><span>{</span><span>build<br> learn<br> repeat</span><span>}</span></div></div><div class="readme"><div class="readme-toolbar"><span><span aria-hidden="true">↳</span> README.md</span><button class="readme-toggle" type="button" aria-pressed="false" aria-controls="readme-preview readme-source" hidden>View source <span aria-hidden="true">&lt;/&gt;</span></button></div><div class="readme-content" id="readme-preview"><h3>Hi, I’m Baivab.</h3><p>${profile.about}</p><p>${profile.approach}</p><p class="readme-education">${profile.education}</p>${link(profile.resume, 'The full story, in my resume')}</div><pre class="readme-source" id="readme-source" hidden><code>${esc(readmeSource)}</code></pre></div></div><div class="toolbox">${skills.map((skill, i) => `<article class="tool-group"><p class="eyebrow">0${i + 1} / ${esc(skill.title.toUpperCase())}</p><h3>${esc(skill.description)}</h3>${tags(skill.tools)}<p class="tool-evidence">In practice: ${esc(skill.evidence)}</p></article>`).join('')}</div></div></section>

  <section class="experience-section container section-space" id="experience" aria-labelledby="experience-title"><div class="experience-grid"><div>${label('03', 'EXPERIENCE & LEARNING')}<h2 id="experience-title">The path<br> <span class="serif">so far.</span></h2><p class="section-description">A foundation in computer science.<br> A practice shaped by making things.</p></div><div class="timeline">${experience.map((item) => `<article class="timeline-item"><p class="eyebrow">${esc(item.period)}</p><h3>${esc(item.title)}</h3><p class="timeline-org">${esc(item.organization)}</p><p>${esc(item.description)}</p>${item.link ? link(item.link, item.linkLabel) : ''}</article>`).join('')}<div class="certifications"><p class="eyebrow">ALSO IN THE TOOLKIT</p><p>${certifications.map((item) => `${esc(item.title)} <span>${esc(item.date)}</span>`).join('<br> ')}</p></div></div></div></section>

  <section class="open-source-section container" aria-labelledby="open-source-title"><div class="open-source-inner"><div>${label('04', 'BUILT IN THE OPEN')}<h2 id="open-source-title">Good code gets better<br> <span class="serif">when it’s shared.</span></h2><p>Source you can read. Decisions you can question.<br> Find a useful tool, explore an idea, or contribute a fix.</p>${link(profile.socials[0].url, 'Find me on GitHub', 'button')}</div><div class="source-mark" aria-hidden="true"><span class="source-bracket">[</span><div class="commit-pattern">${Array.from({ length: 63 }, (_, i) => `<i class="tone-${(i * 13 + Math.floor(i / 9) * 7) % 5}"></i>`).join('')}</div><span class="source-bracket">]</span><span class="eyebrow source-mark-label">ALWAYS A WORK IN PROGRESS</span></div></div></section>

  <section class="writing-section container section-space" id="writing" aria-labelledby="writing-title">${label('05', 'NOTES FROM THE PROCESS')}<div class="heading-row"><h2 id="writing-title">Build something.<br> <span class="serif">Write it down.</span></h2><p>Lessons, experiments, and the occasional<br> deep dive. Published on DEV.</p></div><div class="writing-list">${articles.map((article, i) => `<article class="writing-item"><p class="article-number eyebrow" aria-hidden="true">0${i + 1}</p><div><p class="article-meta eyebrow"><time datetime="${esc(article.date)}">${date(article.date)}</time><span>·</span>${article.readingTime} MIN READ</p><h3><a href="${esc(article.url)}">${esc(article.title)}<span class="article-arrow">${arrow}</span></a></h3><p class="article-description">${esc(article.summary)}</p><ul class="article-tags" aria-label="Article topics">${article.tags.slice(0, 3).map((tag) => `<li>${esc(tag)}</li>`).join('')}</ul></div></article>`).join('')}</div><div class="section-bottom"><p>Learning in public, one post at a time.</p>${link('https://dev.to/thisisdeveloper', 'View all articles on DEV')}</div></section>
  ${contact()}</main>${footer()}</body></html>`;
}

function archive() {
  const all = [...projects, ...experiments];
  return `<!doctype html>
<!-- Generated by scripts/build.mjs. Edit data/ or the generator, then npm run build. -->
<html lang="en" id="top"><head>${metadata(true)}</head><body>${header(true)}<main id="main-content" tabindex="-1">
  <section class="archive-hero container" aria-labelledby="archive-title">${link('/#projects', 'Back to selected work')}${label('INDEX', 'PROJECTS & EXPERIMENTS')}<h1 id="archive-title">The working<br> <span class="serif">notebook.</span></h1><div class="heading-row"><p>Product builds, useful tools, and things made to learn.<br> A wider look at the work behind the work.</p><p class="eyebrow">${String(all.length).padStart(2, '0')} PROJECTS / ALWAYS EXPLORING</p></div></section>
  <section class="archive-section container" id="projects" aria-label="Project archive"><div class="archive-filters" hidden><span class="eyebrow">EXPLORE</span><div role="group" aria-label="Filter projects"><button type="button" class="filter-button" data-filter="all" aria-pressed="true">All work</button><button type="button" class="filter-button" data-filter="featured" aria-pressed="false">Selected</button><button type="button" class="filter-button" data-filter="experiments" aria-pressed="false">Experiments</button></div><p class="eyebrow" role="status" data-filter-status>${all.length} projects</p></div><div class="archive-list">${all.map((project, i) => `<article class="archive-item" data-project-group="${i < projects.length ? 'featured' : 'experiments'}"><p class="eyebrow archive-number">${String(i + 1).padStart(2, '0')}</p><div class="archive-copy"><p class="eyebrow">${esc(project.category)}${project.year ? ` / ${esc(project.year)}` : ''}</p><h2>${esc(project.title)}</h2><p>${esc(project.summary)}</p>${tags(project.stack)}${project.problem && project.contribution ? notes(project) : ''}</div><div class="archive-actions"><p class="project-status">${esc(project.status)}</p>${project.live ? link(project.live, project.liveLabel) : ''}${link(project.source, 'Source code')}</div></article>`).join('')}</div></section>
  ${contact()}</main>${footer()}</body></html>`;
}

const outputs = { 'index.html': home(), 'project.html': archive(), 'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${profile.site}/</loc></url><url><loc>${profile.site}/project</loc></url></urlset>\n`, 'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${profile.site}/sitemap.xml\n` };
const check = process.argv.includes('--check');
for (const [filename, content] of Object.entries(outputs)) {
  if (check) {
    if (await readFile(path.join(root, filename), 'utf8') !== content) throw new Error(`${filename} is stale; run npm run build.`);
  } else await writeFile(path.join(root, filename), content);
}
if (!check) {
  const dist = path.join(root, 'dist');
  if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Build output must stay inside the repository.');
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  const publicFiles = [...Object.keys(outputs), 'style.css', 'script.js', 'favicon.svg', 'favicon.png', '404.html', '_headers', 'CNAME', 'google67e0cac1e39b6336.html'];
  for (const filename of publicFiles) await cp(path.join(root, filename), path.join(dist, filename));
  for (const directory of ['fonts', 'work']) await cp(path.join(root, 'assets', directory), path.join(dist, 'assets', directory), { recursive: true });
  for (const filename of ['profile/baivab-480.webp', 'profile/baivab-800.webp', 'social-preview.png', 'apple-touch-icon.png', 'resume/Baivab_Sarkar_Resume.pdf', 'resume/CV-BAIVAB SARKAR.pdf']) {
    const destination = path.join(dist, 'assets', filename);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(root, 'assets', filename), destination);
  }
}
console.log(check ? 'Generated pages are up to date.' : 'Built static pages in the repository root and dist/.');
