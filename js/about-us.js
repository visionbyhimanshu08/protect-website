/* About us — page-only motion (loaded after main.js)
   - hero: eyebrow / CTA / facts rise in, photo settles from a slight zoom,
     then drifts as the hero scrolls away
   - "What makes us different" list numbers tick in as the list arrives */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduced) return;

  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.ab-hero');
    if (!hero) return;

    const intro = [...hero.querySelectorAll('[data-ab-intro]')];
    if (intro.length) {
      gsap.fromTo(intro,
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.12, delay: 0.35,
          ease: 'power3.out', clearProps: 'opacity,transform' });
    }

    const img = hero.querySelector('.ab-hero__img');
    if (img) {
      gsap.fromTo(img, { scale: 1.14 }, { scale: 1.04, duration: 1.8, ease: 'power3.out' });
      if (window.ScrollTrigger) {
        gsap.to(img, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 }
        });
      }
    }

    /* the gold rule in front of the eyebrow draws itself */
    const rule = hero.querySelector('.ab-eyebrow__rule');
    if (rule) {
      gsap.fromTo(rule, { scaleX: 0, transformOrigin: '0 50%' },
        { scaleX: 1, duration: 0.9, delay: 0.5, ease: 'power2.out' });
    }
  });
})();
