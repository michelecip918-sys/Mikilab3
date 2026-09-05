# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import asyncio, os
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAITextToSpeech

load_dotenv()

SCRIPTS = {
    "it": (
        "Ciao! Sono Michele e questo è MikiLab, il sito che ho creato per aiutarti a panificare come un professionista, ovunque tu sia. "
        "Nella sezione Ricette trovi tutte le mie ricette, con dosi e ingredienti precisi per pane, focacce e panettoni. "
        "Nel Tuo Laboratorio pianifichi la produzione, calcoli idratazione e costi e gestisci fermentazioni e igiene. "
        "Con la Diagnosi scatti una foto dell'impasto o della crosta e l'intelligenza artificiale ti dice cosa migliorare. "
        "Nella sezione Impara cresci con i video mentore, il ricettario dinamico e l'Enciclopedia del Pane. "
        "E nella Community ci confrontiamo tutti insieme, tra appassionati. "
        "Inizia subito: tu pensi al pane, al resto pensiamo noi."
    ),
    "de": (
        "Hallo! Ich bin Michele und das ist MikiLab, die Seite, die ich erstellt habe, damit du wie ein Profi backen kannst, wo immer du bist. "
        "Im Bereich Rezepte findest du alle meine Rezepte, mit genauen Mengen und Zutaten für Brot, Focaccia und Panettone. "
        "In deinem Labor planst du die Produktion, berechnest Hydration und Kosten und verwaltest Gärung und Hygiene. "
        "Mit der Diagnose machst du ein Foto vom Teig oder von der Kruste, und die künstliche Intelligenz sagt dir, was du verbessern kannst. "
        "Im Bereich Lernen wächst du mit Mentor-Videos, dem dynamischen Rezeptbuch und dem Brot-Lexikon. "
        "Und in der Community tauschen wir uns alle gemeinsam aus. "
        "Leg gleich los: Du denkst ans Brot, um den Rest kümmern wir uns."
    ),
    "en": (
        "Hi! I'm Michele, and this is MikiLab, the site I created to help you bake like a professional, wherever you are. "
        "In the Recipes section you'll find all my recipes, with precise doses and ingredients for bread, focaccia and panettone. "
        "In Your Lab you plan production, calculate hydration and costs, and manage fermentation and hygiene. "
        "With Diagnosis you take a photo of your dough or crust, and the artificial intelligence tells you what to improve. "
        "In the Learn section you grow with mentor videos, the dynamic recipe book and the Bread Encyclopedia. "
        "And in the Community we all share and help each other. "
        "Get started now: you think about the bread, we'll handle the rest."
    ),
}


async def main():
    tts = OpenAITextToSpeech(api_key=os.getenv("EMERGENT_LLM_KEY"))
    for lang, text in SCRIPTS.items():
        audio = await tts.generate_speech(text=text, model="tts-1-hd", voice="onyx", speed=1.0)
        with open(f"/tmp/narration-{lang}.mp3", "wb") as f:
            f.write(audio)
        print(lang, "MP3 bytes:", len(audio))


if __name__ == "__main__":
    asyncio.run(main())
