#!/usr/bin/env python3
"""Controllo veloce e GRATIS dopo il deploy (nessuna chiamata IA). Uso: python3 verifica_dopo_deploy.py https://mikilab.de"""
import sys, json, urllib.request
BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://mikilab.de").rstrip("/")
def get(p):
    with urllib.request.urlopen(BASE + p, timeout=40) as r:
        return json.loads(r.read().decode("utf-8"))
ok = True
def check(name, cond, extra=""):
    global ok; ok = ok and bool(cond); print(("OK   " if cond else "FAIL ") + name, extra)
recs = get("/api/recipes?collection_name=mikilab")
check("ricette pubbliche", len(recs) >= 130, f"({len(recs)})")
by = {r["name"]: r for r in recs}
for n in ["Pizza Napoletana (tonda)", "Brioche Francese (col burro)", "Pan di Spagna", "Veneziana (grande lievitato dolce)", "Focaccia Genovese"]:
    r = by.get(n)
    check(f"ricetta completa: {n}", r and (r.get("flour_grams") or 0) > 0 and "come indicato" not in (r.get("procedure") or ""))
pan = [r for r in recs if r["name"].startswith("Panettone Artigianale MikiLab") and "Albicocca" in r["name"]]
check("panettone con i grammi nel procedimento", pan and "300 g di farina" in pan[0].get("procedure", ""))
r = by.get("Pizza Napoletana (tonda)")
if r:
    for lang in ("it", "de", "en"):
        c = get(f"/api/recipes/{r['id']}/course-v2?lang={lang}").get("course", {})
        check(f"corso passo-passo {lang}", len(c.get("phases", [])) >= 5, f"({len(c.get('phases', []))} fasi)")
    ex = get(f"/api/recipe-extras/{r['id']}")
    check("stato bozza di Sitor (non 'Provata')", ex.get("status") != "tested", f"({ex.get('status')})")
print("\nTUTTO OK" if ok else "\nQUALCOSA NON VA: mandami questo output")
sys.exit(0 if ok else 1)
