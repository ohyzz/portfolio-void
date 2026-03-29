/* ============================================
   VOID.WORKS — Signal Lost (game.js)
   Слой 1: TV-шум + управление частотой
   ============================================ */

function initGame(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx    = canvas.getContext('2d');

  const W = canvas.width;   // 600
  const H = canvas.height;  // 400

  // --- Состояние игры ---
  const state = {
    frequency: 50,      // текущая частота (0–100)
    targetFreq: 50,     // к этому значению плавно движемся
    mouseX: null,       // позиция мыши на канвасе
  };

  // --- Буфер пикселей для быстрого шума ---
  // ImageData позволяет рисовать пиксели напрямую — быстрее чем fillRect
  const imageData = ctx.createImageData(W, H);
  const pixels    = imageData.data; // массив [R, G, B, A, R, G, B, A, ...]

  /* ------------------------------------------
     МЫШЬ: двигаем по канвасу → меняем частоту
     ------------------------------------------ */
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;

    // Переводим позицию X (0..W) в частоту (0..100)
    state.targetFreq = (state.mouseX / W) * 100;
  });

  canvas.addEventListener('mouseleave', () => {
    state.mouseX = null;
    // частота остаётся на последнем месте
  });

  /* ------------------------------------------
     РЕНДЕР: TV-шум
     ------------------------------------------ */
  function drawNoise(intensity) {
    // intensity: 0.0 (тихий) → 1.0 (полный шум)
    for (let i = 0; i < pixels.length; i += 4) {
      // Случайная яркость пикселя
      const bright = Math.random() < intensity
        ? Math.floor(Math.random() * 200)  // светлый пиксель
        : 0;                               // чёрный пиксель

      pixels[i]     = bright; // R
      pixels[i + 1] = bright; // G
      pixels[i + 2] = bright; // B
      pixels[i + 3] = 255;    // A (непрозрачный)
    }
    ctx.putImageData(imageData, 0, 0);
  }

  /* ------------------------------------------
     РЕНДЕР: шкала частоты внизу канваса
     ------------------------------------------ */
  function drawFrequencyBar() {
    const barH  = 28;
    const barY  = H - barH;
    const barW  = W;

    // Фон шкалы
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, barY, barW, barH);

    // Линия шкалы
    ctx.strokeStyle = '#333';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(20, barY + 10);
    ctx.lineTo(barW - 20, barY + 10);
    ctx.stroke();

    // Засечки
    for (let i = 0; i <= 10; i++) {
      const x = 20 + (i / 10) * (barW - 40);
      ctx.strokeStyle = '#444';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x, barY + 6);
      ctx.lineTo(x, barY + 14);
      ctx.stroke();
    }

    // Ползунок (текущая частота)
    const sliderX = 20 + (state.frequency / 100) * (W - 40);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(sliderX - 1, barY + 3, 2, 14);

    // Число частоты
    ctx.fillStyle = '#555';
    ctx.font      = '10px Share Tech Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(state.frequency).toString().padStart(3, '0')}.${Math.floor(Math.random() * 10)} MHz`, barW - 20, barY + 22);
  }

  /* ------------------------------------------
     ИГРОВОЙ ЦИКЛ
     ------------------------------------------ */
  function loop() {
    // Плавно двигаем частоту к целевой (lerp)
    state.frequency += (state.targetFreq - state.frequency) * 0.08;

    // Интенсивность шума — максимальная по краям шкалы, ниже в центре
    // Пока нет сигналов — всегда полный шум
    const noise = 0.55 + Math.random() * 0.1;

    drawNoise(noise);
    drawFrequencyBar();

    requestAnimationFrame(loop);
  }

  loop();
}
