"""Seed ricette Viennoiserie + trend (Croissant senza zucchero, Cornetto, Danese, Brioche, Veneziana, Pane Hamburger, Pan di Kristall)."""
import os, uuid
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
now = datetime.now(timezone.utc).isoformat()

IMG = {
    "croissant": "https://images.unsplash.com/photo-1691480162735-9b91238080f6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "cornetto": "https://images.unsplash.com/photo-1623334044303-241021148842?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "danese": "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "brioche": "https://images.unsplash.com/photo-1552056413-b8b5eed0170b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "veneziana": "https://images.unsplash.com/photo-1620921568790-c1cf8984624c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "hamburger": "https://images.unsplash.com/photo-1632552544552-3ca612a328ac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "kristall": "https://images.unsplash.com/photo-1559811814-e2c57b5e69df?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
}

R = [
 {"key":"croissant","menu_category":"viennoiserie","flour_type":"Farina Manitoba W330 + 00 (mix)","hydration_percent":52,"preferment_type":"poolish","sourdough_grams":0,"salt_grams":18,"mix_minutes":12,"bulk_fermentation_hours":1.5,"rest_minutes":720,"proofing_hours":2.5,"bake_temp":190,"bake_minutes":18,
  "extra":["Burro da tourage 82% 500g/kg","Uova","Latte","Lievito di birra","Poolish"],
  "name":{"it":"Croissant Sfogliato (senza zucchero nell'impasto)","de":"Plunder-Croissant (ohne Zucker im Teig)","en":"Laminated Croissant (no sugar in the dough)","es":"Croissant Hojaldrado (sin azúcar en la masa)"},
  "notes":{"it":"⚠️ IMPORTANTE: questo Croissant sfogliato NON contiene zucchero nell'impasto (détrempe). La dolcezza arriva solo dalla finitura (glassa/zucchero a velo) e dagli abbinamenti. Impasto neutro = sfoglia più croccante e sapore di burro pulito.","de":"⚠️ WICHTIG: Dieser Plunder-Croissant enthält KEINEN Zucker im Teig (Détrempe). Süße nur aus der Finish-Glasur.","en":"⚠️ IMPORTANT: this laminated croissant contains NO sugar in the dough (détrempe). Sweetness only from the finish glaze.","es":"⚠️ IMPORTANTE: este croissant hojaldrado NO lleva azúcar en la masa (détrempe). El dulzor viene solo del glaseado final."},
  "proc":{"it":"1. Poolish la sera prima. 2. Impasto (détrempe) SENZA zucchero: farine, poolish, latte, uova, lievito, sale — incordare leggero. 3. Riposo in frigo 12h. 4. Tourage con 500g burro/kg: 3 pieghe a 3 (semplici) con riposo 30' in frigo tra una piega e l'altra. 5. Stendere a 3,5 mm, tagliare triangoli, arrotolare. 6. Appretto 26°C ~2,5h. 7. Spennellare uovo. 8. Cottura 190°C 18'.","de":"1. Poolish am Vorabend. 2. Détrempe OHNE Zucker. 3. 12h Kühlruhe. 4. Tourage 500g Butter/kg, 3x einfache Tour. 5. 3,5 mm ausrollen, Dreiecke, aufrollen. 6. Gare 26°C ~2,5h. 7. Ei. 8. 190°C 18'.","en":"1. Poolish the night before. 2. Détrempe with NO sugar. 3. 12h cold rest. 4. Lamination 500g butter/kg, 3 single folds. 5. Sheet to 3.5 mm, cut triangles, roll. 6. Proof 26°C ~2.5h. 7. Egg wash. 8. Bake 190°C 18'.","es":"1. Poolish la noche antes. 2. Détrempe SIN azúcar. 3. Reposo frío 12h. 4. Empaste 500g mantequilla/kg, 3 vueltas simples. 5. Estirar 3,5 mm, triángulos, enrollar. 6. Fermentar 26°C ~2,5h. 7. Huevo. 8. Hornear 190°C 18'."}},
 {"key":"cornetto","menu_category":"viennoiserie","flour_type":"Farina W330 + 00","hydration_percent":50,"preferment_type":"biga","sourdough_grams":0,"salt_grams":16,"mix_minutes":14,"bulk_fermentation_hours":2,"rest_minutes":720,"proofing_hours":3,"bake_temp":185,"bake_minutes":17,
  "extra":["Zucchero 120g/kg","Burro tourage 450g/kg","Uova","Miele","Vaniglia","Scorza d'arancia"],
  "name":{"it":"Cornetto Italiano (dolce)","de":"Italienisches Cornetto (süß)","en":"Italian Cornetto (sweet)","es":"Cornetto Italiano (dulce)"},
  "notes":{"it":"A differenza del croissant francese, il Cornetto italiano HA zucchero nell'impasto, miele e aromi (vaniglia, arancia): più morbido, dolce e profumato.","de":"Anders als der Croissant hat das Cornetto Zucker, Honig und Aromen im Teig.","en":"Unlike the French croissant, the Italian cornetto HAS sugar, honey and aromas in the dough.","es":"A diferencia del croissant, el cornetto lleva azúcar, miel y aromas en la masa."},
  "proc":{"it":"1. Biga 16h. 2. Impasto con zucchero, miele, uova, aromi. 3. Riposo frigo 12h. 4. Tourage 450g burro/kg, 3 pieghe. 5. Triangoli, arrotolare. 6. Appretto 3h a 26-28°C. 7. Uovo + zucchero in granella. 8. 185°C 17'.","de":"1. Biga 16h. 2. Teig mit Zucker, Honig, Ei, Aromen. 3. 12h Kühlruhe. 4. Tourage 450g/kg. 5. Dreiecke rollen. 6. Gare 3h. 7. Ei+Hagelzucker. 8. 185°C 17'.","en":"1. Biga 16h. 2. Dough with sugar, honey, egg, aromas. 3. 12h cold rest. 4. Lamination 450g/kg. 5. Triangles, roll. 6. Proof 3h. 7. Egg+pearl sugar. 8. 185°C 17'.","es":"1. Biga 16h. 2. Masa con azúcar, miel, huevo, aromas. 3. Reposo 12h. 4. Empaste 450g/kg. 5. Triángulos. 6. Fermentar 3h. 7. Huevo+azúcar perlado. 8. 185°C 17'."}},
 {"key":"danese","menu_category":"viennoiserie","flour_type":"Farina W300","hydration_percent":48,"preferment_type":"lievito di birra","sourdough_grams":0,"salt_grams":16,"mix_minutes":12,"bulk_fermentation_hours":1,"rest_minutes":600,"proofing_hours":2,"bake_temp":195,"bake_minutes":16,
  "extra":["Zucchero 100g/kg","Burro tourage 400g/kg","Uova","Crema pasticcera","Frutta/Confettura"],
  "name":{"it":"Danese alla Crema (Plunder)","de":"Plundergebäck mit Creme","en":"Danish Pastry with Cream","es":"Danés con Crema"},
  "notes":{"it":"Pasta sfogliata lievitata scandinava, farcita con crema pasticcera e frutta o confettura. Sfogliatura più leggera (400g burro/kg).","de":"Skandinavisches Plundergebäck mit Creme und Früchten.","en":"Scandinavian laminated pastry filled with cream and fruit.","es":"Bollería hojaldrada escandinava con crema y fruta."},
  "proc":{"it":"1. Impasto dolce con uova e zucchero. 2. Riposo frigo 10h. 3. Tourage 400g burro/kg, 3 pieghe. 4. Forme (mulinelli, quadrati). 5. Dressare crema e frutta. 6. Appretto 2h. 7. 195°C 16'. 8. Gelatina di albicocca a lucido.","de":"1. Süßer Teig. 2. 10h Kühlruhe. 3. Tourage 400g/kg. 4. Formen. 5. Creme+Obst. 6. Gare 2h. 7. 195°C 16'. 8. Aprikosengelee.","en":"1. Sweet dough. 2. 10h cold rest. 3. Lamination 400g/kg. 4. Shapes. 5. Cream+fruit. 6. Proof 2h. 7. 195°C 16'. 8. Apricot glaze.","es":"1. Masa dulce. 2. Reposo 10h. 3. Empaste 400g/kg. 4. Formas. 5. Crema+fruta. 6. Fermentar 2h. 7. 195°C 16'. 8. Gelatina de albaricoque."}},
 {"key":"brioche","menu_category":"viennoiserie","flour_type":"Farina W330","hydration_percent":18,"preferment_type":"lievito di birra","sourdough_grams":0,"salt_grams":18,"mix_minutes":20,"bulk_fermentation_hours":1,"rest_minutes":720,"proofing_hours":2.5,"bake_temp":170,"bake_minutes":22,
  "extra":["Burro 500g/kg","Uova 8/kg","Zucchero 120g/kg","Latte","Vaniglia"],
  "name":{"it":"Brioche Francese (col burro)","de":"Französische Brioche","en":"French Brioche","es":"Brioche Francés"},
  "notes":{"it":"Ricchissima di burro e uova. L'idratazione è bassa perché il liquido arriva da uova e burro. Impastare a bassa temperatura, aggiungere il burro alla fine.","de":"Sehr buttrig; Flüssigkeit aus Ei und Butter.","en":"Very rich in butter and eggs; hydration low as liquid comes from eggs/butter.","es":"Muy rica en mantequilla y huevos."},
  "proc":{"it":"1. Impasto: farina, uova, zucchero, latte, lievito — incordare. 2. Aggiungere burro morbido poco a poco. 3. Puntata 1h + frigo 12h. 4. Pezzatura (testa/mozzette o treccia). 5. Appretto 2,5h. 6. Uovo. 7. 170°C 22'.","de":"1. Teig kneten. 2. Butter einarbeiten. 3. 1h + 12h Kühlruhe. 4. Formen. 5. Gare 2,5h. 6. Ei. 7. 170°C 22'.","en":"1. Knead dough. 2. Add butter gradually. 3. 1h + 12h cold. 4. Shape. 5. Proof 2.5h. 6. Egg. 7. 170°C 22'.","es":"1. Amasar. 2. Añadir mantequilla. 3. 1h + 12h frío. 4. Formar. 5. Fermentar 2,5h. 6. Huevo. 7. 170°C 22'."}},
 {"key":"veneziana","menu_category":"viennoiserie","flour_type":"Farina W380 (grandi lievitati)","hydration_percent":55,"preferment_type":"lievito madre","sourdough_grams":300,"salt_grams":8,"mix_minutes":25,"bulk_fermentation_hours":12,"rest_minutes":0,"proofing_hours":6,"bake_temp":165,"bake_minutes":35,
  "extra":["Lievito madre solido","Burro 250g/kg","Tuorli","Zucchero 200g/kg","Vaniglia","Granella di zucchero","Miele"],
  "name":{"it":"Veneziana (grande lievitato dolce)","de":"Veneziana (großes süßes Hefegebäck)","en":"Veneziana (large sweet leavened cake)","es":"Veneziana (gran leudado dulce)"},
  "notes":{"it":"Grande lievitato a lievito madre, cugina del panettone ma senza canditi, coperta di granella di zucchero. Richiede madre in forza e doppio impasto.","de":"Großes Sauerteig-Hefegebäck, ohne Kandiertes, mit Hagelzucker.","en":"Large sourdough sweet bread, like panettone but without candied fruit, topped with pearl sugar.","es":"Gran leudado con masa madre, sin fruta confitada, con azúcar perlado."},
  "proc":{"it":"1. Primo impasto la sera (madre, farina, zucchero, tuorli, burro) — puntata 12h a 26°C fino a triplicare. 2. Secondo impasto con aromi e restante burro/zucchero. 3. Pezzatura in pirottino. 4. Appretto 6h. 5. Glassa e granella. 6. 165°C 35' (al cuore 94°C). 7. Capovolgere a raffreddare.","de":"1. Erster Teig abends, 12h Gare. 2. Zweiter Teig. 3. In Form. 4. Gare 6h. 5. Glasur+Hagelzucker. 6. 165°C 35' (Kern 94°C). 7. Kopfüber kühlen.","en":"1. First dough in the evening, 12h proof. 2. Second dough. 3. Into mould. 4. Proof 6h. 5. Glaze+pearl sugar. 6. 165°C 35' (core 94°C). 7. Cool upside-down.","es":"1. Primer amasado noche, 12h. 2. Segundo amasado. 3. Al molde. 4. Fermentar 6h. 5. Glasa+azúcar. 6. 165°C 35' (centro 94°C). 7. Enfriar boca abajo."}},
 {"key":"hamburger","menu_category":"panini","flour_type":"Farina W280","hydration_percent":62,"preferment_type":"lievito di birra","sourdough_grams":0,"salt_grams":18,"mix_minutes":12,"bulk_fermentation_hours":1,"rest_minutes":20,"proofing_hours":1.5,"bake_temp":200,"bake_minutes":14,
  "extra":["Latte","Burro 80g/kg","Zucchero 60g/kg","Uovo","Semi di sesamo"],
  "name":{"it":"Pane da Hamburger (bun soffice)","de":"Hamburger-Brötchen (weich)","en":"Hamburger Bun (soft)","es":"Pan de Hamburguesa (suave)"},
  "notes":{"it":"Bun morbido tipo brioche leggera: latte, burro e un po' di zucchero per la sofficità. Sezione «Panini».","de":"Weiches Brötchen mit Milch und Butter.","en":"Soft brioche-style bun with milk and butter.","es":"Pan suave estilo brioche con leche y mantequilla."},
  "proc":{"it":"1. Impasto con latte, burro, zucchero, uovo. 2. Puntata 1h. 3. Pezzatura 80-90g, pirlatura. 4. Appretto 1,5h. 5. Uovo + sesamo. 6. 200°C 14' con poco vapore iniziale.","de":"1. Teig mit Milch, Butter. 2. 1h. 3. 80-90g rundwirken. 4. Gare 1,5h. 5. Ei+Sesam. 6. 200°C 14'.","en":"1. Dough with milk, butter, sugar, egg. 2. 1h bulk. 3. 80-90g, round. 4. Proof 1.5h. 5. Egg+sesame. 6. 200°C 14' with a little steam.","es":"1. Masa con leche, mantequilla. 2. 1h. 3. 80-90g bolear. 4. Fermentar 1,5h. 5. Huevo+sésamo. 6. 200°C 14'."}},
 {"key":"kristall","menu_category":"pane","flour_type":"Farina forte W350 macinata a pietra","hydration_percent":95,"preferment_type":"poolish","sourdough_grams":0,"salt_grams":22,"mix_minutes":18,"bulk_fermentation_hours":4,"rest_minutes":0,"proofing_hours":1,"bake_temp":250,"bake_minutes":22,
  "extra":["Poolish","Olio EVO","Malto"],
  "name":{"it":"Pan di Kristall (alta idratazione 95%)","de":"Kristallbrot (95% Hydratation)","en":"Crystal Bread (95% hydration)","es":"Pan de Cristal (95% hidratación)"},
  "notes":{"it":"Pane di tendenza ad altissima idratazione (95%): alveolatura enorme e crosta vetrosa e sottile. Impasto molto molle, lavorato con pieghe in ciotola. Grande manualità richiesta.","de":"Trend-Brot mit sehr hoher Hydratation, riesige Poren, glasige Kruste.","en":"Trendy ultra-high-hydration bread: huge open crumb, glassy thin crust.","es":"Pan de moda de altísima hidratación: miga muy abierta y corteza cristalina."},
  "proc":{"it":"1. Poolish 12-16h. 2. Autolisi 1h. 3. Impasto ad alta idratazione, sale e olio a filo. 4. Puntata 4h con 3-4 pieghe in ciotola ogni 45'. 5. Ribaltare su semola, tagliare rettangoli senza sgonfiare. 6. Appretto breve 1h. 7. 250°C 22' con vapore. Crosta vetrosa.","de":"1. Poolish 12-16h. 2. Autolyse 1h. 3. Hochhydrierter Teig. 4. 4h mit 3-4 Faltungen. 5. Auf Hartweizen stürzen, Rechtecke. 6. Kurze Gare 1h. 7. 250°C 22' mit Dampf.","en":"1. Poolish 12-16h. 2. Autolyse 1h. 3. High-hydration dough, salt+oil last. 4. 4h bulk with 3-4 coil folds. 5. Turn onto semolina, cut rectangles gently. 6. Short 1h proof. 7. 250°C 22' with steam.","es":"1. Poolish 12-16h. 2. Autólisis 1h. 3. Masa muy hidratada. 4. 4h con 3-4 pliegues. 5. Volcar sobre sémola, rectángulos. 6. Fermentar 1h. 7. 250°C 22' con vapor."}},
]

count = 0
for r in R:
    nm = r["name"]["it"]
    doc = {
        "id": str(uuid.uuid4()), "collection_name": "mikilab", "name": nm,
        "name_de": r["name"]["de"], "name_en": r["name"]["en"], "name_es": r["name"]["es"],
        "flour_type": r["flour_type"], "hydration_percent": r["hydration_percent"],
        "preferment_type": r["preferment_type"], "sourdough_grams": r.get("sourdough_grams", 0),
        "salt_grams": r["salt_grams"], "mix_minutes": r["mix_minutes"],
        "bulk_fermentation_hours": r["bulk_fermentation_hours"], "rest_minutes": r.get("rest_minutes", 0),
        "proofing_hours": r["proofing_hours"], "bake_temp": r["bake_temp"], "bake_minutes": r["bake_minutes"],
        "menu_category": r["menu_category"],
        "extra_ingredients": [{"name": x} for x in r["extra"]],
        "notes": r["notes"]["it"], "notes_de": r["notes"]["de"], "notes_en": r["notes"]["en"], "notes_es": r["notes"]["es"],
        "procedure": r["proc"]["it"], "procedure_de": r["proc"]["de"], "procedure_en": r["proc"]["en"], "procedure_es": r["proc"]["es"],
        "image_url": IMG[r["key"]], "locked": False, "created_at": now, "updated_at": now,
    }
    res = db.recipes.update_one({"collection_name": "mikilab", "name": nm}, {"$set": doc}, upsert=True)
    count += 1
    print(("UPDATED " if res.matched_count else "INSERTED ") + nm)

print(f"\nDone: {count} ricette. Totale mikilab ora: {db.recipes.count_documents({'collection_name':'mikilab'})}")
