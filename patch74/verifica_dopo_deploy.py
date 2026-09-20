#!/usr/bin/env python3
"""Controllo veloce e GRATIS dopo il deploy v74 (nessuna chiamata IA).
Uso: python3 patch74/verifica_dopo_deploy.py https://mikilab.de"""
import sys, json, urllib.request
BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://mikilab.de").rstrip("/")
def get(p):
    with urllib.request.urlopen(BASE + p, timeout=40) as r:
        return json.loads(r.read().decode("utf-8"))
ok = True
def check(name, cond, extra=""):
    global ok; ok = ok and bool(cond); print(("OK   " if cond else "FAIL ") + name, extra)
recs = get("/api/recipes?collection_name=mikilab")
check("ricette pubbliche (>= 150)", len(recs) >= 150, f"({len(recs)})")
by = {r["name"]: r for r in recs}
NUOVE = ["Colomba Artigianale MikiLab — Classica alle Mandorle", "Pandoro Artigianale MikiLab — Classico Vanigliato",
         "Stollen Artigianale MikiLab — Classico (Christstollen)", "Stollen Artigianale MikiLab — con Marzapane (Marzipanstollen)",
         "Pinsa Romana MikiLab", "Panettone Salato Artigianale MikiLab — Speck e Formaggio"]
for n in NUOVE:
    r = by.get(n)
    check(f"ricetta nuova presente: {n[:45]}", r and (r.get("flour_grams") or 0) > 0 and "1)" in (r.get("procedure") or ""))
cats = {r.get("menu_category") for r in recs}
check("sezioni Rosticceria e Fritti", {"rosticceria", "fritti"} <= cats)
r = by.get(NUOVE[0])
if r:
    for lang in ("it", "de", "en"):
        c = get(f"/api/recipes/{r['id']}/course-v2?lang={lang}").get("course", {})
        check(f"corso Colomba {lang}", len(c.get("phases", [])) >= 8, f"({len(c.get('phases', []))} fasi)")
    ex = get(f"/api/recipe-extras/{r['id']}")
    check("stato bozza di Sitor (non 'Provata')", ex.get("status") not in ("tested", "reviewed"), f"({ex.get('status')})")
ss = get("/api/site-settings")
check("site-settings espone impressum_address", "impressum_address" in ss)
check("site-settings senza numeri di telefono", not any(k in ss for k in ("whatsapp", "phone", "telefono")))
r = by.get("Pizza Napoletana (tonda)")
if r:
    c = get(f"/api/recipes/{r['id']}/course-v2?lang=it").get("course", {})
    check("corso Pizza Napoletana", len(c.get("phases", [])) >= 5)
print("\nTUTTO OK" if ok else "\nQUALCOSA NON VA: mandami questo output")
sys.exit(0 if ok else 1)
