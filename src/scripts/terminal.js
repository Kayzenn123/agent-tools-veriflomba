/* VerifLomba — kontroler loket: form → analisis → log → stempel → arsip. */
import { analyzeUrl, analyzeText, verdictFor, CHECKLIST, loadHistory, pushHistory, buildReport } from './verifier.js';
import { countUp, slamStamp, blobReveal } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const noMotion = () => document.body.classList.contains('no-motion');

const ICON = {
  ok: 'check', warn: 'warn', bad: 'cross', info: 'search',
};

function iconUse(name) {
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:1.4rem;height:1.4rem;flex:none"><use href="#vl-i-${name}"/></svg>`;
}

function typeLines(logEl, lines, done) {
  logEl.innerHTML = '';
  const live = $('#live');
  if (noMotion()) {
    logEl.innerHTML = lines.map((l) => `<div class="ln-${l.c}">${l.t}</div>`).join('');
    done && done(); return;
  }
  let i = 0;
  const step = () => {
    if (i >= lines.length) { done && done(); return; }
    const l = lines[i++];
    const div = document.createElement('div');
    div.className = 'ln-' + l.c;
    div.textContent = l.t;
    logEl.appendChild(div);
    if (live && (l.c === 'bad' || l.c === 'warn')) live.textContent = l.t;
    setTimeout(step, 140 + Math.random() * 160);
  };
  step();
}

function renderFindings(box, findings) {
  const insp = document.body.classList.contains('inspektur');
  box.innerHTML = findings.map((f) => `
    <article class="finding" data-s="${f.sev}" data-reveal>
      <div style="display:flex;gap:.7rem;align-items:flex-start">
        ${iconUse(ICON[f.sev] || 'search')}
        <div><h4>${f.title}</h4><p>${f.desc}</p>
        ${insp ? `<span class="w">bobot petugas: ${f.w > 0 ? '+' : ''}${f.w}</span>` : ''}
        </div>
      </div>
    </article>`).join('');
}

function renderChecks(box, state) {
  box.innerHTML = CHECKLIST.map((c) => `
    <label class="check">
      <input type="checkbox" data-check="${c.id}" ${state[c.id] ? 'checked' : ''}>
      <span><strong>${c.label}</strong><br><span style="opacity:.75">${c.desc}</span></span>
    </label>`).join('');
  $$('input[data-check]', box).forEach((inp) => {
    inp.addEventListener('change', () => {
      state[inp.dataset.check] = inp.checked;
      recount(state);
    });
  });
}

let last = null; // {scoreBase, findings, href, host, checkState, el refs}

function recount(state) {
  if (!last) return;
  const bonus = Object.values(state).filter(Boolean).length * 5;
  const score = Math.max(0, Math.min(100, last.scoreBase + bonus));
  const v = verdictFor(score);
  $('#score-num').textContent = score;
  const stamp = $('#stamp');
  stamp.dataset.v = v.key; stamp.textContent = 'Stempel: ' + v.label;
  $('#score-label').textContent = v.label;
  $('#arsip-count').textContent = `cek manual ${Object.values(state).filter(Boolean).length}/4`;
  last.score = score; last.verdict = v;
}

function runAnalysis(rawUrl, rawText, opts = {}) {
  const errBox = $('#form-error');
  errBox.textContent = '';
  const res = analyzeUrl(rawUrl);
  if (!res.ok) {
    errBox.textContent = res.msg;
    $('#url').setAttribute('aria-invalid', 'true');
    $('#url').focus();
    return;
  }
  $('#url').removeAttribute('aria-invalid');
  const tres = analyzeText(rawText);
  const all = [...res.findings, ...tres.findings];
  const penalty = tres.penalty || 0;
  const scoreBase = Math.max(0, Math.min(100, res.score + penalty));
  const checkState = {};
  last = { scoreBase, findings: all, href: res.href, host: res.host, checkState, score: scoreBase, verdict: verdictFor(scoreBase) };

  // tampilkan panel hasil
  const hasil = $('#hasil');
  hasil.hidden = false;
  blobReveal($('#verdict-card'));

  const lines = [
    { c: 'dim', t: 'Dokumen diterima. Memeriksa keaslian…' },
    { c: 'dim', t: '→ mengurai alamat: ' + res.host },
    ...all.slice(0, 8).map((f) => ({ c: f.sev === 'info' ? 'dim' : f.sev, t: (f.sev === 'ok' ? '✓ ' : f.sev === 'bad' ? '✕ ' : f.sev === 'warn' ? '! ' : '· ') + f.title })),
    { c: 'dim', t: '→ pemeriksaan selesai. Skor dihitung.' },
  ];
  const logEl = $('#log');
  logEl.innerHTML = '<div class="caret ln-dim">menunggu…</div>';
  $('#btn-periksa').disabled = true;

  typeLines(logEl, lines, () => {
    $('#btn-periksa').disabled = false;
    renderFindings($('#temuan'), all);
    renderChecks($('#ceklist'), checkState);
    countUp($('#score-num'), scoreBase, () => {
      const v = verdictFor(scoreBase);
      const stamp = $('#stamp');
      stamp.dataset.v = v.key; stamp.textContent = 'Stempel: ' + v.label;
      $('#score-label').textContent = v.label;
      slamStamp(stamp);
      const live = $('#live');
      if (live) live.textContent = 'Pemeriksaan selesai. Skor ' + scoreBase + ' dari 100. ' + v.label + '.';
    });
    // arsip
    const items = pushHistory({ url: res.href, host: res.host, score: scoreBase, verdict: last.verdict.key, ts: Date.now() });
    renderHistory(items);
    if (!opts.silent) $('#hasil').scrollIntoView({ behavior: noMotion() ? 'auto' : 'smooth', block: 'nearest' });
  });
}

function renderHistory(items) {
  const track = $('#rail-track');
  const empty = $('#riwayat-empty');
  if (!items.length) { track.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;
  track.innerHTML = items.map((it) => {
    const d = new Date(it.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const vlabel = it.verdict === 'aman' ? 'Layak dipercaya' : it.verdict === 'cek' ? 'Perlu cek manual' : 'Waspada';
    return `<button class="riwayat-card" data-url="${it.url.replace(/"/g, '&quot;')}" style="text-align:left;cursor:pointer;font:inherit;color:inherit">
      <div class="url">${it.host}</div>
      <div style="display:flex;justify-content:space-between;margin-top:.4rem">
        <strong>${it.score}/100</strong><span>${vlabel}</span>
      </div><div style="opacity:.6">${d}</div>
    </button>`;
  }).join('');
  $$('.riwayat-card', track).forEach((b) => b.addEventListener('click', () => {
    $('#url').value = b.dataset.url;
    runAnalysis(b.dataset.url, $('#teks').value);
  }));
}

function copyReport() {
  if (!last) return;
  const checks = CHECKLIST.map((c) => ({ ...c, done: !!last.checkState[c.id] }));
  const txt = buildReport({ href: last.href, host: last.host, score: last.score, verdict: last.verdict, findings: last.findings, checks });
  const done = () => { $('#live').textContent = 'Laporan disalin ke papan klip.'; };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  else fallbackCopy(txt, done);
}
function fallbackCopy(txt, done) {
  const ta = document.createElement('textarea');
  ta.value = txt; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch { $('#live').textContent = 'Gagal menyalin.'; }
  ta.remove();
}
function downloadJSON() {
  if (!last) return;
  const blob = new Blob([JSON.stringify({ url: last.href, host: last.host, score: last.score, verdict: last.verdict, findings: last.findings, at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'veriflomba-' + Date.now() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function initTerminal() {
  $('#form-loket').addEventListener('submit', (e) => {
    e.preventDefault();
    runAnalysis($('#url').value, $('#teks').value);
  });
  $('#btn-contoh').addEventListener('click', () => {
    $('#url').value = 'https://bit.ly/lomba-nasional-2026-hadiah';
    $('#teks').value = 'LOMBA NASIONAL 2026! Hadiah total Rp50.000.000. Pendaftaran Rp250rb transfer ke rekening 8811223344 a.n. Budi. Kuota terbatas, daftar segera! Share ke 5 grup WA untuk lolos seleksi.';
    runAnalysis($('#url').value, $('#teks').value);
  });
  $('#btn-salins').addEventListener('click', copyReport);
  $('#btn-unduh').addEventListener('click', downloadJSON);
  $('#btn-bagi').addEventListener('click', () => {
    if (!last) return;
    const share = location.origin + location.pathname + '?u=' + encodeURIComponent(last.href);
    const done = () => { $('#live').textContent = 'Tautan hasil disalin. Buka tautan itu untuk mengulang pemeriksaan.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(share).then(done).catch(() => fallbackCopy(share, done));
    else fallbackCopy(share, done);
  });
  renderHistory(loadHistory());

  // deep-link ?u=
  try {
    const u = new URLSearchParams(location.search).get('u');
    if (u) { $('#url').value = u; setTimeout(() => runAnalysis(u, ''), 600); }
  } catch { /* abaikan */ }
}
