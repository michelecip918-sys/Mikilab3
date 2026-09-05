# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Seed/aggiorna 6 ricette Mickey Lab (Viennoiserie + Pane di Cristallo) con traduzioni 4 lingue."""
import asyncio
import uuid
from server import db, _translate_recipe_lang, now_iso


def R(**kw):
    base = dict(collection_name="mikilab", flour_type="", hydration_percent=None,
                flour_grams=None, water_grams=None, sourdough_grams=None, salt_grams=None,
                preferment_type=None, bake_temp=None, bake_minutes=None, method_type="indiretto",
                extra_ingredients=[], work_phases=[], image_url=None, notes="", procedure="")
    base.update(kw)
    return base


RECIPES = [
    # 1) RINOMINA "Cornetto Sfogliato" -> Croissant classico senza zucchero
    R(
        _rename_from="Cornetto Sfogliato",
        name="Croissant Sfogliati Classici Senza Zucchero nell'Impasto",
        menu_category="viennoiserie",
        flour_type="Farina forte W330-350, 12-13% proteine",
        hydration_percent=50, flour_grams=1000, water_grams=250, salt_grams=20,
        preferment_type="lievito di birra", bake_temp=195, bake_minutes=16, method_type="diretto",
        extra_ingredients=[
            {"name": "Latte intero", "percent": 25},
            {"name": "Burro bavarese 82% per il panetto (tour)", "percent": 50},
            {"name": "Burro morbido nell'impasto", "percent": 5},
            {"name": "Lievito di birra fresco", "percent": 4},
            {"name": "Malto diastasico", "percent": 1},
        ],
        notes=("Il croissant francese autentico: NIENTE zucchero nell'impasto (détrempe). "
               "Tutta la dolcezza arriva dalla fermentazione e dalla caramellizzazione del burro in cottura. "
               "Risultato: alveolatura a nido d'ape, sfogliatura netta e profumo di burro puro."),
        procedure=(
            "INTRODUZIONE MICKEY LAB\n"
            "Il croissant classico è una prova di tecnica: pochi ingredienti, temperatura sotto controllo e mani veloci. "
            "Senza zucchero nella détrempe la maglia glutinica resta forte e la sfoglia sale dritta.\n\n"
            "ATTREZZATURA\n"
            "Sfogliatrice o mattarello lungo, termometro a sonda, cella o frigo a 4°C, teglie microforate, spray acqua.\n\n"
            "PROCEDIMENTO PASSO-PASSO\n"
            "1) Détrempe: impasta farina, acqua e latte freddi, lievito, malto, sale e i 50 g di burro morbido. "
            "Ferma l'impasto INCORDATO ma non troppo caldo (max 22°C). Forma un rettangolo, copri e riposa in frigo 8-12 h.\n"
            "2) Panetto: lavora il burro (50%) tra due fogli fino a un rettangolo di 1 cm, tienilo a 12-14°C (plastico ma non molle).\n"
            "3) Incasso: stendi la détrempe, chiudi il burro a portafoglio.\n"
            "4) 1ª piega da 3 (semplice): stendi a 4-5 mm, piega in tre. Riposo in frigo 30-40 min.\n"
            "5) 2ª piega da 3: ripeti. Riposo 30-40 min.\n"
            "6) 3ª piega da 3: ripeti. Riposo finale 1 h (o tutta la notte).\n"
            "7) Laminazione finale a 3,5 mm. Taglia triangoli base 9-10 cm, altezza 26-28 cm.\n"
            "8) Fai una piccola incisione alla base e arrotola SENZA schiacciare, lasciando la punta sotto.\n"
            "9) Lievitazione (appretto) a 26-27°C (MAI oltre, o esce il burro) e 75% UR, 2-2,5 h fino a +70% volume.\n"
            "10) Doratura leggera con uovo o solo latte.\n\n"
            "COTTURA\n"
            "Forno statico/ventilato 195°C per 16-18 min. I primi minuti con leggero vapore, poi valvola aperta. "
            "Cerca il colore ambrato e la sfoglia che 'scricchiola'.\n\n"
            "CONSERVAZIONE\n"
            "Ottimi in giornata. Congela i pezzi crudi dopo la formatura: appretto diretto da surgelato la mattina."
        ),
    ),
    # 2) NUOVA - Croissant con zucchero
    R(
        name="Croissant Sfogliati Tradizionali con Zucchero",
        menu_category="viennoiserie",
        flour_type="Farina forte W330, 12,5% proteine",
        hydration_percent=48, flour_grams=1000, water_grams=200, salt_grams=18,
        preferment_type="lievito di birra", bake_temp=190, bake_minutes=17, method_type="diretto",
        extra_ingredients=[
            {"name": "Latte intero", "percent": 28},
            {"name": "Zucchero semolato", "percent": 10},
            {"name": "Burro 82% per il panetto (tour)", "percent": 50},
            {"name": "Burro morbido nell'impasto", "percent": 6},
            {"name": "Lievito di birra fresco", "percent": 4},
            {"name": "Uovo per la doratura", "percent": 5},
        ],
        notes=("Versione più golosa e dolce, tipica delle colazioni: lo zucchero (10%) dà morbidezza, "
               "colore intenso e una doratura brillante. Perfetto anche farcito."),
        procedure=(
            "INTRODUZIONE MICKEY LAB\n"
            "Lo zucchero rende l'impasto più tenero e la crosta più lucida e scura: bilancia la cottura a 190°C "
            "per non bruciare.\n\n"
            "ATTREZZATURA\n"
            "Sfogliatrice/mattarello, termometro, frigo 4°C, pennello, teglie microforate.\n\n"
            "PROCEDIMENTO PASSO-PASSO\n"
            "1) Détrempe: farina, latte e acqua freddi, zucchero, lievito, sale e burro morbido. Incorda a 23°C max.\n"
            "2) Rettangolo, frigo 8-12 h.\n"
            "3) Panetto burro 50% a 13°C.\n"
            "4) Incasso a portafoglio.\n"
            "5) Tre pieghe da 3 con riposi di 30-40 min in frigo tra una e l'altra.\n"
            "6) Laminazione finale a 3,5-4 mm, triangoli base 10 cm.\n"
            "7) Arrotola e disponi su teglia.\n"
            "8) Appretto 26°C, 75% UR, 2-2,5 h.\n"
            "9) Doratura con uovo intero + un pizzico di sale.\n\n"
            "COTTURA\n"
            "190°C per 17-19 min, vapore iniziale leggero. Colore ambrato scuro e lucido.\n\n"
            "CONSERVAZIONE\n"
            "In giornata; congela crudi dopo formatura o cotti da rinvenire 3 min a 160°C."
        ),
    ),
    # 3) NUOVA - Cornetti all'Italiana
    R(
        name="Cornetti all'Italiana: La Brioche Sfogliata Aromatica",
        menu_category="viennoiserie",
        flour_type="Farina W300-330, media forza",
        hydration_percent=40, flour_grams=1000, water_grams=100, salt_grams=18,
        preferment_type="lievito madre + lievito di birra", bake_temp=185, bake_minutes=18, method_type="indiretto",
        extra_ingredients=[
            {"name": "Uova intere", "percent": 15},
            {"name": "Tuorli", "percent": 5},
            {"name": "Zucchero semolato", "percent": 15},
            {"name": "Latte intero", "percent": 25},
            {"name": "Burro 82% per il panetto (tour)", "percent": 40},
            {"name": "Burro morbido nell'impasto", "percent": 8},
            {"name": "Lievito madre solido", "percent": 15},
            {"name": "Lievito di birra fresco", "percent": 2},
            {"name": "Vaniglia bourbon (bacca)", "percent": 1},
            {"name": "Scorza di arancia e limone", "percent": 2},
            {"name": "Miele d'acacia", "percent": 3},
        ],
        notes=("Il cornetto italiano NON è un croissant: impasto brioche ricco di uova, zucchero e aromi "
               "(vaniglia, agrumi, miele), sfogliatura più morbida e 'panosa'. Profumo inconfondibile di pasticceria."),
        procedure=(
            "INTRODUZIONE MICKEY LAB\n"
            "Qui l'impasto è una vera brioche aromatica, poi sfogliata con meno giri e meno burro del croissant: "
            "vogliamo morbidezza e profumo, non solo croccantezza.\n\n"
            "ATTREZZATURA\n"
            "Planetaria con gancio, sfogliatrice/mattarello, frigo 4°C, cella a 26-28°C.\n\n"
            "PROCEDIMENTO PASSO-PASSO\n"
            "1) Rinfresca il lievito madre e portalo maturo (3-4 h a 26°C).\n"
            "2) Impasto brioche: farina, latte, uova, tuorli, zucchero, miele, lievito madre e lievito di birra. "
            "Incorda, poi aggiungi burro morbido, aromi (vaniglia + scorze) e sale. Ferma a 24°C.\n"
            "3) Puntata 1 h a TA, poi frigo 12 h.\n"
            "4) Panetto burro 40% a 13-14°C; incasso a portafoglio.\n"
            "5) Due pieghe da 3 (più morbide del croissant) con riposi di 40 min in frigo.\n"
            "6) Laminazione a 4-4,5 mm; triangoli base 11 cm.\n"
            "7) Arrotola morbido, disponi a mezzaluna.\n"
            "8) Appretto lungo 3-4 h a 27°C, 75% UR (lievita di più del croissant).\n"
            "9) Doratura con tuorlo + panna.\n\n"
            "COTTURA\n"
            "185°C per 18-20 min. Interno filante e soffice, esterno dorato.\n\n"
            "CONSERVAZIONE\n"
            "24-36 h morbidi grazie a tuorli e miele. Ottimi farciti con crema o confettura dopo cottura."
        ),
    ),
    # 4) NUOVA - Stollen
    R(
        name="Stollen Tedesco Tradizionale delle Feste",
        menu_category="viennoiserie",
        flour_type="Farina W300, media-alta forza",
        hydration_percent=35, flour_grams=1000, water_grams=120, salt_grams=15,
        preferment_type="lievito madre + lievito di birra", bake_temp=170, bake_minutes=45, method_type="indiretto",
        extra_ingredients=[
            {"name": "Burro 82%", "percent": 40},
            {"name": "Zucchero", "percent": 12},
            {"name": "Uvetta (in ammollo nel rum)", "percent": 35},
            {"name": "Arancia e cedro canditi a cubetti", "percent": 15},
            {"name": "Mandorle tritate", "percent": 10},
            {"name": "Marzapane (inserto centrale)", "percent": 20},
            {"name": "Latte intero", "percent": 15},
            {"name": "Lievito madre solido", "percent": 15},
            {"name": "Lievito di birra fresco", "percent": 3},
            {"name": "Spezie: cardamomo, cannella, noce moscata, chiodi", "percent": 1},
            {"name": "Scorza di limone", "percent": 2},
            {"name": "Burro fuso + zucchero a velo per la finitura", "percent": 15},
        ],
        notes=("Il grande lievitato natalizio tedesco (Christstollen): burroso, speziato, ricchissimo di frutta. "
               "Rivisitato col mio metodo di fermentazione mista per renderlo più digeribile e conservabile."),
        procedure=(
            "INTRODUZIONE MICKEY LAB\n"
            "Lo Stollen vuole tempo e riposo: la fermentazione mista (madre + birra) dà spinta e profumo, "
            "le spezie e il rum maturano nei giorni successivi. Si prepara in anticipo.\n\n"
            "ATTREZZATURA\n"
            "Planetaria, contenitore per macerare la frutta, teglia, pennello, setaccio per lo zucchero a velo.\n\n"
            "PROCEDIMENTO PASSO-PASSO\n"
            "1) Il giorno prima: metti l'uvetta a bagno nel rum; scola prima dell'uso.\n"
            "2) Rinfresca il lievito madre.\n"
            "3) Impasto: farina, latte, zucchero, madre e lievito di birra, spezie e scorza. Incorda, poi aggiungi "
            "burro a pezzi e sale. Impasto sodo (poca acqua) a 24°C.\n"
            "4) Unisci a bassa velocità frutta secca, canditi e mandorle senza strappare la maglia.\n"
            "5) Puntata 2 h a TA, poi frigo 12 h.\n"
            "6) Forma il classico ovale ripiegato; inserisci al centro il filoncino di marzapane.\n"
            "7) Appretto 2-3 h a 26°C.\n\n"
            "COTTURA\n"
            "170°C per 45-55 min (copri con carta se colora troppo). Cuore a 92-94°C.\n\n"
            "FINITURA E CONSERVAZIONE\n"
            "Appena sfornato pennella abbondante burro fuso e tuffa nello zucchero (2 mani). Avvolgi e lascia "
            "maturare 3-7 giorni: si conserva anche settimane, migliorando di sapore."
        ),
    ),
    # 5) NUOVA - Danish / Plunder
    R(
        name="Danish Pastry e Plunder: La Sfoglia Lievitata Austriaca",
        menu_category="viennoiserie",
        flour_type="Farina forte W330",
        hydration_percent=42, flour_grams=1000, water_grams=150, salt_grams=18,
        preferment_type="lievito di birra", bake_temp=195, bake_minutes=16, method_type="diretto",
        extra_ingredients=[
            {"name": "Uova intere", "percent": 12},
            {"name": "Zucchero", "percent": 12},
            {"name": "Latte intero", "percent": 22},
            {"name": "Burro 82% per il panetto (tour)", "percent": 45},
            {"name": "Burro morbido nell'impasto", "percent": 6},
            {"name": "Lievito di birra fresco", "percent": 4},
            {"name": "Cardamomo macinato", "percent": 1},
            {"name": "Crema pasticcera / frutta / confettura per farcire", "percent": 30},
        ],
        notes=("La 'plunderteig' austro-danese: pasta lievitata sfogliata arricchita di uova e cardamomo, "
               "modellata in girelle, cuscini e trecce, farcita con crema, frutta o confettura."),
        procedure=(
            "INTRODUZIONE MICKEY LAB\n"
            "Il Plunder sta a metà tra croissant e brioche: più uova, tocco di cardamomo, tantissime forme. "
            "La chiave è la stessa dei grandi sfogliati: freddo e precisione.\n\n"
            "ATTREZZATURA\n"
            "Sfogliatrice/mattarello, sac à poche per la crema, rotella tagliapasta, frigo 4°C.\n\n"
            "PROCEDIMENTO PASSO-PASSO\n"
            "1) Détrempe: farina, latte, uova, zucchero, lievito, cardamomo, sale e burro morbido. Incorda a 23°C.\n"
            "2) Rettangolo, frigo 8-12 h.\n"
            "3) Panetto burro 45% a 13°C, incasso a portafoglio.\n"
            "4) Tre pieghe da 3 con riposi di 30-40 min in frigo.\n"
            "5) Laminazione a 3,5-4 mm.\n"
            "6) Forme: quadrati 10 cm per 'cuscini' e girandole; strisce per trecce; dischi per girelle.\n"
            "7) Farcisci con crema pasticcera al centro, aggiungi frutta o confettura.\n"
            "8) Appretto 2 h a 26°C, 75% UR.\n"
            "9) Doratura con uovo.\n\n"
            "COTTURA\n"
            "195°C per 16-18 min. Dopo cottura, lucida con gelatina di albicocca e finisci con glassa a filo.\n\n"
            "CONSERVAZIONE\n"
            "In giornata; le forme crude si congelano benissimo dopo la farcitura."
        ),
    ),
    # 6) NUOVA - Pane di Cristallo (categoria PANE)
    R(
        name="Pane di Cristallo ad Alta Idratazione col Metodo Mickey Lab",
        menu_category="pane",
        flour_type="Farina forte W300-320 (o taglio con Manitoba)",
        hydration_percent=85, flour_grams=1000, water_grams=850, salt_grams=22,
        preferment_type="biga", bake_temp=250, bake_minutes=22, method_type="indiretto",
        extra_ingredients=[
            {"name": "Olio extravergine d'oliva", "percent": 3},
            {"name": "Lievito di birra fresco", "percent": 1},
            {"name": "Malto diastasico", "percent": 0.5},
            {"name": "Acqua di bassinage (aggiunta finale)", "percent": 15},
        ],
        notes=("Il 'Pan di Cristal' catalano nel mio stile: 85%+ di idratazione, alveolatura estrema quasi vuota, "
               "crosta sottile e vetrosa che scricchiola, olio d'oliva per fragranza. Leggerissimo."),
        procedure=(
            "INTRODUZIONE MICKEY LAB\n"
            "Un pane 'aria e crosta': quasi tutta acqua, pochissimo lievito e tempi lunghi. Serve mano delicata "
            "e forni molto caldi. La biga dà forza e profumo, il bassinage porta l'idratazione all'estremo.\n\n"
            "ATTREZZATURA\n"
            "Planetaria o impastatrice a spirale, ciotole capienti, tarocco bagnato, teglia con carta, "
            "pietra refrattaria o teglia rovente, spruzzino/vapore.\n\n"
            "PROCEDIMENTO PASSO-PASSO\n"
            "1) Biga (12-16 h a 18°C): 500 g di farina, 220 g acqua, 1 g lievito. Grumosa, non impastata liscia.\n"
            "2) Impasto: unisci biga, farina restante, malto e circa il 60% dell'acqua. Avvia e incorda bene.\n"
            "3) Sale e lievito, poi BASSINAGE: aggiungi l'acqua restante a filo, poca alla volta, sempre reincordando.\n"
            "4) Per ultimo l'olio d'oliva a filo. Impasto lucido, elastico, molto morbido (28-30°C max).\n"
            "5) Puntata in massa 30 min, poi 3-4 giri di pieghe in ciotola (stretch & fold) ogni 30 min.\n"
            "6) Riposo in frigo 12-18 h (matura sapore e struttura).\n"
            "7) Rovescia SENZA sgonfiare su tanta semola, allarga delicato in rettangolo.\n"
            "8) Taglia strisce/quadrati con il tarocco senza schiacciare gli alveoli.\n"
            "9) Appretto breve 30-45 min a TA.\n\n"
            "COTTURA\n"
            "250°C con vapore abbondante i primi 8-10 min, poi 230°C valvola aperta per altri 10-12 min. "
            "Crosta ambrata e vetrosa, mollica lucida e vuota.\n\n"
            "CONSERVAZIONE\n"
            "Massima fragranza in giornata. Rinviene benissimo 3-4 min a 200°C; ottimo congelato a fette."
        ),
    ),
]


async def main():
    for r in RECIPES:
        rename_from = r.pop("_rename_from", None)
        existing = None
        if rename_from:
            existing = await db.recipes.find_one({"collection_name": "mikilab", "name": rename_from})
        if not existing:
            existing = await db.recipes.find_one({"collection_name": "mikilab", "name": r["name"]})

        # traduzioni de/en/es
        tr = {}
        for lg in ("de", "en", "es"):
            tr.update(await _translate_recipe_lang(r, lg))

        doc = dict(r)
        doc.update(tr)
        doc["updated_at"] = now_iso()

        if existing:
            await db.recipes.update_one({"id": existing["id"]}, {"$set": doc})
            print(f"UPDATED {existing.get('name')} -> {r['name']}")
        else:
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = now_iso()
            await db.recipes.insert_one(doc)
            print(f"CREATED {r['name']}")

    print("DONE.")


if __name__ == "__main__":
    asyncio.run(main())
