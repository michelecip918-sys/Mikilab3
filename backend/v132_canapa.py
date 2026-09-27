"""MikiLab V132 — le undici ricette nuove alla canapa (scritte da Sitor, IA: bozze finché Michele non le prova)
e la correzione della frase del vecchio miglioratore nei procedimenti.
Usato una volta sola all'avvio (app_meta.v132_canapa) e per allineare il seed. Le dosi delle ricette di Michele non si toccano."""
import re as _re

_CREATO = "2026-09-27T12:00:00+00:00"
_SITOR_IT = "Ricetta scritta da Sitor (IA) con il metodo di Michele: un punto di partenza da provare."
_SITOR_DE = "Rezept von Sitor (KI) nach Micheles Methode: ein Ausgangspunkt zum Ausprobieren."
_SITOR_EN = "Recipe written by Sitor (AI) with Michele's method: a starting point to try."


def _e(it, de, en, es, fr, pct):
    return {"name": it, "percent": pct, "name_de": de, "name_en": en, "name_es": es, "name_fr": fr}


OLIO = _e("Olio d'oliva (Öl)", "Olivenöl (Öl)", "Olive oil (Öl)", "Aceite de oliva (Öl)", "Huile d'olive (Öl)", 1)
ACETO = _e("Aceto di mele (Essig)", "Apfelessig (Essig)", "Apple cider vinegar (Essig)", "Vinagre de manzana (Essig)", "Vinaigre de cidre (Essig)", 1)
KOKOS = _e("Grasso di cocco (Kokosfett)", "Kokosfett", "Coconut fat", "Grasa de coco", "Graisse de coco", 1)


def _migl(p):
    return _e(f"Miglioratore Naturale Pro ({p}% sul peso della farina)", f"Miglioratore Naturale Pro ({p}% des Mehlgewichts)",
              f"Miglioratore Naturale Pro ({p}% on flour weight)", f"Miglioratore Naturale Pro ({p}% sobre el peso de la harina)",
              f"Miglioratore Naturale Pro ({p}% sur le poids de la farine)", p)


SEMI_TOSTATI = lambda p: _e("Semi di canapa decorticati (tostati, nell'impasto)", "Geschälte Hanfsamen (geröstet, im Teig)", "Hulled hemp seeds (toasted, in the dough)", "Semillas de cáñamo peladas (tostadas, en la masa)", "Graines de chanvre décortiquées (grillées, dans la pâte)", p)  # noqa: E731
SEMI_SOPRA = lambda p: _e("Semi di canapa decorticati (sopra)", "Geschälte Hanfsamen (zum Bestreuen)", "Hulled hemp seeds (for the top)", "Semillas de cáñamo peladas (por encima)", "Graines de chanvre décortiquées (sur le dessus)", p)  # noqa: E731
OLIO_CANAPA = _e("Olio di canapa (a crudo, dopo la cottura)", "Hanföl (roh, nach dem Backen)", "Hemp seed oil (raw, after baking)", "Aceite de cáñamo (en crudo, después de hornear)", "Huile de chanvre (crue, après cuisson)", 1)
OLIO_CHIUDERE = _e("Olio extravergine (a chiudere l'impasto)", "Olivenöl extra vergine (zum Schließen des Teigs)", "Extra virgin olive oil (to close the dough)", "Aceite de oliva virgen extra (para cerrar la masa)", "Huile d'olive vierge extra (pour fermer la pâte)", 3)
LIEVITO_FINALE = lambda p: _e("Lievito di birra fresco (impasto finale)", "Frische Hefe (Hauptteig)", "Fresh yeast (final dough)", "Levadura fresca (masa final)", "Levure fraîche (pâte finale)", p)  # noqa: E731


def _biga(f, w, y, ore_it, ore_de, ore_en):
    return {"flour_g": f, "water_g": w, "yeast_g": y, "hours": ore_it, "hours_de": ore_de, "hours_en": ore_en, "show": True, "kind": "biga"}


def _base(**k):
    d = {"collection_name": "mikilab", "created_at": _CREATO, "updated_at": _CREATO, "origin": "IT", "hidden": False,
         "locked": None, "label": None, "costing": None, "work_phases": None, "water_temp_c": None, "biga": None}
    d.update(k)
    return d


NUOVE = [
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000001",
        name="Pagnotta alla Canapa", name_de="Hanf-Laib", name_en="Hemp Loaf", name_es="Hogaza de Cáñamo", name_fr="Miche au Chanvre",
        real_name="Pane con farina e semi di canapa", real_name_de="Brot mit Hanfmehl und Hanfsamen", real_name_en="Bread with hemp flour and hemp seeds",
        real_name_es="Pan con harina y semillas de cáñamo", real_name_fr="Pain à la farine et aux graines de chanvre",
        menu_category="pane", flour_type="Farina tipo 1 85% + farina di canapa 15%",
        flour_type_de="Weizenmehl Type 1050 (ital. Tipo 1) 85 % + Hanfmehl 15 %", flour_type_en="Type 1 wheat flour 85% + hemp flour 15%",
        flour_type_es="Harina tipo 1 85% + harina de cáñamo 15%", flour_type_fr="Farine type 1 85 % + farine de chanvre 15 %",
        flour_grams=1000.0, water_grams=780.0, hydration_percent=78.0, sourdough_grams=200.0, salt_grams=20.0,
        preferment_type="lievito madre", method_type="indiretto", dough_category="indiretto",
        bake_temp=230.0, bake_minutes=45.0, oven_type="statico", mix_minutes=15.0, rest_minutes=45.0,
        bulk_fermentation_hours=4.0, proofing_hours=14.0, image_url="/recipes/p_integrale_lm.webp",
        extra_ingredients=[SEMI_TOSTATI(5), _migl(2), OLIO, ACETO, KOKOS],
        notes="Pane al lievito madre con il 15% di farina di canapa e i semi tostati: mollica umida, colore bruno con riflessi verdi, profumo di nocciola. Resa: 2 pagnotte da circa 1 kg. Usa solo farina e semi di canapa venduti come alimenti, con l'etichetta alimentare: mai foglie, fiori o prodotti al CBD.\n\n" + _SITOR_IT,
        notes_de="Sauerteigbrot mit 15 % Hanfmehl und gerösteten Hanfsamen: saftige Krume, braune Farbe mit grünem Schimmer, Duft nach Nuss. Ergibt 2 Laibe zu etwa 1 kg. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden (mit Lebensmitteletikett): niemals Blätter, Blüten oder CBD-Produkte.\n\n" + _SITOR_DE,
        notes_en="Sourdough bread with 15% hemp flour and toasted hemp seeds: moist crumb, brown colour with a green hint, nutty aroma. Makes 2 loaves of about 1 kg. Use only hemp flour and seeds sold as food, with a food label: never leaves, flowers or CBD products.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) LIEVITO MADRE: la mattina rinfrescalo con lo stesso peso di farina e metà del peso d'acqua (es. 100 g di lievito, 100 g di farina, 50 g d'acqua) e lascialo 3-4 ore a 26-28 °C, finché raddoppia. Ne servono 200 g, al picco.",
            "2) SEMI: tosta 50 g di semi di canapa decorticati 2-3 minuti in una padella asciutta, mescolando, finché profumano di nocciola. Lasciali raffreddare.",
            "3) AUTOLISI: mescola 850 g di farina tipo 1, 150 g di farina di canapa e 730 g di acqua a 24 °C (tieni da parte gli altri 50 g). Copri e lascia riposare 45 minuti. La farina di canapa non ha glutine e beve più acqua: per questo l'impasto è più idratato del solito.",
            "4) IMPASTO: aggiungi il lievito madre a pezzi e il Miglioratore Naturale Pro e impasta 8-10 minuti. Aggiungi il grasso di cocco quando l'impasto è a palla; per ultimi olio d'oliva, aceto di mele e sale. Poi versa i 50 g d'acqua tenuti da parte, un cucchiaio alla volta, solo se l'impasto li assorbe. Alla fine incorpora i semi tostati. Temperatura finale 24-25 °C.",
            "5) PUNTATA: 3-4 ore a 24-26 °C, con 3 giri di pieghe ogni 30 minuti nella prima ora e mezza. L'impasto deve crescere di circa la metà.",
            "6) FORMATURA: dividi in 2 pezzi da circa 1 kg, arrotonda e lascia riposare 20 minuti. Forma a pagnotta tonda o a filone e metti nei cestini infarinati, con la chiusura verso l'alto.",
            "7) APPRETTO IN FRIGO: 12-16 ore a 4 °C, coperto. Il freddo lungo matura il sapore della canapa e rende la crosta più bella.",
            "8) COTTURA: scalda il forno statico a 250 °C con una teglia vuota sul fondo. Rovescia la pagnotta sulla carta forno, fai un taglio deciso e inforna versando un bicchiere d'acqua nella teglia calda: 15 minuti a 240 °C con il vapore, poi apri un attimo lo sportello e finisci a 210 °C per 30 minuti. È cotta quando al cuore segna 96-98 °C e, battendo sotto, suona vuota.",
            "9) RAFFREDDAMENTO: almeno 2 ore su una griglia prima di tagliarla.",
        ]),
        procedure_de="\n".join([
            "1) SAUERTEIG: morgens mit dem gleichen Gewicht Mehl und dem halben Gewicht Wasser auffrischen (z. B. 100 g Sauerteig, 100 g Mehl, 50 g Wasser) und 3-4 Stunden bei 26-28 °C stehen lassen, bis er sich verdoppelt hat. Du brauchst 200 g, auf dem Höhepunkt.",
            "2) SAMEN: 50 g geschälte Hanfsamen 2-3 Minuten in einer trockenen Pfanne rösten und dabei rühren, bis sie nach Nuss duften. Abkühlen lassen.",
            "3) AUTOLYSE: 850 g Weizenmehl Type 1050, 150 g Hanfmehl und 730 g Wasser mit 24 °C mischen (die restlichen 50 g zurückhalten). Abdecken und 45 Minuten ruhen lassen. Hanfmehl hat kein Gluten und nimmt mehr Wasser auf: deshalb ist der Teig weicher als sonst.",
            "4) KNETEN: den Sauerteig in Stücken und den Miglioratore Naturale Pro zugeben und 8-10 Minuten kneten. Das Kokosfett zugeben, wenn der Teig eine Kugel bildet; zuletzt Olivenöl, Apfelessig und Salz. Dann die zurückbehaltenen 50 g Wasser esslöffelweise zugeben, nur solange der Teig sie aufnimmt. Zum Schluss die gerösteten Samen einarbeiten. Teigtemperatur 24-25 °C.",
            "5) STOCKGARE: 3-4 Stunden bei 24-26 °C, in den ersten anderthalb Stunden alle 30 Minuten dehnen und falten (3 Mal). Der Teig soll um etwa die Hälfte wachsen.",
            "6) FORMEN: in 2 Stücke zu etwa 1 kg teilen, rund vorformen und 20 Minuten entspannen lassen. Rund oder länglich formen und mit dem Schluss nach oben in bemehlte Gärkörbe legen.",
            "7) STÜCKGARE IM KÜHLSCHRANK: 12-16 Stunden bei 4 °C, abgedeckt. Die lange Kälte bringt den Hanfgeschmack heraus und macht die Kruste schöner.",
            "8) BACKEN: den Ofen mit Ober-/Unterhitze und einem leeren Blech unten auf 250 °C vorheizen. Den Laib auf Backpapier stürzen, kräftig einschneiden und einschießen, dabei ein Glas Wasser auf das heiße Blech gießen: 15 Minuten bei 240 °C mit Dampf, dann die Ofentür kurz öffnen und bei 210 °C 30 Minuten fertig backen. Er ist durch, wenn er im Kern 96-98 °C hat und beim Klopfen auf den Boden hohl klingt.",
            "9) AUSKÜHLEN: mindestens 2 Stunden auf einem Gitter, bevor du ihn anschneidest.",
        ]),
        procedure_en="\n".join([
            "1) STARTER: in the morning feed it with its own weight of flour and half its weight of water (e.g. 100 g starter, 100 g flour, 50 g water) and leave it 3-4 hours at 26-28 °C until doubled. You need 200 g, at its peak.",
            "2) SEEDS: toast 50 g of hulled hemp seeds for 2-3 minutes in a dry pan, stirring, until they smell nutty. Let them cool.",
            "3) AUTOLYSE: mix 850 g of type 1 wheat flour, 150 g of hemp flour and 730 g of water at 24 °C (keep back the other 50 g). Cover and rest for 45 minutes. Hemp flour has no gluten and drinks more water: that's why this dough is wetter than usual.",
            "4) MIXING: add the starter in pieces and the Miglioratore Naturale Pro and knead for 8-10 minutes. Add the coconut fat once the dough forms a ball; olive oil, apple cider vinegar and salt go in last. Then add the 50 g of water you kept back, a spoonful at a time, only while the dough takes it. Finally work in the toasted seeds. Final dough temperature 24-25 °C.",
            "5) BULK FERMENTATION: 3-4 hours at 24-26 °C, with 3 sets of folds every 30 minutes during the first hour and a half. The dough should grow by about half.",
            "6) SHAPING: divide into 2 pieces of about 1 kg, pre-shape into balls and rest for 20 minutes. Shape into a round or oval loaf and place in floured baskets, seam side up.",
            "7) COLD PROOF: 12-16 hours at 4 °C, covered. The long cold rest brings out the hemp flavour and gives a better crust.",
            "8) BAKING: heat the oven (top and bottom heat) to 250 °C with an empty tray at the bottom. Turn the loaf out onto baking paper, score it firmly and load it, pouring a glass of water onto the hot tray: 15 minutes at 240 °C with steam, then open the door briefly and finish at 210 °C for 30 minutes. It's done when the core reads 96-98 °C and it sounds hollow when tapped underneath.",
            "9) COOLING: at least 2 hours on a rack before slicing.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000002",
        name="Focaccia Verde alla Canapa", name_de="Grüne Hanf-Focaccia", name_en="Green Hemp Focaccia", name_es="Focaccia Verde de Cáñamo", name_fr="Focaccia Verte au Chanvre",
        real_name="Focaccia in teglia con farina e semi di canapa", real_name_de="Blech-Focaccia mit Hanfmehl und Hanfsamen", real_name_en="Pan focaccia with hemp flour and hemp seeds",
        real_name_es="Focaccia en bandeja con harina y semillas de cáñamo", real_name_fr="Focaccia sur plaque à la farine et aux graines de chanvre",
        menu_category="focacce", flour_type="Farina tipo 0 (W 280-300) 90% + farina di canapa 10%",
        flour_type_de="Weizenmehl Type 550 (ital. Tipo 0, W 280-300) 90 % + Hanfmehl 10 %", flour_type_en="Type 0 wheat flour (W 280-300) 90% + hemp flour 10%",
        flour_type_es="Harina tipo 0 (W 280-300) 90% + harina de cáñamo 10%", flour_type_fr="Farine type 0 (W 280-300) 90 % + farine de chanvre 10 %",
        flour_grams=1000.0, water_grams=770.0, hydration_percent=77.0, sourdough_grams=0.0, salt_grams=22.0,
        preferment_type="biga", method_type="indiretto", dough_category="indiretto",
        biga=_biga(500, 225, 5, "16-18 ore a 16-18 °C", "16-18 Std. bei 16-18 °C", "16-18 h at 16-18 °C"),
        bake_temp=240.0, bake_minutes=22.0, oven_type="statico", mix_minutes=12.0, rest_minutes=None,
        bulk_fermentation_hours=1.5, proofing_hours=2.0, image_url="/recipes/foc_semi.webp",
        extra_ingredients=[
            _e("Patata lessa schiacciata (fredda)", "Gekochte, gestampfte Kartoffel (kalt)", "Boiled mashed potato (cold)", "Patata cocida machacada (fría)", "Pomme de terre cuite écrasée (froide)", 15),
            _migl(3), OLIO_CHIUDERE,
            _e("Olio extravergine (in teglia e sopra)", "Olivenöl extra vergine (fürs Blech und obenauf)", "Extra virgin olive oil (for the pan and on top)", "Aceite de oliva virgen extra (en la bandeja y por encima)", "Huile d'olive vierge extra (dans le moule et sur le dessus)", 8),
            SEMI_SOPRA(3), OLIO_CANAPA,
            _e("Sale grosso (sopra)", "Grobes Salz (obenauf)", "Coarse salt (on top)", "Sal gruesa (por encima)", "Gros sel (sur le dessus)", 0.8),
        ],
        notes="Focaccia in teglia col metodo di Michele (biga, patata lessa schiacciata e un filo d'olio a chiudere l'impasto) con il 10% di farina di canapa: mollica umida, bordi croccanti, profumo di nocciola. Resa: 3 teglie 30×40 cm. Usa solo farina, semi e olio di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Blech-Focaccia nach Micheles Methode (Biga, gestampfte gekochte Kartoffel und ein Schuss Öl zum Schließen des Teigs) mit 10 % Hanfmehl: saftige Krume, knusprige Ränder, Duft nach Nuss. Ergibt 3 Bleche 30×40 cm. Verwende nur Hanfmehl, Hanfsamen und Hanföl, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Pan focaccia with Michele's method (biga, mashed boiled potato and a drizzle of oil to close the dough) with 10% hemp flour: moist crumb, crisp edges, nutty aroma. Makes 3 pans of 30×40 cm. Use only hemp flour, seeds and oil sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) BIGA, la sera prima: 500 g di farina tipo 0, 225 g di acqua fredda e 5 g di lievito di birra fresco. Mescola solo finché l'acqua è assorbita: deve restare grumosa, non liscia. Copri e lascia 16-18 ore a 16-18 °C.",
            "2) PATATA: lessa 200 g di patate farinose con la buccia per 25-30 minuti. Pelale, schiacciale ancora calde (ne servono 150 g) e lasciale raffreddare sotto i 30 °C: calde, uccidono il lievito.",
            "3) IMPASTO: in planetaria metti la biga a pezzi e 450 g di acqua fredda, poi 400 g di farina tipo 0, 100 g di farina di canapa e il Miglioratore Naturale Pro. Impasta 6-8 minuti a velocità bassa. Aggiungi la patata e il sale (22 g), poi gli ultimi 95 g d'acqua a filo, solo quando l'impasto li prende. Chiudi l'impasto con un filo d'olio (30 g): deve diventare liscio e lucido. Temperatura finale 24-26 °C.",
            "4) PUNTATA: 1 ora e mezza coperto, con 2 giri di pieghe nella prima ora.",
            "5) IN TEGLIA: ungi bene 3 teglie 30×40 cm. Dividi l'impasto in 3 pezzi da circa 670 g, piegali a panetto e mettili nelle teglie. Dopo 30 minuti allarga ogni panetto con le dita fino ai bordi.",
            "6) APPRETTO: 1 ora e mezza - 2 ore, finché la focaccia è gonfia e piena di bolle. Fai i buchi con i polpastrelli, spennella con un'emulsione di olio e un cucchiaio d'acqua e cospargi con i semi di canapa e il sale grosso.",
            "7) COTTURA: forno statico a 240 °C: 10 minuti sul fondo, poi 10-12 minuti sul ripiano di mezzo, finché è dorata anche sotto.",
            "8) FINITURA: appena sfornata, un filo d'olio di canapa a crudo: il calore del forno gli toglierebbe il profumo. Falla intiepidire su una griglia, così il fondo resta croccante.",
        ]),
        procedure_de="\n".join([
            "1) BIGA, am Vorabend: 500 g Weizenmehl Type 550, 225 g kaltes Wasser und 5 g frische Hefe. Nur mischen, bis das Wasser aufgenommen ist: der Teig bleibt krümelig, nicht glatt. Abdecken und 16-18 Stunden bei 16-18 °C reifen lassen.",
            "2) KARTOFFEL: 200 g mehligkochende Kartoffeln mit Schale 25-30 Minuten kochen. Schälen, noch warm zerdrücken (du brauchst 150 g) und unter 30 °C abkühlen lassen: warm töten sie die Hefe.",
            "3) KNETEN: die Biga in Stücken mit 450 g kaltem Wasser in die Küchenmaschine geben, dann 400 g Weizenmehl Type 550, 100 g Hanfmehl und den Miglioratore Naturale Pro. 6-8 Minuten langsam kneten. Kartoffel und Salz (22 g) zugeben, dann die letzten 95 g Wasser in dünnem Strahl, nur wenn der Teig sie aufnimmt. Den Teig mit einem Schuss Öl (30 g) schließen: er soll glatt und glänzend werden. Teigtemperatur 24-26 °C.",
            "4) STOCKGARE: anderthalb Stunden abgedeckt, in der ersten Stunde 2 Mal dehnen und falten.",
            "5) IN DIE BLECHE: 3 Bleche 30×40 cm gut einölen. Den Teig in 3 Stücke zu etwa 670 g teilen, zu Päckchen falten und in die Bleche legen. Nach 30 Minuten jedes Stück mit den Fingern bis zu den Rändern ausbreiten.",
            "6) STÜCKGARE: anderthalb bis 2 Stunden, bis die Focaccia aufgegangen und voller Blasen ist. Mit den Fingerkuppen Mulden drücken, mit einer Emulsion aus Öl und einem Esslöffel Wasser bestreichen und mit Hanfsamen und grobem Salz bestreuen.",
            "7) BACKEN: Ober-/Unterhitze 240 °C: 10 Minuten auf dem Ofenboden, dann 10-12 Minuten auf der mittleren Schiene, bis sie auch unten goldbraun ist.",
            "8) FINISH: direkt nach dem Backen etwas Hanföl roh darüberträufeln: die Ofenhitze würde ihm das Aroma nehmen. Auf einem Gitter abkühlen lassen, damit der Boden knusprig bleibt.",
        ]),
        procedure_en="\n".join([
            "1) BIGA, the evening before: 500 g of type 0 flour, 225 g of cold water and 5 g of fresh yeast. Mix only until the water is absorbed: it should stay lumpy, not smooth. Cover and leave 16-18 hours at 16-18 °C.",
            "2) POTATO: boil 200 g of floury potatoes in their skins for 25-30 minutes. Peel, mash them while warm (you need 150 g) and let them cool below 30 °C: warm, they kill the yeast.",
            "3) MIXING: in a stand mixer put the biga in pieces with 450 g of cold water, then 400 g of type 0 flour, 100 g of hemp flour and the Miglioratore Naturale Pro. Knead 6-8 minutes on low speed. Add the potato and the salt (22 g), then the last 95 g of water in a thin stream, only when the dough takes it. Close the dough with a drizzle of oil (30 g): it should become smooth and shiny. Final dough temperature 24-26 °C.",
            "4) BULK: an hour and a half covered, with 2 sets of folds in the first hour.",
            "5) INTO THE PANS: oil 3 pans of 30×40 cm well. Divide the dough into 3 pieces of about 670 g, fold each into a parcel and place it in a pan. After 30 minutes stretch each one with your fingers to the edges.",
            "6) FINAL PROOF: 1.5-2 hours, until puffy and full of bubbles. Dimple with your fingertips, brush with an emulsion of oil and a spoonful of water and sprinkle with hemp seeds and coarse salt.",
            "7) BAKING: conventional oven at 240 °C: 10 minutes on the oven floor, then 10-12 minutes on the middle rack, until golden underneath too.",
            "8) FINISH: straight out of the oven, a drizzle of raw hemp oil: the oven's heat would take its aroma away. Let it cool on a rack so the base stays crisp.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000003",
        name="Panini alla Canapa", name_de="Hanfbrötchen", name_en="Hemp Rolls", name_es="Panecillos de Cáñamo", name_fr="Petits Pains au Chanvre",
        real_name="Panini con farina e semi di canapa", real_name_de="Brötchen mit Hanfmehl und Hanfsamen", real_name_en="Rolls with hemp flour and hemp seeds",
        real_name_es="Panecillos con harina y semillas de cáñamo", real_name_fr="Petits pains à la farine et aux graines de chanvre",
        menu_category="panini", flour_type="Farina tipo 0 (W 260-280) 90% + farina di canapa 10%",
        flour_type_de="Weizenmehl Type 550 (ital. Tipo 0, W 260-280) 90 % + Hanfmehl 10 %", flour_type_en="Type 0 wheat flour (W 260-280) 90% + hemp flour 10%",
        flour_type_es="Harina tipo 0 (W 260-280) 90% + harina de cáñamo 10%", flour_type_fr="Farine type 0 (W 260-280) 90 % + farine de chanvre 10 %",
        flour_grams=1000.0, water_grams=700.0, hydration_percent=70.0, sourdough_grams=0.0, salt_grams=20.0,
        preferment_type="biga", method_type="indiretto", dough_category="indiretto",
        biga=_biga(400, 180, 4, "16-18 ore a 16-18 °C", "16-18 Std. bei 16-18 °C", "16-18 h at 16-18 °C"),
        bake_temp=220.0, bake_minutes=18.0, oven_type="statico", mix_minutes=14.0, rest_minutes=None,
        bulk_fermentation_hours=0.75, proofing_hours=1.5, image_url="/recipes/pn_multicereali.webp",
        extra_ingredients=[LIEVITO_FINALE(0.5), _migl(2), SEMI_TOSTATI(4), SEMI_SOPRA(4), OLIO, ACETO, KOKOS],
        notes="Panini con la biga e il 10% di farina di canapa, chiusi nei semi: crosta sottile, mollica umida. Resa: circa 23 panini da 80 g. Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Brötchen mit Biga und 10 % Hanfmehl, in Hanfsamen gewälzt: dünne Kruste, saftige Krume. Ergibt etwa 23 Brötchen zu 80 g. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Rolls with biga and 10% hemp flour, rolled in hemp seeds: thin crust, moist crumb. Makes about 23 rolls of 80 g. Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) BIGA, la sera prima: 400 g di farina tipo 0, 180 g di acqua fredda e 4 g di lievito di birra fresco. Mescola grossolano, copri e lascia 16-18 ore a 16-18 °C.",
            "2) SEMI: tosta 40 g di semi di canapa decorticati 2-3 minuti in una padella asciutta e lasciali raffreddare: vanno nell'impasto. Gli altri 40 g restano crudi, per sopra.",
            "3) IMPASTO: in planetaria la biga a pezzi, 450 g di acqua fredda, 500 g di farina tipo 0, 100 g di farina di canapa, 5 g di lievito fresco e il Miglioratore Naturale Pro. Impasta 8 minuti a velocità bassa. Aggiungi il grasso di cocco quando l'impasto è a palla; per ultimi olio d'oliva, aceto di mele e sale, poi gli ultimi 70 g d'acqua a filo. Incorda 5-6 minuti a velocità media e alla fine incorpora i semi tostati. Temperatura finale 24-25 °C.",
            "4) PUNTATA: 45 minuti coperto, con una piega a metà.",
            "5) FORMATURA: dividi in pezzi da 80 g e pirlali stretti. Passa la parte liscia su un panno umido e poi nei semi di canapa crudi. Mettili distanziati su carta forno.",
            "6) APPRETTO: 1-1,5 ore a 26-28 °C, coperti, finché sono quasi raddoppiati.",
            "7) COTTURA: forno statico a 230 °C con vapore; inforna e abbassa a 220 °C: 16-18 minuti, finché sono dorati. Apri lo sportello negli ultimi 5 minuti per far uscire il vapore.",
        ]),
        procedure_de="\n".join([
            "1) BIGA, am Vorabend: 400 g Weizenmehl Type 550, 180 g kaltes Wasser und 4 g frische Hefe. Grob mischen, abdecken und 16-18 Stunden bei 16-18 °C reifen lassen.",
            "2) SAMEN: 40 g geschälte Hanfsamen 2-3 Minuten in einer trockenen Pfanne rösten und abkühlen lassen: sie kommen in den Teig. Die anderen 40 g bleiben roh, zum Bestreuen.",
            "3) KNETEN: in der Küchenmaschine die Biga in Stücken, 450 g kaltes Wasser, 500 g Weizenmehl Type 550, 100 g Hanfmehl, 5 g frische Hefe und den Miglioratore Naturale Pro. 8 Minuten langsam kneten. Das Kokosfett zugeben, wenn der Teig eine Kugel bildet; zuletzt Olivenöl, Apfelessig und Salz, dann die letzten 70 g Wasser in dünnem Strahl. 5-6 Minuten auf mittlerer Stufe auskneten und zum Schluss die gerösteten Samen einarbeiten. Teigtemperatur 24-25 °C.",
            "4) STOCKGARE: 45 Minuten abgedeckt, nach der Hälfte einmal falten.",
            "5) FORMEN: in Stücke zu 80 g teilen und straff rundschleifen. Die glatte Seite auf ein feuchtes Tuch drücken und dann in die rohen Hanfsamen. Mit Abstand auf Backpapier setzen.",
            "6) STÜCKGARE: 1-1,5 Stunden bei 26-28 °C abgedeckt, bis sie sich fast verdoppelt haben.",
            "7) BACKEN: Ober-/Unterhitze 230 °C mit Dampf; einschießen und auf 220 °C herunterschalten: 16-18 Minuten, bis sie goldbraun sind. In den letzten 5 Minuten die Ofentür öffnen, damit der Dampf entweicht.",
        ]),
        procedure_en="\n".join([
            "1) BIGA, the evening before: 400 g of type 0 flour, 180 g of cold water and 4 g of fresh yeast. Mix roughly, cover and leave 16-18 hours at 16-18 °C.",
            "2) SEEDS: toast 40 g of hulled hemp seeds for 2-3 minutes in a dry pan and let them cool: they go into the dough. The other 40 g stay raw, for the top.",
            "3) MIXING: in a stand mixer the biga in pieces, 450 g of cold water, 500 g of type 0 flour, 100 g of hemp flour, 5 g of fresh yeast and the Miglioratore Naturale Pro. Knead 8 minutes on low speed. Add the coconut fat once the dough forms a ball; olive oil, apple cider vinegar and salt go in last, then the last 70 g of water in a thin stream. Knead 5-6 minutes on medium speed and finally work in the toasted seeds. Final dough temperature 24-25 °C.",
            "4) BULK: 45 minutes covered, with one fold halfway.",
            "5) SHAPING: divide into 80 g pieces and round them tightly. Press the smooth side onto a damp cloth and then into the raw hemp seeds. Place them apart on baking paper.",
            "6) FINAL PROOF: 1-1.5 hours at 26-28 °C, covered, until almost doubled.",
            "7) BAKING: conventional oven at 230 °C with steam; load and lower to 220 °C: 16-18 minutes, until golden. Open the door for the last 5 minutes to let the steam out.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000004",
        name="Pizza in Teglia alla Canapa", name_de="Blechpizza mit Hanf", name_en="Hemp Pan Pizza", name_es="Pizza en Bandeja con Cáñamo", name_fr="Pizza sur Plaque au Chanvre",
        real_name="Pizza in teglia con farina di canapa", real_name_de="Blechpizza mit Hanfmehl", real_name_en="Pan pizza with hemp flour",
        real_name_es="Pizza en bandeja con harina de cáñamo", real_name_fr="Pizza sur plaque à la farine de chanvre",
        menu_category="pizza", flour_type="Farina tipo 0 forte (W 300-330) 90% + farina di canapa 10%",
        flour_type_de="Starkes Weizenmehl (ital. Tipo 0, W 300-330) 90 % + Hanfmehl 10 %", flour_type_en="Strong type 0 wheat flour (W 300-330) 90% + hemp flour 10%",
        flour_type_es="Harina tipo 0 de fuerza (W 300-330) 90% + harina de cáñamo 10%", flour_type_fr="Farine type 0 de force (W 300-330) 90 % + farine de chanvre 10 %",
        flour_grams=1000.0, water_grams=800.0, hydration_percent=80.0, sourdough_grams=0.0, salt_grams=24.0,
        preferment_type="biga", method_type="indiretto", dough_category="indiretto",
        biga=_biga(600, 270, 6, "18-20 ore a 16-18 °C", "18-20 Std. bei 16-18 °C", "18-20 h at 16-18 °C"),
        bake_temp=250.0, bake_minutes=16.0, oven_type="statico", mix_minutes=12.0, rest_minutes=None,
        bulk_fermentation_hours=1.0, proofing_hours=3.0, image_url="/recipes/pz_teglia_romana.webp",
        extra_ingredients=[
            _e("Olio extravergine d'oliva (a chiudere)", "Olivenöl extra vergine (zum Schließen)", "Extra virgin olive oil (to close the dough)", "Aceite de oliva virgen extra (para cerrar)", "Huile d'olive vierge extra (pour fermer)", 3),
            _migl(3), OLIO_CANAPA,
            _e("Semi di canapa decorticati (sopra, dopo la cottura)", "Geschälte Hanfsamen (obenauf, nach dem Backen)", "Hulled hemp seeds (on top, after baking)", "Semillas de cáñamo peladas (por encima, después de hornear)", "Graines de chanvre décortiquées (sur le dessus, après cuisson)", 2),
        ],
        notes="Pizza in teglia ad alta idratazione (80%) con la biga e il 10% di farina di canapa: fondo croccante, mollica leggera e un gusto di nocciola che sta bene col pomodoro. Resa: 3 teglie 30×40 cm. Usa solo farina, semi e olio di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Blechpizza mit hoher Hydration (80 %), Biga und 10 % Hanfmehl: knuspriger Boden, luftige Krume und ein nussiger Geschmack, der gut zur Tomate passt. Ergibt 3 Bleche 30×40 cm. Verwende nur Hanfmehl, Hanfsamen und Hanföl, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="High-hydration (80%) pan pizza with biga and 10% hemp flour: crisp base, light crumb and a nutty taste that goes well with tomato. Makes 3 pans of 30×40 cm. Use only hemp flour, seeds and oil sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) BIGA, la sera prima: 600 g di farina forte, 270 g di acqua fredda e 6 g di lievito di birra fresco. Mescola solo finché l'acqua è assorbita. Copri e lascia 18-20 ore a 16-18 °C.",
            "2) IMPASTO: in planetaria la biga a pezzi con 400 g di acqua fredda, poi 300 g di farina forte, 100 g di farina di canapa e il Miglioratore Naturale Pro. Impasta 6-8 minuti. Aggiungi il sale (24 g), poi gli ultimi 130 g d'acqua a filo, poco alla volta, aspettando che l'impasto li assorba. Chiudi con l'olio extravergine (30 g): l'impasto deve staccarsi dalle pareti, liscio e lucido. Temperatura finale 24-25 °C.",
            "3) PUNTATA: 1 ora coperto, con 2 giri di pieghe.",
            "4) PANETTI: dividi in 3 pezzi da circa 630 g (uno per teglia 30×40 cm), arrotondali e mettili in contenitori unti e chiusi. Lasciali 2-3 ore a temperatura ambiente, finché raddoppiano.",
            "5) STESURA: ungi la teglia. Rovescia il panetto su un po' di semola e allargalo con i polpastrelli, dal centro verso i bordi, senza schiacciare i bordi; poi trasferiscilo in teglia e finisci di allargarlo.",
            "6) CONDIMENTO E COTTURA: forno statico al massimo (250-280 °C). Condisci ogni teglia con 200 g di passata di pomodoro salata e un filo d'olio e inforna sul fondo per 10-12 minuti. Aggiungi 200 g di mozzarella a cubetti ben scolata e cuoci altri 5 minuti sul ripiano di mezzo.",
            "7) FINITURA: appena sfornata, un filo d'olio di canapa a crudo, i semi di canapa e qualche foglia di basilico.",
        ]),
        procedure_de="\n".join([
            "1) BIGA, am Vorabend: 600 g starkes Weizenmehl, 270 g kaltes Wasser und 6 g frische Hefe. Nur mischen, bis das Wasser aufgenommen ist. Abdecken und 18-20 Stunden bei 16-18 °C reifen lassen.",
            "2) KNETEN: in der Küchenmaschine die Biga in Stücken mit 400 g kaltem Wasser, dann 300 g starkes Weizenmehl, 100 g Hanfmehl und den Miglioratore Naturale Pro. 6-8 Minuten kneten. Das Salz (24 g) zugeben, dann die letzten 130 g Wasser nach und nach in dünnem Strahl, jeweils warten, bis der Teig es aufgenommen hat. Mit Olivenöl (30 g) schließen: der Teig soll sich vom Schüsselrand lösen, glatt und glänzend. Teigtemperatur 24-25 °C.",
            "3) STOCKGARE: 1 Stunde abgedeckt, 2 Mal dehnen und falten.",
            "4) TEIGLINGE: in 3 Stücke zu etwa 630 g teilen (eins pro Blech 30×40 cm), rund formen und in geölte, geschlossene Dosen legen. 2-3 Stunden bei Raumtemperatur gehen lassen, bis sie sich verdoppelt haben.",
            "5) AUSBREITEN: das Blech einölen. Den Teigling auf etwas Hartweizengrieß stürzen und mit den Fingerkuppen von der Mitte zu den Rändern ausbreiten, ohne die Ränder flach zu drücken; dann ins Blech legen und fertig ausbreiten.",
            "6) BELEGEN UND BACKEN: Ober-/Unterhitze auf höchster Stufe (250-280 °C). Jedes Blech mit 200 g gesalzener passierter Tomate und etwas Öl belegen und 10-12 Minuten auf dem Ofenboden backen. 200 g gut abgetropften Mozzarella in Würfeln verteilen und weitere 5 Minuten auf der mittleren Schiene backen.",
            "7) FINISH: direkt nach dem Backen etwas rohes Hanföl, die Hanfsamen und ein paar Basilikumblätter.",
        ]),
        procedure_en="\n".join([
            "1) BIGA, the evening before: 600 g of strong flour, 270 g of cold water and 6 g of fresh yeast. Mix only until the water is absorbed. Cover and leave 18-20 hours at 16-18 °C.",
            "2) MIXING: in a stand mixer the biga in pieces with 400 g of cold water, then 300 g of strong flour, 100 g of hemp flour and the Miglioratore Naturale Pro. Knead 6-8 minutes. Add the salt (24 g), then the last 130 g of water in a thin stream, a little at a time, waiting for the dough to absorb it. Close with the extra virgin olive oil (30 g): the dough should come away from the bowl, smooth and shiny. Final dough temperature 24-25 °C.",
            "3) BULK: 1 hour covered, with 2 sets of folds.",
            "4) DOUGH BALLS: divide into 3 pieces of about 630 g (one per 30×40 cm pan), round them and put them in oiled, closed containers. Leave them 2-3 hours at room temperature, until doubled.",
            "5) STRETCHING: oil the pan. Turn the ball out onto a little semolina and stretch it with your fingertips from the centre towards the edges, without flattening the rim; then move it into the pan and finish stretching.",
            "6) TOPPING AND BAKING: conventional oven at maximum (250-280 °C). Top each pan with 200 g of salted tomato passata and a drizzle of oil and bake on the oven floor for 10-12 minutes. Add 200 g of well-drained diced mozzarella and bake 5 more minutes on the middle rack.",
            "7) FINISH: straight out of the oven, a drizzle of raw hemp oil, the hemp seeds and a few basil leaves.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000005",
        name="Taralli alla Canapa", name_de="Hanf-Taralli", name_en="Hemp Taralli", name_es="Taralli de Cáñamo", name_fr="Taralli au Chanvre",
        real_name="Taralli pugliesi con farina e semi di canapa", real_name_de="Apulische Taralli mit Hanfmehl und Hanfsamen", real_name_en="Apulian taralli with hemp flour and hemp seeds",
        real_name_es="Taralli de Apulia con harina y semillas de cáñamo", real_name_fr="Taralli des Pouilles à la farine et aux graines de chanvre",
        menu_category="snack", flour_type="Farina tipo 00 85% + farina di canapa 15%",
        flour_type_de="Weizenmehl Type 405 (ital. Tipo 00) 85 % + Hanfmehl 15 %", flour_type_en="Type 00 wheat flour 85% + hemp flour 15%",
        flour_type_es="Harina tipo 00 85% + harina de cáñamo 15%", flour_type_fr="Farine type 00 85 % + farine de chanvre 15 %",
        flour_grams=1000.0, water_grams=0.0, hydration_percent=None, sourdough_grams=0.0, salt_grams=20.0,
        preferment_type="none", method_type="diretto", dough_category="diretto",
        bake_temp=200.0, bake_minutes=28.0, oven_type="ventilato", mix_minutes=12.0, rest_minutes=30.0,
        bulk_fermentation_hours=None, proofing_hours=None, image_url="/recipes/r_taralli.webp",
        extra_ingredients=[
            _e("Vino bianco secco", "Trockener Weißwein", "Dry white wine", "Vino blanco seco", "Vin blanc sec", 38),
            _e("Olio extravergine d'oliva", "Olivenöl extra vergine", "Extra virgin olive oil", "Aceite de oliva virgen extra", "Huile d'olive vierge extra", 15),
            _e("Semi di canapa decorticati", "Geschälte Hanfsamen", "Hulled hemp seeds", "Semillas de cáñamo peladas", "Graines de chanvre décortiquées", 5),
            _e("Pepe nero macinato", "Schwarzer Pfeffer, gemahlen", "Ground black pepper", "Pimienta negra molida", "Poivre noir moulu", 0.5),
            _migl(3),
        ],
        notes="Il tarallo pugliese con il 15% di farina di canapa e i semi: più friabile, con un profumo di nocciola. Prima si sbollentano, poi si cuociono. Resa: circa 150 taralli piccoli. Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Der apulische Tarallo mit 15 % Hanfmehl und Hanfsamen: mürber, mit Nussduft. Erst kurz gekocht, dann gebacken. Ergibt etwa 150 kleine Taralli. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="The Apulian tarallo with 15% hemp flour and hemp seeds: more crumbly, with a nutty aroma. First boiled, then baked. Makes about 150 small taralli. Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) In una ciotola unisci 850 g di farina tipo 00, 150 g di farina di canapa, il sale (20 g), il pepe nero, i semi di canapa e il Miglioratore Naturale Pro.",
            "2) Aggiungi 150 g di olio extravergine e 380 g di vino bianco secco a temperatura ambiente. Impasta 10-12 minuti fino a un panetto liscio e sodo: niente acqua, l'idratazione viene dal vino. Se si sbriciola, aggiungi un cucchiaio di vino.",
            "3) Copri e lascia riposare 30 minuti.",
            "4) Preleva pezzi da 10-12 g, forma cordoncini di circa 1 cm di spessore e chiudili ad anello, sovrapponendo le estremità.",
            "5) Porta a bollore una pentola d'acqua: tuffa i taralli pochi alla volta e scolali appena salgono a galla.",
            "6) Lasciali asciugare 1 ora su un telo pulito, poi disponili sulla teglia con carta forno.",
            "7) Cuoci a 200 °C ventilato per 25-30 minuti, finché sono dorati e croccanti. Falli raffreddare del tutto: in una scatola di latta si conservano 2-3 settimane.",
        ]),
        procedure_de="\n".join([
            "1) In einer Schüssel 850 g Weizenmehl Type 405, 150 g Hanfmehl, das Salz (20 g), schwarzen Pfeffer, die Hanfsamen und den Miglioratore Naturale Pro mischen.",
            "2) 150 g Olivenöl extra vergine und 380 g trockenen Weißwein mit Raumtemperatur zugeben. 10-12 Minuten zu einem glatten, festen Teig kneten: kein Wasser, die Flüssigkeit kommt vom Wein. Wenn er bröselt, einen Esslöffel Wein zugeben.",
            "3) Abdecken und 30 Minuten ruhen lassen.",
            "4) Stücke zu 10-12 g abnehmen, zu etwa 1 cm dicken Strängen rollen und zu Ringen schließen, die Enden übereinander.",
            "5) Einen Topf Wasser zum Kochen bringen: die Taralli portionsweise hineingeben und herausnehmen, sobald sie an die Oberfläche steigen.",
            "6) 1 Stunde auf einem sauberen Tuch trocknen lassen, dann auf ein Blech mit Backpapier legen.",
            "7) Bei 200 °C Umluft 25-30 Minuten backen, bis sie goldbraun und knusprig sind. Vollständig auskühlen lassen: in einer Blechdose halten sie 2-3 Wochen.",
        ]),
        procedure_en="\n".join([
            "1) In a bowl combine 850 g of type 00 flour, 150 g of hemp flour, the salt (20 g), black pepper, the hemp seeds and the Miglioratore Naturale Pro.",
            "2) Add 150 g of extra virgin olive oil and 380 g of dry white wine at room temperature. Knead 10-12 minutes into a smooth, firm dough: no water, the liquid comes from the wine. If it crumbles, add a spoonful of wine.",
            "3) Cover and rest for 30 minutes.",
            "4) Take 10-12 g pieces, roll them into ropes about 1 cm thick and close them into rings, overlapping the ends.",
            "5) Bring a pot of water to the boil: drop the taralli in a few at a time and lift them out as soon as they float.",
            "6) Let them dry for 1 hour on a clean cloth, then place them on a tray lined with baking paper.",
            "7) Bake at 200 °C fan for 25-30 minutes, until golden and crunchy. Let them cool completely: in a tin they keep for 2-3 weeks.",
        ]),
    ),
]
NUOVE += [
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000006",
        name="Grissini alla Canapa", name_de="Hanf-Grissini", name_en="Hemp Breadsticks", name_es="Grissini de Cáñamo", name_fr="Gressins au Chanvre",
        real_name="Grissini stirati con farina e semi di canapa", real_name_de="Handgezogene Grissini mit Hanfmehl und Hanfsamen", real_name_en="Hand-stretched breadsticks with hemp flour and hemp seeds",
        real_name_es="Grissini estirados con harina y semillas de cáñamo", real_name_fr="Gressins étirés à la farine et aux graines de chanvre",
        menu_category="snack", flour_type="Farina tipo 0 85% + farina di canapa 15%",
        flour_type_de="Weizenmehl Type 550 (ital. Tipo 0) 85 % + Hanfmehl 15 %", flour_type_en="Type 0 wheat flour 85% + hemp flour 15%",
        flour_type_es="Harina tipo 0 85% + harina de cáñamo 15%", flour_type_fr="Farine type 0 85 % + farine de chanvre 15 %",
        flour_grams=1000.0, water_grams=580.0, hydration_percent=58.0, sourdough_grams=0.0, salt_grams=20.0,
        preferment_type="biga", method_type="indiretto", dough_category="indiretto",
        biga=_biga(400, 180, 4, "16-18 ore a 16-18 °C", "16-18 Std. bei 16-18 °C", "16-18 h at 16-18 °C"),
        bake_temp=200.0, bake_minutes=18.0, oven_type="statico", mix_minutes=10.0, rest_minutes=60.0,
        bulk_fermentation_hours=1.0, proofing_hours=None, image_url="/recipes/sn_grissini.webp",
        extra_ingredients=[
            _e("Olio extravergine d'oliva (nell'impasto)", "Olivenöl extra vergine (im Teig)", "Extra virgin olive oil (in the dough)", "Aceite de oliva virgen extra (en la masa)", "Huile d'olive vierge extra (dans la pâte)", 10),
            _migl(3), SEMI_TOSTATI(5),
        ],
        notes="Grissini stirati a mano, con la biga e il 15% di farina di canapa: croccanti, con i semi tostati dentro. Resa: circa 90 grissini da 20 g. Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Von Hand gezogene Grissini mit Biga und 15 % Hanfmehl: knusprig, mit gerösteten Samen im Teig. Ergibt etwa 90 Grissini zu 20 g. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Hand-stretched breadsticks with biga and 15% hemp flour: crunchy, with toasted seeds inside. Makes about 90 breadsticks of 20 g. Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) BIGA, la sera prima: 400 g di farina tipo 0, 180 g di acqua fredda e 4 g di lievito di birra fresco. Mescola grossolano, copri e lascia 16-18 ore a 16-18 °C.",
            "2) SEMI: tosta 50 g di semi di canapa decorticati 2-3 minuti in una padella asciutta e lasciali raffreddare.",
            "3) IMPASTO: in planetaria la biga a pezzi, 400 g di acqua, 450 g di farina tipo 0, 150 g di farina di canapa e il Miglioratore Naturale Pro. Impasta 5 minuti, aggiungi il sale (20 g), poi l'olio (100 g) a filo, un po' alla volta. Impasta finché è liscio e alla fine incorpora i semi tostati. È un impasto sodo: così i grissini restano croccanti.",
            "4) RIPOSO: fai un rettangolo su un piano spolverato di semola, spennellalo d'olio, coprilo con la pellicola e lascialo 1 ora a temperatura ambiente.",
            "5) FORMATURA: taglia strisce larghe 1,5 cm. Prendi ogni striscia dalle punte e allungala con le mani fino alla lunghezza della teglia (circa 30 cm). Mettili su carta forno, un po' distanziati.",
            "6) COTTURA: forno statico a 200 °C per 15-18 minuti, finché sono dorati e asciutti. Se al centro sono ancora morbidi, lasciali 5 minuti nel forno spento con lo sportello socchiuso.",
            "7) Falli raffreddare del tutto: in una scatola di latta restano croccanti per 2 settimane.",
        ]),
        procedure_de="\n".join([
            "1) BIGA, am Vorabend: 400 g Weizenmehl Type 550, 180 g kaltes Wasser und 4 g frische Hefe. Grob mischen, abdecken und 16-18 Stunden bei 16-18 °C reifen lassen.",
            "2) SAMEN: 50 g geschälte Hanfsamen 2-3 Minuten in einer trockenen Pfanne rösten und abkühlen lassen.",
            "3) KNETEN: in der Küchenmaschine die Biga in Stücken, 400 g Wasser, 450 g Weizenmehl Type 550, 150 g Hanfmehl und den Miglioratore Naturale Pro. 5 Minuten kneten, das Salz (20 g) zugeben, dann das Öl (100 g) nach und nach in dünnem Strahl. Kneten, bis der Teig glatt ist, und zum Schluss die gerösteten Samen einarbeiten. Der Teig ist fest: so bleiben die Grissini knusprig.",
            "4) RUHE: auf einer mit Grieß bestreuten Fläche zu einem Rechteck formen, mit Öl bestreichen, mit Folie abdecken und 1 Stunde bei Raumtemperatur ruhen lassen.",
            "5) FORMEN: Streifen von 1,5 cm Breite schneiden. Jeden Streifen an den Enden fassen und mit den Händen auf Blechlänge (etwa 30 cm) ziehen. Mit etwas Abstand auf Backpapier legen.",
            "6) BACKEN: Ober-/Unterhitze 200 °C, 15-18 Minuten, bis sie goldbraun und trocken sind. Sind sie in der Mitte noch weich, 5 Minuten im ausgeschalteten Ofen bei leicht geöffneter Tür lassen.",
            "7) Vollständig auskühlen lassen: in einer Blechdose bleiben sie 2 Wochen knusprig.",
        ]),
        procedure_en="\n".join([
            "1) BIGA, the evening before: 400 g of type 0 flour, 180 g of cold water and 4 g of fresh yeast. Mix roughly, cover and leave 16-18 hours at 16-18 °C.",
            "2) SEEDS: toast 50 g of hulled hemp seeds for 2-3 minutes in a dry pan and let them cool.",
            "3) MIXING: in a stand mixer the biga in pieces, 400 g of water, 450 g of type 0 flour, 150 g of hemp flour and the Miglioratore Naturale Pro. Knead 5 minutes, add the salt (20 g), then the oil (100 g) in a thin stream, a little at a time. Knead until smooth and finally work in the toasted seeds. It's a firm dough: that keeps the breadsticks crunchy.",
            "4) REST: shape a rectangle on a surface dusted with semolina, brush it with oil, cover with cling film and leave 1 hour at room temperature.",
            "5) SHAPING: cut strips 1.5 cm wide. Hold each strip by the ends and stretch it by hand to the length of the tray (about 30 cm). Place them on baking paper, slightly apart.",
            "6) BAKING: conventional oven at 200 °C for 15-18 minutes, until golden and dry. If they're still soft in the middle, leave them 5 minutes in the switched-off oven with the door ajar.",
            "7) Let them cool completely: in a tin they stay crunchy for 2 weeks.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000007",
        name="Crackers alla Canapa", name_de="Hanf-Cracker", name_en="Hemp Crackers", name_es="Crackers de Cáñamo", name_fr="Crackers au Chanvre",
        real_name="Crackers sottili con farina e semi di canapa", real_name_de="Dünne Cracker mit Hanfmehl und Hanfsamen", real_name_en="Thin crackers with hemp flour and hemp seeds",
        real_name_es="Crackers finos con harina y semillas de cáñamo", real_name_fr="Crackers fins à la farine et aux graines de chanvre",
        menu_category="snack", flour_type="Farina tipo 1 80% + farina di canapa 20%",
        flour_type_de="Weizenmehl Type 1050 (ital. Tipo 1) 80 % + Hanfmehl 20 %", flour_type_en="Type 1 wheat flour 80% + hemp flour 20%",
        flour_type_es="Harina tipo 1 80% + harina de cáñamo 20%", flour_type_fr="Farine type 1 80 % + farine de chanvre 20 %",
        flour_grams=1000.0, water_grams=500.0, hydration_percent=50.0, sourdough_grams=0.0, salt_grams=20.0,
        preferment_type="none", method_type="diretto", dough_category="diretto",
        bake_temp=190.0, bake_minutes=16.0, oven_type="statico", mix_minutes=8.0, rest_minutes=30.0,
        bulk_fermentation_hours=None, proofing_hours=None, image_url="/recipes/sn_crackers.webp",
        extra_ingredients=[
            _e("Olio extravergine d'oliva", "Olivenöl extra vergine", "Extra virgin olive oil", "Aceite de oliva virgen extra", "Huile d'olive vierge extra", 12),
            _e("Semi di canapa decorticati (nell'impasto)", "Geschälte Hanfsamen (im Teig)", "Hulled hemp seeds (in the dough)", "Semillas de cáñamo peladas (en la masa)", "Graines de chanvre décortiquées (dans la pâte)", 10),
            SEMI_SOPRA(5), _migl(3),
            _e("Sale in fiocchi (sopra)", "Salzflocken (obenauf)", "Flaky salt (on top)", "Sal en escamas (por encima)", "Sel en flocons (sur le dessus)", 1),
        ],
        notes="Crackers sottili senza lievito, con il 20% di farina di canapa e tanti semi: croccanti, con un profumo di nocciola, buonissimi con i formaggi. Resa: 6 teglie. Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Dünne Cracker ohne Hefe, mit 20 % Hanfmehl und vielen Samen: knusprig, mit Nussduft, herrlich zu Käse. Ergibt 6 Bleche. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Thin crackers with no yeast, 20% hemp flour and plenty of seeds: crunchy, with a nutty aroma, great with cheese. Makes 6 trays. Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) In una ciotola unisci 800 g di farina tipo 1, 200 g di farina di canapa, 100 g di semi di canapa decorticati, il sale (20 g) e il Miglioratore Naturale Pro.",
            "2) Aggiungi 500 g di acqua e 120 g di olio extravergine e impasta 6-8 minuti: deve venire un panetto sodo e liscio. Niente lievito: i crackers restano sottili e croccanti.",
            "3) Copri e lascia riposare 30 minuti: la farina di canapa assorbe l'acqua e l'impasto si stende meglio.",
            "4) STESURA: dividi in 6 pezzi e stendi ogni pezzo sottilissimo (1-2 mm) con il mattarello o con la macchina per la pasta, direttamente su carta forno.",
            "5) Spennella con poca acqua, cospargi con i semi di canapa per sopra e il sale in fiocchi e premi leggermente col mattarello. Taglia a quadrati con la rotella e bucherella con una forchetta, così non si gonfiano.",
            "6) COTTURA: forno statico a 190 °C per 14-18 minuti, finché sono dorati anche al centro. Guardali negli ultimi minuti: i bordi scuriscono in fretta.",
            "7) Falli raffreddare su una griglia: in una scatola di latta restano croccanti per 2-3 settimane.",
        ]),
        procedure_de="\n".join([
            "1) In einer Schüssel 800 g Weizenmehl Type 1050, 200 g Hanfmehl, 100 g geschälte Hanfsamen, das Salz (20 g) und den Miglioratore Naturale Pro mischen.",
            "2) 500 g Wasser und 120 g Olivenöl extra vergine zugeben und 6-8 Minuten kneten: es soll ein fester, glatter Teig werden. Keine Hefe: so bleiben die Cracker dünn und knusprig.",
            "3) Abdecken und 30 Minuten ruhen lassen: das Hanfmehl nimmt das Wasser auf und der Teig lässt sich besser ausrollen.",
            "4) AUSROLLEN: in 6 Stücke teilen und jedes Stück hauchdünn (1-2 mm) mit dem Nudelholz oder der Nudelmaschine ausrollen, direkt auf Backpapier.",
            "5) Mit wenig Wasser bestreichen, mit den Hanfsamen für obenauf und den Salzflocken bestreuen und mit dem Nudelholz leicht andrücken. Mit dem Teigrad in Quadrate schneiden und mit einer Gabel einstechen, damit sie nicht aufgehen.",
            "6) BACKEN: Ober-/Unterhitze 190 °C, 14-18 Minuten, bis sie auch in der Mitte goldbraun sind. In den letzten Minuten zuschauen: die Ränder werden schnell dunkel.",
            "7) Auf einem Gitter auskühlen lassen: in einer Blechdose bleiben sie 2-3 Wochen knusprig.",
        ]),
        procedure_en="\n".join([
            "1) In a bowl combine 800 g of type 1 wheat flour, 200 g of hemp flour, 100 g of hulled hemp seeds, the salt (20 g) and the Miglioratore Naturale Pro.",
            "2) Add 500 g of water and 120 g of extra virgin olive oil and knead 6-8 minutes into a firm, smooth dough. No yeast: the crackers stay thin and crunchy.",
            "3) Cover and rest for 30 minutes: the hemp flour absorbs the water and the dough rolls out more easily.",
            "4) ROLLING: divide into 6 pieces and roll each one very thin (1-2 mm) with a rolling pin or a pasta machine, straight onto baking paper.",
            "5) Brush with a little water, sprinkle with the hemp seeds for the top and the flaky salt, and press lightly with the rolling pin. Cut into squares with a pastry wheel and prick with a fork so they don't puff up.",
            "6) BAKING: conventional oven at 190 °C for 14-18 minutes, until golden in the middle too. Watch them in the last minutes: the edges darken fast.",
            "7) Cool on a rack: in a tin they stay crunchy for 2-3 weeks.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000008",
        name="Friselle alla Canapa", name_de="Hanf-Friselle", name_en="Hemp Friselle", name_es="Friselle de Cáñamo", name_fr="Friselle au Chanvre",
        real_name="Friselle pugliesi con semola e farina di canapa", real_name_de="Apulische Friselle mit Hartweizenmehl und Hanfmehl", real_name_en="Apulian friselle with durum semolina and hemp flour",
        real_name_es="Friselle de Apulia con sémola y harina de cáñamo", real_name_fr="Friselle des Pouilles à la semoule et à la farine de chanvre",
        menu_category="snack", flour_type="Semola rimacinata di grano duro 85% + farina di canapa 15%",
        flour_type_de="Hartweizenmehl (Semola rimacinata) 85 % + Hanfmehl 15 %", flour_type_en="Re-milled durum semolina 85% + hemp flour 15%",
        flour_type_es="Sémola de trigo duro remolida 85% + harina de cáñamo 15%", flour_type_fr="Semoule de blé dur remoulue 85 % + farine de chanvre 15 %",
        flour_grams=1000.0, water_grams=600.0, hydration_percent=60.0, sourdough_grams=150.0, salt_grams=20.0,
        preferment_type="lievito madre", method_type="indiretto", dough_category="indiretto",
        bake_temp=200.0, bake_minutes=45.0, oven_type="statico", mix_minutes=10.0, rest_minutes=None,
        bulk_fermentation_hours=14.0, proofing_hours=1.5, image_url="/recipes/r_friselle.webp",
        extra_ingredients=[_migl(2), OLIO, ACETO, KOKOS, SEMI_TOSTATI(4)],
        notes="Le friselle pugliesi col lievito madre, con il 15% di farina di canapa: due cotture, secche fino al cuore, si conservano per mesi. Resa: circa 15 friselle (30 metà). Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Apulische Friselle mit Sauerteig und 15 % Hanfmehl: zweimal gebacken, durch und durch trocken, monatelang haltbar. Ergibt etwa 15 Friselle (30 Hälften). Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Apulian friselle with sourdough and 15% hemp flour: baked twice, dry to the core, they keep for months. Makes about 15 friselle (30 halves). Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) LIEVITO MADRE: rinfrescalo la mattina e usalo al picco, quando è raddoppiato (3-4 ore a 26-28 °C). Ne servono 150 g.",
            "2) SEMI: tosta 40 g di semi di canapa decorticati 2-3 minuti in una padella asciutta e lasciali raffreddare.",
            "3) IMPASTO: mescola 850 g di semola rimacinata, 150 g di farina di canapa e 560 g di acqua a 25 °C (tieni da parte 40 g). Aggiungi il lievito madre e il Miglioratore Naturale Pro e impasta 8 minuti. Aggiungi il grasso di cocco quando l'impasto è a palla; per ultimi olio d'oliva, aceto di mele e sale, poi i 40 g d'acqua, solo se l'impasto li prende. Alla fine incorpora i semi. L'impasto è piuttosto sodo.",
            "4) PUNTATA: 2 ore a 26 °C, poi 12 ore in frigo a 4 °C, coperto.",
            "5) FORMATURA: fuori dal frigo, dividi in pezzi da 120 g, fai dei filoncini lunghi 25 cm e chiudili ad anello sovrapponendo le punte.",
            "6) APPRETTO: 1-1,5 ore a 26-28 °C, coperte, finché sono gonfie.",
            "7) PRIMA COTTURA: forno statico a 200 °C per 20-25 minuti, finché sono dorate.",
            "8) TAGLIO: da tiepide, tagliale a metà in orizzontale con un coltello seghettato o con un filo.",
            "9) SECONDA COTTURA: rimetti le metà in forno, col taglio verso l'alto, a 160 °C per 20-25 minuti, finché sono secche e croccanti fino al cuore. Falle raffreddare nel forno spento.",
            "10) Si conservano per mesi in un sacchetto di carta o in una latta. Per mangiarle: una passata veloce sotto l'acqua, poi pomodoro, origano, sale e olio.",
        ]),
        procedure_de="\n".join([
            "1) SAUERTEIG: morgens auffrischen und auf dem Höhepunkt verwenden, wenn er sich verdoppelt hat (3-4 Stunden bei 26-28 °C). Du brauchst 150 g.",
            "2) SAMEN: 40 g geschälte Hanfsamen 2-3 Minuten in einer trockenen Pfanne rösten und abkühlen lassen.",
            "3) KNETEN: 850 g Hartweizenmehl, 150 g Hanfmehl und 560 g Wasser mit 25 °C mischen (40 g zurückhalten). Sauerteig und Miglioratore Naturale Pro zugeben und 8 Minuten kneten. Das Kokosfett zugeben, wenn der Teig eine Kugel bildet; zuletzt Olivenöl, Apfelessig und Salz, dann die 40 g Wasser, nur wenn der Teig sie aufnimmt. Zum Schluss die Samen einarbeiten. Der Teig ist eher fest.",
            "4) STOCKGARE: 2 Stunden bei 26 °C, dann 12 Stunden im Kühlschrank bei 4 °C, abgedeckt.",
            "5) FORMEN: aus dem Kühlschrank nehmen, in Stücke zu 120 g teilen, 25 cm lange Stränge rollen und zu Ringen schließen, die Enden übereinander.",
            "6) STÜCKGARE: 1-1,5 Stunden bei 26-28 °C abgedeckt, bis sie aufgegangen sind.",
            "7) ERSTES BACKEN: Ober-/Unterhitze 200 °C, 20-25 Minuten, bis sie goldbraun sind.",
            "8) SCHNEIDEN: lauwarm waagerecht halbieren, mit einem Sägemesser oder einem Faden.",
            "9) ZWEITES BACKEN: die Hälften mit der Schnittfläche nach oben wieder in den Ofen, bei 160 °C 20-25 Minuten, bis sie durch und durch trocken und knusprig sind. Im ausgeschalteten Ofen abkühlen lassen.",
            "10) Sie halten monatelang in einer Papiertüte oder Blechdose. Zum Essen: kurz unter Wasser halten, dann Tomate, Oregano, Salz und Öl.",
        ]),
        procedure_en="\n".join([
            "1) STARTER: feed it in the morning and use it at its peak, when doubled (3-4 hours at 26-28 °C). You need 150 g.",
            "2) SEEDS: toast 40 g of hulled hemp seeds for 2-3 minutes in a dry pan and let them cool.",
            "3) MIXING: mix 850 g of re-milled durum semolina, 150 g of hemp flour and 560 g of water at 25 °C (keep back 40 g). Add the starter and the Miglioratore Naturale Pro and knead 8 minutes. Add the coconut fat once the dough forms a ball; olive oil, apple cider vinegar and salt go in last, then the 40 g of water, only if the dough takes it. Finally work in the seeds. The dough is fairly firm.",
            "4) BULK: 2 hours at 26 °C, then 12 hours in the fridge at 4 °C, covered.",
            "5) SHAPING: out of the fridge, divide into 120 g pieces, roll ropes 25 cm long and close them into rings, overlapping the ends.",
            "6) FINAL PROOF: 1-1.5 hours at 26-28 °C, covered, until puffy.",
            "7) FIRST BAKE: conventional oven at 200 °C for 20-25 minutes, until golden.",
            "8) CUTTING: while lukewarm, cut them in half horizontally with a serrated knife or a thread.",
            "9) SECOND BAKE: put the halves back in the oven, cut side up, at 160 °C for 20-25 minutes, until dry and crunchy to the core. Let them cool in the switched-off oven.",
            "10) They keep for months in a paper bag or a tin. To eat them: a quick rinse under the tap, then tomato, oregano, salt and oil.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000009",
        name="Pane in Cassetta alla Canapa", name_de="Hanf-Kastenbrot", name_en="Hemp Sandwich Loaf", name_es="Pan de Molde de Cáñamo", name_fr="Pain de Mie au Chanvre",
        real_name="Pane morbido in stampo con farina di canapa", real_name_de="Weiches Kastenbrot mit Hanfmehl", real_name_en="Soft tin loaf with hemp flour",
        real_name_es="Pan de molde tierno con harina de cáñamo", real_name_fr="Pain de mie moelleux à la farine de chanvre",
        menu_category="pane", flour_type="Farina tipo 0 (W 260-280) 88% + farina di canapa 12%",
        flour_type_de="Weizenmehl Type 550 (ital. Tipo 0) 88 % + Hanfmehl 12 %", flour_type_en="Type 0 wheat flour 88% + hemp flour 12%",
        flour_type_es="Harina tipo 0 88% + harina de cáñamo 12%", flour_type_fr="Farine type 0 88 % + farine de chanvre 12 %",
        flour_grams=1000.0, water_grams=700.0, hydration_percent=70.0, sourdough_grams=0.0, salt_grams=20.0,
        preferment_type="poolish", method_type="indiretto", dough_category="indiretto",
        biga={"flour_g": 300, "water_g": 300, "yeast_g": 1, "hours": "12-16 ore a 18-20 °C", "hours_de": "12-16 Std. bei 18-20 °C", "hours_en": "12-16 h at 18-20 °C", "show": True, "kind": "poolish"},
        bake_temp=200.0, bake_minutes=38.0, oven_type="statico", mix_minutes=14.0, rest_minutes=None,
        bulk_fermentation_hours=1.0, proofing_hours=1.75, image_url="/recipes/p_pancassetta.webp",
        extra_ingredients=[
            _e("Patata lessa schiacciata (fredda)", "Gekochte, gestampfte Kartoffel (kalt)", "Boiled mashed potato (cold)", "Patata cocida machacada (fría)", "Pomme de terre cuite écrasée (froide)", 10),
            LIEVITO_FINALE(0.5), _migl(2), OLIO, ACETO, KOKOS, SEMI_SOPRA(3),
        ],
        notes="Pane morbido in stampo, per tramezzini e colazioni, col poolish, la patata lessa e il 12% di farina di canapa: fetta compatta, mollica umida che dura giorni. Resa: 2 stampi da circa 930 g di impasto. Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Weiches Kastenbrot für Sandwiches und Frühstück, mit Poolish, gekochter Kartoffel und 12 % Hanfmehl: feine Scheiben, saftige Krume, die tagelang hält. Ergibt 2 Formen zu etwa 930 g Teig. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Soft tin loaf for sandwiches and breakfast, with poolish, boiled potato and 12% hemp flour: even slices and a moist crumb that lasts for days. Makes 2 tins of about 930 g of dough. Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) POOLISH, la sera prima: 300 g di farina tipo 0, 300 g di acqua e 1 g di lievito di birra fresco. Mescola fino a una pastella liscia, copri e lascia 12-16 ore a 18-20 °C, finché è pieno di bolle.",
            "2) PATATA: lessa 130 g di patate farinose con la buccia, pelale e schiacciale (ne servono 100 g). Lasciale raffreddare sotto i 30 °C.",
            "3) IMPASTO: in planetaria il poolish, 360 g di acqua fredda, 580 g di farina tipo 0, 120 g di farina di canapa, 5 g di lievito fresco e il Miglioratore Naturale Pro. Impasta 8 minuti a velocità bassa. Aggiungi la patata e il grasso di cocco quando l'impasto è a palla; per ultimi olio d'oliva, aceto di mele e sale, poi gli ultimi 40 g d'acqua a filo. Impasta finché fa il velo. Temperatura finale 25-26 °C.",
            "4) PUNTATA: 1 ora coperto, con una piega a metà.",
            "5) FORMATURA: ungi 2 stampi da cassetta (circa 25×11 cm). Dividi l'impasto in 2 pezzi da circa 930 g, arrotolali stretti come un salame e mettili negli stampi, con la chiusura sotto. Spennella con acqua e cospargi con i semi di canapa.",
            "6) APPRETTO: 1,5-2 ore a 26-28 °C, finché l'impasto arriva a 1 cm dal bordo.",
            "7) COTTURA: forno statico a 200 °C per 35-40 minuti. È cotto quando al cuore segna 94-96 °C. Sforna, togli dagli stampi e fai raffreddare su una griglia.",
            "8) Per fette perfette taglialo il giorno dopo: chiuso in un sacchetto resta morbido 4-5 giorni.",
        ]),
        procedure_de="\n".join([
            "1) POOLISH, am Vorabend: 300 g Weizenmehl Type 550, 300 g Wasser und 1 g frische Hefe. Zu einem glatten Teig rühren, abdecken und 12-16 Stunden bei 18-20 °C stehen lassen, bis er voller Blasen ist.",
            "2) KARTOFFEL: 130 g mehligkochende Kartoffeln mit Schale kochen, schälen und zerdrücken (du brauchst 100 g). Unter 30 °C abkühlen lassen.",
            "3) KNETEN: in der Küchenmaschine den Poolish, 360 g kaltes Wasser, 580 g Weizenmehl Type 550, 120 g Hanfmehl, 5 g frische Hefe und den Miglioratore Naturale Pro. 8 Minuten langsam kneten. Kartoffel und Kokosfett zugeben, wenn der Teig eine Kugel bildet; zuletzt Olivenöl, Apfelessig und Salz, dann die letzten 40 g Wasser in dünnem Strahl. Kneten, bis der Teig das Fenster zeigt. Teigtemperatur 25-26 °C.",
            "4) STOCKGARE: 1 Stunde abgedeckt, nach der Hälfte einmal falten.",
            "5) FORMEN: 2 Kastenformen (etwa 25×11 cm) einfetten. Den Teig in 2 Stücke zu etwa 930 g teilen, straff aufrollen und mit dem Schluss nach unten in die Formen legen. Mit Wasser bestreichen und mit Hanfsamen bestreuen.",
            "6) STÜCKGARE: 1,5-2 Stunden bei 26-28 °C, bis der Teig 1 cm unter dem Rand ist.",
            "7) BACKEN: Ober-/Unterhitze 200 °C, 35-40 Minuten. Es ist durch, wenn es im Kern 94-96 °C hat. Aus dem Ofen nehmen, aus den Formen lösen und auf einem Gitter auskühlen lassen.",
            "8) Für schöne Scheiben am nächsten Tag anschneiden: in einer Tüte bleibt es 4-5 Tage weich.",
        ]),
        procedure_en="\n".join([
            "1) POOLISH, the evening before: 300 g of type 0 flour, 300 g of water and 1 g of fresh yeast. Stir to a smooth batter, cover and leave 12-16 hours at 18-20 °C, until full of bubbles.",
            "2) POTATO: boil 130 g of floury potatoes in their skins, peel and mash them (you need 100 g). Let them cool below 30 °C.",
            "3) MIXING: in a stand mixer the poolish, 360 g of cold water, 580 g of type 0 flour, 120 g of hemp flour, 5 g of fresh yeast and the Miglioratore Naturale Pro. Knead 8 minutes on low speed. Add the potato and the coconut fat once the dough forms a ball; olive oil, apple cider vinegar and salt go in last, then the last 40 g of water in a thin stream. Knead until it passes the windowpane test. Final dough temperature 25-26 °C.",
            "4) BULK: 1 hour covered, with one fold halfway.",
            "5) SHAPING: grease 2 loaf tins (about 25×11 cm). Divide the dough into 2 pieces of about 930 g, roll them up tightly and place them in the tins, seam side down. Brush with water and sprinkle with hemp seeds.",
            "6) FINAL PROOF: 1.5-2 hours at 26-28 °C, until the dough is 1 cm below the rim.",
            "7) BAKING: conventional oven at 200 °C for 35-40 minutes. It's done when the core reads 94-96 °C. Take it out, unmould and cool on a rack.",
            "8) For neat slices cut it the next day: kept in a bag it stays soft for 4-5 days.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000010",
        name="Biscotti alla Canapa", name_de="Hanfkekse", name_en="Hemp Cookies", name_es="Galletas de Cáñamo", name_fr="Biscuits au Chanvre",
        real_name="Frollini con farina e semi di canapa", real_name_de="Mürbekekse mit Hanfmehl und Hanfsamen", real_name_en="Shortbread cookies with hemp flour and hemp seeds",
        real_name_es="Galletas de mantequilla con harina y semillas de cáñamo", real_name_fr="Sablés à la farine et aux graines de chanvre",
        menu_category="pasticceria", flour_type="Farina tipo 00 80% + farina di canapa 20%",
        flour_type_de="Weizenmehl Type 405 (ital. Tipo 00) 80 % + Hanfmehl 20 %", flour_type_en="Type 00 wheat flour 80% + hemp flour 20%",
        flour_type_es="Harina tipo 00 80% + harina de cáñamo 20%", flour_type_fr="Farine type 00 80 % + farine de chanvre 20 %",
        flour_grams=1000.0, water_grams=0.0, hydration_percent=None, sourdough_grams=0.0, salt_grams=2.0,
        preferment_type="none", method_type="diretto", dough_category="diretto",
        bake_temp=170.0, bake_minutes=13.0, oven_type="statico", mix_minutes=5.0, rest_minutes=60.0,
        bulk_fermentation_hours=None, proofing_hours=None, image_url="/recipes/v132_biscotti_canapa.webp",
        extra_ingredients=[
            _e("Burro freddo a pezzetti", "Kalte Butter in Stückchen", "Cold butter, diced", "Mantequilla fría en dados", "Beurre froid en dés", 45),
            _e("Zucchero a velo", "Puderzucker", "Icing sugar", "Azúcar glas", "Sucre glace", 35),
            _e("Uova intere", "Ganze Eier", "Whole eggs", "Huevos enteros", "Œufs entiers", 20),
            _e("Semi di canapa decorticati (tostati)", "Geschälte Hanfsamen (geröstet)", "Hulled hemp seeds (toasted)", "Semillas de cáñamo peladas (tostadas)", "Graines de chanvre décortiquées (grillées)", 5),
            _e("Lievito per dolci", "Backpulver", "Baking powder", "Levadura química", "Levure chimique", 1),
            _e("Scorza di limone grattugiata", "Abgeriebene Zitronenschale", "Grated lemon zest", "Ralladura de limón", "Zeste de citron râpé", 0.5),
        ],
        notes="Frollini con il 20% di farina di canapa e i semi tostati: friabili, dorati, con un profumo di nocciola. Resa: circa 160 biscotti; per metà dose scegli 500 g di farina. Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Mürbekekse mit 20 % Hanfmehl und gerösteten Samen: mürbe, goldgelb, mit Nussduft. Ergibt etwa 160 Kekse; für die halbe Menge 500 g Mehl wählen. Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Shortbread cookies with 20% hemp flour and toasted seeds: crumbly, golden, with a nutty aroma. Makes about 160 cookies; for half a batch choose 500 g of flour. Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) SEMI: tosta 50 g di semi di canapa decorticati 2-3 minuti in una padella asciutta e lasciali raffreddare.",
            "2) SABBIATURA: in una ciotola (o in planetaria con la foglia) lavora 800 g di farina 00, 200 g di farina di canapa e 450 g di burro freddo a pezzetti, finché diventa una sabbia fine. Fallo in fretta: il burro non deve scaldarsi.",
            "3) IMPASTO: aggiungi 350 g di zucchero a velo, il sale (2 g), il lievito per dolci (10 g) e la scorza di limone, poi le uova (200 g, circa 4). Impasta solo il tempo di compattare e alla fine incorpora i semi tostati. Più lo lavori, più diventa duro.",
            "4) RIPOSO: appiattisci l'impasto in due panetti, avvolgili nella pellicola e lasciali 1 ora in frigo.",
            "5) FORMATURA: stendi a 5 mm tra due fogli di carta forno e taglia con un coppapasta tondo di 5-6 cm. Metti i biscotti sulla teglia con carta forno, un po' distanziati.",
            "6) COTTURA: forno statico a 170 °C per 12-14 minuti, finché i bordi sono appena dorati. Da caldi sono morbidi: diventano friabili raffreddandosi.",
            "7) Lasciali 5 minuti sulla teglia, poi su una griglia. In una scatola di latta si conservano 2 settimane.",
        ]),
        procedure_de="\n".join([
            "1) SAMEN: 50 g geschälte Hanfsamen 2-3 Minuten in einer trockenen Pfanne rösten und abkühlen lassen.",
            "2) KRÜMELN: in einer Schüssel (oder in der Küchenmaschine mit dem Flachrührer) 800 g Weizenmehl Type 405, 200 g Hanfmehl und 450 g kalte Butter in Stückchen verarbeiten, bis feine Krümel entstehen. Schnell arbeiten: die Butter darf nicht warm werden.",
            "3) TEIG: 350 g Puderzucker, das Salz (2 g), das Backpulver (10 g) und die Zitronenschale zugeben, dann die Eier (200 g, etwa 4). Nur so lange kneten, bis der Teig zusammenhält, und zum Schluss die gerösteten Samen einarbeiten. Je länger du knetest, desto härter werden die Kekse.",
            "4) RUHE: den Teig zu zwei flachen Platten drücken, in Folie wickeln und 1 Stunde in den Kühlschrank legen.",
            "5) FORMEN: zwischen zwei Backpapieren 5 mm dick ausrollen und mit einem runden Ausstecher (5-6 cm) ausstechen. Mit etwas Abstand auf ein Blech mit Backpapier legen.",
            "6) BACKEN: Ober-/Unterhitze 170 °C, 12-14 Minuten, bis die Ränder gerade goldgelb sind. Warm sind sie weich: beim Abkühlen werden sie mürbe.",
            "7) 5 Minuten auf dem Blech lassen, dann auf ein Gitter. In einer Blechdose halten sie 2 Wochen.",
        ]),
        procedure_en="\n".join([
            "1) SEEDS: toast 50 g of hulled hemp seeds for 2-3 minutes in a dry pan and let them cool.",
            "2) RUBBING IN: in a bowl (or a stand mixer with the paddle) work 800 g of type 00 flour, 200 g of hemp flour and 450 g of cold diced butter until it looks like fine sand. Work fast: the butter mustn't get warm.",
            "3) DOUGH: add 350 g of icing sugar, the salt (2 g), the baking powder (10 g) and the lemon zest, then the eggs (200 g, about 4). Knead only until it holds together and finally work in the toasted seeds. The more you work it, the harder the cookies get.",
            "4) REST: flatten the dough into two discs, wrap them in cling film and chill for 1 hour.",
            "5) SHAPING: roll to 5 mm between two sheets of baking paper and cut with a 5-6 cm round cutter. Place the cookies on a lined tray, slightly apart.",
            "6) BAKING: conventional oven at 170 °C for 12-14 minutes, until the edges are just golden. Warm they're soft: they turn crumbly as they cool.",
            "7) Leave them 5 minutes on the tray, then move to a rack. In a tin they keep for 2 weeks.",
        ]),
    ),
    _base(
        id="1f3f6a2e-8c0d-5b7e-9a41-0c132a000011",
        name="Cantucci alla Canapa", name_de="Hanf-Cantucci", name_en="Hemp Cantucci", name_es="Cantucci de Cáñamo", name_fr="Cantucci au Chanvre",
        real_name="Cantucci con mandorle e semi di canapa", real_name_de="Cantucci mit Mandeln und Hanfsamen", real_name_en="Cantucci with almonds and hemp seeds",
        real_name_es="Cantucci con almendras y semillas de cáñamo", real_name_fr="Cantucci aux amandes et aux graines de chanvre",
        menu_category="pasticceria", flour_type="Farina tipo 00 85% + farina di canapa 15%",
        flour_type_de="Weizenmehl Type 405 (ital. Tipo 00) 85 % + Hanfmehl 15 %", flour_type_en="Type 00 wheat flour 85% + hemp flour 15%",
        flour_type_es="Harina tipo 00 85% + harina de cáñamo 15%", flour_type_fr="Farine type 00 85 % + farine de chanvre 15 %",
        flour_grams=1000.0, water_grams=0.0, hydration_percent=None, sourdough_grams=0.0, salt_grams=2.0,
        preferment_type="none", method_type="diretto", dough_category="diretto",
        bake_temp=180.0, bake_minutes=37.0, oven_type="statico", mix_minutes=5.0, rest_minutes=None,
        bulk_fermentation_hours=None, proofing_hours=None, image_url="/recipes/v132_cantucci_canapa.webp",
        extra_ingredients=[
            _e("Zucchero", "Zucker", "Sugar", "Azúcar", "Sucre", 60),
            _e("Uova intere", "Ganze Eier", "Whole eggs", "Huevos enteros", "Œufs entiers", 40),
            _e("Mandorle intere con la buccia", "Ganze Mandeln mit Haut", "Whole skin-on almonds", "Almendras enteras con piel", "Amandes entières avec la peau", 30),
            _e("Semi di canapa decorticati", "Geschälte Hanfsamen", "Hulled hemp seeds", "Semillas de cáñamo peladas", "Graines de chanvre décortiquées", 10),
            _e("Burro fuso", "Geschmolzene Butter", "Melted butter", "Mantequilla derretida", "Beurre fondu", 5),
            _e("Lievito per dolci", "Backpulver", "Baking powder", "Levadura química", "Levure chimique", 1.6),
            _e("Scorza d'arancia grattugiata", "Abgeriebene Orangenschale", "Grated orange zest", "Ralladura de naranja", "Zeste d'orange râpé", 0.5),
        ],
        notes="I cantucci toscani con le mandorle e i semi di canapa, con il 15% di farina di canapa: due cotture, croccanti, da inzuppare. Resa: circa 150 cantucci. Contengono frutta a guscio (mandorle). Usa solo farina e semi di canapa venduti come alimenti.\n\n" + _SITOR_IT,
        notes_de="Toskanische Cantucci mit Mandeln und Hanfsamen, mit 15 % Hanfmehl: zweimal gebacken, knusprig, zum Eintunken. Ergibt etwa 150 Cantucci. Enthalten Schalenfrüchte (Mandeln). Verwende nur Hanfmehl und Hanfsamen, die als Lebensmittel verkauft werden.\n\n" + _SITOR_DE,
        notes_en="Tuscan cantucci with almonds and hemp seeds, with 15% hemp flour: baked twice, crunchy, for dunking. Makes about 150 cantucci. They contain tree nuts (almonds). Use only hemp flour and seeds sold as food.\n\n" + _SITOR_EN,
        procedure="\n".join([
            "1) In una ciotola mescola 850 g di farina 00, 150 g di farina di canapa, 600 g di zucchero, il lievito per dolci (16 g), il sale (2 g) e la scorza d'arancia.",
            "2) Aggiungi le uova (400 g, circa 8) e il burro fuso tiepido (50 g). Impasta solo finché è compatto: è un impasto appiccicoso, bagnati le mani con un po' d'acqua.",
            "3) Unisci le mandorle intere (300 g) e i semi di canapa (100 g) e distribuiscili bene.",
            "4) FORMATURA: dividi in 6 pezzi e forma dei filoni larghi 4-5 cm e alti 2 cm. Mettili sulla teglia con carta forno, ben distanziati: in forno si allargano.",
            "5) PRIMA COTTURA: forno statico a 180 °C per 22-25 minuti, finché sono dorati e sodi al tatto.",
            "6) TAGLIO: lasciali intiepidire 10 minuti, poi tagliali in diagonale a fette di 1,5 cm con un coltello seghettato.",
            "7) SECONDA COTTURA: rimetti le fette in forno, sdraiate, a 150 °C per 10-12 minuti, girandole a metà, finché sono secche.",
            "8) Falli raffreddare del tutto: in una scatola di latta si conservano un mese. Sono buoni col vino dolce, col caffè o col latte.",
        ]),
        procedure_de="\n".join([
            "1) In einer Schüssel 850 g Weizenmehl Type 405, 150 g Hanfmehl, 600 g Zucker, das Backpulver (16 g), das Salz (2 g) und die Orangenschale mischen.",
            "2) Die Eier (400 g, etwa 8) und die lauwarme geschmolzene Butter (50 g) zugeben. Nur kneten, bis der Teig zusammenhält: er ist klebrig, mach dir die Hände mit etwas Wasser nass.",
            "3) Die ganzen Mandeln (300 g) und die Hanfsamen (100 g) zugeben und gut verteilen.",
            "4) FORMEN: in 6 Stücke teilen und Stränge von 4-5 cm Breite und 2 cm Höhe formen. Mit viel Abstand auf ein Blech mit Backpapier legen: im Ofen laufen sie breit.",
            "5) ERSTES BACKEN: Ober-/Unterhitze 180 °C, 22-25 Minuten, bis sie goldbraun und fest sind.",
            "6) SCHNEIDEN: 10 Minuten abkühlen lassen, dann schräg in 1,5 cm dicke Scheiben schneiden, mit einem Sägemesser.",
            "7) ZWEITES BACKEN: die Scheiben liegend zurück in den Ofen, bei 150 °C 10-12 Minuten, nach der Hälfte wenden, bis sie trocken sind.",
            "8) Vollständig auskühlen lassen: in einer Blechdose halten sie einen Monat. Gut zu Dessertwein, Kaffee oder Milch.",
        ]),
        procedure_en="\n".join([
            "1) In a bowl mix 850 g of type 00 flour, 150 g of hemp flour, 600 g of sugar, the baking powder (16 g), the salt (2 g) and the orange zest.",
            "2) Add the eggs (400 g, about 8) and the lukewarm melted butter (50 g). Mix only until it holds together: it's a sticky dough, wet your hands with a little water.",
            "3) Add the whole almonds (300 g) and the hemp seeds (100 g) and spread them evenly.",
            "4) SHAPING: divide into 6 pieces and shape logs 4-5 cm wide and 2 cm high. Place them on a lined tray, well apart: they spread in the oven.",
            "5) FIRST BAKE: conventional oven at 180 °C for 22-25 minutes, until golden and firm to the touch.",
            "6) CUTTING: let them cool for 10 minutes, then slice diagonally 1.5 cm thick with a serrated knife.",
            "7) SECOND BAKE: put the slices back in the oven, lying flat, at 150 °C for 10-12 minutes, turning them halfway, until dry.",
            "8) Let them cool completely: in a tin they keep for a month. Lovely with dessert wine, coffee or milk.",
        ]),
    ),
]
NOMI_NUOVE = [r["name"] for r in NUOVE]

# ---- La frase del vecchio miglioratore: in 16 procedimenti elencava ingredienti che nella ricetta non ci sono ----
FRASE_IT = "(glutine, malto, lino dorato, psillio, fiocchi di patate, Miglioratore Naturale Pro)"
_OLD = {
    "procedure": FRASE_IT,
    "procedure_de": "(Gluten, Malz, goldener Lein, Psyllium, Kartoffelflocken, Backmittel)",
    "procedure_en": "(gluten, malt, golden flax, psyllium, potato flakes, Natural Improver Pro)",
    "procedure_es": "(gluten, malta, lino dorado, psilio, copos de patata, Miglioratore Naturale Pro)",
    "procedure_fr": "(gluten, malt, lin doré, psyllium, flocons de pomme de terre, Miglioratore Naturale Pro)",
    "procedure_fa": "(گلوتن، مالت، دانه کتان طلایی، پسیلیوم، پولک سیب‌زمینی، Miglioratore Naturale Pro)",
}
_CAMPI = list(_OLD.keys())


def _w(it, de, en, es, fr, fa):
    return dict(zip(_CAMPI, [it, de, en, es, fr, fa]))


_ITEMS = [
    (r"glutin", _w("glutine", "Gluten", "gluten", "gluten", "gluten", "گلوتن")),
    (r"\bmalto\b|\bmalz\b", _w("malto", "Malz", "malt", "malta", "malt", "مالت")),
    (r"\blino\b", _w("lino dorato", "goldener Lein", "golden flax", "lino dorado", "lin doré", "دانه کتان طلایی")),
    (r"psyll|psill", _w("psillio", "Psyllium", "psyllium", "psilio", "psyllium", "پسیلیوم")),
    (r"fiocchi di patate|kart\.?\s?fl", _w("fiocchi di patate", "Kartoffelflocken", "potato flakes", "copos de patata", "flocons de pomme de terre", "پولک سیب‌زمینی")),
    (r"migliorator", _w("Miglioratore Naturale Pro", "Backmittel", "Natural Improver Pro", "Miglioratore Naturale Pro", "Miglioratore Naturale Pro", "Miglioratore Naturale Pro")),
]


def correggi_frase_miglioratore(r: dict) -> dict:
    """Restituisce solo i campi da aggiornare: la parentesi elenca gli ingredienti secchi che la ricetta ha davvero."""
    nomi = " ".join(str((e or {}).get("name") or "") for e in (r.get("extra_ingredients") or []) if isinstance(e, dict)).lower()
    presenti = [w for rx, w in _ITEMS if _re.search(rx, nomi, _re.I)]
    upd = {}
    for campo, vecchio in _OLD.items():
        testo = r.get(campo)
        if not isinstance(testo, str) or vecchio not in testo:
            continue
        sep = "، " if campo == "procedure_fa" else ", "
        parole = [w[campo] for w in presenti]
        if parole:
            nuovo = testo.replace(vecchio, "(" + sep.join(parole) + ")")
        else:
            nuovo = testo.replace(" " + vecchio, "").replace(vecchio, "")
        if nuovo != testo:
            upd[campo] = nuovo
    return upd


# ---- «Kokosfett» tradotto: nelle pagine italiane «grasso di cocco», in inglese «coconut fat» (il tedesco resta Kokosfett) ----
def _kk_it(t):
    t = t.replace("KOKOSFETT, OLIO E ACETO", "GRASSO DI COCCO, OLIO E ACETO")
    t = _re.sub(r"\b([Ii]l) Kokosfett\b", lambda m: m.group(1) + " grasso di cocco", t)
    t = _re.sub(r"(?<!\()\bKokosfett\b", "grasso di cocco", t)
    return _re.sub(r"\bKOKOSFETT\b", "GRASSO DI COCCO", t)


def _kk_en(t):
    t = _re.sub(r"\b([Tt]he) Kokosfett\b", lambda m: m.group(1) + " coconut fat", t)
    t = _re.sub(r"(?<!\()\bKokosfett\b", "coconut fat", t)
    return _re.sub(r"\bKOKOSFETT\b", "COCONUT FAT", t)


def _kk_es(t):
    t = _re.sub(r"\b([Ee])l Kokosfett\b", lambda m: ("L" if m.group(1) == "E" else "l") + "a grasa de coco", t)
    t = _re.sub(r"(?<!\()\bKokosfett\b", "grasa de coco", t)
    return _re.sub(r"\bKOKOSFETT\b", "GRASA DE COCO", t)


def _kk_fr(t):
    t = _re.sub(r"\b([Ll])e Kokosfett\b", lambda m: m.group(1) + "a graisse de coco", t)
    t = _re.sub(r"(?<!\()\bKokosfett\b", "graisse de coco", t)
    return _re.sub(r"\bKOKOSFETT\b", "GRAISSE DE COCO", t)


def _kk_fa(t):
    return t.replace("Kokosfett", "چربی نارگیل").replace("KOKOSFETT", "چربی نارگیل")


KK_LINGUA = {"it": _kk_it, "en": _kk_en, "es": _kk_es, "fr": _kk_fr, "fa": _kk_fa}
_KK_CAMPI = {"procedure": _kk_it, "notes": _kk_it, "procedure_en": _kk_en, "notes_en": _kk_en, "procedure_es": _kk_es, "notes_es": _kk_es,
             "procedure_fr": _kk_fr, "notes_fr": _kk_fr, "procedure_fa": _kk_fa, "notes_fa": _kk_fa}


def traduci_kokosfett(r: dict) -> dict:
    """Restituisce solo i campi da aggiornare. Il nome dell'ingrediente in italiano diventa «Grasso di cocco (Kokosfett)»,
    come «Olio d'oliva (Öl)»: italiano davanti e il nome tedesco tra parentesi per trovarlo al supermercato."""
    upd = {}
    for campo, f in _KK_CAMPI.items():
        v = r.get(campo)
        if isinstance(v, str) and "kokosfett" in v.lower():
            nv = f(v)
            if nv != v:
                upd[campo] = nv
    ex = r.get("extra_ingredients")
    if isinstance(ex, list) and any(isinstance(e, dict) and str(e.get("name") or "").strip() == "Kokosfett" for e in ex):
        upd["extra_ingredients"] = [dict(e, name="Grasso di cocco (Kokosfett)") if isinstance(e, dict) and str(e.get("name") or "").strip() == "Kokosfett" else e for e in ex]
    return upd


def traduci_testi(o, f):
    """Per i corsi salvati: cambia soltanto il testo dentro le stringhe, la struttura resta uguale."""
    if isinstance(o, str):
        return f(o) if "kokosfett" in o.lower() else o
    if isinstance(o, list):
        return [traduci_testi(x, f) for x in o]
    if isinstance(o, dict):
        return {k: traduci_testi(v, f) for k, v in o.items()}
    return o
