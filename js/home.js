/* Home page only — loaded after js/main.js.
   1. Stats band: one figure is in focus at a time (Figma 3:1332 shows the
      first sharp and the other two softened). Hover, focus or tap brings a
      figure forward.
   2. Common questions: accessible open/close with a GSAP height tween. */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. stats focus ---------- */
  document.querySelectorAll('[data-hm-stats]').forEach((list) => {
    const items = [...list.querySelectorAll('.hm-stat')];
    if (!items.length) return;
    const set = (item) => items.forEach((i) => i.classList.toggle('is-active', i === item));
    items.forEach((item) => {
      item.addEventListener('mouseenter', () => set(item));
      item.addEventListener('focus', () => set(item));
      item.addEventListener('click', () => set(item));
    });
    list.addEventListener('mouseleave', () => set(items[0]));
  });

  /* ---------- 2. common questions ----------
     Each question opens on its own. Height animates with GSAP; without it
     (or with reduced motion) the answer just appears. */
  document.querySelectorAll('[data-hm-faq] .hm-faq__btn').forEach((btn) => {
    const item  = btn.closest('.hm-faq__item');
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!item || !panel) return;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      item.classList.toggle('is-open', open);

      if (!window.gsap || reduced) { panel.hidden = !open; return; }
      gsap.killTweensOf(panel);
      if (open) {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0 }, {
          height: panel.scrollHeight, duration: 0.45, ease: 'power2.out',
          clearProps: 'height', onComplete: refresh
        });
      } else {
        gsap.to(panel, {
          height: 0, duration: 0.35, ease: 'power2.inOut',
          onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height' }); refresh(); }
        });
      }
    });
  });
  function refresh() { if (window.AOS) AOS.refresh(); }

})();
