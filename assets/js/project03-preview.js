(function () {
  'use strict';

  // ── Noise (те же алгоритмы что в noise_cli.py) ──────────────────────────────

  function hash2(ix, iy, seed) {
    let h = ((seed ^ Math.imul(ix, 374761393)) ^ Math.imul(iy, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
  }

  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function valueNoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const ux = smooth(x - ix), uy = smooth(y - iy);
    return lerp(
      lerp(hash2(ix,   iy,   seed), hash2(ix+1, iy,   seed), ux),
      lerp(hash2(ix,   iy+1, seed), hash2(ix+1, iy+1, seed), ux),
      uy
    );
  }

  function fbm(x, y, oct, seed) {
    let v = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < oct; i++) {
      v   += valueNoise(x * freq, y * freq, (seed + i * 127) & 0xFFFF) * amp;
      max += amp; amp *= 0.5; freq *= 2;
    }
    return v / max;
  }

  // ── Canvas preview ────────────────────────────────────────────────────────────

  const canvas = document.getElementById('preview-canvas');
  const ctx    = canvas.getContext('2d');
  let   seed   = Math.floor(Math.random() * 9999);
  let   raf    = null;
  let   frame  = 0;

  // Green phosphor palette (0..1 → rgb)
  function greenPhosphor(v) {
    const bright = Math.pow(v, 1.4);
    return `rgb(0, ${Math.floor(bright * 200)}, ${Math.floor(bright * 15)})`;
  }

  function drawFrame() {
    canvas.width  = canvas.offsetWidth  || 320;
    canvas.height = canvas.offsetHeight || 240;
    const w = canvas.width, h = canvas.height;
    const cell = 4;
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    const t    = frame * 0.008;

    ctx.fillStyle = '#020402';
    ctx.fillRect(0, 0, w, h);

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const x = (gx / cols) * 4 + t;
        const y = (gy / rows) * 4;
        const v = Math.max(0, Math.min(1, fbm(x, y, 4, seed)));
        ctx.fillStyle = greenPhosphor(v);
        ctx.fillRect(gx * cell, gy * cell, cell - 1, cell - 1);
      }
    }

    frame++;
    raf = requestAnimationFrame(drawFrame);
  }

  // Start when visible
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!raf) drawFrame();
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });
  observer.observe(canvas);

  // ── Palettes showcase ─────────────────────────────────────────────────────────

  const PALETTES = {
    void:   ' ░▒▓█',
    binary: '  01 ',
    dots:   ' .·:;#',
    matrix: ' .-+*#@',
    block:  ' ▁▂▃▄▅▆▇█',
    blood:  ' .+*#▓█',
    ascii:  ' .,`-~:;=!*#$@',
    safe:   ' .:+*#@',
  };

  const grid = document.getElementById('palettes-grid');
  if (grid) {
    Object.entries(PALETTES).forEach(([name, chars]) => {
      const sample = chars.repeat(8).slice(0, 48);
      const row = document.createElement('div');
      row.className = 'palette-row';
      row.innerHTML =
        `<span class="palette-name">${name}</span>` +
        `<span class="palette-sample">${sample}</span>`;
      grid.appendChild(row);
    });
  }

  // ── Cursor ────────────────────────────────────────────────────────────────────

  const $cur   = document.getElementById('cursor');
  const $trail = document.getElementById('cursor-trail');
  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    $cur.style.left = mx + 'px';
    $cur.style.top  = my + 'px';
  });

  (function animTrail() {
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;
    $trail.style.left = tx + 'px';
    $trail.style.top  = ty + 'px';
    requestAnimationFrame(animTrail);
  })();

  document.addEventListener('mouseleave', () => {
    $cur.style.opacity = '0'; $trail.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    $cur.style.opacity = '1'; $trail.style.opacity = '1';
  });

})();
