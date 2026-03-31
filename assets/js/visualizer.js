/* ============================================
   VOID.WORKS — Sound Visualizer
   project_02: built for a dark, underground venue
   ============================================ */

(function () {
  const canvas      = document.getElementById('viz-canvas');
  const ctx         = canvas.getContext('2d');
  const statusEl    = document.getElementById('viz-status');
  const modeBtnEl   = document.getElementById('viz-mode-btn');
  const demoBtnEl   = document.getElementById('viz-demo-btn');
  const gainSlider  = document.getElementById('viz-gain');
  const modeLabelEl = document.getElementById('viz-mode-label');

  if (!canvas) return;

  /* ── Cursor (standalone page) ── */
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursor-trail');
  if (cursor && trail) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
      trail.style.left  = e.clientX + 'px';
      trail.style.top   = e.clientY + 'px';
    });
  }

  /* ==============================
     STATE
     ============================== */
  let audioCtx  = null;
  let analyser  = null;
  let gainNode  = null;
  let freqData  = null;
  let waveData  = null;
  let running   = false;
  let modeIdx   = 0;
  const MODES   = ['FREQ', 'SCOPE', 'VOID'];

  let W = 0, H = 0;
  let bassLevel = 0;
  let midLevel  = 0;
  let particles = [];
  let peaks     = [];

  let demoNodes = [];

  /* ==============================
     RESIZE
     ============================== */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    peaks = new Array(128).fill(0);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  /* ==============================
     AUDIO
     ============================== */
  function ensureCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function wireAnalyser(source) {
    if (gainNode) gainNode.disconnect();
    if (analyser) analyser.disconnect();

    gainNode = audioCtx.createGain();
    gainNode.gain.value = parseFloat(gainSlider.value);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize               = 2048;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(gainNode);
    gainNode.connect(analyser);

    freqData = new Uint8Array(analyser.frequencyBinCount);
    waveData = new Uint8Array(analyser.fftSize);
  }

  async function startMic() {
    stopDemo();
    ensureCtx();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      wireAnalyser(audioCtx.createMediaStreamSource(stream));
      if (!running) { running = true; requestAnimationFrame(draw); }
      statusEl.textContent = '[ mic — listening_ ]';
    } catch (e) {
      statusEl.textContent = '[ mic denied — try [ demo ] ]';
    }
  }

  function startDemo() {
    stopDemo();
    ensureCtx();

    const sr  = audioCtx.sampleRate;
    const buf = audioCtx.createBuffer(1, sr * 2, sr);
    const ch  = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = buf;
    noise.loop   = true;
    noise.start();

    const nFilter = audioCtx.createBiquadFilter();
    nFilter.type            = 'bandpass';
    nFilter.frequency.value = 90;
    nFilter.Q.value         = 1.5;
    const nGain = audioCtx.createGain();
    nGain.gain.value = 0.35;
    noise.connect(nFilter);
    nFilter.connect(nGain);

    const bass = audioCtx.createOscillator();
    bass.type            = 'sine';
    bass.frequency.value = 55;
    const bassGain = audioCtx.createGain();
    bassGain.gain.value = 0.55;
    bass.connect(bassGain);
    bass.start();

    const lfo = audioCtx.createOscillator();
    lfo.type            = 'sine';
    lfo.frequency.value = 1.5;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.45;
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfo.start();

    const mid = audioCtx.createOscillator();
    mid.type            = 'sawtooth';
    mid.frequency.value = 220;
    const midGain = audioCtx.createGain();
    midGain.gain.value = 0.1;
    mid.connect(midGain);
    mid.start();

    const hi = audioCtx.createOscillator();
    hi.type            = 'square';
    hi.frequency.value = 880;
    const hiGain = audioCtx.createGain();
    hiGain.gain.value = 0.03;
    hi.connect(hiGain);
    hi.start();

    const merger = audioCtx.createGain();
    merger.gain.value = 0.9;
    nGain.connect(merger);
    bassGain.connect(merger);
    midGain.connect(merger);
    hiGain.connect(merger);

    wireAnalyser(merger);
    demoNodes = [noise, bass, lfo, mid, hi];

    if (!running) { running = true; requestAnimationFrame(draw); }
    statusEl.textContent = '[ demo — synthetic signal ]';
  }

  function stopDemo() {
    demoNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    demoNodes = [];
  }

  /* ==============================
     DRAW LOOP
     ============================== */
  function draw() {
    if (!running || !analyser) return;

    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(waveData);

    const bEnd = Math.floor(freqData.length * 0.06);
    const mEnd = Math.floor(freqData.length * 0.35);
    let bSum = 0, mSum = 0;
    for (let i = 0;    i < bEnd; i++) bSum += freqData[i];
    for (let i = bEnd; i < mEnd; i++) mSum += freqData[i];
    bassLevel += (bSum / bEnd / 255           - bassLevel) * 0.2;
    midLevel  += (mSum / (mEnd - bEnd) / 255  - midLevel)  * 0.12;

    ctx.fillStyle = `rgba(3,1,1,${0.82 + bassLevel * 0.14})`;
    ctx.fillRect(0, 0, W, H);

    switch (modeIdx) {
      case 0: drawFreq();  break;
      case 1: drawScope(); break;
      case 2: drawVoid();  break;
    }

    drawParticles();
    drawScanlines();

    requestAnimationFrame(draw);
  }

  /* ==============================
     MODE 0 — FREQ
     ============================== */
  function drawFreq() {
    const BARS   = 96;
    const usable = Math.min(BARS, freqData.length);
    const cx     = W / 2;
    const floorY = H * 0.74;
    const barW   = (W / 2 - 10) / usable - 1;

    if (bassLevel > 0.42) {
      ctx.fillStyle = `rgba(40,0,0,${(bassLevel - 0.42) * 0.55})`;
      ctx.fillRect(0, 0, W, H);
    }

    for (let i = 0; i < usable; i++) {
      const val  = freqData[i] / 255;
      const barH = val * floorY * 0.92;
      const t    = i / usable;

      const r = Math.floor(lerp(130, 55, t) + bassLevel * 55);
      const g = Math.floor(lerp(0, 50, t) * val);
      const b = Math.floor(lerp(0, 50, t) * val);

      ctx.fillStyle = `rgba(${r},${g},${b},${0.6 + val * 0.4})`;

      const rx = cx + i * (barW + 1) + 1;
      const lx = cx - (i + 1) * (barW + 1);

      ctx.fillRect(rx, floorY - barH, barW, barH);
      ctx.fillRect(lx, floorY - barH, barW, barH);

      if (barH > peaks[i]) peaks[i] = barH;
      else peaks[i] = Math.max(0, peaks[i] - 0.7);

      if (peaks[i] > 3) {
        ctx.fillStyle = `rgba(${r + 50},${g + 15},${b + 10},0.75)`;
        ctx.fillRect(rx, floorY - peaks[i] - 2, barW, 2);
        ctx.fillRect(lx, floorY - peaks[i] - 2, barW, 2);
      }
    }

    ctx.strokeStyle = 'rgba(40,0,0,0.45)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, floorY); ctx.lineTo(W, floorY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(20,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.stroke();

    if (bassLevel > 0.5 && Math.random() > 0.6) {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x:    cx + (Math.random() - 0.5) * W * 0.8,
          y:    floorY,
          vx:   (Math.random() - 0.5) * 1.5,
          vy:   -(1 + Math.random() * 3) * bassLevel,
          life: 1, size: 1 + Math.random() * 1.5,
        });
      }
    }
  }

  /* ==============================
     MODE 1 — SCOPE
     ============================== */
  function drawScope() {
    const cy  = H / 2;
    const amp = H * 0.36;

    ctx.strokeStyle = 'rgba(22,0,0,0.3)';
    ctx.lineWidth   = 1;
    for (let row = 0; row <= 4; row++) {
      ctx.beginPath();
      ctx.moveTo(0, cy - amp + row * amp * 0.5);
      ctx.lineTo(W, cy - amp + row * amp * 0.5);
      ctx.stroke();
    }
    for (let col = 1; col < 8; col++) {
      ctx.beginPath();
      ctx.moveTo(col * W / 8, 0); ctx.lineTo(col * W / 8, H);
      ctx.stroke();
    }

    let trigger = 0;
    for (let i = 1; i < waveData.length - 1; i++) {
      if (waveData[i - 1] < 128 && waveData[i] >= 128) { trigger = i; break; }
    }

    const step = W / Math.min(waveData.length, 1024);

    ctx.save();
    ctx.strokeStyle = `rgba(70,0,0,${0.2 + midLevel * 0.25})`;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    for (let i = 0; i < 1024 && (trigger + i) < waveData.length; i++) {
      const v = (waveData[trigger + i] / 128 - 1) * amp;
      i === 0 ? ctx.moveTo(i * step, cy + v + 5) : ctx.lineTo(i * step, cy + v + 5);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(195,155,155,${0.65 + midLevel * 0.35})`;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = 'rgba(130,0,0,0.9)';
    ctx.shadowBlur  = 6 + bassLevel * 20;
    ctx.beginPath();
    for (let i = 0; i < 1024 && (trigger + i) < waveData.length; i++) {
      const v = (waveData[trigger + i] / 128 - 1) * amp;
      i === 0 ? ctx.moveTo(i * step, cy + v) : ctx.lineTo(i * step, cy + v);
    }
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(30,0,0,0.4)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke();
  }

  /* ==============================
     MODE 2 — VOID (radial)
     ============================== */
  function drawVoid() {
    const cx     = W / 2;
    const cy     = H / 2;
    const bins   = Math.min(200, freqData.length);
    const baseR  = Math.min(W, H) * 0.2;
    const maxLen = Math.min(W, H) * 0.28;

    const glowR = baseR * (0.55 + bassLevel * 1.3);
    const grd   = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * 2.8);
    grd.addColorStop(0,   `rgba(55,0,0,${0.28 + bassLevel * 0.4})`);
    grd.addColorStop(0.5, `rgba(20,0,0,${0.1  + bassLevel * 0.18})`);
    grd.addColorStop(1,   'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    for (let i = 0; i < bins; i++) {
      const val   = freqData[i] / 255;
      const angle = (i / bins) * Math.PI * 2 - Math.PI / 2;
      const len   = val * maxLen;
      const t     = i / bins;

      const r = Math.floor(lerp(140, 60, t)) + Math.floor(bassLevel * 55);
      const g = Math.floor(lerp(0, 55, t) * val);
      const b = Math.floor(lerp(0, 55, t) * val);

      ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + val * 0.6})`;
      ctx.lineWidth   = 1.2 + val * 0.9;
      ctx.shadowColor = 'rgba(120,0,0,0.55)';
      ctx.shadowBlur  = val * 12;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * baseR,        cy + Math.sin(angle) * baseR);
      ctx.lineTo(cx + Math.cos(angle) * (baseR + len), cy + Math.sin(angle) * (baseR + len));
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(50,0,0,0.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.stroke();

    const coreR = 3 + bassLevel * 14;
    const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreG.addColorStop(0, `rgba(210,70,70,${0.8 + bassLevel * 0.2})`);
    coreG.addColorStop(1, 'rgba(80,0,0,0)');
    ctx.fillStyle = coreG;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    if (bassLevel > 0.48 && Math.random() > 0.62) {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3.5;
        particles.push({
          x:    cx + Math.cos(a) * baseR,
          y:    cy + Math.sin(a) * baseR,
          vx:   Math.cos(a) * spd,
          vy:   Math.sin(a) * spd,
          life: 0.8 + Math.random() * 0.2,
          size: 1 + Math.random() * 1.8,
        });
      }
    }
  }

  /* ==============================
     PARTICLES
     ============================== */
  function drawParticles() {
    particles = particles.filter(p => p.life > 0.02);
    particles.forEach(p => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.035;
      p.life -= 0.022;

      ctx.save();
      ctx.globalAlpha = p.life * 0.65;
      ctx.fillStyle   = 'rgba(155,55,55,1)';
      ctx.shadowColor = 'rgba(200,0,0,0.5)';
      ctx.shadowBlur  = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ==============================
     SCANLINES
     ============================== */
  function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, y, W, 2);
    }
    ctx.restore();
  }

  /* ==============================
     UTIL
     ============================== */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ==============================
     EVENTS
     ============================== */
  canvas.addEventListener('click', () => {
    if (!analyser) startMic();
  });

  demoBtnEl.addEventListener('click', () => startDemo());

  modeBtnEl.addEventListener('click', () => {
    modeIdx = (modeIdx + 1) % MODES.length;
    modeBtnEl.textContent   = `[ ${MODES[modeIdx].toLowerCase()} ]`;
    modeLabelEl.textContent = MODES[modeIdx];
    peaks     = new Array(128).fill(0);
    particles = [];
  });

  gainSlider.addEventListener('input', () => {
    if (gainNode) gainNode.gain.value = parseFloat(gainSlider.value);
  });
})();
