const nav = document.querySelector('#site-nav');
const menu = document.querySelector('.menu-toggle');
const smallScreen = window.matchMedia('(max-width: 760px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open, restoreFocus = false) {
  nav.dataset.open = String(open);
  menu.setAttribute('aria-expanded', String(open));
  menu.querySelector('[data-menu-label]').textContent = open ? 'Close' : 'Menu';
  nav.inert = smallScreen.matches && !open;
  if (restoreFocus) menu.focus();
}

if (menu && nav) {
  document.documentElement.classList.add('nav-ready');
  menu.hidden = false;
  setMenu(false);
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-shell')) setMenu(false);
  });
  nav.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !nav.contains(event.relatedTarget) && !menu.contains(event.relatedTarget)) setMenu(false);
  });
  nav.querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', () => {
    const url = new URL(anchor.href);
    const destination = url.pathname === location.pathname && url.hash ? document.getElementById(url.hash.slice(1)) : null;
    setMenu(false);
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  }));
  smallScreen.addEventListener('change', () => setMenu(false));
}

// Native anchors remain usable independently of observation and motion.
if ('IntersectionObserver' in window) {
  const activeSection = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      nav?.querySelectorAll('[data-section]').forEach((anchor) => {
        if (anchor.dataset.section === entry.target.id) anchor.setAttribute('aria-current', 'location');
        else anchor.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('main > section[id]').forEach((section) => activeSection.observe(section));
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reducedMotion.matches) entry.target.animate([{ transform: 'translateY(20px)', opacity: 0.65 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.work-item, .section-heading, .tool-group, .writing-item').forEach((element) => reveal.observe(element));
}

const readmeToggle = document.querySelector('.readme-toggle');
if (readmeToggle) {
  readmeToggle.hidden = false;
  readmeToggle.addEventListener('click', () => {
    const source = readmeToggle.getAttribute('aria-pressed') !== 'true';
    readmeToggle.setAttribute('aria-pressed', String(source));
    readmeToggle.innerHTML = source ? 'View preview <span aria-hidden="true">↗</span>' : 'View source <span aria-hidden="true">&lt;/&gt;</span>';
    document.querySelector('#readme-preview').hidden = source;
    document.querySelector('#readme-source').hidden = !source;
  });
}

const copyEmail = document.querySelector('.copy-email');
if (copyEmail && navigator.clipboard?.writeText) {
  copyEmail.hidden = false;
  copyEmail.addEventListener('click', async () => {
    const status = document.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(document.querySelector('.email-link').textContent);
      status.textContent = 'Email copied';
    } catch {
      status.textContent = 'Select the email address to copy it.';
    }
  });
}

const filters = document.querySelector('.archive-filters');
if (filters) {
  filters.hidden = false;
  filters.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    document.querySelectorAll('[data-project-group]').forEach((item) => {
      item.hidden = filter !== 'all' && item.dataset.projectGroup !== filter;
      if (!item.hidden) visible++;
    });
    document.querySelector('[data-filter-status]').textContent = `${visible} projects`;
  }));
}

reducedMotion.addEventListener('change', (event) => {
  if (event.matches) document.getAnimations().forEach((animation) => animation.cancel());
});
