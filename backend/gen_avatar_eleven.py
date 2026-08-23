import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings

load_dotenv()
client = ElevenLabs(api_key=os.getenv("ELEVEN_API_KEY"))

SCRIPTS = {
    "it": (
        "Ciao! Sono Michele e questo è MikiLab, il sito che ho creato per aiutarti a panificare come un professionista, ovunque tu sia. "
        "Nella sezione Ricette trovi tutte le mie ricette, con dosi e ingredienti precisi per pane, focacce e panettoni. "
        "Nel Tuo Laboratorio pianifichi la produzione, calcoli idratazione e costi e gestisci fermentazioni e igiene. "
        "Con la Diagnosi scatti una foto dell'impasto o della crosta e l'intelligenza artificiale ti dice cosa migliorare. "
        "Nella sezione Impara cresci con corsi passo-passo, il ricettario dinamico con calcolo delle dosi e l'Enciclopedia del Pane. "
        "E nella Community ci confrontiamo tutti insieme, tra appassionati. "
        "Inizia subito: tu pensi al pane, al resto pensiamo noi."
    ),
    "de": (
        "Hallo! Ich bin Michele und das ist MikiLab, die Seite, die ich erstellt habe, damit du wie ein Profi backen kannst, wo immer du bist. "
        "Im Bereich Rezepte findest du alle meine Rezepte, mit genauen Mengen und Zutaten für Brot, Focaccia und Panettone. "
        "In deinem Labor planst du die Produktion, berechnest Hydration und Kosten und verwaltest Gärung und Hygiene. "
        "Mit der Diagnose machst du ein Foto vom Teig oder von der Kruste, und die künstliche Intelligenz sagt dir, was du verbessern kannst. "
        "Im Bereich Lernen wächst du mit Schritt-für-Schritt-Kursen, dem dynamischen Rezeptbuch und dem Brot-Lexikon. "
        "Und in der Community tauschen wir uns alle gemeinsam aus. "
        "Leg gleich los: Du denkst ans Brot, um den Rest kümmern wir uns."
    ),
    "en": (
        "Hi! I'm Michele, and this is MikiLab, the site I created to help you bake like a professional, wherever you are. "
        "In the Recipes section you'll find all my recipes, with precise doses and ingredients for bread, focaccia and panettone. "
        "In Your Lab you plan production, calculate hydration and costs, and manage fermentation and hygiene. "
        "With Diagnosis you take a photo of your dough or crust, and the artificial intelligence tells you what to improve. "
        "In the Learn section you grow with step-by-step courses, the dynamic recipe book and the Bread Encyclopedia. "
        "And in the Community we all share and help each other. "
        "Get started now: you think about the bread, we'll handle the rest."
    ),
}

# Scegli una voce maschile calda/profonda tra quelle disponibili
PREFER = ["giovanni", "matteo", "marco", "adam", "antoni", "daniel", "george", "bill", "brian", "charlie"]
voices = client.voices.get_all().voices
chosen = None
for name in PREFER:
    for v in voices:
        if name in (v.name or "").lower():
            chosen = v
            break
    if chosen:
        break
if not chosen:
    for v in voices:
        lab = getattr(v, "labels", {}) or {}
        if str(lab.get("gender", "")).lower() == "male":
            chosen = v
            break
if not chosen:
    chosen = voices[0]
print("VOICE CHOSEN:", chosen.name, chosen.voice_id, getattr(chosen, "labels", {}))

settings = VoiceSettings(stability=0.55, similarity_boost=0.8, style=0.15, use_speaker_boost=True)
for lang, text in SCRIPTS.items():
    stream = client.text_to_speech.convert(
        text=text, voice_id=chosen.voice_id, model_id="eleven_multilingual_v2",
        voice_settings=settings, output_format="mp3_44100_128",
    )
    data = b""
    for chunk in stream:
        if chunk:
            data += chunk
    with open(f"/tmp/narration-{lang}.mp3", "wb") as f:
        f.write(data)
    print(lang, "bytes:", len(data))
