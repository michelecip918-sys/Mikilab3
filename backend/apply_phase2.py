# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""FASE 2: catena del freddo per tipologia + nomi reali (proposta) nel seed Mikilab."""
import json, re
from pathlib import Path

SEED = Path(__file__).parent / "mikilab_seed_data.json"
data = json.load(open(SEED, encoding="utf-8"))

# --- Nomi reali proposti (modificabili da Michele nel form) ---
REAL = {
    "Anima Integrale": ("Pane Integrale", "Vollkornbrot"),
    "Bruno d'Autunno": ("Pane di Segale", "Roggenbrot"),
    "Carezza Dolce": ("Pane al Latte", "Milchbrot"),
    "Cuore Italiano": ("Pane Bianco Italiano", "Italienisches Weißbrot"),
    "Dolce Cipolla": ("Pane alle Cipolle Caramellate", "Karamellisiertes Zwiebelbrot"),
    "Filo di Francia": ("Pane Francese (Baguette)", "Französisches Brot (Baguette)"),
    "Gran Riserva": ("Pane di Grano Antico", "Urgetreidebrot"),
    "Nuvola in Cassetta": ("Pane in Cassetta (Toast)", "Toastbrot"),
    "Oro di Terra": ("Pane alle Patate", "Kartoffelbrot"),
    "Quotidiano del Fornaio": ("Pane di Casa", "Hausbrot"),
    "Rustico Noci e Uvetta": ("Pane con Noci e Uvetta", "Walnuss-Rosinen-Brot"),
    "Sinfonia di Cereali": ("Pane ai 5 Cereali", "Mehrkornbrot"),
    "Treccia del Sole": ("Treccia Dolce", "Hefezopf"),
    "Verde Canapa": ("Pane ai Semi di Canapa", "Hanfsamenbrot"),
    "Gnetze Brot": ("Pane Bagnato Svevo (Genetztes)", "Genetztes Brot"),
    "Wurzelbrot": ("Pane Radice", "Wurzelbrot"),
    "Bretzel del Maestro": ("Bretzel", "Laugenbrezel"),
    "Panettone Mikilab": ("Panettone Artigianale", "Handwerklicher Panettone"),
}

# --- Catena del freddo: righe generiche 16°C ---
IT_GEN = re.compile(r"^\s*5\)\s*CELLA A 16°C subito dopo l'impasto:\s*riposo MASSIMO 6 ore\.?\s*$", re.I | re.M)
DE_GEN = re.compile(r"^\s*5\).*16\s*°?C.*(nach dem Kneten|GÄRZELLE|KÜHLZELLE|GÄRKAMMER).*MAXIMAL 6 Stunden\.?\s*$", re.I | re.M)

IT_AMB = "5) Puntata a temperatura ambiente (~24-26°C) con pieghe ogni 30-40'; usa il frigo (4°C) solo per gestire i tempi."
DE_AMB = "5) Stockgare bei Raumtemperatur (~24-26°C) mit Dehnen/Falten alle 30-40'; Kühlung (4°C) nur zur Zeitsteuerung."

changed = 0
for r in data:
    name = r.get("name", "")
    pref = r.get("preferment_type")
    is_panettone = "Panettone" in name
    is_sfoglia = bool(re.search(r"cornett|croissant|sfogli|plunder", name, re.I))
    keep_16 = (pref == "lm") and not is_panettone and not is_sfoglia

    # nome reale (solo se proposto e non già uguale al name)
    if name in REAL and not r.get("real_name"):
        r["real_name"], r["real_name_de"] = REAL[name]
        changed += 1

    # sfoglie/croissant: pieghe in FRIGO 2-4°C (stabilizza il burro)
    if is_sfoglia:
        for f in ("procedure", "procedure_de"):
            if r.get(f):
                r[f] = re.sub(r"(cella|Kühlzelle|Gärzelle)\s*16\s*°?C", "frigo 2–4°C" , r[f], flags=re.I)
                r[f] = r[f].replace("16°C tra le pieghe", "2–4°C tra le pieghe (stabilizza il burro)")

    # regola generica 16°C: tieni per LM, altrimenti passa a temperatura ambiente
    if not keep_16:
        if r.get("procedure"):
            r["procedure"] = IT_GEN.sub(IT_AMB, r["procedure"])
        if r.get("procedure_de"):
            r["procedure_de"] = DE_GEN.sub(DE_AMB, r["procedure_de"])

    # panettoni: assicura nota lievitazione 24-28°C
    if is_panettone:
        for f, txt in (("notes", "Lievitazione a 24-28°C; raffreddamento capovolto (a testa in giù) per 12 h."),
                       ("notes_de", "Gare bei 24-28°C; Abkühlen kopfüber für 12 Std.")):
            cur = r.get(f) or ""
            if "24-28" not in cur and "24–28" not in cur:
                r[f] = (cur + ("\n" if cur else "") + txt).strip()

json.dump(data, open(SEED, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("done. real_name set:", changed, "recipes:", len(data))
