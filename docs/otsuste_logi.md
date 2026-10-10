# Otsuste logi

Kuupäevadega otsused, kontrollid ja parandatud vead. Uuemad üleval. Lisa siia iga sisuline otsus, et see ei jääks ainult vestlusesse.

## 10.10.2026 (õhtu): pitch

- Pühapäeval (11.10 kell 11.30, Tuleva nõukogu, 3 min + 2 min küsimusi) esitleme **ainult Elukaart**.
- Slaidid tehti häkatoni juhendi järgi (6 slaidi + varuslaidid): nimi, probleem (keeruline süsteem → kõik korraga välja → elu jätkub pärast raha lõppu; 12 inimest 13-st), demo video, miks Tuleva (neutraalne info, kindel sissetulek, andmed kontol), ärimudel (raha jääb fondi), järgmine samm (test 5 liikmega).
- Ärimudeli arvutus: pensionieas korraga u 1 M€ aastas (reporting-engine 01/2023–03/2026); kui pool jääb fondipensioniks, on 10 aasta pärast fondis u 4 M€ rohkem; tasu u 0,3% juures u 12 000 € aastas. Tasumäär vajab kontrolli.
- Demo video: `scripts/demo/` (vt CLAUDE.md).

## 10.10.2026

### Tasuvusmudel
- Lisatud `docs/kulumudel.md` ja `scripts/kulumudel.js`. Keskmises stsenaariumis (saldo 40 000 €, arendus 50 000 € + 15 000 €/a, 5 a) on tasuvuspunkt umbes 160 ühekordselt väljamakselt fondipensionile suunatud kogujat. Kõige ebakindlam eeldus on tööriista mõju (mitu kasutajat otsust muudab); see tuleb mõõta.

### Repo ja majutus
- Kolm prototüüpi ühes repos, igaüks oma kaustas: `kalkulaator/` (prototüüp 1), `printsiibid/` (2), `elukaar/` (3). Avaleht juurkaustas.
- Elukaare arendusharu ühendati `main`-i ajalooga (seis 9a685e8), haru kustutati. Elukaare muudatused tehakse nüüd otse `main`-i kausta `elukaar/`.
- Avaldatakse ainult `main`. Harude eelvaated eemaldati, sest vana haru oma töövoog kirjutas avaliku lehe vana (vigase) versiooniga üle. GitHubi keskkond `github-pages` lubab avaldada ainult `main`-ist.
- Ühine `css/tuleva.css` sisaldab ainult Tuleva tokeneid ja põhistiile. Prototüübi stiilid on prototüübi kaustas (kalkulaatori hilisemad lisad hakkasid Elukaare välimust mõjutama).

### Kulutasemed
- Mõlemas prototüübis samad tasemed ja kalkulaatori nimed: **kokkuhoidlik** (pensionäride keskmine, LE205), **optimaalne** (IV tulukvintiili suhe, LE211), **mugav** (V tulukvintiil). Üksi elav: 791 / 891 / 1 261 € kuus; paaris inimese kohta 667 / 764 / 1 083 € (uuring 2020, hinnad 09/2026).
- Elukaare varasemad lisad (reisid, hobid, 150 € investeerimine jne, kokku 300–770 €) asendati andmetega: allikat neil polnud ja investeerimine on säästmine, mitte kulu.
- Kingitused on kogukulu sees: Statistikaameti „muud kulutused“ (raha kinkimine, annetused, alimendid, trahvid), nimega „Kingitused, annetused jm“. Pensionäril 20 € kuus ehk 2,6% kogukulust (2020), suhteline standardviga 19%. Lastelastele antud raha eraldi andmeid ei ole (ka SHARE-uuringus Eesti kohta avaldatud numbrit ei leitud).
- Haridus lisati (pensionäridel avaldamata, arvutatud vahena), et kategooriad summeeruksid kogukuluks.
- Piirang: kvintiili suhe on kõigi leibkondade andmetest; pensionäride kohta tulukvintiilide kaupa avalikku tabelit ei ole.
- Hooldekodu omaosalus 1 000 € kuus (keskmine kohatasu 1 603 €, november 2024; hoolduse osa u 600 € maksab omavalitsus).

### Eeldused
- Hoiuse reaaltootlus vaikimisi −1% mõlemas prototüübis (enne Elukaares 0%).
- Lihtsustused kirja (README): riikliku pensioni tulumaks, palga ja pensioni reaalkasv, töö pärast pensioniiga.

### Parandatud vead: Elukaar
- Vara kasvas pensionieani kaks korda: tootlusel 2% +10…22%, 4% juures kuni +48%. Kasv tsüklis nüüd ainult pensionieast.
- Paindlik pension: sild makseti 10% maksuga lisaväljamaksetena, kuigi tekst lubas fondipensioni. Nüüd maksuvaba fondipension (leping igal aastal) + puuduv osa lisaväljamaksena.
- Pensioniast vanemal arvutati ühe lepingu periood pensioniea järgi; nüüd praegusest vanusest.
- Ajutine auk enne riikliku pensioni algust näidati kui „kaetud kuni X“; nüüd vahemik „katmata X–Y“.
- Ühekordse väljamakse raha oleks hoiusel väärtust kaotanud juba enne pensioniiga; nüüd alates pensioniast.
- Kontroll: vana mootor kukkus 735 kontrolli läbi, uus mitte ühtegi. Samade sisenditega annab Elukaar nüüd sama tulemuse mis kalkulaator.

### Parandatud vead: kalkulaator
- III samba igakuine väljamakse enne soodusvanust (2021+ liitunu, alla 60) oli maksuvaba; peab olema 22%.
- Ajutine auk (töö lõpp 60, riiklik pension hiljem) näitas „riiklik pension 0 € kuus, katab 0%“; nüüd vahemik ja põhjus.
- Valmisstrateegiad algasid alati pensionieas: töötajal kadus riigi 4%, varem lõpetajal maksti 10% maksu. Nüüd algavad töö lõpus (II ≥ 60, III ≥ 55/60).
- Fondipensioni periood pensioniast vanemale; strateegia D ei nihuta riiklikku pensioni minevikku.
- Kasutajaliides: töötamise või pensioniea muutmine jättis otsused vanaks ja järgmine muutus andis JS-vea.
- Kuvamine: väljavõetud raha polnud graafikul näha (lisatud „Raha alles“), vastus ei näidanud otsuse hinda (lisatud alles jääv raha ja maks võrreldes parima strateegiaga).
- Esimeses versioonis oli sama topeltkasv mis Elukaares (Elukaare mootor pärineb sealt); kalkulaatori praegune mootor kasvatab ühe korra.

### Kontrollitud faktid (2026), mida mudelid kasutavad
- Paindlik pension, SKA 2026 keskmised: hiljem +7,93% (1 a), +16,88%, +27,01%, +38,50%, +51,57% (5 a); varem −7,17% (1 a) … −30,67% (5 a). Vana 0,9% kuus kehtib ainult enne 2021 pensioniikka jõudnutele.
- Pensioniiga: 65 (2026), 65 a 1 k (2027), 2028 ja 2029 eelnõud (65 a 3 k, 65 a 4 k). Edaspidi Statistikaameti eluea järgi, teada umbes kaks aastat ette.
- II sammas alates 60: korraga või osaliselt 10%, fondipension vähemalt elada jäänud aastate perioodiga 0%. Esimene väljamakse lõpetab sissemaksed, ka riigi 4%.
- III sammas: 10% alates 55 (liitunud enne 2021) või 60, enne seda 22%; pikk regulaarne väljamakse 0%; sissemakse tagastus 22% (kuni 15% tulust, kuni 6 000 € aastas).
- 2024: 4 324 inimest võttis II samba korraga, 356 valis fondipensioni (≈ 12 inimest 13-st), Pensionikeskuse andmed LHV kaudu.

### Avatud
- Töölehe jaotis 5 (soopõhine maksuvaba periood, lepingu uuendamise vahe, III samba 60 seos pensionieaga, kindlustusseltsid).
- Kas tellida Statistikaametilt pensionäride kulud tulukvintiilide kaupa.
