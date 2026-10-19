// node tools/pick-seed.js [YYYY-MM-DD]
// Memanggil seed.js dengan tanggal dasar; kalau terlalu mirip build lama, coba tanggal berikutnya.
// Hasil lolos disimpan ke builds/<tanggal dasar>/seed.json dan dicetak ke layar.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || new Date().toISOString().slice(0, 10);
const buildsDir = 'builds';
const pal = s => s.palette.mode + '/' + s.palette.harmony;
const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

const prev = fs.existsSync(buildsDir)
  ? fs.readdirSync(buildsDir)
      .filter(d => d !== base && fs.existsSync(path.join(buildsDir, d, 'seed.json')))
      .sort().reverse().slice(0, 30)
      .map(d => JSON.parse(fs.readFileSync(path.join(buildsDir, d, 'seed.json'), 'utf8')))
  : [];

function check(s) {
  const reasons = [];
  prev.slice(0, 14).forEach((p, i) => {
    const diff = [
      s.layout !== p.layout,
      s.fonts.display !== p.fonts.display,
      pal(s) !== pal(p),
      s.motion.camera !== p.motion.camera,
      s.domain !== p.domain,
    ].filter(Boolean).length;
    if (diff < 4) reasons.push(`mirip build ke-${i + 1} sebelumnya (hanya ${diff}/5 sumbu beda)`);
  });
  if (prev.slice(0, 30).some(p => p.fonts.display === s.fonts.display)) reasons.push('font display dipakai dalam 30 build terakhir');
  if (prev.slice(0, 7).some(p => p.fonts.body === s.fonts.body)) reasons.push('font body dipakai dalam 7 build terakhir');
  if (prev.slice(0, 7).some(p => pal(p) === pal(s))) reasons.push('kombinasi mode/harmoni palet dipakai dalam 7 build terakhir');
  if (prev.slice(0, 7).some(p => p.icons.style === s.icons.style)) reasons.push('gaya ikon dipakai dalam 7 build terakhir');
  return reasons;
}

for (let k = 0; k < 200; k++) {
  const seedDate = addDays(base, k);
  const raw = execFileSync('node', [path.join(__dirname, 'seed.cjs'), seedDate], { encoding: 'utf8' });
  const s = JSON.parse(raw);
  const reasons = check(s);
  if (reasons.length === 0) {
    s.buildDate = base;
    fs.mkdirSync(path.join(buildsDir, base), { recursive: true });
    fs.writeFileSync(path.join(buildsDir, base, 'seed.json'), JSON.stringify(s, null, 2));
    console.log(JSON.stringify(s, null, 2));
    process.exit(0);
  }
  console.error(`seed ${seedDate} ditolak: ${reasons.join('; ')}`);
}
console.error('Gagal menemukan seed yang lolos setelah 200 percobaan.');
process.exit(1);
