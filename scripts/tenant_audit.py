#!/usr/bin/env python3
"""Audit preciso: individua le collezioni tenant-scoped (quelle che DA QUALCHE PARTE
usano organization_id) e segnala SOLO le loro operazioni il cui filtro non lo include."""
import re, os

FILES = ["server.py", "deck.py", "recipes.py", "coordination.py", "operations.py", "orgs.py", "warehouse.py"]
BASE = "/app/backend"
READ_OPS = {"find", "find_one", "update_one", "update_many", "delete_one", "delete_many", "count_documents", "distinct", "aggregate"}
WRITE_OPS = {"insert_one", "insert_many"}
ALL_OPS = READ_OPS | WRITE_OPS
pat = re.compile(r"db\.([a-z_]+)\.(" + "|".join(ALL_OPS) + r")\s*\(")

def extract_call(text, start):
    depth, i = 0, start
    while i < len(text):
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return text[start + 1:i], i
        i += 1
    return text[start + 1:], len(text)

# Pass 1: raccogli tutte le op per collezione.
calls = []  # (fn, line, coll, op, arg, has_org)
srcs = {}
for fn in FILES:
    p = os.path.join(BASE, fn)
    if not os.path.exists(p):
        continue
    src = open(p).read()
    srcs[fn] = src
    for m in pat.finditer(src):
        coll, op = m.group(1), m.group(2)
        paren = m.end() - 1
        arg, end = extract_call(src, paren)
        # per insert, controlla anche la variabile documento nelle ~15 righe precedenti
        has_org = ("organization_id" in arg) or ("_org_id" in arg)
        line = src[:m.start()].count("\n") + 1
        calls.append([fn, line, coll, op, arg.strip().replace("\n", " ")[:120], has_org])

# collezioni tenant-scoped = quelle con almeno un'op che usa organization_id
tenant = set(c[2] for c in calls if c[5])
print("Collezioni TENANT-SCOPED individuate:", sorted(tenant), "\n")

# Pass 2: segnala op su collezioni tenant-scoped senza organization_id.
# Per gli insert, guardiamo se il doc costruito poco sopra include organization_id (euristica: cerca nelle 20 righe prima).
suspect = []
for fn, line, coll, op, arg, has_org in calls:
    if coll not in tenant or has_org:
        continue
    if op in WRITE_OPS:
        # euristica: controlla blocco precedente per organization_id vicino
        src = srcs[fn]
        idx = src.find("\n") # not used
        lines = src.split("\n")
        window = "\n".join(lines[max(0, line - 20):line])
        if "organization_id" in window:
            continue
    suspect.append((fn, line, coll, op, arg))

print(f"OPERAZIONI SOSPETTE (tenant-scoped senza organization_id): {len(suspect)}\n")
by = {}
for fn, line, coll, op, arg in suspect:
    by.setdefault(coll, []).append((fn, line, op, arg))
for coll in sorted(by):
    print(f"\n### {coll}  ({len(by[coll])})")
    for fn, line, op, arg in by[coll]:
        print(f"  {fn}:{line}  {op}(  {arg}")
