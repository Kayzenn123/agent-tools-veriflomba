/* VerifLomba — lapisan gerak A–F TANPA dependency (WAAPI + rAF + sticky + IO).
   A kamera: sticky pin + zoom-through pintu (rAF) | B marquee 2 band + skew velocity |
   C outline terisi saat scroll (rAF) | D drag inertia rail + magnetic |
   E reveal blob morph (WAAPI) | + reduced-motion, toggle gerak, mode ringan. */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('no-motion');
const liteDevice = () =>
  (navigator.hardwareConcurrency || 8) <= 4 ||
  (navigator.deviceMemory || 8) <= 4 ||
  (navigator.connection && navigator.connection.saveData);

let rafId = 0;
let railKill = null;

function scrollLoop() {
  const heroPin = document.getElementById('hero-pin');
  const inner = document.getElementById('hero-inner');
  const pintu = document.getElementById('pintu');
  const ring = pintu ? pintu.querySelector('.ring') : null;
  const solids = [...document.querySelectorAll('.fill-title .solid')];
  const bands = [...document.querySelectorAll('.marquee-track')];
  const speeds = bands.map((b) => parseFloat(b.dataset.speed || '40'));
  // ukur sekali, segarkan saat resize (hindari forced reflow per frame)
  let pinH = 1, half = [], fillEls = [];
  const measure = () => {
    pinH = heroPin ? Math.max(heroPin.offsetHeight - window.innerHeight, 1) : 1;
    half = bands.map((b) => b.scrollWidth / 2);
    fillEls = solids.map((s) => s.closest('.fill-title')).filter(Boolean);
  };
  measure();
  let mT; window.addEventListener('resize', () => { clearTimeout(mT); mT = setTimeout(measure, 250); }, { passive: true });

  const xs = speeds.map(() => 0);
  let lastY = -1, vel = 0, last = performance.now();

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const y = window.scrollY;
    // --- fase baca (sekali jalan) ---
    let pinTop = 0, fillTops = null;
    const moved = y !== lastY;
    if (moved && heroPin) pinTop = heroPin.getBoundingClientRect().top;
    if (moved && fillEls.length) fillTops = fillEls.map((t) => t.getBoundingClientRect().top);
    vel += ((y - lastY) - vel) * 0.12; lastY = y;
    // --- fase tulis ---
    if (moved && heroPin && inner) {
      const p = clamp(-pinTop / pinH, 0, 1);
      inner.style.transform = `scale(${(1 + p * 1.1).toFixed(3)})`;
      inner.style.opacity = (1 - p * 0.88).toFixed(3);
      if (pintu && ring) {
        // amplop segitiga: pintu mengembang (0.30→0.62) lalu memudar (0.62→1.0)
        // agar TIDAK menutupi layar setelah transisi selesai
        const q = p < 0.3 ? 0 : p < 0.62 ? (p - 0.3) / 0.32 : Math.max(0, 1 - (p - 0.62) / 0.38);
        pintu.style.opacity = q.toFixed(3);
        pintu.style.visibility = q > 0.01 ? 'visible' : 'hidden';
        ring.style.transform = `scale(${(0.25 + Math.min(q * 1.4, 1) * 2.95).toFixed(3)})`;
      }
    }
    if (moved && fillTops) {
      solids.forEach((s, i) => {
        const p = clamp((window.innerHeight * 0.85 - fillTops[i]) / (window.innerHeight * 0.5), 0, 1);
        s.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
      });
    }
    bands.forEach((b, i) => {
      const sp = speeds[i] * (1 + Math.min(Math.abs(vel) / 60, 3));
      xs[i] -= sp * dt;
      if (half[i] && -xs[i] >= half[i]) xs[i] += half[i];
      b.style.transform = `translateX(${xs[i].toFixed(1)}px) skewX(${clamp(-vel * 0.25, -14, 14).toFixed(2)}deg)`;
    });
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
}

function revealInit() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduced()) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

function railInit() {
  const rail = document.getElementById('rail');
  const track = document.getElementById('rail-track');
  if (!rail || !track) return () => {};
  let x = 0, startX = 0, lastX = 0, velX = 0, dragging = false, raf = 0, lastT = 0;
  const min = () => Math.min(0, rail.clientWidth - track.scrollWidth - 32);
  const setX = (v) => { x = clamp(v, min(), 0); track.style.transform = `translate3d(${x}px,0,0)`; };
  const momentum = () => {
    if (dragging) return;
    velX *= 0.94;
    if (Math.abs(velX) < 0.4) return;
    setX(x + velX * 16);
    if (x === min() || x === 0) velX = 0;
    raf = requestAnimationFrame(momentum);
  };
  const down = (e) => {
    dragging = true; cancelAnimationFrame(raf);
    startX = (e.clientX) - x; lastX = e.clientX; lastT = performance.now(); velX = 0;
  };
  const move = (e) => {
    if (!dragging) return;
    const now = performance.now();
    velX = (e.clientX - lastX) / Math.max(now - lastT, 1); lastX = e.clientX; lastT = now;
    setX(e.clientX - startX);
  };
  const up = () => { if (!dragging) return; dragging = false; velX = clamp(velX * 16, -3, 3); raf = requestAnimationFrame(momentum); };
  rail.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  document.querySelectorAll('[data-rail]').forEach((btn) => {
    btn.addEventListener('click', () => setX(x + (btn.dataset.rail === 'next' ? -260 : 260)));
  });
  setX(0);
  return () => {
    rail.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    cancelAnimationFrame(raf);
  };
}

function magneticInit() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.btn-loket').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.animate([{ transform: btn.style.transform }, { transform: 'translate(0,0)' }],
        { duration: 500, easing: 'cubic-bezier(.2,.9,.25,1.2)' }).onfinish = () => { btn.style.transform = ''; };
    });
  });
}

function stopwatchInit() {
  const sw = document.getElementById('stopwatch');
  let n = 0, t = 0;
  if (sw) sw.addEventListener('click', () => {
    const now = Date.now();
    n = now - t < 1200 ? n + 1 : 1; t = now;
    if (n >= 5) {
      n = 0;
      document.body.classList.toggle('inspektur');
      const live = document.getElementById('live');
      if (live) live.textContent = document.body.classList.contains('inspektur')
        ? 'Mode inspektur aktif: bobot tiap temuan ditampilkan.'
        : 'Mode inspektur mati.';
    }
  });
}

function fpsWatch() {
  let bad = 0, frames = 0, t0 = performance.now();
  const loop = () => {
    frames++;
    const now = performance.now();
    if (now - t0 >= 1000) {
      const fps = (frames * 1000) / (now - t0);
      bad = fps < 40 ? bad + 1 : 0;
      if (bad >= 2) { document.body.classList.add('lite'); applyLite(); return; }
      frames = 0; t0 = now;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function applyLite() {
  cancelAnimationFrame(rafId);
  document.querySelectorAll('.marquee-track').forEach((b) => { b.style.transform = 'none'; });
  if (railKill) { railKill(); railKill = null; }
  const rail = document.getElementById('rail');
  if (rail) rail.style.overflowX = 'auto';
  const pintu = document.getElementById('pintu');
  if (pintu) pintu.style.display = 'none';
  const inner = document.getElementById('hero-inner');
  if (inner) { inner.style.transform = 'none'; inner.style.opacity = '1'; }
}

export function initMotion() {
  const toggle = document.getElementById('gerak-toggle');
  const setMotion = (on) => {
    document.body.classList.toggle('no-motion', !on);
    if (toggle) { toggle.textContent = on ? 'Gerak: nyala' : 'Gerak: mati'; toggle.setAttribute('aria-pressed', String(on)); }
    if (!on) applyLite(); else location.reload();
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setMotion(false); return; }
  if (toggle) toggle.addEventListener('click', () => setMotion(document.body.classList.contains('no-motion')));

  try { revealInit(); } catch (e) { console.warn('reveal', e); }
  try { railKill = railInit(); } catch (e) { console.warn('rail', e); }
  try { magneticInit(); } catch (e) { console.warn('magnetic', e); }
  try { stopwatchInit(); } catch (e) { console.warn('stopwatch', e); }
  try { scrollLoop(); } catch (e) { console.warn('scroll', e); }

  if (liteDevice()) { document.body.classList.add('lite'); applyLite(); }
  else fpsWatch();
  window.addEventListener('resize', () => {}, { passive: true });
}

/* dipakai terminal.js untuk momen stempel */
export function slamStamp(el) {
  if (!el) return;
  if (reduced()) { el.style.opacity = 1; return; }
  el.animate([
    { transform: 'scale(2.6) rotate(-20deg)', opacity: 0 },
    { transform: 'scale(1) rotate(-8deg)', opacity: 1 },
  ], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
}
export function blobReveal(el) {
  if (!el || reduced()) return;
  el.animate([
    { transform: 'scale(.6)', opacity: 0, borderRadius: '42% 58% 55% 45% / 48% 42% 58% 52%' },
    { transform: 'scale(1)', opacity: 1, borderRadius: '10px' },
  ], { duration: 650, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'forwards' });
}
export function countUp(el, to, done) {
  if (!el) return;
  if (reduced()) { el.textContent = to; done && done(); return; }
  const t0 = performance.now(), dur = 1300;
  const step = (now) => {
    const p = clamp((now - t0) / dur, 0, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step); else done && done();
  };
  requestAnimationFrame(step);
}
