/* Services page — accordion cards, index hover preview, stage rail.
   Loaded after main.js. */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refresh = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };

  /* ---------- 1. service cards: one open at a time ---------- */
  const cards = [...document.querySelectorAll('[data-card-acc]')];
  const stagesRoot = document.querySelector('[data-stages]');

  function setOpen(card, on) {
    card.classList.toggle('is-open', on);
    const head = card.querySelector('.sv-card__head');
    if (head) head.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function openOnly(card) {
    cards.forEach(c => setOpen(c, c === card));
  }

  cards.forEach(card => {
    const head = card.querySelector('.sv-card__head');
    if (!head) return;
    head.addEventListener('click', () => {
      const wasOpen = card.classList.contains('is-open');
      if (wasOpen) setOpen(card, false);
      else openOnly(card);
      setTimeout(refresh, 600);
    });
  });

  /* Jumping to a card from a link (hero index, footer, other pages):
     open it instantly — and close the others instantly — before the browser
     scrolls, so the jump lands on the final layout. */
  function openFromHash(hash) {
    if (!hash || hash.length < 2) return;
    let target;
    try { target = document.querySelector(hash); } catch (e) { return; }
    if (!target) return;
    const card = target.matches('[data-card-acc]') ? target : null;
    if (!card) return;
    if (stagesRoot) stagesRoot.classList.add('sv-no-anim');
    openOnly(card);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (stagesRoot) stagesRoot.classList.remove('sv-no-anim');
      refresh();
    }));
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const i = href.indexOf('#');
    if (i < 0) return;
    const path = href.slice(0, i);
    if (path && path !== 'services.html') return;
    openFromHash(href.slice(i));
  }, true);

  if (location.hash) {
    openFromHash(location.hash);
    /* re-run the jump once the cards are laid out */
    const t = document.querySelector(location.hash.replace(/[^#\w-]/g, ''));
    if (t) window.addEventListener('load', () => t.scrollIntoView({ block: 'start' }), { once: true });
  }
  window.addEventListener('hashchange', () => openFromHash(location.hash));

  /* ---------- 2. hero index: active row follows the pointer + image preview ---------- */
  const idx = document.querySelector('[data-idx]');
  if (idx) {
    const links = [...idx.querySelectorAll('[data-idx-link]')];
    const preview = idx.querySelector('[data-idx-preview]');
    const previewImg = preview && preview.querySelector('img');
    const canHover = () => window.matchMedia('(hover: hover) and (min-width: 992px)').matches;

    const setActive = (link) => links.forEach(l => l.classList.toggle('is-active', l === link));

    /* warm the preview images so the swap never flashes empty */
    window.addEventListener('load', () => {
      links.forEach(l => { if (l.dataset.preview) { const im = new Image(); im.src = l.dataset.preview; } });
    }, { once: true });

    let toX = null, toY = null;
    if (preview && window.gsap && !reduced) {
      toX = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' });
      toY = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' });
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        if (!canHover()) return;
        setActive(link);
        if (!preview) return;
        if (link.dataset.preview) {
          if (previewImg.getAttribute('src') !== link.dataset.preview) previewImg.src = link.dataset.preview;
          preview.classList.add('is-on');
        } else {
          preview.classList.remove('is-on');
        }
      });
      link.addEventListener('focus', () => setActive(link));
    });

    idx.addEventListener('mousemove', e => {
      if (!preview || !canHover()) return;
      const r = idx.getBoundingClientRect();
      const x = e.clientX - r.left - 137;
      const y = e.clientY - r.top - 150;
      if (toX) { toX(x); toY(y); }
      else preview.style.transform = `translate(${x}px, ${y}px)`;
    });
    idx.addEventListener('mouseleave', () => { if (preview) preview.classList.remove('is-on'); });
  }

  /* ---------- 3. stage rail: gold fill scrubs with scroll, dots light up ---------- */
  const fill = document.querySelector('[data-stages-fill]');
  const stages = [...document.querySelectorAll('[data-stage]')];
  if (stages.length) stages[0].classList.add('is-active');

  if (stagesRoot && window.gsap && window.ScrollTrigger && !reduced) {
    if (fill) {
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: stagesRoot, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 }
      });
    }
    stages.forEach((s, i) => {
      if (i === 0) return;
      ScrollTrigger.create({
        trigger: s, start: 'top 60%',
        onEnter: () => s.classList.add('is-active'),
        onLeaveBack: () => s.classList.remove('is-active')
      });
    });

  } else {
    stages.forEach(s => s.classList.add('is-active'));
  }
})();
