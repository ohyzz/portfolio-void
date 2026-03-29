/* ============================================
   VOID.WORKS — Signal Lost (game.js)
   Частотные зоны, NIN-атмосфера, распад
   ============================================ */

function initGame(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx    = canvas.getContext('2d');

  const W = canvas.width;   // 600
  const H = canvas.height;  // 400

  const state = {
    frequency:     50,
    targetFreq:    50,
    mouseX:        null,
    tick:          0,
    events:        [],
    lastSpawn:     0,
    spawnCooldown: 55,
    // "A Warm Place" — специальное состояние
    warmPlace:     false,
    warmTick:      0,
    warmParticles: [],
  };

  const imageData = ctx.createImageData(W, H);
  const pixels    = imageData.data;

  /* ==============================
     БАНК ТЕКСТОВ — NIN / распад
     ============================== */
  const texts = {
    low: [
      '...', '——', 'drift', 'hollow', 'static',
    ],
    mid: [
      'NOT ALONE', 'DO NOT LOOK', 'YOU OPENED IT',
      'SHE STAYED', '01001000 01000101 01001100 01010000',
      'LEAVE', 'BEHIND YOU',
    ],
    high: [
      'I SEE YOU', 'RUN', 'THE BECOMING',
      'EVERY DAY IS EXACTLY THE SAME',
      'NO ONE IS LISTENING',
      'RUINED', 'ERASED', 'YOU CAUSED THIS',
      'I AM NOT MY OWN', 'SOMETHING IS WRONG WITH ME',
    ],
    chaos: [
      'I WANT TO DESTROY SOMETHING BEAUTIFUL',
      'I AM BECOMING LESS DEFINED',
      'THE WALLS ARE MOVING CLOSER',
      'IT CANNOT BE STOPPED NOW',
      'YOU ARE ALONE IN HERE',
      'DISSOLVING', 'NOTHING CAN STOP THIS NOW',
      'THIS IS THE ONLY THING THAT\'S REAL',
    ],
  };

  function pickText(zone) {
    if (zone < 0.3)       return texts.low[Math.floor(Math.random()  * texts.low.length)];
    else if (zone < 0.58) return texts.mid[Math.floor(Math.random()  * texts.mid.length)];
    else if (zone < 0.82) return texts.high[Math.floor(Math.random() * texts.high.length)];
    else                  return texts.chaos[Math.floor(Math.random()* texts.chaos.length)];
  }

  /* ---- Мышь ---- */
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX    = e.clientX - rect.left;
    state.targetFreq = (state.mouseX / W) * 100;
  });
  canvas.addEventListener('mouseleave', () => { state.mouseX = null; });

  /* ==============================
     РИСОВАНИЕ: УТИЛИТЫ
     ============================== */

  function drawNoise(intensity, redTint) {
    redTint = redTint || 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (Math.random() < intensity) {
        const v = Math.floor(Math.random() * 215);
        pixels[i]     = v + Math.floor(redTint * 30);
        pixels[i + 1] = Math.max(0, v - Math.floor(redTint * 20));
        pixels[i + 2] = Math.max(0, v - Math.floor(redTint * 20));
      } else {
        pixels[i] = pixels[i+1] = pixels[i+2] = 0;
      }
      pixels[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function drawFrequencyBar(freqLabel) {
    const barH = 28;
    const barY = H - barH;

    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, barY, W, barH);

    ctx.strokeStyle = '#1e0000';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(20, barY + 10);
    ctx.lineTo(W - 20, barY + 10);
    ctx.stroke();

    for (let i = 0; i <= 10; i++) {
      const x = 20 + (i / 10) * (W - 40);
      ctx.strokeStyle = '#2a0808';
      ctx.beginPath();
      ctx.moveTo(x, barY + 5);
      ctx.lineTo(x, barY + 15);
      ctx.stroke();
    }

    const sliderX = 20 + (state.frequency / 100) * (W - 40);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(sliderX - 1, barY + 2, 2, 16);

    ctx.fillStyle = '#3a0000';
    ctx.font      = '10px Share Tech Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(freqLabel, W - 20, barY + 22);
  }

  /* ==============================
     РИСОВАНИЕ: КРИПИ-ЭЛЕМЕНТЫ
     ============================== */

  /* Силуэт фигуры */
  function drawSilhouette(x, y, alpha, scale) {
    scale = scale || 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const g = ctx.createRadialGradient(0, -25, 5, 0, -25, 58);
    g.addColorStop(0, `rgba(90,0,0,${alpha * 0.2})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -25, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.95)';
    ctx.beginPath(); ctx.arc(0, -65, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-9, -52, 18, 44);
    ctx.fillRect(-27, -48, 18, 7);
    ctx.fillRect(9, -48, 18, 7);
    ctx.fillRect(-11, -8, 10, 40);
    ctx.fillRect(1, -8, 10, 40);
    ctx.restore();
  }

  /* Руки снизу */
  function drawHands(alpha) {
    const count = 3 + Math.floor(Math.random() * 3);
    ctx.save();
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillStyle   = 'rgba(0,0,0,0.9)';
    ctx.strokeStyle = 'rgba(40,0,0,0.7)';
    ctx.lineWidth   = 1;

    for (let i = 0; i < count; i++) {
      const hx = 40 + Math.random() * (W - 80);
      const hy = H - 30;
      const len = 40 + Math.random() * 50;

      // запястье
      ctx.fillRect(hx - 6, hy - len, 12, len);

      // 4 пальца
      for (let f = 0; f < 4; f++) {
        const fx  = hx - 10 + f * 7;
        const flen = 12 + Math.random() * 10;
        ctx.fillRect(fx, hy - len - flen, 5, flen + 4);
      }

      // большой палец
      ctx.save();
      ctx.translate(hx + 10, hy - len + 10);
      ctx.rotate(-0.4);
      ctx.fillRect(0, 0, 5, 16);
      ctx.restore();
    }
    ctx.restore();
  }

  /* Глаза */
  function drawEye(x, y, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    ctx.fillStyle = 'rgb(210,200,190)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgb(20,5,5)';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(150,0,0,0.6)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * r,  Math.sin(a) * (r * 0.54));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEyesInDark(alpha) {
    const n = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      drawEye(
        40 + Math.random() * (W - 80),
        30 + Math.random() * (H - 80),
        alpha * (0.5 + Math.random() * 0.5)
      );
    }
  }

  /* Кричащее лицо */
  function drawScreamFace(alpha) {
    const cx = W / 2, cy = (H - 28) / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(140,0,0,${alpha})`;
    ctx.lineWidth   = 1.2;
    ctx.shadowColor = 'rgba(200,0,0,0.6)';
    ctx.shadowBlur  = 20;

    // контур
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 78, 0, 0, Math.PI * 2);
    ctx.stroke();

    // глаза — пустые провалы
    ctx.beginPath();
    ctx.ellipse(cx - 22, cy - 18, 14, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 22, cy - 18, 14, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // кричащий рот
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30, 22, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.9})`;
    ctx.fill();

    // зубы
    ctx.fillStyle = `rgba(180,160,160,${alpha * 0.6})`;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(cx - 18 + i * 10, cy + 14, 7, 8);
      ctx.fillRect(cx - 15 + i * 10, cy + 38, 6, 7);
    }

    ctx.restore();
  }

  /* Криптотекст */
  function drawCrypticText(text, x, y, alpha, size) {
    size = size || 13;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font        = `${size}px Share Tech Mono, monospace`;
    ctx.textAlign   = 'center';
    ctx.shadowColor = 'rgba(180,0,0,0.95)';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = `rgba(200,170,170,${alpha})`;
    ctx.fillText(text, x, y);

    if (Math.random() > 0.45) {
      ctx.globalAlpha = alpha * 0.4;
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = 'rgba(255,0,0,0.9)';
      ctx.fillText(text,
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 5
      );
    }
    ctx.restore();
  }

  /* Геометрический символ */
  function drawSymbol(x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(110,0,0,${alpha})`;
    ctx.lineWidth   = 1;
    ctx.shadowColor = 'rgba(160,0,0,0.7)';
    ctx.shadowBlur  = 10;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const px = x + Math.cos(a) * r * 0.9;
      const py = y + Math.sin(a) * r * 0.9;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  /* Глитч-полосы */
  function drawGlitchStripes(alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const n = 3 + Math.floor(Math.random() * 7);
    for (let i = 0; i < n; i++) {
      const sy = Math.random() * (H - 30);
      const sh = 1 + Math.random() * 10;
      const sw = 30 + Math.random() * 220;
      const sx = Math.random() * (W - sw);
      const v  = Math.floor(Math.random() * 45);
      ctx.fillStyle = `rgb(${v + 35},${v},${v})`;
      ctx.fillRect(sx, sy, sw, sh);
    }
    ctx.restore();
  }

  /* Размытое пятно */
  function drawBlob(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, 2, x, y, Math.max(w, h));
    g.addColorStop(0, `rgba(25,0,0,${alpha * 0.75})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Толпа силуэтов */
  function drawCrowd(alpha) {
    const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const x  = 60 + (i / (n - 1)) * (W - 120) + (Math.random() - 0.5) * 25;
      const sc = 0.35 + Math.random() * 0.4;
      drawSilhouette(x, H - 48, alpha * (0.35 + Math.random() * 0.35), sc);
    }
  }

  /* Красная вуаль */
  function drawVeil(zone) {
    const d = Math.abs(zone - 0.5) * 2;
    const a = Math.max(0, 0.16 - d * 0.16);
    if (a < 0.001) return;
    ctx.fillStyle = `rgba(45,0,0,${a})`;
    ctx.fillRect(0, 0, W, H - 28);
  }

  /* Мигающая рамка */
  function drawBorderFlash(alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(130,0,0,${alpha})`;
    ctx.lineWidth   = 4;
    ctx.shadowColor = 'rgba(180,0,0,0.8)';
    ctx.shadowBlur  = 15;
    ctx.strokeRect(2, 2, W - 4, H - 32);
    ctx.restore();
  }

  /* Горизонтальные помехи-блоки по всей высоте */
  function drawHorizontalTear(alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const y  = Math.random() * (H - 30);
    const sh = 1 + Math.random() * 4;
    ctx.fillStyle = `rgba(${20 + Math.floor(Math.random()*40)},0,0,0.6)`;
    ctx.fillRect(0, y, W, sh);
    // смещение контента выше
    const srcY  = Math.max(0, y - 30);
    const srcH  = Math.min(30, y);
    if (srcH > 0) {
      try {
        const snap = ctx.getImageData(0, srcY, W, srcH);
        ctx.putImageData(snap, (Math.random() - 0.5) * 12, srcY);
      } catch(e) {}
    }
    ctx.restore();
  }

  /* ==============================
     "A WARM PLACE" — спецсобытие
     Краткий момент тишины → обрыв
     ============================== */
  function triggerWarmPlace() {
    if (state.warmPlace) return;
    state.warmPlace = true;
    state.warmTick  = state.tick;
    state.warmParticles = [];

    // Частицы дрейфуют вверх
    for (let i = 0; i < 35; i++) {
      state.warmParticles.push({
        x:     20 + Math.random() * (W - 40),
        y:     (H - 28) * (0.5 + Math.random() * 0.5),
        vy:    -(0.3 + Math.random() * 0.5),
        r:     1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5,
        life:  180 + Math.random() * 80,
      });
    }
  }

  function renderWarmPlace() {
    const age      = state.tick - state.warmTick;
    const maxAge   = 240;
    const collapse = 190; // тик обрыва

    if (age > maxAge + 30) {
      state.warmPlace     = false;
      state.warmParticles = [];
      return;
    }

    if (age < collapse) {
      // Тихая тьма
      ctx.fillStyle = `rgba(5,2,2,${Math.min(0.92, age / 40)})`;
      ctx.fillRect(0, 0, W, H - 28);

      // Частицы
      state.warmParticles.forEach(p => {
        p.y    += p.vy;
        p.alpha -= 0.001;
        if (p.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = p.alpha * Math.min(1, age / 30);
        ctx.fillStyle   = `rgba(200,170,140,1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Надпись
      const textAlpha = Math.min(1, Math.max(0, (age - 30) / 40)) *
                        Math.min(1, (collapse - age) / 30);
      if (textAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = textAlpha * 0.6;
        ctx.font        = '14px Share Tech Mono, monospace';
        ctx.textAlign   = 'center';
        ctx.fillStyle   = 'rgba(200,185,165,1)';
        ctx.shadowColor = 'rgba(180,130,80,0.5)';
        ctx.shadowBlur  = 20;
        ctx.fillText('a warm place', W / 2, (H - 28) / 2);
        ctx.restore();
      }
    } else {
      // Обрыв: красная вспышка + хаос
      const collapseAge = age - collapse;
      const flashA      = Math.max(0, 0.6 - collapseAge * 0.03);
      ctx.fillStyle     = `rgba(80,0,0,${flashA})`;
      ctx.fillRect(0, 0, W, H - 28);
      drawGlitchStripes(0.5);
      if (collapseAge < 3) drawBorderFlash(0.8);
    }
  }

  /* ==============================
     СИСТЕМА СОБЫТИЙ
     ============================== */
  function trySpawn(zone) {
    if (state.warmPlace) return;
    if (state.tick - state.lastSpawn < state.spawnCooldown) return;

    // "A Warm Place": зона 0.47–0.53, редко
    if (zone > 0.47 && zone < 0.53 && Math.random() > 0.997) {
      triggerWarmPlace();
      return;
    }

    const edgeDist = zone < 0.5 ? (0.5 - zone) * 2 : (zone - 0.5) * 2;
    const chance   = edgeDist * 0.2 + 0.015;
    if (Math.random() > chance) return;

    const ev = { born: state.tick, alpha: 0 };

    if (zone < 0.15) {
      ev.type    = 'scan';
      ev.y       = Math.random() * (H - 50);
      ev.maxLife = 25;
    } else if (zone < 0.3) {
      ev.type    = 'blob';
      ev.x       = 50 + Math.random() * (W - 100);
      ev.y       = 40 + Math.random() * (H - 80);
      ev.w       = 30 + Math.random() * 65;
      ev.h       = 20 + Math.random() * 45;
      ev.maxLife = 85;
    } else if (zone < 0.45) {
      ev.type    = Math.random() > 0.4 ? 'text' : 'glitch';
      ev.text    = pickText(zone);
      ev.x       = 80 + Math.random() * (W - 160);
      ev.y       = 55 + Math.random() * (H - 110);
      ev.maxLife = 110;
    } else if (zone < 0.58) {
      const r    = Math.random();
      if      (r < 0.3)  { ev.type = 'silhouette'; ev.x = 70 + Math.random() * (W - 140); ev.y = H - 52; ev.scale = 0.7 + Math.random() * 0.5; }
      else if (r < 0.55) { ev.type = 'scream'; }
      else if (r < 0.8)  { ev.type = 'text'; ev.text = pickText(zone); ev.x = W / 2 + (Math.random()-0.5)*180; ev.y = 60 + Math.random()*(H-120); }
      else               { ev.type = 'crowd'; }
      ev.maxLife = 130;
    } else if (zone < 0.78) {
      const r = Math.random();
      if      (r < 0.35) { ev.type = 'eyes'; }
      else if (r < 0.6)  { ev.type = 'symbol'; ev.x = 55 + Math.random()*(W-110); ev.y = 45 + Math.random()*(H-90); ev.r = 18 + Math.random()*22; }
      else if (r < 0.8)  { ev.type = 'hands'; }
      else               { ev.type = 'text'; ev.text = pickText(zone); ev.x = 70 + Math.random()*(W-140); ev.y = 55 + Math.random()*(H-110); }
      ev.maxLife = 115;
    } else {
      // Хаос
      const types = ['scream', 'eyes', 'hands', 'text', 'glitch', 'symbol', 'crowd', 'silhouette'];
      ev.type    = types[Math.floor(Math.random() * types.length)];
      ev.x       = 50 + Math.random() * (W - 100);
      ev.y       = ev.type === 'silhouette' || ev.type === 'hands' ? H - 50 : 40 + Math.random()*(H-80);
      ev.scale   = 0.5 + Math.random() * 0.8;
      ev.text    = pickText(zone);
      ev.r       = 14 + Math.random() * 28;
      ev.maxLife = 70;
    }

    state.events.push(ev);
    state.lastSpawn   = state.tick;
    state.spawnCooldown = zone > 0.8 ? 20 : 52;
  }

  function renderEvents() {
    const dead = [];

    state.events.forEach((ev, idx) => {
      const age = state.tick - ev.born;
      const t   = age / ev.maxLife;
      if (t >= 1) { dead.push(idx); return; }

      if      (t < 0.18) ev.alpha = t / 0.18;
      else if (t > 0.75) ev.alpha = (1 - t) / 0.25;
      else               ev.alpha = 1;

      const a = ev.alpha;

      switch (ev.type) {
        case 'scan':
          ctx.save();
          ctx.globalAlpha = a * 0.3;
          ctx.fillStyle   = 'rgba(255,255,255,0.06)';
          ctx.fillRect(0, ev.y + age * 1.5, W, 2);
          ctx.restore();
          break;
        case 'blob':
          drawBlob(ev.x, ev.y, ev.w, ev.h, a * 0.65);
          break;
        case 'text':
          drawCrypticText(ev.text, ev.x, ev.y, a * 0.88);
          break;
        case 'glitch':
          drawGlitchStripes(a);
          break;
        case 'silhouette':
          drawSilhouette(ev.x, ev.y, a * 0.72, ev.scale || 1);
          break;
        case 'scream':
          drawScreamFace(a);
          break;
        case 'eyes':
          drawEyesInDark(a * 0.88);
          break;
        case 'symbol':
          drawSymbol(ev.x, ev.y, ev.r + Math.sin(age * 0.06) * 3, a * 0.75);
          break;
        case 'crowd':
          drawCrowd(a * 0.6);
          break;
        case 'hands':
          drawHands(a);
          break;
      }
    });

    for (let i = dead.length - 1; i >= 0; i--) {
      state.events.splice(dead[i], 1);
    }
  }

  /* ==============================
     ИГРОВОЙ ЦИКЛ
     ============================== */
  function loop() {
    state.tick++;
    state.frequency += (state.targetFreq - state.frequency) * 0.08;

    const zone      = state.frequency / 100;
    const edgeDist  = Math.abs(zone - 0.5) * 2;
    const noise     = 0.25 + edgeDist * 0.42 + Math.random() * 0.07;
    // Красноватый оттенок при высокой частоте
    const redTint   = Math.max(0, zone - 0.7) * 3;

    drawNoise(noise, redTint);

    if (state.warmPlace) {
      renderWarmPlace();
    } else {
      drawVeil(zone);

      // Горизонтальные разрывы — только в зоне хаоса
      if (zone > 0.82 && Math.random() > 0.88) {
        drawHorizontalTear(0.6 + Math.random() * 0.4);
      }

      // Мигающая рамка
      if (zone > 0.72 && Math.random() > 0.9) {
        drawBorderFlash(Math.random() * 0.55 + 0.1);
      }

      // Постоянные глитч-полосы в зоне хаоса
      if (zone > 0.87 && Math.random() > 0.78) {
        drawGlitchStripes(0.3 + Math.random() * 0.35);
      }

      // Тряска канваса — только в предельной зоне
      if (zone > 0.93 && Math.random() > 0.95) {
        const dx = (Math.random() - 0.5) * 10;
        const dy = (Math.random() - 0.5) * 5;
        canvas.style.transform = `translate(${dx}px,${dy}px)`;
        setTimeout(() => { canvas.style.transform = ''; }, 60);
      }

      trySpawn(zone);
      renderEvents();
    }

    // Частота
    const freqLabel = `${Math.round(state.frequency).toString().padStart(3,'0')}.${Math.floor(Math.random()*10)} MHz`;
    drawFrequencyBar(freqLabel);

    requestAnimationFrame(loop);
  }

  loop();
}
