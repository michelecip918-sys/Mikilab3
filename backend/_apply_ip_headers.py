"""Prepend proprietary IP headers to core source files (idempotent)."""
import os

MARK = "MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL"

PY_HEADER = (
    "# ============================================================================\n"
    "#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL\n"
    "#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.\n"
    "#  Unico proprietario legale: il Master. Sole legal owner: the Master.\n"
    "#  Codice riservato: vietata copia, distribuzione, reverse engineering o\n"
    "#  cloning non autorizzati. Unauthorized copying, distribution, reverse\n"
    "#  engineering or cloning is strictly prohibited and actively tracked by\n"
    "#  the BakoMix AI Security Guardian.\n"
    "# ============================================================================\n"
)

JS_HEADER = (
    "/*\n"
    " * ============================================================================\n"
    " *  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL\n"
    " *  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.\n"
    " *  Unico proprietario legale: il Master. Sole legal owner: the Master.\n"
    " *  Codice riservato: vietata copia, distribuzione, reverse engineering o\n"
    " *  cloning non autorizzati. Unauthorized copying, distribution, reverse\n"
    " *  engineering or cloning is strictly prohibited and actively tracked by\n"
    " *  the BakoMix AI Security Guardian.\n"
    " * ============================================================================\n"
    " */\n"
)


def prepend(path, header):
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return False
    if MARK in content[:800]:
        return False
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + content)
    return True


def main():
    count = 0
    # Backend: server.py + moduli core
    for root, _dirs, files in os.walk("/app/backend"):
        if "/node_modules" in root or "/__pycache__" in root:
            continue
        for fn in files:
            if fn.endswith(".py") and fn != "_apply_ip_headers.py":
                if prepend(os.path.join(root, fn), PY_HEADER):
                    count += 1
    # Frontend: file core (src root: App/index/lib/i18n/sections/components entry)
    core = [
        "/app/frontend/src/App.js", "/app/frontend/src/index.js",
        "/app/frontend/src/App.css", "/app/frontend/src/index.css",
    ]
    for p in core:
        if prepend(p, JS_HEADER if p.endswith(".js") else ("/*\n * " + MARK + "\n * (c) 2026 MikiLab Pro — All rights reserved. Sole owner: the Master.\n */\n")):
            count += 1
    print("headers applied:", count)


if __name__ == "__main__":
    main()
