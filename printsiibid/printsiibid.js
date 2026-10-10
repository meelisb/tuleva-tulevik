// Tulevane Mina, prototüüp 2: lihtne otsustuspuu põhimõtete peal. Arvutusi ei tehta, ainult reeglid.
(function () {
  'use strict';

  const SKA = 'https://iseteenindus.sotsiaalkindlustusamet.ee/self-service/pension-calculator';
  const QUESTIONS = [
    { id: 'work', text: 'Kas sa veel töötad või plaanid edasi töötada?', opts: [['jah', 'Jah'], ['ei', 'Ei, olen lõpetanud või lõpetan kohe']] },
    { id: 'state', text: 'Kas riiklik pension üksi katab sinu igapäevased kulud?', hint: 'Riikliku pensioni prognoosi näed Sotsiaalkindlustusameti pensionikalkulaatorist.',
      opts: [['jah', 'Jah'], ['ei', 'Ei'], ['eitea', 'Ei tea']], when: (a) => a.work === 'ei' },
    { id: 'sav', text: 'Kas sul on hoiuseid vähemalt 6 kuu kulude jagu?', opts: [['jah', 'Jah'], ['ei', 'Ei']] },
    { id: 'big', text: 'Kas sul on lähiajal ees suur ühekordne kulu, näiteks remont, auto või ravi?', opts: [['jah', 'Jah'], ['ei', 'Ei']] },
    { id: 'tax', text: 'Kas sul on tulu, millelt maksad tulumaksu?', hint: 'Näiteks palk, ettevõtlustulu või pension, mis on suurem kui maksuvaba piir.',
      opts: [['jah', 'Jah'], ['ei', 'Ei'], ['eitea', 'Ei tea']], when: (a) => a.work === 'ei' },
    { id: 'goal', text: 'Mis on sulle kõige tähtsam?', opts: [
      ['aktiivne', 'Rohkem raha esimestel pensioniaastatel, kui olen veel aktiivne'],
      ['uhtlane', 'Ühtlane sissetulek kogu eluks'],
      ['parand', 'Jätta lähedastele pärandit'],
      ['kindlus', 'Kindlus väga vanas eas (hooldekodu, haigused)'],
    ] },
  ];
  const answers = {};

  const visible = () => {
    const out = [];
    for (const q of QUESTIONS) {
      if (q.when && !q.when(answers)) continue;
      out.push(q);
      if (!answers[q.id]) break;
    }
    return out;
  };

  function render() {
    const qs = visible();
    document.getElementById('tree').innerHTML = qs.map((q, i) =>
      '<fieldset class="q"><legend>' + (i + 1) + '. ' + q.text + '</legend>' + (q.hint ? '<p class="hint">' + q.hint + '</p>' : '') +
      '<div class="opts">' + q.opts.map(([v, l]) =>
        '<label class="opt"><input type="radio" name="' + q.id + '" value="' + v + '"' + (answers[q.id] === v ? ' checked' : '') + '> ' + l + '</label>').join('') +
      '</div></fieldset>').join('');
    document.querySelectorAll('#tree input').forEach((inp) => inp.addEventListener('change', () => {
      answers[inp.name] = inp.value;
      // vastuse muutmine tühistab sellest sõltuvad hilisemad vastused
      const idx = QUESTIONS.findIndex((q) => q.id === inp.name);
      QUESTIONS.slice(idx + 1).forEach((q) => { if (q.when && !q.when(answers)) delete answers[q.id]; });
      render();
      const next = document.querySelectorAll('#tree fieldset')[QUESTIONS.filter((q) => !q.when || q.when(answers)).findIndex((q) => !answers[q.id])];
      if (next) next.querySelector('input').focus({ preventScroll: false });
    }));
    const done = QUESTIONS.every((q) => (q.when && !q.when(answers)) || answers[q.id]);
    const res = document.getElementById('result');
    res.classList.toggle('d-none', !done);
    if (done) res.innerHTML = recommendation(answers);
    const again = document.getElementById('again');
    if (again) again.addEventListener('click', () => { Object.keys(answers).forEach((k) => delete answers[k]); render(); document.getElementById('puu').scrollIntoView({ behavior: 'smooth' }); });
  }

  const P = (...n) => n.map((x) => '<a class="pchip" href="#p' + x + '">põhimõte ' + x + '</a>').join('');

  function recommendation(a) {
    const steps = [];
    const add = (text, why, ps) => steps.push('<li><strong>' + text + '</strong>' + P(...ps) + '<span class="why">' + why + '</span></li>');
    if (a.sav === 'ei') add('Hoia 3–6 kuu kulud hoiusel puhvriks.', 'Puhver katab ootamatud kulud, nii et sambast ei pea raha korraga võtma. Ülejäänu las kasvab fondis.', [2]);
    if (a.work === 'jah') {
      add('Ära alusta II sambast enne töötamise lõppu.', 'Esimene väljamakse lõpetab II samba sissemaksed igaveseks, ka riigi 4% sinu palgast.', [1]);
      add('Maksa III sambasse kuni 15% palgast, kuni 6 000 € aastas.', 'Saad 22% tulumaksu tagasi. Hiljem võtad raha välja 10% maksuga või igakuiselt ilma maksuta.', [3, 4]);
      if (a.big === 'jah') add('Suure kulu jaoks kasuta esmalt hoiust, siis osalist väljamakset III sambast.', 'III sambast saad soodsa maksuga (10%) alates 55. või 60. eluaastast. II sammast ära puutu.', [1, 2]);
      add('Kaalu riikliku pensioni edasilükkamist, kuni palk katab sinu kulud.', 'Iga aasta hiljem tõstab riiklikku pensioni eluks ajaks umbes 8%.', [6]);
    } else {
      if (a.big === 'jah') add('Suure kulu jaoks kasuta esmalt hoiust, siis osalist väljamakset III sambast.', 'Võta ainult nii palju, kui vaja (10% maks). Ära võta kogu sammast korraga.', [2]);
      if (a.state === 'jah') {
        add('Jäta II ja III sammas fondi kasvama.', 'Igakuist väljamakset pole veel vaja. Raha kasvab edasi, pärandub ja on olemas hilisemate suurte kulude või hooldekodu jaoks.', [2, 4]);
      } else {
        add('Alusta igakuise fondipensioniga, mitte ühekordse väljamaksega.', 'Igakuine väljamakse vähemalt elada jäänud aastate jooksul on tulumaksuta, korraga võttes maksad 10%.', [4, 2]);
        add('Alusta III sambast. Kui sellest ei piisa, lisa II sammas.', 'See on Tuleva soovitatud järjekord: hoiused, muud investeeringud, III sammas, siis II sammas.', [4]);
        if (a.state === 'eitea') add('Võrdle riiklikku pensioni oma kuludega.', 'Vaata prognoosi <a href="' + SKA + '" target="_blank" rel="noopener">Sotsiaalkindlustusameti pensionikalkulaatorist<span aria-hidden="true"> ↗</span><span class="visually-hidden"> (avaneb uuel lehel)</span></a> ja võrdle oma kuukuludega.', [6]);
      }
      if (a.tax === 'jah') add('Jätka III samba sissemakseid ka pensionil.', 'Kuni sul on maksustatavat tulu, saad iga sissemakse eest 22% tagasi.', [3]);
    }
    const goal = {
      aktiivne: ['Vali lühim maksuvaba periood ja sõlmi fondipensioni leping igal aastal uuesti.', 'Saad alguses rohkem. Raha ei saa otsa, aga väga kõrges eas on kuumakse väike.', [5, 4]],
      uhtlane: ['Vali pikem periood, näiteks kuni 90.–95. eluaastani, ja uuenda lepingut igal aastal.', 'Algus on väiksem, aga makse püsib ühtlasem ka vanas eas.', [5]],
      parand: ['Võta vähem: näiteks 25-aastase perioodiga leping.', 'Osakud jäävad fondi kasvama ja lähevad pärijatele. Kindlustusleping üldjuhul ei pärandu.', [5]],
      kindlus: ['Lükka riiklik pension edasi, kui saad vahepeal elada muust rahast, ja hoia osa sambast puhvriks.', 'Riiklik pension on ainus sissetulek, mis kestab elu lõpuni ja kasvab koos hindadega. Kindlustusleping maksab samuti elu lõpuni, aga on kallis ja ei pärandu.', [6, 5]],
    }[a.goal];
    add(goal[0], goal[1], goal[2]);
    add('Ära võta kõike korraga välja.', 'Kohe läheb 10% tulumaksu ja hoiusel sööb inflatsioon raha edasi.', [2]);
    return '<h3>Sinu järjekord</h3><ol class="steps-list">' + steps.join('') + '</ol>' +
      '<p class="small text-secondary mb-2">Need on lihtsustatud reeglid, mitte isiklik nõu.</p>' +
      '<button type="button" class="btn btn-outline-primary btn-sm" id="again">Alusta uuesti</button>';
  }

  render();
})();
