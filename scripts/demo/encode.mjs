// Kodeerib record.mjs-i kaadrid videoks Chrome'i enda kodeerijaga (MediaRecorder), ilma ffmpeg-ita.
// Kasutus: node scripts/demo/encode.mjs <kaust> [mp4|webm]   → <kaust>/elukaar_demo.mp4 (H.264, 1600×900, 30 kaadrit/s)
import { chromium } from 'playwright-core';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.resolve(process.argv[2]);
const fmt = process.argv[3] || 'mp4';
const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'encode.html'));
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/encode.html') { res.setHeader('Content-Type', 'text/html'); return res.end(html); }
  const f = path.join(dir, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const mime = fmt === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4;codecs=avc1.640028';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto(`http://127.0.0.1:${port}/encode.html?mime=${encodeURIComponent(mime)}`);
const b64 = await p.evaluate(() => window.encode(), null, { timeout: 0 });
const out = path.join(dir, 'elukaar_demo.' + fmt);
fs.writeFileSync(out, Buffer.from(b64, 'base64'));
console.log('kirjutatud', out, (fs.statSync(out).size / 1e6).toFixed(1), 'MB');
await b.close(); server.close();
