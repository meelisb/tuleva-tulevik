// Tulevane Mina: kasutajaliides. Arvutus: js/pension.js. Graafik: js/chart.js.
(function () {
  'use strict';

  const P = window.Pension;
  const T = window.ELUTABEL;
  const K = window.KULUD;
  const $ = (id) => document.getElementById(id);
  // Kaitse vana ja uue koodi segu vastu (brauseri vahemälu).
  if (!P || !P.presets || !window.PensionChart || !K || !K.tasemed || !$('stepper')) {
    const el = $('appError');
    if (el) { el.innerHTML = '<strong>Leht on poolikult uuenenud.</strong> Laadi leht uuesti (Ctrl+Shift+R või Cmd+Shift+R).'; el.classList.remove('d-none'); }
    return;
  }
  const eur = (v) => Math.round(v).toLocaleString('et-EE') + ' €';
  const pct = (v) => Math.round(v * 100) + '%';
  const sgnPct = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±') + (Math.abs(v) * 100).toFixed(2).replace('.', ',').replace(/,00$/, '') + '%';
  const KUUD = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
  const kuu = (s) => { const [y, m] = s.split('-'); return KUUD[Number(m) - 1] + ' ' + y; };

  const ABI = {
    'Toit ja joogid': 'Toiduained ja alkoholita joogid kodus.',
    'Eluase ja kommunaalkulud': 'Üür või korteriühistu, küte, elekter, vesi, prügivedu, remont.',
    'Tervis ja ravimid': 'Ravimid, visiiditasud, hambaravi, prillid, abivahendid.',
    'Transport': 'Auto ost ja ülalpidamine, kütus, ühistransport, takso.',
    'Vaba aeg': 'Hobid, kultuur, sport, raamatud ja ajakirjandus, teleteenused ja voogedastus, reisipaketid, lemmikloomad.',
    'Majapidamine': 'Mööbel, kodumasinad, kodutekstiil, majapidamistarbed, koduabi.',
    'Side': 'Telefon, mobiilside, internet, postiteenused. Teleteenused on vaba aja all.',
    'Riided ja jalatsid': 'Riided, jalatsid ja nende parandus.',
    'Alkohol ja tubakas': 'Alkohoolsed joogid ja tubakatooted.',
    'Kohvikud ja reisimajutus': 'Söömine väljaspool kodu, hotellid ja muu majutus.',
    'Muud kaubad ja teenused': 'Isikuhooldus (juuksur, hügieen), sotsiaalhoolekanne (nt koduhooldus, päevakeskus), kindlustus, pangateenused, isiklikud esemed.',
    'Muud kulutused': 'Kulud, mis ei ole tarbimine: nt rahalised kingitused ja toetused teistele, liikmemaksud.',
  };
  const CARE_CATS = ['Eluase ja kommunaalkulud', 'Toit ja joogid', 'Transport'];

  const METHODS = [
    ['keep', 'Jätan fondi kasvama', 'Võtan raha ainult siis, kui muudest allikatest ei piisa. Osaline väljamakse: 10% tulumaks.'],
    ['fund', 'Igakuine fondipension, üks leping', 'Tulumaksuta. Lõpeb, kui periood (sinu statistiliselt elada jäänud aastad) saab läbi.'],
    ['renew', 'Igakuine fondipension, leping igal aastal uuesti', 'Tulumaksuta. Ei jõua nulli, aga väga kõrges eas on makse väike.'],
    ['lump', 'Kõik korraga', '10% tulumaks. Raha läheb hoiusele, kus inflatsioon seda sööb.'],
  ];

  const state = { step: 1, plan: null, paTouched: false, workTouched: false };

  function options(sel, from, to, label, value) {
    sel.innerHTML = '';
    for (let a = from; a <= to; a++) sel.add(new Option(label(a), String(a)));
    if (value !== undefined) sel.value = String(value);
  }
  options($('pensionAgeYears'), 65, 68, (a) => a + ' a');
  options($('careFrom'), 70, 95, (a) => a + '-aastaselt', 85);

  const birthYearValue = () => Math.min(1990, Math.max(1950, parseInt($('birthYear').value, 10) || 1966));
  const currentAge = () => P.CURRENT_YEAR - birthYearValue();
  function readInput() {
    const num = (id) => Math.max(0, parseFloat($(id).value) || 0);
    const birthYear = birthYearValue();
    return {
      birthYear: birthYear,
      sex: $('sex').value,
      pensionAgeYears: parseInt($('pensionAgeYears').value, 10),
      workUntil: parseInt($('workUntil').value, 10),
      p1Monthly: num('p1Monthly'),
      p2: num('p2'), p3: num('p3'), tkf: num('tkf'), savings: num('savings'),
      p3Before2021: $('p3Before2021').value === '1',
      grossMonthly: num('grossMonthly'), p2Rate: parseFloat($('p2Rate').value), p3Monthly: num('p3Monthly'), tkfMonthly: num('tkfMonthly'),
      realReturn: parseFloat($('realReturn').value), depositReturn: parseFloat($('depositReturn').value),
      needMonthly: num('needMonthly'),
      care: { on: $('careOn').checked, fromAge: parseInt($('careFrom').value, 10), monthly: num('careMonthly'), replaces: careReplaces() },
    };
  }

  // ---------- pensioniiga ja töötamine ----------
  function syncAges() {
    const by = birthYearValue();
    const rule = P.pensionAge(by);
    if (!state.paTouched) $('pensionAgeYears').value = String(rule.years);
    $('paHint').textContent = 'Reegli järgi ' + rule.label + '. See võib muutuda: 2027. aastast arvutatakse pensioniiga igal aastal uuesti Statistikaameti eluea järgi ja täpne iga selgub umbes kaks aastat ette.';
    const pa = parseInt($('pensionAgeYears').value, 10);
    const cur = Math.max(55, currentAge());
    const prev = $('workUntil').value;
    options($('workUntil'), Math.min(cur, pa), 75, (a) => a + '-aastaseni (' + (by + a) + ')');
    $('workUntil').value = state.workTouched && prev && Number(prev) >= Math.min(cur, pa) ? prev : String(Math.max(pa, Math.min(cur, 75)));
  }
  let lastBirth = null, lastPa = null;
  function syncAgesSoft() {
    const by = $('birthYear').value, pa = $('pensionAgeYears').value;
    if (by !== lastBirth || pa !== lastPa) { lastBirth = by; syncAges(); lastPa = $('pensionAgeYears').value; }
  }

  // ---------- kulud ----------
  const level = () => document.querySelector('input[name=level]:checked').value;
  function renderNeedCats() {
    $('needCats').innerHTML = K.kategooriad.map((c, i) =>
      '<div class="field"><label class="form-label small mb-0" for="cat' + i + '">' + c.nimi + '</label>' +
      '<input class="form-control form-control-sm need-cat" id="cat' + i + '" type="number" inputmode="numeric" min="0" step="5" value="0" aria-describedby="catH' + i + '">' +
      '<div class="form-text" id="catH' + i + '">' + (ABI[c.nimi] || '') + '</div></div>').join('');
    document.querySelectorAll('.need-cat').forEach((el) => el.addEventListener('input', () => {
      el.classList.remove('is-prefilled');
      $('needMonthly').value = Array.from(document.querySelectorAll('.need-cat')).reduce((a, x) => a + (parseFloat(x.value) || 0), 0);
      setNeedSource('own'); update();
    }));
  }
  function setNeedSource(kind) {
    $('needSource').innerHTML = kind === 'stat'
      ? '<span class="src-chip stat">Statistikaamet</span> ' + K.tasemed[level()] + ', ' + K.leibkonnad[$('household').value].toLowerCase() + '. Uuring ' + K.uuringuaasta + ', hinnad ' + kuu(K.hinnad) + '.'
      : 'Sinu enda sisestatud kulud.';
    $('needMonthly').classList.toggle('is-prefilled', kind === 'stat');
    $('levelHint').textContent = K.tasemed[level()] + '.';
  }
  function fillNeedFromStats() {
    const hh = $('household').value, lv = level();
    K.kategooriad.forEach((c, i) => { const el = $('cat' + i); el.value = c[hh][lv]; el.classList.add('is-prefilled'); });
    $('needMonthly').value = K.kategooriad.reduce((a, c) => a + c[hh][lv], 0);
    setNeedSource('stat');
  }
  function careReplaces() {
    let s = 0;
    K.kategooriad.forEach((c, i) => { if (CARE_CATS.includes(c.nimi)) s += parseFloat($('cat' + i) && $('cat' + i).value) || 0; });
    if (!s) s = K.kategooriad.filter((c) => CARE_CATS.includes(c.nimi)).reduce((a, c) => a + c[$('household').value][level()], 0);
    return s;
  }

  // ---------- otsused ----------
  function defaultPlan(input) {
    const pa = input.pensionAgeYears;
    const end = Math.max(pa, input.workUntil || pa);
    return { stateOffset: 0, p2: { method: 'renew', start: end }, p3: { method: 'renew', start: Math.max(P.p3ReducedAge(input), end) } };
  }
  function methodRadios(name, cur) {
    return '<div class="choice-list" role="radiogroup" aria-label="Väljamakse viis">' + METHODS.map(([v, t, d]) =>
      '<label class="choice' + (cur === v ? ' active' : '') + '"><input type="radio" name="' + name + '" value="' + v + '"' + (cur === v ? ' checked' : '') + '> <span><strong>' + t + '</strong><br><span class="small">' + d + '</span></span></label>').join('') + '</div>';
  }
  function renderDecisions(input) {
    const plan = state.plan, pa = input.pensionAgeYears, by = input.birthYear, cur = currentAge();
    const p3r = P.p3ReducedAge(input);
    const le = (age) => T.elada_jaanud[input.sex][Math.min(age, 100)];
    const s3opts = []; for (let a = Math.max(55, cur); a <= 75; a++) s3opts.push(a);
    const iii = '<section class="decision" aria-labelledby="d3"><h3 class="h6 mb-1" id="d3">III sammas</h3>' +
      '<p class="window">Ajaaken: soodsa maksuga alates ' + p3r + '. eluaastast (' + (by + p3r) + '), ülemist piiri ei ole. Enne seda on tulumaks 22%.</p>' +
      methodRadios('m3', plan.p3.method) +
      '<label class="form-label mt-2" for="s3">Alustan</label><select class="form-select" id="s3"' + (plan.p3.method === 'keep' ? ' disabled' : '') + '>' +
      s3opts.map((a) => '<option value="' + a + '"' + (a === plan.p3.start ? ' selected' : '') + '>' + a + '-aastaselt (' + (by + a) + ')' + (a < p3r ? ' · 22% maks' : '') + '</option>').join('') + '</select>' +
      '<p class="small text-secondary mt-2 mb-0">Kui võtad raha korraga või lühikese aja jooksul, maksad 10% tulumaksu. Kui lased maksta igakuiselt vähemalt nii mitme aasta jooksul, kui sul statistiliselt elada on jäänud (' + plan.p3.start + '-aastaselt umbes ' + Math.round(le(plan.p3.start)) + ' aastat), on väljamakse tulumaksuta.' +
      (input.workUntil > Math.max(cur, 55) ? ' Kuni töötad, jätka III samba sissemakseid: saad 22% tulumaksu tagasi.' : '') + '</p></section>';
    const s2opts = []; for (let a = Math.max(60, cur); a <= 75; a++) s2opts.push(a);
    const losing = plan.p2.method !== 'keep' && input.p2Rate > 0 && plan.p2.start < input.workUntil;
    const ii = '<section class="decision" aria-labelledby="d2"><h3 class="h6 mb-1" id="d2">II sammas</h3>' +
      '<p class="window">Ajaaken: alates 60. eluaastast (' + (by + 60) + '), ülemist piiri ei ole. Vali, kuidas raha võtad.</p>' +
      methodRadios('m2', plan.p2.method) +
      '<label class="form-label mt-2" for="s2">Alustan</label><select class="form-select" id="s2"' + (plan.p2.method === 'keep' ? ' disabled' : '') + '>' +
      s2opts.map((a) => '<option value="' + a + '"' + (a === plan.p2.start ? ' selected' : '') + '>' + a + '-aastaselt (' + (by + a) + ')</option>').join('') + '</select>' +
      (losing ? '<p class="warn mt-2 mb-0"><strong>Riigi tugi kaob.</strong> Töötad ' + input.workUntil + '-aastaseni. Kui alustad II sambast ' + plan.p2.start + '-aastaselt, lõpevad II samba sissemaksed, ka riigi 4%: umbes ' + eur(input.grossMonthly * 12 * 0.04) + ' aastas.</p>' :
        '<p class="small text-secondary mt-2 mb-0">II samba esimese väljamaksega lõpevad II samba sissemaksed, ka riigi 4%. Kui töötad edasi, tasub II sambast alustada pärast töötamist.</p>') + '</section>';
    const offs = []; for (let k = -5; k <= 5; k++) if (pa + k >= Math.min(cur, pa)) offs.push(k);
    const i1 = '<section class="decision" aria-labelledby="d1"><h3 class="h6 mb-1" id="d1">Riiklik pension (I sammas)</h3>' +
      '<p class="window">Ajaaken: kuni 5 aastat enne vanaduspensioniiga (' + (pa - 5) + '-aastaselt) või ükskõik millal hiljem.</p>' +
      '<p class="small mb-2">Riiklik pension ehk I sammas on Sotsiaalkindlustusameti makstav vanaduspension. Vanaduspensioniealt (' + pa + ') saad selle ilma vähendamise ja suurendamiseta. Varem või hiljem võtmist nimetab Sotsiaalkindlustusamet <strong>paindlikuks pensioniks</strong>: varem väheneb ja hiljem suureneb pension eluks ajaks.</p>' +
      '<label class="form-label" for="s1">Alustan</label><select class="form-select" id="s1">' +
      offs.map((k) => '<option value="' + k + '"' + (k === plan.stateOffset ? ' selected' : '') + '>' + (pa + k) + '-aastaselt (' + (by + pa + k) + ') · ' + (k === 0 ? 'õigel ajal' : sgnPct(P.STATE_COEF[String(k)])) + ' · ' + eur(input.p1Monthly * (1 + P.STATE_COEF[String(k)])) + ' kuus</option>').join('') + '</select>' +
      '<p class="small text-secondary mt-2 mb-0">Riiklik pension on ainus sissetulek, mis kestab elu lõpuni ja kasvab koos hindadega.</p></section>';
    $('decisions').innerHTML = iii + ii + i1 + '<p class="small-muted mt-2 mb-0">Kogumisfondi ja hoiust kasutame vajadusel enne sambaid.</p>';

    document.querySelectorAll('input[name=m3]').forEach((r) => r.addEventListener('change', () => { state.plan.p3.method = r.value; refreshDecisions(r); }));
    document.querySelectorAll('input[name=m2]').forEach((r) => r.addEventListener('change', () => { state.plan.p2.method = r.value; refreshDecisions(r); }));
    $('s3').addEventListener('change', () => { state.plan.p3.start = parseInt($('s3').value, 10); refreshDecisions($('s3')); });
    $('s2').addEventListener('change', () => { state.plan.p2.start = parseInt($('s2').value, 10); refreshDecisions($('s2')); });
    $('s1').addEventListener('change', () => { state.plan.stateOffset = parseInt($('s1').value, 10); refreshDecisions($('s1')); });
  }
  function refreshDecisions(src) {
    const key = src.id ? '#' + src.id : 'input[name="' + src.name + '"][value="' + src.value + '"]';
    renderDecisions(readInput());
    const el = document.querySelector(key); if (el) el.focus({ preventScroll: true });
    update(true);
  }
  function clampPlan(input) {
    if (!state.plan) state.plan = defaultPlan(input);
    const cur = currentAge();
    state.plan.p2.start = Math.min(75, Math.max(state.plan.p2.start, 60, cur));
    state.plan.p3.start = Math.min(75, Math.max(state.plan.p3.start, 55, cur));
    state.plan.stateOffset = Math.max(-5, Math.min(5, state.plan.stateOffset));
    if (input.pensionAgeYears + state.plan.stateOffset < Math.min(cur, input.pensionAgeYears)) state.plan.stateOffset = 0;
  }

  // ---------- tulemus ----------
  function answerHtml(r, L, input) {
    const need = input.needMonthly;
    let h = r.lastsUntil === null
      ? '<p class="headline">Sinu raha jätkub kogu eluks, vähemalt 100-aastaseks.</p>'
      : r.lastsUntil <= r.workUntil
        ? '<p class="headline">Sinu sissetulek ei kata vajadust juba pensioni alguses.</p>'
        : '<p class="headline">Sinu raha jätkub ' + r.lastsUntil + '-aastaseks.</p>';
    if (r.lastsUntil !== null) {
      const cover = r.needAfter > 0 ? Math.round(r.stateAfter / r.needAfter * 100) : 0;
      h += '<p class="mb-1">Pärast seda jääb riiklik pension ' + eur(r.stateAfter) + ' kuus, mis katab ' + cover + '% sinu vajadusest (' + eur(r.needAfter) + '). Tõenäosus, et elad kauem kui ' + r.lastsUntil + '-aastaseks: ' + pct(r.aliveBeyond) + '.</p>';
    }
    h += '<p class="mb-0">Kui kulutad ühtlaselt kuni <strong>' + eur(L) + ' kuus</strong>, jätkub raha ' + r.horizonAge + '-aastaseks. Selle vanuseni jõuab 10% sinuvanustest. ' +
      (L >= need ? 'Sinu vajadus (' + eur(need) + ') mahub sellesse.' : 'Sinu vajadus (' + eur(need) + ') on sellest suurem, seepärast saab raha varem otsa.') + '</p>';
    return h;
  }
  function renderMetrics(r) {
    const tiles = [
      [r.lastsUntil === null ? '100+' : r.lastsUntil + ' a', 'raha jätkub kuni'],
      [r.lastsUntil === null ? '–' : eur(r.stateAfter), 'kuus pärast seda (ainult riiklik pension)'],
      [eur(r.inheritance90), 'jääb pärandiks, kui elad 90-aastaseks'],
      [eur(r.tax90), 'tulumaks sammaste väljamaksetelt kuni 90'],
      [eur(r.stateSupport), 'riigi tugi sissemaksetele (II samba 4%, III samba tagastus)'],
    ];
    $('metrics').innerHTML = tiles.map((t, i) =>
      '<div class="' + (i < 2 ? 'col-6' : 'col-6 col-md-4') + '"><div class="metric"><div class="value">' + t[0] + '</div><div class="label">' + t[1] + '</div></div></div>').join('');
  }
  function renderCompare(input, mine, mineL) {
    const cols = [Object.assign({ id: 'S', name: 'Sinu plaan' }, state.plan)].concat(P.presets(input));
    const res = cols.map((c, i) => Object.assign({}, i === 0 ? mine : P.simulate(input, T, c), { L: i === 0 ? mineL : P.sustainableNeed(input, T, c) }));
    const rows = [
      ['Raha jätkub kuni', (r) => (r.lastsUntil === null ? 101 : r.lastsUntil), (v) => (v > 100 ? '100+' : v + ' a'), 'max'],
      ['Tõenäosus, et elad sellest kauem', (r) => (r.lastsUntil === null ? -1 : r.aliveBeyond), (v) => (v < 0 ? '–' : pct(v)), null],
      ['Sissetulek 90-aastaselt, kuus', (r) => r.spendAt90, eur, 'max'],
      ['Ühtlane kuukulu, mis jätkub ' + res[0].horizonAge + '-aastaseks', (r) => r.L, eur, 'max'],
      ['Pärandiks, kui elad 90-aastaseks', (r) => r.inheritance90, eur, 'max'],
      ['Tulumaks väljamaksetelt kuni 90', (r) => r.tax90, eur, 'min'],
      ['Riigi tugi sissemaksetele', (r) => r.stateSupport, eur, 'max'],
    ];
    const head = '<thead><tr><th scope="col"><span class="visually-hidden">Näitaja</span></th>' + cols.map((c) => '<th scope="col">' + (c.id === 'S' ? '' : c.id + '. ') + c.name + '</th>').join('') + '</tr></thead>';
    const body = rows.map(([label, get, fmt, best]) => {
      const vals = res.map(get);
      const top = best === 'max' ? Math.max(...vals) : best === 'min' ? Math.min(...vals) : null;
      const distinct = new Set(vals.map((v) => Math.round(v))).size > 1;
      return '<tr><th scope="row">' + label + '</th>' + vals.map((v, i) => '<td class="' + (i === 0 ? 'mine ' : '') + (best && distinct && v === top ? 'best' : '') + '">' + fmt(v) + '</td>').join('') + '</tr>';
    }).join('');
    const btns = '<tr><th scope="row"><span class="visually-hidden">Vali</span></th><td class="mine"></td>' + cols.slice(1).map((c) => '<td><button type="button" class="btn btn-sm btn-outline-primary" data-preset="' + c.id + '">Kasuta</button></td>').join('') + '</tr>';
    const caption = '<caption class="small">' + cols.slice(1).map((c) => '<strong>' + c.id + '.</strong> ' + c.short).join(' ') + '</caption>';
    $('compare').innerHTML = caption + head + '<tbody>' + body + btns + '</tbody>';
    $('compare').querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      const p = P.presets(input).find((x) => x.id === b.dataset.preset);
      state.plan = { stateOffset: p.stateOffset, p2: Object.assign({}, p.p2), p3: Object.assign({}, p.p3) };
      renderDecisions(readInput()); update(true);
      $('h-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function update(skipDecisions) {
    syncAgesSoft();
    const input = readInput();
    clampPlan(input);
    if (!skipDecisions) renderDecisions(input);
    const r = P.simulate(input, T, state.plan);
    const L = P.sustainableNeed(input, T, state.plan);
    $('answer').innerHTML = answerHtml(r, L, input);
    renderMetrics(r);
    window.PensionChart.render($('chart'), {
      rows: r.rows, startAge: Math.max(55, currentAge()), focusAge: r.lastsUntil || r.stateStart,
      readoutEl: $('chartReadout'), legendEl: $('legend'), tableEl: $('chartTable'),
      title: 'Sinu kuine sissetulek ja vajadus vanuse järgi',
      desc: r.lastsUntil === null ? 'Raha jätkub vähemalt 100-aastaseks.' : 'Raha jätkub ' + r.lastsUntil + '-aastaseks, edasi ainult riiklik pension ' + eur(r.stateAfter) + ' kuus.',
    });
    renderCompare(input, r, L);
    $('mobileSummaryText').textContent = r.lastsUntil === null ? 'Raha jätkub 100+ aastaseks' : 'Raha jätkub ' + r.lastsUntil + '-aastaseks';
    $('careReplaces').textContent = eur(careReplaces()) + ' kuus';
  }

  // ---------- sammud ----------
  const isLg = () => window.matchMedia('(min-width: 992px)').matches;
  function goStep(n) {
    const lg = isLg();
    state.step = Math.max(1, Math.min(lg ? 4 : 5, n));
    document.querySelectorAll('.step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === state.step));
    document.querySelectorAll('#stepper button').forEach((b) => {
      const on = Number(b.dataset.step) === state.step;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('prevBtn').disabled = state.step === 1;
    $('nextBtn').textContent = state.step === 4 && !lg ? 'Vaata tulemust →' : 'Edasi →';
    $('nextBtn').classList.toggle('invisible', lg ? state.step === 4 : state.step === 5);
    document.body.classList.toggle('show-results', state.step === 5);
  }
  const toTop = () => document.querySelector('.stepper').scrollIntoView({ block: 'nearest' });
  const toResults = () => window.scrollTo({ top: $('resultsCol').getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
  document.querySelectorAll('#stepper button').forEach((b) => b.addEventListener('click', () => { goStep(Number(b.dataset.step)); if (state.step === 5) update(); }));
  $('prevBtn').addEventListener('click', () => { goStep(state.step - 1); toTop(); });
  $('nextBtn').addEventListener('click', () => { goStep(state.step + 1); if (state.step === 5) { update(); toResults(); } else toTop(); });
  $('mobileResultBtn').addEventListener('click', () => { goStep(5); update(); toResults(); });
  let lastLg = isLg();
  window.addEventListener('resize', () => {
    clearTimeout(window._rt);
    window._rt = setTimeout(() => { if (isLg() !== lastLg) { lastLg = isLg(); goStep(state.step); } update(true); }, 200);
  });

  // ---------- Tuleva konto eeltäitmine (näidisandmed) ----------
  const DEMO = {
    fields: { birthYear: 1968, sex: 'N', pensionAgeYears: 66, p2: 38400, p3: 21700, tkf: 3200, p3Before2021: '1', grossMonthly: 2900, p2Rate: '0.04', p3Monthly: 150, tkfMonthly: 50 },
    rows: [
      ['Sünnikuupäev', '14.03.1968, 58-aastane', 'tuleva', '/v1/me · dateOfBirth, age'],
      ['Sugu', 'naine', 'tuleva', 'isikukoodi esimene number, arvutatakse brauseris'],
      ['Vanaduspensioniiga', '66 a (registris 65, Tuleva prognoos sünniaasta järgi)', 'tuleva', '/v1/me · retirementAge'],
      ['II sammas', '38 400 €', 'tuleva', '/v1/me/capital'],
      ['III sammas', '21 700 €', 'tuleva', '/v1/me/capital'],
      ['Täiendav Kogumisfond', '3 200 €, 50 € kuus', 'tuleva', '/v1/savings-account-statement, /v1/savings/payments'],
      ['III sambaga liitumine', 'mai 2012: soodsa maksuga alates 55 (14.03.2023)', 'tuleva', '/v1/me · thirdPillarInitDate; /v1/withdrawals/eligibility'],
      ['II samba makse', '4%', 'tuleva', '/v1/me · secondPillarPaymentRates'],
      ['Brutopalk', '2 900 € kuus', 'tuleva', 'tuletatud: /v1/contributions'],
      ['III sambasse', '150 € kuus', 'tuleva', 'tuletatud: /v1/contributions'],
      ['Fonditasu', '0,28% aastas (kaalutud keskmine)', 'tuleva', '/v1/me/conversion · weightedAverageFee'],
      ['Varase pensioni kuupäev', '14.03.2028 (60-aastaselt)', 'tuleva', '/v1/withdrawals/eligibility · earlyRetirementDate'],
      ['Maksuvaba fondipensioni periood', 'selgub 60-aastaselt', 'tuleva', '/v1/withdrawals/eligibility · recommendedDurationYears'],
      ['Aktiivne fondipension', 'ei', 'tuleva', '/v1/withdrawals/fund-pension-status'],
      ['Riiklik pension', 'Tuleval puudub: sisesta SKA kalkulaatorist', 'puudub', 'tulevikus SKA päring nõusolekul (X-tee)'],
      ['Kulud', 'Tuleval puudub: täidetud statistikast', 'stat', 'Statistikaamet LE205, LE211, IA002'],
    ],
  };
  const CHIP = { tuleva: 'Tuleva konto', stat: 'Statistikaamet', puudub: 'puudub' };
  const DEFAULTS = {};
  Object.keys(DEMO.fields).forEach((id) => { DEFAULTS[id] = $(id).value; });
  const labelFor = (id) => document.querySelector('label[for="' + id + '"]');
  $('prefillBtn').addEventListener('click', () => {
    state.paTouched = true;
    Object.entries(DEMO.fields).forEach(([id, v]) => {
      const el = $(id); el.value = String(v); el.classList.add('is-prefilled');
      const lab = labelFor(id);
      if (lab && !lab.querySelector('.src-chip')) lab.insertAdjacentHTML('beforeend', '<span class="src-chip tuleva">Tuleva</span>');
    });
    $('prefillPanel').innerHTML = '<div class="fw-medium text-navy mb-1">Tuleva kontolt eeltäidetud (näidis)</div><div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th scope="col">Väli</th><th scope="col">Väärtus</th><th scope="col">Allikas</th></tr></thead><tbody>' +
      DEMO.rows.map((r) => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td><span class="src-chip ' + r[2] + ' ms-0">' + CHIP[r[2]] + '</span> <code>' + r[3] + '</code></td></tr>').join('') + '</tbody></table></div>';
    $('prefillPanel').classList.remove('d-none'); $('clearBtn').classList.remove('d-none');
    state.plan = null; lastBirth = null;
    fillNeedFromStats(); update();
  });
  $('clearBtn').addEventListener('click', () => {
    Object.entries(DEFAULTS).forEach(([id, v]) => {
      const el = $(id); el.value = v; el.classList.remove('is-prefilled');
      const chip = labelFor(id) && labelFor(id).querySelector('.src-chip'); if (chip) chip.remove();
    });
    state.paTouched = false; state.workTouched = false; state.plan = null; lastBirth = null;
    $('prefillPanel').classList.add('d-none'); $('clearBtn').classList.add('d-none');
    update();
  });

  // ---------- sündmused ----------
  $('pensionAgeYears').addEventListener('change', () => { state.paTouched = true; state.plan = null; });
  $('workUntil').addEventListener('change', () => { state.workTouched = true; state.plan = null; });
  document.querySelectorAll('input[name=level]').forEach((r) => r.addEventListener('change', () => { fillNeedFromStats(); update(); }));
  $('household').addEventListener('change', () => { fillNeedFromStats(); update(); });
  $('needMonthly').addEventListener('input', () => {
    document.querySelectorAll('.need-cat').forEach((el) => { el.value = ''; el.classList.remove('is-prefilled'); });
    setNeedSource('own');
  });
  $('careOn').addEventListener('change', () => { $('careFields').classList.toggle('d-none', !$('careOn').checked); update(); });
  document.querySelectorAll('.step[data-step="1"] input, .step[data-step="1"] select, .step[data-step="2"] input, .step[data-step="2"] select, #needMonthly, #careFrom, #careMonthly').forEach((el) => {
    el.addEventListener('input', () => { if (el.closest('.step[data-step="1"], .step[data-step="2"]')) el.classList.remove('is-prefilled'); update(); });
  });

  $('lifeYear').textContent = T.aasta;
  $('kuludMeta').textContent = 'uuring ' + K.uuringuaasta + ', hinnad ' + kuu(K.hinnad);
  renderNeedCats();
  syncAges(); lastBirth = $('birthYear').value; lastPa = $('pensionAgeYears').value;
  fillNeedFromStats();
  goStep(1);
  update();
})();
