// Tulevane Mina: lugu. Sama arvutus mis kalkulaatori vaates (js/pension.js), aga etappide kaupa.
(function () {
  'use strict';

  const P = window.Pension;
  const T = window.ELUTABEL;
  const K = window.KULUD;
  const $ = (id) => document.getElementById(id);
  const eur = (v) => Math.round(v).toLocaleString('et-EE').replace(/,/g, ' ') + ' €';
  const pct = (v) => Math.round(v * 100) + '%';
  const one = (v) => (Math.round(v * 10) / 10).toLocaleString('et-EE');
  const radio = (name) => (document.querySelector('input[name="' + name + '"]:checked') || {}).value;

  // ---------- Eeldused ----------
  // Fondide reaaltootlus pärast inflatsiooni ja tasusid. Eeldused, mitte prognoos.
  const FUNDS = {
    cons: { name: 'Konservatiivne võlakirjafond', r: 0, note: 'Kõigub vähe, aga raha reaalväärtus pikalt ei kasva.' },
    mix: { name: 'Keskmine pangafond (kõrgem tasu)', r: 0.02, note: 'Osa tootlusest läheb fonditasudeks.' },
    index: { name: 'Madala tasuga indeksfond', r: 0.04, note: 'Laialt hajutatud aktsiad, väike tasu.' },
  };
  const CHILD_R = { none: 0, parent: 0, account: 0.04 };
  const PRICE = { tank: 80, mince: 10, trip: 900, cafe: 12 }; // 50 l kütust, 1 kg veisehakkliha, nädal Lõuna-Euroopas (lend + majutus), kohvikulõuna

  // Kulupaketid: Statistikaameti põhikulud + lisad. kind: joy = elamused, future = tulevik ja turvalisus.
  const PACKAGES = [
    { id: 'survive', name: 'Jään ellu', emoji: '🥔', tagline: 'Arved on makstud. Lõbuks jääb vähe.',
      extras: [] },
    { id: 'optimal', name: 'Optimaalne', emoji: '✈️', tagline: 'Saan veidi reisida ja ennast vahel hellitada.',
      extras: [['Reisid', 'travel', 150, 'joy'], ['Parem toidulaud', 'food', 50, 'joy'], ['Kino, teater, hobid', 'fun', 60, 'joy'], ['Auto ja liikumine', 'move', 40, 'joy']] },
    { id: 'comfy', name: 'Mugav', emoji: '🛋️', tagline: 'Elan hästi, investeerin edasi ja lapsed ei pea mu hoolduse eest maksma.',
      extras: [['Reisid', 'travel', 300, 'joy'], ['Toit ja restoranid', 'food', 100, 'joy'], ['Auto ja liikumine', 'move', 120, 'joy'], ['Hobid ja trenn', 'fun', 100, 'joy'],
        ['Investeerin, kingin lastelastele', 'invest', 150, 'future'], ['Hooldekodu reserv', 'care', 250, 'future']] },
  ];

  // Etappide vanusevahemikud (pensioniiga lisandub arvutuses).
  function stageAges(pa) {
    return [null, [0, 18], [18, 18], [18, 55], [55, 55], [60, 60], [pa, pa], [pa + 1, 100], null, null];
  }

  // ---------- Olek ----------
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const LAST = chapters.length - 1;
  let step = 0;
  let visited = new Set([0]);
  let legacyChoice = null;
  let chart = null;

  function readInput() {
    const num = (id) => Math.max(0, parseFloat($(id).value) || 0);
    const birthYear = Math.min(1990, Math.max(1950, parseInt($('birthYear').value, 10) || 1980));
    const currentAge = P.CURRENT_YEAR - birthYear;
    const fund18 = radio('fund18') === 'self' ? $('fund18Fund').value : 'mix';
    const fundNow = radio('fundChange') === 'switch' ? $('fundNew').value : fund18;

    const child = radio('child');
    const childMonthly = child === 'none' ? 0 : num('childMonthly');
    const rc = CHILD_R[child];
    let child18 = 0;
    for (let a = 0; a < 18; a++) child18 = child18 * (1 + rc) + childMonthly * 12;
    const childNow = radio('childKept') === '1' ? child18 * Math.pow(1 + rc, Math.max(0, currentAge - 18)) : 0;

    // Fondivahetus: minevikus vahetus on juba tänases summas. Tulevikus vahetus: seni kasvab raha vanas fondis.
    // pension.js kasutab ühte tootlust, seega teisendame vahetuseni kasvu samaväärseks tänaseks summaks (mudel on lineaarne).
    const switching = radio('fundChange') === 'switch';
    const pa = P.retirementYears({ birthYear: birthYear, pensionAgeYears: parseInt($('pensionAgeYears').value, 10) });
    const switchAge = Math.min(pa - 1, Math.max(18, parseInt($('switchAge').value, 10) || currentAge));
    const p3Before2021 = $('p3Before2021').value === '1';
    const sex = $('sex').value;
    const rateAt = (a) => (switching && a >= switchAge ? FUNDS[fundNow].r : FUNDS[fund18].r);

    // III sammas 55-aastaselt (või kohe, kui oled juba vanem). Soodusmaks alates 55 (liitunud enne 2021) või 60.
    // Enne soodusiga 22% tulumaks. Fondipension: maksuvaba alates soodusest, uus leping igal aastal (elada jäänud aastad).
    const p3Open = p3Before2021 ? 55 : 60;
    const p3Age = Math.max(55, currentAge);
    const p3Plan = p3Age < pa ? (radio('p3plan') || 'keep') : 'keep';
    const p3Use = radio('p3use') || 'spend';
    const p3Base = num('p3');
    let p3Gross = 0, p3Net = 0, p3Rem = 0, p3Tax = 0;
    if (p3Plan !== 'keep') {
      let b = p3Base;
      for (let a = currentAge; a < p3Age; a++) b *= 1 + rateAt(a);
      if (p3Plan === 'lump') {
        p3Tax = p3Age >= p3Open ? 0.10 : 0.22;
        p3Gross = b; p3Net = b * (1 - p3Tax);
      } else {
        for (let a = p3Age; a < pa; a++) {
          const pay = b / P.fundPensionTerm(T, sex, a);
          b -= pay; p3Gross += pay; p3Net += pay * (a >= p3Open ? 1 : 0.78);
          b *= 1 + rateAt(a);
        }
        p3Rem = b; // pensionieas läheb ülejääk ühisesse samba rahasse
      }
    }
    const pot0 = num('p2') + (p3Plan === 'keep' ? p3Base : 0) + childNow;
    let switchAdj = 0;
    if (switching && switchAge > currentAge) {
      const c = P.yearlyContribution({ grossMonthly: num('grossMonthly'), p2Rate: parseFloat($('p2Rate').value), p3Monthly: num('p3Monthly') });
      const ro = FUNDS[fund18].r, rn = FUNDS[fundNow].r, n = switchAge - currentAge;
      let fOld = pot0, cNew = 0;
      for (let i = 0; i < n; i++) { fOld = fOld * (1 + ro) + c; cNew = cNew * (1 + rn) + c; }
      switchAdj = (fOld - cNew) / Math.pow(1 + rn, n) - pot0;
    }

    // III samba ülejääk pensionieas → samaväärne tänane summa (simulate kasvatab kõike lõpptootlusega).
    const p3RemNow = p3Rem / Math.pow(1 + FUNDS[fundNow].r, Math.max(0, pa - currentAge));

    const pkg = PACKAGES.find((p) => p.id === radio('pkg')) || PACKAGES[0];
    const household = $('household').value;
    const pkgTotal = packageTotal(pkg, household);

    return {
      birthYear: birthYear,
      currentAge: currentAge,
      sex: sex,
      household: household,
      p1Monthly: num('p1Monthly'),
      p2: num('p2'),
      p3Base: num('p3'),
      p3: (p3Plan === 'keep' ? p3Base : 0) + childNow + switchAdj + p3RemNow,
      p3Pre: (p3Plan === 'keep' ? p3Base : 0) + childNow + p3RemNow,
      p3Before2021: p3Before2021,
      p3Open: p3Open, p3Age: p3Age, p3Plan: p3Plan, p3Use: p3Use,
      p3Gross: p3Gross, p3Net: p3Net, p3Tax: p3Tax, p3Rem: p3Rem,
      extraDeposit: p3Plan !== 'keep' && p3Use === 'save' ? p3Net : 0,
      pensionAgeYears: parseInt($('pensionAgeYears').value, 10),
      grossMonthly: num('grossMonthly'),
      p2Rate: parseFloat($('p2Rate').value),
      p3Monthly: num('p3Monthly'),
      fund18: fund18,
      fundNow: fundNow,
      switching: switching, switchAge: switchAge, switchAdj: switchAdj,
      realReturn: FUNDS[fundNow].r,
      child: child, childMonthly: childMonthly, child18: child18, childNow: childNow,
      payout: radio('payout'),
      deferral: parseInt(radio('defer') || '0', 10),
      contract: radio('contract'),
      pkg: pkg,
      pkgTotal: pkgTotal,
      edited: isEdited(pkg),
      needMonthly: customTotal(pkg, household),
    };
  }

  // Valikud → üks stsenaarium failist pension.js.
  function scenarioFor(input) {
    const S = (id) => P.SCENARIOS.find((s) => s.id === id);
    if (input.payout === 'lump') return S('A');
    if (input.deferral > 0) return Object.assign({}, S('C'), { deferral: input.deferral });
    return input.contract === 'yearly' ? S('D') : S('B');
  }

  // Samba vara pensionieas (sama kasvureegel mis simulate'is).
  // fromToday: „mis oleks, kui alates tänasest selles fondis“ (fondivahetuse korrektsioonita).
  function potAtPension(input, r, fromToday) {
    const pa = P.retirementYears(input);
    let fund = input.p2 + (fromToday ? input.p3Pre : input.p3);
    const c = P.yearlyContribution(input);
    for (let a = input.currentAge; a < pa; a++) fund = fund * (1 + r) + c;
    return fund;
  }

  // ---------- Kulupaketid ----------
  function statCats(household) { return K.kategooriad.map((c) => ({ name: c.nimi, v: c[household] })); }
  function statTotal(household) { return statCats(household).reduce((s, c) => s + c.v, 0); }
  function packageTotal(pkg, household) { return statTotal(household) + pkg.extras.reduce((s, e) => s + e[2], 0); }
  function extra(pkg, key) { const e = pkg.extras.find((x) => x[1] === key); return e ? e[2] : 0; }

  // Mida pakett ostukorvis tähendab.
  function funFacts(pkg, household) {
    const cat = (n) => (statCats(household).find((c) => c.name === n) || { v: 0 }).v;
    const tanks = (cat('Transport') + extra(pkg, 'move')) / PRICE.tank;
    const mince = 1 + (extra(pkg, 'food') * 0.4) / PRICE.mince;
    const trips = (extra(pkg, 'travel') * 12) / PRICE.trip;
    const cafes = (cat('Kohvikud ja reisimajutus') + extra(pkg, 'food') * 0.5) / PRICE.cafe;
    const facts = [
      ['🥩', mince < 1.5 ? 'veisehakkliha pühadeks, argipäeval kana ja kartul' : one(mince) + ' kg veisehakkliha kuus'],
      ['⛽', one(tanks) + (tanks < 1 ? ' paaki kütust kuus, pigem bussikaart' : ' paaki kütust kuus')],
      ['☕', Math.max(1, Math.round(cafes)) + (Math.round(cafes) <= 1 ? ' kohvikulõuna' : ' kohvikulõunat') + ' kuus'],
      ['✈️', trips < 0.5 ? 'reisid pigem maale sugulaste juurde' : Math.round(trips) + (Math.round(trips) === 1 ? ' reis' : ' reisi') + ' aastas soojale maale'],
    ];
    if (extra(pkg, 'care')) facts.push(['🏡', 'hooldekodu koht kaetud, lapsed ei pea juurde maksma']);
    if (extra(pkg, 'invest')) facts.push(['🌱', eur(extra(pkg, 'invest')) + ' kuus investeerimiseks või lastelastele']);
    return facts;
  }

  function renderPackages(input) {
    const base = statTotal(input.household);
    const max = Math.max.apply(null, PACKAGES.map((p) => packageTotal(p, input.household)));
    const current = radio('pkg') || 'survive';
    $('packages').innerHTML = PACKAGES.map((p) => {
      const total = packageTotal(p, input.household);
      const joy = p.extras.filter((e) => e[3] === 'joy').reduce((s, e) => s + e[2], 0);
      const fut = p.extras.filter((e) => e[3] === 'future').reduce((s, e) => s + e[2], 0);
      const w = (v) => (v / max) * 100 + '%';
      return '<label class="choice pkg"><input type="radio" name="pkg" value="' + p.id + '"' + (p.id === current ? ' checked' : '') + '>' +
        '<span class="choice-body">' +
        '<span class="pkg-top"><span class="choice-emoji" aria-hidden="true">' + p.emoji + '</span><strong>' + p.name + '</strong><span class="pkg-price">' + eur(total) + '<small> /kuus</small></span></span>' +
        '<small>' + p.tagline + '</small>' +
        (isEdited(p) ? '<small class="pkg-edited">Sinu muudetud summa: <strong>' + eur(customTotal(p, input.household)) + '</strong></small>' : '') +
        '<span class="pkg-bar" aria-hidden="true"><span class="seg base" style="width:' + w(base) + '"></span><span class="seg joy" style="width:' + w(joy) + '"></span><span class="seg future" style="width:' + w(fut) + '"></span></span>' +
        '<ul class="pkg-facts">' + funFacts(p, input.household).map((f) => '<li><span aria-hidden="true">' + f[0] + '</span> ' + f[1] + '</li>').join('') + '</ul>' +
        '</span></label>';
    }).join('') +
      '<p class="pkg-legend small-muted mb-0"><span class="dot base"></span>põhikulud (Statistikaamet) <span class="dot joy"></span>elamused <span class="dot future"></span>tulevik ja hooldus</p>';
    $('packages').querySelectorAll('input').forEach((el) => el.addEventListener('change', update));
  }

  // Paketi read: [võti, nimi, paketi summa, liik]. Kasutaja muudatused on paketi kaupa failis `overrides`.
  const overrides = {};
  function pkgLines(pkg, household) {
    return statCats(household).map((c) => ['stat:' + c.name, c.name, c.v, 'stat'])
      .concat(pkg.extras.map((e) => [e[1], e[0], e[2], e[3]]))
      .concat([['other', 'Muud oma kulud', 0, 'other']]);
  }
  function lineValue(pkg, line) {
    const o = overrides[pkg.id];
    return o && o[line[0]] !== undefined ? o[line[0]] : line[2];
  }
  function customTotal(pkg, household) { return pkgLines(pkg, household).reduce((s, l) => s + lineValue(pkg, l), 0); }
  function isEdited(pkg) { return !!overrides[pkg.id] && Object.keys(overrides[pkg.id]).length > 0; }

  // Joonista väljad uuesti ainult paketi või leibkonna vahetusel, et trükkimise ajal fookus ei kaoks.
  let breakdownKey = null;
  function renderBreakdown(input) {
    const key = input.pkg.id + '|' + input.household;
    if (key !== breakdownKey) {
      breakdownKey = key;
      const chip = { stat: '', joy: ' <span class="src-chip tuleva">elamus</span>', future: ' <span class="src-chip puudub">tulevik</span>', other: '' };
      $('pkgBreakdown').innerHTML = '<table class="table table-sm align-middle mb-0 cost-table"><thead><tr><th scope="col">Kulu</th><th scope="col" class="text-end">Paketis</th><th scope="col" class="text-end">Sinu summa, €/kuus</th></tr></thead><tbody>' +
        pkgLines(input.pkg, input.household).map((l, i) =>
          '<tr><td><label for="cost' + i + '" class="mb-0">' + l[1] + '</label>' + chip[l[3]] + '</td>' +
          '<td class="text-end small-muted">' + eur(l[2]) + '</td>' +
          '<td class="text-end"><input class="form-control form-control-sm cost-input" id="cost' + i + '" data-key="' + l[0] + '" type="number" min="0" step="5" inputmode="numeric" value="' + Math.round(lineValue(input.pkg, l)) + '"></td></tr>'
        ).join('') +
        '</tbody><tfoot><tr class="fw-bold"><td>Kokku</td><td class="text-end small-muted" id="pkgDefaultTotal"></td><td class="text-end" id="pkgCustomTotal"></td></tr></tfoot></table>';
      $('pkgBreakdown').querySelectorAll('.cost-input').forEach((el) => el.addEventListener('input', () => {
        const pkg = readInput().pkg;
        const line = pkgLines(pkg, $('household').value).find((l) => l[0] === el.dataset.key);
        const v = Math.max(0, parseFloat(el.value) || 0);
        overrides[pkg.id] = overrides[pkg.id] || {};
        if (v === line[2]) delete overrides[pkg.id][line[0]]; else overrides[pkg.id][line[0]] = v;
        update();
      }));
    }
    $('pkgBreakdown').querySelectorAll('.cost-input').forEach((el) => {
      const o = overrides[input.pkg.id];
      el.classList.toggle('is-edited', !!o && o[el.dataset.key] !== undefined);
    });
    $('pkgDefaultTotal').textContent = eur(input.pkgTotal);
    $('pkgCustomTotal').textContent = eur(input.needMonthly);
    $('resetPkg').classList.toggle('d-none', !input.edited);
    $('pkgSource').innerHTML = '<span class="src-chip stat ms-0">Statistikaamet</span> ' + K.leibkonnad[input.household] + ', uuring ' + K.uuringuaasta + ', hinnad ' + K.hinnad + '.';
  }

  // ---------- Etappide tekstid ----------
  function kicker(input, idx) {
    const ages = stageAges(P.retirementYears(input))[idx];
    if (!ages) return '';
    const [a, b] = ages;
    const tense = b < input.currentAge ? 'Sinu minevik' : a > input.currentAge ? 'Sinu tulevik' : 'Sinu praegune elu';
    const years = a === b ? String(input.birthYear + a) : (input.birthYear + a) + '–' + (b >= 100 ? '…' : input.birthYear + b);
    const label = a === b ? a + '-aastane' : a + '–' + (b >= 100 ? '' : b) + (b >= 100 ? '+' : '') + ' a';
    return label + ' · ' + years + ' · ' + tense;
  }

  function renderTexts(input) {
    const pa = P.retirementYears(input);
    for (let i = 1; i <= 7; i++) { const k = $('k' + i); if (k) k.textContent = kicker(input, i); }
    chapters[6].dataset.label = String(pa);
    chapters[7].dataset.label = (pa + 1) + '+';

    // 0–18
    $('childMore').classList.toggle('d-none', input.child === 'none');
    $('childNote').innerHTML = input.child === 'none'
      ? 'Paljudel see nii ongi. Lugu läheb edasi.'
      : '18-aastaselt oli sul kogutud <strong>' + eur(input.child18) + '</strong>. ' +
        (input.childNow > 0 ? 'Täna on see <strong>' + eur(input.childNow) + '</strong> ja lisame selle sinu pensionivarale.' : 'Kasutasid selle ära, pensioniks see ei jää.');

    // 18
    const age2002 = 2002 - input.birthYear;
    $('p2018').textContent = input.birthYear + 18 < 2002
      ? 'Said 18-aastaseks ' + (input.birthYear + 18) + '. aastal. II sammas algas 2002. aastal, kui olid ' + age2002 + '-aastane.'
      : 'Kui said 18-aastaseks (' + (input.birthYear + 18) + '), oli II sammas juba olemas.';
    $('fund18More').classList.toggle('d-none', radio('fund18') !== 'self');
    $('fund18Note').innerHTML = '<strong>' + FUNDS[input.fund18].name + '</strong>: eeldatav tootlus ' + pct(FUNDS[input.fund18].r) + ' aastas pärast inflatsiooni. ' + FUNDS[input.fund18].note;

    // 18–55
    $('sameFundTxt').textContent = 'Jätkad fondiga: ' + FUNDS[input.fund18].name.toLowerCase() + '.';
    $('fundNewMore').classList.toggle('d-none', radio('fundChange') !== 'switch');
    const pot = potAtPension(input, input.realReturn);
    const potIndex = potAtPension(input, FUNDS.index.r, true);
    $('switchYear').textContent = 'aastal ' + (input.birthYear + input.switchAge);
    $('switchNote').textContent = input.switchAge <= input.currentAge
      ? 'Vahetasid ' + input.switchAge + '-aastaselt. Varasem tootlus on juba sinu tänases sambasummas, edasi arvestame uue fondiga.'
      : 'Vahetad ' + input.switchAge + '-aastaselt. Seni (' + (input.switchAge - input.currentAge) + ' a) kasvab raha praeguses fondis (' + pct(FUNDS[input.fund18].r) + '), pärast seda uues fondis (' + pct(FUNDS[input.fundNow].r) + ').';
    $('workNote').innerHTML = 'Pensionieaks (' + pa + ') kasvab sinu sammaste vara umbes <strong>' + eur(pot) + '</strong>.' +
      (potIndex - pot > 1 ? ' Kui oleksid alates tänasest madala tasuga indeksfondis, oleks see umbes <strong>' + eur(potIndex) + '</strong> (' + eur(potIndex - pot) + ' rohkem).' : '');

    // Kulud: leibkond
    $('hhNote').innerHTML = input.household === 'paar'
      ? '<span class="hh-emoji" aria-hidden="true">👫</span><span><strong>Elad pensionil paaris.</strong> Summad on sinu osa paari kuludest (ühe inimese kohta). Ühine kodu ja arved teevad elu inimese kohta odavamaks kui üksi. <button type="button" class="btn btn-link p-0 align-baseline" data-goto="0">Muuda</button></span>'
      : '<span class="hh-emoji" aria-hidden="true">🧍</span><span><strong>Elad pensionil üksi.</strong> Summad on üksi elava pensionäri kulud: kodu ja arved maksad ainult sina. <button type="button" class="btn btn-link p-0 align-baseline" data-goto="0">Muuda</button></span>';

    // 55: III samba väljavõtt
    const soon = input.p3Age >= input.p3Open; // kas väljavõtu ajal kehtib soodusmaks
    $('p3Info').innerHTML = '<p class="mb-2">' + (input.p3Before2021
      ? 'Liitusid III sambaga enne 2021, seega kehtib soodusmaks alates <strong>55-aastaselt (' + (input.birthYear + 55) + ')</strong>.'
      : 'Liitusid III sambaga 2021 või hiljem, seega kehtib soodusmaks alles <strong>60-aastaselt (' + (input.birthYear + 60) + ')</strong>. Enne seda läheb väljavõetud rahast 22% tulumaksuks.') + '</p>' +
      '<ul class="mb-0 small"><li>Korraga: ' + (input.p3Before2021 ? '10%' : '22% (alates 60: 10%)') + ' tulumaks</li><li>Jupiti fondipensionina: ' + (input.p3Before2021 ? '0%' : '22% (alates 60: 0%)') + ' tulumaks</li><li>Tingimus: oled kogunud vähemalt 5 aastat</li></ul>';
    $('p3LumpTxt').textContent = 'Kogu III sammas ühe korraga, ' + (soon ? '10%' : '22%') + ' tulumaksuks.';
    $('p3FundTxt').textContent = 'Igakuine väljamakse elada jäänud aastate peale, ' + (soon ? 'maksuvaba' : '22% tulumaksuks enne 60. eluaastat, siis maksuvaba') + '. Ülejäänu kasvab edasi.';
    const p3Locked = input.p3Age >= P.retirementYears(input);
    $('p3Locked').textContent = p3Locked ? 'Oled juba pensionieas, seega kasutad III sammast koos II sambaga pensionieas.' : '';
    $('p3Locked').classList.toggle('d-none', !p3Locked);
    $('p3PlanSet').disabled = p3Locked;
    $('p3UseSet').classList.toggle('d-none', input.p3Plan === 'keep');
    const yrs = P.retirementYears(input) - input.p3Age;
    $('p3Note').innerHTML = input.p3Plan === 'keep'
      ? 'III sammas jääb kasvama ja seda kasutad pensionieas.'
      : input.p3Plan === 'lump'
        ? input.p3Age + '-aastaselt saad kätte <strong>' + eur(input.p3Net) + '</strong> (maksuks läheb ' + eur(input.p3Gross - input.p3Net) + '). ' +
          (input.p3Use === 'save' ? 'See ootab hoiusel pensioni algust.' : 'Kasutad selle kohe, pensioniks seda ei jää.')
        : input.p3Age + '–' + (P.retirementYears(input) - 1) + '-aastaselt saad keskmiselt <strong>' + eur(input.p3Net / Math.max(1, yrs * 12)) + ' kuus</strong> (kokku ' + eur(input.p3Net) + ', maksuks ' + eur(input.p3Gross - input.p3Net) + '). ' +
          'Pensionieaks jääb III sambasse ' + eur(input.p3Rem) + '. ' + (input.p3Use === 'save' ? 'Väljamaksed paned hoiusele pensioniks.' : 'Väljamaksed kasutad kohe.');

    // Pensioniiga: edasilükkamine
    const lump = input.payout === 'lump';
    $('deferLocked').classList.toggle('d-none', !lump);
    $('deferSet').disabled = lump;
    const curDef = lump ? 0 : input.deferral;
    $('deferChoices').innerHTML = [0, 1, 2, 3, 4, 5].map((d) => {
      const inc = P.DEFERRAL_INCREASE[d];
      return '<label class="choice"><input type="radio" name="defer" value="' + d + '"' + (d === curDef ? ' checked' : '') + '>' +
        '<span class="choice-body"><strong>' + (d === 0 ? 'Kohe, ' + pa + '-aastaselt' : (pa + d) + '-aastaselt') + '</strong>' +
        '<small>' + eur(input.p1Monthly * (1 + inc)) + ' kuus' + (d ? ' (+' + one(inc * 100) + '%)' : '') + '</small></span></label>';
    }).join('');
    $('deferChoices').querySelectorAll('input').forEach((el) => el.addEventListener('change', update));

    // 66+
    let lockMsg = '';
    if (lump) lockMsg = 'Võtsid samba raha korraga välja, nii et fondipensioni lepingut pole vaja. Raha on hoiusel ja kasutad seda vajaduse järgi.';
    else if (input.deferral > 0) lockMsg = 'Lükkasid riikliku pensioni ' + input.deferral + ' aastat edasi. Seni elad samba rahast (sild) ja fondipensioni lepingu sõlmid siis, kui riiklik pension algab (' + (pa + input.deferral) + '-aastaselt).';
    $('contractLocked').textContent = lockMsg;
    $('contractLocked').classList.toggle('d-none', !lockMsg);
    $('contractSet').disabled = !!lockMsg;
  }

  function renderPotBar(input) {
    const pa = P.retirementYears(input);
    const p1 = input.payout === 'lump' ? input.p1Monthly : input.p1Monthly * (1 + P.DEFERRAL_INCREASE[input.deferral]);
    const items = [
      ['🏦', eur(potAtPension(input, input.realReturn)), 'sammastes ' + pa + '-aastaselt'],
      ['🏛️', eur(p1) + ' /kuus', 'riiklik pension'],
    ].concat(input.extraDeposit > 0 ? [['🐷', eur(input.extraDeposit), 'III sambast hoiusel']] : []).concat([
      ['🛒', visited.has(8) ? eur(input.needMonthly) + ' /kuus' : 'valimata', 'kulud' + (visited.has(8) ? ' (' + input.pkg.name + (input.edited ? ', muudetud' : '') + ')' : '')],
    ]);
    $('potBar').innerHTML = items.map((x) => '<div class="pot-item"><span class="pot-emoji" aria-hidden="true">' + x[0] + '</span><span><strong>' + x[1] + '</strong><small>' + x[2] + '</small></span></div>').join('');
  }

  // ---------- Tulemus ----------
  function answerText(r, input) {
    const need = eur(input.needMonthly) + ' kuus';
    const parts = [];
    if (r.coversNeedUntil === null) parts.push('Sinu kulud (' + need + ') on kaetud <strong>kuni 100. eluaastani</strong>. 🎉');
    else if (r.coversNeedUntil <= r.pensionStartAge) parts.push('Sinu kulud (' + need + ') <strong>ei ole kaetud juba pensioni alguses</strong>.');
    else parts.push('Sinu kulud (' + need + ') on kaetud <strong>kuni ' + r.coversNeedUntil + '. eluaastani</strong>. 100 sinusugusest elab ' + r.coversNeedUntil + '-aastaseks ' + Math.round(r.aliveAtShortfall * 100) + '.');
    if (r.moneyEndAge === null) parts.push('Samba raha ei saa enne 100. eluaastat otsa.');
    else parts.push('Samba ja hoiuse raha lõpeb ' + r.moneyEndAge + '-aastaselt, edasi jääb riiklik pension ' + eur(r.incomeAfterMoney) + ' kuus.');
    parts.push('<strong>Elu lõpuni</strong> (' + r.horizonAge + '. eluaastani) kannab see plaan kuni <strong>' + eur(r.sustainable) + ' kuus</strong>.');
    return parts.join(' ');
  }

  function renderMetrics(r) {
    const tiles = [
      [r.coversNeedUntil === null ? '100+' : r.coversNeedUntil + ' a', 'kulud kaetud kuni'],
      [r.moneyEndAge === null ? 'ei lõpe' : r.moneyEndAge + ' a', 'samba raha lõpeb'],
      [eur(r.spendAt90), 'kuus 90-aastaselt'],
      [eur(r.sustainable), 'kuus kannab plaan elu lõpuni (' + r.horizonAge + ' a)'],
    ];
    $('metrics').innerHTML = tiles.map((t) =>
      '<div class="col-6 col-md-3"><div class="metric"><div class="value">' + t[0] + '</div><div class="label">' + t[1] + '</div></div></div>'
    ).join('');
  }

  function renderLegacy(r, input) {
    let median = 100;
    for (let a = input.currentAge; a <= 100; a++) if (P.survival(T, input.sex, input.currentAge, a) <= 0.5) { median = a; break; }
    const row = r.rows.find((x) => x.age === median);
    const left = row ? row.moneyLeft : 0;
    const box = $('legacy');
    if (left < 1000 || r.coversNeedUntil !== null && r.coversNeedUntil <= median) {
      box.innerHTML = '<div class="legacy-card"><h3 class="h5">Raha üle ei jää. Mida saaks muuta?</h3>' +
        '<p class="text-secondary">Proovi mõnda neist ja vaata, kuidas tulemus muutub.</p><div class="d-flex flex-wrap gap-2">' +
        '<button type="button" class="btn btn-outline-primary btn-sm" data-goto="3">💼 Vali teine fond või suurem makse</button>' +
        '<button type="button" class="btn btn-outline-primary btn-sm" data-goto="6">🏛️ Lükka riiklik pension edasi</button>' +
        '<button type="button" class="btn btn-outline-primary btn-sm" data-goto="8">🛒 Vali teine kulupakett</button></div></div>';
      return;
    }
    const opts = [
      ['heirs', '👨‍👩‍👧', 'Pärandan lähedastele', 'Lähedastele jääb umbes ' + eur(left) + '. Pärandamiseks tee testament või lisa fondipensioni lepingusse soodustatud isik.'],
      ['donate', '💝', 'Annetan', eur(left) + ' võiks toetada sulle olulist eesmärki. Annetuse saad testamendis määrata.'],
      ['spend', '🎒', 'Kulutan ise rohkem', 'Elu lõpuni kannab plaan ' + eur(r.sustainable) + ' kuus. See on ' + eur(Math.max(0, r.sustainable - input.needMonthly)) + ' rohkem kui praegu.'],
      ['care', '🏡', 'Jätan puhvriks hoolduseks', 'Puhver katab ootamatud kulud ja hooldekodu, nii ei pea lapsed maksma.'],
    ];
    box.innerHTML = '<div class="legacy-card"><h3 class="h5">Sul jääb raha üle. Mida sellega teed?</h3>' +
      '<p class="text-secondary">Kui elad keskmiselt kaua (' + median + '-aastaseks, pooled sinuvanustest elavad kauem), on samba ja hoiuse raha alles umbes <strong>' + eur(left) + '</strong>.</p>' +
      '<fieldset><legend class="visually-hidden">Mida ülejäägiga teed</legend><div class="choices choices-sm">' +
      opts.map((o) => '<label class="choice"><input type="radio" name="legacy" value="' + o[0] + '"' + (legacyChoice === o[0] ? ' checked' : '') + '><span class="choice-body"><span class="choice-emoji" aria-hidden="true">' + o[1] + '</span><strong>' + o[2] + '</strong></span></label>').join('') +
      '</div></fieldset><div class="story-note mt-3" id="legacyNote" aria-live="polite"></div></div>';
    const note = () => {
      const o = opts.find((x) => x[0] === legacyChoice);
      $('legacyNote').innerHTML = o ? o[3] + (o[0] === 'spend' && r.sustainable > input.needMonthly
        ? ' <button type="button" class="btn btn-link p-0 align-baseline" id="trySpend">Proovi ' + eur(r.sustainable) + ' kuus</button>' : '') : 'Vali üks variant.';
      const t = $('trySpend');
      if (t) t.addEventListener('click', () => { const pkg = input.pkg; overrides[pkg.id] = overrides[pkg.id] || {};
        const other = lineValue(pkg, ['other', '', 0]);
        overrides[pkg.id].other = Math.round(other + r.sustainable - input.needMonthly);
        breakdownKey = null; update(); });
    };
    box.querySelectorAll('input[name="legacy"]').forEach((el) => el.addEventListener('change', () => { legacyChoice = el.value; note(); }));
    note();
  }

  function renderRecap(input, scenario) {
    const pa = P.retirementYears(input);
    const childTxt = { none: 'Lapsepõlves raha ei kogunud', parent: 'Vanemad kogusid hoiusele ' + eur(input.childMonthly) + ' kuus', account: 'Lapse investeerimiskonto, ' + eur(input.childMonthly) + ' kuus' }[input.child];
    const items = [
      [0, '🙂', 'Sündinud ' + input.birthYear + ', II sammas ' + eur(input.p2) + ', III sammas ' + eur(input.p3Base)],
      [1, '👶', childTxt],
      [2, '🎓', (radio('fund18') === 'self' ? 'Valisin ise: ' : 'Loosiga: ') + FUNDS[input.fund18].name.toLowerCase()],
      [3, '💼', (input.fundNow === input.fund18 && radio('fundChange') !== 'switch' ? 'Fond jäi samaks' : (input.switchAge > input.currentAge ? 'Vahetan ' : 'Vahetasin ') + input.switchAge + '-aastaselt fondi: ' + FUNDS[input.fundNow].name.toLowerCase()) + ', II sammas ' + pct(input.p2Rate) + ', III sambasse ' + eur(input.p3Monthly) + ' kuus'],
      [4, '🔓', input.p3Plan === 'keep' ? 'III sammas jääb kasvama' : (input.p3Plan === 'lump' ? 'Võtan III samba ' + input.p3Age + '-aastaselt korraga välja: ' + eur(input.p3Net) : 'Võtan III samba ' + input.p3Age + '-aastaselt jupiti välja: ' + eur(input.p3Net)) + (input.p3Plan === 'keep' ? '' : input.p3Use === 'save' ? ', hoiusele' : ', kasutan kohe')],
      [5, '🧳', input.payout === 'lump' ? 'Võtan samba raha korraga välja' : 'Võtan samba raha välja fondipensionina'],
      [6, '🏛️', input.payout === 'lump' || !input.deferral ? 'Riiklik pension ' + pa + '-aastaselt' : 'Riiklik pension ' + (pa + input.deferral) + '-aastaselt (' + input.deferral + ' a hiljem)'],
      [7, '🌳', scenario.id + '. ' + scenario.name],
      [8, '🛒', input.pkg.name + (input.edited ? ' (muudetud)' : '') + ': ' + eur(input.needMonthly) + ' kuus'],
    ];
    $('recap').innerHTML = items.map((x) => '<li><span aria-hidden="true">' + x[1] + '</span><span class="flex-grow-1">' + x[2] + '</span><button type="button" class="btn btn-link btn-sm p-0" data-goto="' + x[0] + '">Muuda<span class="visually-hidden">: ' + chapters[x[0]].dataset.label + '</span></button></li>').join('');
  }

  function renderCompare(defs, results, activeId) {
    const rows = [
      ['Kulud kaetud kuni', (r) => (r.coversNeedUntil === null ? 101 : r.coversNeedUntil), (v) => (v > 100 ? '100+' : v + ' a'), 'max'],
      ['Elus sellest vanusest kauem', (r) => (r.coversNeedUntil === null ? 0 : r.aliveAtShortfall), pct, null],
      ['Samba raha lõpeb', (r) => (r.moneyEndAge === null ? 101 : r.moneyEndAge), (v) => (v > 100 ? 'ei lõpe' : v + ' a'), 'max'],
      ['Kuus 90-aastaselt', (r) => r.spendAt90, eur, 'max'],
      ['Kannab elu lõpuni, kuus', (r) => r.sustainable, eur, 'max'],
      ['Oodatav kogukulutus', (r) => r.expectedLifetime, eur, 'max'],
    ];
    const head = '<thead><tr><th></th>' + defs.map((s) => '<th' + (s.id === activeId ? ' class="mine"' : '') + '>' + s.id + '. ' + s.name + (s.id === activeId ? '<br><small>sinu valik</small>' : '') + '</th>').join('') + '</tr></thead>';
    const body = rows.map(([label, get, fmt, best]) => {
      const vals = results.map(get);
      const top = best ? Math.max.apply(null, vals) : null;
      return '<tr><th scope="row">' + label + '</th>' + vals.map((v) =>
        '<td class="' + (best && vals.filter((x) => x === top).length < vals.length && v === top ? 'best' : '') + '">' + fmt(v) + '</td>'
      ).join('') + '</tr>';
    }).join('');
    $('compare').innerHTML = head + '<tbody>' + body + '</tbody>';
  }

  function renderChart(r, input) {
    const rows = r.rows;
    const data = {
      labels: rows.map((x) => x.age),
      datasets: [
        { type: 'bar', label: 'I sammas', data: rows.map((x) => Math.round(x.i1)), backgroundColor: '#002f63', stack: 'income', yAxisID: 'y' },
        { type: 'bar', label: 'II ja III sammas', data: rows.map((x) => Math.round(x.i23)), backgroundColor: '#00aeea', stack: 'income', yAxisID: 'y' },
        { type: 'bar', label: 'Hoiuselt', data: rows.map((x) => Math.round(x.dep)), backgroundColor: '#9fd8f0', stack: 'income', yAxisID: 'y' },
        { type: 'line', label: 'Kulud', data: rows.map(() => input.needMonthly), borderColor: '#db2200', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, stack: 'need', yAxisID: 'y' },
        { type: 'line', label: 'Elus (%)', data: rows.map((x) => Math.round(x.alive * 100)), borderColor: '#8a8d91', borderWidth: 2, pointRadius: 0, tension: 0.3, yAxisID: 'y1' },
      ],
    };
    const options = {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Roboto' } } },
        tooltip: { callbacks: {
          title: (items) => items[0].label + '-aastaselt (' + rows[items[0].dataIndex].year + ')',
          label: (c) => c.dataset.label + ': ' + (c.dataset.yAxisID === 'y1' ? c.raw + '%' : eur(c.raw)),
        } },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Roboto' }, autoSkip: true, maxRotation: 0 } },
        y: { stacked: true, beginAtZero: true, ticks: { callback: (v) => v + ' €', font: { family: 'Roboto' } }, grid: { color: '#e0e6ec' } },
        y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { callback: (v) => v + '%', font: { family: 'Roboto' } } },
      },
    };
    if (chart) { chart.data = data; chart.options = options; chart.update(); }
    else chart = new Chart($('chart'), { data: data, options: options });
  }

  function renderResult(input) {
    const scenario = scenarioFor(input);
    const defs = P.SCENARIOS.map((s) => (s.id === 'C' ? Object.assign({}, s, { deferral: input.deferral || 2 }) : s));
    const results = defs.map((s) => Object.assign(P.simulate(input, T, s), { sustainable: P.sustainableNeed(input, T, s) }));
    const mine = Object.assign(P.simulate(input, T, scenario), { sustainable: P.sustainableNeed(input, T, scenario) });
    $('answer').innerHTML = answerText(mine, input);
    renderMetrics(mine);
    renderChart(mine, input);
    renderLegacy(mine, input);
    renderRecap(input, scenario);
    renderCompare(defs, results, scenario.id);
  }

  // ---------- Navigeerimine ----------
  function renderPath(input) {
    $('path').innerHTML = chapters.map((c, i) => {
      const ages = stageAges(P.retirementYears(input))[i];
      const past = ages && ages[1] < input.currentAge;
      const now = ages && ages[0] <= input.currentAge && ages[1] >= input.currentAge;
      const cls = [i === step ? 'current' : '', visited.has(i) ? 'visited' : '', past ? 'past' : '', now ? 'now' : ''].join(' ');
      return '<li class="' + cls + '"><button type="button" data-goto="' + i + '"' + (i === step ? ' aria-current="step"' : '') + '>' +
        '<span class="path-dot" aria-hidden="true">' + c.dataset.icon + '</span><span class="path-label">' + c.dataset.label + '</span>' +
        (now ? '<span class="path-now">täna</span>' : '') + '</button></li>';
    }).join('');
  }

  function go(n, focus) {
    step = Math.max(0, Math.min(LAST, n));
    visited.add(step);
    chapters.forEach((c, i) => { c.hidden = i !== step; });
    $('backBtn').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('nextBtn').style.visibility = step === LAST ? 'hidden' : 'visible';
    $('nextBtn').textContent = step === LAST - 1 ? 'Näita tulemust →' : 'Edasi →';
    $('stepCount').textContent = 'Samm ' + (step + 1) + ' / ' + chapters.length;
    update();
    if (focus !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const h = chapters[step].querySelector('h2'); if (h) h.focus({ preventScroll: true });
    }
  }

  function update() {
    // Valikukaardid joonistatakse uuesti: hoia klaviatuuri fookus samal raadionupul.
    const a = document.activeElement;
    const keep = a && a.type === 'radio' && (a.name === 'pkg' || a.name === 'defer') ? a.name : null;
    const input = readInput();
    renderTexts(input);
    renderPackages(input);
    renderBreakdown(readInput());
    const fresh = readInput();
    renderPotBar(fresh);
    renderPath(fresh);
    if (step === LAST) renderResult(fresh);
    if (keep) { const el = document.querySelector('input[name="' + keep + '"]:checked'); if (el) el.focus(); }
  }

  // ---------- Pensioniiga ----------
  let paTouched = false;
  function syncPensionAge() {
    const rule = P.pensionAge(parseInt($('birthYear').value, 10) || 1980);
    if (!paTouched) $('pensionAgeYears').value = String(rule.years);
    $('paHint').textContent = 'Reegli järgi ' + rule.label;
  }
  $('pensionAgeYears').addEventListener('change', () => { paTouched = true; });
  $('birthYear').addEventListener('input', syncPensionAge);

  // ---------- Tuleva konto eeltäitmine (väljamõeldud näidisliige) ----------
  const DEMO = { birthYear: 1968, sex: 'N', pensionAgeYears: 66, p2: 38400, p3: 21700, p3Before2021: '1', grossMonthly: 2900, p2Rate: '0.04', p3Monthly: 150 };
  $('prefillBtn').addEventListener('click', () => {
    Object.entries(DEMO).forEach(([id, v]) => { $(id).value = String(v); $(id).classList.add('is-prefilled'); });
    paTouched = true;
    syncPensionAge();
    update();
  });

  // ---------- Sündmused ----------
  ['fund18Fund', 'fundNew'].forEach((id) => {
    $(id).innerHTML = Object.entries(FUNDS).map(([k, f]) => '<option value="' + k + '">' + f.name + ' (' + pct(f.r) + ' a)</option>').join('');
  });
  $('fund18Fund').value = 'index';
  $('fundNew').value = 'index';

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]');
    if (b) go(parseInt(b.dataset.goto, 10));
  });
  $('resetPkg').addEventListener('click', () => { delete overrides[readInput().pkg.id]; breakdownKey = null; update(); });
  $('backBtn').addEventListener('click', () => go(step - 1));
  $('nextBtn').addEventListener('click', () => go(step + 1));
  document.querySelectorAll('.chapter input, .chapter select').forEach((el) => {
    if (el.closest('#packages') || el.closest('#legacy') || el.closest('#deferChoices')) return;
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    el.addEventListener('input', () => el.classList.remove('is-prefilled'));
  });

  // Fondivahetuse vanus: trükkimise ajal ei sega, väljast lahkudes viime lubatud vahemikku (18 kuni pensioniiga − 1).
  const switchEl = $('switchAge');
  switchEl.value = String(Math.max(18, P.CURRENT_YEAR - (parseInt($('birthYear').value, 10) || 1980)));
  switchEl.addEventListener('input', () => { switchEl.value = switchEl.value.replace(/\D/g, ''); });
  switchEl.addEventListener('change', () => { switchEl.value = String(readInput().switchAge); update(); });

  $('kuludMeta').textContent = 'uuring ' + K.uuringuaasta + ', hinnad ' + K.hinnad;
  $('lifeYear').textContent = T.aasta;
  syncPensionAge();
  go(0, false);
})();
