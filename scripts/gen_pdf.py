import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                ListFlowable, ListItem, HRFlowable, PageBreak)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT

TEAL = colors.HexColor("#3E9C93"); GOLD = colors.HexColor("#E0A106")
DARK = colors.HexColor("#0E1620"); SLATE = colors.HexColor("#2B303B")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=TEAL, fontSize=20, spaceAfter=6)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=GOLD, fontSize=14, spaceBefore=10, spaceAfter=4)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], textColor=SLATE, fontSize=11.5, spaceBefore=6, spaceAfter=2)
BODY = ParagraphStyle("BODY", parent=styles["BodyText"], fontSize=9.5, leading=13.5, alignment=TA_LEFT)
SMALL = ParagraphStyle("SMALL", parent=styles["BodyText"], fontSize=8, textColor=colors.grey)

MODULES = {
 1:"Predictive Flour Hydration AI",2:"Dynamic Oven Thermal Planner",3:"Timeline Termica Rosso/Ambra",
 4:"Live Energy & kWh Counter",5:"Tactical Bottleneck AI",6:"Neural Load Radar",7:"Cyber-Wave Audio Visualizer",
 8:"IoT Predictive Maintenance",9:"Automated Yeast Maturity Tracker",10:"Cold Chain Auto-Recovery",
 11:"Energy Tariff Auto-Shift",12:"Voice Batch Traceability",13:"Real-Time Yield & Waste Analytics",
 14:"Multi-Zone Audio Routing",15:"Dynamic Delivery Express Sync",16:"Ghost Shift Auto-Pilot",
 17:"Virtual Baker Coach",18:"Digital Silo Telemetry",19:"Equipment Stress Index",20:"Voice Shift Handover Notes",
 21:"Offline Spatial Tour",22:"Scomposizione Compiti",23:"Glossario Vocale Offline",24:"Micro-Validazione",
 25:"Apprentice Progress Index",26:"Co-Pesa a 4 mani",27:"SOS Collega",28:"Voice Kudos",29:"Metronomo Formatura",
 30:"Cross-Shift Handover Log",31:"Rheon Dough/Filling Ratio",32:"Shutter Speed Sync",33:"Multi-Feeder Guard",
 34:"Rheon PMU Recall",35:"Thermal Friction Index",36:"Hydraulic Press Pressure & Thickness",
 37:"Multi-Deck & Rotative Oven Airflow Hydro-Balance",38:"Amperometric Torque Control",
 39:"Volumetric Divider & Piston Wear",40:"Dynamic Climate Control Proofer",41:"Predictive Loading Bay & Route Dispatch",
 42:"Dynamic Rack & Trolley Buffer Tracking",43:"Synchronized Multi-Oven Unloading Wave",
 44:"Real-Time Ingredient Buffer Replenishment",45:"Executive Emergency Re-Routing AI",
 46:"Dynamic Tray, Mold & Oven Tool Inventory",47:"Steam Recovery & Recirculation",48:"Hands-Free Quick Maintenance Guide",
 49:"Downtime Root-Cause Logging",50:"Multi-Deck Load Balancing AI",
 51:"Startup Splash Screen (glitch neon)",52:"La Bacheca di Miki",53:"Cyber-Industrial Kit (font Space-Tech)",
 54:"Synchronized Success Sound",55:"Dynamic Focus Animation",56:"Miki's Handshake (aptica)",
 57:"Mohamed's Lab Live View",58:"Bake Mix - Interactive Training",59:"Audio Snapshot",60:"Smart Scale Sync",
 61:"Stress Index",62:"Recipe Scaling",63:"Squad Check-In",64:"Multi-Chief Executive Architecture",
}

SEZIONI = [
 ("Home","Vetrina snella con testo di navigazione, Cyber-Bakery Trio interattivo, Bacheca di Miki e assistente Talk with Miki."),
 ("Modalita Chef / Laboratorio","Cuore operativo: Parco Macchine con timer globali, Voice Core hands-free, Plancia Capo, Smart Planner, Thermal Guard, Team OS, oltre 50 strumenti."),
 ("Le Mie Ricette","Ricette testate con dosi in grammi e percentuale, metodo, tempi e costi; creazione e gestione ricette personali."),
 ("Scienza & Guide (Impara)","Percorso a step, Brot Sommelier, Schede Tecniche di fermentazione, Cyber-Bakery Trio con mini-guide."),
 ("Community","Feed social Pro persistente, follow canali, condivisione tra panettieri."),
 ("Manuale & Operativita B2B","Prontuario macchinari + comandi vocali hands-free + hardware consigliato + indice Moduli 1-64."),
 ("Plancia Capo","Reporting AI, radar del team, manutenzione predittiva e Multi-Chief Executive Architecture (Modulo 64)."),
 ("Talk with Miki","Assistente conversazionale AI in prima persona (voce + testo), con Co-Pilota Miki/Mohamed/Bake Mix, Intercom Live e ascolto continuo."),
]

TRIO = [
 ("Miki (Il Capo)","Fondatore magro, capelli rasati, orecchino, tatuaggio reale sul braccio sinistro, t-shirt MikiLab. Assistente conversazionale AI: risponde in prima persona su come il software aiuta i panettieri e su tutto il laboratorio."),
 ("Mohamed (Braccio destro)","Ragazzo persiano/iraniano in divisa MikiLab. Interviene sulle operazioni pratiche (pulizia, carrelli, infornata) con la 'Lab Live View' (micro-animazioni delle operazioni)."),
 ("Bake Mix (Assistente Robot)","Robot panettiere futurista teal/amber. Interviene su tecnologia, IA e comandi vocali; guida l'Interactive Training dei comandi hands-free."),
]
TRIO_FEATURES = ["Intercom cuffie Bluetooth industriali","Auto-Duck audio (abbassa la radio durante gli avvisi, poi ripristino fluido al 100%)",
 "Smart Context Memory (cronologia conversazione per sessione)","Dynamic Handoff animato al cambio Co-Pilota","Supporto empatico passo-passo per il personale","Sintesi vocale (TTS) pulita e aptica sincronizzata"]

PLANCIA = ["Compilazione automatica e vocale di lotti, ricette, forni e calendari","Multi-Chief: profilo del Capo in carica (nome, tono, priorita)",
 "Briefing di passaggio consegne generato automaticamente (vocale + visivo)","Tactical Bottleneck AI e Neural Load Radar con glow sul parametro critico",
 "IoT Predictive Maintenance e Downtime Root-Cause Logging","Report di fine giornata (salvataggio backend, grafico storico, salvataggio automatico serale)"]

HARDWARE = [
 ("Milesight EM300-TH","Sonda temperatura + umidita LoRaWAN per celle e ambiente.","milesight.com"),
 ("Efento (NB-IoT / BLE)","Data-logger temperatura per catena del freddo (freezer/frigo).","getefento.com"),
 ("Sonde PT100 / DS18B20","Sonde a contatto per cuore impasto e forno (via gateway/ESP).","rs-online.com"),
 ("Rele Shelly / Sonoff","Rele Wi-Fi per pilotare forni, luci e resistenze celle.","shelly.com"),
 ("Cuffie wireless Jabra","Auricolari a cancellazione rumore per il Voice Core hands-free.","jabra.com"),
]
MACCHINARI = [
 ("Linee Rheon (Encrusting/Estrusore)","Dosaggio pasta/ripieno e formatura continua. Moduli 31-35.","Rheon, distributori linee industriali"),
 ("Presse & Formatrici idrauliche","Calibrazione pressione/spessore con controllo elasticita. Modulo 36.","Fornitori attrezzature panificazione"),
 ("Forni Multi-Deck & Rotativi","Bilanciamento aria/vapore, recupero vapore, load balancing AI. Moduli 37/47/50.","Marchi forni industriali (es. Wachtel, MIWE, Zucchelli)"),
 ("Impastatrici a spirale & Spezzatrici","Coppia amperometrica, stress index, usura pistoni. Moduli 38/19/39.","Fornitori impastatrici professionali"),
 ("Celle di lievitazione & Freezer","Clima dinamico e recupero catena del freddo. Modulo 40/10.","Fornitori celle e abbattitori"),
 ("Bilance IoT (Smart Scale)","Pesata guidata e Co-Pesa a 4 mani, sync smart scale. Moduli 26/60.","Bilance industriali con connettivita"),
 ("Silos Farina industriali","Telemetria livello e flusso farina. Modulo 18.","Fornitori silos e trasporto farine"),
 ("Teglie, stampi, pale & utensili","Tracciamento cicli, pulizia e sanificazione. Modulo 46.","Fornitori utensili da forno"),
]

def read_tools():
    try:
        with open("/tmp/tools.txt") as f:
            return [l.strip() for l in f if l.strip()]
    except Exception:
        return []

doc = SimpleDocTemplate("/app/frontend/public/MikiLab_v14_Ecosystem_Document.pdf", pagesize=A4,
                        leftMargin=16*mm, rightMargin=16*mm, topMargin=16*mm, bottomMargin=16*mm,
                        title="MikiLab v14 Ecosystem Document")
S = []
S.append(Paragraph("MikiLab v14 - Ecosystem Document", H1))
S.append(Paragraph("Documentazione completa dell'ecosistema Cyber-Industrial (64 moduli). Lingua: Italiano - predisposto per traduzione in Tedesco.", BODY))
S.append(HRFlowable(color=TEAL, thickness=1.2, spaceBefore=6, spaceAfter=8))
S.append(Paragraph("Architettura & Filosofia", H2))
S.append(Paragraph("MikiLab e' un laboratorio digitale hands-free per panettieri: 100% offline-ready, sintesi vocale continua senza parole chiave, stile cyber-industrial teal/scuro. La guida e' affidata unicamente agli avatar dinamici del Cyber-Trio (nessun testo statico). Zero HACCP/allergeni.", BODY))

S.append(Paragraph("1. Le 8 Sezioni principali", H2))
for n,d in SEZIONI:
    S.append(Paragraph(n, H3)); S.append(Paragraph(d, BODY))

S.append(Paragraph("2. Cyber-Trio - Schede Operative", H2))
for n,d in TRIO:
    S.append(Paragraph(n, H3)); S.append(Paragraph(d, BODY))
S.append(Paragraph("Funzioni condivise del Trio:", H3))
S.append(ListFlowable([ListItem(Paragraph(x, BODY)) for x in TRIO_FEATURES], bulletColor=TEAL, leftIndent=10))

S.append(Paragraph("3. Plancia Capo - Commander Voice", H2))
S.append(ListFlowable([ListItem(Paragraph(x, BODY)) for x in PLANCIA], bulletColor=GOLD, leftIndent=10))

S.append(PageBreak())
S.append(Paragraph("4. Mappa dei 64 Moduli operativi", H2))
rows=[["#","Modulo","#","Modulo"]]
half=(len(MODULES)+1)//2
for i in range(half):
    a=i+1; b=i+1+half
    left=f"{a}. {MODULES.get(a,'')}"; right=f"{b}. {MODULES.get(b,'')}" if b in MODULES else ""
    rows.append([str(a),MODULES.get(a,''),str(b) if b in MODULES else "",MODULES.get(b,'')])
t=Table(rows, colWidths=[8*mm,80*mm,8*mm,80*mm])
t.setStyle(TableStyle([
 ("BACKGROUND",(0,0),(-1,0),TEAL),("TEXTCOLOR",(0,0),(-1,0),colors.white),
 ("FONTSIZE",(0,0),(-1,-1),7.6),("VALIGN",(0,0),(-1,-1),"TOP"),
 ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.whitesmoke,colors.HexColor("#eef4f3")]),
 ("GRID",(0,0),(-1,-1),0.25,colors.HexColor("#cbd5d3")),
 ("TEXTCOLOR",(0,1),(0,-1),GOLD),("TEXTCOLOR",(2,1),(2,-1),GOLD),
 ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
]))
S.append(t)

S.append(Paragraph("5. Strumenti di laboratorio attivi (schede)", H2))
tools=read_tools()
if tools:
    S.append(Paragraph(" &nbsp;•&nbsp; ".join(tools), BODY))
    S.append(Paragraph(f"Totale strumenti operativi rilevati nel codice: {len(tools)}.", SMALL))

S.append(PageBreak())
S.append(Paragraph("6. Guida Attrezzature & Hardware B2B", H2))
S.append(Paragraph("Sensori & hardware IoT consigliati", H3))
hw=[["Prodotto","Uso","Dove acquistarlo"]]+[[a,b,c] for a,b,c in HARDWARE]
th=Table(hw, colWidths=[42*mm,86*mm,40*mm])
th.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GOLD),("TEXTCOLOR",(0,0),(-1,0),colors.white),
 ("FONTSIZE",(0,0),(-1,-1),8),("VALIGN",(0,0),(-1,-1),"TOP"),("GRID",(0,0),(-1,-1),0.25,colors.HexColor("#e0cfa0")),
 ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.whitesmoke,colors.HexColor("#fbf3df")])]))
S.append(th)
S.append(Paragraph("Macchinari integrabili", H3))
mc=[["Macchinario","Funzione & moduli","Marchi / dove trovarli"]]+[[a,b,c] for a,b,c in MACCHINARI]
tm=Table(mc, colWidths=[46*mm,82*mm,40*mm])
tm.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),TEAL),("TEXTCOLOR",(0,0),(-1,0),colors.white),
 ("FONTSIZE",(0,0),(-1,-1),8),("VALIGN",(0,0),(-1,-1),"TOP"),("GRID",(0,0),(-1,-1),0.25,colors.HexColor("#cbd5d3")),
 ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.whitesmoke,colors.HexColor("#eef4f3")])]))
S.append(tm)
S.append(Spacer(1,8))
S.append(HRFlowable(color=GOLD, thickness=1, spaceBefore=6, spaceAfter=6))
S.append(Paragraph("MikiLab v14 - Il laboratorio connesso di Michele. Documento generato automaticamente dal codice sorgente.", SMALL))

doc.build(S)
print("PDF OK:", os.path.getsize("/app/frontend/public/MikiLab_v14_Ecosystem_Document.pdf"), "bytes")
