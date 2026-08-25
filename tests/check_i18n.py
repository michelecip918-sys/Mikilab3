import re, json, subprocess, os

# 1) translations.js key parity
src = open("/app/frontend/src/i18n/translations.js", encoding="utf-8").read()
# find blocks it: { ... }, de: { ... }, en: { ... } at top level of translations
def keys_of(langname):
    m = re.search(r'\n  ' + langname + r': \{(.*?)\n  \},?\n', src, re.S)
    if not m:
        return None
    body = m.group(1)
    return set(re.findall(r'^\s{4}([A-Za-z0-9_]+):', body, re.M))

it, de, en = keys_of("it"), keys_of("de"), keys_of("en")
print("translations key counts:", len(it or []), len(de or []), len(en or []))
if it and de and en:
    print("missing in de:", sorted(it - de)[:20])
    print("missing in en:", sorted(it - en)[:20])
    print("extra in en:", sorted(en - it)[:10])

# 2) find object literals having it: and de: but not en: within same braces
import glob
for p in glob.glob("/app/frontend/src/**/*.js*", recursive=True):
    txt = open(p, encoding="utf-8").read()
    # naive: split on '{' groups containing it: '..'
    for m in re.finditer(r'\{[^{}]*\bit:[^{}]*\}', txt, re.S):
        blk = m.group(0)
        if 'de:' in blk and 'en:' not in blk:
            line = txt[:m.start()].count("\n") + 1
            print(f"NO-EN {p.replace('/app/frontend/src','')}:{line} :: {blk[:120].replace(chr(10),' ')}")
