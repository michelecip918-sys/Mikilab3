import os, re

ROOT = "/app/frontend/src"
IMPORT = 'import { mkTri } from "@/i18n/triMaps";'
S = r'"((?:[^"\\]|\\.)*)"'  # double-quoted string literal

# 4-branch: lang==="de"?DE:lang==="en"?EN:lang==="es"?ES:IT
p4 = re.compile(r'lang === "de" \? ' + S + r' : lang === "en" \? ' + S + r' : lang === "es" \? ' + S + r' : ' + S)
# 3-branch: lang==="de"?DE:lang==="en"?EN:IT
p3 = re.compile(r'lang === "de" \? ' + S + r' : lang === "en" \? ' + S + r' : ' + S)
# 3-branch es first: lang==="de"?DE:lang==="es"?ES:IT
p3es = re.compile(r'lang === "de" \? ' + S + r' : lang === "es" \? ' + S + r' : ' + S)

def r4(m): return f'mkTri(lang)("{m.group(4)}", "{m.group(1)}", "{m.group(2)}", "{m.group(3)}")'
def r3(m): return f'mkTri(lang)("{m.group(3)}", "{m.group(1)}", "{m.group(2)}")'
def r3es(m): return f'mkTri(lang)("{m.group(3)}", "{m.group(1)}", "{m.group(2)}", "{m.group(2)}")'

changed = []
for dp, _, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith((".js", ".jsx")): continue
        fp = os.path.join(dp, fn)
        src = open(fp).read()
        new = p4.sub(r4, src)
        new = p3.sub(r3, new)
        new = p3es.sub(r3es, new)
        if new != src:
            if IMPORT not in new:
                new = IMPORT + "\n" + new
            open(fp, "w").write(new)
            changed.append(fp.replace(ROOT + "/", ""))
print("changed", len(changed), "files")
