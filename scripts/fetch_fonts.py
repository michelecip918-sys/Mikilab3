#!/usr/bin/env python3
"""Scarica i Google Fonts come woff2 self-hosted e genera fonts.css locale (GDPR: nessuna chiamata a Google)."""
import os, re, requests

OUT = "/app/frontend/public/fonts"
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"}

FAMILIES = [
    ("Playfair Display", "Playfair+Display:wght@500;600;700;800", {"latin", "latin-ext"}),
    ("Manrope", "Manrope:wght@400;500;600;700", {"latin", "latin-ext"}),
    ("JetBrains Mono", "JetBrains+Mono:wght@500;700", {"latin", "latin-ext"}),
    ("Vazirmatn", "Vazirmatn:wght@400;500;600;700;800", {"latin", "latin-ext", "arabic"}),  # arabo per il farsi
    ("Orbitron", "Orbitron:wght@500;600;700;800;900", {"latin", "latin-ext"}),
    ("Rajdhani", "Rajdhani:wght@500;600;700", {"latin", "latin-ext"}),
]

css_out = []
for fam, q, keep in FAMILIES:
    url = f"https://fonts.googleapis.com/css2?family={q}&display=swap"
    css = requests.get(url, headers=UA, timeout=30).text
    blocks = re.findall(r"/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{[^}]+\})", css)
    n = 0
    for subset, block in blocks:
        if subset not in keep:
            continue
        m_w = re.search(r"font-weight:\s*(\d+)", block)
        m_u = re.search(r"url\((https://fonts.gstatic.com/[^)]+\.woff2)\)", block)
        if not (m_w and m_u):
            continue
        weight, furl = m_w.group(1), m_u.group(1)
        fname = f"{fam.replace(' ', '')}-{weight}-{subset}.woff2"
        with open(os.path.join(OUT, fname), "wb") as f:
            f.write(requests.get(furl, headers=UA, timeout=30).content)
        css_out.append(
            "@font-face {\n"
            f"  font-family: '{fam}';\n"
            f"  font-style: normal;\n  font-weight: {weight};\n  font-display: swap;\n"
            f"  src: url('/fonts/{fname}') format('woff2');\n"
            f"  /* subset: {subset} */\n}}"
        )
        n += 1
    print(fam, "faces:", n)

with open(os.path.join(OUT, "fonts.css"), "w") as f:
    f.write("/* Google Fonts self-hosted (GDPR): serviti localmente, nessuna richiesta a Google. */\n\n" + "\n\n".join(css_out) + "\n")
print("fonts.css scritto,", len(css_out), "facce totali")
