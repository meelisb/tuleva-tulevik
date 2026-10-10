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
      '<div class="col-12 col-md-4"><button type="button" role="tab" aria-selected="' + (s.id === active) + '" ' +
      'class="btn w-100 h-100 ' + (s.id === active ? 'btn-primary' : 'btn-outline-primary') + '" data-id="' + s.id + '">' +
      '<span class="fw-medium">' + s.id + '. ' + s.name + '</span><small>' + s.short + '</small></button></div>'
    ).join('');
    $('tabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { active = b.dataset.id; update(); }));
    $('deferralRow').style.display = active === 'C' ? '' : 'none';
  }

  function answerText(r, input) {
    const parts = ['Pensioni alguses on su sissetulek <strong>' + eur(r.startIncome) + ' kuus</strong>.'];
    if (r.fundEndAge === null) {
      parts.push('Samba raha ei lõpe enne 100. eluaastat.');
    } else {
      parts.push('Samba raha lõpeb <strong>' + r.fundEndAge + '-aastaselt</strong>, edasi jääb ainult riiklik pension ' + eur(r.incomeAfterFund) + ' kuus.');
      parts.push('<strong>100 sinusugusest elab ' + r.fundEndAge + '-aastaseks ' + Math.round(r.aliveAtFundEnd * 100) + '.</strong>');
    }
    if (r.coversNeedUntil === null) parts.push('Sissetulek katab vajaduse (' + eur(input.needMonthly) + ') elu lõpuni.');
    else if (r.coversNeedUntil <= r.pensionStartAge) parts.push('Sissetulek jääb vajadusest (' + eur(input.needMonthly) + ') alla juba pensioni alguses.');
    else parts.push('Sissetulek katab vajaduse (' + eur(input.needMonthly) + ') kuni ' + r.coversNeedUntil + '. eluaastani.');
    return parts.join(' ');
  }

  function renderMetrics(r) {
    const tiles = [
      [eur(r.startIncome), 'kuus pensioni alguses'],
      [r.fundEndAge === null ? '100+' : r.fundEndAge + ' a', 'samba raha lõpeb'],
      [eur(r.fundEndAge === null ? r.startIncome : r.incomeAfterFund), 'kuus pärast seda'],
      [eur(r.expectedLifetime), 'oodatav kogusissetulek eluea tõenäosust arvestades'],
    ];
    $('metrics').innerHTML = tiles.map((t) =>
      '<div class="col-6 col-md-3"><div class="metric"><div class="value">' + t[0] + '</div><div class="label">' + t[1] + '</div></div></div>'
    ).join('');
  }

  function renderCompare(defs, results) {
    const rows = [
      ['Kuus pensioni alguses', (r) => r.startIncome, eur, 'max'],
      ['Samba raha lõpeb', (r) => (r.fundEndAge === null ? 101 : r.fundEndAge), (v) => (v > 100 ? '100+' : v + ' a'), 'max'],
      ['Kuus pärast samba lõppu', (r) => (r.fundEndAge === null ? r.startIncome : r.incomeAfterFund), eur, 'max'],
      ['Elus samba lõppedes', (r) => r.aliveAtFundEnd, pct, null],
      ['Katab vajaduse kuni', (r) => (r.coversNeedUntil === null ? 101 : r.coversNeedUntil), (v) => (v > 100 ? 'elu lõpuni' : v + ' a'), 'max'],
      ['Oodatav kogusissetulek', (r) => r.expectedLifetime, eur, 'max'],
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
    const results = defs.map((s) => P.simulate(input, T, s));
    const r = results[defs.findIndex((s) => s.id === active)];
    renderTimeline(input);
    renderTabs(defs);
    $('answer').innerHTML = answerText(r, input);
    renderMetrics(r);
    renderChart(r, input);
    renderCompare(defs, results);
  }

  $('lifeYear').textContent = T.aasta;
  document.querySelectorAll('#form input, #form select, #deferral').forEach((el) => {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });
  update();
})();
