import re, glob
# Detect dictionaries with it/de keys but missing en at top level of an object literal
files = glob.glob("/app/frontend/src/**/*.js*", recursive=True)
for p in files:
    txt = open(p, encoding="utf-8").read()
    # find "  it: {" ... look whether a sibling "  en: {" exists in same const block
    for m in re.finditer(r'(const\s+(\w+)\s*=\s*\{)', txt):
        start = m.end() - 1
        depth = 0
        i = start
        instr = None
        while i < len(txt):
            c = txt[i]
            if instr:
                if c == '\\':
                    i += 2; continue
                if c == instr: instr = None
            else:
                if c in '"\'`': instr = c
                elif c == '{': depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0: break
            i += 1
        block = txt[start:i+1]
        has_it = re.search(r'\bit\s*:\s*[\{\[]', block)
        has_de = re.search(r'\bde\s*:\s*[\{\[]', block)
        has_en = re.search(r'\ben\s*:\s*[\{\[]', block)
        if has_it and has_de and not has_en:
            line = txt[:m.start()].count("\n") + 1
            print(f"MISSING EN dict: {p.replace('/app/frontend/src','')}:{line} const {m.group(2)}")
