import os, re

ROOT = "/app/frontend/src"
IMPORT_LINE = 'import { mkTri } from "@/i18n/triMaps";'

# Single-line: const NAME = (params) => (...);   NAME in tri/triM/triNav
def_re = re.compile(r'^(\s*)const (tri|triM|triNav) = \(([^)]*)\) => .*;\s*$')
# tri3 with lang as first param: const tri3 = (LANG, rest...) => ...;
tri3_re = re.compile(r'^(\s*)const tri3 = \((\w+)\s*,\s*([^)]*)\) => .*;\s*$')

changed_files = []

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
            m3 = tri3_re.match(line)
            m = def_re.match(line)
            if m3:
                indent, langp, rest = m3.group(1), m3.group(2), m3.group(3)
                args = ", ".join(a.strip() for a in rest.split(",") if a.strip())
                out.append(f'{indent}const tri3 = ({langp}, {rest}) => mkTri({langp})({args});\n')
                touched = True
            elif m:
                indent, name, params = m.group(1), m.group(2), m.group(3)
                args = ", ".join(a.strip() for a in params.split(",") if a.strip())
                out.append(f'{indent}const {name} = ({params}) => mkTri(lang)({args});\n')
                touched = True
            else:
                out.append(line)
        if touched:
            # insert import after last top-level import if not present
            if IMPORT_LINE not in "".join(out):
                last_imp = -1
                for idx, l in enumerate(out):
                    if l.startswith("import "):
                        last_imp = idx
                if last_imp >= 0:
                    out.insert(last_imp + 1, IMPORT_LINE + "\n")
                else:
                    out.insert(0, IMPORT_LINE + "\n")
            with open(fp, "w") as f:
                f.writelines(out)
            changed_files.append(fp)

print(f"changed {len(changed_files)} files")
for c in changed_files:
    print(" -", c.replace(ROOT + "/", ""))
