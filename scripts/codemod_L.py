import os, re

ROOT = "/app/frontend/src"
IMPORT_LINE = 'import { mkTri } from "@/i18n/triMaps";'
defL = re.compile(r'^(\s*)const L = \(([^)]*)\) => (.*);\s*$')

changed = []
for dp, _, files in os.walk(ROOT):
    for fn in files:
        if not (fn.endswith(".js") or fn.endswith(".jsx")):
            continue
        fp = os.path.join(dp, fn)
        with open(fp) as f:
            lines = f.readlines()
        out = []
        touched = False
        for line in lines:
            m = defL.match(line)
            if m:
                indent, params, rhs = m.group(1), m.group(2).strip(), m.group(3).strip()
                names = [p.strip() for p in params.split(",") if p.strip()]
                # skip object-based / single param / non-ternary bodies
                if not rhs.startswith("(") or len(names) == 1:
                    out.append(line); continue
                if names[0] == "lang":
                    rest = names[1:]
                    args = ", ".join(rest)
                    out.append(f'{indent}const L = ({params}) => mkTri(lang)({args});\n')
                    touched = True
                elif len(names) == 2:
                    a, b = names
                    out.append(f'{indent}const L = ({params}) => mkTri(lang)({a}, {b}, {b}, {b});\n')
                    touched = True
                elif len(names) == 4:
                    args = ", ".join(names)
                    out.append(f'{indent}const L = ({params}) => mkTri(lang)({args});\n')
                    touched = True
                else:
                    out.append(line)
            else:
                out.append(line)
        if touched:
            if IMPORT_LINE not in "".join(out):
                out.insert(0, IMPORT_LINE + "\n")
            with open(fp, "w") as f:
                f.writelines(out)
            changed.append(fp.replace(ROOT + "/", ""))

print(f"changed {len(changed)} files")
for c in changed: print(" -", c)
