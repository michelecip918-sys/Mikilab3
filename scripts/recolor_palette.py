"""Rimappa la vecchia palette (marroni/oro/crema/viola + neutri scuri) alla nuova:
nero profondo / arancio vivace / giallo caldo / testo bianco."""
import os, re, glob

# lowercase keys -> new hex
MAP = {
    # --- Marroni / terracotta / rosso-brand -> ARANCIO ---
    "#8c4a27": "#ff6b00", "#6e371c": "#ff6b00", "#4a3222": "#ff6b00", "#2c1e16": "#ff6b00",
    "#8a5a2b": "#ff6b00", "#a9772f": "#ffc700", "#92400e": "#ff6b00", "#b45309": "#ff6b00",
    "#a66a15": "#ff6b00", "#d97706": "#ff6b00", "#b23a2f": "#ff6b00", "#c0574d": "#ff6b00",
    "#6b5546": "#ff6b00", "#8c7362": "#ff8a33", "#7a4e12": "#ffc700",
    # --- Viola (banner sfida) -> ARANCIO ---
    "#7a4fbf": "#ff6b00", "#6d3fb0": "#ff6b00",
    # --- Oro / ambra / crema-accento -> GIALLO ---
    "#c88a2b": "#ffc700", "#e4c98b": "#ffc700", "#e7d5b4": "#ffc700", "#f2e8d5": "#1a1a1a",
    # --- Crema / beige chiari (sfondi/bordi) -> NERO scale ---
    "#fdfbf7": "#121212", "#fffdf9": "#161616", "#faf5ec": "#121212", "#fbf3e4": "#121212",
    "#f3e7d0": "#161616", "#e6d8c3": "#2b2b2b", "#fef3c7": "#ffffff",
    "#f4e4c6": "#121212", "#ecd4ab": "#141414", "#f7e6bf": "#1a1a1a", "#e7c98c": "#ffc700",
    # --- Neutri scuri (già dark) -> NERO ---
    "#1b2127": "#121212", "#232a31": "#1e1e1e", "#1f252b": "#181818", "#2a323a": "#242424",
    "#24303c": "#1c1c1c", "#2e3d4c": "#242424", "#38424b": "#2e2e2e",
}

exts = ("jsx", "js", "css")
root = "/app/frontend/src"
files = []
for e in exts:
    files += glob.glob(f"{root}/**/*.{e}", recursive=True)

pat = re.compile(r"#[0-9A-Fa-f]{6}")
changed = 0
for fp in files:
    txt = open(fp, encoding="utf-8").read()
    def repl(m):
        return MAP.get(m.group(0).lower(), m.group(0))
    new = pat.sub(repl, txt)
    if new != txt:
        open(fp, "w", encoding="utf-8").write(new)
        changed += 1
print(f"file modificati: {changed}")
