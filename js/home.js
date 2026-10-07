/* Home page only — loaded after js/main.js.
   1. Stats band: one figure is in focus at a time (Figma 3:1332 shows the
      first sharp and the other two softened). Hover, focus or tap brings a
      figure forward.
   2. "Shown vs buying" figure: the gold ring drifts across the
      photograph as the section scrolls (Figma offset at mid-scroll). */
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

  /* ---------- 2. ring drift ---------- */
  const ring = document.querySelector('[data-hm-ring]');
  if (ring && window.gsap && window.ScrollTrigger && !reduced) {
    gsap.fromTo(ring, { x: 26, y: -26 }, {
      x: -26, y: 26, ease: 'none',
      scrollTrigger: {
        trigger: ring.parentElement,
        start: 'clamp(top 90%)',
        end: 'clamp(bottom 20%)',
        scrub: 0.8
      }
    });
  }
})();
