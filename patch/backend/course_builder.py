# -*- coding: utf-8 -*-
"""MikiLab — corso passo-passo costruito DIRETTAMENTE dal procedimento della ricetta.
Nessuna chiamata IA: istantaneo, gratis, sempre disponibile in IT/DE/EN e fedele al testo di Michele.
Funzioni pure (nessuna dipendenza dal server): facili da testare."""
import re
import hashlib

_STEP_RE = re.compile(r"^\s*(\d{1,2})[\)\.]\s+(.*)$")

_H = r"(?:h|ore|ora|Std\.?|Stunden|Stunde|hours?|hrs?)"
_M = r"(?:min\b|minuti|minuto|Minuten|Minute|minutes?)"
_NUM = r"(\d+(?:[.,]\d+)?)"
_RANGE = _NUM + r"(?:\s*-\s*" + _NUM + r")?"
_HOUR_RE = re.compile(_RANGE + r"\s*" + _H + r"(?![A-Za-zà-ü])", re.I)
_MIN_RE = re.compile(_RANGE + r"\s*(?:" + _M + r"|['′’](?![\w]))", re.I)


def _f(x):
    return float(str(x).replace(",", "."))


def parse_steps(procedure: str):
    """Ritorna la lista dei passi numerati (righe di continuazione accodate; blocchi dopo riga vuota ignorati)."""
    steps, cur, blank_seen = [], None, False
    for line in (procedure or "").splitlines():
        m = _STEP_RE.match(line)
        if m:
            if cur is not None:
                steps.append(cur)
            cur = m.group(2).strip()
            blank_seen = False
        elif not line.strip():
            blank_seen = True
        elif cur is not None and not blank_seen:
            cur += " " + line.strip()
    if cur is not None:
        steps.append(cur)
    return steps


def parse_duration(text: str):
    """(min, max) minuti della PRIMA durata trovata nel testo, oppure (0, 0)."""
    best = None
    for rx, mult in ((_HOUR_RE, 60.0), (_MIN_RE, 1.0)):
        m = rx.search(text)
        if m and (best is None or m.start() < best[0]):
            lo = _f(m.group(1)) * mult
            hi = _f(m.group(2)) * mult if m.group(2) else lo
            best = (m.start(), int(round(lo)), int(round(hi)))
    if not best:
        return 0, 0
    return best[1], best[2]


def split_label(step: str):
    m = re.match(r"^([A-ZÀ-ÜÄÖÜ][A-ZÀ-ÜÄÖÜ0-9°'’ /\-]{2,32})(?:,\s*[^:]{0,40})?:\s+(.*)$", step)
    if m:
        small = {"und", "and", "e", "di", "del", "della", "la", "il", "le", "in", "a", "o", "von", "der", "die", "das"}
        label = " ".join((w.lower() if w.lower() in small else w.capitalize()) for w in m.group(1).strip().split())
        return label, m.group(2).strip()
    return "", step


def _short_name(text: str):
    first = re.split(r"[.:;]", text, maxsplit=1)[0]
    words = first.split()
    return " ".join(words[:6]).rstrip(",")


_SIGNAL_RE = re.compile(
    r"((?:È|E|è|e)\s+pront[oaie]\s+quando[^.]*\.|Pront[oaie]\s+quando[^.]*\.|Cotto\s+quando[^.]*\.|Segno di riuscita:[^.]*\.|"
    r"Fertig,?\s+wenn[^.]*\.|Erfolgszeichen:[^.]*\.|Fertig\s+ist[^.]*\.|"
    r"(?:It is |It's )?[Rr]eady when[^.]*\.|[Dd]one when[^.]*\.|Sign of success:[^.]*\.)")

_WHY = [
    (r"autolisi|autolyse", {"it": "Riposo di farina e acqua: il glutine si forma da solo e poi impasti meno.", "de": "Mehl und Wasser ruhen lassen: Das Gluten bildet sich von selbst, danach knetest du weniger.", "en": "Flour and water rest: gluten forms by itself so you knead less."}),
    (r"poolish|biga|vorteig|preferment", {"it": "Il prefermento matura a lungo: dà più profumo, struttura e digeribilità.", "de": "Der Vorteig reift lange: mehr Aroma, Struktur und Bekömmlichkeit.", "en": "The preferment matures slowly: more aroma, structure and digestibility."}),
    (r"lievito madre|sauerteig|sourdough|rinfresc|auffrisch|refresh", {"it": "Il lievito deve essere al picco: è allora che ha più forza.", "de": "Der Sauerteig muss auf dem Höhepunkt sein: Dann hat er die meiste Kraft.", "en": "The starter must be at its peak: that's when it is strongest."}),
    (r"piegh|falten|folds?\b", {"it": "Le pieghe rinforzano la maglia del glutine senza impastare di più.", "de": "Das Falten stärkt das Glutennetz, ohne mehr zu kneten.", "en": "Folds strengthen the gluten network without more kneading."}),
    (r"laminazione|tourier|lamination", {"it": "Il burro e l'impasto devono avere la stessa consistenza, altrimenti il burro si rompe o esce.", "de": "Butter und Teig müssen gleich fest sein, sonst bricht die Butter oder tritt aus.", "en": "Butter and dough must have the same firmness, otherwise the butter breaks or leaks."}),
    (r"appretto|stückgare|final proof|stuckgare", {"it": "La seconda lievitazione dà leggerezza: non stringere i tempi, guarda l'impasto.", "de": "Die zweite Gare macht leicht: nicht verkürzen, sondern den Teig beobachten.", "en": "The final proof makes it light: don't rush, watch the dough."}),
    (r"vapore|steam|dampf", {"it": "Il vapore tiene morbida la crosta all'inizio, così il pane si gonfia bene.", "de": "Dampf hält die Kruste anfangs weich, damit das Brot gut aufgeht.", "en": "Steam keeps the crust soft at first so the bread can spring."}),
    (r"frigo|kühlschrank|fridge|refrigerat", {"it": "Il freddo rallenta il lievito e fa maturare l'impasto: più aroma, orari più comodi.", "de": "Kälte bremst die Hefe und lässt den Teig reifen: mehr Aroma, bequemere Zeiten.", "en": "Cold slows the yeast and matures the dough: more flavour, easier timing."}),
    (r"cuoci|cottura|backen|bake|baking", {"it": "Forno ben caldo prima di infornare: la spinta iniziale fa la differenza.", "de": "Den Ofen vorher gut aufheizen: Der Anfangstrieb macht den Unterschied.", "en": "Preheat the oven well: the initial oven spring makes the difference."}),
    (r"impasta|incord|knead|kneten|mix", {"it": "L'impasto è pronto quando è liscio ed elastico e si stacca dalle pareti.", "de": "Der Teig ist fertig, wenn er glatt und elastisch ist und sich vom Rand löst.", "en": "The dough is ready when smooth, elastic and pulling away from the sides."}),
]

_TECH = [
    (r"piegh|falten|folds?\b", "pieghe"), (r"laminazione|tourier|lamination", "croissant"),
    (r"pirla|rundwirk|shape .*round|palla", "pirlatura"), (r"baguette", "baguette"),
    (r"capovolg|kopfüber|upside down", "panettone"), (r"incidi|einschneid|score", "filone"),
]

_FRY = re.compile(r"frigg|fritt|fry", re.I)
_SAFETY = {
    "it": "Attenzione: olio molto caldo. Pentola alta, mai più di metà piena, mai acqua nell'olio, non lasciarla mai incustodita.",
    "de": "Achtung: sehr heißes Öl. Hoher Topf, höchstens halb voll, nie Wasser ins Öl, nie unbeaufsichtigt lassen.",
    "en": "Careful: very hot oil. Tall pot, never more than half full, never water in the oil, never leave it unattended.",
}

_TROUBLE = {
 "default": {
  "it": [("L'impasto è troppo appiccicoso", "Troppa acqua per quella farina o poco riposo", "Bagna le mani, usa le pieghe invece di aggiungere farina, lascia riposare 15 minuti"),
         ("Il pane è denso e poco alveolato", "Lievitazione troppo corta o impasto poco forte", "Allunga la lievitazione guardando il volume, non i minuti; aggiungi un giro di pieghe"),
         ("La crosta è chiara e molle", "Forno poco caldo o niente vapore", "Preriscalda 45 minuti, metti una teglia d'acqua bollente sul fondo, cuoci qualche minuto in più")],
  "de": [("Der Teig ist zu klebrig", "Zu viel Wasser für dieses Mehl oder zu wenig Ruhe", "Hände nass machen, lieber falten als Mehl zugeben, 15 Minuten ruhen lassen"),
         ("Das Brot ist dicht, wenig Porung", "Gare zu kurz oder Teig zu schwach", "Gare verlängern, auf das Volumen achten statt auf die Minuten; eine Runde Falten mehr"),
         ("Die Kruste ist hell und weich", "Ofen zu kühl oder kein Dampf", "45 Minuten vorheizen, ein Blech mit kochendem Wasser unten, einige Minuten länger backen")],
  "en": [("The dough is too sticky", "Too much water for that flour or too little rest", "Wet your hands, use folds instead of adding flour, rest 15 minutes"),
         ("The bread is dense with little crumb", "Proof too short or dough too weak", "Extend the proof watching volume, not minutes; add a round of folds"),
         ("The crust is pale and soft", "Oven not hot enough or no steam", "Preheat 45 minutes, put a tray of boiling water on the bottom, bake a few minutes longer")],
 },
 "sfoglia": {
  "it": [("Il burro esce dalla sfoglia", "Temperatura troppo alta o burro troppo duro/molle", "Riporta in frigo 30 minuti; burro e impasto alla stessa consistenza; appretto sotto i 27 °C"),
         ("Gli strati non si vedono", "Burro sciolto durante la laminazione o poca lievitazione", "Lavora al fresco, stendi senza schiacciare, non accorciare l'appretto"),
         ("Il fondo è unto", "Il burro si è sciolto in forno", "Congela 10 minuti prima di infornare e preriscalda bene")],
  "de": [("Die Butter tritt aus dem Teig", "Temperatur zu hoch oder Butter zu hart/weich", "30 Minuten kühlen; Butter und Teig gleich fest; Stückgare unter 27 °C"),
         ("Die Schichten sind nicht sichtbar", "Butter beim Tourieren geschmolzen oder zu wenig Gare", "Kühl arbeiten, ohne zu quetschen ausrollen, die Gare nicht verkürzen"),
         ("Der Boden ist fettig", "Die Butter ist im Ofen geschmolzen", "10 Minuten einfrieren vor dem Backen und gut vorheizen")],
  "en": [("Butter leaks from the dough", "Temperature too high or butter too hard/soft", "Chill 30 minutes; butter and dough the same firmness; proof below 27 °C"),
         ("Layers are not visible", "Butter melted during lamination or under-proofed", "Work cool, roll without squashing, don't shorten the proof"),
         ("The base is greasy", "The butter melted in the oven", "Freeze 10 minutes before baking and preheat well")],
 },
 "pizza": {
  "it": [("Il cornicione resta piatto", "Impasto stanco o stesura con il mattarello", "Stendi a mano lasciando il bordo intatto; non allungare troppo la maturazione"),
         ("L'impasto si strappa mentre lo stendi", "Impasto ancora freddo o troppo compatto", "Lascia il panetto fuori dal frigo 1-2 ore e riposa 10 minuti"),
         ("Il centro resta molle", "Troppo condimento umido o forno poco caldo", "Sgocciola bene mozzarella e pomodoro; preriscalda pietra o acciaio 45-60 minuti")],
  "de": [("Der Rand bleibt flach", "Teig überreif oder mit dem Nudelholz ausgerollt", "Von Hand ausziehen, den Rand unberührt lassen; die Reifung nicht zu lang machen"),
         ("Der Teig reißt beim Ausziehen", "Teig noch kalt oder zu fest", "Teigling 1-2 Stunden aus dem Kühlschrank nehmen und 10 Minuten ruhen lassen"),
         ("Die Mitte bleibt weich", "Zu viel feuchter Belag oder Ofen zu kühl", "Mozzarella und Tomate gut abtropfen; Stein oder Stahl 45-60 Minuten vorheizen")],
  "en": [("The rim stays flat", "Exhausted dough or rolled with a pin", "Stretch by hand leaving the rim untouched; don't over-mature"),
         ("The dough tears when stretching", "Dough still cold or too tight", "Take the ball out of the fridge 1-2 hours ahead and rest 10 minutes"),
         ("The centre stays soft", "Too much wet topping or oven not hot enough", "Drain mozzarella and tomato well; preheat stone or steel 45-60 minutes")],
 },
 "pasticceria": {
  "it": [("Il dolce si sgonfia", "Forno aperto troppo presto o composto smontato", "Non aprire il forno nei primi 20 minuti e incorpora la farina con delicatezza"),
         ("La crema è grumosa", "Uova cotte troppo in fretta", "Versa il latte a filo sui tuorli mescolando, cuoci sempre mescolando con la frusta"),
         ("La frolla è dura", "Troppo impastata o burro troppo caldo", "Lavora il minimo, usa burro freddo e riposa in frigo")],
  "de": [("Das Gebäck fällt zusammen", "Ofen zu früh geöffnet oder Masse zerdrückt", "Die ersten 20 Minuten nicht öffnen und das Mehl sanft unterheben"),
         ("Die Creme ist klumpig", "Eier zu schnell gegart", "Milch in dünnem Strahl über das Eigelb gießen, immer mit dem Schneebesen rühren"),
         ("Der Mürbeteig ist hart", "Zu lange geknetet oder Butter zu warm", "So wenig wie möglich kneten, kalte Butter, im Kühlschrank ruhen")],
  "en": [("The cake deflates", "Oven opened too soon or foam crushed", "Don't open the oven in the first 20 minutes and fold in the flour gently"),
         ("The cream is lumpy", "Eggs cooked too fast", "Pour the milk over the yolks in a thin stream, always whisk while cooking"),
         ("The shortcrust is hard", "Overworked or butter too warm", "Handle as little as possible, cold butter, rest in the fridge")],
 },
}
_STORAGE = {
 "it": "Conserva in un sacchetto di carta o di stoffa a temperatura ambiente per 1-2 giorni; per più tempo congela a fette o a pezzi.",
 "de": "In einer Papier- oder Stofftüte bei Raumtemperatur 1-2 Tage aufbewahren; für länger in Scheiben oder Stücken einfrieren.",
 "en": "Keep in a paper or cloth bag at room temperature for 1-2 days; for longer freeze in slices or pieces.",
}
_INTRO = {
 "it": "Ecco il percorso passo-passo. Segui i tempi, ma guarda sempre i segnali: l'impasto ti dice quando è pronto.",
 "de": "Hier der Weg Schritt für Schritt. Halte dich an die Zeiten, aber achte immer auf die Zeichen: Der Teig sagt dir, wann er fertig ist.",
 "en": "Here is the step-by-step path. Follow the times, but always watch the signs: the dough tells you when it's ready.",
}


def _group(recipe: dict) -> str:
    blob = " ".join(str(recipe.get(k) or "") for k in ("name", "menu_category", "procedure", "dough_category")).lower()
    if recipe.get("menu_category") == "pasticceria" or "crema pasticcera" in blob[:60]:
        return "pasticceria"
    if recipe.get("menu_category") == "pizza" or "pizza" in blob[:80]:
        return "pizza"
    if any(k in blob for k in ("laminazione", "tourage", "croissant", "sfoglia", "plunder", "cornetto")):
        return "sfoglia"
    return "default"


def _localized(recipe: dict, field: str, lang: str) -> str:
    if lang in ("de", "en"):
        v = recipe.get(f"{field}_{lang}")
        if v and str(v).strip():
            return v
    return recipe.get(field) or ""


def proc_hash(recipe: dict, lang: str) -> str:
    return hashlib.sha1(f"{lang}|{_localized(recipe, 'procedure', lang)}".encode("utf-8")).hexdigest()[:12]


def build_course(recipe: dict, lang: str = "it"):
    """Corso nel formato di course-v2 costruito dal procedimento. None se il procedimento non ha passi."""
    lang = lang if lang in ("it", "de", "en") else "it"
    steps = parse_steps(_localized(recipe, "procedure", lang))
    if not steps:
        return None
    phases = []
    for s in steps[:12]:
        label, body = split_label(s)
        lo, hi = parse_duration(body)
        sig = _SIGNAL_RE.search(body)
        why = ""
        low = body.lower()
        for rx, txt in _WHY:
            if re.search(rx, low):
                why = txt[lang]
                break
        tech = ""
        for rx, slug in _TECH:
            if re.search(rx, low):
                tech = slug
                break
        phases.append({
            "name": (label or _short_name(body))[:120],
            "do_casa": body[:900],
            "do_esperto": "",
            "why": why[:500],
            "signals": (sig.group(1).strip() if sig else "")[:500],
            "time_min": lo, "time_max": hi,
            "timer_min": lo if lo >= 3 else 0,
            "safety": _SAFETY[lang] if _FRY.search(body) else "",
            "technique": tech,
        })
    notes = _localized(recipe, "notes", lang)
    storage = ""
    m = re.search(r"((?:Si conserva|Conserva|Hält sich|Halten sich|Hält|Keeps|Keep|Kept)[^.]*\.)", notes)
    if m:
        storage = m.group(1).strip()
    grp = _group(recipe)
    trouble = [{"problem": a, "cause": b, "fix": c} for a, b, c in _TROUBLE[grp][lang]]
    return {
        "title": (_localized(recipe, "name", lang) or recipe.get("name") or "")[:160],
        "intro": _INTRO[lang],
        "phases": phases,
        "troubleshooting": trouble,
        "storage": (storage or _STORAGE[lang])[:500],
    }
