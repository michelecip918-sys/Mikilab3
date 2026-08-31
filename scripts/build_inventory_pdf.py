from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, ListFlowable, ListItem)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
import datetime

ORANGE = colors.HexColor("#FF6B00")
DARK = colors.HexColor("#2B303B")
GREY = colors.HexColor("#6E8A93")
LOGO = "/app/frontend/public/logo-256.png"
PUB = "/app/frontend/public"

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=15, textColor=ORANGE, spaceBefore=14, spaceAfter=6, leading=18)
BODY = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica",
                      fontSize=10.5, textColor=DARK, leading=15, alignment=TA_LEFT)
LEAD = ParagraphStyle("Lead", parent=BODY, fontSize=11, textColor=DARK, spaceAfter=4)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=6, bulletColor=ORANGE)

SUB = {
    "it": "Tutto quello che fa il sito", "de": "Alles, was die Website kann",
    "en": "Everything the site does", "es": "Todo lo que hace el sitio",
    "fr": "Tout ce que fait le site",
}

LANGS = {
"it": [
    ("MikiLab in breve", "App per fornai, gratuita al 100%. Disponibile in 6 lingue (Italiano, Tedesco, Inglese, Spagnolo, Francese, Persiano). Tema scuro nero e arancione.", []),
    ("1. Home", None, [
        "Presentazione di Michele e scelta rapida dello spazio: Panetteria, Pizzeria, Pasticceria, Impara da casa",
        "Contatore iscritti animato con bandiere dei paesi",
        "Fornaio della Settimana, news, ricetta e sapore del giorno",
        "Radio del Fornaio, newsletter, messaggi dagli amici"]),
    ("2. Ricette", None, [
        "Ricettario MikiLab (professionale) e Le mie ricette personali",
        "Categorie: Basi, Viennoiserie, Pane, Focacce, Snack, Grandi Lievitati e Panettoni",
        "Scheda ricetta con costi, prezzi B2B, foto, procedimento e timeline",
        "Scansiona una ricetta da foto oppure aggiungila a mano",
        "Ricette Custodite e Sapori di Casa"]),
    ("3. Il Tuo Laboratorio", None, [
        "Piano di Produzione con IA: piano settimanale o giornaliero, ordini extra, moduli (celle e impastatrici, orari, infornate, meteo e clima, lista spesa, costi e margine, turni, forni, pause notturne, anti-spreco), timer di fase, lettura vocale, archivio piani, PDF completo e PDF elegante col logo",
        "Panificazione: Generatore Ricette, Fermentazione Predittiva, Smart Weather-Baker, Conversione Farine, Scanner Farina, Vapore e Forno, Adatta Forno, Temperatura Acqua, Idratazione, Metodo e Sequenze IA, Digital Twin, Stampi e Pirottini, Bilancia Smart, Pesata Guidata, Esubero Zero-Sprechi, Angolo del Recupero, Costo Energia Forno, Time-Lapse Raddoppio, Termostato e Clima",
        "Pizzeria e Pasticceria: laboratori dedicati",
        "Mani in Pasta: comando vocale, Convertitore Lieviti, Timer Multi-Impasto, Registro Lievito Madre, SOS Impasto, Ricetta di Cantiere in PDF, Banca del Lievito",
        "Gestione: Controllo Celle e Impastatrici, Giacenze Freezer, Punti Vendita, Chiusura Giornata HACCP, Costi e Margine, Anti-Spreco, Parco Macchine, Diagnosi Foto, Diagnosi Suono, Diario Impasti, Checklist, Shelf-Life, Registro HACCP, Magazzino, Tracciabilità lotti"]),
    ("4. Impara (Academy)", None, [
        "Percorso a livelli per principianti e Bake-Along passo passo",
        "Quiz e Sfida Lampo con classifica e badge Streak (7, 30, 100 giorni)",
        "Mentori, ricettario base, tabelle farine, corsi e calcolatori",
        "Glossario, Enciclopedia, Guida ai Metodi e SOS Impasto guidato"]),
    ("5. Social", None, [
        "Profilo pubblico, amici, chat privata",
        "Mappa dei fornai, Hall of Fame, avatar",
        "Motore Sfide che sblocca contenuti"]),
    ("6. Promuovi MikiLab", None, [
        "Volantini stampabili in 5 lingue, verticali e orizzontali, con nome del forno e QR tracciati",
        "Post social pronti da scaricare e condividere",
        "Condivisione nativa dal telefono"]),
    ("7. Admin (solo tu)", None, [
        "Gestione ricette, utenti e accessi",
        "Statistiche email iscritti e click social con export CSV",
        "Impostazioni social: TikTok, Instagram, Facebook",
        "Inventario del sito scaricabile in PDF col logo"]),
    ("Note tecniche", None, [
        "Accesso con email e password oppure Google, reset password via email",
        "Assistente vocale, timer sempre attivi, notifiche, installabile come app (PWA)"]),
],
"de": [
    ("MikiLab auf einen Blick", "Kostenlose App für Bäcker, 100% gratis. In 6 Sprachen verfügbar (Italienisch, Deutsch, Englisch, Spanisch, Französisch, Persisch). Dunkles Design in Schwarz und Orange.", []),
    ("1. Startseite", None, [
        "Vorstellung von Michele und schnelle Auswahl des Bereichs: Bäckerei, Pizzeria, Konditorei, Von zu Hause lernen",
        "Animierter Abonnentenzähler mit Länderflaggen",
        "Bäcker der Woche, News, Rezept und Geschmack des Tages",
        "Bäcker-Radio, Newsletter, Nachrichten von Freunden"]),
    ("2. Rezepte", None, [
        "MikiLab-Rezeptbuch (professionell) und Meine persönlichen Rezepte",
        "Kategorien: Grundlagen, Viennoiserie, Brot, Focaccia, Snacks, Große Hefegebäcke und Panettoni",
        "Rezeptkarte mit Kosten, B2B-Preisen, Fotos, Zubereitung und Timeline",
        "Rezept per Foto scannen oder von Hand hinzufügen",
        "Gehütete Rezepte und Hausaromen"]),
    ("3. Deine Backstube", None, [
        "KI-Produktionsplan: Wochen- oder Tagesplan, Extra-Bestellungen, Module (Gärzellen und Kneter, Zeiten, Backvorgänge, Wetter und Klima, Einkaufsliste, Kosten und Marge, Schichten, Öfen, Nachtpausen, Anti-Verschwendung), Phasen-Timer, Sprachausgabe, Plan-Archiv, komplettes PDF und elegantes PDF mit Logo",
        "Backen: Rezeptgenerator, Prädiktive Gärung, Smart Weather-Baker, Mehlumrechnung, Mehl-Scanner, Dampf und Ofen, Ofen anpassen, Wassertemperatur, Hydratation, KI-Methoden und Abläufe, Digital Twin, Formen und Backförmchen, Smarte Waage, Geführtes Wiegen, Zero-Waste, Recycling-Ecke, Ofen-Energiekosten, Verdopplungs-Zeitraffer, Thermostat und Klima",
        "Pizzeria und Konditorei: eigene Bereiche",
        "Hands-on: Sprachbefehl, Hefe-Umrechner, Multi-Teig-Timer, Sauerteig-Logbuch, Teig-SOS, Baustellen-Rezept als PDF, Hefebank",
        "Verwaltung: Gärzellen und Kneter, Freezer-Bestand, Verkaufspunkte, Tagesabschluss HACCP, Kosten und Marge, Anti-Verschwendung, Maschinenpark, Foto-Diagnose, Klang-Diagnose, Teig-Tagebuch, Checklisten, Shelf-Life, HACCP-Register, Lager, Chargen-Rückverfolgung"]),
    ("4. Lernen (Academy)", None, [
        "Levelbasierter Pfad für Anfänger und Schritt-für-Schritt Bake-Along",
        "Quiz und Blitz-Challenge mit Rangliste und Streak-Abzeichen (7, 30, 100 Tage)",
        "Mentoren, Grund-Rezeptbuch, Mehltabellen, Kurse und Rechner",
        "Glossar, Enzyklopädie, Methodenleitfaden und geführtes Teig-SOS"]),
    ("5. Social", None, [
        "Öffentliches Profil, Freunde, privater Chat",
        "Bäckerkarte, Hall of Fame, Avatare",
        "Challenge-Engine, die Inhalte freischaltet"]),
    ("6. MikiLab bewerben", None, [
        "Druckbare Flyer in 5 Sprachen, vertikal und horizontal, mit Bäckereinamen und getrackten QR-Codes",
        "Fertige Social-Media-Posts zum Herunterladen und Teilen",
        "Natives Teilen vom Handy"]),
    ("7. Admin (nur du)", None, [
        "Verwaltung von Rezepten, Nutzern und Zugängen",
        "Statistiken zu Abonnenten-E-Mails und Social-Klicks mit CSV-Export",
        "Social-Einstellungen: TikTok, Instagram, Facebook",
        "Website-Inventar als PDF mit Logo herunterladbar"]),
    ("Technische Hinweise", None, [
        "Anmeldung mit E-Mail und Passwort oder Google, Passwort-Reset per E-Mail",
        "Sprachassistent, immer aktive Timer, Benachrichtigungen, als App installierbar (PWA)"]),
],
"en": [
    ("MikiLab at a glance", "A 100% free app for bakers. Available in 6 languages (Italian, German, English, Spanish, French, Persian). Dark black and orange theme.", []),
    ("1. Home", None, [
        "Michele's intro and quick choice of space: Bakery, Pizzeria, Pastry, Learn from home",
        "Animated subscriber counter with country flags",
        "Baker of the Week, news, recipe and flavour of the day",
        "Baker's Radio, newsletter, messages from friends"]),
    ("2. Recipes", None, [
        "MikiLab recipe book (professional) and My personal recipes",
        "Categories: Bases, Viennoiserie, Bread, Focaccia, Snacks, Large Leavened and Panettoni",
        "Recipe card with costs, B2B prices, photos, method and timeline",
        "Scan a recipe from a photo or add recipes by hand",
        "Kept Recipes and Home Flavours"]),
    ("3. Your Lab", None, [
        "AI Production Plan: weekly or daily plan, extra orders, modules (cells and mixers, timings, bakes, weather and climate, shopping list, cost and margin, shifts, ovens, overnight pauses, anti-waste), phase timers, voice reading, plan archive, full PDF and elegant PDF with logo",
        "Baking: Recipe Generator, Predictive Fermentation, Smart Weather-Baker, Flour Conversion, Flour Scanner, Steam and Oven, Adapt Oven, Water Temperature, Hydration, AI Method and Sequences, Digital Twin, Molds and Cases, Smart Scale, Guided Weighing, Zero-Waste, Recovery Corner, Oven Energy Cost, Doubling Time-Lapse, Thermostat and Climate",
        "Pizzeria and Pastry: dedicated labs",
        "Hands-on: voice command, Yeast Converter, Multi-Dough Timer, Sourdough Log, Dough SOS, Site Recipe PDF, Yeast Bank",
        "Management: Cells and Mixers, Freezer Stock, Sales Points, Day Closing HACCP, Cost and Margin, Anti-Waste, Machines, Photo Diagnosis, Sound Diagnosis, Dough Log, Checklists, Shelf-Life, HACCP register, Warehouse, Batch traceability"]),
    ("4. Learn (Academy)", None, [
        "Level path for beginners and step-by-step Bake-Along",
        "Quiz and Flash Challenge with leaderboard and Streak badges (7, 30, 100 days)",
        "Mentors, base recipe book, flour tables, courses and calculators",
        "Glossary, Encyclopedia, Methods Guide and guided Dough SOS"]),
    ("5. Social", None, [
        "Public profile, friends, private chat",
        "Bakers map, Hall of Fame, avatars",
        "Challenge engine that unlocks content"]),
    ("6. Promote MikiLab", None, [
        "Printable flyers in 5 languages, vertical and horizontal, with bakery name and tracked QR codes",
        "Ready-to-use social posts to download and share",
        "Native sharing from the phone"]),
    ("7. Admin (only you)", None, [
        "Manage recipes, users and access",
        "Subscriber email and social click stats with CSV export",
        "Social settings: TikTok, Instagram, Facebook",
        "Site inventory downloadable as PDF with logo"]),
    ("Technical notes", None, [
        "Sign in with email and password or Google, password reset via email",
        "Voice assistant, always-on timers, notifications, installable as an app (PWA)"]),
],
"es": [
    ("MikiLab en resumen", "App para panaderos, gratis al 100%. Disponible en 6 idiomas (italiano, alemán, inglés, español, francés, persa). Tema oscuro negro y naranja.", []),
    ("1. Inicio", None, [
        "Presentación de Michele y elección rápida del espacio: Panadería, Pizzería, Pastelería, Aprende en casa",
        "Contador de suscriptores animado con banderas de países",
        "Panadero de la Semana, noticias, receta y sabor del día",
        "Radio del Panadero, boletín, mensajes de amigos"]),
    ("2. Recetas", None, [
        "Recetario MikiLab (profesional) y Mis recetas personales",
        "Categorías: Bases, Bollería, Pan, Focaccia, Snacks, Grandes Fermentados y Panettoni",
        "Ficha de receta con costes, precios B2B, fotos, procedimiento y cronología",
        "Escanea una receta desde una foto o añádela a mano",
        "Recetas Guardadas y Sabores de Casa"]),
    ("3. Tu Laboratorio", None, [
        "Plan de Producción con IA: plan semanal o diario, pedidos extra, módulos (cámaras y amasadoras, horarios, horneadas, tiempo y clima, lista de compra, costes y margen, turnos, hornos, pausas nocturnas, anti-desperdicio), temporizadores de fase, lectura por voz, archivo de planes, PDF completo y PDF elegante con logo",
        "Panificación: Generador de Recetas, Fermentación Predictiva, Smart Weather-Baker, Conversión de Harinas, Escáner de Harina, Vapor y Horno, Adaptar Horno, Temperatura del Agua, Hidratación, Método y Secuencias con IA, Digital Twin, Moldes y Cápsulas, Báscula Inteligente, Pesada Guiada, Cero Desperdicio, Rincón del Aprovechamiento, Coste Energía Horno, Time-Lapse de Duplicado, Termostato y Clima",
        "Pizzería y Pastelería: laboratorios dedicados",
        "Manos en la Masa: comando por voz, Convertidor de Levaduras, Temporizador Multi-Masa, Registro de Masa Madre, SOS Masa, Receta de Obra en PDF, Banco de Levadura",
        "Gestión: Cámaras y Amasadoras, Stock Congelador, Puntos de Venta, Cierre del Día HACCP, Costes y Margen, Anti-Desperdicio, Parque de Máquinas, Diagnóstico por Foto, Diagnóstico por Sonido, Diario de Masas, Checklists, Shelf-Life, Registro HACCP, Almacén, Trazabilidad de lotes"]),
    ("4. Aprende (Academy)", None, [
        "Ruta por niveles para principiantes y Bake-Along paso a paso",
        "Quiz y Reto Relámpago con clasificación y medallas Streak (7, 30, 100 días)",
        "Mentores, recetario base, tablas de harinas, cursos y calculadoras",
        "Glosario, Enciclopedia, Guía de Métodos y SOS Masa guiado"]),
    ("5. Social", None, [
        "Perfil público, amigos, chat privado",
        "Mapa de panaderos, Salón de la Fama, avatares",
        "Motor de Retos que desbloquea contenidos"]),
    ("6. Promociona MikiLab", None, [
        "Folletos imprimibles en 5 idiomas, verticales y horizontales, con nombre de la panadería y códigos QR rastreados",
        "Publicaciones para redes listas para descargar y compartir",
        "Compartir nativo desde el teléfono"]),
    ("7. Admin (solo tú)", None, [
        "Gestión de recetas, usuarios y accesos",
        "Estadísticas de emails de suscriptores y clics sociales con exportación CSV",
        "Ajustes sociales: TikTok, Instagram, Facebook",
        "Inventario del sitio descargable en PDF con logo"]),
    ("Notas técnicas", None, [
        "Acceso con email y contraseña o Google, restablecer contraseña por email",
        "Asistente de voz, temporizadores siempre activos, notificaciones, instalable como app (PWA)"]),
],
"fr": [
    ("MikiLab en bref", "Application pour boulangers, 100% gratuite. Disponible en 6 langues (italien, allemand, anglais, espagnol, français, persan). Thème sombre noir et orange.", []),
    ("1. Accueil", None, [
        "Présentation de Michele et choix rapide de l'espace : Boulangerie, Pizzeria, Pâtisserie, Apprendre à la maison",
        "Compteur d'abonnés animé avec drapeaux des pays",
        "Boulanger de la Semaine, actualités, recette et saveur du jour",
        "Radio du Boulanger, newsletter, messages des amis"]),
    ("2. Recettes", None, [
        "Livre de recettes MikiLab (professionnel) et Mes recettes personnelles",
        "Catégories : Bases, Viennoiserie, Pain, Focaccia, Snacks, Grandes pâtes levées et Panettoni",
        "Fiche recette avec coûts, prix B2B, photos, procédé et chronologie",
        "Scanne une recette depuis une photo ou ajoute-la à la main",
        "Recettes Gardées et Saveurs de Maison"]),
    ("3. Ton Labo", None, [
        "Plan de Production avec IA : plan hebdomadaire ou journalier, commandes extra, modules (chambres et pétrins, horaires, enfournements, météo et climat, liste de courses, coûts et marge, équipes, fours, pauses nocturnes, anti-gaspillage), minuteurs de phase, lecture vocale, archive des plans, PDF complet et PDF élégant avec logo",
        "Panification : Générateur de Recettes, Fermentation Prédictive, Smart Weather-Baker, Conversion des Farines, Scanner de Farine, Vapeur et Four, Adapter le Four, Température de l'Eau, Hydratation, Méthode et Séquences IA, Digital Twin, Moules et Caissettes, Balance Connectée, Pesée Guidée, Zéro Gaspillage, Coin Récupération, Coût Énergie Four, Time-Lapse de Doublement, Thermostat et Climat",
        "Pizzeria et Pâtisserie : labos dédiés",
        "Les mains dans la pâte : commande vocale, Convertisseur de Levures, Minuteur Multi-Pâtes, Journal du Levain, SOS Pâte, Recette de Chantier en PDF, Banque de Levain",
        "Gestion : Chambres et Pétrins, Stock Congélateur, Points de Vente, Clôture du Jour HACCP, Coûts et Marge, Anti-Gaspillage, Parc Machines, Diagnostic Photo, Diagnostic Son, Journal des Pâtes, Checklists, Shelf-Life, Registre HACCP, Entrepôt, Traçabilité des lots"]),
    ("4. Apprendre (Academy)", None, [
        "Parcours par niveaux pour débutants et Bake-Along pas à pas",
        "Quiz et Défi Éclair avec classement et badges Streak (7, 30, 100 jours)",
        "Mentors, livre de recettes de base, tableaux de farines, cours et calculateurs",
        "Glossaire, Encyclopédie, Guide des Méthodes et SOS Pâte guidé"]),
    ("5. Social", None, [
        "Profil public, amis, chat privé",
        "Carte des boulangers, Hall of Fame, avatars",
        "Moteur de Défis qui débloque des contenus"]),
    ("6. Promouvoir MikiLab", None, [
        "Flyers imprimables en 5 langues, verticaux et horizontaux, avec nom de la boulangerie et QR codes suivis",
        "Posts pour réseaux sociaux prêts à télécharger et partager",
        "Partage natif depuis le téléphone"]),
    ("7. Admin (toi seul)", None, [
        "Gestion des recettes, utilisateurs et accès",
        "Statistiques des e-mails d'abonnés et clics sociaux avec export CSV",
        "Réglages sociaux : TikTok, Instagram, Facebook",
        "Inventaire du site téléchargeable en PDF avec logo"]),
    ("Notes techniques", None, [
        "Connexion par e-mail et mot de passe ou Google, réinitialisation du mot de passe par e-mail",
        "Assistant vocal, minuteurs toujours actifs, notifications, installable comme app (PWA)"]),
],
}

date_str = datetime.date.today().strftime("%d/%m/%Y")


def make_hf(subtitle):
    def header_footer(canvas, doc):
        canvas.saveState()
        w, h = A4
        try:
            canvas.drawImage(LOGO, 18 * mm, h - 30 * mm, width=13 * mm, height=13 * mm,
                             preserveAspectRatio=True, mask="auto")
        except Exception:
            pass
        canvas.setFillColor(DARK); canvas.setFont("Helvetica-Bold", 17)
        canvas.drawString(34 * mm, h - 24 * mm, "MikiLab")
        canvas.setFillColor(GREY); canvas.setFont("Helvetica", 9.5)
        canvas.drawString(34 * mm, h - 28.5 * mm, "%s - %s" % (subtitle, date_str))
        canvas.setStrokeColor(ORANGE); canvas.setLineWidth(2)
        canvas.line(18 * mm, h - 32 * mm, w - 18 * mm, h - 32 * mm)
        canvas.setStrokeColor(colors.HexColor("#E6E6E6")); canvas.setLineWidth(0.5)
        canvas.line(18 * mm, 14 * mm, w - 18 * mm, 14 * mm)
        canvas.setFillColor(GREY); canvas.setFont("Helvetica", 8)
        canvas.drawString(18 * mm, 10 * mm, "MikiLab - mikilab.de")
        canvas.drawRightString(w - 18 * mm, 10 * mm, str(canvas.getPageNumber()))
        canvas.restoreState()
    return header_footer


def build(lang, sections, out):
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                          topMargin=38 * mm, bottomMargin=18 * mm, title="MikiLab Inventory")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="tpl", frames=[frame], onPage=make_hf(SUB[lang]))])
    story = []
    for title, lead, items in sections:
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


for lang, sections in LANGS.items():
    build(lang, sections, "%s/mikilab-inventario-%s.pdf" % (PUB, lang))
# retro-compatibilita: la vecchia URL punta alla versione IT
build("it", LANGS["it"], "%s/mikilab-inventario.pdf" % PUB)
print("PDF generati:", ", ".join(LANGS.keys()))
