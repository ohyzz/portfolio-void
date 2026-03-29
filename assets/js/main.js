/* ============================================
   VOID.WORKS — Main JS
   ============================================ */

// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initReveal();
  initGameLoader();
});

/* --------------------------------------------------
   1. КАСТОМНЫЙ КУРСОР
   -------------------------------------------------- */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursor-trail');

  if (!cursor || !trail) return;

  // Следим за мышью
  document.addEventListener('mousemove', (e) => {
    // Основная точка — моментально
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';

    // Кольцо — с задержкой (через CSS transition)
    trail.style.left = e.clientX + 'px';
    trail.style.top  = e.clientY + 'px';
  });

  // Курсор увеличивается при нажатии
  document.addEventListener('mousedown', () => cursor.classList.add('active'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('active'));

  // Курсор исчезает когда мышь уходит за экран
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
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* --------------------------------------------------
   3. SCROLL REVEAL — плавное появление секций
   -------------------------------------------------- */
function initReveal() {
  // Добавляем класс .reveal всем секциям и карточкам
  const targets = document.querySelectorAll(
    '.section-title, .about-grid, .work-card, .contact-text, .void-text, .game-wrapper'
  );

  targets.forEach(el => el.classList.add('reveal'));

  // IntersectionObserver — следит, вошёл ли элемент в экран
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // больше не следим — уже показан
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
    if (gameLoaded) return; // не загружаем дважды
    gameLoaded = true;

    btn.textContent = '[ loading... ]';
    btn.disabled = true;

    // Создаём тег <script> и вставляем в DOM
    // Браузер скачает game.js только в этот момент
    const script = document.createElement('script');
    script.src = 'assets/js/game.js';

    script.onload = () => {
      // game.js загрузился — прячем кнопку, показываем канвас
      btn.style.display = 'none';
      canvas.classList.add('visible');
      hint.classList.add('visible');

      // Запускаем игру (функция определена в game.js)
      if (typeof initGame === 'function') {
        initGame('game-canvas');
      }
    };

    script.onerror = () => {
      btn.textContent = '[ error — try again ]';
      btn.disabled = false;
      gameLoaded = false;
    };

    document.body.appendChild(script);
  });
}
