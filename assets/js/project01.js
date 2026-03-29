(() => {
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d', { willReadFrequently: true });
  const wrap    = document.getElementById('canvas-wrap');
  const overlay = document.getElementById('upload-overlay');
  const fileInput = document.getElementById('file-input');
  const cursorEl  = document.getElementById('cursor');
  const trailEl   = document.getElementById('cursor-trail');
  const whisperEl = document.getElementById('whisper');
  const coordsEl  = document.getElementById('coords');
  const statusEl  = document.getElementById('status-bar');
  const flashEl   = document.getElementById('error-flash');
  const eyeEl     = document.getElementById('eye-container');
  const pupilEl   = document.getElementById('pupil');
  const pupilHL   = document.getElementById('pupil-highlight');

  let sourceData = null;
  let W = 0, H = 0;
  let mouse = { x: 0.5, y: 0.5, down: false, px: 0, py: 0 };
  let frozen = false;
  let animId  = null;
  let paintMask = null;
  let frame = 0;
  let eyeVisible = false;
  let lastMoveTime = Date.now();

  // Sliders
  const sliders = {
    rgb:   document.getElementById('sl-rgb'),
    shift: document.getElementById('sl-shift'),
    noise: document.getElementById('sl-noise'),
    block: document.getElementById('sl-block'),
  };
  const vals = {
    rgb:   document.getElementById('val-rgb'),
    shift: document.getElementById('val-shift'),
    noise: document.getElementById('val-noise'),
    block: document.getElementById('val-block'),
  };

  Object.keys(sliders).forEach(k => {
    sliders[k].addEventListener('input', () => { vals[k].textContent = sliders[k].value; });
  });

  const modeSelect = document.getElementById('mouse-mode');
  const btnFreeze  = document.getElementById('btn-freeze');
  const btnReset   = document.getElementById('btn-reset');
  const btnSave    = document.getElementById('btn-save');

  // ── Custom cursor ──────────────────────────────────
  document.addEventListener('mousemove', e => {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top  = e.clientY + 'px';
    trailEl.style.left  = e.clientX + 'px';
    trailEl.style.top   = e.clientY + 'px';

    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    mouse.px = mouse.x; mouse.py = mouse.y;
    mouse.x  = nx; mouse.y = ny;
    coordsEl.textContent = `X:${String(e.clientX).padStart(3,'0')} Y:${String(e.clientY).padStart(3,'0')}`;
    lastMoveTime = Date.now();

    // Eye tracking
    if (eyeVisible) {
      const ex = 60 + (nx - 0.5) * 16;
      const ey = 30 + (ny - 0.5) * 10;
      pupilEl.setAttribute('cx', ex);
      pupilEl.setAttribute('cy', ey);
      pupilHL.setAttribute('cx', ex);
      pupilHL.setAttribute('cy', ey);
    }
  });

  document.addEventListener('mousedown', () => { mouse.down = true; });
  document.addEventListener('mouseup',   () => { mouse.down = false; });

  // ── Whisper messages ───────────────────────────────
  const whispers = [
    'ОНО ЗНАЕТ ГДЕ ТЫ',
    'НЕ СМОТРИ НА ЭКРАН',
    'MOVE YOUR MOUSE',
    'ТЫ НЕ ОДИН',
    'ЭТО ВИДИТ ТЕБЯ',
    'ERROR_7734_MEMORY_CORRUPT',
    'DO NOT BLINK',
    'ВСЁ ЭТО НЕНАСТОЯЩЕЕ',
    'SOMETHING IS BEHIND YOU',
    'ПРОЦЕСС НЕ МОЖЕТ БЫТЬ ОСТАНОВЛЕН',
    '01100111 01101100 01101001 01110100 01100011 01101000',
    'WHY ARE YOU STILL HERE',
    'СИГНАЛ ПОТЕРЯН',
    'IT FOUND YOU',
  ];
  const statuses = [
    'SYSTEM READY',
    'MEMORY LEAK DETECTED',
    'PROCESS 7734 RUNNING',
    'SIGNAL LOST',
    'WATCHING...',
    'DO NOT TURN OFF',
    'READING INPUT...',
    'ERROR — CONTINUE ANYWAY',
  ];

  let whisperIdx = 0;
  function cycleWhisper() {
    whisperEl.style.opacity = '0';
    setTimeout(() => {
      whisperIdx = (whisperIdx + Math.floor(Math.random() * 3 + 1)) % whispers.length;
      whisperEl.textContent = whispers[whisperIdx];
      whisperEl.style.opacity = '1';
    }, 1200);
  }
  setInterval(cycleWhisper, 5000);

  let statusIdx = 0;
  setInterval(() => {
    statusIdx = (statusIdx + 1) % statuses.length;
    statusEl.textContent = statuses[statusIdx];
  }, 3800);

  // ── Title corruption ───────────────────────────────
  const titleEl = document.getElementById('title-text');
  const titleBase = 'GLITCH';
  const corruptChars = '▓█▒░▄▌▐╬╫╪╩╦╠═╔░▒▓@#$%&';

  function corruptTitle() {
    if (Math.random() > 0.3) return;
    let out = '';
    for (let i = 0; i < titleBase.length; i++) {
      out += Math.random() > 0.5
        ? corruptChars[Math.floor(Math.random() * corruptChars.length)]
        : titleBase[i];
    }
    titleEl.textContent = out;
    setTimeout(() => { titleEl.textContent = titleBase; }, 80 + Math.random() * 120);
  }
  setInterval(corruptTitle, 2200);

  // ── Error flash ────────────────────────────────────
  function doFlash() {
    if (Math.random() > 0.6) return;
    flashEl.style.opacity = '1';
    flashEl.style.background = Math.random() > 0.5
      ? 'radial-gradient(ellipse at center, #3a000033 0%, transparent 70%)'
      : 'radial-gradient(ellipse at center, #00001a22 0%, transparent 70%)';
    setTimeout(() => { flashEl.style.opacity = '0'; }, 60 + Math.random() * 100);
  }
  setInterval(doFlash, 3000);

  // ── Eye: appears when idle ─────────────────────────
  setInterval(() => {
    const idle = (Date.now() - lastMoveTime) / 1000;
    if (idle > 6 && !eyeVisible) {
      eyeVisible = true;
      eyeEl.style.opacity = '1';
    } else if (idle < 2 && eyeVisible) {
      eyeVisible = false;
      eyeEl.style.opacity = '0';
    }
  }, 500);

  // ── Upload ─────────────────────────────────────────
  function openFile() { fileInput.click(); }
  document.getElementById('upload-btn').addEventListener('click', openFile);
  document.getElementById('upload-btn-toolbar').addEventListener('click', openFile);

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { loadImage(img); URL.revokeObjectURL(url); };
    img.src = url;
  });

  document.getElementById('gen-btn').addEventListener('click', generatePattern);
  document.getElementById('gen-pattern').addEventListener('click', generatePattern);

  function loadImage(img) {
    overlay.style.display = 'none';
    const maxW = wrap.clientWidth  || 900;
    const maxH = wrap.clientHeight || 600;
    const scale = Math.min(1, maxW / img.width, maxH / img.height);
    W = Math.floor(img.width  * scale);
    H = Math.floor(img.height * scale);
    canvas.width  = W;
    canvas.height = H;
    ctx.drawImage(img, 0, 0, W, H);
    sourceData = ctx.getImageData(0, 0, W, H);
    paintMask  = new Float32Array(W * H);
    startLoop();
  }

  function generatePattern() {
    overlay.style.display = 'none';
    W = Math.min(wrap.clientWidth  || 900, 880);
    H = Math.min(wrap.clientHeight || 580, 560);
    canvas.width  = W;
    canvas.height = H;

    const id = ctx.createImageData(W, H);
    const d  = id.data;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i  = (y * W + x) * 4;
        const nx = x / W, ny = y / H;

        const v1 = Math.sin(nx * 14 + ny * 9)   * 0.5 + 0.5;
        const v2 = Math.cos(nx * 8  - ny * 15)  * 0.5 + 0.5;
        const v3 = Math.sin((nx + ny) * 22)     * 0.5 + 0.5;
        const stripe = Math.sin(y * 0.25)       * 0.5 + 0.5;
        const diag   = ((x + y) % 80) / 80;

        d[i]   = Math.floor((v1 * 80  + diag  * 30)) & 0xff;
        d[i+1] = Math.floor((v2 * 30  + stripe * 15)) & 0xff;
        d[i+2] = Math.floor((v3 * 20  + 5))           & 0xff;
        d[i+3] = 255;

        if (v1 * v2 > 0.7) {
          d[i]   = Math.floor(v1 * 140);
          d[i+1] = Math.floor(v2 * 90);
          d[i+2] = Math.floor(v3 * 40);
        }
      }
    }

    ctx.putImageData(id, 0, 0);
    sourceData = id;
    paintMask  = new Float32Array(W * H);
    startLoop();
  }

  // ── Loop ───────────────────────────────────────────
  function startLoop() {
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function loop() {
    if (!frozen) render();
    animId = requestAnimationFrame(loop);
    frame++;
  }

  // ── Render ─────────────────────────────────────────
  function render() {
    if (!sourceData) return;

    const mode = modeSelect.value;
    let rgbAmt   = sliders.rgb.value   / 100;
    let shiftAmt = sliders.shift.value / 100;
    let noiseAmt = sliders.noise.value / 100;
    let blockAmt = sliders.block.value / 100;

    if (mode === 'intensity') {
      const t = mouse.x;
      const s = 1 - mouse.y;
      rgbAmt   *= Math.min(t * s * 2.2, 1);
      shiftAmt *= Math.min(t * s * 2.2, 1);
      noiseAmt *= Math.min(t * s * 2.2, 1);
      blockAmt *= Math.min(t * s * 2.2, 1);
    } else if (mode === 'rgb') {
      rgbAmt   = mouse.x * 1.8;
      shiftAmt = mouse.y * 1.8;
    } else if (mode === 'warp') {
      const t = frame / 60;
      rgbAmt   = (Math.sin(t * 7.3 + mouse.x * Math.PI) * 0.5 + 0.5);
      shiftAmt = (Math.cos(t * 3.1 + mouse.y * Math.PI) * 0.5 + 0.5);
      noiseAmt = mouse.x * 0.9;
      blockAmt = mouse.y * 0.9;
    }

    const t = frame / 60;
    const flicker = (Math.sin(t * 7.3) * 0.5 + 0.5) * (Math.sin(t * 13.1) * 0.5 + 0.5);

    const src = sourceData.data;
    const out = ctx.createImageData(W, H);
    const dst = out.data;

    const rowShifts = new Int32Array(H);
    const rowActive = new Uint8Array(H);
    const shiftMag  = Math.floor(shiftAmt * W * 0.18 * (0.4 + flicker));

    for (let y = 0; y < H; y++) {
      const n = Math.sin(y * 0.31 + t * 2.7) * Math.cos(y * 0.17 - t * 1.9);
      if (Math.abs(n) > (1 - shiftAmt * 0.85)) {
        rowShifts[y] = Math.floor(n * shiftMag);
        rowActive[y] = 1;
      }
    }

    const blocks = [];
    const numBlocks = Math.floor(blockAmt * 10 * (0.3 + flicker));
    for (let b = 0; b < numBlocks; b++) {
      const bh = 2 + Math.floor(pr(b + Math.floor(t * 3), 0) * H * 0.14);
      const by = Math.floor(pr(b + Math.floor(t * 3), 1) * (H - bh));
      const bx = Math.floor(pr(b + Math.floor(t * 3), 2) * W * 0.55);
      blocks.push({ y: by, h: bh, x: bx });
    }

    const rgbOff = Math.floor(rgbAmt * W * 0.05 * (0.4 + flicker * 2.5));

    for (let y = 0; y < H; y++) {
      let shift = rowActive[y] ? rowShifts[y] : 0;
      for (const bl of blocks) {
        if (y >= bl.y && y < bl.y + bl.h) { shift += bl.x; break; }
      }

      for (let x = 0; x < W; x++) {
        const o   = (y * W + x) * 4;
        const gx  = clamp(x + shift, 0, W - 1);
        const rx  = clamp(x + shift + rgbOff, 0, W - 1);
        const bx2 = clamp(x + shift - rgbOff, 0, W - 1);

        const oi  = (y * W + gx)  * 4;
        const oir = (y * W + rx)  * 4;
        const oib = (y * W + bx2) * 4;

        dst[o]   = src[oir];
        dst[o+1] = src[oi+1];
        dst[o+2] = src[oib+2];
        dst[o+3] = 255;

        if (paintMask) {
          const pm = paintMask[y * W + x];
          if (pm > 0) {
            const extra = Math.floor(pm * rgbOff * 4);
            dst[o]   = src[(y * W + clamp(x + shift + extra, 0, W-1)) * 4];
            dst[o+2] = src[(y * W + clamp(x + shift - extra, 0, W-1)) * 4 + 2];
          }
        }

        if (noiseAmt > 0) {
          const nv = pr(x + y * W + Math.floor(t * 30), 3);
          if (nv < noiseAmt * 0.18) {
            const bright = Math.floor(nv * 6666) & 1 ? 180 : 0;
            dst[o]   = bright;
            dst[o+1] = 0;
            dst[o+2] = Math.floor(bright * 0.1);
          }
        }

        if (y % 2 === 0) {
          dst[o]   = Math.floor(dst[o]   * 0.85);
          dst[o+1] = Math.floor(dst[o+1] * 0.85);
          dst[o+2] = Math.floor(dst[o+2] * 0.85);
        }

        const edgeDark = 1 - Math.pow(Math.max(0, (2 * Math.abs(x/W - 0.5) - 0.3)), 2) * 0.5;
        dst[o]   = Math.floor(dst[o]   * edgeDark);
        dst[o+1] = Math.floor(dst[o+1] * edgeDark);
        dst[o+2] = Math.floor(dst[o+2] * edgeDark);
      }
    }

    const numInv = Math.floor(blockAmt * 4 * flicker);
    for (let b = 0; b < numInv; b++) {
      const iy = Math.floor(pr(b + Math.floor(t * 5) * 7, 4) * H);
      const ih = 1 + Math.floor(pr(b + Math.floor(t * 5) * 7, 5) * 6);
      for (let row = iy; row < Math.min(iy + ih, H); row++) {
        for (let col = 0; col < W; col++) {
          const o = (row * W + col) * 4;
          dst[o]   = 255 - dst[o];
          dst[o+1] = 255 - dst[o+1];
          dst[o+2] = 255 - dst[o+2];
        }
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const o  = (y * W + x) * 4;
        const dx = (x / W - 0.5) * 2;
        const dy = (y / H - 0.5) * 2;
        const v  = Math.pow(dx*dx + dy*dy, 1.5) * 0.6;
        dst[o]   = Math.max(0, Math.floor(dst[o]   * (1 - v)));
        dst[o+1] = Math.max(0, Math.floor(dst[o+1] * (1 - v)));
        dst[o+2] = Math.max(0, Math.floor(dst[o+2] * (1 - v)));
      }
    }

    ctx.putImageData(out, 0, 0);
  }

  // ── Helpers ───────────────────────────────────────
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function pr(seed, salt) {
    let x = Math.sin(seed * 9301 + salt * 49297 + 233) * 46836;
    return x - Math.floor(x);
  }

  // ── Canvas mouse ──────────────────────────────────
  canvas.addEventListener('mousemove', e => {
    if (mouse.down && modeSelect.value === 'paint' && paintMask) {
      const r  = canvas.getBoundingClientRect();
      const px = Math.floor((e.clientX - r.left)  / r.width  * W);
      const py = Math.floor((e.clientY - r.top)   / r.height * H);
      const R  = 28;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > R) continue;
          const cx = clamp(px + dx, 0, W-1);
          const cy = clamp(py + dy, 0, H-1);
          paintMask[cy * W + cx] = Math.min(1, paintMask[cy*W+cx] + (1 - dist/R) * 0.12);
        }
      }
    }
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -2 : 2;
    Object.keys(sliders).forEach(k => {
      sliders[k].value = clamp(parseInt(sliders[k].value) + d, 0, 100);
      vals[k].textContent = sliders[k].value;
    });
  }, { passive: false });

  // ── Buttons ───────────────────────────────────────
  btnFreeze.addEventListener('click', () => {
    frozen = !frozen;
    btnFreeze.classList.toggle('active', frozen);
    btnFreeze.textContent = frozen ? 'UNFREEZE' : 'FREEZE';
  });

  btnReset.addEventListener('click', () => {
    if (paintMask) paintMask.fill(0);
  });

  btnSave.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `glitch_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  wrap.addEventListener('dragover', e => e.preventDefault());
  wrap.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { loadImage(img); URL.revokeObjectURL(url); };
    img.src = url;
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'f' || e.key === 'F') btnFreeze.click();
    if (e.key === 'r' || e.key === 'R') btnReset.click();
    if (e.key === 's' || e.key === 'S') btnSave.click();
  });
})();
