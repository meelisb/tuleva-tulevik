// Tulevane Mina: arvutusloogika. Puhtad funktsioonid, töötab brauseris ja Node'is (testid).
// Kõik summad on tänastes eurodes (reaalväärtus). Mudel on aastapõhine.
(function (root) {
  'use strict';

  const CURRENT_YEAR = 2026;
  const MAX_AGE = 100;

  // SKA paindliku vanaduspensioni keskmised tõusud 2026 (edasilükkamine aastates).
  // https://sotsiaalkindlustusamet.ee/en/pension-and-benefits/types-pensions/flexible-pension
  const DEFERRAL_INCREASE = { 0: 0, 1: 0.0793, 2: 0.1688, 3: 0.2701, 4: 0.385, 5: 0.5157 };

  const TAX_SHORT = 0.10; // ühekordne, osaline ja lühike fondipension pensioniea lähedal

  // Pensioniiga kalendriaasta järgi (aastad, kuud). 2028 ja 2029 on eelnõud; edasi teadmata.
  function pensionAge(birthYear) {
    const y65 = birthYear + 65;
    let months = 0;
    if (y65 === 2027) months = 1;
    else if (y65 === 2028) months = 3;
    else if (y65 >= 2029) months = 4;
    return { years: 65, months: months, known: y65 <= 2027, label: '65 a' + (months ? ' ' + months + ' k' : '') };
  }

  // Tõenäosus olla elus vanuses `age`, kui praegu ollakse elus vanuses `fromAge`.
  function survival(table, sex, fromAge, age) {
    const s = table.ellujaajad[sex];
    if (age > MAX_AGE) return 0;
    if (age <= fromAge) return 1;
    return s[age] / s[fromAge];
  }

  // Fondipensioni soovituslik periood: elada jäänud aastad vanuse ja soo järgi, täisaastateks ümardatud.
  function fundPensionTerm(table, sex, age) {
    return Math.max(1, Math.round(table.elada_jaanud[sex][Math.min(age, MAX_AGE)]));
  }

  function decisionMap(input) {
    const pa = pensionAge(input.birthYear);
    const at = (age) => input.birthYear + age;
    const p3Age = input.p3Before2021 ? 55 : 60;
    return [
      { age: p3Age, year: at(p3Age), title: 'III sammas soodusmaksuga',
        text: 'Väljamaksed 10% tulumaksuga (regulaarne pikk väljamakse 0%), kui kogumist on vähemalt 5 aastat.' +
          (input.p3Before2021 ? ' Alates 55, sest alustasid enne 2021.' : ' Alates 60, sest alustasid 2021 või hiljem.') },
      { age: 60, year: at(60), title: 'II sammas ja paindlik riiklik pension',
        text: 'II sammas: ühekordne või lühike fondipension 10%, pikk fondipension 0%. Väljamaksete alustamisel lõpevad II samba sissemaksed igaveseks. Riiklikku pensioni saab võtta kuni 5 aastat varem, vähendatult.' },
      { age: pa.years, year: at(pa.years), title: 'Riiklik pension täissummas (' + pa.label + ')',
        text: pa.known ? 'Pensioniiga on kehtestatud.' : 'Pensioniiga arvutatakse igal aastal uuesti Statistikaameti eluea järgi, seega see on ligikaudne.' },
      { age: pa.years + 1, year: at(pa.years + 1), title: 'Riikliku pensioni edasilükkamine',
        text: 'Iga edasilükatud aasta tõstab riiklikku pensioni eluks ajaks: +7,93% (1 a) kuni +51,57% (5 a), 2026 keskmised.' },
    ];
  }

  // Ühe stsenaariumi aastane rahavoog vanusest startAge kuni MAX_AGE.
  function simulate(input, table, scenario) {
    const r = input.realReturn;
    const pa = pensionAge(input.birthYear).years;
    const currentAge = CURRENT_YEAR - input.birthYear;
    const startAge = Math.max(currentAge, 55);
    const deferral = scenario.id === 'C' ? scenario.deferral : 0;
    const p1Start = pa + deferral;
    const p1Monthly = input.p1Monthly * (1 + DEFERRAL_INCREASE[deferral]);
    const needYear = input.needMonthly * 12;

    // Samba vara kasvab kuni kasutamiseni (uusi sissemakseid v1 ei arvesta).
    let fund = input.p2 + input.p3;
    for (let a = currentAge; a < pa; a++) fund *= 1 + r;

    let cash = 0; // A: pärast ühekordset väljamakset hoiusel, reaaltootlus 0
    let term = 0, termStart = 0; // B ja C: pikk fondipension
    if (scenario.id === 'A') { cash = fund * (1 - TAX_SHORT); fund = 0; }
    if (scenario.id === 'B') { term = fundPensionTerm(table, input.sex, pa); termStart = pa; }

    const rows = [];
    for (let age = startAge; age <= MAX_AGE; age++) {
      const i1 = age >= p1Start ? p1Monthly * 12 : 0;
      const balance = scenario.id === 'A' ? cash : fund;
      let i23 = 0;
      if (age >= pa) {
        if (scenario.id === 'A') {
          const take = Math.min(cash, Math.max(0, needYear - i1));
          cash -= take; i23 = take;
        } else if (scenario.id === 'B' || age >= p1Start) {
          if (scenario.id === 'C' && term === 0) { term = fundPensionTerm(table, input.sex, age); termStart = age; }
          const left = term - (age - termStart);
          if (left > 0 && fund > 0) {
            i23 = fund / left;
            fund = (fund - i23) * (1 + r);
          }
        } else {
          // C sild: enne riikliku pensioni algust kata vajadus sambast, maks 10%.
          const gross = Math.min(fund, needYear / (1 - TAX_SHORT));
          fund = (fund - gross) * (1 + r);
          i23 = gross * (1 - TAX_SHORT);
        }
      }
      rows.push({
        age: age,
        year: input.birthYear + age,
        balance: balance,
        i1: i1 / 12,
        i23: i23 / 12,
        total: (i1 + i23) / 12,
        alive: survival(table, input.sex, currentAge, age),
      });
    }
    return summarize(rows, input, pa, p1Start);
  }

  function summarize(rows, input, pa, p1Start) {
    const fromPa = rows.filter((x) => x.age >= pa);
    const empty = fromPa.find((x) => x.balance < 1);
    const fundEndAge = empty ? empty.age : null; // null = samba raha ei lõpe enne 100
    const short = fromPa.find((x) => x.total < input.needMonthly - 0.5);
    const after = fundEndAge ? rows.find((x) => x.age === fundEndAge) : null;
    const expectedLifetime = fromPa.reduce((s, x) => s + x.total * 12 * x.alive, 0);
    const startRow = rows.find((x) => x.age === pa) || rows[0];
    return {
      rows: rows,
      pensionStartAge: pa,
      p1StartAge: p1Start,
      startIncome: startRow.total,
      fundEndAge: fundEndAge,
      incomeAfterFund: after ? after.i1 : 0,
      coversNeedUntil: short ? short.age : null, // null = katab kuni 100
      aliveAtFundEnd: after ? after.alive : 0,
      expectedLifetime: expectedLifetime,
    };
  }

  const SCENARIOS = [
    { id: 'A', name: 'Kõik korraga', short: 'II ja III sammas ühekordselt välja (10% maks), raha hoiusel, kasutad vajaduse järgi.' },
    { id: 'B', name: 'Pikk fondipension', short: 'II ja III sammas maksuvaba fondipensionina elada jäänud aastate jooksul, riiklik pension kohe.' },
    { id: 'C', name: 'Sild ja riiklik pension hiljem', short: 'Esimesed aastad elad samba rahast (10% maks), riiklik pension algab hiljem ja on eluks ajaks suurem.' },
  ];

  const api = { CURRENT_YEAR, DEFERRAL_INCREASE, SCENARIOS, pensionAge, survival, fundPensionTerm, decisionMap, simulate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Pension = api;
})(typeof window !== 'undefined' ? window : globalThis);
