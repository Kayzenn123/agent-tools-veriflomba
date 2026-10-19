# BRIEF — VerifLomba — 2026-10-19

## Masalah/usecase
Pelajar yang mau ikut lomba sering dapat info dari tautan yang disebar di grup chat — sebagian ternyata pungutan liar atau phishing; VerifLomba adalah loket pemeriksaan satu halaman yang membedah tautan + teks pengumuman dan memberi verdict berani sebelum mereka transfer uang atau data.

## Konsep visual (1 kalimat)
Loket verifikasi ala papan pengumuman Swiss: kisi tegas, tipografi raksasa, dan satu "mesin pemeriksa" terminal tempat pengunjung menyerahkan tautan lalu kamera menyelam masuk ke dalam mesin saat hasil dicetak.

## Hasil seed (ringkas)
- domain: stopwatch lomba 17-an | layout: terminal interaktif | ref: Swiss/International Style
- constraint: hanya 3 ukuran font | icons: solid blocky, custom hand-built SVG
- motion: camera "canvas drag + zoom scroll" | marquee "ikon SVG + teks" 2 band | text "outline terisi saat scroll" | input "drag inertia flick" | reveal "morph SVG blob mask"
- fonts: Sofia (display) / Asul (body) / Playwrite HU Guides (aksen)
- palette: mid / analogous / hue 262 → bg lavender `oklch(0.75 0.110 262)`, tinta `oklch(0.16 0.030 262)`

## 3 arah desain + arah terpilih
1. **Ruang arsip pos**: loket kayu, kartu indeks, stempel tinta — hangat tapi mirip BidCepat/EsaiCepat (kartu pos dipakai 2 build terakhir) → TOLAK.
2. **Dasbor sekuriti gelap**: neon, radar, HUD — klise "security tool" AI, melanggar blacklist neon-di-navy → TOLAK.
3. **Papan inspeksi Swiss + stopwatch**: kisi 12 kolom, garis tebal hitam-tinta, satu warna pop limau untuk stempel, stopwatch sebagai motif deadline — jauh dari build sebelumnya, fungsional, berani → PILIH.

## Keputusan berani
Tidak ada hero marketing dan tidak ada navbar menu: pengunjung langsung berhadapan dengan loket — satu baris raksasa "SERAHKAN TAUTANMU" + kolom input terminal. Navigasi = progres pemeriksaan (4 pos: serah → bedah → stempel → arsip).

## Persona/suara
**Petugas loket verifikasi** — formal, tegas, hemat kata, seperti petugas memeriksa dokumen di meja. Judul: "Loket verifikasi". Tombol: "Periksa tautan". Error: "Formulir belum lengkap: kolom tautan kosong." Empty: "Loket buka. Serahkan tautan untuk diperiksa." Loading: "Dokumen diterima. Memeriksa keaslian…" Verdict: "Stempel: WASPADA." Semua copy satu suara sampai footer.

## Palet (harmoni analogous hue 262, mode mid)
Psikologi: ungu-lavender dingin = teliti dan institusional (kantor, laboratorium), pop limau = sorotan stabilo petugas pemeriksa.
Token final (OKLCH, kontras dicek — teks 0.16/0.75 lolos AA 12.4:1; muted 0.32/0.75 lolos AA 7.1:1; aksen hanya untuk grafis/besar):
- --bg: oklch(0.75 0.110 262) | --surface: oklch(0.60 0.110 262)
- --text: oklch(0.16 0.030 262) | --muted: oklch(0.32 0.040 262)
- --accent: oklch(0.55 0.220 292) (dirapatkan lightness 0.67→0.55 demi kontras grafis)
- --accent-2: oklch(0.50 0.210 232)
- --pop: oklch(0.81 0.248 120) (stabilo limau — stempel & sorotan, <5% area)
- Verdict semantik: aman oklch(0.72 0.20 145), siaga oklch(0.78 0.18 85), bahaya oklch(0.62 0.24 25)

## Font (3 ukuran SAJA — constraint seed)
- Display: **Sofia** (fontsource `sofia`) — untuk kata stempel raksasa & logo tangan "VerifLomba".
- Body/UI: **Asul** (fontsource `asul`, 400+700) — seluruh teks fungsional.
- Aksen: **Playwrite HU Guides** (fontsource `playwrite-hu-guides`) — catatan tangan petugas ("diperiksa 19 Okt 2026 ✓").
- Ukuran: `--fs-s: 1rem` (semua body/label/input), `--fs-m: 1.5rem` (sub-judul), `--fs-xl: clamp(3.5rem, 13vw, 11rem)` (display). Tidak ada ukuran lain.

## Ikon (solid blocky, custom hand-built SVG — 14 ikon)
tautan/rantai, stopwatch, stempel, centang-kotak, segitiga-waspada, silang-kotak, kaca-pembesar, dokumen, kalender, dompet, telepon, gembok, panah-kanan, bendera. Gaya: geometri balok, sudut tajam, fill solid tinta. 3+ custom sesuai domain: stopwatch, stempel, rantai-tautan.

## Gerak (A–E, satu narasi: "menyelam ke dalam mesin loket")
- **A kamera**: hero di-pin; scroll men-zoom (scale 1→2.2) menembus huruf "O" raksasa menuju ruang terminal; akhir halaman zoom-out ke dinding stempel. Drag: rel riwayat bisa diseret (lihat D).
- **B marquee**: 2 band (ikon SVG + teks) arah berlawanan di bawah hero & atas footer; skew mengikuti velocity scroll.
- **C teks**: judul section berupa outline stroke yang terisi tinta seiring scroll (scrub).
- **D input**: rel kartu riwayat drag dengan momentum/inertia (custom rAF); tombol "Periksa tautan" magnetic ringan; hover kartu temuan menggeser.
- **E reveal**: kartu verdict muncul lewat morph blob-mask SVG (clip-path animasi); temuan list reveal stagger.
- MODE RINGAN: matikan zoom kamera (ganti potong adegan), marquee jadi statis, drag rail jadi scroll native.
- Narasi penyatu: scroll = berjalan masuk ke loket → menyerahkan dokumen → mesin mencetak → stempel dibanting → arsip.

## Storyboard hero moment
| Scroll | Terlihat | Kamera | Marquee | Teks | Interaksi |
|---|---|---|---|---|---|
| 0% | "SERAHKAN TAUTANMU" raksasa + stopwatch | — | band 1 jalan | scramble judul | — |
| 25% | zoom menembus huruf O | scale 1→2.2 pinned | band 1 skew | outline→fill | — |
| 50% | ruang terminal: input + tombol | tiba di mesin | — | — | ketik URL, tekan Periksa |
| 75% | baris log tercetak, odometer skor | — | band 2 masuk | — | checklist manual |
| 100% | stempel verdict + dinding arsip | zoom-out ringan | band 2 | — | seret rel riwayat |

Pertunjukan utama: stempel verdict dibanting (scale 3→1 + rotasi -8° + bunyi visual "DUK") tepat setelah odometer berhenti. 5 detik pertama: tipografi raksasa + stopwatch berdetak + marquee — jelas ini loket pemeriksaan lomba.

## Konten (16 pola nyata, generik — bukan tuduhan ke pihak spesifik)
1. Tautan dipendekkan, tujuan asli disembunyikan. 2. Diminta transfer ke rekening atas nama pribadi. 3. Biaya pendaftaran tidak wajar untuk lomba pelajar. 4. Nama penyelenggara tidak bisa dilacak. 5. Kontak hanya nomor pribadi, tanpa kanal resmi. 6. Desakan "kuota terbatas, daftar sekarang". 7. Hadiah fantastis tanpa mekanisme penjurian. 8. Akun penyebar baru tanpa riwayat. 9. Ejaan berantakan di pengumuman. 10. Diminta data sensitif (NIK/foto KTP) di awal. 11. Formulir anonim tanpa identitas panitia. 12. Deadline tidak jelas/berubah-ubah. 13. Testimoni tanpa nama terverifikasi. 14. Klaim "didukung oleh" tanpa bukti. 15. Syarat utama = sebar ke N grup. 16. Pemenang tidak pernah diumumkan.
Easter egg: klik stopwatch 5× → mode inspektur (bobot tiap heuristik ditampilkan).

## Teknik visual orisinal (2+)
1. Stopwatch SVG generatif berdetak (jarum via rAF, angka countdown deadline).
2. Stempel verdict: teks pada path melingkar + tekstur grunge feTurbulence.
3. Pola kisi Swiss via repeating-linear-gradient + nomor pos.

## Suara
Tidak (tetap mute; fokus ke gerak).
