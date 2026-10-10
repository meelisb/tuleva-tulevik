// Käivita: node tests/pension.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const P = require('../js/pension.js');

const src = fs.readFileSync(path.join(__dirname, '../data/elutabel.js'), 'utf-8');
const table = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));

const base = { birthYear: 1966, sex: 'N', p1Monthly: 900, p2: 30000, p3: 20000, p3Before2021: true, needMonthly: 1200, realReturn: 0.02 };
const [A, B, C, D] = P.SCENARIOS;
const Cx = { ...C, deferral: 2 };

// Elutabel vastab Statistikaameti 2025 numbritele.
assert.strictEqual(table.elada_jaanud.M[65], 16.33);
assert.strictEqual(table.elada_jaanud.N[65], 21.43);
assert.strictEqual(P.fundPensionTerm(table, 'M', 65), 16);
assert.strictEqual(P.fundPensionTerm(table, 'N', 65), 21);
// Ellujäämine: 65-aastasest mehest elab 81-aastaseks umbes 51%.
assert.ok(Math.abs(P.survival(table, 'M', 65, 81) - 0.51) < 0.01);

// Pensioniiga.
assert.strictEqual(P.pensionAge(1961).label, '65 a');
assert.strictEqual(P.pensionAge(1962).label, '65 a 1 k');
assert.ok(P.pensionAge(1970).label.startsWith('u '));

// Riiklik pension 2 aastat hiljem on 16,88% suurem ja enne seda null.
const c = P.simulate(base, table, Cx);
assert.ok(Math.abs(c.rows.find((x) => x.age === 70).i1 - 900 * 1.1688) < 0.01);
assert.strictEqual(c.rows.find((x) => x.age === 65).i1, 0);

// Väike vajadus: ühe lepinguga (B) lõpeb samba raha perioodi lõpus, igal aastal uuendades (D) mitte.
const small = { ...base, needMonthly: 900 };
const b = P.simulate(small, table, B), d = P.simulate(small, table, D);
assert.ok(b.rows.find((x) => x.age === 85).i23 > 0 && b.rows.find((x) => x.age === 86).i23 === 0, 'B väljamakse lõpeb 86-aastaselt (21 a)');
assert.ok(d.rows.find((x) => x.age === 100).i23 > 0, 'D maksab ka 100-aastaselt');

// Ühine kulureegel: keegi ei kuluta üle vajaduse ega alla nulli.
for (const s of P.SCENARIOS) {
  const r = P.simulate(base, table, s.id === 'C' ? Cx : s);
  assert.ok(r.rows.every((x) => x.spend <= base.needMonthly + 0.01 && x.spend >= 0), s.id);
}

// Jätkusuutlik kulu on katmise piir.
for (const s of [B, D]) {
  const L = P.sustainableNeed(base, table, s);
  const ok = P.simulate(base, table, s, L), over = P.simulate(base, table, s, L + 50);
  assert.ok(ok.coversNeedUntil === null || ok.coversNeedUntil > ok.horizonAge, s.id + ' L katab');
  assert.ok(over.coversNeedUntil !== null && over.coversNeedUntil <= over.horizonAge, s.id + ' L+50 ei kata');
}

// Sissemaksed: II sammas 4% + riigi 4% palgast, III sammas oma kuumakse.
assert.strictEqual(P.yearlyContribution({ grossMonthly: 2000, p2Rate: 0.04, p3Monthly: 100 }), 2000 * 12 * 0.08 + 1200);
assert.strictEqual(P.yearlyContribution({ grossMonthly: 2000, p2Rate: 0, p3Monthly: 0 }), 0);
const withC = P.simulate({ ...base, birthYear: 1970, grossMonthly: 2500, p2Rate: 0.02, p3Monthly: 100 }, table, B);
const noC = P.simulate({ ...base, birthYear: 1970 }, table, B);
assert.ok(withC.expectedLifetime > noC.expectedLifetime, 'sissemaksed suurendavad sissetulekut');
// Pensioniea valik nihutab riikliku pensioni algust.
assert.strictEqual(P.simulate({ ...base, pensionAgeYears: 66 }, table, B).rows.find((x) => x.age === 65).i1, 0);

// Kulud statistikast: üksik 65+ ja paar, kõik kategooriad olemas ja positiivsed.
const ks = fs.readFileSync(path.join(__dirname, '../data/kulud.js'), 'utf-8');
const kulud = JSON.parse(ks.slice(ks.indexOf('{'), ks.lastIndexOf('}') + 1));
assert.ok(kulud.kategooriad.length >= 10 && kulud.kategooriad.every((c) => c.uksi > 0 && c.paar > 0));
const total = kulud.kategooriad.reduce((a, c) => a + c.uksi, 0);
assert.ok(total > 600 && total < 1200, 'üksik 65+ kulud mõistlikus vahemikus: ' + total);

for (const s of P.SCENARIOS) {
  const r = P.simulate(base, table, s.id === 'C' ? Cx : s);
  console.log(s.id, 'katab', r.coversNeedUntil, 'raha lõpeb', r.moneyEndAge, '90a', r.spendAt90.toFixed(0),
    'jätkusuutlik', P.sustainableNeed(base, table, s.id === 'C' ? Cx : s), 'horisont', r.horizonAge, 'E', r.expectedLifetime.toFixed(0));
}
console.log('OK');
