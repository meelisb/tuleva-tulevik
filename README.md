# tuleva-tulevik

Tiimi „Tulevane Mina“ töö Tuleva häkatonil (9.–11.10.2026). Küsimus, millele prototüüp vastab: **kas su pensionisissetulek kestab elu lõpuni?**

- [Tööleht ja pitch'i taust](tulevane_mina_tooleht_ja_pitch_2026-10-10.md)
- Prototüüp: `index.html` (v1)

## Prototüübi käivitamine

Ava `index.html` brauseris või käivita kohalik server:

```bash
python3 -m http.server 8000
```

Seejärel ava http://localhost:8000. Build-sammu ei ole. Kõik arvutused tehakse brauseris.

## Struktuur

| Fail | Sisu |
|---|---|
| `js/pension.js` | Arvutusloogika: pensioniiga, ellujäämine, fondipension, stsenaariumid A/B/C. Puhtad funktsioonid |
| `js/app.js` | Kasutajaliides ja graafik (Chart.js) |
| `css/tuleva.css` | Tuleva disainisüsteemi tokenid ([TulevaEE/onboarding-client](https://github.com/TulevaEE/onboarding-client)), Bootstrap 5, Roboto |
| `data/elutabel.js` | Statistikaameti elutabel (RV045, RV046). Genereeritud, ära muuda käsitsi |
| `scripts/fetch_elutabel.py` | Uuendab elutabelit Statistikaameti API-st: `python3 scripts/fetch_elutabel.py` |
| `tests/pension.test.js` | Arvutuste testid: `node tests/pension.test.js` |

## Eeldused (v1)

Summad on tänastes eurodes. Uusi sissemakseid ei arvestata. Väljamaksed algavad pensionieas. Edasilükkamise tõusud on SKA 2026 keskmised. Pensionäri maksuvaba tulu ja kindlustuslepingut ei arvestata. Täpsem loetelu on lehe jaluses.

Tööversioon. Ei ole finants-, maksu- ega õigusnõu.
