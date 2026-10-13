# VerifLomba — Terminal Pemeriksa Info Lomba

Pos juri pinggir lapangan: tempel kartu lomba, juri memeriksa **12 sinyal** dengan bobot
terbuka, lalu menggedor **stempel verdict** — SAH / CEK ULANG / WASPADA — dalam hitungan detik.

> Hasil mesin, cek manual tetap wajib. — Pak Juri

## Cara menjalankan

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output ke dist/
npm run preview  # pratinjau build produksi
npm run check    # astro check + eslint + prettier
```

## Fitur

- **Form kartu lomba** — URL info, nama lomba, penyelenggara, deadline, biaya, hadiah,
  kontak panitia, kanal resmi. Validasi spesifik per field, bersuara juri.
  ("Kartu ditolak — tautan tidak bisa dibaca juri.")
- **Mesin skor 0–100** — 12 sinyal nyata (domain resmi `.ac.id/.go.id/.sch.id/.or.id`,
  shortlink, hosting gratis, kata "biaya admin", rekening pribadi, deadline janggal,
  kontak hanya DM, tanpa penyelenggara, ejaan aneh, hadiah tidak wajar, testimoni tak
  terverifikasi, tekanan "slot terbatas"). Tiap baris diketik di terminal (typewriter)
  dengan delta bobot transparan.
- **Stempel verdict draggable** — SAH (≥75) / CEK ULANG (50–74) / WASPADA (<50).
  Bisa diseret dengan inertia flick ke kotak arsip; keyboard: panah menggeser, Enter
  mengarsipkan.
- **Deep-link `?k=`** — state kartu terkompresi (base64url, max 4000 char) dengan validasi
  ketat; tautan rusak ditolak dengan pesan juri.
- **Ekspor** — salin laporan (clipboard + fallback), unduh JSON, salin tautan kartu.
- **Arsip localStorage berversi** (`veriflomba:v1`, maks 20) — data korup dipinggirkan ke
  `veriflomba:rusak-<ts>` dan arsip mulai dari nol, dengan catatan juri.
- **3 preset contoh sekali-klik** — olimpiade sains (SAH), poster misterius (WASPADA),
  festival film (CEK ULANG). Selalu berlabel "contoh".
- **Easter egg** — ketik `juri` + Enter di baris perintah terminal.
- **MODE RINGAN** — aktif otomatis saat `prefers-reduced-motion`, CPU ≤4 core, atau
  save-data: zoom & marquee-animasi mati, stempel tanpa inertia, reveal jadi fade.
- Aksesibilitas: skip link, `aria-live` untuk hasil, tombol jeda marquee, semua fitur
  bisa dipakai keyboard-only, `lang="id"`.

## Tech

- Astro 7 statis murni (tanpa SSR), Tailwind CSS v4, TypeScript
- GSAP 3 (ScrollTrigger + Draggable) via npm — tanpa CDN
- Font via Astro Fonts API (Fontsource, self-hosted): **Sofia** (display, spanduk cat),
  **Asul** (body), **Playwrite HU Guides** (aksen coretan juri)
- 18 ikon SVG solid blocky digambar tangan (`src/components/VerifIcons.astro`),
  3 custom: stopwatch, stempel, peluit
- Palet seed: senja ungu hue 262 (mid/analogous); kontras teks/bg 6.7:1 (AA)

## Struktur

```
src/
  pages/index.astro            # satu halaman: hero, marquee, terminal, sinyal, arsip, FAQ
  pages/404.astro              # 404 bersuara juri
  components/VerifIcons.astro  # 18 ikon custom
  components/CustomStyles.astro# token warna seed
  scripts/scoring.ts           # mesin 12 sinyal + validasi + deep-link (murni, testable)
  scripts/veriflomba.ts        # UI: typewriter, stempel drag, arsip, gerak A–E
screenshots/                   # bukti QA (mobile-390, dsb.)
CRITIQUE.md                    # kritik jujur pasca-build
```

## Skor

- `npm run check`: lolos (astro check + eslint + prettier)
- `node tools/qa.js`: 4 viewport tanpa overflowX, 0 console error, h1=1, lang=id,
  reduced-motion dihormati (catatan: sub-metrik fps4x flaky di VM ini — lihat CRITIQUE.md)
- Lighthouse: **desktop 100/96/100/100, mobile 94/96/100/100**
  (performance / accessibility / best-practices / SEO)

## Catatan juri

- Tidak ada backend: 100% client-side. "Testimoni palsu" dideteksi dari pola teks
  (klaim testimoni tanpa domain resmi), bukan dari fetch — fetch lintas-situs tidak
  mungkin di situs statis tanpa server.
- Skor adalah heuristik pola teks, bukan vonis kebenaran.
