import os, subprocess, textwrap
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
BG = (18, 18, 18)
ORANGE = (255, 107, 0)
WHITE = (240, 244, 248)
GREY = (150, 160, 168)
OUT = "/app/frontend/public/mikilab-video.mp4"
TMP = "/tmp/mikilab_slides"
LOGO = "/app/frontend/public/logo-256.png"
os.makedirs(TMP, exist_ok=True)

FB = None
FR = None
for p in ["/root/.venv/lib/python3.11/site-packages/reportlab/fonts/VeraBd.ttf",
          "/opt/plugins-venv/lib/python3.11/site-packages/reportlab/fonts/VeraBd.ttf"]:
    if os.path.exists(p): FB = p; break
for p in ["/root/.venv/lib/python3.11/site-packages/reportlab/fonts/Vera.ttf",
          "/opt/plugins-venv/lib/python3.11/site-packages/reportlab/fonts/Vera.ttf"]:
    if os.path.exists(p): FR = p; break

def font(bold, size):
    return ImageFont.truetype(FB if bold else FR, size)

logo_img = None
if os.path.exists(LOGO):
    logo_img = Image.open(LOGO).convert("RGBA")

SLIDES = [
    {"type": "title", "title": "MikiLab", "sub": "Tutto quello che fa il sito",
     "note": "Riservato a Michele"},
    {"type": "sec", "n": "1", "title": "Home", "bullets": [
        "Scegli il tuo spazio: Panetteria, Pizzeria, Pasticceria",
        "Contatore iscritti live con bandiere dei paesi",
        "Fornaio della Settimana, news, sapore del giorno",
        "Radio del Fornaio e newsletter"]},
    {"type": "sec", "n": "2", "title": "Ricette", "bullets": [
        "Ricettario MikiLab + le tue ricette personali",
        "Pane, focacce, viennoiserie, panettoni e altro",
        "Scansiona da foto oppure scrivi a mano",
        "Costi, prezzi B2B, foto e procedimento"]},
    {"type": "sec", "n": "3", "title": "Il Tuo Laboratorio", "bullets": [
        "Piano di Produzione con IA, ora per ora",
        "Oltre 30 strumenti pro: farine, forno, idratazione",
        "Gestione celle, freezer, turni e HACCP",
        "Mani in pasta a comando vocale"]},
    {"type": "sec", "n": "4", "title": "Impara (Academy)", "bullets": [
        "Percorsi per principianti e Bake-Along passo passo",
        "Quiz e Sfida Lampo con classifica",
        "Badge Streak a 7, 30 e 100 giorni",
        "Glossario, enciclopedia e guide ai metodi"]},
    {"type": "sec", "n": "5", "title": "Social", "bullets": [
        "Profilo pubblico, amici e chat privata",
        "Mappa dei fornai e Hall of Fame",
        "Sfide che sbloccano nuovi contenuti"]},
    {"type": "sec", "n": "6", "title": "Promuovi MikiLab", "bullets": [
        "Volantini stampabili in 5 lingue con QR tracciati",
        "Nome del tuo forno personalizzato",
        "Post social pronti da pubblicare",
        "Condivisione diretta dal telefono"]},
    {"type": "sec", "n": "7", "title": "Admin (solo tu)", "bullets": [
        "Gestione ricette, utenti e accessi",
        "Statistiche email e click social (export CSV)",
        "Impostazioni social: TikTok, Instagram, Facebook",
        "Inventario del sito in PDF col logo"]},
    {"type": "outro", "title": "MikiLab", "sub": "Sempre gratis, per ogni fornaio",
     "note": "mikilab.de"},
]

def wrap(draw, text, fnt, maxw):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= maxw:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def paste_logo(img, size, cx, top):
    if not logo_img: return top
    lg = logo_img.resize((size, size), Image.LANCZOS)
    img.paste(lg, (int(cx - size / 2), int(top)), lg)
    return top + size

def render(slide, path):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # accent bar
    d.rectangle([0, 0, 14, H], fill=ORANGE)

    if slide["type"] in ("title", "outro"):
        top = 300
        top = paste_logo(img, 190, W / 2, top) + 30
        f_t = font(True, 96)
        tw = d.textlength(slide["title"], font=f_t)
        d.text(((W - tw) / 2, top), slide["title"], font=f_t, fill=WHITE)
        top += 130
        f_s = font(False, 46)
        for line in wrap(d, slide["sub"], f_s, 1300):
            lw = d.textlength(line, font=f_s)
            d.text(((W - lw) / 2, top), line, font=f_s, fill=ORANGE)
            top += 62
        top += 24
        f_n = font(False, 30)
        nw = d.textlength(slide["note"], font=f_n)
        d.text(((W - nw) / 2, top), slide["note"], font=f_n, fill=GREY)
    else:
        # section number badge
        bx, by, r = 150, 180, 52
        d.ellipse([bx - r, by - r, bx + r, by + r], fill=ORANGE)
        f_num = font(True, 54)
        nw = d.textlength(slide["n"], font=f_num)
        d.text((bx - nw / 2, by - 36), slide["n"], font=f_num, fill=WHITE)
        # title
        f_t = font(True, 78)
        d.text((bx + r + 40, by - 52), slide["title"], font=f_t, fill=ORANGE)
        # underline
        d.rectangle([150, 280, 150 + 620, 286], fill=(60, 60, 60))
        # bullets
        f_b = font(False, 46)
        y = 380
        for b in slide["bullets"]:
            d.ellipse([170, y + 18, 190, y + 38], fill=ORANGE)
            lines = wrap(d, b, f_b, 1560)
            for i, line in enumerate(lines):
                d.text((230, y), line, font=f_b, fill=WHITE)
                y += 62
            y += 34
        # small logo bottom-right
        if logo_img:
            lg = logo_img.resize((90, 90), Image.LANCZOS)
            img.paste(lg, (W - 150, H - 150), lg)
    img.save(path)

paths = []
for i, s in enumerate(SLIDES):
    p = f"{TMP}/s{i:02d}.png"
    render(s, p)
    paths.append(p)
print("slides:", len(paths))

DUR, FADE = 4.8, 0.7
cmd = ["ffmpeg", "-y"]
for p in paths:
    cmd += ["-loop", "1", "-framerate", "30", "-t", str(DUR), "-i", p]
N = len(paths)
parts = []
prev = "[0]"
for i in range(1, N):
    off = i * (DUR - FADE)
    out = f"[v{i}]"
    parts.append(f"{prev}[{i}]xfade=transition=fade:duration={FADE}:offset={off:.2f}{out}")
    prev = out
parts.append(f"{prev}format=yuv420p[vout]")
filt = ";".join(parts)
cmd += ["-filter_complex", filt, "-map", "[vout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT]
print("running ffmpeg...")
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("FFMPEG ERROR\n", r.stderr[-1500:])
else:
    print("VIDEO OK:", OUT, os.path.getsize(OUT), "bytes")
