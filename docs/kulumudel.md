# Elukaare tasuvusmudel

**Koostatud 10.10.2026.** Arvutus: `node scripts/kulumudel.js` (parameetrid käsurealt, vt faili päist). Eluiga: Statistikaamet 2025 (RV045, RV046).

> **Hoiatused**
> - Kulud (ehitus, hooldus) ja mõju (kui suur osa kasutajatest muudab otsust) on **eeldused**, mitte mõõdetud. Tulemus on nende suhtes kõige tundlikum.
> - Keskmine saldo on parameeter. Tuleva teab liikmete ja mitteliikmete tegelikke keskmisi; pane need `--saldo` alla. Avalikku repot nendega ära täienda.
> - Surma korral eeldame, et raha lahkub fondist (pärijad võtavad välja). See on konservatiivne.

## Järeldus

**Keskmise stsenaariumi** puhul tasub Elukaar end ära, kui umbes **160 kogujat viie aasta jooksul** valib ühekordse väljamakse asemel fondipensioni. Eeldused:

- arendus 50 000 €, ülalpidamine 15 000 € aastas;
- koguja saldo väljamakse alguses 40 000 €.

See teeb umbes 32 kogujat aastas. Kui tööriist muudab 10% kasutajate otsust, on vaja umbes 1 600 kasutajat viie aasta jooksul.

| Saldo väljamakse alguses | Tasu marginaal ühe koguja kohta (nüüdisväärtus) | Tasuvuspunkt: madal kulu (20 000 € + 5 000 €/a) | keskmine (50 000 € + 15 000 €/a) | kõrge (100 000 € + 30 000 €/a) |
|---|---|---|---|---|
| 20 000 € | 383 € | 114 kogujat | 315 | 630 |
| 40 000 € | 767 € | 57 | 158 | 315 |
| 60 000 € | 1 150 € | 38 | 105 | 210 |
| 100 000 € | 1 917 € | 23 | 63 | 126 |

Väljamakse viis mõjutab tulemust:

| Viis (40 000 €, keskmine kulu) | Fondis püsiv raha (saldo × aastad) | Marginaal NV | Tasuvuspunkt |
|---|---|---|---|
| Fondipension, üks leping (elada jäänud aastad, maksuvaba) | 8,9 × | 767 € | 158 |
| Fondipension, leping igal aastal uuesti | 10,6 × | 873 € | 139 |
| Fondipension 10 aastat (10% maks) | 4,6 × | 427 € | 283 |

**Liikme võit on mitu korda suurem kui ühistu oma.** Koguja, kes ei võta 40 000 € korraga välja, hoiab kokku 4 000 € tulumaksu. Ühistu marginaal temalt on 767 €, ehk iga euro ühistule tähendab liikmele umbes 5 eurot. See sobib pitch'i: tööriist on liikme huvides ja tasub end ühistule ära.

## Loogika

1. Ühekordse väljamakse korral lahkub raha fondist kohe. Fondipensioni korral jääb see fondi ja väheneb väljamaksete kaupa.
2. Iga fondis püsiv euro toob valitsemistasu 0,28% aastas.
3. Ühistu kulud on enamasti püsikulud, seega lisatulu (miinus muutuvkulu) on ruum fonditasu alandamiseks kõigile.

**Ühe ümber suunatud koguja väärtus** on tema fondis püsiva raha tasu marginaali nüüdisväärtus:

`V = Σ_t  S(t) × B̄(t) × tasu × (1 − muutuvkulu) / (1 + diskont)^t`

- `B̄(t)` on fondimaht aastal t pärast väljamakset. Fondipensioni makse on jääk jagatud järelejäänud aastatega (lepingu igal aastal uuendamisel elada jäänud aastatega).
- `S(t)` on tõenäosus olla elus (Statistikaamet, naised ja mehed 50/50).

**Tasuvuspunkt:** `N = kulude nüüdisväärtus / V`.

Vajalik kasutajate arv on `N / mõju`, kus mõju on kasutajate osa, kes muudab otsust ühekordselt väljamakselt fondipensionile.

**Tasu alandamise ruum:** kui tööriist suunab ümber K kogujat aastas, kasvab fondi püsiv lisamaht umbes `K × saldo × 8,9`.

| Ümber suunatud kogujaid aastas | Püsiv lisafondimaht | Tasutulu aastas |
|---|---|---|
| 32 | 11 mln € | 32 000 € |
| 100 | 36 mln € | 100 000 € |
| 300 | 107 mln € | 300 000 € |

Võimalik tasu alandus kõigile on `tasutulu × (1 − muutuvkulu) / Tuleva fondide kogumaht`.

## Eeldused

| Parameeter | Vaikimisi | Allikas | Täpsustada |
|---|---|---|---|
| Valitsemistasu | 0,28% aastas | Tuleva (liikmetele) `[user-reported]` | Kas mitteliikmetele sama |
| Muutuvkulu osa tasutulust | 10% | Eeldus: depootasu ja muu mahupõhine kulu `[inferred]` | Tuleva kuluaruanne |
| Fondi reaaltootlus | 2% aastas | Sama mis prototüüpides | – |
| Diskontomäär (reaalne) | 3% aastas | Eeldus `[inferred]` | Ühistu nõue |
| Väljamakse algus | 65 | Pensioniiga 2026 | Tegelik jaotus (osa alustab 60-aastaselt, siis on väärtus suurem) |
| Saldo väljamakse alguses | 40 000 € | Näide `[inferred]` | Tuleva liikmete ja mitteliikmete keskmine |
| Arendus | 20 000 / 50 000 / 100 000 € | Eeldus `[inferred]` | Tuleva arendustiimi hinnang (prototüüp on olemas, vaja liidestada Tuleva kontoga ja juriidiliselt üle vaadata) |
| Ülalpidamine | 5 000 / 15 000 / 30 000 € aastas | Eeldus: reeglite ja andmete iga-aastane uuendus `[inferred]` | Sama |
| Ajahorisont | 5 aastat | Eeldus | – |
| Mõju | 10% kasutajatest | Eeldus `[inferred]` | Mõõta (vt allpool) |
| Ühekordsest väljamaksest Tuleva fondi jääv osa | 0% | Konservatiivne | Kas osa liigub Täiendavasse Kogumisfondi (`--korraga-jaab`) |

**Lähtetase:** 2024. aastal võttis kogu II samba raha korraga välja 4 324 inimest ja fondipensioni valis 356 (Pensionikeskuse andmed LHV kaudu, vt tööleht). Ruumi ümbersuunamiseks on palju.

## Mida see mudel ei näita (ja mis võib tulemust muuta)

- **Mõju on kõige ebakindlam number.** Selle mõõtmiseks võrdle fondipensioni valinute osa Elukaare kasutajate ja mittekasutajate seas sama vanuse ja saldo juures. Parem viis on A/B test sisselogitud kasutajatega. Ilma mõõtmiseta on tasuvuspunkt ainult hinnang.
- **Huvide konflikt.** Väärtus tekib ainult siis, kui fondipension on liikmele tõesti parem. Elukaar ei tohi seda soovitada, kui liige vajab raha kohe või sild on talle parem.
  - Sild tähendab riikliku pensioni edasilükkamist ja vahepeal sambast elamist. See kasutab fondi raha kiiremini ja vähendab ühistu tulu, aga võib olla liikmele parim.
  - Liikme huvi on Tuleva bränd (vt tööleht, jaotis 4). Mudel ei tohi suunata tööriista soovitusi.
- **„Jätkan kasvatamist“** hoiab raha fondis veel kauem kui fondipension. Kui tööriist suunab ka sinna, on väärtus suurem. Seda mudel praegu ei arvesta.
- **III sammas ja varasem algus.** 60-aastaselt alustatud fondipension hoiab raha kauem fondis kui 65-aastaselt alustatud. Seda saab arvutada parameetriga `--vanus 60`.
- **Mastaabisääst.** Peale suurema tasutulu võivad mõned kulud (nt depootasu astmed) suurema mahu juures odavneda. Mudel seda ei arvesta, seega on see pigem alahinnang.

## Kuidas Tuleva andmetega uuesti arvutada

```bash
node scripts/kulumudel.js --saldo 52000 --ehitus 40000 --hooldus 12000 --mojus 0.15
```

Tulemus annab iga väljamakse viisi kohta tasuvuspunkti (kogujat) ja vajaliku kasutajate arvu.

Allikad: Statistikaameti elutabel (`data/elutabel.js`); fondipensioni reeglid ja 2024. aasta väljamaksed: tööleht ja `docs/otsuste_logi.md`.
