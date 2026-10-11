// Tulevane Mina: ligipääsetav SVG-graafik. Joonistab konteineri tegeliku laiusega (ei skaleeri teksti väikeseks),
// vanust saab valida hiire, puute ja nooleklahvidega, kõik väärtused on ka tabelina.
(function () {
  'use strict';

  const COLORS = { i1: '#002f63', i23: '#00aeea', sav: '#9fd8f0', short: '#db2200', need: '#db2200', alive: '#6b7074', money: '#006ce6', grid: '#e0e6ec', work: '#f5f7f9' };
  const SERIES = [
    ['i1', 'Riiklik pension (I sammas, pärast tulumaksu)'],
    ['i23', 'II ja III sammas'],
    ['sav', 'Säästudest (hoius, kogumisfond, korraga välja võetud raha)'],
    ['short', 'Puudu'],
  ];
  const eur = (v) => Math.round(v).toLocaleString('et-EE') + ' €';
  const kEur = (v) => (v >= 1000 ? Math.round(v / 1000).toLocaleString('et-EE') + ' tuh €' : Math.round(v) + ' €');
  const NS = 'http://www.w3.org/2000/svg';

  function niceMax(v) {
    const steps = [200, 250, 500, 1000, 2000, 2500, 5000];
    for (const s of steps) if (v <= s * 4) return Math.ceil(v / s) * s;
    return Math.ceil(v / 5000) * 5000;
  }

  function el(name, attrs, text) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function render(container, opts) {
    const rows = opts.rows.filter((r) => r.age >= opts.startAge);
    const W = Math.max(300, container.clientWidth || 600);
    const narrow = W < 480;
    const mainH = narrow ? 210 : 260, gap = 26, survH = narrow ? 56 : 64, monH = narrow ? 56 : 64;
    const m = { l: narrow ? 50 : 58, r: 8, t: 10, b: 22 };
    const H = m.t + mainH + gap + monH + gap + survH + m.b;
    const iw = W - m.l - m.r;
    const n = rows.length, bw = iw / n;
    const maxV = niceMax(Math.max(1, ...rows.map((r) => Math.max(r.need, r.i1 + r.i23 + r.sav + r.shortfall))) * 1.05);
    const y = (v) => m.t + mainH - (v / maxV) * mainH;
    const x = (i) => m.l + i * bw;
    // all paneelid: raha alles (sambad + hoius + kogumisfond) ja tõenäosus olla elus
    const maxM = Math.max(1, ...rows.map((r) => r.moneyLeft));
    const ym = (v) => m.t + mainH + gap + monH - (v / maxM) * monH;
    const ys = (p) => m.t + mainH + gap + monH + gap + survH - p * survH;

    container.innerHTML = '';
    const svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-labelledby': 'chartT chartD', class: 'chart-svg' });
    svg.appendChild(el('title', { id: 'chartT' }, opts.title));
    svg.appendChild(el('desc', { id: 'chartD' }, opts.desc));

    const defs = el('defs', {});
    const pat = el('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(el('rect', { width: 6, height: 6, fill: '#fff' }));
    pat.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: COLORS.short, 'stroke-width': 2.5 }));
    defs.appendChild(pat); svg.appendChild(defs);

    // töötamise aeg taustaks
    const workIdx = rows.filter((r) => r.working).length;
    if (workIdx > 0) {
      svg.appendChild(el('rect', { x: m.l, y: m.t, width: workIdx * bw, height: mainH, fill: COLORS.work }));
      svg.appendChild(el('text', { x: m.l + 4, y: m.t + 14, class: 'chart-note' }, 'töötad'));
    }
    // ruudustik ja y-telg
    for (let k = 0; k <= 4; k++) {
      const v = (maxV / 4) * k, yy = y(v);
      svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: yy, y2: yy, stroke: COLORS.grid }));
      svg.appendChild(el('text', { x: m.l - 6, y: yy + 4, 'text-anchor': 'end', class: 'chart-tick' }, Math.round(v).toLocaleString('et-EE') + ' €'));
    }
    // tulbad
    rows.forEach((r, i) => {
      let base = 0;
      const pad = Math.min(2, bw * 0.15);
      for (const [key] of SERIES) {
        const v = key === 'short' ? r.shortfall : r[key];
        if (v <= 0.5) continue;
        const attrs = { x: x(i) + pad / 2, y: y(base + v), width: Math.max(1, bw - pad), height: y(base) - y(base + v) };
        attrs.fill = key === 'short' ? 'url(#hatch)' : COLORS[key];
        if (key === 'short') { attrs.stroke = COLORS.short; attrs['stroke-width'] = 0.8; }
        svg.appendChild(el('rect', attrs));
        base += v;
      }
    });
    // vajaduse joon
    let d = '';
    rows.forEach((r, i) => { if (r.need > 0) d += (d && rows[i - 1] && rows[i - 1].need > 0 ? 'L' : 'M') + x(i) + ' ' + y(r.need) + 'H' + (x(i) + bw); });
    if (d) svg.appendChild(el('path', { d: d, fill: 'none', stroke: COLORS.need, 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
    // x-telg
    const step = narrow ? 10 : 5;
    rows.forEach((r, i) => {
      if (r.age % step === 0) {
        svg.appendChild(el('text', { x: x(i) + bw / 2, y: H - 6, 'text-anchor': 'middle', class: 'chart-tick' }, String(r.age)));
        svg.appendChild(el('line', { x1: x(i) + bw / 2, x2: x(i) + bw / 2, y1: m.t + mainH, y2: m.t + mainH + 4, stroke: COLORS.alive }));
      }
    });
    // raha alles
    svg.appendChild(el('text', { x: m.l, y: m.t + mainH + gap - 8, class: 'chart-label' }, 'Raha alles: sambad, hoius, kogumisfond'));
    [0, 1].forEach((k) => {
      svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: ym(k * maxM), y2: ym(k * maxM), stroke: COLORS.grid }));
      svg.appendChild(el('text', { x: m.l - 6, y: ym(k * maxM) + 4, 'text-anchor': 'end', class: 'chart-tick' }, kEur(k * maxM)));
    });
    let md = '';
    rows.forEach((r, i) => { md += (i ? 'L' : 'M') + (x(i) + bw / 2) + ' ' + ym(Math.max(0, r.moneyLeft)); });
    svg.appendChild(el('path', { d: md + 'L' + (x(n - 1) + bw / 2) + ' ' + ym(0) + 'L' + (x(0) + bw / 2) + ' ' + ym(0) + 'Z', fill: COLORS.money, 'fill-opacity': 0.12, stroke: 'none' }));
    svg.appendChild(el('path', { d: md, fill: 'none', stroke: COLORS.money, 'stroke-width': 2 }));
    // ellujäämise paneel
    svg.appendChild(el('text', { x: m.l, y: m.t + mainH + gap + monH + gap - 8, class: 'chart-label' }, 'Tõenäosus olla elus'));
    [0, 0.5, 1].forEach((p) => {
      svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: ys(p), y2: ys(p), stroke: COLORS.grid }));
      svg.appendChild(el('text', { x: m.l - 6, y: ys(p) + 4, 'text-anchor': 'end', class: 'chart-tick' }, Math.round(p * 100) + '%'));
    });
    let sd = '';
    rows.forEach((r, i) => { sd += (i ? 'L' : 'M') + (x(i) + bw / 2) + ' ' + ys(r.alive); });
    svg.appendChild(el('path', { d: sd, fill: 'none', stroke: COLORS.alive, 'stroke-width': 2 }));
    // valitud vanus
    const marker = el('line', { y1: m.t, y2: ys(0), stroke: '#293036', 'stroke-width': 1, 'stroke-dasharray': '2 2', visibility: 'hidden' });
    svg.appendChild(marker);
    container.appendChild(svg);

    function select(i) {
      i = Math.max(0, Math.min(n - 1, i));
      container.dataset.idx = String(i);
      const r = rows[i], cx = x(i) + bw / 2;
      marker.setAttribute('x1', cx); marker.setAttribute('x2', cx); marker.setAttribute('visibility', 'visible');
      const parts = [r.age + '-aastaselt (' + r.year + '):', 'riiklik pension ' + eur(r.i1) + ',', 'sambad ' + eur(r.i23) + ',', 'säästudest ' + eur(r.sav)];
      if (r.shortfall > 0.5) parts.push(', puudu ' + eur(r.shortfall));
      parts.push(r.working ? ' · töötad' : ' · vajadus ' + eur(r.need));
      parts.push(' · raha alles ' + eur(r.moneyLeft));
      parts.push(' · tõenäosus olla elus ' + Math.round(r.alive * 100) + '%');
      opts.readoutEl.textContent = parts.join(' ').replace(/ ,/g, ',').replace(/\s+·/g, ' ·').replace(/\s{2,}/g, ' ');
    }
    const idxAt = (clientX) => Math.floor((clientX - svg.getBoundingClientRect().left - m.l) / bw);
    svg.addEventListener('pointermove', (e) => select(idxAt(e.clientX)));
    svg.addEventListener('pointerdown', (e) => select(idxAt(e.clientX)));
    container.onkeydown = (e) => {
      const cur = Number(container.dataset.idx || 0);
      const map = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 0, End: n - 1 };
      if (e.key in map) { e.preventDefault(); select(map[e.key]); }
    };
    const pref = rows.findIndex((r) => r.age === opts.focusAge);
    select(container.dataset.idx && Number(container.dataset.idx) < n ? Number(container.dataset.idx) : pref >= 0 ? pref : 0);

    // legend
    opts.legendEl.innerHTML = SERIES.map(([k, l]) =>
      '<li><span class="sw ' + k + '" aria-hidden="true"></span>' + l + '</li>').join('') +
      '<li><span class="sw need" aria-hidden="true"></span>Vajadus</li><li><span class="sw money" aria-hidden="true"></span>Raha alles (all)</li><li><span class="sw alive" aria-hidden="true"></span>Tõenäosus olla elus (all)</li>';
    // tabel
    const tr = rows.filter((r) => r.age % 5 === 0 || r === rows[0]);
    opts.tableEl.innerHTML = '<thead><tr><th scope="col">Vanus (aasta)</th><th scope="col">Riiklik pension</th><th scope="col">II ja III sammas</th><th scope="col">Säästudest</th><th scope="col">Puudu</th><th scope="col">Vajadus</th><th scope="col">Raha alles</th><th scope="col">Tõenäosus olla elus</th></tr></thead><tbody>' +
      tr.map((r) => '<tr><th scope="row">' + r.age + ' (' + r.year + ')</th><td>' + eur(r.i1) + '</td><td>' + eur(r.i23) + '</td><td>' + eur(r.sav) + '</td><td>' + eur(r.shortfall) + '</td><td>' + (r.working ? 'töötad' : eur(r.need)) + '</td><td>' + eur(r.moneyLeft) + '</td><td>' + Math.round(r.alive * 100) + '%</td></tr>').join('') + '</tbody>';
  }

  window.PensionChart = { render: render };
})();
