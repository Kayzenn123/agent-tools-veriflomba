/* VerifLomba — mesin analisis 100% sisi klien.
   Tidak ada data yang dikirim ke mana pun; semua pemeriksaan jalan di browser. */

export const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.ly', 's.id', 'gg.gg', 'cutt.ly', 'cut.ly',
  'shorturl.at', 'is.gd', 'rebrand.ly', 'ow.ly', 'buff.ly', 'tiny.cc',
  'rb.gy', 'clck.ru', 'short.ly', 'go.link',
]);

const PATH_SUS = ['login', 'signin', 'sign-in', 'verify', 'verifikasi-akun', 'claim', 'klaim-hadiah', 'gratis', '/free', 'bonus'];
const RESMI_TLD = ['go.id', 'ac.id', 'sch.id', 'or.id']; // domain terkelola PANDI

const BULAN = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };

export function normalizeUrl(raw) {
  const t = (raw || '').trim();
  if (!t) return { ok: false, code: 'kosong', msg: 'Formulir belum lengkap: kolom tautan kosong.' };
  let s = t;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = 'https://' + s; // anggap https dulu
  let u;
  try { u = new URL(s); } catch {
    return { ok: false, code: 'format', msg: 'Tautan tidak dikenali. Contoh tautan yang benar: https://contoh.or.id/lomba-2026' };
  }
  if (!/^https?:$/.test(u.protocol)) return { ok: false, code: 'proto', msg: 'Protokol tidak didukung. Pakai tautan http(s) biasa.' };
  return { ok: true, url: u, href: u.href };
}

export function analyzeUrl(raw) {
  const n = normalizeUrl(raw);
  if (!n.ok) return n;
  const u = n.url;
  const host = u.hostname.toLowerCase();
  const findings = [];
  let score = 100;
  const hit = (sev, title, desc, w) => { findings.push({ sev, title, desc, w }); score += w; };

  // positif
  if (u.protocol === 'https:') hit('ok', 'Memakai HTTPS', 'Koneksi ke situs terenkripsi.', 3);
  if (RESMI_TLD.some((t) => host === t || host.endsWith('.' + t)))
    hit('ok', 'Domain resmi Indonesia', 'Berakhiran ' + RESMI_TLD.find((t) => host === t || host.endsWith('.' + t)) + ' — domain terkelola yang butuh dokumen resmi untuk didaftarkan.', 8);

  // negatif
  const bare = host.replace(/^www\./, '');
  if (SHORTENERS.has(bare)) hit('bad', 'Tautan dipendekkan', 'Tujuan asli disembunyikan di balik pemendek tautan. Buka dengan hati-hati atau minta tautan aslinya.', -15);
  if (u.protocol === 'http:') hit('warn', 'Tanpa HTTPS', 'Situs tidak terenkripsi. Situs resmi lomba umumnya sudah memakai HTTPS.', -10);
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) hit('bad', 'Alamat berupa angka IP', 'Situs resmi tidak memakai angka IP sebagai alamat.', -20);
  if (n.href.includes('@')) hit('bad', 'Ada karakter @ di tautan', 'Pola umum tautan tipuan: bagian depan @ diabaikan browser.', -15);
  if (host.includes('xn--')) hit('bad', 'Domain samaran (punycode)', 'Domain memakai huruf yang tampak mirip huruf latin.', -15);
  const subs = host.split('.').length;
  if (subs >= 5) hit('warn', 'Subdomain berlapis', subs + ' lapis subdomain — pola umum tautan tipuan.', -5);
  const params = [...u.searchParams.keys()].length;
  if (params >= 6) hit('warn', 'Parameter berlebihan', params + ' parameter di tautan — periksa tujuan aslinya.', -5);
  const pl = (u.pathname + u.search).toLowerCase();
  if (PATH_SUS.some((k) => pl.includes(k))) hit('warn', 'Kata kunci pancingan di tautan', 'Ada kata seperti login/claim/gratis di alamat — khas halaman phishing.', -8);
  if (n.href.length > 140) hit('info', 'Tautan sangat panjang', n.href.length + ' karakter. Tautan resmi biasanya ringkas dan jelas.', -3);
  if (!findings.some((f) => f.sev === 'bad' || f.sev === 'warn'))
    hit('ok', 'Tidak ada pola mencurigakan di tautan', 'Struktur tautan bersih dari pola tipuan umum.', 4);

  return { ok: true, url: u, href: n.href, host, findings, score: Math.max(0, Math.min(100, Math.round(score))) };
}

export function analyzeText(text) {
  const t = (text || '').trim();
  const findings = [];
  const dates = [];
  const fees = [];
  if (!t) return { empty: true, findings, dates, fees };
  const hit = (sev, title, desc, w) => findings.push({ sev, title, desc, w });

  let m;
  const reBulan = /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/gi;
  while ((m = reBulan.exec(t))) dates.push(m[0]);
  const reNum = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/g;
  while ((m = reNum.exec(t))) dates.push(m[0]);
  if (dates.length) hit('info', dates.length + ' tanggal terdeteksi', 'Contoh: ' + [...new Set(dates)].slice(0, 3).join('; ') + '. Cocokkan dengan pengumuman di kanal resmi.', 0);
  else hit('info', 'Tidak ada tanggal terdeteksi', 'Pengumuman lomba resmi selalu mencantumkan deadline yang jelas.', 0);

  const reRp = /rp\.?\s?([\d.]+)(\s?(rb|ribu|jt|juta))?/gi;
  while ((m = reRp.exec(t))) {
    let v = parseInt(m[1].replace(/\./g, ''), 10);
    if (/rb|ribu/i.test(m[3] || '')) v *= 1000;
    if (/jt|juta/i.test(m[3] || '')) v *= 1000000;
    if (!Number.isNaN(v)) fees.push(v);
  }
  const maxFee = fees.length ? Math.max(...fees) : 0;
  if (maxFee > 150000)
    hit('warn', 'Biaya pendaftaran tinggi', 'Terdeteksi Rp' + maxFee.toLocaleString('id-ID') + ' — di atas kewajaran lomba pelajar pada umumnya. Minta rincian resmi.', -10);
  else if (fees.length) hit('info', 'Biaya tercatat', 'Biaya terbesar Rp' + maxFee.toLocaleString('id-ID') + '. Simpan bukti bayar apa pun yang diminta.', 0);

  if (/(rekening|transfer|kirim ke|bayar ke)[\s\S]{0,40}\d{10,16}/i.test(t) || /rekening (pribadi|atas nama)/i.test(t))
    hit('bad', 'Diminta transfer', 'Teks meminta transfer. Pastikan ke rekening resmi organisasi, bukan nama pribadi.', -12);
  if (/(segera|terbatas|terakhir|jangan sampai ketinggalan|kuota|buruan)/i.test(t))
    hit('warn', 'Bahasa mendesak', 'Ada kata desakan ("segera", "kuota terbatas"). Teknik umum agar korban tidak sempat berpikir.', -4);
  if (/(nik|nomor ktp|foto ktp|no\.?\s*kk|kartu keluarga)/i.test(t))
    hit('bad', 'Diminta data sensitif', 'Pengumuman meminta NIK/KTP/KK di tahap awal — data ini tidak dibutuhkan untuk sekadar mendaftar lomba.', -10);
  if (/share.{0,25}\d+\s*grup/i.test(t))
    hit('warn', 'Syarat sebar ke grup', 'Syarat utama berupa menyebar info ke sejumlah grup — pola umum lomba abal-abal.', -8);

  const penalty = findings.reduce((a, f) => a + Math.min(0, f.w), 0);
  return { empty: false, findings, dates: [...new Set(dates)], fees, penalty };
}

export const CHECKLIST = [
  { id: 'org', label: 'Penyelenggara jelas dan bisa dilacak', desc: 'Ada nama organisasi + alamat/kontak yang bisa diverifikasi di luar tautan ini.' },
  { id: 'kontak', label: 'Kontak resmi, bukan nomor pribadi', desc: 'Email domain organisasi atau nomor resmi panitia, bukan sekadar nomor pribadi.' },
  { id: 'wajar', label: 'Deadline & biaya masuk akal', desc: 'Batas waktu jelas dan biaya sebanding dengan lomba sejenis.' },
  { id: 'jejak', label: 'Ada jejak penyelenggaraan sebelumnya', desc: 'Pemenang tahun lalu diumumkan, akun media sosial punya riwayat.' },
];

export function verdictFor(score) {
  if (score >= 75) return { key: 'aman', label: 'Layak dipercaya' };
  if (score >= 45) return { key: 'cek', label: 'Perlu cek manual' };
  return { key: 'waspada', label: 'Waspada' };
}

/* ---- arsip lokal ---- */
const LS_KEY = 'veriflomba:v1';
export function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.items)) return [];
    return d.items.filter((it) => it && typeof it.url === 'string' && typeof it.score === 'number').slice(0, 20);
  } catch { return []; }
}
export function saveHistory(items) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, items: items.slice(0, 20) })); } catch { /* mode privat: arsip dinonaktifkan diam-diam */ }
}
export function pushHistory(entry) {
  const items = loadHistory().filter((it) => it.url !== entry.url);
  items.unshift(entry);
  saveHistory(items);
  return items;
}

export function buildReport({ href, host, score, verdict, findings, checks }) {
  const lines = [
    'VERIFLOMBA — laporan pemeriksaan',
    'Tautan: ' + href,
    'Skor: ' + score + '/100 — ' + verdict.label.toUpperCase(),
    '',
    'Temuan:',
    ...findings.map((f) => '- [' + f.sev.toUpperCase() + '] ' + f.title + ' — ' + f.desc),
    '',
    'Cek manual: ' + checks.filter((c) => c.done).length + '/' + checks.length + ' terpenuhi',
    'Diperiksa: ' + new Date().toLocaleString('id-ID'),
    'Catatan: pemeriksaan otomatis tidak menggantikan verifikasi ke kanal resmi penyelenggara.',
  ];
  return lines.join('\n');
}
