// Tulevane Mina: kasutajaliides. Arvutus on failis js/pension.js.
(function () {
  'use strict';

  const P = window.Pension;
  const T = window.ELUTABEL;
  const $ = (id) => document.getElementById(id);
  const eur = (v) => Math.round(v).toLocaleString('et-EE').replace(/,/g, ' ') + ' €';
  const pct = (v) => Math.round(v * 100) + '%';

  let active = 'B';
  let chart = null;

  function readInput() {
    const num = (id) => Math.max(0, parseFloat($(id).value) || 0);
    const birthYear = Math.min(1990, Math.max(1950, parseInt($('birthYear').value, 10) || 1966));
    return {
      birthYear: birthYear,
      sex: $('sex').value,
      p1Monthly: num('p1Monthly'),
      p2: num('p2'),
      p3: num('p3'),
      p3Before2021: $('p3Before2021').value === '1',
      needMonthly: num('needMonthly'),
      realReturn: parseFloat($('realReturn').value),
      pensionAgeYears: parseInt($('pensionAgeYears').value, 10),
      grossMonthly: num('grossMonthly'),
      p2Rate: parseFloat($('p2Rate').value),
      p3Monthly: num('p3Monthly'),
    };
  }

  function scenarioDefs() {
    return P.SCENARIOS.map((s) => (s.id === 'C' ? Object.assign({}, s, { deferral: parseInt($('deferral').value, 10) }) : s));
  }

  function renderTimeline(input) {
    $('timeline').innerHTML = P.decisionMap(input).map((d) => {
      const past = d.year < P.CURRENT_YEAR ? ' <span class="badge text-bg-light">avanenud</span>' : '';
      return '<li><div class="when">' + d.age + '-aastaselt · ' + d.year + past + '</div>' +
        '<div class="fw-medium">' + d.title + '</div><div class="text-secondary small">' + d.text + '</div></li>';
    }).join('');
  }

  function renderTabs(defs) {
    $('tabs').innerHTML = defs.map((s) =>
      '<div class="col-12 col-sm-6 col-lg-3"><button type="button" role="tab" aria-selected="' + (s.id === active) + '" ' +
      'class="btn w-100 h-100 ' + (s.id === active ? 'btn-primary' : 'btn-outline-primary') + '" data-id="' + s.id + '">' +
      '<span class="fw-medium">' + s.id + '. ' + s.name + '</span><small>' + s.short + '</small></button></div>'
    ).join('');
    $('tabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { active = b.dataset.id; update(); }));
    $('deferralRow').style.display = active === 'C' ? '' : 'none';
  }

  function answerText(r, input) {
    const need = eur(input.needMonthly);
    const parts = [];
    if (r.coversNeedUntil === null) parts.push('Sinu vajadus (' + need + ' kuus) on kaetud <strong>kuni 100. eluaastani</strong>.');
    else if (r.coversNeedUntil <= r.pensionStartAge) parts.push('Sinu vajadus (' + need + ' kuus) <strong>ei ole kaetud juba pensioni alguses</strong>.');
    else parts.push('Sinu vajadus (' + need + ' kuus) on kaetud <strong>kuni ' + r.coversNeedUntil + '. eluaastani</strong>. 100 sinusugusest elab ' + r.coversNeedUntil + '-aastaseks ' + Math.round(r.aliveAtShortfall * 100) + '.');
    if (r.moneyEndAge === null) parts.push('Samba raha ei saa enne 100. eluaastat otsa.');
    else parts.push('Samba ja hoiuse raha lõpeb ' + r.moneyEndAge + '-aastaselt, edasi jääb riiklik pension ' + eur(r.incomeAfterMoney) + ' kuus.');
    parts.push('<strong>Elu lõpuni</strong> (' + r.horizonAge + '. eluaastani, milleni jõuab 10% sinuvanustest) kannab see plaan kuni <strong>' + eur(r.sustainable) + ' kuus</strong>.');
    return parts.join(' ');
  }

  function renderMetrics(r) {
    const tiles = [
      [r.coversNeedUntil === null ? '100+' : r.coversNeedUntil + ' a', 'vajadus kaetud kuni'],
      [r.moneyEndAge === null ? 'ei lõpe' : r.moneyEndAge + ' a', 'samba raha lõpeb'],
      [eur(r.spendAt90), 'kuus 90-aastaselt'],
      [eur(r.sustainable), 'kuus kannab plaan elu lõpuni (' + r.horizonAge + ' a)'],
    ];
    $('metrics').innerHTML = tiles.map((t) =>
      '<div class="col-6 col-md-3"><div class="metric"><div class="value">' + t[0] + '</div><div class="label">' + t[1] + '</div></div></div>'
    ).join('');
  }

  function renderCompare(defs, results) {
    const rows = [
      ['Vajadus kaetud kuni', (r) => (r.coversNeedUntil === null ? 101 : r.coversNeedUntil), (v) => (v > 100 ? '100+' : v + ' a'), 'max'],
      ['Elus sellest vanusest kauem', (r) => (r.coversNeedUntil === null ? 0 : r.aliveAtShortfall), pct, null],
      ['Samba raha lõpeb', (r) => (r.moneyEndAge === null ? 101 : r.moneyEndAge), (v) => (v > 100 ? 'ei lõpe' : v + ' a'), 'max'],
      ['Kuus 90-aastaselt', (r) => r.spendAt90, eur, 'max'],
      ['Kannab elu lõpuni, kuus', (r) => r.sustainable, eur, 'max'],
      ['Oodatav kogukulutus', (r) => r.expectedLifetime, eur, 'max'],
    ];
    const head = '<thead><tr><th></th>' + defs.map((s) => '<th>' + s.id + '. ' + s.name + '</th>').join('') + '</tr></thead>';
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
        { type: 'line', label: 'Vajadus', data: rows.map(() => input.needMonthly), borderColor: '#db2200', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, stack: 'need', yAxisID: 'y' },
        { type: 'line', label: 'Elus (%)', data: rows.map((x) => Math.round(x.alive * 100)), borderColor: '#8a8d91', borderWidth: 2, pointRadius: 0, tension: 0.3, yAxisID: 'y1' },
      ],
    };
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
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

  function update() {
    const input = readInput();
    const defs = scenarioDefs();
    const results = defs.map((s) => Object.assign(P.simulate(input, T, s), { sustainable: P.sustainableNeed(input, T, s) }));
    const r = results[defs.findIndex((s) => s.id === active)];
    renderTimeline(input);
    renderTabs(defs);
    $('answer').innerHTML = answerText(r, input);
    renderMetrics(r);
    renderChart(r, input);
    renderCompare(defs, results);
  }

  // ---------- Kulud statistikast (Statistikaamet LE205 + IA002) ----------
  const K = window.KULUD;
  const CATS = K.kategooriad;
  function renderNeedCats() {
    $('needCats').innerHTML = CATS.map((c, i) =>
      '<div class="col-6 col-md-4"><label class="form-label small mb-0" for="cat' + i + '">' + c.nimi + '</label>' +
      '<input class="form-control form-control-sm need-cat" id="cat' + i + '" type="number" min="0" step="5" value="0"></div>'
    ).join('');
    document.querySelectorAll('.need-cat').forEach((el) => el.addEventListener('input', () => {
      el.classList.remove('is-prefilled');
      $('needMonthly').value = Array.from(document.querySelectorAll('.need-cat')).reduce((a, x) => a + (parseFloat(x.value) || 0), 0);
      setNeedSource('own');
      update();
    }));
  }
  function setNeedSource(kind) {
    const hh = K.leibkonnad[$('household').value];
    $('needSource').innerHTML = kind === 'stat'
      ? '<span class="src-chip stat">Statistikaamet</span> ' + hh + ', uuring ' + K.uuringuaasta + ', hinnad ' + K.hinnad + '. Pensionärid kulutavad keskmiselt nii palju, kui sissetulek lubab. Sinu vajadus võib olla suurem.'
      : 'Sinu enda sisestatud kulud.';
    $('needMonthly').classList.toggle('is-prefilled', kind === 'stat');
  }
  function fillNeedFromStats() {
    const hh = $('household').value;
    CATS.forEach((c, i) => { const el = $('cat' + i); el.value = c[hh]; el.classList.add('is-prefilled'); });
    $('needMonthly').value = CATS.reduce((a, c) => a + c[hh], 0);
    setNeedSource('stat');
  }
  $('statBtn').addEventListener('click', () => { fillNeedFromStats(); update(); });
  $('household').addEventListener('change', () => { fillNeedFromStats(); update(); });
  $('needMonthly').addEventListener('input', () => {
    document.querySelectorAll('.need-cat').forEach((el) => { el.value = ''; el.classList.remove('is-prefilled'); });
    setNeedSource('own');
  });
  $('kuludMeta').textContent = 'uuring ' + K.uuringuaasta + ', hinnad ' + K.hinnad;

  // ---------- Pensioniiga: ligikaudne reegel, kuni kasutaja või Tuleva konto annab väärtuse ----------
  let paTouched = false;
  function syncPensionAge() {
    const rule = P.pensionAge(parseInt($('birthYear').value, 10) || 1966);
    if (!paTouched) $('pensionAgeYears').value = String(rule.years);
    $('paHint').textContent = 'Reegli järgi ' + rule.label;
  }
  $('pensionAgeYears').addEventListener('change', () => { paTouched = true; });
  $('birthYear').addEventListener('input', syncPensionAge);

  // ---------- Tuleva konto eeltäitmine (näidisandmed) ----------
  // Väljamõeldud liige. Päris tootes tulevad väärtused Tuleva API-st (TulevaEE/onboarding-client).
  const DEMO = {
    fields: { birthYear: 1968, sex: 'N', pensionAgeYears: 66, p2: 38400, p3: 21700, p3Before2021: '1', grossMonthly: 2900, p2Rate: '0.04', p3Monthly: 150 },
    rows: [
      ['Sünnikuupäev', '14.03.1968 → 58-aastane', 'tuleva', '/v1/me · dateOfBirth, age'],
      ['Sugu', 'naine', 'tuleva', 'isikukoodi 1. number, arvutatakse brauseris'],
      ['Pensioniiga', '66 a (registris 65, Tuleva prognoos sünniaasta järgi)', 'tuleva', '/v1/me · retirementAge'],
      ['II sammas', '38 400 €', 'tuleva', '/v1/me/capital'],
      ['III sammas', '21 700 €', 'tuleva', '/v1/me/capital'],
      ['III sambaga liitumine', '05.2012 → soodusmaks alates 55 (14.03.2023)', 'tuleva', '/v1/me · thirdPillarInitDate; /v1/withdrawals/eligibility'],
      ['II samba makse', '4%', 'tuleva', '/v1/me · secondPillarPaymentRates'],
      ['Brutopalk', '2 900 €/kuus', 'tuleva', 'tuletatud: /v1/contributions'],
      ['III sambasse', '150 €/kuus', 'tuleva', 'tuletatud: /v1/contributions'],
      ['Fonditasu', '0,28% aastas (kaalutud keskmine)', 'tuleva', '/v1/me/conversion · weightedAverageFee'],
      ['Varase pensioni kuupäev', '14.03.2028 (60-aastaselt)', 'tuleva', '/v1/withdrawals/eligibility · earlyRetirementDate'],
      ['Maksuvaba fondipensioni periood', 'selgub 60-aastaselt', 'tuleva', '/v1/withdrawals/eligibility · recommendedDurationYears'],
      ['Aktiivne fondipension', 'ei', 'tuleva', '/v1/withdrawals/fund-pension-status'],
      ['Riiklik pension', 'Tuleval puudub: sisesta SKA kalkulaatorist', 'puudub', 'tulevikus SKA päring nõusolekul (X-tee)'],
      ['Kulud', 'Tuleval puudub: täidetud statistikast', 'stat', 'Statistikaamet LE205, IA002'],
    ],
  };
  const CHIP = { tuleva: 'Tuleva konto', stat: 'Statistikaamet', ska: 'SKA', puudub: 'puudub' };
  const DEFAULTS = {};
  Object.keys(DEMO.fields).forEach((id) => { DEFAULTS[id] = $(id).value; });
  function labelFor(id) { return document.querySelector('label[for="' + id + '"]'); }
  function applyDemo() {
    Object.entries(DEMO.fields).forEach(([id, v]) => {
      const el = $(id); el.value = String(v); el.classList.add('is-prefilled');
      const lab = labelFor(id);
      if (lab && !lab.querySelector('.src-chip')) lab.insertAdjacentHTML('beforeend', '<span class="src-chip tuleva">Tuleva</span>');
    });
    paTouched = true;
    $('p1Monthly').classList.remove('is-prefilled');
    $('prefillPanel').innerHTML = '<div class="fw-medium text-navy mb-1">Tuleva kontolt eeltäidetud (näidis)</div>' +
      '<div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Väli</th><th>Väärtus</th><th>Allikas</th></tr></thead><tbody>' +
      DEMO.rows.map((r) => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td><span class="src-chip ' + r[2] + ' ms-0">' + CHIP[r[2]] + '</span> <code>' + r[3] + '</code></td></tr>').join('') +
      '</tbody></table></div>';
    $('prefillPanel').classList.remove('d-none');
    $('clearBtn').classList.remove('d-none');
    syncPensionAge();
    fillNeedFromStats();
    update();
  }
  function clearDemo() {
    Object.entries(DEFAULTS).forEach(([id, v]) => {
      const el = $(id); el.value = v; el.classList.remove('is-prefilled');
      const chip = labelFor(id) && labelFor(id).querySelector('.src-chip'); if (chip) chip.remove();
    });
    paTouched = false;
    $('prefillPanel').classList.add('d-none');
    $('clearBtn').classList.add('d-none');
    syncPensionAge();
    update();
  }
  $('prefillBtn').addEventListener('click', applyDemo);
  $('clearBtn').addEventListener('click', clearDemo);

  $('lifeYear').textContent = T.aasta;
  document.querySelectorAll('#form input, #form select, #deferral, #needMonthly').forEach((el) => {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    if (el.closest('#form')) el.addEventListener('input', () => el.classList.remove('is-prefilled'));
  });
  renderNeedCats();
  syncPensionAge();
  fillNeedFromStats();
  update();
})();
