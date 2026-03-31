/* ============================================
   VOID.WORKS — Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initReveal();
  initGameLoader();
  initVisualizerLoader();
  initHorror();
  initHeroGlitch();
  initWorkPreviews();
  initNavActiveState();
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
   5. VISUALIZER LOADER
   -------------------------------------------------- */
function initVisualizerLoader() {
  const link = document.getElementById('open-visualizer');
  if (!link) return;

  let loaded = false;

  link.addEventListener('click', (e) => {
    e.preventDefault();

    if (loaded) {
      if (typeof window.openVisualizer === 'function') window.openVisualizer();
      return;
    }

    const script  = document.createElement('script');
    script.src    = 'assets/js/visualizer.js';
    script.onload = () => {
      loaded = true;
      if (typeof window.openVisualizer === 'function') window.openVisualizer();
    };
    document.body.appendChild(script);
  });
}

/* --------------------------------------------------
   6. HERO GLITCH — постоянная смена фраз заголовка
   -------------------------------------------------- */
function initHeroGlitch() {
  const spans = document.querySelectorAll('.hero-title .glitch');
  if (spans.length < 2) return;

  const phrases = [
    ['НИЧТО',      'НЕ РЕАЛЬНО'],
    ['Я',           'СТЁРТ'],
    ['ТЫ НЕ',       'ОДИН'],
    ['СТЕНЫ',       'СДВИГАЮТСЯ'],
    ['КАЖДЫЙ ДЕНЬ', 'ОДИНАКОВ'],
    ['ОТВЕРНИСЬ',   ''],
    ['РАСТВОРЯЮСЬ', 'МЕДЛЕННО'],
    ['ОНО',         'УЖЕ ВИДИТ ТЕБЯ'],
    ['НЕТ',         'ВЫХОДА'],
    ['СТАНОВЛЕНИЕ', ''],
    ['ТЫ ЭТО',      'СДЕЛАЛ'],
    ['Я НЕ МОГУ',   'ЭТО ОСТАНОВИТЬ'],
    ['СИГНАЛ',      'ПОТЕРЯН'],
    ['ВСЁ ЕЩЁ',     'ЗДЕСЬ'],
    ['ПОЗАДИ',      'ТЕБЯ'],
    ['НИЧЕГО',      'НЕ ОСТАНОВИТ МЕНЯ'],
    ['НИЧТО',      'НЕ РЕАЛЬНО'],
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
    '// СИГНАЛ ПОТЕРЯН',
    '// VOID.WORKS',
    '// ТЫ ВСЁ ЕЩЁ ЗДЕСЬ',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// ОНО НАШЛО ТЕБЯ',
    '// VOID.WORKS',
    '// РАСТВОРЯЮСЬ',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// ОШИБКА: ВЫХОДА НЕТ',
    '// VOID.WORKS',
    '// СТАНОВЛЕНИЕ',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// Я НЕ ПРИНАДЛЕЖУ СЕБЕ',
    '// VOID.WORKS',
    '// КАЖДЫЙ ДЕНЬ АБСОЛЮТНО ОДИНАКОВ',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// ПОЗАДИ ТЕБЯ',
    '// VOID.WORKS',
    '// ТЫ ЭТО СДЕЛАЛ',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// НЕ ОДИН',
    '// VOID.WORKS',
    '// Я ХОЧУ УНИЧТОЖИТЬ ЧТО-ТО ПРЕКРАСНОЕ',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// VOID.WORKS',
    '// БЕГИ',
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
    'что-то наблюдает за тобой прямо сейчас.',
    'ты никогда не должен был это найти.',
    'я всё ещё здесь.&nbsp;&nbsp;я никогда не уходил.',
    'это началось задолго до твоего появления.',
    'каждый день абсолютно одинаков.',
    'ты это сделал.',
    'стены&nbsp;&nbsp;двигаются.',
    'чистой версии этого не существует.',
    'я хочу уничтожить что-то прекрасное.',
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

/* --------------------------------------------------
   7. LIVE CANVAS PREVIEWS для карточек work
   -------------------------------------------------- */
function initWorkPreviews() {

  /* --- превью 01: глитч-генератор --- */
  const c1 = document.getElementById('mini-canvas-01');
  const card1 = c1 && c1.closest('.wc');
  if (c1 && card1) {
    let raf1 = null;
    const ctx1 = c1.getContext('2d');

    function resizeC1() {
      c1.width  = c1.offsetWidth;
      c1.height = c1.offsetHeight;
    }

    function drawGlitch() {
      const w = c1.width, h = c1.height;
      ctx1.fillStyle = '#050202';
      ctx1.fillRect(0, 0, w, h);

      // Цветные горизонтальные полосы-разрывы
      const bands = 6 + Math.floor(Math.random() * 8);
      for (let i = 0; i < bands; i++) {
        const y   = Math.random() * h;
        const bh  = 1 + Math.random() * 12;
        const off = (Math.random() - 0.5) * 30;
        const r   = Math.floor(Math.random() * 180);
        const g   = 0;
        const b   = 0;
        ctx1.fillStyle = `rgba(${r},${g},${b},${0.4 + Math.random()*0.5})`;
        ctx1.fillRect(off, y, w, bh);
      }

      // RGB-смещение
      for (let i = 0; i < 3; i++) {
        const y  = Math.random() * h;
        const bh = Math.random() * 20;
        ctx1.fillStyle = `rgba(200,0,0,0.15)`;
        ctx1.fillRect(-5, y, w, bh);
        ctx1.fillStyle = `rgba(0,0,180,0.1)`;
        ctx1.fillRect(5, y + 2, w, bh);
      }

      // Шум-пиксели
      for (let i = 0; i < 120; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const v  = Math.floor(Math.random() * 180);
        ctx1.fillStyle = `rgb(${v},0,0)`;
        ctx1.fillRect(px, py, 2, 1);
      }

      raf1 = requestAnimationFrame(drawGlitch);
    }

    card1.addEventListener('mouseenter', () => {
      resizeC1();
      if (!raf1) drawGlitch();
    });

    card1.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf1);
      raf1 = null;
    });
  }

  /* --- превью 02: sound visualizer --- */
  const c2 = document.getElementById('mini-canvas-02');
  const card2 = c2 && c2.closest('.wc');
  if (c2 && card2) {
    let raf2 = null;
    const ctx2 = c2.getContext('2d');
    let phase = 0;

    function resizeC2() {
      c2.width  = c2.offsetWidth;
      c2.height = c2.offsetHeight;
    }

    function drawViz() {
      const w = c2.width, h = c2.height;
      ctx2.fillStyle = 'rgba(5,2,2,0.35)';
      ctx2.fillRect(0, 0, w, h);

      const bars = 38;
      const bw   = w / bars;

      for (let i = 0; i < bars; i++) {
        const t = phase + i * 0.28;
        const amp = (
          Math.sin(t * 1.3) * 0.4 +
          Math.sin(t * 2.1 + 1) * 0.3 +
          Math.sin(t * 0.7 + 2) * 0.3
        );
        const bh = Math.abs(amp) * (h * 0.72) + 2;
        const intensity = Math.abs(amp);
        const r = Math.floor(80 + intensity * 150);
        ctx2.fillStyle = `rgba(${r},0,0,${0.5 + intensity * 0.5})`;
        ctx2.fillRect(
          i * bw + 1,
          (h - bh) / 2,
          bw - 2,
          bh
        );
      }

      phase += 0.055;
      raf2 = requestAnimationFrame(drawViz);
    }

    card2.addEventListener('mouseenter', () => {
      resizeC2();
      if (!raf2) drawViz();
    });

    card2.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf2);
      raf2 = null;
    });
  }
}

/* --------------------------------------------------
   8. NAV — подсвечивание активного пункта при скролле
   -------------------------------------------------- */
function initNavActiveState() {
  const sections = ['home', 'about', 'work', 'contact', 'void'];
  const links = document.querySelectorAll('.nav-links a');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(a => {
          a.classList.toggle('nav-active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}
