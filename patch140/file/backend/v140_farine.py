"""MikiLab V140 — corregge la v139: nomi delle farine giusti (niente zucchero o glassa tra le farine, niente 50/50
inventati) e procedimenti originali per i tre pani con biga e la Pinsa (i tempi "solo lievito madre" non valgono
dove c'è la biga o il lievito di birra). Le correzioni sono in v140_correzioni.json (cercate per nome).
Usato una volta all'avvio (app_meta.v140_farine) e per allineare il seed. Foto, id e numeri non si toccano."""
import json as _json
from pathlib import Path as _Path

_C = _json.loads((_Path(__file__).parent / "v140_correzioni.json").read_text(encoding="utf-8"))
FARINE = _C["farine"]                 # nome -> [it, de, en]
PROC = _C["procedure_originali"]      # nome -> {procedure, procedure_de, ...}
_L = {"procedure": "it", "procedure_de": "de", "procedure_en": "en", "procedure_es": "es", "procedure_fr": "fr", "procedure_fa": "fa"}


def _senza_malto(testo, campo):
    try:
        import v139_ricette as _v139
        return _v139.togli_malto(testo, _L[campo])
    except Exception:
        return testo


def correggi(r):
    upd = {}
    nome = r.get("name")
    f = FARINE.get(nome)
    if f:
        for k, v in zip(("flour_type", "flour_type_de", "flour_type_en"), f):
            if v and r.get(k) != v:
                upd[k] = v
    p = PROC.get(nome)
    if p:
        for campo, testo in p.items():
            nv = _senza_malto(testo, campo)
            if r.get(campo) != nv:
                upd[campo] = nv
    return upd


async def applica_db(db, now):
    cambiate, trovati = [], set()
    async for r in db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}):
        if r.get("name") in FARINE or r.get("name") in PROC:
            trovati.add(r["name"])
        upd = correggi(r)
        if upd:
            upd["updated_at"] = now
            await db.recipes.update_one({"collection_name": "mikilab", "id": r["id"], "name": r["name"]}, {"$set": upd})
            if any(k.startswith("procedure") for k in upd):
                await db.recipe_courses_v2.delete_many({"recipe_id": r["id"]})
            cambiate.append(r["name"])
    return cambiate, sorted((set(FARINE) | set(PROC)) - trovati)


def applica_seed(items):
    n = 0
    for r in items:
        upd = correggi(r)
        if upd:
            r.update(upd)
            n += 1
    return n
