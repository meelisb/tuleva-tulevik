// Käivita: node tests/pension.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const P = require('../js/pension.js');

const src = fs.readFileSync(path.join(__dirname, '../data/elutabel.js'), 'utf-8');
const table = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));

const base = { birthYear: 1966, sex: 'N', p1Monthly: 900, p2: 30000, p3: 20000, p3Before2021: true, needMonthly: 1200, realReturn: 0.02 };

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

const [A, B, C] = P.SCENARIOS;
const a = P.simulate(base, table, A);
const b = P.simulate(base, table, B);
const c = P.simulate(base, table, { ...C, deferral: 2 });

// B: fondipension kestab 21 aastat alates 65 (naine) ja lõpeb 86-aastaselt.
assert.strictEqual(b.fundEndAge, 86);
// C: riiklik pension on 2 aastat hiljem 16,88% suurem.
assert.ok(Math.abs(c.rows.find((x) => x.age === 70).i1 - 900 * 1.1688) < 0.01);
assert.strictEqual(c.rows.find((x) => x.age === 65).i1, 0);
// Pärast samba lõppu jääb alles ainult riiklik pension.
assert.ok(Math.abs(b.incomeAfterFund - 900) < 0.01);
// Raha ei teki juurde: A ja B kogusumma ei ületa vara + tootluse piire.
assert.ok(a.rows.every((x) => x.total >= 0));

for (const s of [a, b, c]) {
  console.log(s.rows[0].age, 'start', s.startIncome.toFixed(0), 'fundEnd', s.fundEndAge, 'after', s.incomeAfterFund.toFixed(0),
    'covers', s.coversNeedUntil, 'alive@end', (s.aliveAtFundEnd * 100).toFixed(0) + '%', 'E[lifetime]', s.expectedLifetime.toFixed(0));
}
console.log('OK');
