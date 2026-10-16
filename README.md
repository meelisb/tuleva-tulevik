# tuleva-tulevik

Tiimi „Tulevane Mina“ töö Tuleva häkatonil (9.–11.10.2026). Küsimus, millele prototüübid vastavad: **kas su pensionisissetulek kestab elu lõpuni?**

## Testi kohe

| | Link |
|---|---|
| Esitletud prototüüp | https://tulevanemina.ee |
| Avaleht (kõik prototüübid) | https://meelisb.github.io/tuleva-tulevik/ |
| 1. Kalkulaator | https://meelisb.github.io/tuleva-tulevik/kalkulaator/ |
| 2. Printsiibid | https://meelisb.github.io/tuleva-tulevik/printsiibid/ |
| 3. Elukaar | https://meelisb.github.io/tuleva-tulevik/elukaar/ |

Kui leht näib vana, laadi uuesti (Cmd+Shift+R). Avaldus toimub iga `main`-i push'iga umbes minutiga.

**Testijate tagasiside** käib tiimi teise lehe kaudu:
- Tagasisidevorm: https://tulevanemina.ee/tagasiside/
- Tulemused: https://tulevanemina.ee/tulemused (eksport: `/tulemused-tagasiside.csv`). Leht on parooliga; **parool on tiimi sisekanalis, mitte selles avalikus repos**, sest tulemuste lehel on ka testijate e-posti aadresside eksport.
- Testijad kasutasid Elukaare koopiat aadressil https://tulevanemina.ee/elukaar/ (tiimi teine repo). See erineb siinsest: siin on lisaks töötamine pärast pensioniiga ja Pensionikeskuse reeglile vastav fondipensioni makse.
- Kokkuvõte: [testijate tagasiside 11.10](docs/testijate_tagasiside_2026-10-11.md). Tagasiside põhjal prototüüpe veel ei muudeta (Meelise otsus 11.10).

- [Pitch'i slaidid](https://docs.google.com/presentation/d/1xyJTx9TOP8s0AkDgao7eNAiX3P1U2tR-/edit) (Google Slides)
- [Tööleht ja pitch'i taust](tulevane_mina_tooleht_ja_pitch_2026-10-10.md)
- [Otsuste logi](docs/otsuste_logi.md): kuupäevadega otsused, kontrollitud faktid, parandatud vead
- [Testijate tagasiside 11.10](docs/testijate_tagasiside_2026-10-11.md): Elukaare test, 16 vastust, teemad ja ettepanekud
- [Tasuvusmudel](docs/kulumudel.md): mitu fondipensioni valinud kogujat tasub Elukaare ehituse ja ülalpidamise ära (`node scripts/kulumudel.js`)
- [CLAUDE.md](CLAUDE.md): kuidas repot jätkata (reeglid, mudeli konventsioonid, testimine, majutus)
- [Tuleva reporting engine: mis andmed seal on ja mis meile kasulik](reporting_engine_andmed_2026-10-10.md)
- [Vaibtöö: ehita oma idee AI-agendiga](https://seppo.ai/tulevahack/) (Indrek Seppo juhend häkatoni osalejatele: prototüüp Claude Code'i või Codexiga)

## Prototüübid

| Prototüüp | Kaust | Sisu | Mootor |
|---|---|---|---|
| Avaleht | `index.html` | Lingid kolmele prototüübile | – |
| 1. **Kalkulaator** | `kalkulaator/` | Sinu andmed, kulud, otsused (riiklik pension varem või hiljem, II ja III samba viis ja algus, töötamine ka pärast pensioniiga), tulemus koos valmisstrateegiate, tulumaksu ja alles jääva rahaga | `kalkulaator/pension.js` |
| 2. **Printsiibid** | `printsiibid/` | Kuus põhimõtet ja otsustuspuu, arvutusi ei tehta | – |
| 3. **Elukaar** | `elukaar/` | Pensionilugu eluetappide kaupa: valikud 55- (enne 2021 III sambaga liitunul), 60- ja pensionieas, töötamine pärast pensioniiga, II ja III samba fondipensioni leping eraldi, kulutase, tulemus ja allalaadimine (MD, PDF) | `elukaar/pension.js` |

Igal arvutaval prototüübil on oma mootor. Elukaare mootor on kalkulaatori varasema mootori edasiarendus. Samade sisenditega annavad mõlemad sama tulemuse (ilma sissemakseteta; töötamisega tootlusel 0% ja III samba sissemakseta); seda kontrollib `tests/elukaar.scenarios.test.js`.

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
| `tests/pension.test.js`, `tests/scenarios.test.js` | Kalkulaatori testid (~9 600 kontrolli, sh tulumaks ja töötamine; tabel: `node tests/scenarios.test.js --table`) |
| `tests/elukaar.test.js`, `tests/elukaar.scenarios.test.js` | Elukaare testid (~8 500 kontrolli): kasv ühe korra, rahavoogude tasakaal, loogika, tulumaks, töötamine, lepingud, ristkontroll kalkulaatoriga |
| `tests/e2e.mjs` | Brauseritest kõigile prototüüpidele (lauaarvuti ja mobiil, ~75 kontrolli): `npm install` ja `node tests/e2e.mjs http://localhost:8000`; avaliku lehe vastu `node tests/e2e.mjs https://meelisb.github.io/tuleva-tulevik` |
| `scripts/kulumudel.js` | Tasuvusmudel ([docs/kulumudel.md](docs/kulumudel.md)) |
| `scripts/demo/` | Pitch'i demo video salvestus (vt CLAUDE.md) |
| `kadi-branch/` | Vana aadressi ümbersuunamine `/elukaar/` lehele |

Kõik arvutustestid: `npm test`.

## Eeldused

Summad on tänases rahas. Edasilükkamise tõusud on SKA 2026 keskmised. Kindlustuslepingut (annuiteeti) ei arvestata.

**Tulumaks (mõlemas prototüübis, EMTA 2026):** riiklikult pensionilt 22% osalt, mis ületab maksuvaba tulu (pensionieast 776 € kuus, kalkulaatoris enne pensioniiga makstud pensionilt 700 € kuus). Kasutamata maksuvaba tulu vähendab sama aasta 10% maksuga sambaväljamaksete (korraga või osaliselt) maksu. Maksuvaba fondipension (elada jäänud aastate periood) maksuvaba tulu ei kasuta. Sisestatav riiklik pension on enne tulumaksu (SKA kalkulaatori väljund), graafik näitab summat pärast maksu.

**Töötamine pärast pensioniiga (mõlemas prototüübis):** iga tööaasta tõstab riiklikku pensioni järgmisest aastast (ümberarvutus 1. aprillist, RPKS § 25): (kindlustusosak + solidaarosak) / 2 × aastahinne 10,477 € (SKA, alates 1.04.2026). Kindlustusosak = palk / keskmine brutokuupalk 2 092 € (Statistikaamet PA103, 2025), II sambaga liitunul ja sissemaksete ajal 80% sellest; solidaarosak = palk / töötasu alammäär 946 €, kuni 1,0 (II sambaga liitunul kuni 0,8) (RPKS § 12, § 13¹). Edasilükkamisel rakendub kordaja kogu pensionile, ka sellele lisale (RPKS § 11¹ lg 4). Töötamise ajal katab kulud palk, II ja III samba sissemaksed jätkuvad ning samba väljamaksed algavad töö lõppedes (riigi 4% ei kao); juba makstav riiklik pension läheb sel ajal hoiusele. Kalkulaatoris on valik „Töötan kuni“, Elukaares pensioniea sammus „Töötan pärast pensioniiga“ (0–5 aastat). SKA prognoosi sisestamisel vali „Vanaduspension“ (pensioniea seis), siis ei arvestata töötamist topelt.

**Lihtsustused:**

- Palk ja riiklik pension reaalselt ei kasva: mõlemad on kogu aeg tänases rahas sama suured (ka maksuvaba tulu 776 € ja aastahinne).
- Keskmine palk on 2025. aasta oma; tegelik kindlustusosak arvutatakse sama aasta keskmise sotsiaalmaksu järgi.
- Maksuvaba tulu enne pensioniiga 10% väljamaksetele ei rakendata (konservatiivne).
- **Eluiga on meestele ja naistele eraldi (otsus 15.10, teadlik erinevus seadusest):** nii ellujäämine kui ka fondipensioni (maksuvaba) periood kasutavad Statistikaameti soopõhist elada jäänud aastate arvu (2025). Seaduse järgi on fondipensioni vaiketähtaeg meeste ja naiste keskmine üle-eelmise aasta andmetel (KoPS § 52³ lg 3, § 60¹ lg 2): 65-aastaselt umbes 19 aastat, prototüüpides naisel 21 ja mehel 16. Mõju: naise ühe lepingu makse on prototüübis pisut väiksem ja kestab kauem; mehe periood on seaduse vaiketähtajast lühem, päriselt võib nii lühike leping olla 10% maksuga. Vt otsuste logi 15.10.

- Kalkulaator: sissemaksed jätkuvad töötamise lõpuni, hoiuse intress jääb vaikimisi inflatsioonist 1% maha, III samba tulumaksutagastus on arvestatud.
- Elukaar: samba väljamaksed algavad pensionieas või töö lõppedes, kui töötad edasi; hoiuse intress jääb inflatsioonist 1% maha (nagu kalkulaatoris); III samba tulumaksutagastust ei arvestata; III sambaga liitumine on vaikimisi „enne 2021“ (siis on 55 a otsustuskoht). Fondipensioni ühe lepingu makse on jääk / järelejäänud aastad: kogumispensionide seadus (KoPS) § 52³ lg 8 ja § 60¹ lg 5, osakute arv jagatakse iga kord veel tegemata väljamaksete arvuga ja euro makse järgib osakuhinda. 55-st alanud III samba fondipensioni lepingusse lähevad ka hilisemad III samba sissemaksed (KoPS § 60¹ lg 8). Sünniaasta vahemik 1930–2008 (mõlemas prototüübis); väljaspool vahemikku sisestatud aasta asendatakse lähimaga.

Tööversioon. Ei ole finants-, maksu- ega õigusnõu.
