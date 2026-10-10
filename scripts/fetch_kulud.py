#!/usr/bin/env python3
"""Tõmbab pensionäride kulud (Statistikaamet LE205) ja hinnaindeksi (IA002) ning kirjutab data/kulud.js.

Kulud: leibkonnaliikme kulutused aastas leibkonna tüübi järgi, viimane uuringuaasta (2020).
Leibkonnad: „Üksik 65-aastane ja vanem“ ja „Lasteta üle 64-aastaste paar“ (liikme kohta).
Iga kategooria korrigeeritakse sama kaubagrupi tarbijahinnaindeksiga (uuringuaasta keskmine → viimane kuu).

Kasutus: python3 scripts/fetch_kulud.py
"""
import itertools
import json
import pathlib
import urllib.request

API = "https://andmed.stat.ee/api/v1/et/stat/"

# LE205 kulutuste liik → (nimi, IA002 kaubagrupp)
CATEGORIES = [
    ("3", "Toit ja joogid", "2"),
    ("33", "Eluase ja kommunaalkulud", "5"),
    ("36", "Tervis ja ravimid", "7"),
    ("37", "Transport", "8"),
    ("41", "Vaba aeg", "10"),
    ("35", "Majapidamine", "6"),
    ("40", "Side", "9"),
    ("30", "Riided ja jalatsid", "4"),
    ("27", "Alkohol ja tubakas", "3"),
    ("45", "Kohvikud ja reisimajutus", "12"),
    ("48", "Muud kaubad ja teenused", "14"),
    ("49", "Muud kulutused", "1"),
]
HOUSEHOLDS = {"4": "uksi", "6": "paar"}


def post(table, query):
    body = json.dumps({"query": query, "response": {"format": "json-stat2"}}).encode()
    with urllib.request.urlopen(urllib.request.Request(API + table, data=body, method="POST"), timeout=30) as r:
        return json.load(r)


def cells(d):
    dims = d["id"]
    codes = [list(d["dimension"][k]["category"]["index"].keys()) for k in dims]
    for idx, v in zip(itertools.product(*[range(s) for s in d["size"]]), d["value"]):
        yield {dims[i]: codes[i][j] for i, j in enumerate(idx)}, v


with urllib.request.urlopen(API + "LE205", timeout=30) as r:
    meta = json.load(r)
last_year = [v for v in meta["variables"] if v["code"] == "Aasta"][0]["values"][-1]  # aasta ei ole ajamuutuja, „top“ annaks esimese
le = post("LE205", [
    {"code": "Aasta", "selection": {"filter": "item", "values": [last_year]}},
    {"code": "Näitaja", "selection": {"filter": "item", "values": ["1"]}},
    {"code": "Kulutuste liik", "selection": {"filter": "item", "values": [c[0] for c in CATEGORIES]}},
    {"code": "Leibkonna tüüp", "selection": {"filter": "item", "values": list(HOUSEHOLDS)}},
])
survey_year = list(le["dimension"]["Aasta"]["category"]["label"].values())[0]
spend = {(c["Kulutuste liik"], c["Leibkonna tüüp"]): v for c, v in cells(le)}

groups = sorted({c[2] for c in CATEGORIES})
series = {}
for years in ({"filter": "item", "values": [survey_year]}, {"filter": "top", "values": ["1"]}):
    cpi = post("IA002", [{"code": "Aasta", "selection": years}, {"code": "Kaubagrupp", "selection": {"filter": "item", "values": groups}}])
    for c, v in cells(cpi):
        if v is not None:
            series.setdefault(c["Kaubagrupp"], {})[(int(c["Aasta"]), int(c["Kuu"]))] = v
latest = max(k for k in series["1"])
factor = {}
for g, s in series.items():
    base = [v for (y, m), v in s.items() if y == int(survey_year)]
    factor[g] = s[latest] / (sum(base) / len(base))

# Kulutasemed: kokkuhoidlik = tänaste pensionäride keskmine (LE205).
# Optimaalne ja mugav: sama baas korrutatuna kategooria kaupa suhtega „IV / V tulukvintiil vs kõik leibkonnad“ (LE211, LE205).
q = post("LE211", [
    {"code": "Aasta", "selection": {"filter": "item", "values": [last_year]}},
    {"code": "Näitaja", "selection": {"filter": "item", "values": ["1"]}},
    {"code": "Kulutuste liik", "selection": {"filter": "item", "values": [c[0] for c in CATEGORIES]}},
    {"code": "Tulukvintiil", "selection": {"filter": "item", "values": ["4", "5"]}},
])
quint = {(c["Kulutuste liik"], c["Tulukvintiil"]): v for c, v in cells(q)}
allhh = post("LE205", [
    {"code": "Aasta", "selection": {"filter": "item", "values": [last_year]}},
    {"code": "Näitaja", "selection": {"filter": "item", "values": ["1"]}},
    {"code": "Kulutuste liik", "selection": {"filter": "item", "values": [c[0] for c in CATEGORIES]}},
    {"code": "Leibkonna tüüp", "selection": {"filter": "item", "values": ["1"]}},
])
avg = {c["Kulutuste liik"]: v for c, v in cells(allhh)}

out = []
for le_code, name, group in CATEGORIES:
    row = {"nimi": name}
    r4 = (quint.get((le_code, "4")) or 0) / avg[le_code] if avg.get(le_code) else 1
    r5 = (quint.get((le_code, "5")) or 0) / avg[le_code] if avg.get(le_code) else 1
    for hh_code, hh in HOUSEHOLDS.items():
        base = (spend.get((le_code, hh_code)) or 0) / 12 * factor[group]
        row[hh] = {"kokkuhoidlik": round(base), "optimaalne": round(base * r4), "mugav": round(base * r5)}
    out.append(row)

data = {
    "allikas": "Statistikaamet LE205 (leibkonnaliikme kulutused leibkonna tüübi järgi), LE211 (tulukvintiili järgi) ja IA002 (tarbijahinnaindeks)",
    "tasemed": {
        "kokkuhoidlik": "Tänaste pensionäride keskmine kulu",
        "optimaalne": "Nagu keskmisest jõukamad leibkonnad (IV tulukvintiil)",
        "mugav": "Nagu jõukaim viiendik (V tulukvintiil)",
    },
    "uuringuaasta": survey_year,
    "hinnad": f"{latest[0]}-{latest[1]:02d}",
    "kordaja_kokku": round(factor["1"], 3),
    "leibkonnad": {"uksi": "Üksik 65-aastane ja vanem", "paar": "Lasteta üle 64-aastaste paar (liikme kohta)"},
    "kategooriad": out,
}
target = pathlib.Path(__file__).resolve().parent.parent / "data" / "kulud.js"
target.write_text("// Genereeritud: scripts/fetch_kulud.py. Ära muuda käsitsi.\nwindow.KULUD = " + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
print("Kirjutatud", target, "uuring", survey_year, "hinnad", data["hinnad"])
for lvl in ("kokkuhoidlik", "optimaalne", "mugav"):
    print(" ", lvl, "üksi", sum(r["uksi"][lvl] for r in out), "paar", sum(r["paar"][lvl] for r in out))
