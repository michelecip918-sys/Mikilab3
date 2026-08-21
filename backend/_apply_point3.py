import json, io

SEED = "/app/backend/mikilab_seed_data.json"
with open(SEED, encoding="utf-8") as f:
    recs = json.load(f)

by_name = {r["name"]: r for r in recs}

# A) Croissant (Cornetto Sfogliato): batch 3,4 kg farina / 96 croissant, 4 uova, Acqua+Uova = 60%
c = by_name["Cornetto Sfogliato"]
c["flour_grams"] = 3400
c["water_grams"] = 1840          # 1840 acqua + 200 uova = 2040 = 60% di 3400
c["hydration_percent"] = 54      # acqua sola
c["salt_grams"] = 68             # 2% di 3400
# uova come primo extra (200 g ≈ 5.9% su 3400) — mostra grammi corretti
extras = [e for e in (c.get("extra_ingredients") or []) if not str(e.get("name", "")).lower().startswith("uova")]
extras.insert(0, {"name": "Uova (Eier)", "percent": 5.9})
c["extra_ingredients"] = extras
c["notes"] = ("Impasto con Acqua + Uova = 60% del peso farina (≈4 uova, ~200 g, su 3,4 kg di farina → resa 96 croissant). "
              "Sfogliatura con burro/margarina (2 pieghe da 20%). Riposo in cella a 16°C tra le pieghe.")
c["notes_de"] = ("Teig mit Wasser + Eiern = 60 % des Mehlgewichts (≈4 Eier, ~200 g, auf 3,4 kg Mehl → 96 Croissants). "
                 "Tourierung mit Butter/Margarine (2 Touren à 20 %). Ruhe in der Gärkammer bei 16 °C zwischen den Touren.")

# C) Brezel Integrali: Vk 1300 g invece di 1500 g, acqua 500 g, stesse % di spezie/sale/lievito
b = by_name["Brezel Integrali"]
b["flour_grams"] = 1300
b["water_grams"] = 500
b["hydration_percent"] = 38      # 500/1300
b["salt_grams"] = 29             # 2,2% (come Brezel classica)
b["notes"] = ("Farina Integrale (Vk) 1300 g · Acqua 500 g. Stesse percentuali di spezie, sale e lievito della Brezel classica. "
              "Immergi in soluzione di soda (Lauge) prima di infornare, sale grosso in superficie.")
b["notes_de"] = ("Vollkornmehl (Vk) 1300 g · Wasser 500 g. Gleiche Prozentsätze an Gewürzen, Salz und Hefe wie die klassische Brezel. "
                 "Vor dem Backen in Natronlauge (Lauge) tauchen, grobes Salz obenauf.")

# B) Biga/Vorteig a 2 fasi: Treccia del Sole (Hefezopf) e Carezza Dolce (Mürbe/Pane al Latte)
biga = {
    "flour_g": 100, "water_g": 50, "yeast_g": 15,
    "hours": "Impasta e fai maturare 1-2 h a ~24°C fino al raddoppio (oppure 12 h in frigo a 4°C).",
    "hours_de": "Kneten und 1-2 Std. bei ~24°C bis zur Verdopplung reifen lassen (oder 12 Std. im Kühlschrank bei 4°C).",
    "hours_en": "Mix and mature 1-2 h at ~24°C until doubled (or 12 h in the fridge at 4°C).",
}
for nm in ("Treccia del Sole", "Carezza Dolce"):
    by_name[nm]["biga"] = dict(biga)

with io.open(SEED, "w", encoding="utf-8") as f:
    json.dump(recs, f, ensure_ascii=False, indent=1)

print("OK. Croissant:", c["flour_grams"], c["water_grams"], c["salt_grams"], "| Brezel Int:", b["flour_grams"], b["water_grams"], b["salt_grams"])
print("Biga added to Treccia/Carezza:", by_name["Treccia del Sole"].get("biga") is not None, by_name["Carezza Dolce"].get("biga") is not None)
