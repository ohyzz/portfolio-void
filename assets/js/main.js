/* ============================================
   VOID.WORKS — Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initReveal();
  initGameLoader();
  initHorror();
  initHeroGlitch();
});

/* --------------------------------------------------
   1. КАСТОМНЫЙ КУРСОР
   -------------------------------------------------- */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursor-trail');

  if (!cursor || !trail) return;

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    trail.style.left  = e.clientX + 'px';
    trail.style.top   = e.clientY + 'px';
  });

  document.addEventListener('mousedown', () => cursor.classList.add('active'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('active'));

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    trail.style.opacity  = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    trail.style.opacity  = '1';
  });
}

/* --------------------------------------------------
   2. НАВИГАЦИЯ — появляется при скролле
   -------------------------------------------------- */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* --------------------------------------------------
   3. SCROLL REVEAL
   -------------------------------------------------- */
function initReveal() {
  const targets = document.querySelectorAll(
    '.section-title, .about-grid, .work-card, .contact-text, .void-text, .game-wrapper'
  );

  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}

/* --------------------------------------------------
   4. ДИНАМИЧЕСКАЯ ЗАГРУЗКА ИГРЫ
   -------------------------------------------------- */
function initGameLoader() {
  const btn    = document.getElementById('btn-play');
  const canvas = document.getElementById('game-canvas');
  const hint   = document.getElementById('game-hint');

  if (!btn) return;

  let gameLoaded = false;

  btn.addEventListener('click', () => {
    if (gameLoaded) return;
    gameLoaded = true;

    btn.textContent = '[ loading... ]';
    btn.disabled = true;

    const script  = document.createElement('script');
    script.src    = 'assets/js/game.js';

    script.onload = () => {
      btn.style.display = 'none';
      canvas.classList.add('visible');
      if (hint) hint.classList.add('visible');

      if (typeof initGame === 'function') initGame('game-canvas');
    };

    script.onerror = () => {
      btn.textContent = '[ error — try again ]';
      btn.disabled    = false;
      gameLoaded      = false;
    };

    document.body.appendChild(script);
  });
}

/* --------------------------------------------------
   5. HERO GLITCH — постоянная смена фраз заголовка
   -------------------------------------------------- */
function initHeroGlitch() {
  const spans = document.querySelectorAll('.hero-title .glitch');
  if (spans.length < 2) return;

  const phrases = [
    ['NOTHING',    'IS REAL'],
    ['I AM',       'ERASED'],
    ['YOU ARE',    'NOT ALONE'],
    ['THE WALLS',  'MOVE CLOSER'],
    ['EVERY DAY',  'THE SAME'],
    ['LOOK',       'AWAY'],
    ['DISSOLVING', 'SLOWLY'],
    ['IT SEES',    'YOU NOW'],
    ['NO',         'EXIT'],
    ['THE',        'BECOMING'],
    ['YOU CAUSED', 'THIS'],
    ['I CANNOT',   'STOP THIS'],
    ['SIGNAL',     'LOST'],
    ['STILL',      'HERE'],
    ['BEHIND',     'YOU'],
    ['NOTHING',    'IS REAL'],
  ];

  let idx = 0;

  function setPhrase(line1, line2) {
    spans[0].textContent = line1;
    spans[0].setAttribute('data-text', line1);
    spans[1].textContent = line2;
    spans[1].setAttribute('data-text', line2);
  }

  function next() {
    idx = (idx + 1) % phrases.length;
    const [line1, line2] = phrases[idx];

    // Краткое гашение — текст "умирает"
    spans[0].style.transition = 'opacity 0.08s';
    spans[1].style.transition = 'opacity 0.08s';
    spans[0].style.opacity = '0';
    spans[1].style.opacity = '0';

    setTimeout(() => {
      setPhrase(line1, line2);
      spans[0].style.opacity = '1';
      spans[1].style.opacity = '1';
    }, 90);

    // "NOTHING IS REAL" держится дольше остальных
    const isHome = line1 === 'NOTHING' && line2 === 'IS REAL';
    const delay  = isHome
      ? 4000 + Math.random() * 3000
      : 1800 + Math.random() * 2200;

    setTimeout(next, delay);
  }

  setTimeout(next, 2500 + Math.random() * 2000);
}

/* --------------------------------------------------
   6. HORROR — психологический распад страницы
   -------------------------------------------------- */
function initHorror() {

  /* ---- Оверлей вспышки ---- */
  const flash = document.createElement('div');
  flash.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(60,0,0,0)',
    'pointer-events:none',
    'z-index:9990',
    'transition:background 0.07s ease-out',
  ].join(';');
  document.body.appendChild(flash);

  function redFlash(intensity) {
    intensity = intensity || 0.18;
    flash.style.background = `rgba(60,0,0,${intensity})`;
    setTimeout(() => { flash.style.background = 'rgba(60,0,0,0)'; }, 100);
  }

  /* ---- Тряска страницы ---- */
  function shakeScreen() {
    document.documentElement.classList.add('is-shaking');
    setTimeout(() => document.documentElement.classList.remove('is-shaking'), 500);
  }

  /* ---- Постоянная смена заголовка вкладки ---- */
  const titleSequence = [
    '// VOID.WORKS',
    '// SIGNAL_LOST',
    '// VOID.WORKS',
    '// YOU ARE STILL HERE',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// IT FOUND YOU',
    '// VOID.WORKS',
    '// DISSOLVING',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// ERROR: NO EXIT',
    '// VOID.WORKS',
    '// THE BECOMING',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// i am not my own',
    '// VOID.WORKS',
    '// every day is exactly the same',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// BEHIND YOU',
    '// VOID.WORKS',
    '// you caused this',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// NOT ALONE',
    '// VOID.WORKS',
    '// i want to destroy something beautiful',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// RUN',
    '// VOID.WORKS',
  ];

  let titleIdx = 0;

  function corruptTitle() {
    // не делаем ничего — заголовок крутится сам в tickTitle
  }

  function tickTitle() {
    titleIdx = (titleIdx + 1) % titleSequence.length;
    document.title = titleSequence[titleIdx];

    // Держим "нормальный" заголовок дольше, жуткие — кратко
    const current = titleSequence[titleIdx];
    const isNormal = current === '// VOID.WORKS';
    const delay = isNormal
      ? 2200 + Math.random() * 2000
      :  600 + Math.random() * 900;

    setTimeout(tickTitle, delay);
  }

  // Запускаем через случайную паузу
  setTimeout(tickTitle, 3000 + Math.random() * 4000);

  /* ---- Коррупция текста на странице ---- */
  const textTargets = Array.from(document.querySelectorAll('.about-text p, .contact-text, .hero-sub'));
  const originals   = textTargets.map(el => el.innerHTML);

  const corrupted = [
    'something is watching you right now.',
    'you were never supposed to find this.',
    'i am still here.&nbsp;&nbsp;i never left.',
    'it started long before you arrived.',
    'every day is exactly the same.',
    'you caused this.',
    'the walls are&nbsp;&nbsp;moving.',
    'there is no clean version of this.',
    'i want to destroy something beautiful.',
  ];

  let isCorrupted = false;

  function corruptText() {
    if (isCorrupted || textTargets.length === 0) return;
    isCorrupted = true;

    const idx = Math.floor(Math.random() * textTargets.length);
    const el  = textTargets[idx];

    el.style.transition = 'opacity 0.25s, color 0.25s';
    el.style.opacity    = '0.15';

    setTimeout(() => {
      el.innerHTML   = corrupted[Math.floor(Math.random() * corrupted.length)];
      el.style.color = 'rgba(150, 70, 70, 0.65)';
      el.style.opacity = '1';
    }, 250);

    const holdDur = 2000 + Math.random() * 1800;
    setTimeout(() => {
      el.style.opacity = '0.15';
      setTimeout(() => {
        el.innerHTML   = originals[idx];
        el.style.color = '';
        el.style.opacity = '1';
        isCorrupted    = false;
      }, 250);
    }, holdDur);
  }

  /* ---- Курсор-лаг ---- */
  const trail = document.getElementById('cursor-trail');
  function cursorGlitch() {
    if (!trail) return;
    // кратковременный красный курсор
    trail.style.borderColor = 'rgba(120,0,0,0.5)';
    trail.style.transform   = `translate(-50%, -50%) scale(${1.5 + Math.random()})`;
    setTimeout(() => {
      trail.style.borderColor = '';
      trail.style.transform   = '';
    }, 200 + Math.random() * 150);
  }

  /* ---- Планировщик ---- */
  function sched(fn, minSec, maxSec) {
    const run = () => {
      fn();
      const next = (minSec + Math.random() * (maxSec - minSec)) * 1000;
      setTimeout(run, next);
    };
    setTimeout(run, (minSec + Math.random() * (maxSec - minSec)) * 1000);
  }

  sched(redFlash,    7,   18);
  sched(shakeScreen, 30,  75);
  sched(corruptText,  25,  60);
  sched(cursorGlitch,  8,  20);

  /* ---- Эскалация при долгом пребывании ---- */
  // Чем дольше пользователь на сайте, тем чаще вспышки
  setTimeout(() => {
    sched(redFlash,    4,  10);
    sched(shakeScreen, 20, 50);
  }, 3 * 60 * 1000); // через 3 минуты

  /* ---- Секретный Konami-like триггер: 5 кликов по логотипу ---- */
  const logo = document.querySelector('.nav-logo');
  if (logo) {
    let clickCount = 0;
    logo.addEventListener('click', () => {
      clickCount++;
      if (clickCount >= 5) {
        clickCount = 0;
        // каскад ужаса
        redFlash(0.35);
        shakeScreen();
        setTimeout(() => redFlash(0.25), 150);
        setTimeout(() => { redFlash(0.4); shakeScreen(); }, 350);
        setTimeout(() => corruptText(), 600);
        corruptTitle();
      }
    });
  }
}
