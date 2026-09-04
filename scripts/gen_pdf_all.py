import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                ListFlowable, ListItem, HRFlowable, PageBreak, Image as RLImage)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Genera il documento ecosistema MikiLab v14 in TUTTE le lingue del sito: it, de, en, es, fr, fa.
TEAL = colors.HexColor("#3E9C93"); GOLD = colors.HexColor("#E0A106")
SLATE = colors.HexColor("#2B303B")
OUT = "/app/frontend/public"
IMGDIR = "/root/.emergent/automation_output/20260904_025840"

# --- Supporto Persiano (RTL) ---------------------------------------------
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    pdfmetrics.registerFont(TTFont("FA", "/usr/share/fonts/truetype/freefont/FreeSans.ttf"))
    pdfmetrics.registerFont(TTFont("FA-Bold", "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"))
    FA_OK = True
except Exception as e:
    print("FA support disabled:", e); FA_OK = False

def R(t, lang):
    if lang == "fa" and FA_OK:
        try:
            return get_display(arabic_reshaper.reshape(str(t)))
        except Exception:
            return str(t)
    return str(t)

# Nomi moduli condivisi (termini di prodotto in inglese) ------------------
MODULES = {
 1:"Predictive Flour Hydration AI",2:"Dynamic Oven Thermal Planner",3:"Thermal Timeline Red/Amber",
 4:"Live Energy & kWh Counter",5:"Tactical Bottleneck AI",6:"Neural Load Radar",7:"Cyber-Wave Audio Visualizer",
 8:"IoT Predictive Maintenance",9:"Automated Yeast Maturity Tracker",10:"Cold Chain Auto-Recovery",
 11:"Energy Tariff Auto-Shift",12:"Voice Batch Traceability",13:"Real-Time Yield & Waste Analytics",
 14:"Multi-Zone Audio Routing",15:"Dynamic Delivery Express Sync",16:"Ghost Shift Auto-Pilot",
 17:"Virtual Baker Coach",18:"Digital Silo Telemetry",19:"Equipment Stress Index",20:"Voice Shift Handover Notes",
 21:"Offline Spatial Tour",22:"Task Decomposition",23:"Offline Voice Glossary",24:"Micro-Validation",
 25:"Apprentice Progress Index",26:"Four-Hand Co-Weighing",27:"SOS Colleague",28:"Voice Kudos",29:"Shaping Metronome",
 30:"Cross-Shift Handover Log",31:"Rheon Dough/Filling Ratio",32:"Shutter Speed Sync",33:"Multi-Feeder Guard",
 34:"Rheon PMU Recall",35:"Thermal Friction Index",36:"Hydraulic Press Pressure & Thickness",
 37:"Multi-Deck & Rotary Oven Airflow Hydro-Balance",38:"Amperometric Torque Control",
 39:"Volumetric Divider & Piston Wear",40:"Dynamic Climate Control Proofer",41:"Predictive Loading Bay & Route Dispatch",
 42:"Dynamic Rack & Trolley Buffer Tracking",43:"Synchronized Multi-Oven Unloading Wave",
 44:"Real-Time Ingredient Buffer Replenishment",45:"Executive Emergency Re-Routing AI",
 46:"Dynamic Tray, Mold & Oven Tool Inventory",47:"Steam Recovery & Recirculation",48:"Hands-Free Quick Maintenance Guide",
 49:"Downtime Root-Cause Logging",50:"Multi-Deck Load Balancing AI",
 51:"Startup Splash Screen (Glitch-Neon)",52:"Miki's Board",53:"Cyber-Industrial Kit (Space-Tech font)",
 54:"Synchronized Success Sound",55:"Dynamic Focus Animation",56:"Miki's Handshake (haptic)",
 57:"Mohamed's Lab Live View",58:"Bake Mix - Interactive Training",59:"Audio Snapshot",60:"Smart Scale Sync",
 61:"Stress Index",62:"Recipe Scaling",63:"Squad Check-In",64:"Multi-Chief Executive Architecture",
}

# Prodotti hardware e macchinari (nome, fonte) condivisi -------------------
HW_ITEMS = [
 ("Milesight EM300-TH", "milesight.com"),
 ("Efento (NB-IoT / BLE)", "getefento.com"),
 ("Probes PT100 / DS18B20", "rs-online.com"),
 ("Relay Shelly / Sonoff", "shelly.com"),
 ("Jabra wireless headset", "jabra.com"),
]
MAC_ITEMS = [
 ("Rheon lines (Encrusting/Extruder)", "Rheon"),
 ("Hydraulic presses & molders", "Bakery equipment vendors"),
 ("Multi-deck & rotary ovens", "Wachtel, MIWE, Zucchelli"),
 ("Spiral mixers & dividers", "Pro mixer vendors"),
 ("Proofing & freezing cells", "Cell & blast-chiller vendors"),
 ("IoT scales (Smart Scale)", "Connected industrial scales"),
 ("Industrial flour silos", "Silo & flour-transport vendors"),
 ("Trays, molds, peels & tools", "Bakery tooling vendors"),
]

SHOTS = ["doc_home.jpeg", "doc_talk.jpeg", "doc_plancia.jpeg", "doc_parco.jpeg", "doc_manuale.jpeg"]

# ============================ CONTENUTI PER LINGUA ============================
C = {}

C["it"] = {
 "title":"MikiLab v14 - Documento Ecosistema","suffix":"IT",
 "subtitle":"Documentazione completa dell'ecosistema Cyber-Industrial (64 moduli). Lingua: Italiano.",
 "arch_h":"Architettura e Filosofia",
 "arch_body":"MikiLab è un laboratorio digitale a mani libere per fornai: 100% offline-first, sintesi vocale continua senza parole chiave, stile Cyber-Industrial teal/scuro. La guida è affidata esclusivamente agli avatar dinamici del Trio Cyber (nessun testo statico). Nessun HACCP/allergeni.",
 "sec_h":"1. Le 8 Macro-Aree",
 "sections":[("Home","Vetrina snella con testo di navigazione, Trio Cyber-Bakery interattivo, Bacheca di Miki e l'assistente Talk with Miki."),
   ("Modalità Chef/Lab","Cuore operativo: parco macchine con timer globali, Voice Core a mani libere, Plancia del Comandante, Smart Planner, Thermal Guard, Team OS e oltre 50 strumenti."),
   ("Le Mie Ricette","Ricette testate con dosi in grammi e percentuale, metodo, tempi e costo; creazione e gestione delle proprie ricette."),
   ("Scienza & Guide (Impara)","Percorso passo-passo, Sommelier del Pane, schede tecniche di fermentazione, Trio Cyber-Bakery con mini-guide."),
   ("Community","Feed social Pro persistente, canali da seguire, scambio tra fornai."),
   ("Manuale & Operatività B2B","Compendio macchine + comandi vocali a mani libere + hardware consigliato + indice moduli 1-64."),
   ("Plancia del Comandante","Reportistica AI, radar team, manutenzione predittiva e Multi-Chief Executive Architecture (modulo 64)."),
   ("Talk with Miki","Assistente AI conversazionale in prima persona (voce + testo), con co-pilota Miki/Mohamed/Bake Mix, intercom live e ascolto continuo.")],
 "trio_h":"2. Trio Cyber - Schede Operative",
 "trio":[("Miki (Il Comandante)","Fondatore snello, capelli rasati, orecchino, tatuaggio reale sul braccio sinistro, t-shirt MikiLab. Assistente AI conversazionale: risponde in prima persona su come il software aiuta i fornai e su tutto il laboratorio."),
   ("Mohamed (La Mano Destra)","Giovane persiano/iraniano in divisa MikiLab. Segue le operazioni pratiche (pulizia, carrelli, infornata) con la 'Lab Live View' (micro-animazioni delle operazioni)."),
   ("Bake Mix (Assistente Robot)","Robot fornaio futuristico teal/amber. Segue tecnologia, AI e comandi vocali; guida l'Interactive Training dei comandi a mani libere.")],
 "trio_feat_h":"Funzioni comuni del Trio:",
 "trio_feats":["Intercom su cuffie industriali Bluetooth","Auto-Duck audio (abbassa la radio durante gli annunci, poi ritorno fluido al 100%)","Smart Context Memory (storico conversazione per sessione)","Animazione di handoff dinamica al cambio di co-pilota","Supporto passo-passo empatico per il personale","Sintesi vocale (TTS) pulita con haptica sincronizzata"],
 "plancia_h":"3. Plancia del Comandante - Commander Voice",
 "plancia":["Registrazione automatica e vocale di impastate, ricette, forni e calendari","Multi-Chief: profilo del Comandante di turno (nome, tono, priorità)","Briefing di passaggio turno generato automaticamente (voce + visivo)","Tactical Bottleneck AI e Neural Load Radar con glow sul parametro critico","IoT Predictive Maintenance e Downtime Root-Cause Logging","Report di Fine Giornata (salvataggio backend, grafico storico, auto-salvataggio serale)"],
 "modules_h":"4. Mappa dei 64 Moduli Operativi",
 "tools_h":"5. Strumenti di Laboratorio Attivi (Card)",
 "tools_note":"Strumenti operativi totali rilevati nel codice: {n}.",
 "hw_h":"6. Guida Attrezzatura & Hardware B2B",
 "hw_sub_h":"Sensori IoT & Hardware consigliati",
 "hw_headers":["Prodotto","Utilizzo","Dove reperirlo"],
 "hw_use":["Sonda temperatura + umidità LoRaWAN per celle e ambiente.","Data logger di temperatura per la catena del freddo (freezer/frigo).","Sonde a contatto per cuore impasto e forno (via gateway/ESP).","Relè WiFi per pilotare forni, luci e riscaldamento celle.","Cuffie con cancellazione del rumore per il Voice Core a mani libere."],
 "mac_sub_h":"Macchinari integrabili",
 "mac_headers":["Macchina","Funzione & Moduli","Marche / Fonti"],
 "mac_fn":["Dosaggio impasto/farcitura e formatura continua. Moduli 31-35.","Calibrazione pressione/spessore con controllo elasticità. Modulo 36.","Bilanciamento aria/vapore, recupero vapore, load-balancing AI. Moduli 37/47/50.","Coppia amperometrica, stress index, usura pistone. Moduli 38/19/39.","Clima dinamico e recupero catena del freddo. Moduli 40/10.","Pesatura guidata e co-pesatura a quattro mani, smart-scale sync. Moduli 26/60.","Telemetria di livello e flusso farina. Modulo 18.","Tracciamento cicli, pulizia e sanificazione. Modulo 46."],
 "shots_h":"7. Screenshot reali del sito (Manuale illustrato)",
 "shots_caps":["Home - Navigazione, Trio Cyber-Bakery e Bacheca di Miki","Talk with Miki - Assistente AI, co-pilota, intercom live, ascolto continuo","Plancia del Comandante - Reportistica AI, glow sul parametro critico, Multi-Chief (modulo 64)","Parco Macchine - Telemetria IoT, moduli 31-50 con parametri live","Manuale & Operatività B2B - Utilizzo in laboratorio e comandi vocali"],
 "footer":"MikiLab v14 - Il laboratorio connesso di Michele. Documento generato automaticamente dal codice sorgente.",
}

C["en"] = {
 "title":"MikiLab v14 - Ecosystem Document","suffix":"EN",
 "subtitle":"Complete documentation of the Cyber-Industrial ecosystem (64 modules). Language: English.",
 "arch_h":"Architecture & Philosophy",
 "arch_body":"MikiLab is a hands-free digital lab for bakers: 100% offline-first, continuous voice synthesis without keywords, Cyber-Industrial teal/dark style. Guidance is handled exclusively by the dynamic avatars of the Cyber Trio (no static text). No HACCP/allergens.",
 "sec_h":"1. The 8 Macro-Areas",
 "sections":[("Home","Lean showcase with navigation text, interactive Cyber-Bakery Trio, Miki's Board and the Talk with Miki assistant."),
   ("Chef/Lab Mode","Operational heart: machine park with global timers, hands-free Voice Core, Commander Bridge, Smart Planner, Thermal Guard, Team OS and 50+ tools."),
   ("My Recipes","Tested recipes with grams and baker's percent, method, timings and cost; create and manage your own recipes."),
   ("Science & Guides (Learn)","Step-by-step path, Bread Sommelier, technical fermentation cards, Cyber-Bakery Trio with mini-guides."),
   ("Community","Persistent Pro social feed, channels to follow, exchange among bakers."),
   ("Manual & B2B Operations","Machine compendium + hands-free voice commands + recommended hardware + index of modules 1-64."),
   ("Commander Bridge","AI reporting, team radar, predictive maintenance and Multi-Chief Executive Architecture (module 64)."),
   ("Talk with Miki","First-person conversational AI assistant (voice + text), with co-pilot Miki/Mohamed/Bake Mix, live intercom and continuous listening.")],
 "trio_h":"2. Cyber Trio - Operational Cards",
 "trio":[("Miki (The Commander)","Lean founder, shaved head, earring, a real tattoo on the left arm, MikiLab t-shirt. Conversational AI assistant: answers in first person about how the software helps bakers and about the whole lab."),
   ("Mohamed (The Right Hand)","Young Persian/Iranian man in MikiLab uniform. Handles practical operations (cleaning, trolleys, loading) with the 'Lab Live View' (micro-animations of operations)."),
   ("Bake Mix (Robot Assistant)","Futuristic baker robot in teal/amber. Handles technology, AI and voice commands; leads the Interactive Training of hands-free commands.")],
 "trio_feat_h":"Shared Trio features:",
 "trio_feats":["Intercom over industrial Bluetooth headsets","Audio Auto-Duck (lowers the radio during announcements, then smooth return to 100%)","Smart Context Memory (per-session conversation history)","Dynamic handoff animation when switching co-pilot","Empathetic step-by-step support for staff","Clean speech synthesis (TTS) with synchronized haptics"],
 "plancia_h":"3. Commander Bridge - Commander Voice",
 "plancia":["Automatic and voice logging of batches, recipes, ovens and calendars","Multi-Chief: profile of the on-duty commander (name, tone, priorities)","Automatically generated shift-handover briefing (voice + visual)","Tactical Bottleneck AI and Neural Load Radar with glow on the critical parameter","IoT Predictive Maintenance and Downtime Root-Cause Logging","End-of-Day Report (backend storage, historical chart, automatic evening save)"],
 "modules_h":"4. Map of the 64 Operational Modules",
 "tools_h":"5. Active Lab Tools (Cards)",
 "tools_note":"Total operational tools detected in the source code: {n}.",
 "hw_h":"6. Equipment & B2B Hardware Guide",
 "hw_sub_h":"Recommended IoT sensors & hardware",
 "hw_headers":["Product","Use","Where to get it"],
 "hw_use":["Temperature + humidity LoRaWAN probe for cells and environment.","Temperature data logger for the cold chain (freezer/fridge).","Contact probes for dough core and oven (via gateway/ESP).","WiFi relays to drive ovens, lights and cell heating.","Noise-cancelling headset for the hands-free Voice Core."],
 "mac_sub_h":"Integrable machines",
 "mac_headers":["Machine","Function & Modules","Brands / Sources"],
 "mac_fn":["Dough/filling dosing and continuous forming. Modules 31-35.","Pressure/thickness calibration with elasticity control. Module 36.","Air/steam balance, steam recovery, load-balancing AI. Modules 37/47/50.","Amperometric torque, stress index, piston wear. Modules 38/19/39.","Dynamic climate and cold-chain recovery. Modules 40/10.","Guided weighing and four-hand co-weighing, smart-scale sync. Modules 26/60.","Level and flour-flow telemetry. Module 18.","Cycle, cleaning and sanitizing tracking. Module 46."],
 "shots_h":"7. Real website screenshots (Illustrated manual)",
 "shots_caps":["Home - Navigation, Cyber-Bakery Trio and Miki's Board","Talk with Miki - AI assistant, co-pilot, live intercom, continuous listening","Commander Bridge - AI reporting, glow on the critical parameter, Multi-Chief (module 64)","Machine Park - IoT telemetry, modules 31-50 with live parameters","Manual & B2B Operations - Lab usage and voice commands"],
 "footer":"MikiLab v14 - Michele's connected lab. Document generated automatically from source code.",
}

C["de"] = {
 "title":"MikiLab v14 - Ökosystem-Dokument","suffix":"DE",
 "subtitle":"Vollständige Dokumentation des Cyber-Industrial-Ökosystems (64 Module). Sprache: Deutsch.",
 "arch_h":"Architektur & Philosophie",
 "arch_body":"MikiLab ist ein freihändiges digitales Labor für Bäcker: 100% offline-fähig, kontinuierliche Sprachsynthese ohne Schlüsselwörter, Cyber-Industrial-Stil in Teal/Dunkel. Die Führung übernehmen ausschließlich die dynamischen Avatare des Cyber-Trios (kein statischer Text). Kein HACCP/Allergene.",
 "sec_h":"1. Die 8 Hauptbereiche",
 "sections":[("Home","Schlanke Vitrine mit Navigationstext, interaktivem Cyber-Bakery-Trio, Mikis Pinnwand und dem Assistenten Talk with Miki."),
   ("Chef-/Labor-Modus","Operatives Herz: Maschinenpark mit globalen Timern, freihändiger Voice Core, Chef-Kommandobrücke, Smart Planner, Thermal Guard, Team OS sowie über 50 Werkzeuge."),
   ("Meine Rezepte","Getestete Rezepte mit Gramm und Prozent, Methode, Zeiten und Kosten; Erstellung und Verwaltung eigener Rezepte."),
   ("Wissenschaft & Anleitungen (Lernen)","Schritt-für-Schritt-Pfad, Brot-Sommelier, technische Fermentationskarten, Cyber-Bakery-Trio mit Mini-Anleitungen."),
   ("Community","Persistenter Pro-Social-Feed, Kanälen folgen, Austausch unter Bäckern."),
   ("Handbuch & B2B-Betrieb","Maschinen-Kompendium + freihändige Sprachbefehle + empfohlene Hardware + Index der Module 1-64."),
   ("Chef-Kommandobrücke","KI-Reporting, Team-Radar, vorausschauende Wartung und Multi-Chief Executive Architecture (Modul 64)."),
   ("Talk with Miki","Konversationeller KI-Assistent in der Ich-Form (Stimme + Text), mit Co-Pilot Miki/Mohamed/Bake Mix, Live-Intercom und Dauerhören.")],
 "trio_h":"2. Cyber-Trio - Einsatzkarten",
 "trio":[("Miki (Der Chef)","Schlanker Gründer, rasierte Haare, Ohrring, echtes Tattoo am linken Arm, MikiLab-T-Shirt. Konversationeller KI-Assistent: antwortet in der Ich-Form, wie die Software Bäckern hilft und rund um das gesamte Labor."),
   ("Mohamed (Rechte Hand)","Persischer/iranischer junger Mann in MikiLab-Uniform. Zuständig für praktische Abläufe (Reinigung, Wagen, Beschickung) mit der 'Lab Live View' (Mikro-Animationen der Vorgänge)."),
   ("Bake Mix (Roboter-Assistent)","Futuristischer Bäcker-Roboter in Teal/Amber. Zuständig für Technik, KI und Sprachbefehle; leitet das Interactive Training der freihändigen Befehle.")],
 "trio_feat_h":"Gemeinsame Funktionen des Trios:",
 "trio_feats":["Intercom über industrielle Bluetooth-Headsets","Auto-Duck Audio (senkt das Radio während der Ansagen, danach flüssige Rückkehr auf 100%)","Smart Context Memory (Gesprächsverlauf pro Sitzung)","Dynamische Handoff-Animation beim Wechsel des Co-Piloten","Empathische Schritt-für-Schritt-Unterstützung für das Personal","Saubere Sprachsynthese (TTS) mit synchronisierter Haptik"],
 "plancia_h":"3. Chef-Kommandobrücke - Commander Voice",
 "plancia":["Automatische und sprachgesteuerte Erfassung von Chargen, Rezepten, Öfen und Kalendern","Multi-Chief: Profil des diensthabenden Chefs (Name, Tonfall, Prioritäten)","Automatisch erzeugtes Schichtübergabe-Briefing (Sprache + visuell)","Tactical Bottleneck AI und Neural Load Radar mit Glow auf dem kritischen Parameter","IoT Predictive Maintenance und Downtime Root-Cause Logging","Tagesabschlussbericht (Backend-Speicherung, historisches Diagramm, automatisches Abend-Speichern)"],
 "modules_h":"4. Karte der 64 operativen Module",
 "tools_h":"5. Aktive Laborwerkzeuge (Karten)",
 "tools_note":"Im Quellcode erkannte operative Werkzeuge insgesamt: {n}.",
 "hw_h":"6. Ausstattungs- & B2B-Hardware-Leitfaden",
 "hw_sub_h":"Empfohlene IoT-Sensoren & Hardware",
 "hw_headers":["Produkt","Verwendung","Bezugsquelle"],
 "hw_use":["Temperatur- + Feuchtigkeitssonde LoRaWAN für Zellen und Umgebung.","Temperatur-Datenlogger für die Kühlkette (Gefrier-/Kühlschrank).","Kontaktsonden für Teigkern und Ofen (über Gateway/ESP).","WLAN-Relais zur Steuerung von Öfen, Licht und Zellen-Heizung.","Kopfhörer mit Geräuschunterdrückung für den freihändigen Voice Core."],
 "mac_sub_h":"Integrierbare Maschinen",
 "mac_headers":["Maschine","Funktion & Module","Marken / Bezugsquellen"],
 "mac_fn":["Dosierung von Teig/Füllung und kontinuierliches Formen. Module 31-35.","Kalibrierung von Druck/Dicke mit Elastizitätskontrolle. Modul 36.","Luft-/Dampf-Balance, Dampfrückgewinnung, Load-Balancing-KI. Module 37/47/50.","Amperometrisches Drehmoment, Stress-Index, Kolbenverschleiß. Module 38/19/39.","Dynamisches Klima und Wiederherstellung der Kühlkette. Module 40/10.","Geführtes Wiegen und Vier-Hand-Co-Wiegen, Smart-Scale-Sync. Module 26/60.","Telemetrie von Füllstand und Mehlfluss. Modul 18.","Verfolgung von Zyklen, Reinigung und Sanitisierung. Modul 46."],
 "shots_h":"7. Echte Screenshots der Website (bebildertes Handbuch)",
 "shots_caps":["Home - Navigation, Cyber-Bakery-Trio und Mikis Pinnwand","Talk with Miki - KI-Assistent, Co-Pilot, Live-Intercom, Dauerhören","Chef-Kommandobrücke - KI-Reporting, Glow auf dem kritischen Parameter, Multi-Chief (Modul 64)","Maschinenpark - IoT-Telemetrie, Module 31-50 mit Live-Parametern","Handbuch & B2B-Betrieb - Einsatz im Labor und Sprachbefehle"],
 "footer":"MikiLab v14 - Das vernetzte Labor von Michele. Dokument automatisch aus dem Quellcode erzeugt.",
}

C["es"] = {
 "title":"MikiLab v14 - Documento del Ecosistema","suffix":"ES",
 "subtitle":"Documentación completa del ecosistema Cyber-Industrial (64 módulos). Idioma: Español.",
 "arch_h":"Arquitectura y Filosofía",
 "arch_body":"MikiLab es un laboratorio digital manos libres para panaderos: 100% offline-first, síntesis de voz continua sin palabras clave, estilo Cyber-Industrial teal/oscuro. La guía corre exclusivamente a cargo de los avatares dinámicos del Trío Cyber (sin texto estático). Sin HACCP/alérgenos.",
 "sec_h":"1. Las 8 Macro-Áreas",
 "sections":[("Inicio","Escaparate ágil con texto de navegación, Trío Cyber-Bakery interactivo, el Tablón de Miki y el asistente Talk with Miki."),
   ("Modo Chef/Lab","Corazón operativo: parque de máquinas con temporizadores globales, Voice Core manos libres, Puente del Comandante, Smart Planner, Thermal Guard, Team OS y más de 50 herramientas."),
   ("Mis Recetas","Recetas probadas con gramos y porcentaje panadero, método, tiempos y coste; crea y gestiona tus propias recetas."),
   ("Ciencia y Guías (Aprende)","Ruta paso a paso, Sommelier del Pan, fichas técnicas de fermentación, Trío Cyber-Bakery con mini-guías."),
   ("Comunidad","Feed social Pro persistente, canales que seguir, intercambio entre panaderos."),
   ("Manual y Operación B2B","Compendio de máquinas + comandos de voz manos libres + hardware recomendado + índice de módulos 1-64."),
   ("Puente del Comandante","Informes con IA, radar de equipo, mantenimiento predictivo y Multi-Chief Executive Architecture (módulo 64)."),
   ("Talk with Miki","Asistente de IA conversacional en primera persona (voz + texto), con copiloto Miki/Mohamed/Bake Mix, intercom en vivo y escucha continua.")],
 "trio_h":"2. Trío Cyber - Fichas Operativas",
 "trio":[("Miki (El Comandante)","Fundador delgado, cabeza rapada, pendiente, un tatuaje real en el brazo izquierdo, camiseta MikiLab. Asistente de IA conversacional: responde en primera persona sobre cómo el software ayuda a los panaderos y sobre todo el laboratorio."),
   ("Mohamed (La Mano Derecha)","Joven persa/iraní con uniforme MikiLab. Se encarga de las operaciones prácticas (limpieza, carros, hornada) con la 'Lab Live View' (micro-animaciones de las operaciones)."),
   ("Bake Mix (Asistente Robot)","Robot panadero futurista en teal/ámbar. Se encarga de la tecnología, la IA y los comandos de voz; dirige el Interactive Training de los comandos manos libres.")],
 "trio_feat_h":"Funciones comunes del Trío:",
 "trio_feats":["Intercom por auriculares Bluetooth industriales","Auto-Duck de audio (baja la radio durante los anuncios, luego retorno fluido al 100%)","Smart Context Memory (historial de conversación por sesión)","Animación de relevo dinámica al cambiar de copiloto","Apoyo empático paso a paso para el personal","Síntesis de voz (TTS) limpia con háptica sincronizada"],
 "plancia_h":"3. Puente del Comandante - Commander Voice",
 "plancia":["Registro automático y por voz de amasadas, recetas, hornos y calendarios","Multi-Chief: perfil del comandante de turno (nombre, tono, prioridades)","Briefing de relevo de turno generado automáticamente (voz + visual)","Tactical Bottleneck AI y Neural Load Radar con brillo en el parámetro crítico","IoT Predictive Maintenance y Downtime Root-Cause Logging","Informe de Fin de Día (guardado en backend, gráfico histórico, guardado automático nocturno)"],
 "modules_h":"4. Mapa de los 64 Módulos Operativos",
 "tools_h":"5. Herramientas de Laboratorio Activas (Tarjetas)",
 "tools_note":"Herramientas operativas totales detectadas en el código: {n}.",
 "hw_h":"6. Guía de Equipamiento y Hardware B2B",
 "hw_sub_h":"Sensores IoT y hardware recomendados",
 "hw_headers":["Producto","Uso","Dónde conseguirlo"],
 "hw_use":["Sonda de temperatura + humedad LoRaWAN para cámaras y ambiente.","Data logger de temperatura para la cadena de frío (congelador/nevera).","Sondas de contacto para el corazón de la masa y el horno (vía gateway/ESP).","Relés WiFi para controlar hornos, luces y calefacción de cámaras.","Auriculares con cancelación de ruido para el Voice Core manos libres."],
 "mac_sub_h":"Máquinas integrables",
 "mac_headers":["Máquina","Función y Módulos","Marcas / Fuentes"],
 "mac_fn":["Dosificación de masa/relleno y formado continuo. Módulos 31-35.","Calibración de presión/espesor con control de elasticidad. Módulo 36.","Balance aire/vapor, recuperación de vapor, IA de load-balancing. Módulos 37/47/50.","Par amperométrico, índice de estrés, desgaste del pistón. Módulos 38/19/39.","Clima dinámico y recuperación de la cadena de frío. Módulos 40/10.","Pesaje guiado y co-pesaje a cuatro manos, smart-scale sync. Módulos 26/60.","Telemetría de nivel y flujo de harina. Módulo 18.","Seguimiento de ciclos, limpieza y sanitización. Módulo 46."],
 "shots_h":"7. Capturas reales del sitio (Manual ilustrado)",
 "shots_caps":["Inicio - Navegación, Trío Cyber-Bakery y Tablón de Miki","Talk with Miki - Asistente IA, copiloto, intercom en vivo, escucha continua","Puente del Comandante - Informes IA, brillo en el parámetro crítico, Multi-Chief (módulo 64)","Parque de Máquinas - Telemetría IoT, módulos 31-50 con parámetros en vivo","Manual y Operación B2B - Uso en el laboratorio y comandos de voz"],
 "footer":"MikiLab v14 - El laboratorio conectado de Michele. Documento generado automáticamente desde el código fuente.",
}

C["fr"] = {
 "title":"MikiLab v14 - Document de l'Écosystème","suffix":"FR",
 "subtitle":"Documentation complète de l'écosystème Cyber-Industrial (64 modules). Langue : Français.",
 "arch_h":"Architecture et Philosophie",
 "arch_body":"MikiLab est un laboratoire numérique mains libres pour boulangers : 100% offline-first, synthèse vocale continue sans mots-clés, style Cyber-Industrial teal/sombre. Le guidage est assuré exclusivement par les avatars dynamiques du Trio Cyber (aucun texte statique). Pas de HACCP/allergènes.",
 "sec_h":"1. Les 8 Macro-Zones",
 "sections":[("Accueil","Vitrine épurée avec texte de navigation, Trio Cyber-Bakery interactif, le Tableau de Miki et l'assistant Talk with Miki."),
   ("Mode Chef/Labo","Cœur opérationnel : parc machines avec minuteurs globaux, Voice Core mains libres, Passerelle du Commandant, Smart Planner, Thermal Guard, Team OS et plus de 50 outils."),
   ("Mes Recettes","Recettes testées avec grammes et pourcentage boulanger, méthode, temps et coût ; créez et gérez vos propres recettes."),
   ("Science & Guides (Apprendre)","Parcours pas à pas, Sommelier du Pain, fiches techniques de fermentation, Trio Cyber-Bakery avec mini-guides."),
   ("Communauté","Fil social Pro persistant, canaux à suivre, échange entre boulangers."),
   ("Manuel & Opérations B2B","Compendium des machines + commandes vocales mains libres + matériel recommandé + index des modules 1-64."),
   ("Passerelle du Commandant","Reporting IA, radar d'équipe, maintenance prédictive et Multi-Chief Executive Architecture (module 64)."),
   ("Talk with Miki","Assistant IA conversationnel à la première personne (voix + texte), avec co-pilote Miki/Mohamed/Bake Mix, intercom en direct et écoute continue.")],
 "trio_h":"2. Trio Cyber - Fiches Opérationnelles",
 "trio":[("Miki (Le Commandant)","Fondateur mince, crâne rasé, boucle d'oreille, un vrai tatouage sur le bras gauche, t-shirt MikiLab. Assistant IA conversationnel : répond à la première personne sur la façon dont le logiciel aide les boulangers et sur tout le laboratoire."),
   ("Mohamed (Le Bras Droit)","Jeune homme persan/iranien en uniforme MikiLab. Gère les opérations pratiques (nettoyage, chariots, enfournement) avec la 'Lab Live View' (micro-animations des opérations)."),
   ("Bake Mix (Assistant Robot)","Robot boulanger futuriste teal/ambre. Gère la technologie, l'IA et les commandes vocales ; dirige l'Interactive Training des commandes mains libres.")],
 "trio_feat_h":"Fonctions communes du Trio :",
 "trio_feats":["Intercom via casques Bluetooth industriels","Auto-Duck audio (baisse la radio pendant les annonces, puis retour fluide à 100%)","Smart Context Memory (historique de conversation par session)","Animation de passation dynamique au changement de co-pilote","Support empathique pas à pas pour le personnel","Synthèse vocale (TTS) propre avec haptique synchronisée"],
 "plancia_h":"3. Passerelle du Commandant - Commander Voice",
 "plancia":["Enregistrement automatique et vocal des pâtons, recettes, fours et calendriers","Multi-Chief : profil du commandant de service (nom, ton, priorités)","Briefing de passation d'équipe généré automatiquement (voix + visuel)","Tactical Bottleneck AI et Neural Load Radar avec glow sur le paramètre critique","IoT Predictive Maintenance et Downtime Root-Cause Logging","Rapport de Fin de Journée (stockage backend, graphique historique, sauvegarde automatique le soir)"],
 "modules_h":"4. Carte des 64 Modules Opérationnels",
 "tools_h":"5. Outils de Laboratoire Actifs (Cartes)",
 "tools_note":"Outils opérationnels totaux détectés dans le code : {n}.",
 "hw_h":"6. Guide Équipement & Matériel B2B",
 "hw_sub_h":"Capteurs IoT & matériel recommandés",
 "hw_headers":["Produit","Utilisation","Où se le procurer"],
 "hw_use":["Sonde température + humidité LoRaWAN pour chambres et ambiance.","Enregistreur de température pour la chaîne du froid (congélateur/frigo).","Sondes de contact pour le cœur de pâte et le four (via gateway/ESP).","Relais WiFi pour piloter fours, lumières et chauffage des chambres.","Casque à réduction de bruit pour le Voice Core mains libres."],
 "mac_sub_h":"Machines intégrables",
 "mac_headers":["Machine","Fonction & Modules","Marques / Sources"],
 "mac_fn":["Dosage pâte/farce et façonnage continu. Modules 31-35.","Calibrage pression/épaisseur avec contrôle d'élasticité. Module 36.","Équilibrage air/vapeur, récupération de vapeur, IA de load-balancing. Modules 37/47/50.","Couple ampérométrique, indice de stress, usure du piston. Modules 38/19/39.","Climat dynamique et récupération de la chaîne du froid. Modules 40/10.","Pesée guidée et co-pesée à quatre mains, smart-scale sync. Modules 26/60.","Télémétrie de niveau et de flux de farine. Module 18.","Suivi des cycles, nettoyage et désinfection. Module 46."],
 "shots_h":"7. Captures réelles du site (Manuel illustré)",
 "shots_caps":["Accueil - Navigation, Trio Cyber-Bakery et Tableau de Miki","Talk with Miki - Assistant IA, co-pilote, intercom en direct, écoute continue","Passerelle du Commandant - Reporting IA, glow sur le paramètre critique, Multi-Chief (module 64)","Parc Machines - Télémétrie IoT, modules 31-50 avec paramètres en direct","Manuel & Opérations B2B - Utilisation en laboratoire et commandes vocales"],
 "footer":"MikiLab v14 - Le laboratoire connecté de Michele. Document généré automatiquement à partir du code source.",
}

# Persiano: narrativa in persiano; tabelle hw/mac riusano le descrizioni EN (rese in RTL).
C["fa"] = {
 "title":"سند اکوسیستم MikiLab نسخه ۱۴","suffix":"FA",
 "subtitle":"مستندات کامل اکوسیستم سایبری-صنعتی (۶۴ ماژول). زبان: فارسی.",
 "arch_h":"معماری و فلسفه",
 "arch_body":"MikiLab یک آزمایشگاه دیجیتال بدون دخالت دست برای نانواهاست: کاملاً آفلاین، سنتز گفتار پیوسته بدون کلمهٔ کلیدی، سبک سایبری-صنعتی در رنگ فیروزه‌ای و تیره. راهنمایی تنها بر عهدهٔ آواتارهای پویای سه‌گانهٔ سایبری است (بدون متن ثابت).",
 "sec_h":"۱. هشت حوزهٔ اصلی",
 "sections":[("خانه","ویترین سبک با متن ناوبری، سه‌گانهٔ تعاملی Cyber-Bakery، تابلوی میکی و دستیار Talk with Miki."),
   ("حالت سرآشپز/آزمایشگاه","قلب عملیاتی: پارک ماشین‌آلات با تایمرهای سراسری، Voice Core بدون دست، پل فرمانده، Smart Planner، Thermal Guard، Team OS و بیش از ۵۰ ابزار."),
   ("دستورهای من","دستورهای آزمایش‌شده با گرم و درصد نانوایی، روش، زمان‌بندی و هزینه؛ ایجاد و مدیریت دستورهای شخصی."),
   ("علم و راهنماها (یادگیری)","مسیر گام‌به‌گام، سامِلیه نان، کارت‌های فنی تخمیر، سه‌گانهٔ Cyber-Bakery با راهنماهای کوتاه."),
   ("انجمن","فید اجتماعی حرفه‌ای پایدار، کانال‌هایی برای دنبال‌کردن و تبادل میان نانواها."),
   ("راهنما و عملیات B2B","دانشنامهٔ ماشین‌آلات + فرمان‌های صوتی بدون دست + سخت‌افزار پیشنهادی + فهرست ماژول‌های ۱ تا ۶۴."),
   ("پل فرمانده","گزارش‌دهی هوش مصنوعی، رادار تیم، نگهداری پیش‌بینانه و Multi-Chief Executive Architecture (ماژول ۶۴)."),
   ("Talk with Miki","دستیار مکالمه‌ای هوش مصنوعی به‌صورت اول‌شخص (صدا + متن)، با همیار Miki/Mohamed/Bake Mix، اینترکام زنده و شنیدن پیوسته.")],
 "trio_h":"۲. سه‌گانهٔ سایبری - کارت‌های عملیاتی",
 "trio":[("میکی (فرمانده)","بنیان‌گذار لاغراندام با موی تراشیده، گوشواره، خالکوبی واقعی روی بازوی چپ و تی‌شرت MikiLab. دستیار مکالمه‌ای که به اول‌شخص پاسخ می‌دهد نرم‌افزار چگونه به نانواها کمک می‌کند."),
   ("محمد (دست راست)","مرد جوان ایرانی/فارس با لباس MikiLab. مسئول عملیات عملی (نظافت، چرخ‌دستی، بارگذاری فر) با 'Lab Live View'."),
   ("Bake Mix (دستیار روبات)","روبات نانوای آینده‌نگر با رنگ فیروزه‌ای/کهربایی. مسئول فناوری، هوش مصنوعی و فرمان‌های صوتی؛ هدایت آموزش تعاملی فرمان‌های بدون دست.")],
 "trio_feat_h":"ویژگی‌های مشترک سه‌گانه:",
 "trio_feats":["اینترکام از طریق هدست‌های صنعتی بلوتوث","کاهش خودکار صدا (کم‌کردن رادیو هنگام اعلان‌ها و بازگشت نرم به ۱۰۰٪)","حافظهٔ زمینه‌ای هوشمند (تاریخچهٔ گفتگو در هر نشست)","انیمیشن پویا هنگام تعویض همیار","پشتیبانی گام‌به‌گام و همدلانه از کارکنان","سنتز گفتار تمیز همراه با لرزش هماهنگ"],
 "plancia_h":"۳. پل فرمانده - Commander Voice",
 "plancia":["ثبت خودکار و صوتی خمیرها، دستورها، فرها و تقویم‌ها","Multi-Chief: نمایهٔ فرماندهٔ شیفت (نام، لحن، اولویت‌ها)","بریفینگ تحویل شیفت که به‌طور خودکار تولید می‌شود (صوت + تصویر)","Tactical Bottleneck AI و Neural Load Radar با درخشش روی پارامتر بحرانی","IoT Predictive Maintenance و Downtime Root-Cause Logging","گزارش پایان روز (ذخیره در بک‌اند، نمودار تاریخی، ذخیرهٔ خودکار شبانه)"],
 "modules_h":"۴. نقشهٔ ۶۴ ماژول عملیاتی",
 "tools_h":"۵. ابزارهای فعال آزمایشگاه (کارت‌ها)",
 "tools_note":"مجموع ابزارهای عملیاتی شناسایی‌شده در کد منبع: {n}.",
 "hw_h":"۶. راهنمای تجهیزات و سخت‌افزار B2B",
 "hw_sub_h":"حسگرهای IoT و سخت‌افزار پیشنهادی",
 "hw_headers":["محصول","کاربرد","محل تهیه"],
 "hw_use":C["en"]["hw_use"],
 "mac_sub_h":"ماشین‌های قابل یکپارچه‌سازی",
 "mac_headers":["ماشین","عملکرد و ماژول‌ها","برندها / منابع"],
 "mac_fn":C["en"]["mac_fn"],
 "shots_h":"۷. تصاویر واقعی وب‌سایت (راهنمای مصور)",
 "shots_caps":["خانه - ناوبری، سه‌گانهٔ Cyber-Bakery و تابلوی میکی","Talk with Miki - دستیار هوش مصنوعی، همیار، اینترکام زنده، شنیدن پیوسته","پل فرمانده - گزارش‌دهی هوش مصنوعی، درخشش روی پارامتر بحرانی، Multi-Chief (ماژول ۶۴)","پارک ماشین‌آلات - تله‌متری IoT، ماژول‌های ۳۱ تا ۵۰ با پارامترهای زنده","راهنما و عملیات B2B - استفاده در آزمایشگاه و فرمان‌های صوتی"],
 "footer":"MikiLab نسخه ۱۴ - آزمایشگاه متصل میکله. این سند به‌طور خودکار از کد منبع تولید شده است.",
}


def read_tools():
    try:
        with open("/tmp/tools.txt") as f:
            return [l.strip() for l in f if l.strip()]
    except Exception:
        return []


def build(lang):
    D = C[lang]
    rtl = (lang == "fa")
    base_font = "FA" if rtl else "Helvetica"
    bold_font = "FA-Bold" if rtl else "Helvetica-Bold"
    align_body = TA_RIGHT if rtl else TA_LEFT

    styles = getSampleStyleSheet()
    H1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=TEAL, fontSize=20, spaceAfter=6, fontName=bold_font, alignment=align_body)
    H2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=GOLD, fontSize=14, spaceBefore=10, spaceAfter=4, fontName=bold_font, alignment=align_body)
    H3 = ParagraphStyle("H3", parent=styles["Heading3"], textColor=SLATE, fontSize=11.5, spaceBefore=6, spaceAfter=2, fontName=bold_font, alignment=align_body)
    BODY = ParagraphStyle("BODY", parent=styles["BodyText"], fontSize=9.5, leading=13.5, alignment=align_body, fontName=base_font)
    SMALL = ParagraphStyle("SMALL", parent=styles["BodyText"], fontSize=8, textColor=colors.grey, fontName=base_font, alignment=align_body)
    CELL = ParagraphStyle("CELL", parent=BODY, fontSize=7.6, leading=10)

    def P(text, style):
        return Paragraph(R(text, lang), style)

    out = os.path.join(OUT, f"MikiLab_v14_Ecosystem_Document_{D['suffix']}.pdf")
    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=16*mm, rightMargin=16*mm, topMargin=16*mm, bottomMargin=16*mm, title=D["title"])
    S = []
    S.append(P(D["title"], H1))
    S.append(P(D["subtitle"], BODY))
    S.append(HRFlowable(color=TEAL, thickness=1.2, spaceBefore=6, spaceAfter=8))
    S.append(P(D["arch_h"], H2)); S.append(P(D["arch_body"], BODY))

    S.append(P(D["sec_h"], H2))
    for n, d in D["sections"]:
        S.append(P(n, H3)); S.append(P(d, BODY))

    S.append(P(D["trio_h"], H2))
    for n, d in D["trio"]:
        S.append(P(n, H3)); S.append(P(d, BODY))
    S.append(P(D["trio_feat_h"], H3))
    S.append(ListFlowable([ListItem(P(x, BODY)) for x in D["trio_feats"]], bulletColor=TEAL, leftIndent=10))

    S.append(P(D["plancia_h"], H2))
    S.append(ListFlowable([ListItem(P(x, BODY)) for x in D["plancia"]], bulletColor=GOLD, leftIndent=10))

    S.append(PageBreak())
    S.append(P(D["modules_h"], H2))
    half = (len(MODULES)+1)//2
    rows = [[P("#", CELL), P(MODULES.get(1) and "Module" or "", CELL), P("#", CELL), P("Module", CELL)]]
    for i in range(half):
        a = i+1; b = i+1+half
        rows.append([P(str(a), CELL), P(MODULES.get(a, ""), CELL), P(str(b) if b in MODULES else "", CELL), P(MODULES.get(b, ""), CELL)])
    t = Table(rows, colWidths=[8*mm, 80*mm, 8*mm, 80*mm])
    t.setStyle(TableStyle([
     ("BACKGROUND", (0, 0), (-1, 0), TEAL), ("FONTSIZE", (0, 0), (-1, -1), 7.6), ("VALIGN", (0, 0), (-1, -1), "TOP"),
     ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#eef4f3")]),
     ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5d3"))]))
    S.append(t)

    S.append(P(D["tools_h"], H2))
    tools = read_tools()
    if tools:
        S.append(P(" • ".join(tools), BODY))
        S.append(P(D["tools_note"].format(n=len(tools)), SMALL))

    S.append(PageBreak())
    S.append(P(D["hw_h"], H2))
    S.append(P(D["hw_sub_h"], H3))
    hw = [[P(h, CELL) for h in D["hw_headers"]]]
    for (name, src), use in zip(HW_ITEMS, D["hw_use"]):
        hw.append([P(name, CELL), P(use, CELL), P(src, CELL)])
    th = Table(hw, colWidths=[42*mm, 86*mm, 40*mm])
    th.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD), ("FONTSIZE", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP"),
     ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0cfa0")), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#fbf3df")])]))
    S.append(th)

    S.append(P(D["mac_sub_h"], H3))
    mc = [[P(h, CELL) for h in D["mac_headers"]]]
    for (name, src), fn in zip(MAC_ITEMS, D["mac_fn"]):
        mc.append([P(name, CELL), P(fn, CELL), P(src, CELL)])
    tm = Table(mc, colWidths=[46*mm, 82*mm, 40*mm])
    tm.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("FONTSIZE", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP"),
     ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5d3")), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#eef4f3")])]))
    S.append(tm)

    # Screenshot reali
    S.append(PageBreak())
    S.append(P(D["shots_h"], H2))
    IMGW = 74*mm
    pairs = [(0, 1), (2, 3), (4, None)]
    caps = D["shots_caps"]
    for a, b in pairs:
        cells, capc = [], []
        for idx in (a, b):
            if idx is None:
                continue
            p = os.path.join(IMGDIR, SHOTS[idx])
            if os.path.exists(p):
                cells.append(RLImage(p, width=IMGW, height=IMGW*900/430)); capc.append(P(caps[idx], SMALL))
        if not cells:
            continue
        row = Table([cells], colWidths=[IMGW+6*mm]*len(cells)); row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]))
        caprow = Table([capc], colWidths=[IMGW+6*mm]*len(capc)); caprow.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2)]))
        S.append(row); S.append(caprow); S.append(Spacer(1, 8))

    S.append(P(D["footer"], SMALL))
    doc.build(S)
    return out, os.path.getsize(out)


if __name__ == "__main__":
    LANGS = ["it", "de", "en", "es", "fr"] + (["fa"] if FA_OK else [])
    for lg in LANGS:
        try:
            path, size = build(lg)
            print(f"OK {lg}: {os.path.basename(path)} ({size} bytes)")
        except Exception as e:
            print(f"FAIL {lg}: {e}")
    # copia IT come nome legacy senza suffisso (retrocompatibilità)
    import shutil
    src = os.path.join(OUT, "MikiLab_v14_Ecosystem_Document_IT.pdf")
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(OUT, "MikiLab_v14_Ecosystem_Document.pdf"))
        print("Legacy IT copy updated.")
