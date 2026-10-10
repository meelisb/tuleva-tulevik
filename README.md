# tuleva-tulevik

Tiimi „Tulevane Mina“ töö Tuleva häkatonil (9.–11.10.2026). Küsimus, millele prototüübid vastavad: **kas su pensionisissetulek kestab elu lõpuni?**

- [Tööleht ja pitch'i taust](tulevane_mina_tooleht_ja_pitch_2026-10-10.md)
- [Otsuste logi](docs/otsuste_logi.md): kuupäevadega otsused, kontrollitud faktid, parandatud vead
- [Tasuvusmudel](docs/kulumudel.md): mitu fondipensioni valinud kogujat tasub Elukaare ehituse ja ülalpidamise ära (`node scripts/kulumudel.js`)
- [CLAUDE.md](CLAUDE.md): kuidas repot jätkata (reeglid, mudeli konventsioonid, testimine, majutus)
- [Tuleva reporting engine: mis andmed seal on ja mis meile kasulik](reporting_engine_andmed_2026-10-10.md)
- [Vaibtöö: ehita oma idee AI-agendiga](https://seppo.ai/tulevahack/) (Indrek Seppo juhend häkatoni osalejatele: prototüüp Claude Code'i või Codexiga)

## Prototüübid

| Prototüüp | Kaust | Sisu | Mootor |
|---|---|---|---|
| Avaleht | `index.html` | Lingid kolmele prototüübile | – |
| 1. **Kalkulaator** | `kalkulaator/` | Sinu andmed, kulud, otsused (riiklik pension varem või hiljem, II ja III samba viis ja algus, töötamine), tulemus koos valmisstrateegiatega | `kalkulaator/pension.js` |
| 2. **Printsiibid** | `printsiibid/` | Kuus põhimõtet ja otsustuspuu, arvutusi ei tehta | – |
| 3. **Elukaar** | `elukaar/` | Pensionilugu eluetappide kaupa: valikud 55-, 60- ja pensionieas, kulutase, tulemus ja allalaadimine | `elukaar/pension.js` |

Igal arvutaval prototüübil on oma mootor. Elukaare mootor on kalkulaatori varasema mootori edasiarendus. Samade sisenditega (ilma sissemakseteta) annavad mõlemad sama tulemuse; seda kontrollib `tests/elukaar.scenarios.test.js`.

Ühised failid: `css/tuleva.css` (Tuleva disainisüsteemi tokenid ja põhistiilid, prototüübi omad stiilid on prototüübi kaustas) ja `data/` (Statistikaameti andmed).

## Käivitamine

Build-sammu ei ole. Kõik arvutused tehakse brauseris.

```bash
python3 -m http.server 8000
```

Seejärel ava http://localhost:8000.

Failide URL-idel on versioon (`?v=…`). Muuda see kõigis `index.html` failides iga avaldamisega, muidu võib brauser kasutada vana ja uue koodi segu (GitHub Pages: `cache-control: max-age=600`).

Avaldamine: `.github/workflows/pages.yml` avaldab ainult haru `main` aadressile https://meelisb.github.io/tuleva-tulevik/ (avaleht, `/kalkulaator/`, `/printsiibid/`, `/elukaar/`). Teisi harusid ei avaldata ja GitHubi keskkond `github-pages` lubab avaldada ainult `main`-ist. Vana aadress `/kadi-branch/` suunab `/elukaar/` lehele.

Muudatused: tee lühiajaline haru, ühenda see `main`-i ja kustuta haru. Elukaare muudatused käivad kausta `elukaar/`.

## Kulutasemed (mõlemas prototüübis samad)

| Tase | Mis see on | Üksi | Paaris (inimese kohta) |
|---|---|---|---|
| Kokkuhoidlik | Tänaste pensionäride keskmine kulu (Statistikaamet LE205: üksik 65+ ja lasteta üle 64-aastaste paar) | 791 € | 667 € |
| Optimaalne | Sama, korrutatud kategooria kaupa IV tulukvintiili kulude suhtega keskmisesse (LE211) | 891 € | 764 € |
| Mugav | Sama, V tulukvintiili suhtega | 1 261 € | 1 083 € |

Summad on kuus, tänases rahas (uuring 2020, hinnad 09/2026 kaubagrupi tarbijahinnaindeksiga, IA002).

- Kategooriad katavad kogu kulu: tarbimiskulud ja Statistikaameti „muud kulutused“, mida näitame nimega **Kingitused, annetused jm** (raha kinkimine, annetused, alimendid ja ülalpidamisraha väljapoole leibkonda, trahvid). Pensionäridel 20 € kuus (üksi) ehk 2,6% kogukulust.
- Haridust pensionäride kohta ei avaldata (liiga vähe vastajaid). See on arvutatud kui kogukulu miinus ülejäänud kategooriad (u 1 € kuus).
- **Piirang:** IV ja V kvintiili suhe on kõigi leibkondade andmetest. Pensionäride kohta tulukvintiilide kaupa avalikku tabelit ei ole (LE205, LE212 ja LE214 annavad pensionäride kohta ainult keskmise). Täpsema taseme jaoks saab Statistikaametilt tellida eritabeli.

## Struktuur

| Fail | Sisu |
|---|---|
| `kalkulaator/pension.js` | Kalkulaatori mootor: pensioniiga, ellujäämine, fondipension, sissemaksed, maksud, stsenaariumid. Puhtad funktsioonid |
| `kalkulaator/app.js`, `chart.js`, `kalkulaator.css` | Kalkulaatori liides, ligipääsetav SVG-graafik ja stiilid |
| `elukaar/pension.js` | Elukaare mootor (stsenaariumid A–E) |
| `elukaar/story.js`, `story.css` | Elukaare liides |
| `printsiibid/` | Prototüüp 2 |
| `data/elutabel.js`, `scripts/fetch_elutabel.py` | Statistikaameti elutabel (RV045, RV046). Genereeritud: `python3 scripts/fetch_elutabel.py` |
| `data/kulud.js`, `scripts/fetch_kulud.py` | Kulutasemed (LE205, LE211, IA002). Genereeritud: `python3 scripts/fetch_kulud.py` |
| `tests/pension.test.js`, `tests/scenarios.test.js` | Kalkulaatori testid (~9 600 kontrolli, tabel: `node tests/scenarios.test.js --table`) |
| `tests/elukaar.test.js`, `tests/elukaar.scenarios.test.js` | Elukaare testid (~6 800 kontrolli): kasv ühe korra, rahavoogude tasakaal, loogika, ristkontroll kalkulaatoriga |
| `tests/e2e.mjs` | Brauseritest kõigile prototüüpidele (lauaarvuti ja mobiil): `npm install` ja `node tests/e2e.mjs http://localhost:8000` |

Kõik arvutustestid: `npm test`.

## Eeldused

Summad on tänases rahas. Edasilükkamise tõusud on SKA 2026 keskmised. Kindlustuslepingut (annuiteeti) ei arvestata.

**Lihtsustused (mõlemas prototüübis):**

- Riiklikult pensionilt tulumaksu ei arvestata (ka pensionäri maksuvaba tulu mitte).
- Palk ja riiklik pension reaalselt ei kasva: mõlemad on kogu aeg tänases rahas sama suured.
- Pensioniea järel töötamine riiklikku pensioni ei suurenda.

- Kalkulaator: sissemaksed jätkuvad töötamise lõpuni, hoiuse intress jääb vaikimisi inflatsioonist 1% maha, III samba tulumaksutagastus on arvestatud.
- Elukaar: väljamaksed algavad pensionieas, hoiuse intress jääb inflatsioonist 1% maha (nagu kalkulaatoris), III samba tulumaksutagastust ei arvestata.

Tööversioon. Ei ole finants-, maksu- ega õigusnõu.
