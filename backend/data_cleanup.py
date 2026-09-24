# ruff: noqa: F821  (i nomi del core sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab — STADIO 4 · Strumento admin "Pulizia dati vecchi".
Rotte SOLO admin (require_admin → 404 per gli anonimi via GateMiddleware).
Non esegue NULLA all'avvio: agisce solo sui pulsanti di Michele. Il backup NON viene
mai salvato sul server: viene generato al volo e scaricato dall'admin.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

import io as _io
import gzip as _gzip
import time as _time
from bson import json_util as _json_util
from fastapi.responses import StreamingResponse as _StreamingResponse

# Collezioni da TENERE (tutto il resto è classificato CANCELLA).
KEEP_COLLECTIONS = {
    "recipes", "recipe_extras", "recipe_courses_v2", "recipe_courses", "technique_pages",
    "learning_path", "site_pages", "app_meta", "site_settings", "palato_tips", "flour_types",
    "bread_calendar", "experiments", "live_sessions", "users", "user_sessions", "login_attempts",
    "rate_limits", "usage_daily", "chat_cache", "password_resets", "recipe_apprentice", "ai_usage",
    # V115: usate ancora dal sito — MAI svuotarle (files = foto delle ricette)
    "files", "favorites", "experiment_votes", "live_pings", "flours",
}
# Ricette extra NON del seed da rimuovere esplicitamente.
EXTRA_RECIPES_TO_DELETE = ["Colomba Pasquale a Lievito Madre", "Pane ai Cereali"]
# Chiavi app_meta vecchie (PIN/gate) da rimuovere.
OLD_APP_META_KEYS = ["production_pin", "admin_gate_pin", "guest_gate_pin", "gate_config"]

# Token di backup per sessione admin (in memoria, breve durata). Nessun dato persistito.
_backup_tokens: dict = {}
_BACKUP_TTL = 1800.0  # 30 minuti


@api_router.get("/admin/data-cleanup/scan")
async def data_cleanup_scan(admin: dict = Depends(require_admin)):
    names = await db.list_collection_names()
    keep, delete = [], []
    for n in sorted(names):
        try:
            cnt = await db[n].estimated_document_count()
        except Exception:
            cnt = await db[n].count_documents({})
        row = {"collection": n, "count": int(cnt), "action": "TIENI" if n in KEEP_COLLECTIONS else "CANCELLA"}
        (keep if n in KEEP_COLLECTIONS else delete).append(row)
    return {"keep": keep, "delete": delete,
            "keep_total": sum(r["count"] for r in keep),
            "delete_total": sum(r["count"] for r in delete),
            "keep_count": len(keep), "delete_count": len(delete)}


@api_router.get("/admin/data-cleanup/backup")
async def data_cleanup_backup(admin: dict = Depends(require_admin)):
    names = await db.list_collection_names()
    to_dump = [n for n in sorted(names) if n not in KEEP_COLLECTIONS]
    buf = _io.BytesIO()
    with _gzip.GzipFile(fileobj=buf, mode="wb") as gz:
        gz.write(b'{\n')
        first = True
        for n in to_dump:
            docs = await db[n].find({}).to_list(100000)
            chunk = ("" if first else ",\n") + _json_util.dumps({n: docs})[1:-1]
            gz.write(chunk.encode("utf-8"))
            first = False
        gz.write(b'\n}\n')
    buf.seek(0)
    # abilita la cancellazione per questa sessione admin
    token = secrets.token_urlsafe(16)
    _backup_tokens[admin["user_id"]] = {"token": token, "ts": _time.time()}
    fname = f"mikilab_backup_dati_vecchi_{now_iso()[:10]}.json.gz"
    return _StreamingResponse(
        _io.BytesIO(buf.read()), media_type="application/gzip",
        headers={"Content-Disposition": f'attachment; filename="{fname}"', "X-Backup-Token": token})


class _CleanupExec(BaseModel):
    confirm: str
    backup_token: str


@api_router.post("/admin/data-cleanup/execute")
async def data_cleanup_execute(body: _CleanupExec, admin: dict = Depends(require_admin)):
    rec = _backup_tokens.get(admin["user_id"])
    if not rec or (_time.time() - rec["ts"]) > _BACKUP_TTL or body.backup_token != rec["token"]:
        raise HTTPException(status_code=428, detail="Scarica prima il backup (nella stessa sessione).")
    if (body.confirm or "").strip() != "CANCELLA":
        raise HTTPException(status_code=400, detail="Scrivi CANCELLA per confermare.")

    report = {"collezioni_svuotate": [], "utenti_non_admin_rimossi": 0, "sessioni_rimosse": 0,
              "ricette_extra_rimosse": [], "chiavi_app_meta_rimosse": [], "contatori_azzerati": []}

    # 1) svuota tutte le collezioni CANCELLA
    names = await db.list_collection_names()
    for n in sorted(names):
        if n in KEEP_COLLECTIONS:
            continue
        cnt = await db[n].count_documents({})
        if cnt:
            await db[n].delete_many({})
        report["collezioni_svuotate"].append({"collection": n, "rimossi": int(cnt)})

    # 2) utenti non admin (e loro sessioni) — l'owner/admin resta
    owner_lower = [e.lower() for e in OWNER_EMAILS]
    non_admin = await db.users.find(
        {"role": {"$ne": "admin"}, "email": {"$nin": owner_lower}}, {"_id": 0, "user_id": 1}).to_list(100000)
    ids = [u["user_id"] for u in non_admin if u.get("user_id")]
    if ids:
        s = await db.user_sessions.delete_many({"user_id": {"$in": ids}})
        report["sessioni_rimosse"] = int(s.deleted_count)
        d = await db.users.delete_many({"user_id": {"$in": ids}})
        report["utenti_non_admin_rimossi"] = int(d.deleted_count)

    # 3) 2 ricette extra non del seed
    for nm in EXTRA_RECIPES_TO_DELETE:
        r = await db.recipes.delete_many({"name": nm})
        if r.deleted_count:
            report["ricette_extra_rimosse"].append({"name": nm, "rimossi": int(r.deleted_count)})

    # 4) chiavi vecchie di app_meta (PIN, gate)
    for key in OLD_APP_META_KEYS:
        r = await db.app_meta.delete_many({"_key": key})
        if r.deleted_count:
            report["chiavi_app_meta_rimosse"].append(key)

    # 5) azzera i dati di prova
    for coll in ("usage_daily", "chat_cache", "rate_limits"):
        c = await db[coll].count_documents({})
        if c:
            await db[coll].delete_many({})
        report["contatori_azzerati"].append({"collection": coll, "rimossi": int(c)})
    # contatori "quanti l'hanno fatta" + voti/ping dei Live
    try:
        await db.done_counters.delete_many({})
        report["contatori_azzerati"].append({"collection": "done_counters", "rimossi": "svuotato"})
    except Exception:
        pass
    try:
        await db.experiments.update_many({}, {"$set": {"votes_a": 0, "votes_b": 0, "votes": 0}})
        report["contatori_azzerati"].append({"collection": "experiments (voti)", "rimossi": "azzerati"})
    except Exception:
        pass
    try:
        await db.live_sessions.update_many({}, {"$set": {"pings": 0, "watchers": 0}})
        report["contatori_azzerati"].append({"collection": "live_sessions (ping)", "rimossi": "azzerati"})
    except Exception:
        pass

    # consuma il token: una cancellazione per backup
    _backup_tokens.pop(admin["user_id"], None)
    report["completato_il"] = now_iso()
    return report
