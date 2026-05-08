(function () {
  'use strict';

  // ── Math / PRNG ────────────────────────────────────────────────────────────

  function hash2(ix, iy, seed) {
    let h = ((seed ^ Math.imul(ix, 374761393)) ^ Math.imul(iy, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
  }

  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function valueNoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const ux = smoothstep(x - ix), uy = smoothstep(y - iy);
    return lerp(
      lerp(hash2(ix,   iy,   seed), hash2(ix+1, iy,   seed), ux),
      lerp(hash2(ix,   iy+1, seed), hash2(ix+1, iy+1, seed), ux),
      uy
    );
  }

  function fbm(x, y, octaves, seed) {
    let v = 0, amp = 0.5, freq = 1, maxV = 0;
    for (let i = 0; i < octaves; i++) {
      v    += valueNoise(x * freq, y * freq, seed + i * 127) * amp;
      maxV += amp;
      amp  *= 0.5;
      freq *= 2.0;
    }
    return v / maxV;
  }

  function cellularNoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    let d1 = 9;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const cx = ix + dx, cy = iy + dy;
        const px = cx + hash2(cx, cy, seed);
        const py = cy + hash2(cx, cy, seed ^ 0xDEAD);
        const dist = Math.hypot(x - px, y - py);
        if (dist < d1) d1 = dist;
      }
    }
    return Math.min(d1, 1);
  }

  function domainWarp(x, y, seed) {
    const qx = fbm(x,       y,       4, seed);
    const qy = fbm(x + 5.2, y + 1.3, 4, seed);
    return fbm(x + 4 * qx, y + 4 * qy, 4, seed + 100);
  }

  // ── Palettes ───────────────────────────────────────────────────────────────

  const PALETTES = {
    void:   [' ', '░', '▒', '▓', '█'],
    binary: [' ', ' ', '0', '1', '1'],
    dots:   [' ', '.', ':', ';', '#'],
    matrix: [' ', '.', '-', '+', '*', '#', '@'],
    block:  [' ', '▁', '▃', '▅', '▇', '█'],
    blood:  [' ', '.', '+', '*', '#', '▓', '█'],
    ascii:  [' ', '.', ',', '-', '~', ':', '=', '!', '*', '#', '$', '@'],
  };

  function valToClass(v) {
    if (v < 0.2) return 'n0';
    if (v < 0.4) return 'n1';
    if (v < 0.6) return 'n2';
    if (v < 0.8) return 'n3';
    return 'n4';
  }

  // ── State ──────────────────────────────────────────────────────────────────

  const state = {
    seed:      Math.floor(Math.random() * 99999),
    type:      'perlin',
    palette:   'void',
    cols:      72,
    rows:      28,
    scale:     4,
    lastGrid:  null,
    animating: false,
    animTimer: null,
    animSpeed: 80,
  };

  const TYPES = ['perlin', 'white', 'smooth', 'fractal', 'cellular', 'warp'];
  const PAL_NAMES = Object.keys(PALETTES);

  // ── Noise compute ──────────────────────────────────────────────────────────

  function computeGrid(type, cols, rows, scale, seed) {
    const grid = [];
    for (let y = 0; y < rows; y++) {
      const row = new Float32Array(cols);
      for (let x = 0; x < cols; x++) {
        const nx = (x / cols) * scale;
        const ny = (y / rows) * scale;
        let v;
        switch (type) {
          case 'white':    v = hash2(x, y, seed); break;
          case 'smooth':   v = valueNoise(nx, ny, seed); break;
          case 'fractal':  v = fbm(nx, ny, 6, seed); break;
          case 'cellular': v = 1 - cellularNoise(nx * 2, ny * 2, seed); break;
          case 'warp':     v = domainWarp(nx, ny, seed); break;
          default:         v = fbm(nx, ny, 4, seed); // perlin-like
        }
        row[x] = Math.max(0, Math.min(1, v));
      }
      grid.push(row);
    }
    return grid;
  }

  function gridToHTML(grid, palette) {
    const chars = PALETTES[palette] || PALETTES.void;
    let html = '';
    for (const row of grid) {
      for (const v of row) {
        const idx = Math.min(Math.floor(v * chars.length), chars.length - 1);
        const ch = chars[idx] === ' ' ? ' ' : chars[idx];
        html += '<span class="' + valToClass(v) + '">' + ch + '</span>';
      }
      html += '\n';
    }
    return html;
  }

  function gridToText(grid, palette) {
    const chars = PALETTES[palette] || PALETTES.void;
    return grid.map(row =>
      Array.from(row).map(v => {
        const idx = Math.min(Math.floor(v * chars.length), chars.length - 1);
        return chars[idx];
      }).join('')
    ).join('\n');
  }

  // ── DOM refs ───────────────────────────────────────────────────────────────

  const $output      = document.getElementById('output');
  const $cmdInput    = document.getElementById('cmd-input');
  const $inputDisp   = document.getElementById('input-display');
  const $stSeed      = document.getElementById('st-seed');
  const $stType      = document.getElementById('st-type');
  const $stPal       = document.getElementById('st-pal');
  const $stSize      = document.getElementById('st-size');
  const $stAnim      = document.getElementById('st-anim');

  // ── Terminal output ────────────────────────────────────────────────────────

  function print(html) {
    const div = document.createElement('div');
    div.className = 'out-line';
    div.innerHTML = html;
    $output.appendChild(div);
    $output.scrollTop = $output.scrollHeight;
  }

  function printText(text, cls) {
    const div = document.createElement('div');
    div.className = 'out-line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    $output.appendChild(div);
    $output.scrollTop = $output.scrollHeight;
  }

  function printNoise(grid, palette) {
    const pre = document.createElement('pre');
    pre.className = 'noise-pre';
    pre.innerHTML = gridToHTML(grid, palette);
    $output.appendChild(pre);
    $output.scrollTop = $output.scrollHeight;
    return pre;
  }

  let $lastPre = null;

  function printNoiseUpdate(grid, palette) {
    if ($lastPre && $lastPre.parentNode === $output) {
      $lastPre.innerHTML = gridToHTML(grid, palette);
    } else {
      $lastPre = printNoise(grid, palette);
    }
    $output.scrollTop = $output.scrollHeight;
  }

  function updateStatus() {
    $stSeed.textContent  = 'seed: ' + state.seed;
    $stType.textContent  = 'type: ' + state.type;
    $stPal.textContent   = 'palette: ' + state.palette;
    $stSize.textContent  = 'size: ' + state.cols + '×' + state.rows;
    $stAnim.textContent  = state.animating ? '[ animating ]' : '';
  }

  // ── Commands ───────────────────────────────────────────────────────────────

  const HELP_HTML = [
    '<span class="c-dim">┌──────────────────────────────────────────────────────┐</span>',
    '<span class="c-dim">│</span>  <span class="c-bright">NOISE CLI</span> v1.0 — генератор шумовых ASCII-текстур   <span class="c-dim">│</span>',
    '<span class="c-dim">└──────────────────────────────────────────────────────┘</span>',
    '',
    '  <span class="c-cmd">gen</span> <span class="c-arg">[type] [cols] [rows] [scale]</span>',
    '      types: <span class="c-val">perlin</span>  white  smooth  fractal  cellular  warp',
    '      пример: <span class="c-dim">gen fractal 72 28 6</span>',
    '',
    '  <span class="c-cmd">palette</span> <span class="c-arg">[name]</span>',
    '      <span class="c-val">void</span>  binary  dots  matrix  block  blood  ascii',
    '',
    '  <span class="c-cmd">seed</span> <span class="c-arg">[n | random]</span>       пример: <span class="c-dim">seed 1337</span>',
    '  <span class="c-cmd">size</span> <span class="c-arg">[cols] [rows]</span>       пример: <span class="c-dim">size 60 20</span>',
    '  <span class="c-cmd">scale</span> <span class="c-arg">[n]</span>               пример: <span class="c-dim">scale 8</span>',
    '  <span class="c-cmd">animate</span> <span class="c-arg">[on|off] [ms]</span>   пример: <span class="c-dim">animate on 60</span>',
    '  <span class="c-cmd">save</span>                   скачать вывод как .txt',
    '  <span class="c-cmd">clear</span>                  очистить терминал',
    '',
  ].join('\n');

  function cmdGen(args) {
    const type  = TYPES.includes(args[0]) ? args[0] : state.type;
    const cols  = parseInt(args[1])  || state.cols;
    const rows  = parseInt(args[2])  || state.rows;
    const scale = parseFloat(args[3]) || state.scale;

    if (cols < 4 || cols > 200 || rows < 2 || rows > 80) {
      printText('ошибка: cols 4–200, rows 2–80', 'c-err');
      return;
    }

    state.type = type; state.cols = cols;
    state.rows = rows; state.scale = scale;

    const grid = computeGrid(type, cols, rows, scale, state.seed);
    $lastPre = printNoise(grid, state.palette);
    state.lastGrid = grid;
    updateStatus();
  }

  function cmdPalette(args) {
    const name = args[0];
    if (!PAL_NAMES.includes(name)) {
      print('доступные палитры: <span class="c-val">' + PAL_NAMES.join('</span> <span class="c-val">') + '</span>');
      return;
    }
    state.palette = name;
    printText('palette → ' + name, 'c-ok');
    if (state.lastGrid) {
      $lastPre = printNoise(state.lastGrid, name);
    }
    updateStatus();
  }

  function cmdSeed(args) {
    const val = args[0];
    if (!val || val === 'random') {
      state.seed = Math.floor(Math.random() * 99999);
    } else {
      const n = parseInt(val);
      if (isNaN(n)) { printText('ошибка: seed должен быть числом', 'c-err'); return; }
      state.seed = ((n % 99999) + 99999) % 99999;
    }
    printText('seed → ' + state.seed, 'c-ok');
    updateStatus();
  }

  function cmdSize(args) {
    const c = parseInt(args[0]), r = parseInt(args[1]);
    if (!c || !r || c < 4 || c > 200 || r < 2 || r > 80) {
      printText('ошибка: size [cols 4–200] [rows 2–80]', 'c-err');
      return;
    }
    state.cols = c; state.rows = r;
    printText('size → ' + c + '×' + r, 'c-ok');
    updateStatus();
  }

  function cmdScale(args) {
    const n = parseFloat(args[0]);
    if (isNaN(n) || n < 0.5 || n > 32) {
      printText('ошибка: scale 0.5–32', 'c-err');
      return;
    }
    state.scale = n;
    printText('scale → ' + n, 'c-ok');
    updateStatus();
  }

  function stopAnimation() {
    state.animating = false;
    clearTimeout(state.animTimer);
    $stAnim.textContent = '';
    updateStatus();
  }

  function startAnimation(speed) {
    if (state.animating) stopAnimation();
    state.animating = true;
    state.animSpeed = Math.max(16, Math.min(2000, speed || 80));
    printText('анимация запущена. animate off — остановить', 'c-ok');
    updateStatus();

    let s = state.seed;
    function tick() {
      if (!state.animating) return;
      s = (s + 1) % 99999;
      const grid = computeGrid(state.type, state.cols, state.rows, state.scale, s);
      state.lastGrid = grid;
      printNoiseUpdate(grid, state.palette);
      state.animTimer = setTimeout(tick, state.animSpeed);
    }
    tick();
  }

  function cmdAnimate(args) {
    const flag = (args[0] || 'on').toLowerCase();
    if (flag === 'off') {
      stopAnimation();
      printText('анимация остановлена', 'c-dim');
      return;
    }
    if (state.animating) { stopAnimation(); return; }
    startAnimation(parseInt(args[1]) || 80);
  }

  function cmdSave() {
    if (!state.lastGrid) { printText('нет данных. сначала gen', 'c-err'); return; }
    const text = gridToText(state.lastGrid, state.palette);
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: 'noise_' + state.type + '_' + state.seed + '.txt',
    });
    a.click();
    URL.revokeObjectURL(url);
    printText('сохранено: noise_' + state.type + '_' + state.seed + '.txt', 'c-ok');
  }

  function cmdClear() {
    stopAnimation();
    $output.innerHTML = '';
    $lastPre = null;
  }

  const CMDS = {
    gen:     cmdGen,
    palette: cmdPalette,
    seed:    cmdSeed,
    size:    cmdSize,
    scale:   cmdScale,
    animate: cmdAnimate,
    save:    cmdSave,
    clear:   cmdClear,
    help:    () => print(HELP_HTML),
  };

  // ── Input handling ─────────────────────────────────────────────────────────

  const history = [];
  let histIdx   = -1;

  function execute(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    print('<span class="c-prompt">&gt;</span> <span class="c-input">' +
      trimmed.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>');

    history.unshift(trimmed);
    histIdx = -1;

    const parts = trimmed.split(/\s+/);
    const cmd   = parts[0].toLowerCase();
    const fn    = CMDS[cmd];
    if (fn) fn(parts.slice(1));
    else printText('команда не найдена: ' + cmd + '. введи help', 'c-err');
  }

  $cmdInput.addEventListener('input', () => {
    $inputDisp.textContent = $cmdInput.value;
  });

  $cmdInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      execute($cmdInput.value);
      $cmdInput.value = '';
      $inputDisp.textContent = '';
      histIdx = -1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) {
        histIdx++;
        $cmdInput.value = history[histIdx];
        $inputDisp.textContent = history[histIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        $cmdInput.value = history[histIdx];
        $inputDisp.textContent = history[histIdx];
      } else {
        histIdx = -1;
        $cmdInput.value = '';
        $inputDisp.textContent = '';
      }
    }
  });

  // Focus input on any click in the terminal
  document.getElementById('terminal').addEventListener('click', () => $cmdInput.focus());
  document.addEventListener('keydown', () => $cmdInput.focus());

  // Header buttons
  document.getElementById('btn-anim').addEventListener('click', () => cmdAnimate([]));
  document.getElementById('btn-save').addEventListener('click', () => cmdSave());
  document.getElementById('btn-clear').addEventListener('click', () => cmdClear());

  // ── Cursor ─────────────────────────────────────────────────────────────────

  const $cur   = document.getElementById('cursor');
  const $trail = document.getElementById('cursor-trail');
  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    $cur.style.left = mx + 'px';
    $cur.style.top  = my + 'px';
  });

  (function animTrail() {
    tx += (mx - tx) * 0.13;
    ty += (my - ty) * 0.13;
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

  // ── Boot ───────────────────────────────────────────────────────────────────

  function boot() {
    updateStatus();
    $cmdInput.focus();

    const lines = [
      '<span class="c-dim">initializing noise engine...............[ok]</span>',
      '<span class="c-dim">loading palettes: void binary dots matrix block blood ascii</span>',
      '<span class="c-dim">rng seed: ' + state.seed + '</span>',
      '',
      '<span class="c-bright">NOISE CLI</span> <span class="c-mid">v1.0 — ascii noise texture generator</span>',
      '<span class="c-mid">введи <span class="c-cmd">help</span> — список команд</span>',
      '',
    ];

    let i = 0;
    function nextLine() {
      if (i < lines.length) {
        print(lines[i++]);
        setTimeout(nextLine, i < 4 ? 100 : 25);
      } else {
        cmdGen([]);
      }
    }
    nextLine();
  }

  boot();

})();
