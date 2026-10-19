// node tools/capture.js <URL> <folder-output>
// Merekam video 390x844 sambil auto-scroll 9 detik (untuk showcase hero moment).
const { chromium } = require('playwright');
const url = process.argv[2];
const out = process.argv[3] || 'screenshots';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
    recordVideo: { dir: out, size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    const dur = 9000;
    await new Promise(res => {
      const s = performance.now();
      const step = () => {
        const p = Math.min((performance.now() - s) / dur, 1);
        window.scrollTo(0, total * p);
        p < 1 ? requestAnimationFrame(step) : res();
      };
      step();
    });
  });
  await page.waitForTimeout(800);
  await ctx.close();
  await browser.close();
  console.log('Video tersimpan di', out);
})();
