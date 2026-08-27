import os, uuid
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
now = datetime.now(timezone.utc).isoformat()

# 1) Rimuovi i doppioni concettuali creati dal mio seed precedente (esistono già le versioni curate).
for dup in ["Croissant Sfogliato (senza zucchero nell'impasto)", "Cornetto Italiano (dolce)"]:
    r = db.recipes.delete_one({"collection_name": "mikilab", "name": dup})
    print(("RIMOSSO " if r.deleted_count else "assente ") + dup)

IMG = {
 "pain": "https://images.unsplash.com/photo-1613929231151-d7571591259e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
 "saccottino": "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
 "girella": "https://images.unsplash.com/photo-1614205569927-1f104e088eee?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
}
R = [
 {"key":"pain","name":{"it":"Pain au Chocolat (Saccottino al Cioccolato)","de":"Pain au Chocolat (Schoko-Plunder)","en":"Pain au Chocolat","es":"Pain au Chocolat (Napolitana de chocolate)"},
  "flour_type":"Farina W330 + 00","hydration_percent":52,"preferment_type":"poolish","salt_grams":18,"mix_minutes":12,"bulk":1.5,"rest":720,"proof":2.5,"temp":190,"min":18,
  "extra":["Burro tourage 500g/kg","Barrette di cioccolato fondente 55%","Uova","Latte"],
  "notes":{"it":"Rettangolo di pasta croissant (impasto neutro, poco/niente zucchero) con due barrette di cioccolato fondente arrotolate all'interno.","de":"Croissant-Teig mit zwei Schokostangen eingerollt.","en":"Croissant dough rectangle rolled around two dark chocolate batons.","es":"Masa de croissant enrollada con dos barritas de chocolate."},
  "proc":{"it":"1. Stessa pasta del croissant (senza/poco zucchero), 3 pieghe. 2. Stendere a 3,5 mm, tagliare rettangoli 8×13 cm. 3. Posare 2 barrette e arrotolare. 4. Appretto 2,5h a 26°C. 5. Uovo. 6. 190°C 18'.","de":"1. Croissant-Teig, 3 Touren. 2. 3,5 mm, Rechtecke. 3. 2 Stangen einrollen. 4. Gare 2,5h. 5. Ei. 6. 190°C 18'.","en":"1. Croissant dough, 3 folds. 2. Sheet 3.5 mm, rectangles. 3. Roll around 2 batons. 4. Proof 2.5h. 5. Egg. 6. 190°C 18'.","es":"1. Masa croissant, 3 vueltas. 2. 3,5 mm, rectángulos. 3. Enrollar 2 barritas. 4. Fermentar 2,5h. 5. Huevo. 6. 190°C 18'."}},
 {"key":"saccottino","name":{"it":"Saccottino alla Crema","de":"Sacktäschchen mit Creme","en":"Cream-filled Saccottino","es":"Saquito de Crema"},
  "flour_type":"Farina W330","hydration_percent":50,"preferment_type":"biga","salt_grams":16,"mix_minutes":13,"bulk":2,"rest":720,"proof":3,"temp":185,"min":17,
  "extra":["Zucchero 100g/kg","Burro tourage 450g/kg","Uova","Crema pasticcera","Zucchero a velo"],
  "notes":{"it":"Fagottino di pasta sfoglia lievitata dolce, chiuso a sacchetto e farcito con crema pasticcera. Spolvero di zucchero a velo a fine cottura.","de":"Süßes Plundergebäck als Täschchen mit Creme, Puderzucker.","en":"Sweet laminated pouch filled with pastry cream, dusted with icing sugar.","es":"Bollo hojaldrado dulce relleno de crema, con azúcar glas."},
  "proc":{"it":"1. Pasta cornetto (con zucchero), 3 pieghe. 2. Quadrati 10×10 cm. 3. Dose di crema al centro, chiudere gli angoli a sacchetto. 4. Appretto 3h. 5. Uovo. 6. 185°C 17'. 7. Zucchero a velo.","de":"1. Cornetto-Teig. 2. Quadrate. 3. Creme, Ecken schließen. 4. Gare 3h. 5. Ei. 6. 185°C 17'. 7. Puderzucker.","en":"1. Cornetto dough. 2. Squares. 3. Cream centre, fold corners. 4. Proof 3h. 5. Egg. 6. 185°C 17'. 7. Icing sugar.","es":"1. Masa cornetto. 2. Cuadrados. 3. Crema, cerrar esquinas. 4. Fermentar 3h. 5. Huevo. 6. 185°C 17'. 7. Azúcar glas."}},
 {"key":"girella","name":{"it":"Girella all'Uvetta (Pain aux Raisins)","de":"Rosinenschnecke (Pain aux Raisins)","en":"Raisin Swirl (Pain aux Raisins)","es":"Caracola de Pasas (Pain aux Raisins)"},
  "flour_type":"Farina W330","hydration_percent":50,"preferment_type":"biga","salt_grams":16,"mix_minutes":13,"bulk":2,"rest":720,"proof":2.5,"temp":185,"min":18,
  "extra":["Zucchero 100g/kg","Burro tourage 450g/kg","Crema pasticcera","Uvetta ammollata","Rum","Gelatina di albicocca"],
  "notes":{"it":"Chiocciola di pasta sfoglia lievitata spalmata di crema pasticcera e uvetta al rum, arrotolata e tagliata a girella. Lucidata con gelatina.","de":"Schnecke mit Creme und Rumrosinen, mit Gelee glasiert.","en":"Laminated spiral spread with pastry cream and rum raisins, glazed with jelly.","es":"Caracola con crema y pasas al ron, glaseada."},
  "proc":{"it":"1. Pasta cornetto stesa a rettangolo. 2. Spalmare crema, cospargere uvetta al rum. 3. Arrotolare stretto, tagliare girelle da 2,5 cm. 4. Appretto 2,5h. 5. 185°C 18'. 6. Gelatina di albicocca a lucido.","de":"1. Cornetto-Teig ausrollen. 2. Creme+Rumrosinen. 3. Aufrollen, Scheiben. 4. Gare 2,5h. 5. 185°C 18'. 6. Aprikosengelee.","en":"1. Roll out cornetto dough. 2. Cream+rum raisins. 3. Roll tight, slice. 4. Proof 2.5h. 5. 185°C 18'. 6. Apricot glaze.","es":"1. Estirar masa cornetto. 2. Crema+pasas al ron. 3. Enrollar, cortar. 4. Fermentar 2,5h. 5. 185°C 18'. 6. Gelatina de albaricoque."}},
]
for r in R:
    nm = r["name"]["it"]
    doc = {"id": str(uuid.uuid4()), "collection_name":"mikilab", "name":nm,
        "name_de":r["name"]["de"], "name_en":r["name"]["en"], "name_es":r["name"]["es"],
        "flour_type":r["flour_type"], "hydration_percent":r["hydration_percent"], "preferment_type":r["preferment_type"],
        "sourdough_grams":0, "salt_grams":r["salt_grams"], "mix_minutes":r["mix_minutes"],
        "bulk_fermentation_hours":r["bulk"], "rest_minutes":r["rest"], "proofing_hours":r["proof"],
        "bake_temp":r["temp"], "bake_minutes":r["min"], "menu_category":"viennoiserie",
        "extra_ingredients":[{"name":x} for x in r["extra"]],
        "notes":r["notes"]["it"], "notes_de":r["notes"]["de"], "notes_en":r["notes"]["en"], "notes_es":r["notes"]["es"],
        "procedure":r["proc"]["it"], "procedure_de":r["proc"]["de"], "procedure_en":r["proc"]["en"], "procedure_es":r["proc"]["es"],
        "image_url":IMG[r["key"]], "locked":False, "created_at":now, "updated_at":now}
    res = db.recipes.update_one({"collection_name":"mikilab","name":nm}, {"$set":doc}, upsert=True)
    print(("UPDATED " if res.matched_count else "INSERTED ") + nm)
print("Totale mikilab:", db.recipes.count_documents({"collection_name":"mikilab"}))
