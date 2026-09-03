from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUT = "/app/frontend/public/mikilab-funzioni.pdf"

INK = colors.HexColor("#0E1620")
TEAL = colors.HexColor("#3E9C93")
STEEL = colors.HexColor("#5E8CA8")
MUTED = colors.HexColor("#5b6b7b")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Title"], textColor=INK, fontSize=24, spaceAfter=6)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], textColor=TEAL, fontSize=12, spaceAfter=16)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=STEEL, fontSize=15, spaceBefore=14, spaceAfter=4)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], fontSize=10.5, leading=15, spaceAfter=4)
ITEM = ParagraphStyle("ITEM", parent=styles["Normal"], fontSize=10.5, leading=15, leftIndent=10, spaceAfter=2)
NOTE = ParagraphStyle("NOTE", parent=styles["Italic"], fontSize=9.5, textColor=colors.HexColor("#5b6b7b"), spaceBefore=6)

def h2(t): return Paragraph(t, H2)
def b(t): return Paragraph(t, BODY)
def li(t): return Paragraph("• " + t, ITEM)

story = []
story.append(Paragraph("MikiLab — Guida alle Funzioni", H1))
story.append(Paragraph("Tutte le sezioni, i comandi e le funzioni del sito · Il laboratorio di Michele", SUB))

story.append(b("<b>Accesso:</b> all'avvio l'app chiede il PIN <b>1985</b>. La consultazione è libera; l'accesso completo (salvataggio ricette, analisi IA) richiede l'accesso con email o Google."))
story.append(b("<b>Lingue:</b> IT · DE · EN · ES · FR · FA (selettore in alto a destra). <b>Tema:</b> scenario calmo blu-ardesia + teal, sfondi scenografici per sezione."))

story.append(h2("Barra in alto (Header)"))
for t in [
    "<b>Logo MikiLab</b>: torna alla Home.",
    "<b>Orologio live</b>: ora corrente sempre visibile.",
    "<b>Selettore lingua</b>: IT/DE/EN/ES/FR/FA.",
    "<b>Menu ☰</b>: accessi rapidi, Sicurezza · PIN (attiva/disattiva, cambia PIN, blocca ora).",
    "<b>Accedi / Esci</b>: login email o Google; icona corona per l'Admin (Michele).",
]:
    story.append(li(t))

story.append(h2("Barra in basso (Navigazione)"))
for t in [
    "<b>Ricette del Maestro</b>: il ricettario.",
    "<b>Scienza & Guide (Accademia)</b>: lezioni, quiz, enciclopedia, news.",
    "<b>Schede di Produzione (Il Tuo Laboratorio)</b>: strumenti operativi + Elite Engine.",
    "<b>Community</b>: bacheca e confronto con altri fornai.",
    "<b>Guida · Come Funziona</b>: apre la guida introduttiva.",
]:
    story.append(li(t))

story.append(h2("Home"))
story.append(b("Punto di ingresso con 5 pulsanti-scenario: <b>Il Tuo Laboratorio</b>, <b>Ricette</b>, <b>Scienza & Guide</b>, <b>Centro Formule</b>, <b>Community</b>. In basso: barra Condividi e tasto Installa App (PWA)."))

story.append(h2("Il Tuo Laboratorio (schermata operativa)"))
for t in [
    "<b>Avatar vocale Miki</b>: l'assistente parla e ascolta (mani libere).",
    "<b>Comandi rapidi</b>: Ricette del Giorno · Guasti & Celle · SOS Impasto.",
    "<b>Banco Impasti</b>: apre l'Elite Engine sulla stanza impasti (dosi 3D).",
    "<b>Inserisci Ricetta</b>: crea una ricetta scrivendo o scansionando una foto.",
    "<b>Modalità Cuffie</b>: assistente in cuffia, hands-free (routing Bluetooth nell'app installata).",
    "<b>Apri MikiLab Elite Engine</b>: lo strumento centrale del laboratorio.",
]:
    story.append(li(t))

story.append(h2("MikiLab Elite Engine (4 stanze 3D)"))
for t in [
    "<b>Impasti (Miki)</b>: seleziona una ricetta dal database → calcolo dosi reali (idratazione, sale, acqua a 3 temperature), timer.",
    "<b>Forni (Mohamed)</b>: parametri di cottura dalla ricetta, timer forno con allarme sonoro persistente.",
    "<b>Pasticceria</b>: abbattitore e lievitati.",
    "<b>Guida & Info</b>: tutela del metodo e note.",
    "<b>Radio del Fornaio</b>: stazioni IT/DE in diretta con controllo volume.",
]:
    story.append(li(t))

story.append(h2("Strumenti del Laboratorio (Maestro)"))
story.append(b("Griglia di strumenti (si aprono a schermo intero):"))
for t in [
    "<b>Produzione Oggi</b> e <b>Piano di Produzione IA</b>: sequenza impasti, orari, celle, compiti.",
    "<b>Calcolo Orari d'Inizio (Produzione Inversa)</b>: dall'ora di sfornata a ritroso per ogni fase, con sveglie.",
    "<b>Parametri Forno (Adatta al Forno)</b>: converte gradi/minuti tra tipi di forno.",
    "<b>Programma Settimana</b>: pianificazione settimanale con destinazioni (lievitazione/frigo/freezer).",
    "<b>Check-list Laboratorio</b>: apertura/chiusura/celle/manutenzione.",
    "<b>Lista della Spesa</b>: farine, acqua, prefermento, sale ed extra dal piano.",
    "<b>Turni & Mansioni</b>: ruoli e compiti della squadra.",
    "<b>Giacenze Freezer</b>: scorte con avviso email sotto soglia.",
    "<b>Aggiungi / Scansiona Ricetta</b>: crea o estrae una ricetta da foto (IA).",
    "<b>Impostazione Macchine (Capo Laboratorio)</b>: impastatrici, celle, personale.",
    "<b>Meteo & Laboratorio (Termostato & Clima)</b>: temperatura, avvisi caldo/freddo, memoria temperatura impasto.",
    "<b>Etichette Panettoni</b> e <b>Guida ai Metodi</b>.",
]:
    story.append(li(t))

story.append(h2("Ricette"))
for t in [
    "Catalogo per categorie: Basi & Lieviti · Pane · Panini & Snack · Panettoni.",
    "Ogni scheda: ingredienti in grammi e % sul peso farina, procedimento, fasi di lavoro, glossario dei termini.",
    "Panettoni: gestione lievito madre (pH), tabelle 1°/2° impasto, modulo glassa, tasto 'Converti in Farro'.",
    "Scala dosi, duplica, e (per l'Admin) modifica.",
]:
    story.append(li(t))

story.append(h2("Centro Formule e Analisi Farine"))
for t in [
    "<b>Parametri</b>: Forza (W), Proteine/Glutine, Assorbimento (idratazione), Rapporto P/L, Ceneri/Tipo, Falling Number.",
    "<b>Registro Test Farine</b>: annota nome, W, proteine, idratazione e nota; salvataggio sul dispositivo.",
    "<b>Analisi Foto Farina (IA)</b>: fotografa il sacco → l'IA legge W/proteine/tipo/assorbimento e compila il test.",
]:
    story.append(li(t))

story.append(h2("Scienza & Guide (Accademia)"))
for t in [
    "Lezioni e percorsi passo-passo, video dei maestri, <b>Quiz del Fornaio</b> con livelli.",
    "Enciclopedia delle basi (lievito madre, poolish, biga, autolisi, idratazione…).",
    "News: feed su pane e panificazione (Stoccarda/Germania/Italia).",
]:
    story.append(li(t))

story.append(h2("Community · Diagnosi · Maestro AI"))
for t in [
    "<b>Community</b>: bacheca dei risultati e confronto tra appassionati.",
    "<b>Diagnosi (Foto IA)</b>: fotografa un pane/impasto → analisi difetti, ingredienti, stato lievitazione.",
    "<b>Maestro AI</b>: chat per domande di panificazione, con risposta letta ad alta voce.",
]:
    story.append(li(t))

story.append(h2("Comandi vocali (mani libere)"))
for t in [
    "Attivazione SOLO con il pulsante 👂 oppure con la parola di richiamo <b>'Comandante Lab'</b> (mai da solo).",
    "Navigazione: es. «vai alle ricette», «apri il laboratorio».",
    "Domande al Maestro: parla liberamente, l'assistente risponde a voce.",
    "Voce: ElevenLabs → OpenAI → voce del dispositivo (fallback automatico).",
]:
    story.append(li(t))

story.append(h2("Altre funzioni"))
for t in [
    "<b>Offline-first</b>: ricette e piani consultabili senza rete.",
    "<b>Installa App (PWA)</b>: banner discreto al primo accesso.",
    "<b>Radio</b> e <b>suono ambient del forno</b> attivabili dal pulsante Radio.",
    "<b>Reset password</b> via email; area <b>Admin</b> per gestire accessi (solo Michele).",
]:
    story.append(li(t))

story.append(Paragraph("Documento generato automaticamente per Michele — MikiLab. Le funzioni possono evolvere ad ogni aggiornamento.", NOTE))

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm,
                        title="MikiLab — Guida alle Funzioni", author="MikiLab")
doc.build(story)
print("PDF creato:", OUT)
