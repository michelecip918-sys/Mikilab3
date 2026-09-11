import { motion, AnimatePresence } from "framer-motion";
import { X, Download, BookOpen, Users, CalendarDays, Zap, Wrench, Sparkles, Factory, KeyRound } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const PUB = process.env.PUBLIC_URL;
const LANG2 = (l) => String(l || "it").toLowerCase().slice(0, 2);
const ORDER = ["it", "en", "de", "es", "fr", "fa"];

// Guida MikiLab — multilingua completa (IT/EN/DE/ES/FR/FA). {t: titolo, p: intro, b: punti}
const GUIDE = [
  { id: "intro", Icon: BookOpen, accent: "#a6b1bc",
    it: { t: "Cos'è MikiLab e chi è Sitor", p: "MikiLab Pro è il sistema operativo del tuo laboratorio: panificio, pizzeria o pasticceria. Sitor è l'intelligenza più potente al mondo dell'Arte Bianca (gira su Claude Opus 4.8): al servizio del Capo e guida di ogni operaio. Il Capo comanda, Sitor esegue, pianifica, sorveglia e insegna.", b: ["Un'unica app continua, senza burocrazia inutile.", "Il Capo governa tutto; gli operai vedono solo la Produzione.", "Sitor parla, ascolta, legge foto ed email e genera la produzione."] },
    en: { t: "What MikiLab is and who Sitor is", p: "MikiLab Pro is your lab's operating system: bakery, pizzeria or pastry shop. Sitor is the most powerful White-Art intelligence in the world (Claude Opus 4.8): at the Capo's service and guiding every operator. The Capo commands, Sitor executes, plans, supervises and teaches.", b: ["One continuous app, no useless bureaucracy.", "The Capo runs everything; operators only see Production.", "Sitor talks, listens, reads photos and emails, and generates production."] },
    de: { t: "Was MikiLab ist und wer Sitor ist", p: "MikiLab Pro ist das Betriebssystem deiner Backstube, Pizzeria oder Konditorei. Sitor ist die stärkste Intelligenz der Weißen Kunst (Claude Opus 4.8): im Dienst des Chefs und Führer jedes Mitarbeiters. Der Chef befiehlt, Sitor führt aus, plant, überwacht und lehrt.", b: ["Eine durchgehende App, ohne unnötige Bürokratie.", "Der Chef steuert alles; das Team sieht nur die Produktion.", "Sitor spricht, hört zu, liest Fotos und E-Mails und erzeugt die Produktion."] },
    es: { t: "Qué es MikiLab y quién es Sitor", p: "MikiLab Pro es el sistema operativo de tu obrador: panadería, pizzería o pastelería. Sitor es la inteligencia más potente del mundo del Arte Blanco (Claude Opus 4.8): al servicio del Capo y guía de cada operario. El Capo manda, Sitor ejecuta, planifica, supervisa y enseña.", b: ["Una única app continua, sin burocracia inútil.", "El Capo gestiona todo; los operarios solo ven Producción.", "Sitor habla, escucha, lee fotos y correos y genera la producción."] },
    fr: { t: "Qu'est-ce que MikiLab et qui est Sitor", p: "MikiLab Pro est le système d'exploitation de ton labo : boulangerie, pizzeria ou pâtisserie. Sitor est l'intelligence la plus puissante au monde de l'Art Blanc (Claude Opus 4.8) : au service du Capo et guide de chaque opérateur. Le Capo commande, Sitor exécute, planifie, surveille et enseigne.", b: ["Une seule app continue, sans bureaucratie inutile.", "Le Capo gère tout ; les opérateurs ne voient que la Production.", "Sitor parle, écoute, lit photos et e-mails et génère la production."] },
    fa: { t: "میکی‌لب چیست و سیتور کیست", p: "میکی‌لب پرو سیستم‌عامل کارگاه توست: نانوایی، پیتزا یا شیرینی. سیتور قدرتمندترین هوش هنر سفید در جهان است (Claude Opus 4.8): در خدمت کاپو و راهنمای هر اپراتور. کاپو فرمان می‌دهد، سیتور اجرا، برنامه‌ریزی، نظارت و آموزش می‌کند.", b: ["یک اپلیکیشن پیوسته، بدون بروکراسی بیهوده.", "کاپو همه‌چیز را اداره می‌کند؛ اپراتورها فقط تولید را می‌بینند.", "سیتور صحبت می‌کند، گوش می‌دهد، عکس و ایمیل می‌خواند و تولید می‌سازد."] } },
  { id: "accessi", Icon: KeyRound, accent: "#8a97a6",
    it: { t: "Accessi · Capo e Operai", p: "Un unico tastierino d'ingresso decide dove vai, in base al PIN.", b: ["PIN Capo (6 cifre) + login: apre l'intera plancia di comando.", "PIN Sezione Operai (scelto dal Capo) e PIN personali (4 cifre): aprono SOLO la Produzione; la zona Capo resta invisibile.", "PIN personale = timbratura tracciabile e livello (Novizio/Esperto/Maestro) su misura per Sitor.", "Volti della squadra: entrata con riconoscimento facciale sui tablet di reparto."] },
    en: { t: "Access · Capo and Operators", p: "A single entry keypad decides where you go, based on the PIN.", b: ["Capo PIN (6 digits) + login: opens the full command console.", "Operator Section PIN (chosen by the Capo) and personal PINs (4 digits): open ONLY Production; the Capo area stays invisible.", "Personal PIN = tracked clock-in and skill level (Novice/Expert/Master) tailored for Sitor.", "Team faces: face-recognition login on department tablets."] },
    de: { t: "Zugang · Chef und Team", p: "Ein einziges Tastenfeld entscheidet je nach PIN, wohin du gelangst.", b: ["Chef-PIN (6 Ziffern) + Login: öffnet die gesamte Kommandozentrale.", "Produktions-PIN (vom Chef gewählt) und persönliche PINs (4 Ziffern): öffnen NUR die Produktion; der Chef-Bereich bleibt unsichtbar.", "Persönlicher PIN = nachverfolgbare Stempelung und Level (Anfänger/Erfahren/Meister) für Sitor.", "Team-Gesichter: Gesichts-Login auf den Bereichstablets."] },
    es: { t: "Acceso · Capo y Operarios", p: "Un único teclado de entrada decide adónde vas, según el PIN.", b: ["PIN Capo (6 dígitos) + login: abre toda la consola de mando.", "PIN Sección Operarios (elegido por el Capo) y PIN personales (4 dígitos): abren SOLO Producción; la zona Capo queda invisible.", "PIN personal = fichaje trazable y nivel (Novato/Experto/Maestro) a medida para Sitor.", "Rostros del equipo: acceso por reconocimiento facial en las tablets."] },
    fr: { t: "Accès · Capo et Opérateurs", p: "Un seul clavier d'entrée décide où tu vas, selon le PIN.", b: ["PIN Capo (6 chiffres) + connexion : ouvre toute la console de commande.", "PIN Section Opérateurs (choisi par le Capo) et PIN personnels (4 chiffres) : ouvrent SEULEMENT la Production ; la zone Capo reste invisible.", "PIN personnel = pointage traçable et niveau (Novice/Expert/Maître) sur mesure pour Sitor.", "Visages de l'équipe : connexion par reconnaissance faciale sur les tablettes."] },
    fa: { t: "دسترسی · کاپو و اپراتورها", p: "یک صفحه‌کلید ورودی بر اساس پین تصمیم می‌گیرد کجا بروی.", b: ["پین کاپو (۶ رقم) + ورود: کل کنسول فرماندهی را باز می‌کند.", "پین بخش اپراتور (انتخاب کاپو) و پین‌های شخصی (۴ رقم): فقط تولید را باز می‌کنند؛ بخش کاپو نامرئی می‌ماند.", "پین شخصی = ثبت ورود قابل‌ردیابی و سطح (تازه‌کار/ماهر/استاد) برای سیتور.", "چهره‌های تیم: ورود با تشخیص چهره روی تبلت‌های بخش."] } },
  { id: "piano", Icon: CalendarDays, accent: "#9aa6b2",
    it: { t: "1 · Piano Settimanale & Produzione", p: "Dai un punto di partenza e Sitor completa il piano del giorno e della settimana.", b: ["Sitor · Piano del Giorno: sequenza di produzione ottimale con più opzioni.", "Piano Settimanale: per ogni giorno scegli prodotti, pezzi e grammi; stampa PDF e archivio.", "Piano di Produzione AI: detti ordini e vincoli, l'IA costruisce il piano completo.", "Piano a Ritroso: parti dall'ora di consegna, MikiLab calcola impasto, lievitazione e cottura.", "Smart Planner con validazione vocale e Timeline di Turno (lotti, infornate, SOS)."] },
    en: { t: "1 · Weekly Plan & Production", p: "Give a starting point and Sitor completes the day's and week's plan.", b: ["Sitor · Day Plan: optimal production sequence with multiple options.", "Weekly Plan: per day pick products, pieces and grams; print PDF and archive.", "AI Production Plan: dictate orders and constraints, the AI builds the full plan.", "Backward Plan: start from delivery time, MikiLab computes dough, proof and bake.", "Smart Planner with voice validation and Shift Timeline (batches, bakes, SOS)."] },
    de: { t: "1 · Wochenplan & Produktion", p: "Gib einen Startpunkt und Sitor vollendet den Tages- und Wochenplan.", b: ["Sitor · Tagesplan: optimale Produktionsabfolge mit mehreren Optionen.", "Wochenplan: pro Tag Produkte, Stück und Gramm wählen; PDF drucken und archivieren.", "KI-Produktionsplan: Aufträge und Grenzen diktieren, die KI baut den kompletten Plan.", "Rückwärtsplan: ab Lieferzeit rechnet MikiLab Teig, Gare und Backen zurück.", "Smart Planner mit Sprachvalidierung und Schicht-Timeline (Lose, Backen, SOS)."] },
    es: { t: "1 · Plan Semanal & Producción", p: "Da un punto de partida y Sitor completa el plan del día y de la semana.", b: ["Sitor · Plan del Día: secuencia de producción óptima con varias opciones.", "Plan Semanal: por día elige productos, piezas y gramos; imprime PDF y archivo.", "Plan de Producción IA: dicta pedidos y límites, la IA construye el plan completo.", "Plan Inverso: parte de la hora de entrega, MikiLab calcula masa, fermentación y cocción.", "Smart Planner con validación por voz y Timeline de Turno (lotes, horneados, SOS)."] },
    fr: { t: "1 · Plan Hebdomadaire & Production", p: "Donne un point de départ et Sitor complète le plan du jour et de la semaine.", b: ["Sitor · Plan du Jour : séquence de production optimale avec plusieurs options.", "Plan Hebdomadaire : par jour choisis produits, pièces et grammes ; imprime PDF et archive.", "Plan de Production IA : dicte commandes et contraintes, l'IA bâtit le plan complet.", "Plan à Rebours : dès l'heure de livraison, MikiLab calcule pâte, pousse et cuisson.", "Smart Planner avec validation vocale et Timeline d'Équipe (lots, cuissons, SOS)."] },
    fa: { t: "۱ · برنامه هفتگی و تولید", p: "یک نقطه شروع بده و سیتور برنامه روز و هفته را کامل می‌کند.", b: ["سیتور · برنامه روز: بهترین توالی تولید با چند گزینه.", "برنامه هفتگی: هر روز محصولات، تعداد و گرم را انتخاب کن؛ PDF چاپ و آرشیو کن.", "برنامه تولید هوش مصنوعی: سفارش‌ها را بگو، هوش مصنوعی برنامه کامل را می‌سازد.", "برنامه معکوس: از زمان تحویل، میکی‌لب خمیر، تخمیر و پخت را معکوس محاسبه می‌کند.", "برنامه‌ریز هوشمند با تأیید صوتی و خط زمانی شیفت (دسته‌ها، پخت، SOS)."] } },
  { id: "ordini", Icon: Zap, accent: "#a4afbb",
    it: { t: "2 · Ordini Extra & B2B", p: "Ordini dell'ultimo minuto: Sitor rigenera il piano all'istante.", b: ["Ordini Extra: aggiungi richieste e l'IA ricalcola tutto.", "Consegne & Eventi (Pasticceria): torte su commessa, matrimoni ed eventi con promemoria.", "Ordini B2B & E-commerce: gli ordini digitali diventano kg d'impasto per lo Smart Planner, con previsione meteo/festività."] },
    en: { t: "2 · Extra Orders & B2B", p: "Last-minute orders: Sitor regenerates the plan instantly.", b: ["Extra Orders: add requests and the AI recomputes everything.", "Deliveries & Events (Pastry): made-to-order cakes, weddings and events with reminders.", "B2B Orders & E-commerce: digital orders become kg of dough for the Smart Planner, with weather/holiday forecast."] },
    de: { t: "2 · Extra-Aufträge & B2B", p: "Last-Minute-Aufträge: Sitor erstellt den Plan sofort neu.", b: ["Extra-Aufträge: Wünsche hinzufügen und die KI rechnet alles neu.", "Lieferungen & Events (Konditorei): Auftragstorten, Hochzeiten und Events mit Erinnerungen.", "B2B & E-Commerce: digitale Aufträge werden zu kg Teig für den Smart Planner, mit Wetter-/Feiertagsprognose."] },
    es: { t: "2 · Pedidos Extra & B2B", p: "Pedidos de última hora: Sitor regenera el plan al instante.", b: ["Pedidos Extra: añade solicitudes y la IA recalcula todo.", "Entregas & Eventos (Pastelería): tartas por encargo, bodas y eventos con recordatorios.", "Pedidos B2B & E-commerce: los pedidos digitales se vuelven kg de masa para el Smart Planner, con previsión meteo/festivos."] },
    fr: { t: "2 · Commandes Extra & B2B", p: "Commandes de dernière minute : Sitor régénère le plan à l'instant.", b: ["Commandes Extra : ajoute des demandes et l'IA recalcule tout.", "Livraisons & Événements (Pâtisserie) : gâteaux sur commande, mariages et événements avec rappels.", "Commandes B2B & E-commerce : les commandes numériques deviennent des kg de pâte pour le Smart Planner, avec prévision météo/jours fériés."] },
    fa: { t: "۲ · سفارش‌های اضافه و B2B", p: "سفارش‌های لحظه‌آخری: سیتور فوراً برنامه را بازسازی می‌کند.", b: ["سفارش‌های اضافه: درخواست اضافه کن و هوش مصنوعی همه را بازمحاسبه می‌کند.", "تحویل و رویداد (شیرینی): کیک سفارشی، عروسی و رویداد با یادآوری.", "سفارش‌های B2B و فروشگاه: سفارش دیجیتال به کیلو خمیر برای برنامه‌ریز هوشمند تبدیل می‌شود، با پیش‌بینی آب‌وهوا/تعطیلات."] } },
  { id: "squadra", Icon: Users, accent: "#9aa6b2",
    it: { t: "3 · Ruoli & Turni", p: "Chi lavora, dove e quando — reparto per reparto.", b: ["Assegnazione Reparti: Panificio, Pasticceria, Pizzeria, Laugen, Banco, con più operai e mansioni distinte.", "Riepilogo Squadra a voce di Sitor all'apertura del turno.", "Turni ricorrenti (squadre-tipo) applicabili con un tocco.", "Volti della squadra e Rapporti di fine turno (pezzi, scarti, problemi, pulizia)."] },
    en: { t: "3 · Roles & Shifts", p: "Who works, where and when — department by department.", b: ["Department Assignment: Bakery, Pastry, Pizza, Laugen, Counter, with multiple operators and distinct tasks.", "Team roll-call voiced by Sitor at shift start.", "Recurring shifts (team templates) applied with one tap.", "Team faces and End-of-Shift reports (pieces, waste, issues, cleaning)."] },
    de: { t: "3 · Rollen & Schichten", p: "Wer arbeitet, wo und wann — Bereich für Bereich.", b: ["Bereichszuweisung: Backstube, Konditorei, Pizzeria, Laugen, Theke, mit mehreren Mitarbeitern und eigenen Aufgaben.", "Team-Übersicht per Sitor-Stimme zum Schichtbeginn.", "Wiederkehrende Schichten (Team-Vorlagen) mit einem Tipp.", "Team-Gesichter und Schichtende-Berichte (Stück, Ausschuss, Probleme, Reinigung)."] },
    es: { t: "3 · Roles & Turnos", p: "Quién trabaja, dónde y cuándo — área por área.", b: ["Asignación de Áreas: Panadería, Pastelería, Pizza, Laugen, Mostrador, con varios operarios y tareas distintas.", "Resumen de equipo con voz de Sitor al iniciar el turno.", "Turnos recurrentes (plantillas) aplicables con un toque.", "Rostros del equipo e Informes de fin de turno (piezas, mermas, problemas, limpieza)."] },
    fr: { t: "3 · Rôles & Services", p: "Qui travaille, où et quand — atelier par atelier.", b: ["Affectation Ateliers : Boulangerie, Pâtisserie, Pizza, Laugen, Comptoir, avec plusieurs opérateurs et tâches distinctes.", "Appel d'équipe par la voix de Sitor au début du service.", "Services récurrents (modèles) applicables d'un toucher.", "Visages de l'équipe et rapports de fin de service (pièces, pertes, problèmes, nettoyage)."] },
    fa: { t: "۳ · نقش‌ها و شیفت‌ها", p: "چه کسی، کجا و کی کار می‌کند — بخش به بخش.", b: ["تخصیص بخش: نانوایی، شیرینی، پیتزا، لاوگن، پیشخوان، با چند اپراتور و وظایف متمایز.", "فراخوان تیم با صدای سیتور در شروع شیفت.", "شیفت‌های تکرارشونده (الگوها) با یک لمس.", "چهره‌های تیم و گزارش‌های پایان شیفت (تعداد، ضایعات، مشکلات، نظافت)."] } },
  { id: "strumenti", Icon: Wrench, accent: "#64748B",
    it: { t: "4 · Strumenti & Integrazioni", p: "Tutto ciò che serve per produrre, controllare e risparmiare.", b: ["Sitor su misura: chiedi uno strumento a parole e Sitor lo crea sulla tua schermata.", "Ricettario Master protetto, editor termico (RPM, idratazione, rampe) e forgia immagini.", "Magazzino, Silos con calo peso e micro-ordini automatici, Food Cost e margini.", "Controllo Qualità Ottico (AI Vision) all'uscita del forno; Gemello Digitale 3D.", "Carbon Footprint & energia, Celle adattive, Flotta AGV, Packaging sincronizzato.", "Sicurezza: PIN Sezione Operai, PIN personali con livello, registro accessi, scadenza cancello."] },
    en: { t: "4 · Tools & Integrations", p: "Everything to produce, control and save.", b: ["Sitor tailor-made: ask for a tool in words and Sitor builds it on your screen.", "Protected Master recipes, thermal editor (RPM, hydration, ramps) and image forge.", "Warehouse, Silos with weight-drop and auto micro-orders, Food Cost and margins.", "Optical Quality Control (AI Vision) at oven exit; 3D Digital Twin.", "Carbon footprint & energy, adaptive proofing cells, AGV fleet, synced packaging.", "Security: Operator Section PIN, personal PINs with level, access log, gate expiry."] },
    de: { t: "4 · Werkzeuge & Integrationen", p: "Alles zum Produzieren, Kontrollieren und Sparen.", b: ["Sitor nach Maß: bitte um ein Werkzeug in Worten und Sitor baut es auf deinem Bildschirm.", "Geschützte Master-Rezepte, Thermal-Editor (RPM, Hydratation, Rampen) und Bild-Schmiede.", "Lager, Silos mit Gewichtsverlust und Auto-Nachbestellung, Food Cost und Margen.", "Optische Qualitätskontrolle (AI Vision) am Ofenausgang; 3D-Digitalzwilling.", "CO₂-Bilanz & Energie, adaptive Gärkammern, AGV-Flotte, synchrones Packaging.", "Sicherheit: Produktions-PIN, persönliche PINs mit Level, Zugangslog, Gate-Ablauf."] },
    es: { t: "4 · Herramientas & Integraciones", p: "Todo para producir, controlar y ahorrar.", b: ["Sitor a medida: pide una herramienta con palabras y Sitor la crea en tu pantalla.", "Recetario Master protegido, editor térmico (RPM, hidratación, rampas) y forja de imágenes.", "Almacén, Silos con caída de peso y micro-pedidos automáticos, Food Cost y márgenes.", "Control de Calidad Óptico (AI Vision) a la salida del horno; Gemelo Digital 3D.", "Huella de carbono y energía, cámaras adaptativas, flota AGV, empaquetado sincronizado.", "Seguridad: PIN Sección Operarios, PIN personales con nivel, registro de accesos, caducidad."] },
    fr: { t: "4 · Outils & Intégrations", p: "Tout pour produire, contrôler et économiser.", b: ["Sitor sur mesure : demande un outil en mots et Sitor le crée sur ton écran.", "Recettes Master protégées, éditeur thermique (RPM, hydratation, rampes) et forge d'images.", "Entrepôt, Silos avec perte de poids et micro-commandes auto, Coût matière et marges.", "Contrôle Qualité Optique (AI Vision) à la sortie du four ; Jumeau Numérique 3D.", "Empreinte carbone & énergie, chambres adaptatives, flotte AGV, emballage synchronisé.", "Sécurité : PIN Section Opérateurs, PIN personnels avec niveau, journal d'accès, expiration."] },
    fa: { t: "۴ · ابزارها و یکپارچه‌سازی", p: "هرچه برای تولید، کنترل و صرفه‌جویی لازم است.", b: ["سیتور سفارشی: با کلمات ابزار بخواه و سیتور آن را روی صفحه‌ات می‌سازد.", "دستور اصلی محافظت‌شده، ویرایشگر حرارتی (RPM، هیدراتاسیون، رمپ) و ساخت تصویر.", "انبار، سیلو با افت وزن و سفارش خودکار، بهای غذا و حاشیه سود.", "کنترل کیفیت بصری (AI Vision) در خروجی فر؛ دوقلوی دیجیتال سه‌بعدی.", "ردپای کربن و انرژی، اتاق‌های تطبیقی، ناوگان AGV، بسته‌بندی هماهنگ.", "امنیت: پین بخش اپراتور، پین شخصی با سطح، گزارش دسترسی، انقضای دروازه."] } },
  { id: "sitor", Icon: Sparkles, accent: "#a6b1bc",
    it: { t: "5 · Sala Sitor — il punto d'incontro", p: "L'unico luogo dove il Capo incontra Sitor: scrivi, detta, allega foto o email, dai ordini e ricevi tutto.", b: ["Ordine → Produzione: Sitor trasforma le tue parole in compiti pronti.", "Domanda → Risposta: chiedi qualsiasi cosa, Sitor risponde a voce.", "Report di turno parlato con MikiScore.", "Qui arrivano le proposte di modifica degli operai: le grandi le approvi tu, le piccole Sitor le applica e ti avvisa."] },
    en: { t: "5 · Sitor Hall — the meeting point", p: "The one place where the Capo meets Sitor: write, dictate, attach photos or emails, give orders and receive everything.", b: ["Order → Production: Sitor turns your words into ready tasks.", "Question → Answer: ask anything, Sitor answers by voice.", "Spoken shift report with MikiScore.", "Operators' change proposals land here: you approve the big ones, Sitor applies the small ones and notifies you."] },
    de: { t: "5 · Sitor-Saal — der Treffpunkt", p: "Der einzige Ort, wo der Chef Sitor trifft: schreiben, diktieren, Fotos/E-Mails anhängen, befehlen und alles erhalten.", b: ["Auftrag → Produktion: Sitor macht aus deinen Worten fertige Aufgaben.", "Frage → Antwort: frag alles, Sitor antwortet per Stimme.", "Gesprochener Schichtbericht mit MikiScore.", "Änderungsvorschläge des Teams landen hier: die großen genehmigst du, die kleinen wendet Sitor an und meldet es."] },
    es: { t: "5 · Sala Sitor — el punto de encuentro", p: "El único lugar donde el Capo se encuentra con Sitor: escribe, dicta, adjunta fotos o correos, da órdenes y recibe todo.", b: ["Orden → Producción: Sitor convierte tus palabras en tareas listas.", "Pregunta → Respuesta: pregunta lo que sea, Sitor responde por voz.", "Informe de turno hablado con MikiScore.", "Aquí llegan las propuestas de los operarios: las grandes las apruebas tú, las pequeñas Sitor las aplica y te avisa."] },
    fr: { t: "5 · Salle Sitor — le point de rencontre", p: "Le seul endroit où le Capo rencontre Sitor : écris, dicte, joins photos ou e-mails, donne des ordres et reçois tout.", b: ["Ordre → Production : Sitor transforme tes mots en tâches prêtes.", "Question → Réponse : demande tout, Sitor répond à la voix.", "Rapport de service parlé avec MikiScore.", "Les propositions des opérateurs arrivent ici : tu approuves les grandes, Sitor applique les petites et te prévient."] },
    fa: { t: "۵ · تالار سیتور — نقطه ملاقات", p: "تنها جایی که کاپو با سیتور ملاقات می‌کند: بنویس، بگو، عکس یا ایمیل پیوست کن، دستور بده و همه‌چیز را بگیر.", b: ["سفارش ← تولید: سیتور کلمات تو را به وظایف آماده تبدیل می‌کند.", "سؤال ← پاسخ: هرچه بخواه، سیتور با صدا پاسخ می‌دهد.", "گزارش شیفت گفتاری با MikiScore.", "پیشنهادهای اپراتورها اینجا می‌آید: بزرگ‌ها را تو تأیید می‌کنی، کوچک‌ها را سیتور اعمال و خبر می‌دهد."] } },
  { id: "produzione", Icon: Factory, accent: "#8a97a6",
    it: { t: "La Produzione (operai) — guidata da Sitor", p: "Ogni operaio vede solo il suo compito del giorno e ha Sitor come maestro personale.", b: ["Sitor Maestro: guida passo-passo adattata al livello (Novizio/Esperto/Maestro), con o senza macchinari.", "Timbratura personale, SOS impasto, foto-diagnosi e chiusura turno.", "L'operaio può proporre una modifica al piano: Sitor decide o la manda al Capo.", "Sitor sorveglia ogni fase, dall'inizio alla fine, perché tutto fili liscio."] },
    en: { t: "Production (operators) — guided by Sitor", p: "Each operator sees only their task of the day and has Sitor as a personal master.", b: ["Sitor Master: step-by-step guidance adapted to level (Novice/Expert/Master), with or without machines.", "Personal clock-in, dough SOS, photo diagnosis and shift closing.", "Operators can propose a plan change: Sitor decides or sends it to the Capo.", "Sitor watches every phase, start to finish, so everything runs smoothly."] },
    de: { t: "Produktion (Team) — von Sitor geführt", p: "Jeder sieht nur seine Tagesaufgabe und hat Sitor als persönlichen Meister.", b: ["Sitor Meister: Schritt-für-Schritt je nach Level (Anfänger/Erfahren/Meister), mit oder ohne Maschinen.", "Persönliche Stempelung, Teig-SOS, Foto-Diagnose und Schichtabschluss.", "Das Team kann eine Planänderung vorschlagen: Sitor entscheidet oder schickt sie zum Chef.", "Sitor überwacht jede Phase, von Anfang bis Ende, damit alles glatt läuft."] },
    es: { t: "Producción (operarios) — guiada por Sitor", p: "Cada operario ve solo su tarea del día y tiene a Sitor como maestro personal.", b: ["Sitor Maestro: guía paso a paso según nivel (Novato/Experto/Maestro), con o sin máquinas.", "Fichaje personal, SOS masa, foto-diagnóstico y cierre de turno.", "El operario puede proponer un cambio: Sitor decide o lo envía al Capo.", "Sitor vigila cada fase, de principio a fin, para que todo salga bien."] },
    fr: { t: "Production (opérateurs) — guidée par Sitor", p: "Chaque opérateur ne voit que sa tâche du jour et a Sitor comme maître personnel.", b: ["Sitor Maître : guidage pas à pas selon le niveau (Novice/Expert/Maître), avec ou sans machines.", "Pointage personnel, SOS pâte, photo-diagnostic et clôture de service.", "L'opérateur peut proposer un changement : Sitor décide ou l'envoie au Capo.", "Sitor surveille chaque phase, du début à la fin, pour que tout roule."] },
    fa: { t: "تولید (اپراتورها) — با راهنمایی سیتور", p: "هر اپراتور فقط وظیفه امروزش را می‌بیند و سیتور استاد شخصی اوست.", b: ["استاد سیتور: راهنمایی گام‌به‌گام بر اساس سطح (تازه‌کار/ماهر/استاد)، با یا بدون ماشین.", "ثبت ورود شخصی، SOS خمیر، تشخیص با عکس و بستن شیفت.", "اپراتور می‌تواند تغییر پیشنهاد دهد: سیتور تصمیم می‌گیرد یا به کاپو می‌فرستد.", "سیتور هر مرحله را از ابتدا تا انتها زیر نظر دارد تا همه‌چیز روان پیش برود."] } },
];

export default function GuidaMikiLab({ open, onClose }) {
  const { lang } = useLang();
  const L = ORDER.includes(LANG2(lang)) ? LANG2(lang) : "en";
  const T = (o) => o[L] || o.en || o.it;

  const downloadPdf = () => {
    const rows = GUIDE.map((s) => {
      const c = T(s);
      const lis = c.b.map((x) => `<li>${x}</li>`).join("");
      return `<section><h2 style="color:${s.accent}">${c.t}</h2><p>${c.p}</p><ul>${lis}</ul></section>`;
    }).join("");
    const rtl = L === "fa" ? ' dir="rtl"' : "";
    const html = `<!doctype html><html lang="${L}"${rtl}><head><meta charset="utf-8"><title>Guida MikiLab Pro</title>
      <style>*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#111;max-width:820px;margin:0 auto;padding:36px 30px;line-height:1.5}
      .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #8a97a6;padding-bottom:14px;margin-bottom:22px}
      .head img{width:56px;height:56px;border-radius:12px;object-fit:cover}h1{font-size:26px;margin:0;letter-spacing:.5px}.sub{color:#777;font-size:13px;margin-top:2px}
      section{margin:0 0 20px;page-break-inside:avoid}h2{font-size:17px;margin:0 0 6px}p{margin:0 0 8px;color:#333}ul{margin:0;padding-left:20px}li{margin:3px 0;color:#222}
      .foot{margin-top:26px;border-top:1px solid #ddd;padding-top:10px;color:#999;font-size:11px;text-align:center}</style></head><body>
      <div class="head"><img src="${window.location.origin}${PUB}/logo-emblem.png"/><div><h1>MIKILAB PRO</h1><div class="sub">MikiLab &amp; Sitor · Guida / Guide</div></div></div>
      ${rows}<div class="foot">MikiLab Pro &amp; Sitor — ${new Date().toLocaleDateString()}</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  };

  const isRtl = L === "fa";
  const label = {
    it: { title: "Guida MikiLab", sub: "Tutto ciò che puoi fare con MikiLab e Sitor", pdf: "Scarica PDF", close: "Chiudi la guida" },
    en: { title: "MikiLab Guide", sub: "Everything you can do with MikiLab and Sitor", pdf: "Download PDF", close: "Close the guide" },
    de: { title: "MikiLab-Anleitung", sub: "Alles, was du mit MikiLab und Sitor tun kannst", pdf: "PDF laden", close: "Anleitung schließen" },
    es: { title: "Guía MikiLab", sub: "Todo lo que puedes hacer con MikiLab y Sitor", pdf: "Descargar PDF", close: "Cerrar la guía" },
    fr: { title: "Guide MikiLab", sub: "Tout ce que tu peux faire avec MikiLab et Sitor", pdf: "Télécharger PDF", close: "Fermer le guide" },
    fa: { title: "راهنمای میکی‌لب", sub: "هرچه با میکی‌لب و سیتور می‌توانی انجام دهی", pdf: "دانلود PDF", close: "بستن راهنما" },
  }[L] || {};

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          data-testid="guida-mikilab" dir={isRtl ? "rtl" : "ltr"} className="fixed inset-0 z-[200] bg-[#030712]/95 backdrop-blur-md overflow-y-auto">
          <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-[#030712]/90 backdrop-blur py-2 -mx-2 px-2">
              <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-11 h-11 rounded-xl object-cover border border-[#8a97a6]/50" />
              <div className="flex-1 min-w-0">
                <h1 className="font-cyber text-lg sm:text-xl font-black text-white uppercase tracking-wider">{label.title}</h1>
                <p className="text-[11px] text-[#94A3B8]">{label.sub}</p>
              </div>
              <button data-testid="guida-pdf-btn" onClick={downloadPdf} title="PDF"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#8a97a6]/15 border border-[#8a97a6]/45 text-[#9aa6b2] font-bold text-xs active:scale-95 transition-all">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">{label.pdf}</span>
              </button>
              <button data-testid="guida-close-btn" onClick={onClose}
                className="w-9 h-9 rounded-lg bg-[#0C1019] border border-[#1e293b] text-white flex items-center justify-center active:scale-95"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              {GUIDE.map((s, i) => {
                const c = T(s); const I = s.Icon;
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    data-testid={`guida-section-${s.id}`} className="rounded-2xl border border-[#1e293b] bg-[#0C1019]/60 p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.accent}18`, border: `1px solid ${s.accent}55` }}>
                        <I className="w-4.5 h-4.5" style={{ color: s.accent }} />
                      </span>
                      <h2 className="font-cyber text-sm sm:text-base font-black text-white uppercase tracking-wide">{c.t}</h2>
                    </div>
                    <p className="text-[13px] text-[#CBD5E1] leading-snug mb-2.5">{c.p}</p>
                    <ul className="space-y-1.5">
                      {c.b.map((x, k) => (
                        <li key={k} className="flex gap-2 text-[13px] text-[#94A3B8] leading-snug">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.accent }} />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
            <button data-testid="guida-bottom-close" onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl bg-[#0C1019] border border-[#1e293b] text-[#94A3B8] font-bold text-sm active:scale-95">
              {label.close}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
