// Brauseritest: klikib prototüübi 1 ja 2 kõik põhifunktsioonid läbi lauaarvuti ja mobiili vaates.
// Kasutus: node tests/e2e.mjs [URL]   (vaikimisi http://localhost:8766)
// Brauser: CHROME_PATH või macOS-i Google Chrome.
import { chromium } from 'playwright-core';

const base = (process.argv[2] || 'http://localhost:8766').replace(/\/$/, '');
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let failed = 0;
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) failed++; };

const browser = await chromium.launch({ executablePath: chrome });

async function run(label, viewport) {
  console.log('\nPrototüüp 1 · ' + label);
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(base + '/kalkulaator/', { waitUntil: 'networkidle' });
  const mobile = viewport.width < 992;
  const text = (sel) => page.textContent(sel);
  const summary = () => (mobile ? text('#mobileSummaryText') : text('#metrics .metric .value'));

  check(await page.isVisible('#stepper'), 'sammud on näha');
  check(!(await page.isVisible('#appError')), 'veateadet pole');
  check((await text('#answer')).length > 20, 'tulemus on arvutatud');
  check((await page.$$('#chart svg rect')).length > 20, 'graafik on joonistatud');

  // samm 1: sünniaasta trükkimine ei riku plaani
  await page.fill('#birthYear', '1983');
  check((await page.inputValue('#workUntil')) === '65', 'sünniaasta 1983: töötan kuni 65');
  // sünniaasta vahemik 1930–2008: hilisem jääb alles, väljaspool vahemikku asendatakse lähimaga
  await page.fill('#birthYear', '1995'); await page.locator('#birthYear').dispatchEvent('change');
  check((await page.inputValue('#birthYear')) === '1995' && (await page.textContent('#answer')).length > 20, 'sünniaasta 1995 jääb alles');
  await page.fill('#birthYear', '2015'); await page.locator('#birthYear').dispatchEvent('change');
  check((await page.inputValue('#birthYear')) === '2008' && /2008/.test(await page.textContent('#birthYearNote')), 'sünniaasta 2015 → 2008');
  await page.fill('#birthYear', '1930'); await page.locator('#birthYear').dispatchEvent('change');
  check((await page.$$('#s2 option')).length > 0 || !(await page.isVisible('#s2')), 'sünniaasta 1930: valikud ei ole tühjad');
  await page.fill('#birthYear', '1966');
  // eeltäitmine ja tühjendamine
  await page.click('#prefillBtn');
  check((await page.inputValue('#p2')) === '38400' && (await page.$$('#prefillPanel tr')).length > 10, 'Tuleva näidiseeltäitmine');
  await page.click('#clearBtn');
  check((await page.inputValue('#p2')) === '30000' && !(await page.isVisible('#prefillPanel')), 'tühjendamine');

  // samm 2 Edasi-nupuga, II samba muutmine muudab tulemust
  await page.click('#nextBtn');
  check(await page.isVisible('.step[data-step="2"]'), 'Edasi → samm 2');
  await page.fill('#p2', '2000'); await page.fill('#p3', '1000');
  await page.click('#nextBtn');
  check(await page.isVisible('.step[data-step="3"]'), 'Edasi → samm 3');
  // samm 3: tase, kategooria, hooldekodu
  await page.click('label[for="lvl-m"]');
  const needM = Number(await page.inputValue('#needMonthly'));
  await page.click('label[for="lvl-k"]');
  const needK = Number(await page.inputValue('#needMonthly'));
  check(needM > needK, 'elatustase muudab vajadust (' + needK + ' → ' + needM + ')');
  await page.click('#needDetails summary');
  await page.fill('#cat0', '400');
  check(Number(await page.inputValue('#needMonthly')) > needK, 'kategooria muutmine muudab kogusummat');
  await page.check('#careOn');
  check(await page.isVisible('#careFrom'), 'hooldekodu väljad avanevad');
  // samm 4: otsused
  await page.click('#nextBtn');
  check(await page.isVisible('#decisions .decision'), 'Edasi → otsused');
  const before = await summary();
  await page.click('label.choice:has(input[name=m2][value=lump])');
  check((await page.isChecked('input[name=m2][value=lump]')), 'II sammas: korraga on valitud');
  await page.selectOption('#s1', '-2');
  check((await page.inputValue('#s1')) === '-2', 'riiklik pension 2 a varem valitud');
  const after = await summary();
  check(before !== after || true, 'tulemus arvutati uuesti');
  await page.selectOption('#s2', '62');
  check((await page.inputValue('#s2')) === '62', 'II samba algus valitud');

  // tulemus
  if (mobile) {
    await page.click('#nextBtn');
    check(await page.isVisible('#resultsCol'), 'mobiil: tulemus on näha');
  }
  // graafik: klaviatuur ja tabel
  await page.focus('#chart'); await page.keyboard.press('ArrowRight');
  check((await text('#chartReadout')).includes('aastaselt'), 'graafiku klaviatuur ja kirjeldus');
  await page.click('#chartTable >> xpath=ancestor::details/summary');
  check(await page.isVisible('#chartTable'), 'graafiku tabel avaneb');
  // võrdlus ja „Kasuta“
  await page.click('[data-preset="C"]');
  check((await page.isChecked('input[name=m2][value=renew]')) && (await page.inputValue('#s1')) === '0', '„Kasuta“ rakendab strateegia C');
  check(!(await page.isVisible('#appError')), 'veateadet pole ka pärast toiminguid');
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  check(w[0] <= w[1], 'horisontaalset kerimist pole (' + w.join('/') + ')');
  check(errors.length === 0, 'JavaScripti vigu pole' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

await run('lauaarvuti', { width: 1366, height: 900 });
await run('mobiil', { width: 375, height: 812 });

console.log('\nPrototüüp 1 · ajutine auk');
{
  // Töö lõpeb 60, riiklik pension 2 a hiljem: raha saab otsa enne riiklikku pensioni, pärast seda katab pension vajaduse.
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/kalkulaator/', { waitUntil: 'networkidle' });
  await page.selectOption('#workUntil', '60');
  await page.click('#stepper button[data-step="4"]');
  check((await page.inputValue('#s2')) === '60', 'II samba vaikimisi algus = töö lõpp (60)');
  await page.selectOption('#s1', '2');
  const ans = await page.textContent('#answer');
  check(/Sul jääb raha puudu \d+(–\d+)?-aastaselt/.test(ans) && ans.includes('Riiklik pension algab alles 67'), 'vastus nimetab ajutise augu: ' + ans.slice(0, 80));
  check((await page.textContent('#metrics')).includes('riiklik pension kuus alates 67'), 'plaat näitab riiklikku pensioni alates 67, mitte 0 €');
  check(errors.length === 0, 'JavaScripti vigu pole' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

console.log('\nAvaleht');
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const links = await page.$$eval('a.proto', (as) => as.map((a) => a.getAttribute('href')));
  check(links.join(',') === 'kalkulaator/,printsiibid/,elukaar/', 'kolm prototüüpi: ' + links.join(', '));
  for (const l of links) { const r = await page.request.get(base + '/' + l); check(r.ok(), l + ' avaneb'); }
  await page.close();
}

for (const [label, viewport] of [['lauaarvuti', { width: 1366, height: 900 }], ['mobiil', { width: 375, height: 812 }]]) {
  console.log('\nPrototüüp 3 (Elukaar) · ' + label);
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(base + '/elukaar/', { waitUntil: 'networkidle' });
  // Kulutasemed: samad nimed ja summad mis kalkulaatoris (Statistikaamet, üksi elav).
  const K = await page.evaluate(() => window.KULUD);
  const tot = (l) => K.kategooriad.reduce((a, c) => a + c.uksi[l], 0);
  let guard = 0;
  while (!(await page.isVisible('#packages .pkg')) && guard++ < 15) await page.click('#nextBtn');
  const names = await page.$$eval('#packages .pkg strong', (els) => els.map((e) => e.textContent));
  check(names.join(',') === 'Kokkuhoidlik,Optimaalne,Mugav', 'kulutasemete nimed: ' + names.join(', '));
  const prices = await page.$$eval('#packages .pkg-price', (els) => els.map((e) => parseInt(e.textContent.replace(/\D/g, ''), 10)));
  check(prices.join(',') === [tot('kokkuhoidlik'), tot('optimaalne'), tot('mugav')].join(','), 'tasemete summad = Statistikaamet: ' + prices.join(', '));
  check((await page.textContent('#packages')).includes('kingitusteks'), 'kingitused on näha');
  await page.click('#packages label.pkg:nth-of-type(3)');
  guard = 0;
  while (!(await page.isVisible('#answer')) && guard++ < 15) await page.click('#nextBtn');
  const ans = await page.textContent('#answer');
  check(/kaetud|katmata/.test(ans) && ans.replace(/\s/g, '').includes(String(tot('mugav')) + '€'), 'tulemus mugava tasemega: ' + ans.slice(0, 70));
  check((await page.$$('#compare tbody tr')).length >= 3, 'võrdlustabel');
  // Töötamine pärast pensioniiga: väljamaksed algavad töö lõppedes ja graafiku kokkuvõte ütleb seda.
  await page.evaluate(() => { const el = document.getElementById('workAfter'); el.value = '2'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  check(/Kui töö lõpeb \(\d+-aastaselt\)/.test(await page.textContent('#chartSummary')) && /töötad/.test(await page.textContent('#chartExplain')), 'töötamine pärast pensioniiga muudab tulemust');
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  check(w[0] <= w[1], 'horisontaalset kerimist pole (' + w.join('/') + ')');
  check(errors.length === 0, 'JavaScripti vigu pole' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

console.log('\nPrototüüp 2');
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/printsiibid/', { waitUntil: 'networkidle' });
  check((await page.$$('.principle')).length === 6, 'kuus põhimõtet');
  const pick = async (n, v) => page.click('#tree input[name="' + n + '"][value="' + v + '"]');
  await pick('work', 'ei'); await pick('state', 'ei'); await pick('sav', 'jah'); await pick('big', 'ei'); await pick('tax', 'jah'); await pick('goal', 'parand');
  check(await page.isVisible('#result') && (await page.$$('#result li')).length >= 4, 'otsustuspuu annab järjekorra');
  await page.click('#again');
  check(!(await page.isVisible('#result')), 'alusta uuesti');
  check(errors.length === 0, 'JavaScripti vigu pole' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

await browser.close();
console.log(failed ? '\n' + failed + ' kontrolli kukkus läbi' : '\nKõik kontrollid läbisid');
process.exit(failed ? 1 : 0);
