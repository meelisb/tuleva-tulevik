// Tulevane Mina: tasuvusmudel. Mitu kogujat peab Elukaare toel valima ühekordse väljamakse asemel fondipensioni,
// et tööriista ehitus ja ülalpidamine end ära tasuks? Ja kas Tulevas on nii palju otsustajaid?
//
// Loogika: ühekordse väljamakse korral lahkub raha fondist kohe. Fondipensioni korral jääb see fondi ja väheneb
// väljamaksete kaupa aastate jooksul. Iga fondis püsiv euro toob Tuleva grupile (fondivalitseja + ühistu litsentsitasu)
// marginaali. Ühistu lubadus: mida suurem maht, seda väiksem tasu kõigile (siht 0,22% 3 mld € juures).
//
// Kasutus: node scripts/kulumudel.js [--saldo 40000] [--marginaal 0.0016] [--diskont 0.03] [--tootlus 0.02] [--vanus 65]
//          [--naisi 0.5] [--korraga-jaab 0] [--ehitus 50000] [--hooldus 15000] [--aastad 5] [--mojus 0.1]
// Kõik summad tänases rahas (reaalväärtus). Statistikaameti elutabel: data/elutabel.js.
// Vaikeväärtuste allikad: docs/kulumudel.md.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../data/elutabel.js'), 'utf-8');
const T = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? Number(process.argv[i + 1]) : def; };
const P = {
  saldo: arg('saldo', 40000),          // II + III samba raha väljamakse alguses, €
  // Tuleva grupi marginaal fondimahu euro kohta aastas: (brutomarginaal pärast litsentsitasu + litsentsitasu ühistule) / maht.
  // 09/2026: (158 809 + 74 636) € × 12 / 1 786 M€ ≈ 0,157%. Liikme makstav jooksvate tasude määr 0,28% sisaldab ka
  // alusfondide kulusid, mida Tuleva ei teeni, seega 0,28% ei ole õige marginaal.
  marginaal: arg('marginaal', 0.0016),
  diskont: arg('diskont', 0.03),       // reaalne diskontomäär
  tootlus: arg('tootlus', 0.02),       // fondi reaaltootlus pärast tasusid
  vanus: arg('vanus', 65),             // väljamakse algus
  naisi: arg('naisi', 0.5),            // naiste osa pensionile minejatest
  korragaJaab: arg('korraga-jaab', 0), // osa ühekordsest väljamaksest, mis jääb Tuleva fondi (nt Täiendav Kogumisfond)
  ehitus: arg('ehitus', 50000),        // ühekordne arendus, €
  hooldus: arg('hooldus', 15000),      // ülalpidamine aastas, €
  aastad: arg('aastad', 5),            // kui mitu aastat kulusid arvestame
  mojus: arg('mojus', 0.10),           // tööriista kasutajate osa, kes muudab otsuse ühekordselt väljamakselt fondipensionile
};

const term = (sex, age) => Math.max(1, Math.round(T.elada_jaanud[sex][Math.min(age, 100)]));
const alive = (sex, a0, a) => (a > 100 ? 0 : T.ellujaajad[sex][a] / T.ellujaajad[sex][a0]);

// Ühe koguja fondis püsiv raha aastate kaupa. Surma korral läheb raha pärijatele (eeldame, et lahkub fondist).
// viis: 'fund' = üks leping elada jäänud aastate peale (maksuvaba), 'renew' = leping igal aastal uuesti, 'n10' = 10 aastat (10% maks).
function flows(sex, viis, p) {
  const a0 = p.vanus;
  let bal = p.saldo, left = viis === 'n10' ? 10 : term(sex, a0);
  const out = [];
  for (let a = a0; a <= 100 && bal > 0.01; a++) {
    const pay = viis === 'renew' ? bal / term(sex, a) : left > 0 ? bal / left : bal;
    left--;
    const avg = (bal - pay) * (1 + p.tootlus / 2); // keskmine fondimaht aasta jooksul (väljamakse aasta alguses)
    out.push({ t: a - a0, aum: avg * alive(sex, a0, a) });
    bal = (bal - pay) * (1 + p.tootlus);
  }
  return out;
}

// Väärtus ühe ümber suunatud koguja kohta: fondimahu-aastad ja marginaali nüüdisväärtus.
function value(viis, p) {
  let aumYears = 0, pv = 0;
  for (const [sex, w] of [['N', p.naisi], ['M', 1 - p.naisi]]) for (const f of flows(sex, viis, p)) {
    aumYears += w * f.aum;
    pv += w * f.aum * p.marginaal / Math.pow(1 + p.diskont, f.t);
  }
  // Kui osa ühekordsest väljamaksest jääks niikuinii Tuleva fondi, on tööriista lisaväärtus selle võrra väiksem.
  return { aumYears: aumYears * (1 - p.korragaJaab), pvMargin: pv * (1 - p.korragaJaab) };
}

const costPV = (p) => { let c = p.ehitus; for (let y = 0; y < p.aastad; y++) c += p.hooldus / Math.pow(1 + p.diskont, y); return c; };
const eur = (v) => Math.round(v).toLocaleString('et-EE') + ' €';

if (require.main === module) {
  const c = costPV(P);
  console.log('Eeldused:', JSON.stringify(P));
  console.log('Kulud (nüüdisväärtus, ' + P.aastad + ' a): ' + eur(c) + '\n');
  console.log('Väljamakse viis'.padEnd(34) + 'fondimahu-aastad'.padStart(18) + '  marginaal NV'.padStart(16) + '  tasuvuspunkt (kogujat)'.padStart(25) + '  vajalik kasutajaid'.padStart(20));
  for (const [viis, nimi] of [['fund', 'Fondipension, üks leping'], ['renew', 'Fondipension, leping igal aastal'], ['n10', 'Fondipension 10 aastat (10% maks)']]) {
    const v = value(viis, P);
    const n = Math.ceil(c / v.pvMargin);
    console.log(nimi.padEnd(34) + (v.aumYears / P.saldo).toFixed(1).padStart(16) + '×  ' + eur(v.pvMargin).padStart(14) + String(n).padStart(25) + String(Math.ceil(n / P.mojus)).padStart(20));
  }
  const perEuro = value('fund', P).pvMargin / P.saldo;
  console.log('\nÜmber suunatud ühekordse väljamakse euro väärtus: ' + (perEuro * 100).toFixed(2) + ' senti.');
  console.log('Tasuvuseks tuleb ' + P.aastad + ' aasta jooksul ümber suunata ' + eur(c / perEuro) + ' ühekordseid väljamakseid (' + eur(c / perEuro / P.aastad) + ' aastas).');
  console.log('\nFondimahu-aastad × saldo = fondis püsiv raha aastate peale kokku (ellujäämisega kaalutud, ilma diskontota).');
  console.log('Tasuvuspunkt = kulude nüüdisväärtus / ühe ümber suunatud koguja marginaali nüüdisväärtus.');
}

module.exports = { value, costPV, flows, term };
