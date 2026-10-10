# tuleva-tulevik

Tiimi „Tulevane Mina“ töö Tuleva häkatonil (9.–11.10.2026). Küsimus, millele prototüüp vastab: **kas su pensionisissetulek kestab elu lõpuni?**

- [Tööleht ja pitch'i taust](tulevane_mina_tooleht_ja_pitch_2026-10-10.md)
- **Prototüüp 1, kalkulaator** (`index.html`): https://meelisb.github.io/tuleva-tulevik/ . Sinu andmed, kulud, otsused (riiklik pension varem või hiljem, II ja III samba viis ja algus, töötamine), tulemus koos valmisstrateegiatega.
- **Prototüüp 2, põhimõtted** (`printsiibid/`): https://meelisb.github.io/tuleva-tulevik/printsiibid/ . Kuus põhimõtet ja otsustuspuu, arvutusi ei tehta.

## Prototüübi käivitamine

Ava `index.html` brauseris või käivita kohalik server:

```bash
python3 -m http.server 8000
```

Seejärel ava http://localhost:8000. Build-sammu ei ole. Kõik arvutused tehakse brauseris.

Avalik versioon: https://meelisb.github.io/tuleva-tulevik/

Failide URL-idel on versioon (`?v=…`). Muuda see `index.html`-is ja `printsiibid/index.html`-is iga avaldamisega, muidu võib brauser kasutada vana ja uue koodi segu (GitHub Pages: `cache-control: max-age=600`). (haru `main`). Iga teine haru avaldub aadressil `https://meelisb.github.io/tuleva-tulevik/<haru-nimi>/`, näiteks [kadi-branch](https://meelisb.github.io/tuleva-tulevik/kadi-branch/). Kõik eelvaated: [harud.html](https://meelisb.github.io/tuleva-tulevik/harud.html). Avaldamise töövoog: `.github/workflows/pages.yml`.

Nupp „Täida Tuleva konto andmetega (näidis)“ näitab väljamõeldud liikme andmetel, mida Tuleva saaks sisselogitud kasutajale eeltäita ja millisest API-st iga väärtus tuleb. Kulud on vaikimisi täidetud Statistikaameti andmetega.

## Struktuur

| Fail | Sisu |
|---|---|
| `js/pension.js` | Arvutusloogika: pensioniiga, ellujäämine, fondipension, stsenaariumid A/B/C. Puhtad funktsioonid |
| `js/app.js` | Kasutajaliides: sammud, otsused, võrdlus |
| `js/chart.js` | Ligipääsetav SVG-graafik (tabel, klaviatuur, puude) |
| `printsiibid/` | Prototüüp 2: põhimõtted ja otsustuspuu |
| `css/tuleva.css` | Tuleva disainisüsteemi tokenid ([TulevaEE/onboarding-client](https://github.com/TulevaEE/onboarding-client)), Bootstrap 5, Roboto |
| `data/elutabel.js` | Statistikaameti elutabel (RV045, RV046). Genereeritud, ära muuda käsitsi |
| `scripts/fetch_elutabel.py` | Uuendab elutabelit Statistikaameti API-st: `python3 scripts/fetch_elutabel.py` |
| `data/kulud.js` | Pensionäride kulud kategooriate kaupa (Statistikaamet LE205, hinnad IA002 järgi tänasesse rahasse). Genereeritud |
| `scripts/fetch_kulud.py` | Uuendab kulusid ja kolme taset (kokkuhoidlik, optimaalne, mugav): `python3 scripts/fetch_kulud.py` |
| `tests/pension.test.js` | Arvutuste testid: `node tests/pension.test.js` |
| `tests/e2e.mjs` | Brauseritest (lauaarvuti ja mobiil, kõik põhifunktsioonid): `npm install` ja `node tests/e2e.mjs http://localhost:8000` |

## Eeldused (v1)

Summad on tänases rahas. Sissemaksed jätkuvad töötamise lõpuni, palk reaalselt ei kasva, hoiuse intress jääb vaikimisi inflatsioonist 1% maha. Väljamaksed algavad pensionieas. Edasilükkamise tõusud on SKA 2026 keskmised. Pensionäri maksuvaba tulu ja kindlustuslepingut ei arvestata. Täpsem loetelu on lehe jaluses.

Tööversioon. Ei ole finants-, maksu- ega õigusnõu.
