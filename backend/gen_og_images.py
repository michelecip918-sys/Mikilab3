"""Genera immagini Open Graph per lingua (logo + testo tradotto) → frontend/public/og-<lang>.jpg"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

PUB = Path(__file__).resolve().parents[1] / "frontend" / "public"
BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

DATA = {
    "it": ("Panificazione, Pizzeria & Pasticceria", "Ricette, piani di produzione con l'IA e food cost. Il laboratorio completo del fornaio.", "100% GRATIS"),
    "en": ("Bakery, Pizzeria & Pastry Lab", "Recipes, AI production plans and food cost. The complete baker's workshop.", "100% FREE"),
    "es": ("Panadería, Pizzería y Pastelería", "Recetas, planes de producción con IA y food cost. El laboratorio completo del panadero.", "100% GRATIS"),
    "fr": ("Boulangerie, Pizzeria & Pâtisserie", "Recettes, plans de production IA et food cost. Le laboratoire complet du boulanger.", "100% GRATUIT"),
    "de": ("Bäckerei, Pizzeria & Konditorei", "Rezepte, KI-Produktionspläne und Food Cost. Die komplette Backstube.", "100% KOSTENLOS"),
}
W, H = 1200, 630


def grad():
    base = Image.new("RGB", (W, H), "#f4ead6")
    top = (247, 239, 224); bot = (231, 213, 180)
    for y in range(H):
        r = int(top[0] + (bot[0] - top[0]) * y / H)
        g = int(top[1] + (bot[1] - top[1]) * y / H)
        b = int(top[2] + (bot[2] - top[2]) * y / H)
        ImageDraw.Draw(base).line([(0, y), (W, y)], fill=(r, g, b))
    return base


def wrap(draw, text, font, maxw):
    words = text.split(); lines = []; cur = ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


logo = Image.open(PUB / "logo-emblem.png").convert("RGBA").resize((400, 400), Image.LANCZOS)
# maschera circolare
mask = Image.new("L", (400, 400), 0)
ImageDraw.Draw(mask).ellipse((0, 0, 400, 400), fill=255)

for lang, (tag, desc, pill) in DATA.items():
    img = grad()
    d = ImageDraw.Draw(img)
    img.paste(logo, (60, (H - 400) // 2), mask)
    x = 510
    fBrand = ImageFont.truetype(BOLD, 92)
    fTag = ImageFont.truetype(BOLD, 40)
    fDesc = ImageFont.truetype(REG, 30)
    fPill = ImageFont.truetype(BOLD, 30)
    y = 120
    d.text((x, y), "MikiLab", font=fBrand, fill="#6E371C"); y += 108
    for ln in wrap(d, tag, fTag, W - x - 50):
        d.text((x, y), ln, font=fTag, fill="#8C4A27"); y += 50
    y += 14
    for ln in wrap(d, desc, fDesc, W - x - 50):
        d.text((x, y), ln, font=fDesc, fill="#5b4a34"); y += 38
    # pill 100% gratis
    pw = d.textlength(pill, font=fPill) + 44
    py = H - 90
    d.rounded_rectangle((x, py, x + pw, py + 52), radius=26, fill="#3a6b3a")
    d.text((x + 22, py + 10), pill, font=fPill, fill="#ffffff")
    img.save(PUB / f"og-{lang}.jpg", quality=90)
    print("saved", f"og-{lang}.jpg")

# default = it
Image.open(PUB / "og-it.jpg").save(PUB / "og-image.jpg", quality=90)
print("default og-image.jpg = it")
