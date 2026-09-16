#!/usr/bin/env python3
"""Estrae tutte le stringhe IT (primo arg di tri(...)) da frontend/src e misura la copertura in triTranslations.json."""
import os, re, json, sys

SRC = "/app/frontend/src"
MAP = "/app/frontend/src/i18n/triTranslations.json"

def iter_files():
    for root, _, files in os.walk(SRC):
        for f in files:
            if f.endswith((".js", ".jsx", ".ts", ".tsx")):
                yield os.path.join(root, f)

def parse_first_string(s, i):
    """Da posizione i (subito dopo 'tri('), salta spazi e legge un literal '...' o \"...\" o `...`. Ritorna (stringa, tipo) o None."""
    n = len(s)
    while i < n and s[i] in " \t\r\n":
        i += 1
    if i >= n:
        return None
    q = s[i]
    if q not in "\"'`":
        return None  # primo arg non è un literal (variabile/espressione)
    i += 1
    buf = []
    while i < n:
        c = s[i]
        if c == "\\":
            if i + 1 < n:
                nxt = s[i+1]
                mp = {"n":"\n","t":"\t","r":"\r","\\":"\\","'":"'","\"":"\"","`":"`"}
                buf.append(mp.get(nxt, nxt))
                i += 2
                continue
            else:
                break
        if c == q:
            return "".join(buf), q
        if q == "`" and c == "$" and i+1 < n and s[i+1] == "{":
            return None  # template con interpolazione: skip
        buf.append(c)
        i += 1
    return None

def extract():
    strings = {}
    pat = re.compile(r"\btri\s*\(")
    for path in iter_files():
        try:
            txt = open(path, encoding="utf-8").read()
        except Exception:
            continue
        for m in pat.finditer(txt):
            res = parse_first_string(txt, m.end())
            if res:
                val = res[0]
                if val.strip():
                    strings.setdefault(val, []).append(os.path.relpath(path, SRC))
    return strings

if __name__ == "__main__":
    strings = extract()
    data = json.load(open(MAP, encoding="utf-8"))
    langs = ["fr", "fa", "ar", "tr"]
    total = len(strings)
    covered = {l: 0 for l in langs}
    missing = {l: [] for l in langs}
    for it in strings:
        entry = data.get(it) or {}
        for l in langs:
            if entry.get(l):
                covered[l] += 1
            else:
                missing[l].append(it)
    print(f"Stringhe IT distinte (primo arg di tri): {total}")
    print(f"Chiavi totali in triTranslations.json: {len(data)}")
    for l in langs:
        print(f"  {l}: coperte {covered[l]}/{total}  (mancanti {len(missing[l])})")
    # salva l'elenco mancanti (union) per lo step di generazione
    union_missing = sorted({it for l in langs for it in missing[l]})
    json.dump({"all_strings": sorted(strings.keys()), "missing_union": union_missing},
              open("/app/scripts/_tri_work.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"Stringhe da tradurre (mancanti in almeno una lingua): {len(union_missing)}")
