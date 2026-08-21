import re, pathlib

MAP = {
    # Primario marrone -> verde salvia
    "#B34A26": "#5E8B7E", "#963B1C": "#4C7368", "#8C3A1D": "#33564E",
    "#3a2d27": "#33564E", "#5f2410": "#33564E", "#732f18": "#33564E",
    # Destructive (rosso morbido, non marrone)
    "#B4442A": "#C0574D",
    # Giallo/oro -> blu salvia / azzurro polvere
    "#D99B26": "#6E8CA0", "#E5AC3A": "#8FB0C2", "#B8801a": "#5E7E90",
    "#A6803A": "#6E8CA0", "#8C5A2B": "#6E8CA0",
    "#E6B85C": "#A9C5D4", "#D9A762": "#A9C5D4",
    "#7A5E24": "#33564E", "#7A4A20": "#33564E",
    "#FFF7E8": "#EAF0EC", "#EFE6D6": "#EAF0EC", "#E9DCCB": "#EAF0EC",
    # Testo -> antracite / slate
    "#2C221E": "#2B303B", "#4A3B34": "#3F4A54", "#8C7567": "#7E8A93",
    "#736055": "#6B7680", "#A89689": "#9AA6AE", "#C9BBB0": "#AEB8BF",
    "#5f4f45": "#6B7680", "#111111": "#2B303B",
    # Sfondi chiari (panna caldo -> chiaro freddo/sage)
    "#F5EFE6": "#EAF0EC", "#FDFBF7": "#F6F8F5", "#E8DEC8": "#D7E1DB",
    # Dark mode (marrone scuro -> antracite freddo)
    "#1A1412": "#1B2127", "#2A211D": "#232A31", "#241D19": "#1F252B",
    "#332823": "#2A323A", "#3D302A": "#38424B",
    # Tricolore IT/DE -> neutro sage/blu
    "#009246": "#6B8E62", "#008C45": "#6B8E62",
    "#CE2B37": "#6E8CA0", "#CD212A": "#6E8CA0", "#DD0000": "#6E8CA0",
    "#FFCE00": "#A9C5D4", "#FFCC00": "#A9C5D4",
}

root = pathlib.Path("/app/frontend/src")
files = list(root.rglob("*.jsx")) + list(root.rglob("*.css")) + list(root.rglob("*.js"))
total = 0
for f in files:
    txt = f.read_text(encoding="utf-8")
    orig = txt
    for old, new in MAP.items():
        txt = re.sub(re.escape(old), new, txt, flags=re.IGNORECASE)
    if txt != orig:
        f.write_text(txt, encoding="utf-8")
        total += 1
print(f"Aggiornati {total} file su {len(files)}")
