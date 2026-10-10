# Elukaare tasuvusmudel

**Koostatud 10.10.2026, uuendatud samal päeval Tuleva reporting engine'i andmetega.** Arvutus: `node scripts/kulumudel.js` (parameetrid käsurealt, vt faili päist). Eluiga: Statistikaamet 2025 (RV045, RV046).

> **Hoiatused**
> - Kulud (ehitus, hooldus) ja mõju (kui suur osa kasutajatest muudab otsust) on **eeldused**, mitte mõõdetud.
> - Tuleva andmed on avaldatud koondandmed repost [TulevaEE/reporting-engine](https://github.com/TulevaEE/reporting-engine). Vanuse järgi saldod ja väljamaksete arv inimestes on seal ainult graafikutel või puudu.
> - Surma korral eeldame, et raha lahkub fondist (pärijad võtavad välja). See on konservatiivne.

## Järeldus

1. **Ühe koguja kohta:** 40 000 € saldoga koguja, kes valib ühekordse väljamakse asemel fondipensioni, toob Tuleva grupile umbes **490 €** marginaali (nüüdisväärtus). Keskmise kulu stsenaariumis tasub tööriist end ära **umbes 250 sellise kogujaga viie aasta jooksul**.
2. **Mahu kontroll (olulisem):** see tähendab umbes **2,0 M€ ühekordseid väljamakseid aastas**, mis jäävad fondipensioniks. Tuleva kogujad võtavad pensionieas II sambast ühekorraga välja ainult umbes **1,1 M€ aastas** (2023 kuni 03/2026 keskmine). Seega isegi siis, kui kõik II samba ühekordsed väljamaksed muutuksid fondipensioniks, ei tasu tööriist end viie aastaga ära.
   - Madala kulu korral (20 000 € + 5 000 €/a) on vaja 0,7 M€ aastas: umbes kaks kolmandikku praegustest II samba ühekordsetest väljamaksetest.
3. **Seega ei tasu Elukaar end ära ainult Tuleva tänaste kogujate väljamaksete arvelt.** Tasuvus tuleb kolmest kohast, mida tuleb eraldi hinnata:
   - **III sammas.** III sambast võeti 2025. aastal välja 9,0 M€. Kui suur osa sellest on pensioniealiste ühekordne väljamakse, repos ei ole.
   - **Kasv.** Tuleva kogujad on noored (liikmete keskmine vanus 44, mitteliikmetel 37). Pensionile minejate arv ja nende saldod kasvavad iga aastaga.
   - **Uued kogujad.** Kui Elukaar on kõigile Eesti 55–65-aastastele, võib see tuua Tulevasse inimesi teistest fondidest. See kanal võib olla väärtuslikum kui olemasolevate kogujate hoidmine, aga mudel seda ei arvesta.
4. **Liikme võit on suurem kui ühistu oma.** 40 000 € saldoga koguja hoiab fondipensioniga kokku 4 000 € tulumaksu. Ühistu marginaal temalt on 490 €.

## Tulemused

| Saldo väljamakse alguses | Marginaal ühe koguja kohta (NV) | Tasuvuspunkt: madal kulu (20 000 € + 5 000 €/a) | keskmine (50 000 € + 15 000 €/a) | kõrge (100 000 € + 30 000 €/a) |
|---|---|---|---|---|
| 10 000 € | 122 € | 359 kogujat | 993 | 1 985 |
| 18 000 € (mitteliige, 56–65, ligikaudne) | 219 € | 199 | 552 | 1 103 |
| 40 000 € | 487 € | 90 | 249 | 497 |
| 60 000 € (liige, 56–65, ligikaudne) | 730 € | 60 | 166 | 331 |

| Väljamakse viis (40 000 €, keskmine kulu) | Fondis püsiv raha (saldo × aastad) | Marginaal NV | Tasuvuspunkt |
|---|---|---|---|
| Fondipension, üks leping (elada jäänud aastad, maksuvaba) | 8,9 × | 487 € | 249 |
| Fondipension, leping igal aastal uuesti | 10,6 × | 554 € | 218 |
| Fondipension 10 aastat (10% maks) | 4,6 × | 271 € | 446 |
| Fondipension alates 60 (üks leping) | – | 608 € | 199 |

**Ümbersuunatud ühekordse väljamakse iga euro on väärt umbes 1,2 senti** (nüüdisväärtus). Tasuvuseks vajalik ümbersuunatud summa aastas viie aasta jooksul:

| Kulu | Vaja aastas | Võrdlus |
|---|---|---|
| Madal | 0,7 M€ | Umbes 65% Tuleva II samba ühekordsetest väljamaksetest pensionieas |
| Keskmine | 2,0 M€ | Rohkem kui kõik II samba ühekordsed väljamaksed (1,1 M€) |
| Kõrge | 4,0 M€ | Vajab III sammast ja kasvu |

## Loogika

1. Ühekordse väljamakse korral lahkub raha fondist kohe. Fondipensioni korral jääb see fondi ja väheneb väljamaksete kaupa.
2. Iga fondis püsiv euro toob Tuleva grupile marginaali.
3. Ühistu lubadus on, et mida suurem on maht, seda väiksem on tasu kõigile. Siht on 0,22% 3 mld € juures, praegu 0,28% (kuuaruanne 09/2026).

**Ühe ümber suunatud koguja väärtus:**

`V = Σ_t  S(t) × B̄(t) × marginaal / (1 + diskont)^t`

- `B̄(t)` on fondimaht aastal t pärast väljamakset. Fondipensioni makse on jääk jagatud järelejäänud aastatega.
- `S(t)` on tõenäosus olla elus (Statistikaamet, naised ja mehed 50/50).

**Tasuvuspunkt:** `N = kulude nüüdisväärtus / V`.

**Tasu alandamise ruum:** K ümber suunatud kogujat aastas lisab püsivalt umbes `K × saldo × 8,9` fondimahtu. Näiteks 100 kogujat aastas 40 000 € saldoga lisab 36 M€. Kogumahu 1 786 M€ juures on see 2%. 3 mld € sihini on vaja veel 1 200 M€.

## Eeldused ja allikad

| Parameeter | Vaikimisi | Allikas |
|---|---|---|
| Marginaal fondimahu euro kohta | 0,16% aastas | Kuuaruanne 09/2026: (brutomarginaal pärast litsentsitasu 158 809 € + litsentsitasu ühistule 74 636 €) × 12 / AUM 1 786 M€ = 0,157% `[verified, repo]` |
| Liikme makstav jooksvate tasude määr | 0,28% | Kuuaruanne 09/2026. Sisaldab ka alusfondide kulusid. Tuleva valitsemistasu II samba aktsiafondis on 0,215% (tasude analüüs, 02/2026) `[verified, repo]` |
| Fondi reaaltootlus | 2% aastas | Sama mis prototüüpides |
| Diskontomäär (reaalne) | 3% aastas | Eeldus `[inferred]` |
| Väljamakse algus | 65 | Pensioniiga 2026 |
| Saldo 56–65-aastasel | liige u 60 000 €, mitteliige u 18 000 € | Savers analysis 04/2026, graafikult loetud `[verified, repo, ligikaudne]` |
| Pensionieas II sambast ühekordselt välja | u 1,1 M€ aastas | Fund flow analysis: YKVAK 2,67 M€ + YKVAO 0,77 M€, 01/2023–03/2026 `[verified, repo]` |
| Fondipensionina välja makstud | II 0,17 M€, III 0,12 M€ (samal perioodil) | Sama. Need on tehtud maksed, mitte fondipensionis olev vara |
| II samba raha pärast pensioniiga võtnud | 406 inimest (kõigi aegade kohta, 04/2026) | Savers analysis `[verified, repo]` |
| III sambast väljavõetud | 3,5 / 6,8 / 9,0 M€ (2023 / 2024 / 2025) | Fund flow analysis. Vanuse järgi jaotus puudub |
| Arendus | 20 000 / 50 000 / 100 000 € | Eeldus `[inferred]` |
| Ülalpidamine | 5 000 / 15 000 / 30 000 € aastas | Eeldus `[inferred]` |
| Ajahorisont | 5 aastat | Eeldus |
| Mõju | 10% kasutajatest | Eeldus `[inferred]` |

**Kogu Eesti lähtetase:** 2024. aastal võttis kogu II samba raha korraga välja 4 324 inimest ja fondipensioni valis 356 (Pensionikeskuse andmed LHV kaudu, vt tööleht).

## Mida küsida Tulevalt (Metabase'i koondandmed)

1. Pensionieas väljamaksed (YKVAK, YKVAO, FPAA, FPAA3, III samba RED pensioniealistel) **inimeste arvu ja summa järgi aastas**, 2023–2026.
2. Kogujate arv ja keskmine saldo vanuses 55–64 liikmete ja mitteliikmete kaupa: kui palju otsustajaid on tulemas.
3. Arendustiimi hinnang Elukaare liidestamisele Tuleva kontoga ja aastasele hooldusele.
4. Kas marginaal 0,16% on õige piirmarginaal (kas brutomarginaalist on maha arvatud ainult mahupõhised kulud).

## Mida see mudel ei näita

- **Mõju on mõõtmata.** Mõõtmiseks võrdle fondipensioni valinute osa Elukaare kasutajate ja mittekasutajate seas või tee A/B test sisselogitud kasutajatega. Tehingukoodid (FPAA, YKVAK) on olemas.
- **Huvide konflikt.** Väärtus tekib ainult siis, kui fondipension on liikmele tõesti parem. Sild ja raha kohe vajav liige ei tohi saada fondipensioni soovitust ühistu tulu pärast (tööleht, jaotis 4).
- **„Jätkan kasvatamist“** hoiab raha fondis veel kauem kui fondipension. Kui tööriist suunab ka sinna, on väärtus suurem.
- **Uued kogujad teistest fondidest** (vt järeldus, punkt 3).
- **Mastaabisääst** peale suurema marginaali.

## Kuidas uuesti arvutada

```bash
node scripts/kulumudel.js --saldo 60000 --ehitus 40000 --hooldus 12000 --mojus 0.15
```

Väljund annab tasuvuspunkti kogujates ja vajaliku ümbersuunatud summa aastas. Võrdle seda Tuleva pensionieas väljamaksete mahuga.
