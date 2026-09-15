/* Screenshot links remain usable when JavaScript or dialog support is absent. */
(() => {
  const dialog = document.querySelector('.mv-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('.mv-lightbox-image img');
  const title = dialog.querySelector('#mv-lightbox-title');
  const original = dialog.querySelector('[data-original-screenshot]');
  const close = dialog.querySelector('[data-close-screenshot]');
  let opener;
  document.querySelectorAll('[data-screenshot]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      image.src = link.href;
      original.href = link.href;
      image.alt = link.querySelector('img').alt;
      title.textContent = link.dataset.caption;
      dialog.showModal();
      document.documentElement.classList.add('mv-screenshot-open');
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === close) {
      event.preventDefault();
      original.focus();
    } else if (!event.shiftKey && document.activeElement === original) {
      event.preventDefault();
      close.focus();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('mv-screenshot-open');
    image.removeAttribute('src');
    original.removeAttribute('href');
    opener?.focus({ preventScroll: true });
  });
})();
