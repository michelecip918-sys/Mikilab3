import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                ListFlowable, ListItem, HRFlowable, PageBreak)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT

# Deutsche Version des MikiLab v14 Ecosystem-Dokuments.
# Helvetica (Latin-1) unterstützt Umlaute ä ö ü ß korrekt.
TEAL = colors.HexColor("#3E9C93"); GOLD = colors.HexColor("#E0A106")
DARK = colors.HexColor("#0E1620"); SLATE = colors.HexColor("#2B303B")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=TEAL, fontSize=20, spaceAfter=6)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=GOLD, fontSize=14, spaceBefore=10, spaceAfter=4)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], textColor=SLATE, fontSize=11.5, spaceBefore=6, spaceAfter=2)
BODY = ParagraphStyle("BODY", parent=styles["BodyText"], fontSize=9.5, leading=13.5, alignment=TA_LEFT)
SMALL = ParagraphStyle("SMALL", parent=styles["BodyText"], fontSize=8, textColor=colors.grey)

# Modulnamen bleiben als Produkt-/Feature-Bezeichnungen (überwiegend englische Fachbegriffe).
MODULES = {
 1:"Predictive Flour Hydration AI",2:"Dynamic Oven Thermal Planner",3:"Thermische Timeline Rot/Amber",
 4:"Live Energy & kWh Counter",5:"Tactical Bottleneck AI",6:"Neural Load Radar",7:"Cyber-Wave Audio Visualizer",
 8:"IoT Predictive Maintenance",9:"Automated Yeast Maturity Tracker",10:"Cold Chain Auto-Recovery",
 11:"Energy Tariff Auto-Shift",12:"Voice Batch Traceability",13:"Real-Time Yield & Waste Analytics",
 14:"Multi-Zone Audio Routing",15:"Dynamic Delivery Express Sync",16:"Ghost Shift Auto-Pilot",
 17:"Virtual Baker Coach",18:"Digital Silo Telemetry",19:"Equipment Stress Index",20:"Voice Shift Handover Notes",
 21:"Offline Spatial Tour",22:"Aufgaben-Zerlegung",23:"Sprach-Glossar Offline",24:"Mikro-Validierung",
 25:"Apprentice Progress Index",26:"Vier-Hand-Co-Wiegen",27:"SOS Kollege",28:"Voice Kudos",29:"Formmetronom",
 30:"Cross-Shift Handover Log",31:"Rheon Dough/Filling Ratio",32:"Shutter Speed Sync",33:"Multi-Feeder Guard",
 34:"Rheon PMU Recall",35:"Thermal Friction Index",36:"Hydraulic Press Pressure & Thickness",
 37:"Multi-Deck & Rotationsofen Airflow Hydro-Balance",38:"Amperometric Torque Control",
 39:"Volumetric Divider & Piston Wear",40:"Dynamic Climate Control Proofer",41:"Predictive Loading Bay & Route Dispatch",
 42:"Dynamic Rack & Trolley Buffer Tracking",43:"Synchronized Multi-Oven Unloading Wave",
 44:"Real-Time Ingredient Buffer Replenishment",45:"Executive Emergency Re-Routing AI",
 46:"Dynamic Tray, Mold & Oven Tool Inventory",47:"Steam Recovery & Recirculation",48:"Hands-Free Quick Maintenance Guide",
 49:"Downtime Root-Cause Logging",50:"Multi-Deck Load Balancing AI",
 51:"Startup Splash Screen (Glitch-Neon)",52:"Mikis Pinnwand",53:"Cyber-Industrial Kit (Space-Tech Schrift)",
 54:"Synchronized Success Sound",55:"Dynamic Focus Animation",56:"Mikis Handshake (haptisch)",
 57:"Mohameds Lab Live View",58:"Bake Mix - Interactive Training",59:"Audio Snapshot",60:"Smart Scale Sync",
 61:"Stress Index",62:"Recipe Scaling",63:"Squad Check-In",64:"Multi-Chief Executive Architecture",
}

SEZIONI = [
 ("Home","Schlanke Vitrine mit Navigationstext, interaktivem Cyber-Bakery-Trio, Mikis Pinnwand und dem Assistenten Talk with Miki."),
 ("Chef- / Labor-Modus","Operatives Herz: Maschinenpark mit globalen Timern, freihändiger Voice Core, Chef-Kommandobrücke, Smart Planner, Thermal Guard, Team OS sowie über 50 Werkzeuge."),
 ("Meine Rezepte","Getestete Rezepte mit Mengen in Gramm und Prozent, Methode, Zeiten und Kosten; Erstellung und Verwaltung eigener Rezepte."),
 ("Wissenschaft & Anleitungen (Lernen)","Schritt-für-Schritt-Pfad, Brot-Sommelier, technische Fermentationskarten, Cyber-Bakery-Trio mit Mini-Anleitungen."),
 ("Community","Persistenter Pro-Social-Feed, Kanälen folgen, Austausch unter Bäckern."),
 ("Handbuch & B2B-Betrieb","Maschinen-Kompendium + freihändige Sprachbefehle + empfohlene Hardware + Index der Module 1-64."),
 ("Chef-Kommandobrücke","KI-Reporting, Team-Radar, vorausschauende Wartung und Multi-Chief Executive Architecture (Modul 64)."),
 ("Talk with Miki","Konversationeller KI-Assistent in der Ich-Form (Stimme + Text), mit Co-Pilot Miki/Mohamed/Bake Mix, Live-Intercom und Dauerhören."),
]

TRIO = [
 ("Miki (Der Chef)","Schlanker Gründer, rasierte Haare, Ohrring, echtes Tattoo am linken Arm, MikiLab-T-Shirt. Konversationeller KI-Assistent: antwortet in der Ich-Form, wie die Software Bäckern hilft und rund um das gesamte Labor."),
 ("Mohamed (Rechte Hand)","Persischer/iranischer junger Mann in MikiLab-Uniform. Zuständig für praktische Abläufe (Reinigung, Wagen, Beschickung) mit der 'Lab Live View' (Mikro-Animationen der Vorgänge)."),
 ("Bake Mix (Roboter-Assistent)","Futuristischer Bäcker-Roboter in Teal/Amber. Zuständig für Technik, KI und Sprachbefehle; leitet das Interactive Training der freihändigen Befehle."),
]
TRIO_FEATURES = ["Intercom über industrielle Bluetooth-Headsets","Auto-Duck Audio (senkt das Radio während der Ansagen, danach flüssige Rückkehr auf 100%)",
 "Smart Context Memory (Gesprächsverlauf pro Sitzung)","Dynamischer Handoff-Animation beim Wechsel des Co-Piloten","Empathische Schritt-für-Schritt-Unterstützung für das Personal","Saubere Sprachsynthese (TTS) mit synchronisierter Haptik"]

PLANCIA = ["Automatische und sprachgesteuerte Erfassung von Chargen, Rezepten, Öfen und Kalendern","Multi-Chief: Profil des diensthabenden Chefs (Name, Tonfall, Prioritäten)",
 "Automatisch erzeugtes Schichtübergabe-Briefing (Sprache + visuell)","Tactical Bottleneck AI und Neural Load Radar mit Glow auf dem kritischen Parameter",
 "IoT Predictive Maintenance und Downtime Root-Cause Logging","Tagesabschlussbericht (Backend-Speicherung, historisches Diagramm, automatisches Abend-Speichern)"]

HARDWARE = [
 ("Milesight EM300-TH","Temperatur- + Feuchtigkeitssonde LoRaWAN für Zellen und Umgebung.","milesight.com"),
 ("Efento (NB-IoT / BLE)","Temperatur-Datenlogger für die Kühlkette (Gefrier-/Kühlschrank).","getefento.com"),
 ("Sonden PT100 / DS18B20","Kontaktsonden für Teigkern und Ofen (über Gateway/ESP).","rs-online.com"),
 ("Relais Shelly / Sonoff","WLAN-Relais zur Steuerung von Öfen, Licht und Zellen-Heizungen.","shelly.com"),
 ("Kabellose Headsets Jabra","Kopfhörer mit Geräuschunterdrückung für den freihändigen Voice Core.","jabra.com"),
]
MACCHINARI = [
 ("Rheon-Linien (Encrusting/Extruder)","Dosierung von Teig/Füllung und kontinuierliches Formen. Module 31-35.","Rheon, Vertrieb von Industrielinien"),
 ("Hydraulische Pressen & Formmaschinen","Kalibrierung von Druck/Dicke mit Elastizitätskontrolle. Modul 36.","Anbieter von Backausstattung"),
 ("Multi-Deck- & Rotationsöfen","Luft-/Dampf-Balance, Dampfrückgewinnung, Load-Balancing-KI. Module 37/47/50.","Industrieofen-Marken (z. B. Wachtel, MIWE, Zucchelli)"),
 ("Spiralkneter & Teigteiler","Amperometrisches Drehmoment, Stress-Index, Kolbenverschleiß. Module 38/19/39.","Anbieter professioneller Kneter"),
 ("Gär- & Gefrierzellen","Dynamisches Klima und Wiederherstellung der Kühlkette. Modul 40/10.","Anbieter von Zellen und Schockfrostern"),
 ("IoT-Waagen (Smart Scale)","Geführtes Wiegen und Vier-Hand-Co-Wiegen, Smart-Scale-Sync. Module 26/60.","Industriewaagen mit Konnektivität"),
 ("Industrie-Mehlsilos","Telemetrie von Füllstand und Mehlfluss. Modul 18.","Anbieter von Silos und Mehltransport"),
 ("Bleche, Formen, Schieber & Werkzeuge","Verfolgung von Zyklen, Reinigung und Sanitisierung. Modul 46.","Anbieter von Backwerkzeugen"),
]


def read_tools():
    try:
        with open("/tmp/tools.txt") as f:
            return [l.strip() for l in f if l.strip()]
    except Exception:
        return []


doc = SimpleDocTemplate("/app/frontend/public/MikiLab_v14_Ecosystem_Document_DE.pdf", pagesize=A4,
                        leftMargin=16*mm, rightMargin=16*mm, topMargin=16*mm, bottomMargin=16*mm,
                        title="MikiLab v14 Ökosystem-Dokument (DE)")
S = []
S.append(Paragraph("MikiLab v14 - Ökosystem-Dokument", H1))
S.append(Paragraph("Vollständige Dokumentation des Cyber-Industrial-Ökosystems (64 Module). Sprache: Deutsch.", BODY))
S.append(HRFlowable(color=TEAL, thickness=1.2, spaceBefore=6, spaceAfter=8))
S.append(Paragraph("Architektur & Philosophie", H2))
S.append(Paragraph("MikiLab ist ein freihändiges digitales Labor für Bäcker: 100% offline-fähig, kontinuierliche Sprachsynthese ohne Schlüsselwörter, Cyber-Industrial-Stil in Teal/Dunkel. Die Führung übernehmen ausschließlich die dynamischen Avatare des Cyber-Trios (kein statischer Text). Kein HACCP/Allergene.", BODY))

S.append(Paragraph("1. Die 8 Hauptbereiche", H2))
for n, d in SEZIONI:
    S.append(Paragraph(n, H3)); S.append(Paragraph(d, BODY))

S.append(Paragraph("2. Cyber-Trio - Einsatzkarten", H2))
for n, d in TRIO:
    S.append(Paragraph(n, H3)); S.append(Paragraph(d, BODY))
S.append(Paragraph("Gemeinsame Funktionen des Trios:", H3))
S.append(ListFlowable([ListItem(Paragraph(x, BODY)) for x in TRIO_FEATURES], bulletColor=TEAL, leftIndent=10))

S.append(Paragraph("3. Chef-Kommandobrücke - Commander Voice", H2))
S.append(ListFlowable([ListItem(Paragraph(x, BODY)) for x in PLANCIA], bulletColor=GOLD, leftIndent=10))

S.append(PageBreak())
S.append(Paragraph("4. Karte der 64 operativen Module", H2))
rows = [["#", "Modul", "#", "Modul"]]
half = (len(MODULES)+1)//2
for i in range(half):
    a = i+1; b = i+1+half
    rows.append([str(a), MODULES.get(a, ''), str(b) if b in MODULES else "", MODULES.get(b, '')])
t = Table(rows, colWidths=[8*mm, 80*mm, 8*mm, 80*mm])
t.setStyle(TableStyle([
 ("BACKGROUND", (0, 0), (-1, 0), TEAL), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
 ("FONTSIZE", (0, 0), (-1, -1), 7.6), ("VALIGN", (0, 0), (-1, -1), "TOP"),
 ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#eef4f3")]),
 ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5d3")),
 ("TEXTCOLOR", (0, 1), (0, -1), GOLD), ("TEXTCOLOR", (2, 1), (2, -1), GOLD),
 ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
]))
S.append(t)

S.append(Paragraph("5. Aktive Laborwerkzeuge (Karten)", H2))
tools = read_tools()
if tools:
    S.append(Paragraph(" &nbsp;•&nbsp; ".join(tools), BODY))
    S.append(Paragraph(f"Im Quellcode erkannte operative Werkzeuge insgesamt: {len(tools)}.", SMALL))

S.append(PageBreak())
S.append(Paragraph("6. Ausstattungs- & B2B-Hardware-Leitfaden", H2))
S.append(Paragraph("Empfohlene IoT-Sensoren & Hardware", H3))
hw = [["Produkt", "Verwendung", "Bezugsquelle"]]+[[a, b, c] for a, b, c in HARDWARE]
th = Table(hw, colWidths=[42*mm, 86*mm, 40*mm])
th.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
 ("FONTSIZE", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0cfa0")),
 ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#fbf3df")])]))
S.append(th)
S.append(Paragraph("Integrierbare Maschinen", H3))
mc = [["Maschine", "Funktion & Module", "Marken / Bezugsquellen"]]+[[a, b, c] for a, b, c in MACCHINARI]
tm = Table(mc, colWidths=[46*mm, 82*mm, 40*mm])
tm.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
 ("FONTSIZE", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5d3")),
 ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#eef4f3")])]))
S.append(tm)
S.append(Spacer(1, 8))
S.append(HRFlowable(color=GOLD, thickness=1, spaceBefore=6, spaceAfter=6))

# 7. Echte Screenshots der Website (bebildertes Handbuch)
from reportlab.platypus import Image as RLImage
IMGDIR = "/root/.emergent/automation_output/20260904_025840"
SHOTS = [
 ("doc_home.jpeg", "Home - Navigation, Cyber-Bakery-Trio und Mikis Pinnwand"),
 ("doc_talk.jpeg", "Talk with Miki - KI-Assistent, Co-Pilot, Live-Intercom, Dauerhören"),
 ("doc_plancia.jpeg", "Chef-Kommandobrücke - KI-Reporting, Glow auf dem kritischen Parameter, Multi-Chief (Modul 64)"),
 ("doc_parco.jpeg", "Maschinenpark - IoT-Telemetrie, Module 31-50 mit Live-Parametern"),
 ("doc_manuale.jpeg", "Handbuch & B2B-Betrieb - Einsatz im Labor und Sprachbefehle"),
]
S.append(PageBreak())
S.append(Paragraph("7. Echte Screenshots der Website (bebildertes Handbuch)", H2))
IMGW = 74*mm
pairs = [SHOTS[i:i+2] for i in range(0, len(SHOTS), 2)]
for pair in pairs:
    cells = []; caps = []
    for fn, cap in pair:
        p = os.path.join(IMGDIR, fn)
        if os.path.exists(p):
            cells.append(RLImage(p, width=IMGW, height=IMGW*900/430)); caps.append(Paragraph(cap, SMALL))
    if not cells:
        continue
    row = Table([cells], colWidths=[IMGW+6*mm]*len(cells)); row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]))
    caprow = Table([caps], colWidths=[IMGW+6*mm]*len(caps)); caprow.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2)]))
    S.append(row); S.append(caprow); S.append(Spacer(1, 8))

S.append(Paragraph("MikiLab v14 - Das vernetzte Labor von Michele. Dokument automatisch aus dem Quellcode erzeugt.", SMALL))

doc.build(S)
print("PDF DE OK:", os.path.getsize("/app/frontend/public/MikiLab_v14_Ecosystem_Document_DE.pdf"), "bytes")
