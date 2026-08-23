import asyncio, os
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAITextToSpeech

load_dotenv()

SCRIPTS = {
    "it": (
        "Ciao! Sono Michele, il tuo compagno di MikiLab. "
        "Qui trovi tutto per panificare come un vero professionista. "
        "Le tue ricette, con le dosi calcolate in automatico in base alla teglia e alla farina. "
        "Il tuo laboratorio smart, per pianificare la produzione senza errori. "
        "E la diagnosi con una foto, per correggere cottura e lievitazione in un attimo. "
        "Con l'Academy Impara da Casa cresci passo dopo passo, con corsi e schede pronte. "
        "Inizia subito: tu pensi al pane, al resto pensiamo noi."
    ),
    "de": (
        "Hallo! Ich bin Michele, dein Begleiter bei MikiLab. "
        "Hier findest du alles, um wie ein echter Profi zu backen. "
        "Deine Rezepte, mit automatisch berechneten Mengen je nach Blech und Mehl. "
        "Dein smartes Labor, um die Produktion ohne Fehler zu planen. "
        "Und die Foto-Diagnose, um Backen und Gaerung im Nu zu korrigieren. "
        "Mit der Academy Von zu Hause lernen waechst du Schritt fuer Schritt, mit Kursen und fertigen Karten. "
        "Leg gleich los: Du denkst ans Brot, um den Rest kuemmern wir uns."
    ),
    "en": (
        "Hi! I'm Michele, your MikiLab companion. "
        "Here you'll find everything to bake like a true professional. "
        "Your recipes, with doses calculated automatically based on your tin and flour. "
        "Your smart lab, to plan production without mistakes. "
        "And photo diagnosis, to fix baking and proofing in a snap. "
        "With the Learn from Home Academy you grow step by step, with courses and ready-made cards. "
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
