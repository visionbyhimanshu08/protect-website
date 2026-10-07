/* Why Protect — page-only motion (loaded after main.js)
   - gold strike drawn through "the builder's table." when the line comes in
   - stat numbers rise slightly as their card arrives
   Each plays once, when it reaches the screen (IntersectionObserver). */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduced) return;

  /* run fn(el) the first time el is `margin` inside the screen */
  const onArrive = (els, margin, fn) => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        fn(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: `0px 0px ${margin} 0px` });
    els.forEach((el) => io.observe(el));
  };

  $(function () {
    const bars = [...document.querySelectorAll('.wp-strike__bar')];
    gsap.set(bars, { scaleX: 0 });
    onArrive(bars, '-25%', (bar) => {
      gsap.to(bar, { scaleX: 1, duration: 1, ease: 'power2.inOut' });
    });

    const nums = [...document.querySelectorAll('.wp-stat__num')];
    gsap.set(nums, { y: 24, opacity: 0 });
    onArrive(nums, '-10%', (num) => {
      gsap.to(num, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform' });
    });
  });
})();
