from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, ListFlowable, ListItem, Image, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
import datetime

ORANGE = colors.HexColor("#FF6B00")
DARK = colors.HexColor("#2B303B")
GREY = colors.HexColor("#6E8A93")
LOGO = "/app/frontend/public/logo-256.png"
OUT = "/app/frontend/public/mikilab-inventario.pdf"

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=15, textColor=ORANGE, spaceBefore=14, spaceAfter=6, leading=18)
BODY = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica",
                      fontSize=10.5, textColor=DARK, leading=15, alignment=TA_LEFT)
LEAD = ParagraphStyle("Lead", parent=BODY, fontSize=11, textColor=DARK, spaceAfter=4)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=6, bulletColor=ORANGE)

SECTIONS = [
    ("MikiLab in breve",
     "App per fornai, gratuita al 100%. Disponibile in 6 lingue (Italiano, Tedesco, Inglese, Spagnolo, Francese, Persiano). Tema scuro nero e arancione.", []),
    ("1. Home", None, [
        "Presentazione di Michele e scelta rapida dello spazio: Panetteria, Pizzeria, Pasticceria, Impara da casa",
        "Contatore iscritti animato con bandiere dei paesi",
        "Fornaio della Settimana, news, ricetta e sapore del giorno",
        "Radio del Fornaio, newsletter, messaggi dagli amici",
    ]),
    ("2. Ricette", None, [
        "Ricettario MikiLab (professionale) e Le mie ricette personali",
        "Categorie: Basi, Viennoiserie, Pane, Focacce, Snack, Grandi Lievitati e Panettoni",
        "Scheda ricetta con costi, prezzi B2B, foto, procedimento e timeline",
        "Scansiona una ricetta da foto oppure aggiungila a mano",
        "Ricette Custodite e Sapori di Casa",
    ]),
    ("3. Il Tuo Laboratorio", None, [
        "Piano di Produzione con IA: piano settimanale o giornaliero, ordini extra, moduli (celle e impastatrici, orari, infornate, meteo e clima, lista spesa, costi e margine, turni, forni, pause notturne, anti-spreco), timer di fase, lettura vocale, archivio piani, PDF completo e PDF elegante col logo",
        "Panificazione: Generatore Ricette, Fermentazione Predittiva, Smart Weather-Baker, Conversione Farine, Scanner Farina, Vapore e Forno, Adatta Forno, Temperatura Acqua, Idratazione, Metodo e Sequenze IA, Digital Twin, Stampi e Pirottini, Bilancia Smart, Pesata Guidata, Esubero Zero-Sprechi, Angolo del Recupero, Costo Energia Forno, Time-Lapse Raddoppio, Termostato e Clima",
        "Pizzeria e Pasticceria: laboratori dedicati",
        "Mani in Pasta: comando vocale, Convertitore Lieviti, Timer Multi-Impasto, Registro Lievito Madre, SOS Impasto, Ricetta di Cantiere in PDF, Banca del Lievito",
        "Gestione: Controllo Celle e Impastatrici, Giacenze Freezer, Punti Vendita, Chiusura Giornata HACCP, Costi e Margine, Anti-Spreco, Parco Macchine, Diagnosi Foto, Diagnosi Suono, Diario Impasti, Checklist, Shelf-Life, Registro HACCP, Magazzino, Tracciabilita lotti",
    ]),
    ("4. Impara (Academy)", None, [
        "Percorso a livelli per principianti e Bake-Along passo passo",
        "Quiz e Sfida Lampo con classifica e badge Streak (7, 30, 100 giorni)",
        "Mentori, ricettario base, tabelle farine, corsi e calcolatori",
        "Glossario, Enciclopedia, Guida ai Metodi e SOS Impasto guidato",
    ]),
    ("5. Social", None, [
        "Profilo pubblico, amici, chat privata",
        "Mappa dei fornai, Hall of Fame, avatar",
        "Motore Sfide che sblocca contenuti",
    ]),
    ("6. Promuovi MikiLab", None, [
        "Volantini stampabili in 5 lingue, verticali e orizzontali, con nome del forno e QR tracciati",
        "Post social pronti da scaricare e condividere",
        "Condivisione nativa dal telefono",
    ]),
    ("7. Admin (solo tu)", None, [
        "Gestione ricette, utenti e accessi",
        "Statistiche email iscritti e click social con export CSV",
        "Impostazioni social: TikTok, Instagram, Facebook",
        "Inventario del sito scaricabile in PDF col logo",
    ]),
    ("Note tecniche", None, [
        "Accesso con email e password oppure Google, reset password via email",
        "Assistente vocale, timer sempre attivi, notifiche, installabile come app (PWA)",
    ]),
]

date_str = datetime.date.today().strftime("%d/%m/%Y")

def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # header
    try:
        canvas.drawImage(LOGO, 18 * mm, h - 30 * mm, width=13 * mm, height=13 * mm,
                         preserveAspectRatio=True, mask="auto")
    except Exception:
        pass
    canvas.setFillColor(DARK); canvas.setFont("Helvetica-Bold", 17)
    canvas.drawString(34 * mm, h - 24 * mm, "MikiLab")
    canvas.setFillColor(GREY); canvas.setFont("Helvetica", 9.5)
    canvas.drawString(34 * mm, h - 28.5 * mm, "Tutto quello che fa il sito · %s" % date_str)
    canvas.setStrokeColor(ORANGE); canvas.setLineWidth(2)
    canvas.line(18 * mm, h - 32 * mm, w - 18 * mm, h - 32 * mm)
    # footer
    canvas.setStrokeColor(colors.HexColor("#E6E6E6")); canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, w - 18 * mm, 14 * mm)
    canvas.setFillColor(GREY); canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, 10 * mm, "MikiLab · mikilab.de")
    canvas.drawRightString(w - 18 * mm, 10 * mm, str(canvas.getPageNumber()))
    canvas.restoreState()

doc = BaseDocTemplate(OUT, pagesize=A4,
                      leftMargin=18 * mm, rightMargin=18 * mm,
                      topMargin=38 * mm, bottomMargin=18 * mm, title="Inventario MikiLab")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="tpl", frames=[frame], onPage=header_footer)])

story = []
for title, lead, items in SECTIONS:
    story.append(Paragraph(title, H1))
    if lead:
        story.append(Paragraph(lead, LEAD))
    if items:
        story.append(ListFlowable(
            [ListItem(Paragraph(it, BULLET), value="circle", leftIndent=10) for it in items],
            bulletType="bullet", bulletColor=ORANGE, bulletFontSize=6, start="circle",
            leftIndent=8, spaceBefore=2))
    story.append(Spacer(1, 4))

doc.build(story)
print("PDF creato:", OUT)
