# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import os, json, asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

MARK = "PERCHÉ L'ACQUA"
NOTES = {
 "": ("\n\n— NOTE DEL FORNAIO —\nPERCHÉ L'ACQUA SOLO NEL 1° IMPASTO: nel panettone l'acqua si mette esclusivamente nel primo impasto, per idratare la farina e avviare la maglia glutinica insieme al lievito madre. Nel secondo impasto NON si aggiunge acqua: i liquidi arrivano da tuorli, burro e miele, che arricchiscono l'impasto senza indebolirlo. Aggiungere acqua nel secondo impasto scioglierebbe la maglia già formata e il panettone non reggerebbe la lievitazione né la cupola.\nTEMPERATURA: tieni l'impasto sempre sotto i 26°C (il burro non deve scaldarsi troppo) e incorda bene tra un ingrediente e l'altro prima di aggiungere il successivo."),
 "_de": ("\n\n— HINWEIS DES BÄCKERS —\nWARUM WASSER NUR IM 1. TEIG: Beim Panettone kommt Wasser ausschließlich in den ersten Teig, um das Mehl zu hydratisieren und zusammen mit dem Sauerteig das Glutennetz aufzubauen. Im zweiten Teig wird KEIN Wasser zugegeben: die Flüssigkeit stammt aus Eigelb, Butter und Honig, die den Teig anreichern, ohne ihn zu schwächen. Wasser im zweiten Teig würde das bereits gebildete Glutennetz auflösen, und der Panettone würde weder aufgehen noch die Kuppel halten.\nTEMPERATUR: Teig stets unter 26°C halten und zwischen den Zutaten gut auskneten."),
 "_en": ("\n\n— BAKER'S NOTE —\nWHY WATER ONLY IN THE 1ST DOUGH: In panettone, water goes only into the first dough, to hydrate the flour and build the gluten network together with the sourdough. In the second dough NO water is added: the liquids come from egg yolks, butter and honey, which enrich the dough without weakening it. Adding water to the second dough would dissolve the gluten network already formed, and the panettone would neither rise nor hold its dome.\nTEMPERATURE: keep the dough below 26°C at all times and develop the gluten well between each ingredient."),
 "_es": ("\n\n— NOTA DEL PANADERO —\nPOR QUÉ EL AGUA SOLO EN EL 1.er AMASADO: en el panettone el agua se añade únicamente en el primer amasado, para hidratar la harina y formar la red de gluten junto con la masa madre. En el segundo amasado NO se añade agua: los líquidos vienen de las yemas, la mantequilla y la miel, que enriquecen la masa sin debilitarla. Añadir agua en el segundo amasado disolvería la red de gluten ya formada y el panettone no subiría ni mantendría la cúpula.\nTEMPERATURA: mantén la masa siempre por debajo de 26°C y desarrolla bien el gluten entre cada ingrediente."),
 "_fr": ("\n\n— NOTE DU BOULANGER —\nPOURQUOI L'EAU UNIQUEMENT DANS LA 1re PÂTE : dans le panettone, l'eau ne s'ajoute que dans la première pâte, pour hydrater la farine et former le réseau de gluten avec le levain. Dans la deuxième pâte, on N'AJOUTE PAS d'eau : les liquides proviennent des jaunes, du beurre et du miel, qui enrichissent la pâte sans l'affaiblir. Ajouter de l'eau dans la deuxième pâte dissoudrait le réseau de gluten déjà formé et le panettone ne lèverait pas et ne tiendrait pas son dôme.\nTEMPÉRATURE : gardez la pâte toujours sous 26°C et développez bien le gluten entre chaque ingrédient."),
 "_fa": ("\n\n— یادداشت نانوا —\nچرا آب فقط در خمیر اول: در پانتونه آب فقط به خمیر اول اضافه می‌شود تا آرد را هیدراته کند و همراه با خمیرمایه شبکهٔ گلوتن را بسازد. در خمیر دوم آب اضافه نمی‌شود: مایعات از زردهٔ تخم‌مرغ، کره و عسل تأمین می‌شوند که خمیر را غنی می‌کنند بدون اینکه ضعیفش کنند. افزودن آب به خمیر دوم شبکهٔ گلوتن ساخته‌شده را از بین می‌برد و پانتونه ور نمی‌آید و گنبدش را نگه نمی‌دارد.\nدما: خمیر را همیشه زیر ۲۶ درجه نگه دار و بین هر ماده گلوتن را خوب توسعه بده."),
}
FIELDS = {"": "procedure", "_de": "procedure_de", "_en": "procedure_en", "_es": "procedure_es", "_fr": "procedure_fr", "_fa": "procedure_fa"}

def is_panettone(r):
    return 'panetton' in (str(r.get('name',''))+str(r.get('real_name',''))).lower()

def patch_doc(doc):
    changed = False
    for suf, field in FIELDS.items():
        val = doc.get(field)
        if isinstance(val, str) and val.strip() and MARK not in val and "BÄCKERS" not in val and "BAKER'S" not in val and "PANADERO" not in val and "BOULANGER" not in val and "نانوا" not in val:
            doc[field] = val + NOTES[suf]
            changed = True
    return changed

async def main():
    c = AsyncIOMotorClient(os.environ['MONGO_URL']); db = c[os.environ['DB_NAME']]
    n = 0
    async for doc in db.recipes.find({}):
        if is_panettone(doc) and patch_doc(doc):
            upd = {f: doc[f] for f in FIELDS.values() if f in doc}
            await db.recipes.update_one({'_id': doc['_id']}, {'$set': upd})
            n += 1
    print('DB panettoni aggiornati:', n)
    c.close()
    # seed file
    d = json.load(open('mikilab_seed_data.json'))
    m = 0
    for r in d:
        if is_panettone(r) and patch_doc(r):
            m += 1
    json.dump(d, open('mikilab_seed_data.json','w'), ensure_ascii=False, indent=2)
    print('Seed panettoni aggiornati:', m)

asyncio.run(main())
