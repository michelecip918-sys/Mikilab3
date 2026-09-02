import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick } from "@/i18n/triMaps";
import { MikiAvatar } from "@/components/MikiAvatar";
import { SECTIONS as METODI_SECTIONS } from "@/sections/GuidaMetodi";

// Enciclopedia del mio pane: ingredienti, prefermenti e — soprattutto — le spiegazioni
// tecniche dei termini che compaiono nei procedimenti e che possono essere difficili da capire.
export const ENC_ENTRIES = {
  it: [
    { t: "Miglioratore Naturale Pro", b: "Per tutti gli impasti (metodo Diretto e Indiretto) si utilizza unicamente il Miglioratore Naturale Pro al 2% sul peso della farina. Un'unica formula universale per garantire spinta, tenuta e morbidezza." },
    { t: "Lievito Madre / Licoli (Liko)", b: "Pasta madre solida (idr. 45-50%) o Licoli in coltura liquida (idr. 100%, più reattivo). Mantenuta viva con rinfreschi regolari. Nei pani 15-20% sul peso farina, con Licoli fino al 25-35%; nei grandi lievitati 25-30%." },
    { t: "Lievito Madre di Segale", b: "Sauerteig di segale, più acido e attivo (idratazione 100%, liquido). Fermenta 12-16 h a 26-28°C. Perfetto per pani di segale e misti (20-30% sulla farina)." },
    { t: "Kochstück (con Haferflocken)", b: "Fiocchi d'avena (Haferflocken) cotti con acqua e sale (1:4) fino a crema densa, poi raffreddati. Trattengono acqua: pane più morbido e a lunga durata. Aggiungi 10-20% sul peso farina riducendo un po' l'acqua." },
    { t: "Biga", b: "Prefermento solido italiano (poca acqua, ~45%). Dà forza e struttura all'impasto, aroma pulito. Ottima per grandi lievitati e pani molto idratati." },
    { t: "Quellstück (ammollo semi)", b: "Semi e cereali in ammollo la sera prima. Idratano, non rubano acqua all'impasto e non spezzano il glutine. Fondamentale per pani ai semi." },
    { t: "Malto", b: "Da cereale germinato: nutre i lieviti e dà colore e croccantezza alla crosta. Il malto diastasico è il più 'forte' — dosalo con cura. È già incluso nel Miglioratore Naturale Pro." },
    { t: "Autolisi", b: "Riposo di farina + acqua (senza lievito e sale) per 20-60 min prima di impastare. Sviluppa il glutine da solo: impasto più estensibile e meno lavorazione." },
    { t: "Idratazione", b: "Percentuale di acqua sul peso della farina. Più alta = alveolatura aperta ma impasto più difficile. Adattala alla farina (W) e al metodo." },
    { t: "Incordatura", b: "Fase in cui il glutine si sviluppa completamente: l'impasto diventa liscio, elastico e si stacca dalla ciotola o dal gancio. È 'in corda' quando tirandone un lembo forma un velo sottile senza rompersi." },
    { t: "Prova del velo", b: "Test per capire se l'impasto è pronto: stendi un pezzetto tra le dita. Se forma una membrana sottile e traslucida senza strapparsi, la maglia glutinica è sviluppata." },
    { t: "Puntata (lievitazione in massa)", b: "Prima lievitazione di tutto l'impasto, subito dopo l'impastamento e prima dello staglio. Qui si sviluppano forza e aroma: durata e temperatura decidono il resto della lavorazione." },
    { t: "Apretto (lievitazione finale)", b: "Lievitazione finale dei pezzi già formati, prima della cottura. Il pane è pronto quando, premendo delicatamente con un dito, l'impronta risale lentamente." },
    { t: "Staglio", b: "Divisione dell'impasto in pezzi del peso voluto. Taglia netto con la spatola/tarocco, senza strappare, per non rovinare la maglia glutinica." },
    { t: "Pirlatura / Preforma", b: "Arrotondamento dei pezzi per dare tensione e forma. Crea una 'pelle' liscia in superficie che trattiene i gas durante la lievitazione." },
    { t: "Pieghe (stretch & fold)", b: "Serie di pieghe durante la puntata (ogni 30-45 min) per rinforzare l'impasto senza impastare a lungo. Aumentano forza ed estensibilità, utili sugli impasti molto idratati." },
    { t: "Temperatura finale impasto (TFI)", b: "La temperatura dell'impasto a fine lavorazione (ideale 24-26°C). Regola la velocità di lievitazione. Si controlla soprattutto con la temperatura dell'acqua." },
    { t: "Fermolievitazione (frigo)", b: "Lievitazione lenta in frigo (4-6°C) per molte ore. Sviluppa aroma e digeribilità e permette di gestire i tempi del laboratorio: cuoci quando vuoi." },
    { t: "Rinfresco del lievito madre", b: "Nutrire il lievito madre con farina e acqua per tenerlo attivo. In genere 1:1:1 (madre:farina:acqua). Rinfresca 3-4 h prima dell'uso, quando raddoppia." },
    { t: "Cottura con vapore", b: "Vapore nei primi minuti: mantiene la crosta morbida così il pane si espande al massimo (spinta di forno) e sviluppa una crosta lucida e croccante. Poi apri la valvola per asciugare." },
    { t: "Valvola del forno (tiraggio)", b: "Regola l'umidità in cottura. Chiusa a inizio cottura per trattenere il vapore, aperta nella seconda metà per asciugare e rendere la crosta croccante." },
    { t: "Maglia glutinica e alveolatura", b: "La 'rete' di glutine trattiene i gas della fermentazione e forma i buchi (alveoli). Ben sviluppata + alta idratazione = alveolatura aperta e mollica soffice." },
    { t: "Forza della farina (W e P/L)", b: "W misura la forza della farina (capacità di reggere lunghe lievitazioni): più alto = più forte. P/L è l'equilibrio tenacità/estensibilità (ideale ~0,5-0,6). Farine forti per grandi lievitati, deboli per prodotti friabili." },
    { t: "Quando aggiungere il sale", b: "Il sale rinforza il glutine e frena la fermentazione. In genere si aggiunge a fine impasto (o dopo l'autolisi) per non rallentare lo sviluppo della maglia. Dose tipica 2% sulla farina." },
    { t: "Spinta di forno (oven spring)", b: "L'espansione rapida del pane nei primi minuti di cottura, quando gas e vapore si dilatano. Dipende da buona lievitazione, taglio e vapore iniziale." },
    { t: "Taglio / Grigne", b: "Incisioni sulla superficie prima di infornare: guidano l'espansione ed evitano rotture casuali. Lama inclinata a 45° per formare le 'orecchie'." },
    { t: "Bassinage", b: "Aggiunta di acqua (a volte con un pizzico di sale) alla fine dell'impasto, poco alla volta, quando la maglia è già formata. Permette di raggiungere idratazioni alte senza smontare l'impasto. Versa a filo e fai riassorbire prima di aggiungerne ancora." },
    { t: "Farine speciali", b: "Ogni farina cambia l'impasto. Farro (Dinkel): profumato ma con glutine più fragile → impasto delicato, +3-5% acqua. Segale: poco glutine, molto attiva → prefermenti liquidi e idratazioni alte. Integrale/Vollkorn: crusca che 'taglia' il glutine e beve acqua → più idratazione e riposi. Tipo 00/0/1/2: dal più raffinato al quasi integrale. Manitoba (alta W): forte, per grandi lievitati." },
    { t: "Semole e grani antichi", b: "Semola rimacinata di grano duro: colore ambrato, assorbe molta acqua, croccante (pane di Altamura/Matera). Grani antichi (Senatore Cappelli, Timilia, Russello): meno forza (W basso) → lievitazioni più brevi, glutine meno tenace, ottima digeribilità e aroma. Non spingere l'idratazione come con le farine moderne." },
    { t: "Maturazione vs Lievitazione", b: "Sono due cose diverse. La LIEVITAZIONE è il gonfiarsi dell'impasto (i lieviti producono gas). La MATURAZIONE è la scomposizione di amidi e glutine (enzimi) che rende il pane digeribile e aromatico. Con il freddo puoi rallentare la lievitazione e far proseguire la maturazione: ecco perché il frigo migliora il pane." },
  ],
  es: [
    { t: "Mejorador Natural Pro", b: "Para todas las masas (método Directo e Indirecto) se utiliza únicamente el Mejorador Natural Pro al 2% sobre el peso de la harina. Una única fórmula universal para garantizar impulso, resistencia y suavidad." },
    { t: "Lievito Madre / Licoli (Liko)", b: "Masa madre sólida (hid. 45-50%) o Licoli en cultivo líquido (hid. 100%, más reactivo). Se mantiene viva con refrescos regulares. En panes 15-20% sobre el peso de harina, con Licoli hasta el 25-35%; en grandes lievitados 25-30%." },
    { t: "Lievito Madre de Centeno", b: "Sauerteig de centeno, más ácido y activo (hidratación 100%, líquido). Fermenta 12-16 h a 26-28°C. Perfecto para panes de centeno y mixtos (20-30% sobre la harina)." },
    { t: "Kochstück (con Haferflocken)", b: "Copos de avena (Haferflocken) cocidos con agua y sal (1:4) hasta obtener una crema densa, luego enfriados. Retienen agua: pan más suave y de larga duración. Añade 10-20% sobre el peso de harina reduciendo un poco el agua." },
    { t: "Biga", b: "Prefermento sólido italiano (poca agua, ~45%). Aporta fuerza y estructura a la masa, aroma limpio. Excelente para grandes lievitados y panes muy hidratados." },
    { t: "Quellstück (remojo de semillas)", b: "Semillas y cereales en remojo la noche anterior. Se hidratan, no roban agua a la masa y no rompen el gluten. Fundamental para panes con semillas." },
    { t: "Malta", b: "De cereal germinado: nutre las levaduras y aporta color y crujiente a la corteza. La malta diastásica es la más 'fuerte' — dosifícala con cuidado. Ya está incluida en el Mejorador Natural Pro." },
    { t: "Autólisis", b: "Reposo de harina + agua (sin levadura ni sal) durante 20-60 min antes de amasar. Desarrolla el gluten por sí solo: masa más extensible y menos trabajo de amasado." },
    { t: "Hidratación", b: "Porcentaje de agua sobre el peso de la harina. Más alta = alveolado abierto pero masa más difícil de trabajar. Adáptala a la harina (W) y al método." },
    { t: "Encordado", b: "Fase en la que el gluten se desarrolla completamente: la masa se vuelve lisa, elástica y se despega del bol o del gancho. Está 'en cuerda' cuando al estirar un trozo forma un velo fino sin romperse." },
    { t: "Prueba del velo", b: "Test para saber si la masa está lista: estira un trozo entre los dedos. Si forma una membrana fina y traslúcida sin rasgarse, la red de gluten está desarrollada." },
    { t: "Puntata (fermentación en masa)", b: "Primera fermentación de toda la masa, justo después del amasado y antes del división. Aquí se desarrollan fuerza y aroma: la duración y la temperatura determinan el resto del proceso." },
    { t: "Apretto (fermentación final)", b: "Fermentación final de las piezas ya formadas, antes de la cocción. El pan está listo cuando, al presionar suavemente con un dedo, la marca sube lentamente." },
    { t: "División de la masa", b: "División de la masa en piezas del peso deseado. Corta limpiamente con la espátula/rasqueta, sin desgarrar, para no dañar la red de gluten." },
    { t: "Boleado / Preforma", b: "Redondeo de las piezas para dar tensión y forma. Crea una 'piel' lisa en la superficie que retiene los gases durante la fermentación." },
    { t: "Pliegues (stretch & fold)", b: "Serie de pliegues durante la puntata (cada 30-45 min) para reforzar la masa sin amasar en exceso. Aumentan la fuerza y la extensibilidad, muy útiles en masas muy hidratadas." },
    { t: "Temperatura final de la masa (TFI)", b: "La temperatura de la masa al final del amasado (ideal 24-26°C). Regula la velocidad de fermentación. Se controla principalmente con la temperatura del agua." },
    { t: "Fermentación en frío (nevera)", b: "Fermentación lenta en nevera (4-6°C) durante muchas horas. Desarrolla aroma y digestibilidad y permite gestionar los tiempos del obrador: hornea cuando quieras." },
    { t: "Refresco del Lievito Madre", b: "Alimentar el Lievito Madre con harina y agua para mantenerlo activo. Por lo general 1:1:1 (madre:harina:agua). Refresca 3-4 h antes del uso, cuando haya doblado su volumen." },
    { t: "Cocción con vapor", b: "Vapor en los primeros minutos: mantiene la corteza blanda para que el pan se expanda al máximo (impulso de horno) y desarrolle una corteza brillante y crujiente. Después abre la válvula para secar." },
    { t: "Válvula del horno (tiro)", b: "Regula la humedad durante la cocción. Cerrada al inicio para retener el vapor, abierta en la segunda mitad para secar y hacer la corteza crujiente." },
    { t: "Red de gluten y alveolado", b: "La 'red' de gluten retiene los gases de la fermentación y forma los agujeros (alvéolos). Bien desarrollada + alta hidratación = alveolado abierto y miga esponjosa." },
    { t: "Fuerza de la harina (W y P/L)", b: "W mide la fuerza de la harina (capacidad de soportar largas fermentaciones): más alto = más fuerte. P/L es el equilibrio tenacidad/extensibilidad (ideal ~0,5-0,6). Harinas fuertes para grandes lievitados, débiles para productos quebradizos." },
    { t: "Cuándo añadir la sal", b: "La sal refuerza el gluten y frena la fermentación. Generalmente se añade al final del amasado (o después de la autólisis) para no ralentizar el desarrollo de la red. Dosis típica 2% sobre la harina." },
    { t: "Impulso de horno (oven spring)", b: "La expansión rápida del pan en los primeros minutos de cocción, cuando gases y vapor se dilatan. Depende de una buena fermentación, el corte y el vapor inicial." },
    { t: "Corte / Greñas", b: "Incisiones en la superficie antes de hornear: guían la expansión y evitan roturas aleatorias. Cuchilla inclinada a 45° para formar las 'orejas'." },
    { t: "Bassinage", b: "Adición de agua (a veces con una pizca de sal) al final del amasado, poco a poco, cuando la red de gluten ya está formada. Permite alcanzar hidrataciones altas sin desmontar la masa. Vierte en hilo fino y deja que se absorba antes de añadir más." },
    { t: "Harinas especiales", b: "Cada harina cambia la masa. Espelta (Dinkel): aromática pero con gluten más frágil → masa delicada, +3-5% agua. Centeno: poco gluten, muy activo → prefermentos líquidos e hidrataciones altas. Integral/Vollkorn: el salvado 'corta' el gluten y absorbe agua → más hidratación y reposos. Tipo 00/0/1/2: de la más refinada a la casi integral. Manitoba (alta W): fuerte, para grandes lievitados." },
    { t: "Sémolas y granos antiguos", b: "Sémola remolida de trigo duro: color ámbar, absorbe mucha agua, crujiente (pan de Altamura/Matera). Granos antiguos (Senatore Cappelli, Timilia, Russello): menos fuerza (W bajo) → fermentaciones más cortas, gluten menos tenaz, excelente digestibilidad y aroma. No fuerces la hidratación como con las harinas modernas." },
    { t: "Maduración vs Fermentación", b: "Son dos cosas distintas. La FERMENTACIÓN es el hinchado de la masa (las levaduras producen gas). La MADURACIÓN es la descomposición de almidones y gluten (enzimas) que hace el pan digestible y aromático. Con el frío puedes ralentizar la fermentación y dejar proseguir la maduración: por eso la nevera mejora el pan." },
  ],
  de: [
    { t: "Natürlicher Pro-Backmittel", b: "Für alle Teige (Direkt und Indirekt) wird ausschließlich der Natürliche Pro-Backmittel mit 2% auf das Mehlgewicht verwendet. Eine einzige universelle Formel für Trieb, Stand und Weichheit." },
    { t: "Lievito Madre / Licoli (Liko)", b: "Fester Sauerteig (Hydr. 45-50%) oder Licoli als Flüssigsauer (Hydr. 100%, reaktiver). Durch regelmäßige Auffrischungen lebendig gehalten. Brote 15-20% auf das Mehl, mit Licoli bis 25-35%; große Hefegebäcke 25-30%." },
    { t: "Roggen-Sauerteig", b: "Roggensauerteig, säuerlicher und aktiver (Hydration 100%, flüssig). Reift 12-16 h bei 26-28°C. Perfekt für Roggen- und Mischbrote (20-30% auf das Mehl)." },
    { t: "Kochstück (mit Haferflocken)", b: "Haferflocken mit Wasser und Salz (1:4) zu einer dicken Creme gekocht, dann abgekühlt. Binden Wasser: weicheres, länger frisches Brot. 10-20% auf das Mehl, Wasser etwas reduzieren." },
    { t: "Biga", b: "Fester italienischer Vorteig (wenig Wasser, ~45%). Gibt dem Teig Kraft und Struktur, reines Aroma. Top für große Hefegebäcke und stark hydratisierte Brote." },
    { t: "Quellstück (Saaten)", b: "Saaten und Körner am Vorabend einweichen. Sie quellen, entziehen dem Teig kein Wasser und zerschneiden das Gluten nicht. Unverzichtbar für Saatenbrote." },
    { t: "Malz", b: "Aus gekeimtem Getreide: nährt die Hefe und gibt Farbe und Krustenknusprigkeit. Diastatisches Malz ist am 'stärksten' — sparsam dosieren. Bereits im Pro-Backmittel enthalten." },
    { t: "Autolyse", b: "Ruhezeit von Mehl + Wasser (ohne Hefe und Salz) 20-60 Min vor dem Kneten. Entwickelt das Gluten von selbst: dehnbarerer Teig, weniger Knetarbeit." },
    { t: "Hydratation", b: "Wasseranteil bezogen auf das Mehlgewicht. Höher = offenere Porung, aber schwierigerer Teig. An Mehl (W) und Methode anpassen." },
    { t: "Teigentwicklung (Incordatura)", b: "Phase, in der das Gluten voll entwickelt ist: der Teig wird glatt, elastisch und löst sich von Schüssel oder Haken. Fertig, wenn ein Stück zu einem dünnen Fenster ausgezogen werden kann, ohne zu reißen." },
    { t: "Fenstertest", b: "Test, ob der Teig fertig ist: ziehe ein Stück zwischen den Fingern aus. Bildet es eine dünne, durchscheinende Membran ohne zu reißen, ist das Glutennetz entwickelt." },
    { t: "Stockgare (Puntata)", b: "Erste Gare des gesamten Teigs direkt nach dem Kneten und vor dem Teilen. Hier entwickeln sich Kraft und Aroma: Dauer und Temperatur bestimmen die weitere Arbeit." },
    { t: "Stückgare (Apretto)", b: "Endgare der bereits geformten Teiglinge vor dem Backen. Fertig, wenn sich ein leichter Fingerdruck langsam zurückbildet." },
    { t: "Teilen (Staglio)", b: "Teilen des Teigs in Stücke des gewünschten Gewichts. Mit der Teigkarte sauber schneiden, nicht reißen, um das Gluten nicht zu beschädigen." },
    { t: "Rundwirken / Vorformen", b: "Rundwirken der Teiglinge für Spannung und Form. Es entsteht eine glatte 'Haut', die die Gärgase hält." },
    { t: "Dehnen & Falten", b: "Falten während der Stockgare (alle 30-45 Min), um den Teig ohne langes Kneten zu stärken. Erhöhen Kraft und Dehnbarkeit, ideal bei hoher Hydration." },
    { t: "Teigtemperatur (TFI)", b: "Teigtemperatur am Ende des Knetens (ideal 24-26°C). Steuert die Gärgeschwindigkeit. Wird vor allem über die Wassertemperatur eingestellt." },
    { t: "Kalte Gare (Kühlschrank)", b: "Langsame Gare im Kühlschrank (4-6°C) über viele Stunden. Fördert Aroma und Verdaulichkeit und macht die Zeitplanung flexibel: backe, wann du willst." },
    { t: "Sauerteig auffrischen", b: "Den Sauerteig mit Mehl und Wasser füttern, um ihn aktiv zu halten. Meist 1:1:1 (Anstellgut:Mehl:Wasser). 3-4 h vor Gebrauch auffrischen, bis er sich verdoppelt." },
    { t: "Backen mit Dampf", b: "Dampf in den ersten Minuten: hält die Kruste weich, damit sich das Brot maximal ausdehnt (Ofentrieb) und eine glänzende, knusprige Kruste bildet. Danach Schwaden ablassen." },
    { t: "Ofenzug (Schwaden)", b: "Reguliert die Feuchte beim Backen. Zu Beginn geschlossen, um Dampf zu halten, in der zweiten Hälfte geöffnet, um zu trocknen und die Kruste knusprig zu machen." },
    { t: "Glutennetz & Porung", b: "Das Glutennetz hält die Gärgase und bildet die Poren. Gut entwickelt + hohe Hydration = offene Porung und lockere Krume." },
    { t: "Mehlstärke (W und P/L)", b: "W misst die Mehlstärke (Fähigkeit für lange Gare): höher = stärker. P/L ist das Verhältnis von Zähigkeit/Dehnbarkeit (ideal ~0,5-0,6). Starke Mehle für große Hefegebäcke, schwache für Mürbes." },
    { t: "Wann Salz zugeben", b: "Salz stärkt das Gluten und bremst die Gärung. Meist gegen Ende des Knetens (oder nach der Autolyse) zugeben, um die Glutenentwicklung nicht zu bremsen. Übliche Dosis 2% auf das Mehl." },
    { t: "Ofentrieb", b: "Die schnelle Ausdehnung des Brotes in den ersten Backminuten, wenn Gase und Dampf sich ausdehnen. Hängt von guter Gare, Einschnitten und Anfangsdampf ab." },
    { t: "Einschnitte", b: "Schnitte vor dem Backen: lenken die Ausdehnung und verhindern zufällige Risse. Klinge in 45° für schöne 'Ohren'." },
    { t: "Bassinage", b: "Zugabe von Wasser (manchmal mit etwas Salz) am Ende des Knetens, nach und nach, wenn das Glutennetz schon steht. So erreicht man hohe Hydration, ohne den Teig zu 'überkneten'. In dünnem Strahl zugeben und einziehen lassen, bevor mehr folgt." },
    { t: "Spezialmehle", b: "Jedes Mehl verändert den Teig. Dinkel: aromatisch, aber empfindlicheres Gluten → sanft kneten, +3-5% Wasser. Roggen: wenig Gluten, sehr aktiv → flüssige Vorteige und hohe Hydration. Vollkorn: Kleie 'schneidet' das Gluten und bindet Wasser → mehr Hydration und Ruhezeiten. Type 405/550/1050: vom fein zum fast vollen Ausmahlungsgrad. Manitoba (hohes W): stark, für große Hefegebäcke." },
    { t: "Hartweizen & alte Getreide", b: "Hartweizengrieß (Semola rimacinata): bernsteinfarben, saugt viel Wasser, knusprig (Brot aus Altamura/Matera). Alte Sorten (Senatore Cappelli, Timilia, Russello): weniger Kraft (niedriges W) → kürzere Gare, weniger zähes Gluten, sehr bekömmlich und aromatisch. Hydration nicht so hoch treiben wie bei modernen Mehlen." },
    { t: "Reife vs. Gare", b: "Zwei verschiedene Dinge. Die GARE ist das Aufgehen des Teigs (Hefen bilden Gas). Die REIFE ist der Abbau von Stärke und Gluten (Enzyme), der das Brot bekömmlich und aromatisch macht. Mit Kälte bremst du die Gare und lässt die Reife weiterlaufen: darum verbessert der Kühlschrank das Brot." },
  ],
  en: [
    { t: "Natural Improver Pro", b: "For every dough (Direct and Indirect method) use only the Natural Improver Pro at 2% of the flour weight. A single universal formula for lift, stability and softness." },
    { t: "Sourdough / Li.Co.Li (Liko)", b: "Stiff sourdough (45-50% hydration) or Li.Co.Li liquid culture (100% hydration, more reactive). Kept alive with regular refreshes. In breads 15-20% of the flour weight, with Li.Co.Li up to 25-35%; in big leavened cakes 25-30%." },
    { t: "Rye Sourdough", b: "Rye Sauerteig, more acidic and active (100% hydration, liquid). Ferments 12-16 h at 26-28°C. Perfect for rye and mixed breads (20-30% of the flour)." },
    { t: "Kochstück (with oat flakes)", b: "Oat flakes (Haferflocken) cooked with water and salt (1:4) into a thick cream, then cooled. They hold water: softer, longer-lasting bread. Add 10-20% of the flour weight, reducing water a little." },
    { t: "Biga", b: "Italian stiff preferment (little water, ~45%). Gives strength and structure to the dough, clean aroma. Great for big leavened cakes and highly hydrated breads." },
    { t: "Quellstück (soaked seeds)", b: "Seeds and grains soaked the night before. They hydrate, don't steal water from the dough and don't cut the gluten. Essential for seeded breads." },
    { t: "Malt", b: "From sprouted grain: feeds the yeast and gives colour and crust crispness. Diastatic malt is the 'strongest' — dose it carefully. Already included in the Natural Improver Pro." },
    { t: "Autolyse", b: "Rest of flour + water (no yeast or salt) for 20-60 min before mixing. It develops the gluten on its own: a more extensible dough with less kneading." },
    { t: "Hydration", b: "Percentage of water on the flour weight. Higher = open crumb but harder dough. Adapt it to the flour (W) and method." },
    { t: "Gluten development", b: "The stage where gluten is fully developed: the dough becomes smooth, elastic and clears the bowl or hook. It's ready when a piece stretches into a thin translucent film without tearing." },
    { t: "Windowpane test", b: "Test to check the dough: stretch a small piece between your fingers. If it forms a thin, translucent membrane without tearing, the gluten network is developed." },
    { t: "Bulk fermentation", b: "First rise of the whole dough right after mixing and before dividing. Strength and aroma develop here: time and temperature drive the rest of the process." },
    { t: "Final proof", b: "Final rise of the shaped pieces before baking. Ready when a gentle finger press springs back slowly." },
    { t: "Dividing", b: "Dividing the dough into pieces of the wanted weight. Cut cleanly with the scraper, don't tear, to protect the gluten." },
    { t: "Rounding / Pre-shaping", b: "Rounding the pieces to build tension and shape. It creates a smooth 'skin' that holds the gases during proofing." },
    { t: "Stretch & folds", b: "Sets of folds during bulk (every 30-45 min) to strengthen the dough without long kneading. They build strength and extensibility, great for high-hydration doughs." },
    { t: "Final dough temperature", b: "Dough temperature at the end of mixing (ideal 24-26°C). It sets the fermentation speed and is controlled mainly via water temperature." },
    { t: "Cold retard (fridge)", b: "Slow fermentation in the fridge (4-6°C) for many hours. Builds aroma and digestibility and lets you manage timing: bake when you want." },
    { t: "Refreshing the sourdough", b: "Feeding the sourdough with flour and water to keep it active. Usually 1:1:1 (starter:flour:water). Refresh 3-4 h before use, until it doubles." },
    { t: "Baking with steam", b: "Steam in the first minutes: keeps the crust soft so the bread expands fully (oven spring) and forms a glossy, crisp crust. Then open the vent to dry it out." },
    { t: "Oven vent (damper)", b: "Controls humidity while baking. Closed at the start to keep steam, opened in the second half to dry out and crisp the crust." },
    { t: "Gluten net & crumb", b: "The gluten 'net' traps fermentation gases and forms the holes. Well developed + high hydration = open crumb and soft texture." },
    { t: "Flour strength (W and P/L)", b: "W measures flour strength (ability to handle long fermentation): higher = stronger. P/L is the tenacity/extensibility balance (ideal ~0.5-0.6). Strong flours for big leavened cakes, weak ones for crumbly products." },
    { t: "When to add salt", b: "Salt strengthens gluten and slows fermentation. Usually added at the end of mixing (or after autolyse) so it doesn't slow gluten development. Typical dose 2% of the flour." },
    { t: "Oven spring", b: "The rapid expansion of bread in the first baking minutes as gases and steam expand. It depends on good proofing, scoring and initial steam." },
    { t: "Scoring", b: "Cuts on the surface before baking: they guide expansion and prevent random tears. Blade at 45° to create the 'ears'." },
    { t: "Bassinage", b: "Adding water (sometimes with a pinch of salt) at the end of mixing, a little at a time, once the gluten is already built. It lets you reach high hydration without breaking down the dough. Pour in a thin stream and let it absorb before adding more." },
    { t: "Special flours", b: "Every flour changes the dough. Spelt (Dinkel): fragrant but more fragile gluten → gentle mixing, +3-5% water. Rye: little gluten, very active → liquid preferments and high hydration. Wholemeal: bran that 'cuts' the gluten and drinks water → more hydration and rests. Type 00/0/1/2: from most refined to nearly wholemeal. Manitoba (high W): strong, for big leavened cakes." },
    { t: "Durum semolina & ancient grains", b: "Remilled durum semolina: amber colour, absorbs a lot of water, crisp (Altamura/Matera bread). Ancient grains (Senatore Cappelli, Timilia, Russello): less strength (low W) → shorter fermentation, less tenacious gluten, great digestibility and aroma. Don't push hydration like with modern flours." },
    { t: "Maturation vs fermentation", b: "Two different things. FERMENTATION is the dough rising (yeasts producing gas). MATURATION is the breakdown of starches and gluten (enzymes) that makes bread digestible and aromatic. With cold you slow fermentation while maturation keeps going: that's why the fridge improves bread." },
  ],
};

export default function Enciclopedia({ embedded = false }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(embedded ? -1 : 0);
  const [panelOpen, setPanelOpen] = useState(false);
  // Prima i METODI (Poolish, Lievito Madre, Roggen, Backmittel), poi ingredienti e termini tecnici.
  const methodEntries = METODI_SECTIONS.map((s) => { const loc = pick(s, lang); return { t: loc.title, b: loc.body }; });
  const list = [...methodEntries, ...pick(ENC_ENTRIES, lang)];

  const accordion = (
    <div className="space-y-2">
      {list.map((e, i) => {
        const isOpen = open === i;
        return (
          <div key={e.t} data-testid={`enc-entry-${i}`} className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] overflow-hidden">
            <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{e.t}</span>
              <ChevronDown className={`w-4 h-4 text-[#7E8A93] transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-line">{e.b}</p>}
          </div>
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <div data-testid="enciclopedia-embedded" className="mb-5 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] overflow-hidden">
        <button data-testid="enc-panel-toggle" onClick={() => setPanelOpen((o) => !o)} className="w-full flex items-center gap-3 p-4 text-left">
          <div className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#c94f00] flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-white" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight">{t("enc_title")}</h2>
            <p className="text-xs text-[#7E8A93] leading-snug mt-0.5">{t("enc_sub")}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-[#7E8A93] shrink-0 transition-transform ${panelOpen ? "rotate-180" : ""}`} />
        </button>
        {panelOpen && <div className="px-4 pb-4">{accordion}</div>}
      </div>
    );
  }

  return (
    <div data-testid="enciclopedia" className="pb-4">
      <MikiAvatar label="Michele" subtitle={t("enc_title")} className="mb-4" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#c94f00] flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("enc_title")}</h1>
          <div className="h-1 w-10 rounded-full bg-[#c94f00] my-1" />
          <p className="text-sm text-[#7E8A93]">{t("enc_sub")}</p>
        </div>
      </div>
      {accordion}
    </div>
  );
}
