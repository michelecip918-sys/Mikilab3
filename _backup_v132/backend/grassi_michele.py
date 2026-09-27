# -*- coding: utf-8 -*-
"""MikiLab v125 — il metodo di Michele per pane, panini e baguette:
olio d'oliva 1%, aceto di mele 1% e Kokosfett 1% sul peso della farina.
Non si applica alle ricette col burro, ai Taralli e ai pani DOP/IGP (disciplinare).
Funzione pura e idempotente: usata sia sul seed sia sul database (una volta sola)."""
import re

CATS = ("pane", "panini")
ANCHE = {"Friselle Pugliesi"}  # pane biscottato: passa negli snack con la v125, ma segue il metodo del pane
ESCLUSE = {"Taralli Pugliesi", "Pane di Altamura DOP", "Pane di Matera IGP"}

OLIO = {"name": "Olio d'oliva (Öl)", "percent": 1, "name_de": "Olivenöl (Öl)", "name_en": "Olive oil (Öl)",
        "name_es": "Aceite de oliva (Öl)", "name_fr": "Huile d'olive (Öl)", "name_fa": "روغن زیتون (Öl)"}
ACETO = {"name": "Aceto di mele (Essig)", "percent": 1, "name_de": "Apfelessig (Essig)", "name_en": "Apple cider vinegar (Essig)",
         "name_es": "Vinagre de manzana (Essig)", "name_fr": "Vinaigre de cidre (Essig)", "name_fa": "سرکه سیب (Essig)"}
COCCO = {"name": "Kokosfett", "percent": 1, "name_de": "Kokosfett", "name_en": "Coconut fat",
         "name_es": "Grasa de coco", "name_fr": "Graisse de coco", "name_fa": "چربی نارگیل"}

NOTA = {
    "procedure": "KOKOSFETT, OLIO E ACETO (il mio metodo): aggiungi il Kokosfett quando l'impasto è a palla; per ultimi olio d'oliva, aceto di mele e sale.",
    "procedure_de": "KOKOSFETT, ÖL UND ESSIG (meine Methode): das Kokosfett zugeben, wenn der Teig eine Kugel bildet; zuletzt Olivenöl, Apfelessig und Salz einarbeiten.",
    "procedure_en": "COCONUT FAT, OIL AND VINEGAR (my method): add the coconut fat once the dough comes together into a ball; add the olive oil, apple cider vinegar and salt last.",
}
# Testi con i grammi dell'olio scritti nel procedimento (4% su 1 kg → 1%).
TESTI_OLIO = [("40 g di olio extravergine", "10 g di olio extravergine"),
              ("40 g Olivenöl", "10 g Olivenöl"), ("40 g olive oil", "10 g olive oil")]

_RX_OLIO = re.compile(r"olio|olive oil|olivenöl", re.I)
_RX_ACETO = re.compile(r"aceto|essig|vinegar", re.I)
_RX_COCCO = re.compile(r"kokos|cocco|coconut", re.I)
_RX_BURRO = re.compile(r"burro|butter", re.I)


def riguarda(r):
    if (r.get("menu_category") or "").lower() not in CATS and r.get("name") not in ANCHE:
        return False
    if r.get("name") in ESCLUSE:
        return False
    return not any(_RX_BURRO.search((e or {}).get("name") or "") for e in (r.get("extra_ingredients") or []))


def applica(r):
    """Ritorna il dict dei campi da aggiornare (vuoto se non cambia niente). Non modifica r."""
    if not riguarda(r):
        return {}
    ex = [dict(e) for e in (r.get("extra_ingredients") or [])]
    cambiato, olio_cambiato = False, False
    nomi = lambda rx: [e for e in ex if rx.search(e.get("name") or "")]
    olii = nomi(_RX_OLIO)
    if not olii:
        ex.append(dict(OLIO)); cambiato = True
    else:
        for e in olii:
            # l'olio delle ricette di Michele (quelle con «(Öl)») resta com'è; le altre passano all'1%
            if "(Öl)" not in (e.get("name") or "") and e.get("percent") != 1:
                e["percent"] = 1; cambiato = True; olio_cambiato = True
    if not nomi(_RX_ACETO):
        ex.append(dict(ACETO)); cambiato = True
    if not nomi(_RX_COCCO):
        ex.append(dict(COCCO)); cambiato = True
    upd = {}
    if cambiato:
        upd["extra_ingredients"] = ex
    for campo, nota in NOTA.items():
        testo = r.get(campo) or ""
        nuovo = testo
        if olio_cambiato:
            for a, b in TESTI_OLIO:
                nuovo = nuovo.replace(a, b)
        if testo and not _RX_COCCO.search(testo) and "(my method)" not in testo and "(il mio metodo)" not in testo and "(meine Methode)" not in testo:
            nuovo = nuovo.rstrip() + "\n\n" + nota
        if nuovo != testo:
            upd[campo] = nuovo
    return upd


# ---------------------------------------------------------------------------
# V125 — ordine nel ricettario
# ---------------------------------------------------------------------------
# Categoria sbagliata → giusta. Si sposta SOLO se la ricetta è ancora nella categoria vecchia
# (se Michele l'ha già spostata a mano dall'admin, resta dove l'ha messa lui).
SPOSTA = {
    "Taralli Pugliesi": ("panini", "snack"),
    "Friselle Pugliesi": ("panini", "snack"),
    "Cornetto Sfogliato": ("pane", "viennoiserie"),
    "Carezza Dolce": ("pane", "viennoiserie"),
    "Treccia del Sole": ("pane", "viennoiserie"),
}
# Doppioni quasi identici: si NASCONDONO (non si cancellano), resta la versione col nome completo.
DOPPIONI = ["Focaccia Patate e Rosmarino", "Focaccia Cipolla di Tropea"]
# Nome sbagliato «Mickey Lab» → «MikiLab».
VECCHIO_NOME = "Pane di Cristallo ad Alta Idratazione col Metodo Mickey Lab"
NUOVO_NOME = "Pane di Cristallo ad Alta Idratazione col Metodo MikiLab"
_RX_MICKEY = re.compile(r"Mickey[ -]?Lab", re.I)


def ordina(r):
    """Campi da aggiornare per categoria e nome (vuoto se niente da fare). Non modifica r."""
    upd = {}
    sp = SPOSTA.get(r.get("name"))
    if sp and (r.get("menu_category") or "").lower() == sp[0]:
        upd["menu_category"] = sp[1]
    for k, v in r.items():
        if (k == "name" or k.startswith("name_")) and isinstance(v, str) and _RX_MICKEY.search(v):
            upd[k] = _RX_MICKEY.sub("MikiLab", v)
    return upd
