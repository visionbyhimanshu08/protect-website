/* Why Protect — page-only motion */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduced) return;

  document.addEventListener('DOMContentLoaded', () => {
    /* gold strike drawn through "the builder's table." as the line scrolls in */
    document.querySelectorAll('.wp-strike__bar').forEach(bar => {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, ease: 'power2.inOut', duration: 1,
        scrollTrigger: { trigger: bar.closest('.wp-table__title'), start: 'top 75%', toggleActions: 'play none none reverse' }
      });
    });

    /* stat cards: number tiles rise slightly after the card fades in */
    document.querySelectorAll('.wp-stat__num').forEach(num => {
      gsap.from(num, {
        y: 24, opacity: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: num, start: 'top 90%' }
      });
    });
  });
})();
