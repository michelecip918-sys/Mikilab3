# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Batch: genera i campi _es (name/flour_type/notes/procedure) per le ricette Mikilab."""
import asyncio
import logging
from server import db, _translate_recipe_lang

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("gen_es")


async def main():
    docs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
    todo = [d for d in docs if not d.get("name_es")]
    log.info(f"Ricette Mikilab totali: {len(docs)} · da tradurre in ES: {len(todo)}")
    done = 0
    for d in todo:
        tr = await _translate_recipe_lang(d, "es")
        if tr:
            await db.recipes.update_one({"id": d["id"]}, {"$set": tr})
            done += 1
            log.info(f"[{done}/{len(todo)}] {d.get('name')} -> ES OK ({list(tr.keys())})")
        else:
            log.warning(f"FALLITA: {d.get('name')}")
    log.info(f"COMPLETATO. Tradotte {done}/{len(todo)}.")


if __name__ == "__main__":
    asyncio.run(main())
