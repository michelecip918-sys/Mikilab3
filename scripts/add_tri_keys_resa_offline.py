import json, sys

PATH = "/app/frontend/src/i18n/triTranslations.json"

# Nuove stringhe introdotte dai punti #4 (Resa & Calo Peso) e #5 (Offline).
# Chiave = stringa sorgente ITALIANA (primo argomento di tri/mkTri).
NEW = {
    "Offline — ricette e piano di produzione salvati sono comunque consultabili.": {
        "fr": "Hors ligne — vos recettes et votre plan de production enregistrés restent consultables.",
        "fa": "آفلاین — دستور پخت‌ها و برنامهٔ تولید ذخیره‌شده همچنان در دسترس هستند.",
    },
    "Resa & Calo Peso": {"fr": "Rendement et perte de poids", "fa": "بازده و افت وزن"},
    "Peso impasto crudo": {"fr": "Poids de la pâte crue", "fa": "وزن خمیر خام"},
    "Scarto impastatrice": {"fr": "Perte au pétrin", "fa": "پرت همزن"},
    "Calo di cottura": {"fr": "Perte à la cuisson", "fa": "افت پخت"},
    "Numero pezzi": {"fr": "Nombre de pièces", "fa": "تعداد قطعات"},
    "pz": {"fr": "pc", "fa": "عدد"},
    "Impasto netto (dopo scarto)": {"fr": "Pâte nette (après perte)", "fa": "خمیر خالص (پس از پرت)"},
    "Peso finale cotto (totale)": {"fr": "Poids final cuit (total)", "fa": "وزن نهایی پخته (کل)"},
    "Peso crudo per pezzo": {"fr": "Poids cru par pièce", "fa": "وزن خام هر قطعه"},
    "Peso finale per pezzo": {"fr": "Poids final par pièce", "fa": "وزن نهایی هر قطعه"},
    "Inserisci il numero di pezzi per vedere il peso per pezzo.": {
        "fr": "Saisissez le nombre de pièces pour voir le poids par pièce.",
        "fa": "تعداد قطعات را وارد کنید تا وزن هر قطعه را ببینید.",
    },
}

with open(PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

added, skipped = [], []
for k, v in NEW.items():
    if k in data:
        skipped.append(k)  # NON sovrascrivere le chiavi esistenti
        continue
    data[k] = v
    added.append(k)

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print(f"AGGIUNTE: {len(added)}")
for k in added:
    print("  +", k)
print(f"GIÀ PRESENTI (saltate, non sovrascritte): {len(skipped)}")
for k in skipped:
    print("  =", k)
print("Totale chiavi ora:", len(data))
