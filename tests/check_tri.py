import os, re, sys

root = "/app/frontend/src"
missing = []

def scan(text, path):
    i = 0
    while True:
        m = re.search(r'\btri\s*\(', text[i:])
        if not m:
            break
        start = i + m.end()  # after '('
        depth = 1
        j = start
        commas = 0
        instr = None
        while j < len(text) and depth > 0:
            c = text[j]
            if instr:
                if c == '\\':
                    j += 2
                    continue
                if c == instr:
                    instr = None
            else:
                if c in '"\'`':
                    instr = c
                elif c in '([{':
                    depth += 1
                elif c in ')]}':
                    depth -= 1
                elif c == ',' and depth == 1:
                    commas += 1
            j += 1
        args = commas + 1
        if args < 3:
            snippet = text[start:j-1].replace("\n", " ")[:90]
            line = text[:start].count("\n") + 1
            missing.append((path, line, args, snippet))
        i = j

for dirpath, dirs, files in os.walk(root):
    for f in files:
        if f.endswith((".jsx", ".js")):
            p = os.path.join(dirpath, f)
            scan(open(p, encoding="utf-8").read(), p)

print(f"tri() calls with fewer than 3 args (missing EN): {len(missing)}")
for p, l, a, s in missing:
    print(f"{p.replace(root,'')}:{l} args={a} :: {s}")
