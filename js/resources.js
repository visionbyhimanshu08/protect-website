/* Resources page — stage checklists (saved on this device), the
   "is your builder in trouble?" quick check, the builder-speak flip cards
   and the hero demo card. Loaded after main.js. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'protect-resources-checklists-v1';

  const store = {
    read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    },
    write(data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode: still works for this visit */ }
    }
  };

  /* ---------- 1. Stage checklists ---------- */
  function initChecklists() {
    const root = document.querySelector('[data-checklists]');
    if (!root) return;
    const tabs  = [...root.querySelectorAll('[data-stage-tab]')];
    const panes = [...root.querySelectorAll('[data-stage-pane]')];
    const saved = store.read();

    const boxes = pane => [...pane.querySelectorAll('.rs-check__input')];

    /* restore */
    panes.forEach(pane => {
      const on = saved[pane.dataset.stagePane] || [];
      boxes(pane).forEach((b, i) => { b.checked = on.includes(i); });
    });

    function update(pane) {
      const id = pane.dataset.stagePane;
      const list = boxes(pane);
      const done = list.filter(b => b.checked).length;
      const total = list.length;
      const pct = total ? Math.round(done / total * 100) : 0;

      pane.querySelector('[data-stage-pct]').textContent = pct + '%';
      pane.querySelector('[data-stage-arc]').style.strokeDasharray = `${pct} 100`;
      const status = pane.querySelector('[data-stage-status]');
      status.textContent = done === 0 ? 'Nothing ticked yet.'
        : done === total ? `All ${total} ticked — you are ready for this stage.`
        : `${done} of ${total} ticked.`;

      const tab = tabs.find(t => t.dataset.stageTab === id);
      if (tab) {
        tab.querySelector('[data-stage-count]').textContent = `${done}/${total}`;
        tab.querySelector('[data-stage-bar]').style.width = pct + '%';
      }

      const data = store.read();
      data[id] = list.map((b, i) => (b.checked ? i : -1)).filter(i => i > -1);
      store.write(data);
    }

    panes.forEach(pane => {
      pane.addEventListener('change', e => { if (e.target.matches('.rs-check__input')) update(pane); });
      pane.querySelector('[data-stage-clear]').addEventListener('click', () => {
        boxes(pane).forEach(b => { b.checked = false; });
        update(pane);
      });
      update(pane);
    });

    function select(tab, focus) {
      const id = tab.dataset.stageTab;
      tabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle('is-current', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panes.forEach(p => {
        const on = p.dataset.stagePane === id;
        p.hidden = !on;
        p.classList.toggle('is-current', on);
        if (on && window.gsap && !reduced) {
          gsap.fromTo(p, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'opacity,transform' });
          gsap.fromTo(p.querySelectorAll('.rs-list__item'), { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: .4, stagger: .03, ease: 'power2.out', clearProps: 'opacity,transform' });
        }
      });
      if (focus) tab.focus();
      /* keep the chosen tab visible in the mobile strip */
      const rail = tab.parentElement;
      if (rail.scrollWidth > rail.clientWidth) {
        rail.scrollTo({ left: tab.offsetLeft - parseFloat(getComputedStyle(rail).paddingLeft), behavior: reduced ? 'auto' : 'smooth' });
      }
      if (window.AOS) AOS.refresh();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (next) { e.preventDefault(); select(tabs[(i + next + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End')  { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  }

  /* ---------- 2. Builder-in-trouble quick check ---------- */
  function initSigns() {
    const root = document.querySelector('[data-signs]');
    if (!root) return;
    const boxes = [...root.querySelectorAll('.rs-check__input')];
    const meter = root.querySelector('.rs-meter');
    const title = root.querySelector('[data-signs-title]');
    const text  = root.querySelector('[data-signs-text]');

    const states = [
      ['Tick any sign you are seeing.', 'Nothing ticked — nothing to worry about yet.'],
      ['One sign — keep watching.', 'On its own it can be innocent. Note the date and keep your records up to date.'],
      ['A pattern may be forming.', 'Raise it with your builder in writing, and hold any payment that is not yet due.'],
      ['Several warning signs at once.', 'Get independent advice before you make your next payment.']
    ];

    const update = () => {
      const n = boxes.filter(b => b.checked).length;
      const level = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3;
      if (meter.dataset.level === String(level)) return;
      meter.dataset.level = level;
      title.textContent = states[level][0];
      text.textContent = states[level][1];
      if (window.gsap && !reduced) gsap.fromTo([title, text], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35, stagger: .05, ease: 'power2.out' });
    };
    root.addEventListener('change', update);
    update();
  }

  /* ---------- 3. Builder-speak flip cards ---------- */
  function initTerms() {
    const cards = [...document.querySelectorAll('[data-term]')];
    cards.forEach(card => {
      const btn = card.querySelector('.rs-term__btn');
      const front = card.querySelector('.rs-term__front');
      const back = card.querySelector('.rs-term__back');
      const sync = open => {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        front.setAttribute('aria-hidden', open ? 'true' : 'false');
        back.setAttribute('aria-hidden', open ? 'false' : 'true');
      };
      sync(false);
      btn.addEventListener('click', () => {
        const open = !card.classList.contains('is-open');
        card.classList.toggle('is-open', open);
        sync(open);
      });
    });
  }

  /* ---------- 4. Hero demo card: ticks itself once, then floats ---------- */
  function initDemo() {
    const card = document.querySelector('[data-rs-demo]');
    const pill = document.querySelector('[data-rs-pill]');
    if (!card || !window.gsap || reduced) return;
    const items = [...card.querySelectorAll('.rs-demo__list li')];
    const fill = card.querySelector('[data-rs-demo-fill]');

    gsap.fromTo(card, { y: 40, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: -2, duration: 1.1, delay: .2, ease: 'power3.out' });
    if (pill) {
      gsap.fromTo(pill, { y: 24, opacity: 0, rotate: -4 }, { y: 0, opacity: 1, rotate: 2, duration: .9, delay: .75, ease: 'back.out(1.6)' });
      gsap.to(pill, { y: -6, duration: 2.6, delay: 1.8, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }

    /* replay the three ticks so the card reads as the tool below it */
    items.forEach(li => li.classList.remove('is-on'));
    fill.style.width = '0%';
    [0, 1, 2].forEach((n, k) => setTimeout(() => {
      items[n].classList.add('is-on');
      fill.style.width = ((k + 1) * 25) + '%';
    }, 900 + k * 380));

    gsap.to(card, { y: -8, duration: 3.2, delay: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }

  const boot = () => { initChecklists(); initSigns(); initTerms(); initDemo(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
