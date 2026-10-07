/* FAQ page — accordion, topic scroll-spy, smooth topic jumps.
   Loaded after main.js (uses its global `reduced` flag and GSAP if present). */
(function () {
  const root = document.querySelector('[data-faq]');
  if (!root) return;
  const noMotion = (typeof reduced !== 'undefined' && reduced) || !window.gsap;
  const refresh = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };

  /* ---------- accordion ---------- */
  function setOpen(item, open, animate = true) {
    const btn = item.querySelector('.fq-item__btn');
    const panel = item.querySelector('.fq-item__panel');
    if (btn.getAttribute('aria-expanded') === String(open)) return;
    btn.setAttribute('aria-expanded', String(open));
    if (window.gsap) gsap.killTweensOf(panel);

    if (noMotion || !animate) {
      item.classList.toggle('is-open', open);
      panel.style.height = '';
      refresh();
      return;
    }
    if (open) {
      const from = panel.offsetHeight;       // 0, or mid-close height
      item.classList.add('is-open');
      gsap.fromTo(panel, { height: from }, {
        height: 'auto', duration: .5, ease: 'power3.out',
        onComplete: () => { panel.style.height = ''; refresh(); }
      });
      gsap.fromTo(panel.firstElementChild, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out', delay: .05 });
    } else {
      gsap.fromTo(panel, { height: panel.offsetHeight }, {
        height: 0, duration: .4, ease: 'power3.inOut',
        onComplete: () => { item.classList.remove('is-open'); panel.style.height = ''; refresh(); }
      });
    }
  }

  const buttons = [...root.querySelectorAll('.fq-item__btn')];
  buttons.forEach((btn, i) => {
    const item = btn.closest('.fq-item');
    btn.addEventListener('click', () => setOpen(item, btn.getAttribute('aria-expanded') !== 'true'));
    /* arrow / Home / End move focus between questions (WAI-ARIA accordion pattern) */
    btn.addEventListener('keydown', e => {
      let to = null;
      if (e.key === 'ArrowDown') to = buttons[(i + 1) % buttons.length];
      else if (e.key === 'ArrowUp') to = buttons[(i - 1 + buttons.length) % buttons.length];
      else if (e.key === 'Home') to = buttons[0];
      else if (e.key === 'End') to = buttons[buttons.length - 1];
      if (to) { e.preventDefault(); to.focus(); }
    });
  });

  /* ---------- topic links: smooth jump + scroll-spy ---------- */
  const topics = [...root.querySelectorAll('[data-topic]')];
  const navLinks = [...document.querySelectorAll('[data-topic-nav] a')];
  const nav = document.querySelector('[data-topic-nav]');

  document.querySelectorAll('[data-topic-nav] a, [data-topic-link]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: noMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
      setCurrent(topics.indexOf(target));
    });
  });

  let current = -1;
  function setCurrent(i) {
    if (i === current || i < 0) return;
    current = i;
    navLinks.forEach((l, j) => {
      const on = j === i;
      l.classList.toggle('is-current', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    /* on tablet/mobile the nav is a horizontal strip: keep the current chip in view */
    const link = navLinks[i];
    if (nav && link && nav.scrollWidth > nav.clientWidth + 1) {
      nav.scrollTo({ left: link.offsetLeft - nav.offsetLeft - 16, behavior: noMotion ? 'auto' : 'smooth' });
    }
  }

  let ticking = false;
  function spy() {
    ticking = false;
    const line = window.innerHeight * 0.35;
    let idx = 0;
    topics.forEach((t, i) => { if (t.getBoundingClientRect().top <= line) idx = i; });
    setCurrent(idx);
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  spy();

  /* deep link to a topic or question (#builder-quotes, #fq-q12) */
  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t && t.classList.contains('fq-item__btn')) setOpen(t.closest('.fq-item'), true, false);
  }
})();
