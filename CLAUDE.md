# CLAUDE.md: Tulevane Mina (tuleva-tulevik)

Juhend AI-agendile ja tiimiliikmele, kes seda repot jätkab. Kõik projekti kontekst on repos: see fail, `README.md`, `docs/otsuste_logi.md` ja `tulevane_mina_tooleht_ja_pitch_2026-10-10.md`. Ära jäta otsuseid ega kontrollitud fakte ainult lokaalsesse mällu või vestlusesse; kirjuta need siia.

## Mis see on

- Tuleva ühistu häkaton 9.–11.10.2026 (Telliskivi), tiim **Tulevane Mina**. Küsimus: **kas su pensionisissetulek kestab elu lõpuni?** Sihtrühm: 55–65-aastane Tuleva koguja.
- Kuus kasutaja küsimust: millal saan pensionile; millal alustada; kui palju vajan; väljamaksete graafik; kui kaua ja kas jätkub; milline viis.
- Kolm prototüüpi (`kalkulaator/`, `printsiibid/`, `elukaar/`), avalik leht https://meelisb.github.io/tuleva-tulevik/. Struktuur ja eeldused: `README.md`.
- Häkatoni intellektuaalomand: varalised õigused Tulevale, autorsus jääb tiimile.

## Kuidas töötada

- **Keel:** eesti keel (koodikommentaarid, tekstid, commit'id, dokumendid).
- **Andmed ainult ametlikest allikatest.** Eluiga: Statistikaamet (RV045, RV046), mitte ajakirjandus. Kulud: Statistikaamet (LE205, LE211, IA002). Reeglid: SKA, Pensionikeskus, EMTA, Tuleva. Igal numbril allikas ja kuupäev; tähised `[verified]`, `[secondary]`, `[inferred]`.
- **Avalik repo:** ära lisa isiklikke rahandusandmeid ega tiimiliikmete nimesid sisu sisse (commit'ide autorid on erand). Tuleva liikmeküsitluse andmeid kasuta ainult kaustast „jagamiseks liikmetega“. Saladusi ja võtmeid repos ei ole ega tohi olla.
- **Haru:** töö käib `main`-is. Suurema muudatuse jaoks lühiajaline haru, ühenda `main`-i ja kustuta. Teisi harusid ei avaldata (vt Majutus).
- **Enne push'i:** `npm test` (arvutused) ja `node tests/e2e.mjs` (brauser, vt Testimine). Kui muutsid lehe JS-i või CSS-i, tõsta selle lehe `?v=` versiooni.
- Kui `main` on vahepeal muutunud (tiimiliige pushis), tee `git fetch` ja `git rebase origin/main`, vaata teiste muudatused üle (eriti `elukaar/`) ja käivita testid uuesti.

## Arvutusmudel: konventsioonid, mida mitte murda

- Summad tänases rahas, mudel aastapõhine, vanused täisaastates, MAX_AGE 100.
- „Elu lõpuni“ = vanus, milleni jõuab elusalt 10% sinuvanustest (`horizonAge`).
- **Kulureegel:** igal aastal kulutad oma vajaduse. Allikate järjekord: riiklik pension → samba plaanijärgne väljamakse → hoius → (kalkulaatoris kogumisfond →) lisaväljamakse sambast (10%). Ülejääk läheb hoiusele. Nii on stsenaariumid võrreldavad.
- **Vara kasvab ühe korra.** Pensionieelne kasv arvestatakse kas kogumisfaasis või tsüklis, mitte mõlemas. See viga oli kahes mootoris (+10…48% vara). Testi alati ka tootlusega üle 0%, sest 0% juures viga ei paista.
- Hoiuse reaaltootlus vaikimisi **−1%** (mõlemas prototüübis), fondi oma vaikimisi 2%.
- Fondipensioni maksuvaba periood = Statistikaameti elada jäänud aastad soo ja vanuse järgi, ümardatud (`fundPensionTerm`). Leping algab pensionieas või kohe, kui oled vanem.
- II samba esimene väljamakse lõpetab II samba sissemaksed, ka riigi 4% (kalkulaatoris modelleeritud).
- Kaks mootorit: `kalkulaator/pension.js` ja `elukaar/pension.js` (viimane on esimese varasema versiooni edasiarendus). `tests/elukaar.scenarios.test.js` kontrollib, et samade sisenditega annavad mõlemad **sama tulemuse**. Kui muudad ühise loogika ühes mootoris, muuda ka teises või muuda ristkontrolli teadlikult.
- Kulutasemed ja nimed (kokkuhoidlik, optimaalne, mugav) tulevad ainult failist `data/kulud.js`, mõlemas prototüübis samad. Ära lisa käsitsi „lisasid“ ilma allikata.
- Lihtsustused (README „Eeldused“): riikliku pensioni tulumaks puudub, palga ja pensioni reaalkasv puudub, töö pärast pensioniiga pensioni ei tõsta.

## Andmed ja skriptid

| Fail | Kuidas uuendada | Lõksud |
|---|---|---|
| `data/elutabel.js` | `python3 scripts/fetch_elutabel.py` | Statistikaameti PxWeb API: `andmed.stat.ee/api/v1/et/stat/` |
| `data/kulud.js` | `python3 scripts/fetch_kulud.py` | LE205 „Aasta“ ei ole ajamuutuja: `filter: top` annab 2010, viimane aasta võetakse metaandmetest. IA002 päring tulevase aastaga annab 400, seepärast kaks päringut. Pensionäride haridus on avaldamata, skript arvutab selle kogukulu ja teiste vahena ning kontrollib, et kategooriad summeeruvad kogukuluks |

Kulutasemete piirang: IV/V kvintiili suhe on kõigi leibkondade andmetest. Pensionäride kohta tulukvintiilide kaupa avalikku tabelit ei ole (kontrollitud 10.10.2026: LE201–LE215). Täpsuse jaoks: Statistikaameti eritellimus.

## Testimine

- `npm test`: kalkulaator (~9 600 kontrolli) ja elukaar (~6 800 kontrolli). Stsenaariumitestid kontrollivad käsitsi arvutatud juhtumeid, rahavoogude tasakaalu, monotoonsust (parem sisend ei anna halvemat tulemust) ja ristkontrolli.
- `node tests/e2e.mjs [URL]`: Playwright (`playwright-core`, `npm install`) süsteemi Chrome'iga (`CHROME_PATH` või macOS-i vaikimisi tee). Vaikimisi URL `http://localhost:8766`; käivita enne server: `python3 -m http.server 8766`. Sama testi saab jooksutada avaliku lehe vastu.
- Claude Code'i eelvaate liivakast ei loe kausta `~/Documents`, seepärast käivita server Bashist.

## Majutus

- GitHub Pages töövooga `.github/workflows/pages.yml`: avaldab ainult `main`-i. Keskkonna `github-pages` reegel lubab avaldada ainult harudest `main` ja `gh-pages` (muudetud 10.10.2026, et vana haru ei kirjutaks lehte üle).
- Vahemälu: `cache-control: max-age=600`. Iga lehe kohalikel failidel on `?v=` versioon; muuda seda iga avaldamisega, muidu segab brauser vana ja uut koodi.
- `/kadi-branch/` on ümbersuunamine `/elukaar/` lehele (vana aadress, haru on kustutatud).

## Seotud allikad

- **Tuleva API** (onboarding-client), mida sisselogitud kasutaja eeltäitmiseks kasutaks (kalkulaatoris näidisena): `/v1/me` (dateOfBirth, age, retirementAge, secondPillarPaymentRates, thirdPillarInitDate), `/v1/me/capital`, `/v1/contributions`, `/v1/me/conversion` (weightedAverageFee), `/v1/withdrawals/eligibility` (recommendedDurationYears, earlyRetirementDate, canWithdrawThirdPillarWithReducedTaxFrom), `/v1/withdrawals/fund-pension-status`, `/v1/savings-*`. Riiklik pension ja kulud Tuleval puuduvad.
- Tuleva sisselogitud kalkulaator `pension.tuleva.ee/calculator` (strateegiad fixedPeriod, fourPercentRule, maxUtility).
- SKA kalkulaator: I samba prognoos = „I, II ja III“ miinus „II ja III“ (vali „Vanaduspension“).
- Tiimi teine repo [tulevane-mina](https://github.com/mirxz/tulevane-mina) (Cloudflare Worker, `npx wrangler dev`): seal on eraldi kalkulaatorid ja Elukaare koopia `/elukaar/`. Need ei sünkroniseeru selle repoga; Elukaare kehtiv versioon on siin. Sinna on avatud PR #14 (Statistikaameti elutabel ja SKA 2026 koefitsiendid).
- Indrek Seppo juhend häkatoni osalejatele: https://seppo.ai/tulevahack/

## Ajalugu ja avatud küsimused

Kuupäevadega otsused, leitud ja parandatud vead: `docs/otsuste_logi.md`. Enne lavale minekut kontrollitavad küsimused: töölehe jaotis 5.
