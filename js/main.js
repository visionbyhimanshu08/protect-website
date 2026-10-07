/* Protect — shared runtime (every page)
   Stack: jQuery + ES6, Bootstrap, GSAP (TweenMax for the cursor),
   AOS for scroll animation, reveal() for headings, Swiper for the
   services belt. Page-only code lives in js/<page>.js.

   Built to stay light: no smooth-scroll library and no scroll-scrubbed
   tweens. Scroll work is done by AOS and IntersectionObserver, which only
   run when something enters the screen. */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. AOS (cards, lists, buttons) ----------
   Simple items carry data-aos="fade-up" in the HTML. A [data-reveal-group]
   staggers its children, so they get their attributes here. */
function initAOS() {
  if (!window.AOS) return;

  $('[data-reveal-group]').each(function () {
    $(this).children().each(function (i) {
      $(this).attr({ 'data-aos': 'fade-up', 'data-aos-delay': Math.min(i * 100, 500) });
    });
  });

  /* Once an item has played, hand it back to its own CSS. AOS keeps its
     transform/transition rules on the item, which would block hover effects. */
  document.addEventListener('aos:in', ({ detail: el }) => {
    const wait = 900 + (parseInt(el.dataset.aosDelay, 10) || 0) + 100;
    setTimeout(() => {
      el.removeAttribute('data-aos');
      el.removeAttribute('data-aos-delay');
    }, wait);
  });

  AOS.init({
    duration: 900,
    easing: 'ease-out-quad',
    offset: 60,
    once: true,
    disable: reduced
  });
}

/* ---------- 2. reveal() (headings and text) ----------
   Text with data-reveal="lines" rises in when it reaches the screen.
   .reveal is only added here, so without JS the text is simply shown. */
function reveal() {
  const els = document.querySelectorAll('[data-reveal="lines"]');
  if (!els.length || reduced || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('active');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  els.forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
}

/* ---------- 3. count-up numbers ---------- */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

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

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      run(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ---------- 4. click tabs ---------- */
function initTabs() {
  $('[data-tabs]').each(function () {
    const $links = $(this).find('[data-tab]');
    const $panes = $(this).find('[data-pane]');

    $links.on('click', function (e) {
      e.preventDefault();
      const key = $(this).data('tab');
      $links.removeClass('is-current');
      $(this).addClass('is-current');
      $panes.each(function () {
        const on = String($(this).data('pane')) === String(key);
        $(this).toggleClass('is-current', on);
        if (on && window.gsap && !reduced) {
          gsap.fromTo(this, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }
      });
    });
  });
}

/* ---------- 5. mobile menu ---------- */
function initNav() {
  const $btn = $('[data-nav-toggle]');
  const $panel = $('[data-nav-panel]');
  if (!$btn.length || !$panel.length) return;

  const set = (on) => {
    $panel.toggleClass('is-open', on);
    $btn.attr('aria-expanded', on ? 'true' : 'false');
    $('body').css('overflow', on ? 'hidden' : '');
  };

  $btn.on('click', () => set(!$panel.hasClass('is-open')));
  $('[data-nav-close]').on('click', () => set(false));
  $panel.on('click', (e) => { if (e.target === $panel[0]) set(false); });
  $(document).on('keydown', (e) => { if (e.key === 'Escape') set(false); });
}

/* ---------- 6. current page in the menu ---------- */
function initCurrentLink() {
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  $('.site-nav__link, .nav-panel__menu a').each(function () {
    const target = ($(this).attr('href') || '').split('#')[0].replace(/\.html$/, '');
    $(this).toggleClass('is-current', target === file);
  });
}

/* ---------- 7. forms (no backend yet) ---------- */
function initForms() {
  $('form:not([onsubmit])').on('submit', function (e) {
    e.preventDefault();
    const $done = $(this).parent().find('.w-form-done, [class*="form-done"]').first();
    if ($done.length) {
      $done.addClass('is-visible').show();
      $(this).hide();
    } else {
      this.reset();
    }
  });
}

/* ---------- 8. home hero: headline as navigation ----------
   Pointing at one of the four words dims the rest of the sentence and shows
   a card for the page it opens. A ring follows the mouse (TweenMax). Under
   768px, or on touch, the cards are a plain list and none of this runs. */
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

  /* entrance: eyebrow and headline lines rise in */
  const intro = hero.querySelectorAll('[data-hero-intro]');
  if (window.gsap && !reduced && intro.length) {
    gsap.fromTo(intro,
      { y: 44, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.09, delay: 0.15,
        ease: 'power3.out', clearProps: 'opacity,transform' });
  }

  const interactive = () => window.matchMedia('(hover: hover) and (min-width: 768px)').matches;

  let active = null;
  let demo = null;

  function setActive(i) {
    if (i === active) return;
    active = i;
    hero.classList.toggle('is-focused', i !== null);
    keys.forEach((k, n) => k.classList.toggle('is-active', n === i));
    cols.forEach((c, n) => c.classList.toggle('is-active', n === i));
    shots.forEach((s, n) => s.classList.toggle('is-on', n === i));
    /* the building leans a little toward the live word */
    if (bg && window.gsap && !reduced) {
      gsap.to(bg, { x: i === null ? 0 : (i - 1.5) * 18, duration: 0.9, ease: 'power3.out' });
    }
  }

  /* play the four states once on load, so people see what the words do */
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

  /* a word and its card are one control, so moving between them must not
     switch the focus off for a moment: clear on the next tick, and let the
     incoming mouseenter cancel it */
  let clearTimer = null;
  const hold  = () => { clearTimeout(clearTimer); clearTimer = null; };
  const relax = () => { hold(); clearTimer = setTimeout(() => setActive(null), 0); };

  [keys, cols].forEach((list) => list.forEach((el, i) => {
    $(el).on('mouseenter focus', () => { stopDemo(); hold(); if (interactive()) setActive(i); });
    $(el).on('mouseleave blur', () => { if (interactive()) relax(); });
  }));

  /* the four lens photos load after the page, so they never slow the first paint */
  if (lens && shots.length) {
    const arm = () => shots.forEach((s) => {
      if (s.dataset.src) { s.style.backgroundImage = `url("${s.dataset.src}")`; delete s.dataset.src; }
    });
    if (document.readyState === 'complete') arm();
    else $(window).one('load', arm);
  }

  /* --- cursor ring (TweenMax) ---
     Mouse moves can fire faster than the screen draws, so we keep only the
     latest position and send ONE tween per frame. */
  if (cursor && !reduced) {
    let px = 0, py = 0, queued = false;
    const frame = () => {
      queued = false;
      if (window.TweenMax) {
        TweenMax.to(cursor, 0.35, { x: px, y: py, ease: Power3.easeOut, overwrite: true });
      } else {
        cursor.style.transform = `translate(${px}px, ${py}px)`;
      }
      if (lens) {
        lens.style.setProperty('--lens-x', px + 'px');
        lens.style.setProperty('--lens-y', py + 'px');
      }
    };

    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      /* the lens only turns on after a real mouse move, so the load demo
         does not flash photos in the middle of the page */
      if (lens && !lens.classList.contains('is-live')) lens.classList.add('is-live');
      if (!queued) { queued = true; requestAnimationFrame(frame); }
    }, { passive: true });

    $(keys).on('mouseenter', () => { if (interactive()) cursor.classList.add('is-on'); });
    $(keys).on('mouseleave', () => cursor.classList.remove('is-on'));
    $(hero).on('mouseleave', () => cursor.classList.remove('is-on'));
  }

  /* resizing below the hover size must not leave the hero dimmed */
  $(window).on('resize', () => { if (!interactive()) setActive(null); });

  playDemo();
}

/* ---------- 9. services belt (Swiper) ----------
   Desktop: a belt that runs right to left without stopping, and holds while
   the mouse is on it or a card is open. Touch / reduced motion: a normal
   swipe slider. "+" opens a card's detail; only one card is open at a time. */
function initServiceTicker() {
  $('[data-ticker]').each(function () {
    const ticker = this;
    const rail   = ticker.querySelector('.wwo-ticker__rail');
    const $track = $(ticker).find('[data-ticker-track]');
    if (!rail || !$track.length || !window.Swiper) return;

    /* copy the five cards once, so the loop always has enough slides. The copies
       are decoration: hidden from screen readers and out of the tab order. */
    $track.children('[data-card]').clone()
      .attr('aria-hidden', 'true')
      .find('button, a').attr('tabindex', '-1').end()
      .appendTo($track);

    const css = (name, fallback) => parseFloat(getComputedStyle(ticker).getPropertyValue(name)) || fallback;
    const gap = () => css('--card-gap', 22);
    const belt = !reduced && window.matchMedia('(hover: hover)').matches;

    /* the old CSS belt ran at about 64px a second; keep that pace */
    const PX_PER_SEC = 64;
    const slideTime = () => ((css('--card-w', 388) + gap()) / PX_PER_SEC) * 1000;

    const swiper = new Swiper(rail, {
      slidesPerView: 'auto',
      spaceBetween: gap(),
      loop: true,
      speed: belt ? slideTime() : 500,
      allowTouchMove: !belt,
      autoplay: belt ? { delay: 0, disableOnInteraction: false } : false,
      slidesOffsetBefore: belt ? 0 : css('--pad-inner', 20),
      slidesOffsetAfter: belt ? 0 : css('--pad-inner', 20),
      on: {
        resize(s) {
          s.params.spaceBetween = gap();
          if (belt) s.params.speed = slideTime();
          s.update();
        }
      }
    });

    /* --- hold and resume the belt ---
       Stopping autoplay alone lets the current slide finish its move, so we
       also freeze the wrapper exactly where it is. Resuming finishes that
       move at the normal pace, then autoplay carries on. */
    let hovering = false;
    let paused = false;

    function pause() {
      if (!belt || paused) return;
      paused = true;
      swiper.autoplay.stop();
      const x = swiper.getTranslate();
      swiper.setTransition(0);
      swiper.setTranslate(x);
    }

    function resume() {
      if (!belt || !paused || hovering || ticker.classList.contains('is-locked')) return;
      paused = false;
      const target = -swiper.slidesGrid[swiper.activeIndex];
      const rest = Math.abs(target - swiper.getTranslate());
      const time = (rest / PX_PER_SEC) * 1000;
      swiper.once('transitionEnd', () => { if (!paused) swiper.autoplay.start(); });
      swiper.setTransition(time);
      swiper.setTranslate(target);
      if (time === 0) swiper.autoplay.start();
    }

    $(ticker)
      .on('mouseenter', () => { hovering = true; pause(); })
      .on('mouseleave', () => { hovering = false; resume(); })
      .on('focusin', pause)
      .on('focusout', () => setTimeout(() => { if (!ticker.contains(document.activeElement)) resume(); }, 0));

    /* --- card states --- */
    const $cards = () => $(ticker).find('[data-card]');

    function closeAll() {
      $cards().removeClass('is-open is-peek').find('[data-card-toggle]').attr('aria-expanded', 'false');
      ticker.classList.remove('is-locked');
      resume();
    }

    function open(card) {
      const wasOpen = card.classList.contains('is-open');
      closeAll();
      if (wasOpen) return;
      $(card).addClass('is-open').find('[data-card-toggle]').attr('aria-expanded', 'true');
      /* the belt must stop, or the open card walks off the screen */
      ticker.classList.add('is-locked');
      pause();
    }

    $(ticker).on('click', (e) => {
      const toggle = e.target.closest('[data-card-toggle]');
      if (toggle) { open(toggle.closest('[data-card]')); return; }
      if (e.target.closest('a')) return;                 // let the link work

      const card = e.target.closest('[data-card]');
      if (!card) return;
      if (card.classList.contains('is-open')) { closeAll(); return; }

      /* touch has no hover, so a tap brings the photo into focus */
      const wasPeek = card.classList.contains('is-peek');
      closeAll();
      if (!wasPeek) card.classList.add('is-peek');
    });

    $(document).on('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
    $(document).on('click', (e) => { if (!ticker.contains(e.target)) closeAll(); });
  });
}

/* ---------- boot ---------- */
$(function () {
  initAOS();
  reveal();
  initHero();
  initCounters();
  initTabs();
  initNav();
  initCurrentLink();
  initForms();
  initServiceTicker();
});

/* images and fonts change the page height after load, so let AOS measure again */
$(window).on('load', () => { if (window.AOS) AOS.refresh(); });
