import os, asyncio, subprocess, json
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.openai import OpenAITextToSpeech

TMP = "/tmp/mikilab_slides"
OUT = "/app/frontend/public/mikilab-video-narrato.mp4"
VOICE = "onyx"
MODEL = "tts-1-hd"

NARR = [
    "MikiLab. Ecco tutto quello che fa il tuo sito, in meno di un minuto.",
    "Nella Home scegli il tuo spazio, vedi gli iscritti in tempo reale, le news e il fornaio della settimana.",
    "Le Ricette: il ricettario MikiLab e le tue ricette personali, con costi, prezzi e la scansione da foto.",
    "Il Tuo Laboratorio: il piano di produzione con l'intelligenza artificiale e oltre trenta strumenti professionali.",
    "Impara: percorsi per principianti, bake along, quiz con classifica e i badge per la costanza.",
    "Social: profilo, amici, chat privata, la mappa dei fornai e le sfide che sbloccano contenuti.",
    "Promuovi MikiLab: volantini in cinque lingue con codice QR e post social pronti da pubblicare.",
    "E per te, l'area Admin: gestione, statistiche e l'inventario del sito in PDF.",
    "MikiLab. Sempre gratis, per ogni fornaio. mikilab punto de.",
]

async def gen_audio():
    tts = OpenAITextToSpeech(api_key=os.getenv("EMERGENT_LLM_KEY"))
    for i, text in enumerate(NARR):
        audio = await tts.generate_speech(text=text, model=MODEL, voice=VOICE, speed=0.98)
        with open(f"{TMP}/a{i:02d}.mp3", "wb") as f:
            f.write(audio)
        print("audio", i, "ok", len(audio), "bytes")

def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "json", path], capture_output=True, text=True)
    return float(json.loads(r.stdout)["format"]["duration"])

def build():
    clips = []
    for i in range(len(NARR)):
        img = f"{TMP}/s{i:02d}.png"
        aud = f"{TMP}/a{i:02d}.mp3"
        d = dur(aud)
        s = 0.35 + d + 0.9
        clip = f"{TMP}/clip{i:02d}.mp4"
        vf = (f"[0]fade=t=in:st=0:d=0.35,fade=t=out:st={s-0.45:.2f}:d=0.45,format=yuv420p[v];"
              f"[1]adelay=350:all=1,apad[a]")
        cmd = ["ffmpeg", "-y", "-loop", "1", "-framerate", "30", "-t", f"{s:.2f}", "-i", img,
               "-i", aud, "-filter_complex", vf, "-map", "[v]", "-map", "[a]", "-t", f"{s:.2f}",
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-r", "30",
               "-c:a", "aac", "-ar", "44100", "-b:a", "160k", clip]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print("CLIP ERR", i, r.stderr[-800:]); return False
        clips.append(clip)
        print("clip", i, "dur", round(s, 2))
    listf = f"{TMP}/list.txt"
    with open(listf, "w") as f:
        for c in clips:
            f.write(f"file '{c}'\n")
    r = subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listf,
                        "-c", "copy", "-movflags", "+faststart", OUT], capture_output=True, text=True)
    if r.returncode != 0:
        print("CONCAT ERR", r.stderr[-800:]); return False
    print("VIDEO OK:", OUT, os.path.getsize(OUT), "bytes")
    return True

asyncio.run(gen_audio())
build()
