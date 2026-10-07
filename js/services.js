/* Services page — accordion cards, index hover preview, stage rail.
   Loaded after main.js. */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refresh = () => { if (window.AOS) AOS.refresh(); };

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

  /* ---------- 3. stage rail: gold fill grows with scroll, dots light up ----------
     One passive scroll listener, at most one update per frame, and it only
     runs while the rail is on screen. */
  const fill = document.querySelector('[data-stages-fill]');
  const stages = [...document.querySelectorAll('[data-stage]')];
  if (stages.length) stages[0].classList.add('is-active');

  if (stagesRoot && !reduced) {
    let onScreen = false;
    let queued = false;

    const update = () => {
      queued = false;
      const line = window.innerHeight * 0.6;          // 60% down the screen
      if (fill) {
        const r = stagesRoot.getBoundingClientRect();
        const p = Math.min(Math.max((line - r.top) / r.height, 0), 1);
        fill.style.transform = `scaleY(${p})`;
      }
      stages.forEach((st, i) => {
        if (i) st.classList.toggle('is-active', st.getBoundingClientRect().top < line);
      });
    };
    const onScroll = () => {
      if (onScreen && !queued) { queued = true; requestAnimationFrame(update); }
    };

    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) onScroll();
    }).observe(stagesRoot);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  } else {
    stages.forEach(s => s.classList.add('is-active'));
  }
})();
