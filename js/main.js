/* Heritage clone — runtime
   Mirrors: Lenis smooth scroll, GSAP SplitText line reveals, ScrollTrigger parallax,
   count-up counters, scroll-driven step panels, click tabs, sliders, marquees. */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Lenis smooth scroll (same config as source) ---------- */
if (window.Lenis && !reduced) {
  new Lenis({ autoRaf: true, duration: 1, smoothWheel: true, touchMultiplier: 1.3 });
}

/* ---------- 2. GSAP ---------- */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.CustomEase) gsap.registerPlugin(CustomEase);
}

/* The reveal must FINISH while you are reading the thing, not as it leaves.
   'bottom top' put progress 1 at the moment the element's bottom cleared the top
   of the screen — so a heading sat at partial opacity, still translated, for the
   entire time it was actually on screen, and only resolved once it was gone.
   Worst on phones, where a four-line heading fills a quarter of a short viewport.
   'top 35%' finishes the reveal as the element settles into the upper third. */
const ST = { start: 'clamp(top 85%)', end: 'clamp(top 35%)', scrub: 0.8 };

/* Elements already inside the first viewport at load must play a timed intro —
   a scroll-scrubbed trigger would leave them stuck at their hidden start state. */
function aboveFold(el) {
  const t = el.getBoundingClientRect().top + window.scrollY;
  return t < window.innerHeight;
}

/* line-by-line reveal — the site's dominant pattern */
function revealLines(el) {
  if (!window.gsap || reduced) return;
  const build = () => {
    const targets = window.SplitText
      ? new SplitText(el, { type: 'lines', linesClass: 'split-line' }).lines
      : [el];
    const vars = { yPercent: 110, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' };
    if (aboveFold(el)) vars.delay = 0.15;
    else vars.scrollTrigger = { trigger: el, start: ST.start, end: ST.end, scrub: ST.scrub };
    gsap.from(targets, vars);
  };
  document.fonts ? document.fonts.ready.then(build) : build();
}

/* Fade-up reveal for cards / grids / buttons.
   Deliberately NOT GSAP: gsap.from() parks the element in its hidden "from" state
   and only restores it when the trigger runs, so any degenerate scrub range (a
   56px button's "bottom bottom" precedes its "top 80%") leaves it stuck invisible.
   IntersectionObserver + a CSS class fails safe — no class, no hiding. */
function revealUp(els, stagger = 0.08) {
  els = [].concat(els).filter(Boolean);
  if (!els.length || reduced) return;
  els.forEach((el, i) => {
    el.classList.add('reveal-up');
    if (stagger) el.style.transitionDelay = (i * stagger) + 's';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  els.forEach(el => io.observe(el));
  /* belt and braces: anything still hidden two seconds in gets shown */
  setTimeout(() => els.forEach(el => el.classList.add('is-in')), 2500);
}

/* ---------- 3. Parallax backgrounds (scrub 0.8) ---------- */
function initParallax() {
  if (!window.gsap || reduced) return;
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const amount = parseFloat(el.dataset.parallax) || 15;
    /* down-only: the layer is authored at its rest position, with bleed below. */
    const from = el.dataset.parallaxFrom !== undefined ? parseFloat(el.dataset.parallaxFrom) : -amount;
    gsap.fromTo(el, { yPercent: from }, {
      yPercent: amount, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: 0.8 }
    });
  });
}

/* ---------- 4. Count-up counters ----------
   IntersectionObserver rather than ScrollTrigger: a stale/degenerate trigger would
   leave the number frozen at 0, and a visible "0" is worse than no animation. */
function initCounters() {
  const run = (el) => {
    const to = parseFloat(el.dataset.count);
    if (Number.isNaN(to)) return;
    const dec = (el.dataset.count.split('.')[1] || '').length;
    if (reduced || !window.gsap) { el.textContent = to.toFixed(dec); return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to, duration: 2, ease: 'power2.out',
      onUpdate: () => { el.textContent = obj.v.toFixed(dec); }
    });
  };

  const els = [...document.querySelectorAll('[data-count]')];
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      run(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
}

/* ---------- 5. Scroll-driven step panels (core-values, how-we-work) ---------- */
/* Triggers switch the sticky panel as each item crosses viewport centre.
   NOT click-driven — matches ScrollTrigger start "clamp(top center)". */
function initScrollSteps(root) {
  const scope = typeof root === 'string' ? document.querySelector(root) : root;
  if (!scope) return;
  const triggers = [...scope.querySelectorAll('[data-step-trigger]')];
  const panels   = [...scope.querySelectorAll('[data-step-panel]')];
  if (!triggers.length) return;

  const activate = (i) => {
    triggers.forEach((t, n) => t.classList.toggle('is-active', n === i));
    panels.forEach((p, n) => p.classList.toggle('is-active', n === i));
  };
  activate(0);

  if (window.gsap && !reduced) {
    triggers.forEach((t, i) => {
      ScrollTrigger.create({
        trigger: t,
        start: 'clamp(top center)',
        end: 'clamp(bottom bottom)',
        onEnter: () => activate(i),
        onEnterBack: () => activate(i)
      });
    });
  } else {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) activate(triggers.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    triggers.forEach(t => io.observe(t));
  }
}

/* ---------- 6. Click tabs (about section) ---------- */
function initTabs(root) {
  document.querySelectorAll(root).forEach(tabs => {
    const links = [...tabs.querySelectorAll('[data-tab]')];
    const panes = [...tabs.querySelectorAll('[data-pane]')];
    links.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      const key = link.dataset.tab;
      links.forEach(l => l.classList.toggle('is-current', l === link));
      panes.forEach(p => {
        const on = p.dataset.pane === key;
        p.classList.toggle('is-current', on);
        if (on && window.gsap && !reduced) gsap.fromTo(p, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
      });
    }));
  });
}

/* ---------- 7. Sliders (vanilla replacement for Webflow .w-slider) ---------- */
function initSliders() {
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const mask   = slider.querySelector('[data-slider-mask]');
    const slides = [...slider.querySelectorAll('[data-slide]')];
    const dots   = slider.querySelector('[data-slider-dots]');
    const prev   = slider.querySelector('[data-slider-prev]');
    const next   = slider.querySelector('[data-slider-next]');
    if (!mask || slides.length < 2) return;

    let i = 0;
    const perView = () => {
      const w = slider.clientWidth;
      const n = parseFloat(getComputedStyle(slider).getPropertyValue('--per-view')) || 1;
      return Math.max(1, Math.round(n));
    };
    const maxIndex = () => Math.max(0, slides.length - perView());

    const dotEls = [];
    if (dots) {
      dots.innerHTML = '';
      for (let n = 0; n <= maxIndex(); n++) {
        const b = document.createElement('button');
        b.className = 'slider-dot';
        b.type = 'button';
        b.setAttribute('aria-label', `Slide ${n + 1}`);
        b.addEventListener('click', () => go(n));
        dots.appendChild(b);
        dotEls.push(b);
      }
    }

    /* step = distance between two slides; falls back to width + gap.
       getComputedStyle().gap is "normal" (=> NaN) when no gap is declared. */
    function step() {
      if (slides.length > 1) {
        const d = slides[1].offsetLeft - slides[0].offsetLeft;
        if (d > 0) return d;
      }
      const g = parseFloat(getComputedStyle(mask).columnGap);
      return slides[0].getBoundingClientRect().width + (Number.isNaN(g) ? 0 : g);
    }

    function go(n) {
      i = Math.min(Math.max(n, 0), maxIndex());
      mask.style.transform = `translate3d(${-i * step()}px,0,0)`;
      dotEls.forEach((d, k) => d.classList.toggle('is-active', k === i));
    }

    prev && prev.addEventListener('click', () => go(i - 1));
    next && next.addEventListener('click', () => go(i + 1));
    window.addEventListener('resize', () => go(Math.min(i, maxIndex())));
    go(0);
  });
}

/* ---------- 8. Mobile nav ---------- */
function initNav() {
  const btn   = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  if (!btn || !panel) return;
  const set = on => {
    panel.classList.toggle('is-open', on);
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    document.body.style.overflow = on ? 'hidden' : '';
  };
  btn.addEventListener('click', () => set(!panel.classList.contains('is-open')));
  document.querySelectorAll('[data-nav-close]').forEach(el => el.addEventListener('click', () => set(false)));
  panel.addEventListener('click', e => { if (e.target === panel) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* ---------- 8b. Current page in the menu ----------
   Marks the header link for the page you are on, so each page does not
   have to remember to do it by hand. "/" and "/index.html" are both Home. */
function initCurrentLink() {
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  document.querySelectorAll('.site-nav__link, .nav-panel__menu a').forEach(a => {
    const target = (a.getAttribute('href') || '').split('#')[0].replace(/\.html$/, '');
    a.classList.toggle('is-current', target === file);
  });
}

/* ---------- 9. Inert forms (no backend) ---------- */
function initForms() {
  document.querySelectorAll('form:not([onsubmit])').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const block = form.parentElement;
      const done = block && block.querySelector('.w-form-done, [class*="form-done"]');
      if (done) { done.classList.add('is-visible'); done.style.display = 'block'; form.style.display = 'none'; }
      else { form.reset(); }
    });
  });
}

/* ---------- 10. Click accordion (why-choose-us) ---------- */
/* Click-driven, matching the reference — hovering a collapsed panel does nothing.
   Desktop keeps exactly one panel open; below 768px the rail stacks into a list
   and panels toggle so all can be closed. */
function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach(root => {
    const panels = [...root.querySelectorAll('[data-panel]')];
    if (!panels.length) return;
    const stacked = () => window.matchMedia('(max-width: 767px)').matches;

    panels.forEach(panel => {
      panel.addEventListener('click', () => {
        const wasOpen = panel.classList.contains('is-open');
        if (wasOpen && !stacked()) return;          // desktop: one is always open
        panels.forEach(p => {
          p.classList.remove('is-open');
          p.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          panel.classList.add('is-open');
          panel.setAttribute('aria-expanded', 'true');
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });

    /* coming back to desktop with everything closed would leave a blank rail */
    window.addEventListener('resize', () => {
      if (!stacked() && !panels.some(p => p.classList.contains('is-open'))) {
        panels[0].classList.add('is-open');
        panels[0].setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ---------- hero: headline-as-navigation ----------
   Four words in the h1 are links. Pointing at one dims the rest of the
   sentence, wipes an orange rule under it and swaps in a card naming the page
   it opens. Pointer gets an arrow ring so the promise is legible before the
   click. Under 900px the cards are a static list and none of this runs. */
function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const keys   = [...hero.querySelectorAll('[data-key]')];
  const cols   = [...hero.querySelectorAll('[data-col]')];
  const cursor = hero.querySelector('[data-hero-cursor]');
  const lens   = hero.querySelector('[data-hero-lens]');
  const shots  = [...hero.querySelectorAll('.s-hero__lens-img')];
  const bg     = hero.querySelector('.s-hero__bg');
  if (!keys.length) return;

  /* --- entrance: eyebrow + the three headline lines rise in --- */
  /* fromTo, not from: gsap.from() records its end value when the tween is built,
     and a webfont reflow landing in that window had it recording opacity 0 — the
     lead paragraph finished the tween still invisible. Explicit start AND end
     values cannot be poisoned that way, and clearProps hands the element back to
     the stylesheet once it has played. */
  const intro = [...hero.querySelectorAll('[data-hero-intro]')];
  if (window.gsap && !reduced && intro.length) {
    gsap.fromTo(intro,
      { y: 44, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.09, delay: 0.15,
        ease: 'power3.out', clearProps: 'opacity,transform' }
    );
  }

  /* the swap layer only makes sense where a pointer can hover */
  const interactive = () =>
    window.matchMedia('(hover: hover) and (min-width: 768px)').matches;

  let active = null;
  let demo = null;

  function setActive(i) {
    if (i === active) return;
    active = i;
    hero.classList.toggle('is-focused', i !== null);
    keys.forEach((k, n) => k.classList.toggle('is-active', n === i));
    cols.forEach((c, n) => c.classList.toggle('is-active', n === i));

    /* the photograph under the page changes with the word */
    shots.forEach((s, n) => s.classList.toggle('is-on', n === i));

    /* the scene reacts too: the building leans a little toward the live topic,
       so it reads as one composition rather than text sitting on a photo */
    if (bg && window.gsap && !reduced) {
      gsap.to(bg, { x: i === null ? 0 : (i - 1.5) * 18, duration: 0.9, ease: 'power3.out' });
    }
  }

  /* Nobody reads an instruction line. Playing the four states once on load
     teaches the interaction in ~2s, then hands the hero back at rest. */
  function playDemo() {
    if (reduced || !interactive()) return;
    let i = 0;
    const step = () => {
      if (i >= keys.length) { setActive(null); demo = null; return; }
      setActive(i++);
      demo = setTimeout(step, 420);
    };
    demo = setTimeout(step, 1400);
  }
  function stopDemo() {
    if (demo) { clearTimeout(demo); demo = null; setActive(null); }
  }

  /* A word and its column are one control in two places, so travelling between
     them must not blink the state off. mouseleave on the word fires before
     mouseenter on the column, so clearing straight from mouseleave killed the
     focus the instant you moved down to the card you were aiming for. Deferring
     the clear by a tick lets the incoming mouseenter cancel it; both events are
     dispatched from the same mousemove, so the timer never runs between them. */
  let clearTimer = null;
  const hold  = () => { clearTimeout(clearTimer); clearTimer = null; };
  const relax = () => { hold(); clearTimer = setTimeout(() => setActive(null), 0); };

  keys.forEach((key, i) => {
    key.addEventListener('mouseenter', () => { stopDemo(); hold(); if (interactive()) setActive(i); });
    key.addEventListener('mouseleave', () => { if (interactive()) relax(); });
    /* keyboard gets the same explanation the pointer does */
    key.addEventListener('focus', () => { stopDemo(); hold(); if (interactive()) setActive(i); });
    key.addEventListener('blur',  () => { if (interactive()) relax(); });
  });

  /* the link runs both ways — pointing at a column lights its headline word */
  cols.forEach((col, i) => {
    col.addEventListener('mouseenter', () => { stopDemo(); hold(); if (interactive()) setActive(i); });
    col.addEventListener('mouseleave', () => { if (interactive()) relax(); });
  });

  /* --- the lens ---
     Four decorative photographs must not race the hero's own first paint, so
     their sources are parked in data-src and swapped in once the page has
     loaded. Nobody can hover before then. */
  if (lens && shots.length) {
    const arm = () => shots.forEach((s) => {
      if (s.dataset.src) { s.style.backgroundImage = `url("${s.dataset.src}")`; delete s.dataset.src; }
    });
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
  }

  /* --- arrow ring that trails the pointer over the four words --- */
  if (cursor && !reduced) {
    const toX = window.gsap ? gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' }) : null;
    const toY = window.gsap ? gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' }) : null;

    /* The lens rim and the arrow ring share a centre, so the two circles read as
       one instrument rather than two unrelated ones. The lens is masked in fixed
       coordinates, which is exactly the space clientX/clientY already speak, so
       no per-frame layout read is needed. Writes are batched to one frame. */
    let px = 0, py = 0, queued = false;
    const paint = () => {
      queued = false;
      lens.style.setProperty('--lens-x', px + 'px');
      lens.style.setProperty('--lens-y', py + 'px');
    };

    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (toX) { toX(e.clientX); toY(e.clientY); }
      else { cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; }
      if (lens) {
        px = e.clientX; py = e.clientY;
        /* the lens is only armed once the pointer has genuinely moved, so the
           on-load demo cannot strobe photographs across the middle of the page */
        if (!lens.classList.contains('is-live')) lens.classList.add('is-live');
        if (!queued) { queued = true; requestAnimationFrame(paint); }
      }
    });

    keys.forEach((key) => {
      key.addEventListener('mouseenter', () => interactive() && cursor.classList.add('is-on'));
      key.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    });
    hero.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
  }

  /* slow drift as the hero scrolls away — a still photo behind moving type is
     the thing that makes a hero feel like a screenshot */
  if (bg && window.gsap && window.ScrollTrigger && !reduced) {
    gsap.to(bg, {
      y: 80, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 }
    });
  }

  /* dragging the window across the 900px line must not strand a dimmed state */
  window.addEventListener('resize', () => { if (!interactive()) setActive(null); });

  playDemo();
}

/* ---------- 11. Services ticker (what-we-offer) ----------
   A belt of image cards running right-to-left forever. The loop is two
   identical tracks: one authored in the partial, one cloned here, each
   translating -100% of its own width so the seam is exact.

   Card states, in the order a visitor meets them:
     idle   art blurred + desaturated
     hover  art pulls into focus, belt holds
     open   "+" slides the navy detail panel up over the card
   Only one card may be open at a time — including across the clone, so the
   duplicate of the card you opened does not travel past you also open. */
function initServiceTicker() {
  document.querySelectorAll('[data-ticker]').forEach(ticker => {
    const rail  = ticker.querySelector('.wwo-ticker__rail');
    const track = ticker.querySelector('[data-ticker-track]');
    if (!rail || !track) return;

    /* the clone is decoration: hidden from the accessibility tree, and its
       controls taken out of the tab order so nothing is announced twice */
    const clone = track.cloneNode(true);
    clone.setAttribute('data-ticker-clone', '');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('button, a').forEach(el => el.setAttribute('tabindex', '-1'));
    rail.appendChild(clone);

    const cards = () => [...ticker.querySelectorAll('[data-card]')];

    function closeAll() {
      cards().forEach(c => {
        c.classList.remove('is-open', 'is-peek');
        const t = c.querySelector('[data-card-toggle]');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      ticker.classList.remove('is-locked');
    }

    function open(card) {
      const wasOpen = card.classList.contains('is-open');
      closeAll();
      if (wasOpen) return;
      card.classList.add('is-open');
      const t = card.querySelector('[data-card-toggle]');
      if (t) t.setAttribute('aria-expanded', 'true');
      /* the belt must stop, or the card you just opened walks off screen */
      ticker.classList.add('is-locked');
    }

    ticker.addEventListener('click', e => {
      const toggle = e.target.closest('[data-card-toggle]');
      if (toggle) { open(toggle.closest('[data-card]')); return; }

      if (e.target.closest('a')) return;          // let the CTA through

      const card = e.target.closest('[data-card]');
      if (!card) return;

      /* tapping an open panel closes it, matching the reference */
      if (card.classList.contains('is-open')) { closeAll(); return; }

      /* touch has no hover, so a tap is how the art comes into focus */
      const wasPeek = card.classList.contains('is-peek');
      closeAll();
      if (!wasPeek) card.classList.add('is-peek');
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    document.addEventListener('click', e => { if (!ticker.contains(e.target)) closeAll(); });
  });
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-reveal="lines"]').forEach(revealLines);
  document.querySelectorAll('[data-reveal="up"]').forEach(el => revealUp([el], 0));
  document.querySelectorAll('[data-reveal-group]').forEach(g => revealUp([...g.children]));
  initHero();
  initParallax();
  initCounters();
  initScrollSteps('[data-steps="core-values"]');
  initScrollSteps('[data-steps="how-we-work"]');
  initTabs('[data-tabs]');
  initSliders();
  initNav();
  initCurrentLink();
  initForms();
  initAccordion();
  initServiceTicker();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});

/* Trigger positions are measured at DOMContentLoaded — before webfonts and
   images have settled, so every start/end below the fold is computed against a
   stale layout and short elements (e.g. the section CTAs) never reach the end of
   their scrub. Recompute once the page has actually finished laying out. */
function refreshTriggers() { if (window.ScrollTrigger) ScrollTrigger.refresh(); }
window.addEventListener('load', refreshTriggers);
if (document.fonts) document.fonts.ready.then(refreshTriggers);
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(refreshTriggers, 200);
});
