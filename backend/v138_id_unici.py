# -*- coding: utf-8 -*-
"""MikiLab V138 — OGNI SCHEDA DEL RICETTARIO HA UN ID SOLO SUO.

Cosa era successo (visto sul sito pubblicato l'8 ottobre 2026): il ricettario si allinea al file delle ricette
per NOME, e una scheda nuova prendeva l'id scritto nel file anche quando sul sito quell'id era già di un'altra
scheda. Così sul sito pubblicato c'erano schede diverse con lo stesso id:
  - 11 panettoni: la scheda vecchia nascosta («Panettone Mikilab — …») e quella nuova («Panettone Artigianale
    MikiLab — …») avevano lo stesso id. Chi chiedeva la ricetta per id (il corso «Cucina con Sitor», gli extra,
    Sitor in chat) riceveva la scheda vecchia nascosta: corso che non si apriva (errore 503) o corso vecchio.
  - «Cornetto Sfogliato» e «Croissant Sfogliati Classici Senza Zucchero nell'Impasto»: stesso id, tutte e due visibili.

Cosa fa `sistema`: per ogni id usato da più schede, l'id resta alla scheda VISIBILE (se sono visibili in due: a
quella che non ha un nome ritirato, e a parità alla più vecchia, cioè quella che il server già restituiva per
quell'id) e le altre ricevono un id nuovo. Non cambia nomi, testi, dosi,
foto, stati: cambia solo il campo `id` delle schede di troppo. Si può eseguire più volte: la seconda non trova
più niente da fare. Nessuna dipendenza dal server: si prova da sola.
"""
import uuid

_SPAZIO = uuid.NAMESPACE_URL


def id_per_nome(nome: str) -> str:
    """Id stabile ricavato dal nome della ricetta: lo stesso nome dà sempre lo stesso id."""
    return str(uuid.uuid5(_SPAZIO, "https://mikilab.de/ricetta/" + (nome or "")))


def _id_scheda_nascosta(vecchio_id: str, nome: str, n: int) -> str:
    return str(uuid.uuid5(_SPAZIO, "https://mikilab.de/scheda-nascosta/%s/%s/%d" % (vecchio_id, nome or "", n)))


async def id_libero(db, proposto):
    """Per una scheda NUOVA: l'id proposto va bene solo se nessun'altra scheda lo usa già; altrimenti uno nuovo."""
    if proposto and not await db.recipes.find_one({"id": proposto}, {"_id": 1}):
        return proposto
    return str(uuid.uuid4())


async def sistema(db, ritirati=()):
    """Rende unico l'id delle schede MikiLab. Ritorna l'elenco dei cambi fatti (vuoto se era già tutto a posto).
    `ritirati`: i nomi delle vecchie schede ritirate (SEED_RETIRED_NAMES): non tengono mai l'id se c'è un'altra scheda."""
    ritirati = set(ritirati or ())
    quante = {}
    async for d in db.recipes.find({"collection_name": "mikilab"}, {"_id": 1, "id": 1}):
        rid = d.get("id")
        if rid:
            quante[rid] = quante.get(rid, 0) + 1
    cambi = []
    for rid in [k for k, n in quante.items() if n > 1]:
        tutte = []
        async for d in db.recipes.find({"collection_name": "mikilab", "id": rid}, {"_id": 1, "name": 1, "hidden": 1}):
            tutte.append(d)
        if len(tutte) < 2:
            continue
        # l'id resta alla scheda visibile (meglio se non ha un nome ritirato); se non ce n'è nessuna, alla prima
        visibili = [d for d in tutte if not d.get("hidden")]
        buone = [d for d in visibili if (d.get("name") or "") not in ritirati]
        tieni = (buone or visibili or tutte)[0]
        altre = [d for d in tutte if d["_id"] != tieni["_id"]]
        for n, d in enumerate(altre, start=1):
            nascosta = bool(d.get("hidden"))
            nuovo = _id_scheda_nascosta(rid, d.get("name"), n) if nascosta else id_per_nome(d.get("name"))
            if await db.recipes.find_one({"id": nuovo}, {"_id": 1}):
                nuovo = str(uuid.uuid4())
            await db.recipes.update_one({"_id": d["_id"]}, {"$set": {"id": nuovo}})
            cambi.append({"scheda": d.get("name") or "", "nascosta": nascosta, "id_prima": rid, "id_nuovo": nuovo, "id_resta_a": tieni.get("name") or ""})
    return cambi
