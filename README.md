# VerifLomba — Loket Verifikasi Tautan Lomba

**Live:** https://kayzenn123.github.io/agent-tools-veriflomba/

Loket pemeriksaan satu halaman untuk tautan info lomba: tempel tautan (dan opsional teks
pengumuman), mesin membedah strukturnya di perangkatmu, lalu memberi skor 0–100 +
stempel verdict **Layak dipercaya / Perlu cek manual / Waspada** — sebelum kamu transfer
atau daftar.

## Fitur
- **Bedah URL** — deteksi tautan dipendekkan, tanpa HTTPS, IP mentah, karakter `@`,
  punycode, subdomain berlapis, parameter berlebihan, kata pancingan (login/claim/gratis),
  apresiasi domain resmi `.go.id/.ac.id/.sch.id/.or.id`.
- **Bedah teks pengumuman** — ekstrak tanggal & biaya (Rp), tandai permintaan transfer,
  bahasa mendesak, permintaan data sensitif (NIK/KTP), syarat sebar ke grup.
- **Skor + stempel** — odometer animasi, stempel verdict bergaya cap loket.
- **Cek manual 4 poin** — masing-masing +5 ke skor (penyelenggara terlacak, kontak resmi,
  deadline/biaya wajar, jejak penyelenggaraan).
- **Arsip lokal** — riwayat pemeriksaan di `localStorage` (tidak diunggah), rel bisa diseret.
- **Deep-link** — `?u=<tautan>` mengulang pemeriksaan otomatis.
- **Ekspor** — salin laporan teks / unduh JSON / salin tautan hasil.
- **16 pola** lomba abal-abal yang sering dilaporkan + mode inspektur (klik stopwatch 5×).

## Teknologi
Astro 7 (static) + Tailwind CSS v4 + GSAP (ScrollTrigger, Draggable) + Astro Fonts API
(Sofia / Asul / Playwrite HU Guides, self-hosted). Tanpa backend, tanpa tracker —
seluruh analisis jalan di browser.

## Cara jalanin
```
npm install
npm run dev     # http://localhost:4321
npm run build   # output ke dist/
```

## Skor
- Lighthouse mobile: _TBD_ (performance / accessibility / best-practices / SEO)
- Lighthouse desktop: _TBD_
- FPS CPU 4×: _TBD_
- Karakter 9 / keunikan 8 / kerapian 8 (lihat CRITIQUE.md)

## Konsep
Seed 2026-10-19: terminal interaktif × Swiss/International Style × stopwatch lomba 17-an.
Persona: petugas loket verifikasi. Lihat BRIEF.md.

## Lisensi & aset
Font: Sofia, Asul, Playwrite HU Guides (SIL Open Font License, via Fontsource).
Ikon: digambar sendiri (SVG inline). Pustaka: GSAP (hak cipta Webflow, lisensi gratis),
Astro (MIT), Tailwind CSS (MIT).
