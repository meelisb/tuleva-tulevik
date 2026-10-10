# Tuleva reporting engine: mis andmed seal on ja mis meile kasulik

**Tuleva häkaton 2026 · tiim „Tulevane Mina“ · koostatud 10.10.2026**

> **Hoiatused**
> - Allikas on avalik repo [TulevaEE/reporting-engine](https://github.com/TulevaEE/reporting-engine) (MIT-litsents). Repos on avaldatud ainult koondandmed. Toorandmed asuvad Tuleva Metabase'is, kuhu pääseb ainult Tuleva sisevõrgust.
> - Repo reeglite järgi on avaldamine Tõnu Pekki otsustada. Meie kasutame ainult juba avaldatud koondandmeid viitega allikale.
> - Graafikutelt loetud väärtused on märgitud „ligikaudne“.
> - Tähised: `[verified, repo]` tähendab, et number on loetud repost; `[inferred]` on minu järeldus.

## Kokkuvõte

`TulevaEE/reporting-engine` on Tuleva juhatuse kuuaruannete ja ad hoc analüüside repo. Meie jaoks on neli asja väga kasulikud:

1. **Kogu Eesti II ja III samba vara jaotus vanuse järgi:** võrdlus „sina vs sinuvanused“ ja ühiskondliku mõju argument.
2. **Tuleva väljamaksete tegelik käitumine:** pensionieas võetakse raha valdavalt korraga välja.
3. **Tuleva tehingutüüpide koodid:** neist saab kohe meie lahenduse mõõdiku.
4. **Tuleva kogujate keskmine vara vanuse järgi:** realistlikud näidisisikud.

## Mis andmed repos on

| Allikas repos | Sisu | Andmete seis | Kasulik meile? |
|---|---|---|---|
| [`docs/laura-kalkulaator/calc.js`](https://github.com/TulevaEE/reporting-engine/blob/main/docs/laura-kalkulaator/calc.js) (`DATA`) | **Kogu Eesti II + III samba vara protsentiilid vanusekümnendi järgi.** Pensionikeskuse registriväljavõte, ~925 000 inimest, pseudonüümitud | 2025 | ✅✅ |
| [`docs/ii_iii_wealth_distribution.html`](https://github.com/TulevaEE/reporting-engine/blob/main/docs/ii_iii_wealth_distribution.html) | Kogu turu vara detsiilid, nullsaldoga inimeste osakaal, koondumine | 2025, avaldatud 17.06.2026 | ✅ |
| [`reports/adhoc/fund_flow_analysis`](https://github.com/TulevaEE/reporting-engine/blob/main/reports/adhoc/fund_flow_analysis.ipynb) | Tuleva fondide rahavood **tehingutüübi järgi**, sealhulgas väljamaksed | 01/2023–13.03.2026 | ✅✅ |
| [`reports/adhoc/savers_analysis`](https://github.com/TulevaEE/reporting-engine/blob/main/reports/adhoc/savers_analysis.ipynb) | Tuleva kogujad ja liikmed: vara, vanus, sugu, palk, väljavõtmised vanuse järgi, kogujate tüübid | ~04/2026 | ✅ |
| Kuuaruanded ([`reports/monthly`](https://github.com/TulevaEE/reporting-engine/tree/main/reports/monthly)) | Varade maht, sissemaksed, fondivahetused, väljavõetud vara, missiooni KPI-d | 09/2026 | 🟡 taust |
| [`CLAUDE.md`](https://github.com/TulevaEE/reporting-engine/blob/main/CLAUDE.md) | Tehingutüüpide koodid, Metabase'i kaardid, andmereeglid | — | ✅ |
| [`common/branding/style.css`](https://github.com/TulevaEE/reporting-engine/blob/main/common/branding/style.css) | Tuleva aruannete stiil: pealkirjad Merriweather, tekst Roboto | — | 🟡 disain |
| `fondide-vordlus` | Fondide portfellid ja ETF-ide koosseis | 2026 | ❌ |

## 1. Sinu vara võrreldes sinuvanustega (kogu Eesti)

II + III samba vara kokku, protsentiilid koos nullsaldoga inimestega `[verified, repo]`:

| Vanus | Mediaan | P75 | P90 | P95 | Keskmine |
|---|---|---|---|---|---|
| 50-ndad | 1 700 € | 19 200 € | 42 200 € | 62 100 € | 14 219 € |
| 60-ndad | 2 600 € | 19 700 € | 38 600 € | 56 200 € | 14 154 € |

Kogu turu kohta `[verified, repo]`:
- **43% inimestest on II + III samba saldo null.**
- Neil, kellel saldo on, on mediaan 6 500 €.
- Kõige jõukam kümnendik hoiab 61,5% kogu varast (kokku 7,9 mld €).

**Mida see meile tähendab `[inferred]`:**
- **Ühiskondlik mõju:** pooltel 50–60-aastastel on sammastes alla paari tuhande euro. Nende jaoks on peamine otsus see, millal võtta riiklik pension. Väljamakse viisi otsus on oluline umbes ülemisele poolele.
- **Prototüüp:** saab lisada rea „Sinu vara on suurem kui X% sinuvanustest“. Andmed on avalikud ja MIT-litsentsiga.

## 2. Kuidas Tuleva kogujad raha tegelikult välja võtavad

Allikas on fund flow analüüs (Metabase'i kaart 2326, 01/2023–03/2026, kokku eurodes) `[verified, repo]`:

| Väljamakse viis | Kood | Summa |
|---|---|---|
| II sammas välja enne pensioniiga | RAVA | **40,2 M€** |
| Ühekordne väljamakse pensionieas | YKVAK | **2,67 M€** |
| Osaline ühekordne väljamakse | YKVAO | 0,77 M€ |
| Fondipension, II sammas | FPAA | 0,17 M€ |
| Fondipension, III sammas | FPAA3 | 0,12 M€ |
| Üleviimine kindlustusseltsi (annuiteet) | PLAV | 0,10 M€ |

**Järeldus:** pensionieas võetakse raha valdavalt korraga välja (umbes 3,4 M€). Fondipensionina on välja makstud umbes 0,3 M€ ja kindlustusseltsi on viidud peaaegu mitte midagi.

**Hoiatus tõlgendamisel:** fondipensioni summa näitab ainult juba tehtud kuumakseid, mitte fondipensionis olevat vara. Inimeste arvu andmetes pole. Suhe liialdab seetõttu ühekordsete väljamaksete ülekaalu, aga suund on selge `[inferred]`.

**Pitch'is:** „Tuleva enda andmetel võetakse pensionieas raha enamasti korraga välja ja kindlustuslepinguid peaaegu ei sõlmita.“ See toetab ka liikmete küsitluse lauset „kindlustusandja pension ei tõmba“.

## 3. Tehingukoodidest saab meie mõõdiku

Tuleval on olemas kood iga otsuse jaoks, mida meie tööriist mõjutab: FPAA ja FPAA3 (fondipension), YKVAK ja YKVAO (ühekordne ja osaline), PLAV (kindlustus), RAVA (väljavõtmine enne pensioniiga).

Seega saab **lahenduse mõju mõõta Tuleva olemasolevatest andmetest, ilma uue analüütikata**:
- fondipensioni osakaal pensionieas väljamaksetest: FPAA / (FPAA + YKVAK + YKVAO);
- iga-aastaste uuenduste arv.

## 4. Tuleva kogujad vanuse järgi

Allikas on savers analysis (kaart 2324, ~04/2026).
- **Tuleval on 97 302 kogujat, neist 9 616 liiget** `[verified, repo]`. Häkatoni slaidil olnud 87 000 on aegunud või teistsuguse definitsiooniga.
- **Keskmine vara vanuses 56–65** (graafikult, ligikaudne): liikmetel umbes 60 000 €, mitteliikmetel umbes 18 000 €, kogu turul umbes 23 500 €.
- **Väljavõtmine vanuse järgi:** 65+ kogujatest on umbes viiendik võtnud II samba raha pärast pensioniiga (graafikult, ligikaudne).

**Kasutus:** näidisisikud kahes variandis, Tuleva liige (umbes 60 000 €) ja tavaline koguja (umbes 20 000 €).

## 5. Tasuvusmudeli jaoks (lisatud 10.10.2026 õhtul)

Kontrollitud repost (commit 56a9754, 09.10.2026) `[verified, repo]`:

| Näitaja | Väärtus | Allikas |
|---|---|---|
| Tuleva fondide maht | 1 786 M€ (09/2026), 12 kuu kasv 41% | Kuuaruanne 09/2026 |
| Jooksvate tasude määr | 0,28%, siht 0,22% 3 mld € juures („mida rohkem meid koos kogub, seda soodsamaks läheb kogumine“) | Kuuaruanne 09/2026, missiooni KPI 2.1 |
| Valitsemistasu (II samba aktsiafond) | 0,215% | Tasude analüüs, 02/2026 |
| Brutomarginaal pärast litsentsitasu / litsentsitasu ühistule | 158 809 € / 74 636 € (09/2026) ehk koos u 0,16% mahust aastas | Kuuaruanne 09/2026 |
| Kogujate arv | 86 787 (kuuaruanne 09/2026); savers analysis 04/2026 annab 97 302 (teine definitsioon, sh lahkunud) | – |
| Keskmine vara (kõik vanused) | liikmed 46 604 €, mitteliikmed 10 516 € | Savers analysis 04/2026 |
| Keskmine vanus | liikmed 44, mitteliikmed 37 | Savers analysis |
| II samba raha pärast pensioniiga võtnud | 406 inimest kokku (60 liiget, 346 mitteliiget) | Savers analysis, väljavõtmise grupid |
| III sambast väljavõetud (RED) | 3,5 / 6,8 / 9,0 M€ (2023 / 2024 / 2025) | Fund flow analysis |

Kasutus: [tasuvusmudel](docs/kulumudel.md). Peamine järeldus: Tuleva kogujad on noored ja pensionieas tehtud ühekordseid väljamakseid on vähe (II sambast u 1,1 M€ aastas), seega Elukaare tasuvus sõltub III sambast, kasvust ja uutest kogujatest.

## Mida repos ei ole

- Väljamakseid vanuse ja inimeste arvu järgi tekstina (ainult graafikutena või üldse mitte).
- Fondipensioni perioodide valikut ega uuendamise kohta midagi.
- I sammast ega eluiga.
- Toorandmeid. Metabase'i kaardid (2326, 2324, 2578) on ainult Tuleva sisevõrgus.

## Järgmised sammud

1. Lisada prototüüpi „sinu vara vs sinuvanused“ Laura kalkulaatori andmete põhjal, koos viitega allikale.
2. Viia pitch'i dokumenti kolm numbrit: 43% sammasteta, väljamaksete jaotus tehingutüübi järgi ja 97 302 kogujat.
3. Paluda Tõnu Pekilt lisakoond kaartidest 2326/2324: väljamaksed tüübi järgi, **inimeste arv ja vanuserühm**, 2023–2026 (ainult koondandmed).
4. Disain: Tuleva aruannetes on pealkirjad Merriweather'iga, prototüübis Roboto.
