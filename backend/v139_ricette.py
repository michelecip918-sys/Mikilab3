"""MikiLab V139 — ricette più naturali: via malto, glutine aggiunto e (nei pani a lievito madre) lievito di birra;
nomi degli ingredienti più naturali, farine in percentuale, cotture e tempi scritti per esteso.
Le correzioni sono in v139_correzioni.json (cercate per nome). Usato una volta all'avvio (app_meta.v139_ricette)
e per allineare il seed. Le foto e gli id non si toccano."""
import json as _json
import re as _re
from pathlib import Path as _Path

CORREZIONI = _json.loads((_Path(__file__).parent / "v139_correzioni.json").read_text(encoding="utf-8"))
LANGS = ["", "_de", "_en", "_es", "_fr", "_fa"]
_L = {"": "it", "_de": "de", "_en": "en", "_es": "es", "_fr": "fr", "_fa": "fa"}

FARINE = {
    "Farina Integrale 90% + Farina di farro spelta 630 (o farro spelta tipo 1) 10%": ("Vollkornmehl 90 % + Dinkelmehl Type 630 10 %", "Wholemeal flour 90% + spelt flour type 630 (or type 1 spelt) 10%"),
    "Farina di farro spelta 630 (o farro spelta tipo 1) 54% + Farina Integrale 46%": ("Dinkelmehl Type 630 54 % + Vollkornmehl 46 %", "Spelt flour type 630 (or type 1 spelt) 54% + wholemeal flour 46%"),
    "Farina di farro spelta 630 (o farro spelta tipo 1) 32% + Farina Integrale 32% + Farina di segale integrale 32% + Segale integrale (Rg.Vk) 5%": ("Dinkelmehl Type 630 32 % + Vollkornmehl 32 % + Roggenvollkornmehl 32 % + Roggenvollkorn (Rg.Vk) 5 %", "Spelt flour type 630 (or type 1 spelt) 32% + wholemeal flour 32% + wholemeal rye flour 32% + wholemeal rye (Rg.Vk) 5%"),
    "Farina": ("Mehl", "Flour"),
    "Farina W300-330, media forza 87% + Zucchero semolato 13%": ("Mehl W300-330, mittelstark 87 % + Kristallzucker 13 %", "Flour W300-330, medium strength 87% + granulated sugar 13%"),
    "Farina W330 50% + Farina tipo 00 50%": ("Mehl W330 50 % + Weizenmehl Type 405 (ital. Tipo 00) 50 %", "Flour W330 50% + type 00 flour 50%"),
    "Farina forte W330, 12,5% proteine 91% + Zucchero semolato 9%": ("Starkes Mehl W330, 12,5 % Eiweiß 91 % + Kristallzucker 9 %", "Strong flour W330, 12.5% protein 91% + granulated sugar 9%"),
    "Semola rimacinata di grano duro 80% + Farina tipo 0 W 260 (Weizen 550) 20%": ("Hartweizengrieß, doppelt gemahlen (Semola rimacinata) 80 % + Weizenmehl Type 550 (ital. Tipo 0, W 260) 20 %", "Re-milled durum wheat semolina 80% + type 0 flour W 260 (German type 550) 20%"),
    "Farina 93% + Farina tipo 0 W 260 (Weizen 550) 7%": ("Mehl 93 % + Weizenmehl Type 550 (ital. Tipo 0, W 260) 7 %", "Flour 93% + type 0 flour W 260 (German type 550) 7%"),
    "Semola rimacinata 50% + Farina tipo 0 50%": ("Hartweizengrieß, doppelt gemahlen (Semola rimacinata) 50 % + Weizenmehl Type 550 (ital. Tipo 0) 50 %", "Re-milled durum semolina 50% + type 0 flour 50%"),
    "Farina tipo 0": ("Weizenmehl Type 550 (ital. Tipo 0)", "Type 0 flour"),
    "Farina di frumento Type 550/630": ("Weizenmehl Type 550/630", "Wheat flour type 550/630"),
    "Farina di farro spelta 630 (o farro spelta tipo 1) 29% + Farina Integrale 57% + Farina di segale 10% + Segale integrale (Rg.Vk) 5%": ("Dinkelmehl Type 630 29 % + Vollkornmehl 57 % + Roggenmehl 10 % + Roggenvollkorn (Rg.Vk) 5 %", "Spelt flour type 630 (or type 1 spelt) 29% + wholemeal flour 57% + rye flour 10% + wholemeal rye (Rg.Vk) 5%"),
    "Farina di grano germogliato (fatta in casa) 52% + Farina di lino dorato 31% + Farina di lupino dolce 17%": ("Mehl aus gekeimtem Weizen (hausgemacht) 52 % + Goldleinsamenmehl 31 % + Süßlupinenmehl 17 %", "Sprouted wheat flour (homemade) 52% + golden flax flour 31% + sweet lupin flour 17%"),
    "Farina di farro spelta 630 (o farro spelta tipo 1) 50% + Farina Integrale 50%": ("Dinkelmehl Type 630 50 % + Vollkornmehl 50 %", "Spelt flour type 630 (or type 1 spelt) 50% + wholemeal flour 50%"),
    "Farina forte W350 macinata a pietra 93% + Semola rimacinata 7%": ("Starkes Mehl W350, steingemahlen 93 % + Hartweizengrieß, doppelt gemahlen 7 %", "Strong stone-ground flour W350 93% + re-milled durum semolina 7%"),
    "Farina tipo 1": ("Weizenmehl Type 1050 (ital. Tipo 1)", "Type 1 flour"),
    "Farina Tipo 1": ("Weizenmehl Type 1050 (ital. Tipo 1)", "Type 1 flour"),
    "Farina alta forza W380": ("Sehr starkes Mehl W380", "High-strength flour W380"),
    "Farina integrale 50% + Farina tipo 0 50%": ("Vollkornmehl 50 % + Weizenmehl Type 550 (ital. Tipo 0) 50 %", "Wholemeal flour 50% + type 0 flour 50%"),
    "Farina di farro tipo 1 60% + Farina tipo 0 40%": ("Dinkelmehl Type 1050 (ital. Tipo 1) 60 % + Weizenmehl Type 550 (ital. Tipo 0) 40 %", "Type 1 spelt flour 60% + type 0 flour 40%"),
    "Farina tipo 0 78% + Farina di mais fioretto 19% + Semola di mais (per finitura) 3%": ("Weizenmehl Type 550 (ital. Tipo 0) 78 % + feines Maismehl (Fioretto) 19 % + Maisgrieß (zum Bestreuen) 3 %", "Type 0 flour 78% + fine cornmeal (fioretto) 19% + corn semolina (for finishing) 3%"),
    "Farina tipo 0 50% + Semola rimacinata 50%": ("Weizenmehl Type 550 (ital. Tipo 0) 50 % + Hartweizengrieß, doppelt gemahlen (Semola rimacinata) 50 %", "Type 0 flour 50% + re-milled durum semolina 50%"),
    "Farina W380 (grandi lievitati) 77% + Glassa (albumi, zucchero, mandorle in farina) 23%": ("Mehl W380 (für große Hefegebäcke) 77 % + Glasur (Eiweiß, Zucker, gemahlene Mandeln) 23 %", "Flour W380 (for large leavened cakes) 77% + glaze (egg whites, sugar, ground almonds) 23%"),
    "Farina 00 debole (W150-180), setacciata 50% + Zucchero semolato 50%": ("Schwaches Weizenmehl Type 405 (ital. Tipo 00, W150-180), gesiebt 50 % + Kristallzucker 50 %", "Weak type 00 flour (W150-180), sifted 50% + granulated sugar 50%"),
    "Farina alta forza W380 83% + Zucchero semolato (finitura) 17%": ("Sehr starkes Mehl W380 83 % + Kristallzucker (zum Bestreuen) 17 %", "High-strength flour W380 83% + granulated sugar (for finishing) 17%"),
    "Farina di grano tenero W300 50% + Farina di riso 50%": ("Weizenmehl W300 50 % + Reismehl 50 %", "Soft wheat flour W300 50% + rice flour 50%"),
    "Farina tipo 1 85% + Farina di canapa 15%": ("Weizenmehl Type 1050 (ital. Tipo 1) 85 % + Hanfmehl 15 %", "Type 1 wheat flour 85% + hemp flour 15%"),
    "Farina tipo 0 (W 280-300) 90% + Farina di canapa 10%": ("Weizenmehl Type 550 (ital. Tipo 0, W 280-300) 90 % + Hanfmehl 10 %", "Type 0 wheat flour (W 280-300) 90% + hemp flour 10%"),
    "Farina tipo 0 (W 260-280) 90% + Farina di canapa 10%": ("Weizenmehl Type 550 (ital. Tipo 0, W 260-280) 90 % + Hanfmehl 10 %", "Type 0 wheat flour (W 260-280) 90% + hemp flour 10%"),
    "Farina tipo 0 forte (W 300-330) 90% + Farina di canapa 10%": ("Starkes Weizenmehl Type 550 (ital. Tipo 0, W 300-330) 90 % + Hanfmehl 10 %", "Strong type 0 wheat flour (W 300-330) 90% + hemp flour 10%"),
    "Farina tipo 00 85% + Farina di canapa 15%": ("Weizenmehl Type 405 (ital. Tipo 00) 85 % + Hanfmehl 15 %", "Type 00 wheat flour 85% + hemp flour 15%"),
    "Farina tipo 0 85% + Farina di canapa 15%": ("Weizenmehl Type 550 (ital. Tipo 0) 85 % + Hanfmehl 15 %", "Type 0 wheat flour 85% + hemp flour 15%"),
    "Farina tipo 1 80% + Farina di canapa 20%": ("Weizenmehl Type 1050 (ital. Tipo 1) 80 % + Hanfmehl 20 %", "Type 1 wheat flour 80% + hemp flour 20%"),
    "Semola rimacinata di grano duro 85% + Farina di canapa 15%": ("Hartweizengrieß, doppelt gemahlen (Semola rimacinata) 85 % + Hanfmehl 15 %", "Re-milled durum wheat semolina 85% + hemp flour 15%"),
    "Farina tipo 0 (W 260-280) 88% + Farina di canapa 12%": ("Weizenmehl Type 550 (ital. Tipo 0, W 260-280) 88 % + Hanfmehl 12 %", "Type 0 wheat flour (W 260-280) 88% + hemp flour 12%"),
    "Farina tipo 00 80% + Farina di canapa 20%": ("Weizenmehl Type 405 (ital. Tipo 00) 80 % + Hanfmehl 20 %", "Type 00 wheat flour 80% + hemp flour 20%"),
}
# Nel file la riga del 60/40 è arrivata spezzata ("( della farina", "50% Manitoba W380 50%"): stessa miscela, scritta leggibile.
_FARINA_6040_RAW = "Metodo 60/40 ( della farina nel 1° impasto, 40% nel 2°). Miscela: 50% Manitoba W380 50% + Farina forte W330, con 8% farina di canapa 42% + Farina di canapa (Hanfmehl) 7%"
_FARINA_6040 = "Metodo 60/40 (60% della farina nel 1° impasto, 40% nel 2°). Miscela: Manitoba W380 50% + Farina forte W330 42% + Farina di canapa (Hanfmehl) 7%"
FARINE[_FARINA_6040] = ("Methode 60/40 (60 % des Mehls im 1. Teig, 40 % im 2.). Mischung: Manitoba W380 50 % + starkes Mehl W330 42 % + Hanfmehl 7 %", "60/40 method (60% of the flour in the 1st dough, 40% in the 2nd). Blend: Manitoba W380 50% + strong flour W330 42% + hemp flour 7%")

NOMI = {
    "Burro (Butter)": {"_de": "Butter", "_en": "Butter", "_es": "Mantequilla (Butter)", "_fr": "Beurre (Butter)", "_fa": "کره (Butter)"},
    "Cacao nero olandese": {"_de": "Schwarzer Kakao (holländisch)", "_en": "Black cocoa (Dutch-process)", "_es": "Cacao negro holandés", "_fr": "Cacao noir hollandais", "_fa": "کاکائوی سیاه هلندی"},
    "Confettura di albicocca scaldata e setacciata (lucido)": {"_de": "Aprikosenkonfitüre, erwärmt und passiert (zum Glänzen)", "_en": "Apricot jam, warmed and sieved (glaze)", "_es": "Mermelada de albaricoque calentada y tamizada (brillo)", "_fr": "Confiture d'abricot chauffée et tamisée (nappage)", "_fa": "مربای زردآلوی گرم و الک‌شده (براق‌کننده)"},
    "Farina di segale tostata scura (colore)": {"_de": "Dunkel geröstetes Roggenmehl (Farbe)", "_en": "Dark toasted rye flour (colour)", "_es": "Harina de centeno tostada oscura (color)", "_fr": "Farine de seigle torréfiée foncée (couleur)", "_fa": "آرد چاودار برشته تیره (رنگ)"},
    "Pasta d'arancia fatta in casa (senza conservanti)": {"_de": "Hausgemachte Orangenpaste (ohne Konservierungsstoffe)", "_en": "Homemade orange paste (no preservatives)", "_es": "Pasta de naranja casera (sin conservantes)", "_fr": "Pâte d'orange maison (sans conservateurs)", "_fa": "خمیر پرتقال خانگی (بدون نگهدارنده)"},
}
_SENZA = " (senza solfiti né conservanti)"
SENZA = {"_de": " (ohne Sulfite und Konservierungsstoffe)", "_en": " (no sulphites or preservatives)", "_es": " (sin sulfitos ni conservantes)", "_fr": " (sans sulfites ni conservateurs)", "_fa": " (بدون سولفیت و نگهدارنده)"}

PUNTATA = {"it": "Puntata 3–4 ore a 26 °C con tre serie di pieghe nella prima ora e mezza.",
           "de": "Stockgare 3–4 Stunden bei 26 °C, mit drei Runden Dehnen und Falten in den ersten anderthalb Stunden.",
           "en": "Bulk fermentation 3–4 hours at 26 °C with three sets of folds in the first hour and a half.",
           "es": "Fermentación en bloque 3–4 horas a 26 °C con tres series de pliegues en la primera hora y media.",
           "fr": "Pointage 3–4 heures à 26 °C avec trois séries de rabats pendant la première heure et demie.",
           "fa": "تخمیر اولیه ۳–۴ ساعت در ۲۶ درجه سانتی‌گراد، با سه سری چین‌دادن در یک ساعت و نیم اول."}
APPRETTO = {"it": "Appretto 2,5–3 ore a 27 °C, oppure frigo a 4 °C per 12–16 ore e 1 ora fuori prima di infornare.",
            "de": "Stückgare 2,5–3 Stunden bei 27 °C, oder im Kühlschrank bei 4 °C für 12–16 Stunden und 1 Stunde vor dem Backen herausnehmen.",
            "en": "Final proof 2.5–3 hours at 27 °C, or in the fridge at 4 °C for 12–16 hours, then 1 hour out before baking.",
            "es": "Fermentación final 2,5–3 horas a 27 °C, o nevera a 4 °C durante 12–16 horas y 1 hora fuera antes de hornear.",
            "fr": "Apprêt 2,5–3 heures à 27 °C, ou réfrigérateur à 4 °C pendant 12–16 heures et 1 heure dehors avant d'enfourner.",
            "fa": "تخمیر نهایی ۲٫۵–۳ ساعت در ۲۷ درجه سانتی‌گراد، یا در یخچال ۴ درجه به مدت ۱۲–۱۶ ساعت و ۱ ساعت بیرون پیش از پخت."}
FORMA_BIGA = {"it": "FORMATURA: forma le pagnotte e mettile nel cestino infarinato.", "de": "FORMEN: Laibe formen und ins bemehlte Gärkörbchen legen.",
              "en": "SHAPE: shape the loaves and place them in a floured banneton.", "es": "FORMADO: forma las hogazas y colócalas en un cesto enharinado.",
              "fr": "FAÇONNAGE: façonner les miches et les placer dans un banneton fariné.", "fa": "شکل‌دهی: قرص‌های نان را شکل دهید و در سبد آردپاشی‌شده بگذارید."}
PEZZA_PINSA = {"it": "PEZZATURA: dividi in 8 pezzi da circa 240 g e mettili in una cassetta cosparsa di farina di riso.",
               "de": "PORTIONIEREN: In 8 Stücke von etwa 240 g teilen und in eine mit Reismehl bestreute Box legen.",
               "en": "DIVIDING: divide into 8 pieces of about 240 g and place them in a box dusted with rice flour."}
# Come cambiano i passi: "tpl" = pani del metodo (5 puntata, 6 appretto); "biga" = 5 puntata, 6 cella tolta, 7 formatura; "pinsa".
TEMPI_SCHEMA = {"Pane all'Nduja": "biga", "Pane alla Curcuma e Zenzero": "biga", "Pane allo Zafferano": "biga", "Pinsa Romana MikiLab": "pinsa"}
POOLISH_PESO = {"Baguette con Poolish": 1000, "Gnetze Brot": 300, "Wurzelbrot": 300}
PESA_POOLISH = {"it": "Pesa {g} g di poolish pronto.", "de": "{g} g fertigen Poolish abwiegen.", "en": "Weigh out {g} g of ready poolish.",
                "es": "Pesa {g} g de poolish listo.", "fr": "Pèse {g} g de poolish prêt.", "fa": "{g} گرم پولیش آماده وزن کنید."}
GUARNIZIONE = {"it": "Guarnizione: {n}, q.b.", "de": "Zum Garnieren: {n}, nach Geschmack.", "en": "Garnish: {n}, to taste.",
               "es": "Para decorar: {n}, al gusto.", "fr": "Garniture : {n}, à volonté.", "fa": "تزئین: {n}، به مقدار لازم."}
_FA_DIG = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
_STEP = _re.compile(r"^([0-9۰-۹]+)\)\s*")
_COTTURA_KW = _re.compile(r"cottura|backen|bak|cocc|cuisson|cuire|پخت", _re.I)


def _cottura(lang, txt):
    m = _re.match(r"(\d+) °C per (\d+) minuti, vapore nei primi (\d+) minuti", txt)
    t, mi, v = m.groups()
    return {"it": txt, "de": f"{t} °C für {mi} Minuten, Schwaden in den ersten {v} Minuten",
            "en": f"{t} °C for {mi} minutes, steam for the first {v} minutes",
            "es": f"{t} °C durante {mi} minutos, vapor en los primeros {v} minutos",
            "fr": f"{t} °C pendant {mi} minutes, vapeur pendant les {v} premières minutes",
            "fa": f"{t} درجه سانتی‌گراد به مدت {mi} دقیقه، با بخار در {v} دقیقه اول".translate(_FA_DIG)}[lang]


# --- malto: frasi intere, poi la parola dentro gli elenchi -------------------------------------------------------
FRASI_MALTO = [
    ("puoi sostituirlo con un semplice malto o ometterlo", "puoi ometterlo"),
    ("ersetzbar durch ein einfaches Malz oder weglassbar", "du kannst ihn auch weglassen"),
    ("you can replace it with a simple malt or omit it", "you can omit it"),
    ("puedes sustituirlo por una malta simple u omitirlo", "puedes omitirlo"),
    ("remplaçable par un simple malt ou à omettre", "tu peux l'omettre"),
    ("می‌توانی با یک مالت ساده جایگزین کنی یا حذفش کنی", "می‌توانی حذفش کنی"),
    ("Malto e olio danno colore e croccantezza", "L'olio dà colore e croccantezza"),
    ("Malz und Öl sorgen für Farbe und Knusprigkeit", "Öl sorgt für Farbe und Knusprigkeit"),
    ("Malt and oil give colour and crunch", "Oil gives colour and crunch"),
    ("La malta y el aceite aportan color y crocancia", "El aceite aporta color y crocancia"),
    ("Le malt et l'huile apportent couleur et croustillant", "L'huile apporte couleur et croustillant"),
    ("مالت و روغن رنگ و خرد‌شوندگی بهتری می‌دهند", "روغن رنگ و خرد‌شوندگی بهتری می‌دهد"),
    (", i 580 g di acqua fredda e 10 g di malto d'orzo", " e i 580 g di acqua fredda"),
    (", 580 g kaltes Wasser und 10 g Gerstenmalz", " und 580 g kaltes Wasser"),
    (", the 580 g cold water and 10 g barley malt", " and the 580 g cold water"),
    ("malto diastatico in polvere 15 g, ", ""), ("diastatisches Malzpulver 15 g, ", ""), ("diastatic malt powder 15 g, ", ""),
    ("che ha enzimi delicati come un malto fatto da te", "che porta enzimi delicati"),
    (", mit sanften Enzymen wie ein selbst gemachtes Malz,", ", mit sanften Enzymen,"),
    (", with gentle enzymes like a homemade malt,", ", with gentle enzymes,"),
    (" Diastatic malt is 15 out of 100: at a 2-3% dose it gives 0.3-0.45% malt on the flour, the right amount.", ""),
    (" und Malz zugeben", " zugeben"),
    ("FACOLTATIVO, 8 ingredienti naturali", "FACOLTATIVO, 7 ingredienti naturali"), ("aus 8 natürlichen Zutaten", "aus 7 natürlichen Zutaten"),
    ("OPTIONAL improver, 8 natural ingredients", "OPTIONAL improver, 7 natural ingredients"),
    ("(malto d'orzo, grano", "(grano"), ("(Gerstenmalz, Weizen", "(Weizen"), ("(barley malt, wheat", "(wheat"),
]
_W = {"it": r"(?:il |del )?\bmalto\b(?: d'orzo| d orzo| diastatico| diastasico)?", "de": r"\b(?:Gersten)?[Mm]alz\b",
      "en": r"(?:the )?(?:barley |diastatic )?\b[Mm]alt\b", "es": r"(?:la )?\bmalta\b", "fr": r"(?:le )?\bmalt\b", "fa": r"مالت"}
_CONJ = {"it": "e", "de": "und", "en": "and", "es": "y", "fr": "et", "fa": "و"}
_DIAST = _re.compile(r"diastat|DIASTAT", _re.I)


def togli_malto(testo, lang):
    if not testo:
        return testo
    t = testo
    for a, b in FRASI_MALTO:
        t = t.replace(a, b)
    # frasi sul malto diastatico (solo nella scheda del Miglioratore)
    t = _re.sub(r"[^.\n]*\b(?:" + _DIAST.pattern + r")[^\n]*?\.(?=\s|$)(?:\s*\([^)]*\)\.)?", "", t) if _DIAST.search(t) else t
    w, c = _W[lang], _CONJ[lang]
    sep = "، " if lang == "fa" else ", "
    t = _re.sub(r"\(\s*" + w + sep, "(", t)
    t = _re.sub(sep + w + r"\s*\)", ")", t)
    t = _re.sub(sep + w + sep, sep, t)
    t = _re.sub(sep + w + r" " + c + r" ", f" {c} ", t)
    t = _re.sub(r" " + c + r" " + w + r"(?=[;.,)])", "", t)
    t = _re.sub(r"[ \t]{2,}", " ", t)
    return t


def _togli_glutine(testo, lang):
    w = {"fa": "گلوتن"}.get(lang, r"[Gg]lutine?" if lang == "it" else r"[Gg]luten")
    sep = "، " if lang == "fa" else ", "
    return _re.sub(r"\(\s*" + w + sep, "(", testo) if testo else testo


def _righe(testo):
    return testo.split("\n")


def _num(line):
    m = _STEP.match(line)
    return int(m.group(1).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))) if m else None


def _riga(lines, n):
    for i, l in enumerate(lines):
        if _num(l) == n:
            return i
    return None


def _setnum(line, n, fa):
    s = str(n).translate(_FA_DIG) if fa else str(n)
    return _STEP.sub(f"{s}) ", line, count=1)


def _tempi(testo, lang, schema):
    lines = _righe(testo)
    fa = lang == "fa"
    p = lambda n: (str(n).translate(_FA_DIG) if fa else str(n)) + ") "  # noqa: E731
    if schema == "tpl":
        i5, i6 = _riga(lines, 5), _riga(lines, 6)
        lines[i5] = p(5) + PUNTATA[lang]
        lines[i6] = lines[i6].rstrip() + " " + APPRETTO[lang]
    elif schema == "biga":
        i5, i6, i7 = _riga(lines, 5), _riga(lines, 6), _riga(lines, 7)
        lines[i5] = p(5) + PUNTATA[lang]
        lines[i7] = p(7) + FORMA_BIGA[lang] + " " + APPRETTO[lang]
        del lines[i6]
        lines = [_setnum(l, _num(l) - 1, fa) if (_num(l) or 0) > 6 else l for l in lines]
    else:  # pinsa
        i4, i5, i6 = _riga(lines, 4), _riga(lines, 5), _riga(lines, 6)
        lines[i4] = p(4) + PUNTATA[lang]
        lines[i6] = p(6) + PEZZA_PINSA[lang] + " " + APPRETTO[lang]
        del lines[i5]
        lines = [_setnum(l, _num(l) - 1, fa) if (_num(l) or 0) > 5 else l for l in lines]
    return "\n".join(lines)


def _aggiungi_cottura(testo, lang, frase):
    lines = _righe(testo)
    idx = [i for i, l in enumerate(lines) if _num(l) and _COTTURA_KW.search(l)]
    i = idx[-1]
    lines[i] = _re.sub(r"[.\s]*$", "", lines[i]) + ": " + frase + "."
    return "\n".join(lines)


def _pesa_poolish(testo, lang, g):
    lines = _righe(testo)
    i = _riga(lines, 1)
    lines[i] = lines[i].rstrip() + " " + PESA_POOLISH[lang].format(g=str(g).translate(_FA_DIG) if lang == "fa" else g)
    return "\n".join(lines)


def correggi(r, c):
    """Ritorna i campi cambiati (dict) per la ricetta r secondo la correzione c (None = correzione generale del malto)."""
    upd = {}
    c = c or {}
    nome = r.get("name")
    ex = [dict(e) for e in (r.get("extra_ingredients") or [])]
    togli = set(c.get("togli_ingredienti") or [])
    sale = [s.strip(" '") for s in _re.findall(r"'([^']+)'", c.get("sale_in_superficie", ""))]
    guarn = [e for e in ex if e.get("name") in sale]
    nuovi = []
    for e in ex:
        n = e.get("name") or ""
        if n in togli or n in sale or ("poolish" in c and n.startswith("Poolish (")):
            continue
        nv = (c.get("sostituisci_ingredienti") or {}).get(n)
        if nv:
            if nv.endswith(_SENZA) and nv[: -len(_SENZA)] == n:
                for suf, add in SENZA.items():
                    if e.get("name" + suf) and add not in e["name" + suf]:
                        e["name" + suf] = e["name" + suf] + add
            else:
                for suf, tr in NOMI[nv].items():
                    if ("name" + suf) in e:
                        e["name" + suf] = tr
            e["name"] = nv
        nuovi.append(e)
    if nuovi != (r.get("extra_ingredients") or []):
        upd["extra_ingredients"] = nuovi
    ft = c.get("flour_type_nuovo")
    if ft:
        if ft == _FARINA_6040_RAW:
            ft = _FARINA_6040
        de, en = FARINE[ft]
        for k, v in (("flour_type", ft), ("flour_type_de", de), ("flour_type_en", en)):
            if r.get(k) != v:
                upd[k] = v
    glutine = any(t.startswith("Glutine") for t in togli)
    for suf in LANGS:
        lang = _L[suf]
        for campo in ("procedure", "notes"):
            k = campo + suf
            v = r.get(k)
            if not isinstance(v, str) or not v:
                continue
            nv = togli_malto(v, lang)
            if campo == "procedure":
                if glutine:
                    nv = _togli_glutine(nv, lang)
                if c.get("tempi_solo_lievito_madre") and PUNTATA[lang] not in nv and (lang in ("it", "de", "en") or TEMPI_SCHEMA.get(nome) != "pinsa"):
                    nv = _tempi(nv, lang, TEMPI_SCHEMA.get(nome, "tpl"))
                if c.get("cottura_da_scrivere"):
                    fr = _cottura(lang, c["cottura_da_scrivere"])
                    if fr not in nv:
                        nv = _aggiungi_cottura(nv, lang, fr)
                if "poolish" in c and nome in POOLISH_PESO:
                    g = POOLISH_PESO[nome]
                    frase = PESA_POOLISH[lang].format(g=str(g).translate(_FA_DIG) if lang == "fa" else g)
                    if frase not in nv:
                        nv = _pesa_poolish(nv, lang, g)
            if campo == "notes" and guarn:
                for gi in guarn:
                    gn = gi.get("name" + suf) or gi.get("name")
                    frase = GUARNIZIONE[lang].format(n=gn)
                    if frase not in nv:
                        nv = nv.rstrip() + "\n\n" + frase
            if nv != v:
                upd[k] = nv
    return upd


def per_nome():
    return {c["nome"]: c for c in CORREZIONI}


async def applica_db(db, now):
    """Applica le correzioni al database: ritorna (nomi cambiati, nomi non trovati)."""
    corr = per_nome()
    cambiate, trovati = [], set()
    async for r in db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}):
        c = corr.get(r.get("name"))
        if c:
            trovati.add(r["name"])
        upd = correggi(r, c)
        if upd:
            upd["updated_at"] = now
            await db.recipes.update_one({"collection_name": "mikilab", "id": r["id"], "name": r["name"]}, {"$set": upd})
            if any(k.startswith("procedure") for k in upd):
                await db.recipe_courses_v2.delete_many({"recipe_id": r["id"]})
            cambiate.append(r["name"])
    return cambiate, sorted(set(corr) - trovati)
