# CRITIQUE — VerifLomba — 2026-10-19

## Slop test (v3)
Logo/nama ditutup: kisi Swiss + tipografi script raksasa + terminal tinta + stopwatch —
tidak ketukar dengan BidCepat/EsaiCepat (kartu pos) maupun web AI generik. Lolos.

## 3 hal paling template + yang dirombak
1. **Grid kartu pola** (16 kartu) — generik. Dirombak: badge nomor pos menempel di
   border, ikon custom blocky ungu, bukan rounded-2xl+shadow seragam (putaran 1).
2. **Ikon pola sempat raksasa** (rule CSS scoped Astro hilang) — diperbaiki ke 2rem
   via CSS global (putaran 1, bukan rombak desain).
3. **Layout desktop 1 kolom** (rule responsif scoped hilang) — dikembalikan ke 2 kolom
   via CSS global (putaran 1).
4. Bonus putaran 2: **GSAP dibuang total** — diganti WAAPI+rAF+sticky+IO. Alasan:
   performa (162KB→18KB JS). Keputusan berani secara teknis, bukan visual.

## Gerbang gerak (v4)
- Lapisan: A (sticky pin + zoom-through pintu, rAF), B (2 band marquee ikon+teks,
  skew velocity), C (outline→fill scrub), D (drag inertia rel arsip + magnetic),
  E (blob-morph verdict + slam stempel). = 5 lapisan, 5 kategori. Lolos.
- Zoom ✓, pin ✓ (sticky), 2 marquee ✓.
- FPS CPU 4×: **60** (target ≥45). Lolos.
- reduced-motion: dites via qa.js (0 animasi berjalan) + toggle "Gerak: nyala/mati".
  Lolos.

## Gerbang v5
- Tes bandingkan: vs BidCepat (spreadsheet/kantor pos) & EsaiCepat (timeline/rel) —
  tidak sekeluarga (terminal/Swiss/lavender). Lolos.
- Tes blur: blok tipografi raksasa + lingkaran stopwatch + pita marquee tetap terbaca
  sebagai identitas. Lolos.
- Tes 3 detik: "Serahkan tautanmu." + stopwatch + tombol Periksa — jelas ini loket
  pemeriksaan lomba. Lolos.
- Keyboard-only: form, checklist, tombol rel prev/next, skip link, focus-visible —
  lolos (diuji manual via skrip: semua kontrol terjangkau Tab).
- Reduced-motion: lolos (qa.js).
- Mode ringan: liteDevice → matikan loop, marquee statis, rel jadi scroll native.
  Diuji via emulasi (dipaksa). Lolos.

## Budget performa + Lighthouse
- JS 18KB (gzip ~6KB), CSS 48KB, font 4 file ~95KB. LCP 2.1s, CLS 0.002, INP n/a.
- Mobile: 98/100/100/100. Desktop: 99/100/100/100.

## Keamanan + lisensi
- Data user (URL/teks) tidak pernah di-render via innerHTML di jalur temuan
  (judul/deskripsi statis dari mesin); riwayat localStorage divalidasi skema + versi.
  Tidak ada tracker, analytics, API key, atau data keluar.
- Font OFL (Sofia, Asul, Playwrite HU Guides) via Fontsource; ikon digambar sendiri;
  Astro (MIT), Tailwind (MIT). Kredit di README.

## Skor 1-10
Karakter **9** | Keunikan **8** | Kerapian **8**. Karakter & keunikan ≥ 8 — lolos.

## Keputusan konflik aturan
1. Widget siap pakai (Hero/Features/…) vs blacklist v3 "hero + 3 kartu" → **custom**,
   v3 menang (keputusan berani: tanpa hero marketing).
2. `astro-icon tabler` (body) vs seed "custom hand-built SVG" → **custom inline**,
   seed mengikat (v4 ATURAN 0).
3. Deploy Vercel/Netlify (body) vs approval tak tersedia di run detached → **GitHub
   Pages** via gh-push.py, pola build 2026-10-16/17 (R5 autopilot, dicatat).
4. GSAP (v4 toolkit) vs TBT 2430ms → **tanpa library gerak**; v5 ATURAN 0.7
   (fungsi/aksesibilitas tak dikorbankan) + budget ATURAN 6 menang.

## Dipangkas
- Lapisan F (shader/fisika): tidak dibutuhkan konsep.
- Suara mikro: tidak dipakai (fokus gerak).
- Mode gelap: konsep mengunci satu palet institusional (mid lavender); dicatat.

## Catatan lingkungan
- `tools/qa.cjs` terhadap URL live GAGAL di VM (Playwright Chromium:
  `net::ERR_TUNNEL_CONNECTION_FAILED` — egress proxy VM mencegat, bukan salah web).
  Pengganti setara: verifikasi live via browser task (hasil di bawah) + qa.js lokal
  lolos penuh + HTTP 200 via curl.
- Hasil browser task live: _menunggu hasil_ (dilaporkan saat tiba).

## Putaran rombak
- Ronde 1: ikon pola raksasa → 2rem; layout desktop → 2 kolom; stopwatch hand
  svgOrigin; grain fixed → absolute (FPS 48→60).
- Ronde 2: GSAP → WAAPI/rAF (TBT 2430→40ms, perf 49→98); ClientRouter dimatikan;
  komponen template tak terpakai dihapus (CSS 130→48KB).
