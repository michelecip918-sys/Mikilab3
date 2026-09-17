#!/usr/bin/env python3
"""CI ISOLAMENTO MULTI-TENANT.
Segnala le query su collezioni AZIENDALI (ORG_SCOPED_COLLECTIONS, letto dinamicamente da server.py)
che non filtrano/valorizzano `organization_id`. Copre automaticamente ogni collezione futura
aggiunta a ORG_SCOPED_COLLECTIONS.

Uso:  python3 scripts/check_org_isolation.py            (exit 1 se trova violazioni)
Sopprimere un falso positivo: aggiungi  # noqa: org-scope  sulla riga della chiamata.
"""
import os, re, sys

BACKEND = "/app/backend"
OPS_FILTER = ("find", "find_one", "update_one", "update_many", "delete_one", "delete_many", "count_documents")
OPS_DOC = ("insert_one", "insert_many")
# File esclusi: script una-tantum, migrazioni, test, diagnosi.
SKIP_FILE_PAT = re.compile(r"(^_|test_|_cleanup|_diag|_seed|_setup|_iter|scripts_|translate_|backend_test)")


def load_scoped():
    sys.path.insert(0, BACKEND)
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "ci_dummy")
    import importlib
    server = importlib.import_module("server")
    return set(server.ORG_SCOPED_COLLECTIONS)


def span_after(text, start):
    """Ritorna (contenuto tra parentesi bilanciate, indice_fine) partendo da '(' in start."""
    depth = 0
    i = start
    n = len(text)
    while i < n:
        c = text[i]
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return text[start + 1:i], i
        i += 1
    return text[start + 1:], n


def first_arg(span):
    """Primo argomento top-level (fino alla prima virgola non annidata)."""
    depth = 0
    for idx, c in enumerate(span):
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        elif c == "," and depth == 0:
            return span[:idx]
    return span


def resolve_indirect(text, target, call_start):
    """Se il filtro/doc è una variabile o dict(var), cerca a ritroso la sua definizione
    `<var> = {...}` nella stessa area e verifica se contiene organization_id."""
    t = target.strip()
    m = re.fullmatch(r"dict\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)", t) or re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)", t)
    if not m:
        return False
    var = m.group(1)
    # cerca l'ultima assegnazione `var = {` prima della chiamata
    prefix = text[:call_start]
    asg = None
    for mm in re.finditer(r"\b" + re.escape(var) + r"\s*=\s*\{", prefix):
        asg = mm
    if not asg:
        return False
    # estrai il blocco dict bilanciato
    i = asg.end() - 1
    depth = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                block = text[asg.end() - 1:i + 1]
                return "organization_id" in block
        i += 1
    return False


def scan_file(path, scoped):
    text = open(path, encoding="utf-8").read()
    lines = text.split("\n")
    viol = []
    pat = re.compile(r"db\.([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_]+)\s*\(")
    for m in pat.finditer(text):
        coll, op = m.group(1), m.group(2)
        if coll not in scoped:
            continue
        if op not in OPS_FILTER and op not in OPS_DOC:
            continue
        paren = text.index("(", m.end() - 1)
        span, _ = span_after(text, paren)
        target = first_arg(span) if op in OPS_FILTER else span
        lineno = text[:m.start()].count("\n") + 1
        line_src = lines[lineno - 1] if lineno - 1 < len(lines) else ""
        if "noqa: org-scope" in line_src:
            continue
        if "organization_id" in target:
            continue
        if resolve_indirect(text, target, m.start()):
            continue
        viol.append((lineno, coll, op, line_src.strip()[:90]))
    return viol


def main():
    scoped = load_scoped()
    total = 0
    for root, _, files in os.walk(BACKEND):
        if "/tests" in root or "/node_modules" in root:
            continue
        for f in sorted(files):
            if not f.endswith(".py") or SKIP_FILE_PAT.search(f):
                continue
            path = os.path.join(root, f)
            viol = scan_file(path, scoped)
            if viol:
                rel = os.path.relpath(path, BACKEND)
                for (ln, coll, op, src) in viol:
                    print(f"  {rel}:{ln}  {coll}.{op}()  ->  {src}")
                    total += 1
    print("-" * 60)
    if total:
        print(f"❌ ISOLAMENTO: {total} query senza organization_id su collezioni aziendali.")
        print("   Aggiungi il filtro/campo organization_id, oppure  # noqa: org-scope  se legittimo.")
        return 1
    print(f"✅ ISOLAMENTO OK: nessuna query scoperta ({len(scoped)} collezioni aziendali monitorate).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
