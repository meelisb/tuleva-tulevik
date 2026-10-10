// Elukaare demo salvestus pitch'i jaoks: liige võtab kõik korraga välja → Elukaare soovitus → fondipension ja riiklik pension 2 a hiljem.
// Kasutus: node scripts/demo/record.mjs <väljundkaust> [URL]   (vaikimisi http://localhost:8766/elukaar/)
// Seejärel: node scripts/demo/encode.mjs <väljundkaust>   → elukaar_demo.mp4
import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = process.argv[2];
const URL = process.argv[3] || 'http://localhost:8766/elukaar/';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
await p.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;left:-50px;top:-50px;width:22px;height:22px;border-radius:50%;background:rgba(0,108,230,.35);border:2px solid #006ce6;z-index:99999;pointer-events:none;transform:translate(-50%,-50%);transition:width .15s,height .15s';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.width = c.style.height = '34px'; }, true);
    addEventListener('mouseup', () => { c.style.width = c.style.height = '22px'; }, true);
  });
});
const wait = (ms) => p.waitForTimeout(ms);
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);
async function tap(sel, pause = 700) {
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded(); await wait(250);
  const bx = await el.boundingBox();
  await p.mouse.move(bx.x + Math.min(bx.width / 2, 60), bx.y + bx.height / 2, { steps: 18 });
  await wait(200); await p.mouse.down(); await p.mouse.up(); await wait(pause);
}
const choose = (n, v, pause) => tap(`label:has(input[name="${n}"][value="${v}"])`, pause);
const next = (pause = 900) => tap('#nextBtn', pause);
async function toResult() { let g = 0; while (!(await p.isVisible('#answer')) && g++ < 12) await next(450); }
async function center(id, ms) { await p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'smooth' }), id); await wait(ms); }
async function toStep(n) { let g = 0; while (!(await p.isVisible(`#h${n}`)) && g++ < 12) await tap('#backBtn', 350); }

const t0 = Date.now();
await p.goto(URL, { waitUntil: 'networkidle' });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1 });
await wait(1500);
await tap('#prefillBtn', 2600); log('eeltäidetud');
await next(1500); log('55');
await next(1100); log('60');
await choose('payout', 'lump', 800);
await choose('p3pa', 'lump', 1500);
await next(1100); await next(900); await next(1100); log('kulud');
await choose('pkg', 'mugav', 2000);
await toResult(); log('tulemus 1');
await center('answer', 4500);
await center('actionWarn', 3500);
await p.screenshot({ path: OUT + '/frame_lump.png' });
await tap('#actionWarn [data-goto]', 1300); log('soovitus: 61 a');
await choose('payout', 'fund', 700);
await choose('p3pa', 'fund', 1200); log('fondipension');
await next(1200); log('pensioniiga');
await p.locator('input[name="defer"][value="2"]').waitFor({ state: 'attached' });
await choose('defer', '2', 1500); log('2 a hiljem');
await toResult(); log('tulemus 2');
await center('answer', 4500);
await p.screenshot({ path: OUT + '/frame_final.png' });
await center('compare', 4500); log('lõpp');
await cdp.send('Page.stopScreencast');
const end = frames.length ? frames[frames.length - 1].ts + 1.5 : 0;
fs.mkdirSync(OUT + '/frames', { recursive: true });
frames.forEach((f, i) => fs.writeFileSync(OUT + '/frames/' + String(i).padStart(5, '0') + '.jpg', Buffer.from(f.data, 'base64')));
fs.writeFileSync(OUT + '/frames/index.json', JSON.stringify({ t: frames.map((f) => f.ts - frames[0].ts), end: end - frames[0].ts }));
console.log('kaadreid', frames.length, 'kestus', (end - frames[0].ts).toFixed(1), 's');
await ctx.close(); await b.close();
