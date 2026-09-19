# ruff: noqa: F821  (i nomi del core sono iniettati via globals().update)
"""MikiLab — Il Manuale di Sitor · Corso passo-passo v2 + Chat pubblica di Sitor.
Collezione NUOVA `recipe_courses_v2` (NON tocca `recipe_courses`). I testi delle chat
pubbliche NON vengono salvati: restano nel browser; il server tiene solo i contatori dei limiti.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

import os as _os
import re as _re
import json as _json
import hashlib as _hashlib
import asyncio as _asyncio
from pydantic import BaseModel as _BM
from typing import Optional as _Opt, List as _List

COURSE_GEN_DAILY_CAP = int(_os.environ.get("COURSE_GEN_DAILY_CAP", "40"))
SITOR_USER_DAILY = int(_os.environ.get("SITOR_USER_DAILY", "15"))
SITOR_GLOBAL_DAILY = int(_os.environ.get("SITOR_GLOBAL_DAILY", "500"))

_COURSE_LANGS = ("it", "de", "en")
_course_locks: dict = {}


def _lang2(lang: str) -> str:
    return (lang or "it").split("-")[0][:2].lower()


async def _is_hidden(recipe_id: str) -> bool:
    d = await db.recipe_extras.find_one({"recipe_id": recipe_id}, {"_id": 0, "hidden_public": 1})
    return bool(d and d.get("hidden_public"))


def _course_context(r: dict) -> str:
    try:
        return _core._recipe_course_context(r)
    except Exception:
        keys = ["name", "flour_type", "hydration_percent", "flour_grams", "water_grams",
                "salt_grams", "sourdough_grams", "preferment_type", "bake_temp", "procedure", "notes"]
        return _json.dumps({k: r.get(k) for k in keys}, ensure_ascii=False)[:2500]


_SYS = {
    "it": "italiano", "de": "tedesco", "en": "inglese",
}


async def _generate_course(recipe: dict, lang2: str) -> _Opt[dict]:
    if not EMERGENT_LLM_KEY:
        return None
    langname = _SYS.get(lang2, "italiano")
    try:
        equip = _core.equipment_template(recipe)
    except Exception:
        equip = []
    equip_names = ", ".join([(e.get(lang2) or e.get("it") or "") for e in equip]) if equip else ""
    sysmsg = (
        "Sei Sitor, una guida amichevole di panificazione per chi cucina A CASA. "
        "Trasforma una ricetta da laboratorio in un corso passo-passo per la cucina di casa. "
        "REGOLA ASSOLUTA: NON cambiare dosi né ingredienti. Adatta solo i GESTI alla casa "
        "(cella di lievitazione → posto fresco o frigo; impastatrice → mani o planetaria; vapore → "
        "pentolino d'acqua nel forno). Per ogni fase dai SEGNALI da riconoscere (aspetto, tatto, profumo), "
        "non solo i minuti. Niente HACCP né burocrazia. Nessun consiglio medico. "
        f"Rispondi in {langname}. Restituisci SOLO JSON valido, senza testo fuori dal JSON:\n"
        "{\"title\":\"..\",\"intro\":\"1-2 frasi\","
        "\"phases\":[{\"name\":\"nome fase\",\"do_casa\":\"cosa fare, semplice\",\"do_esperto\":\"nota tecnica breve\","
        "\"why\":\"perché\",\"signals\":\"segnali da riconoscere\",\"time_min\":0,\"time_max\":0,\"timer_min\":0,"
        "\"safety\":\"avviso se serve, altrimenti stringa vuota\",\"technique\":\"baguette|croissant|pieghe|pirlatura|filone|panettone o vuoto\"}],"
        "\"troubleshooting\":[{\"problem\":\"..\",\"cause\":\"..\",\"fix\":\"..\"}],"
        "\"storage\":\"come conservare\"}. Da 5 a 9 fasi. troubleshooting da 3 a 5 voci. "
        "time_min/time_max/timer_min in MINUTI interi (0 se non applicabile)."
    )
    out = ""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"coursev2-{recipe.get('id','')[:8]}-{lang2}",
                   system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=4500)
    async for ev in chat.stream_message(UserMessage(text=f"DATI RICETTA: {_course_context(recipe)}\nATTREZZI: {equip_names}\nGenera il corso.")):
        if isinstance(ev, TextDelta):
            out += ev.content or ""
    parsed = _core._parse_llm_json(out) if hasattr(_core, "_parse_llm_json") else {}
    if not parsed:
        m = _re.search(r"\{.*\}", out, _re.S)
        parsed = _json.loads(m.group(0)) if m else {}
    if not parsed.get("phases"):
        return None

    def _i(v):
        try:
            return max(0, int(float(v)))
        except Exception:
            return 0
    phases = []
    for p in parsed["phases"][:9]:
        if not isinstance(p, dict):
            continue
        phases.append({
            "name": (p.get("name") or "")[:120],
            "do_casa": (p.get("do_casa") or p.get("detail") or "")[:900],
            "do_esperto": (p.get("do_esperto") or "")[:600],
            "why": (p.get("why") or "")[:500],
            "signals": (p.get("signals") or "")[:500],
            "time_min": _i(p.get("time_min")), "time_max": _i(p.get("time_max")),
            "timer_min": _i(p.get("timer_min")),
            "safety": (p.get("safety") or "")[:300],
            "technique": (p.get("technique") or "").strip().lower()[:20],
        })
    return {
        "title": (parsed.get("title") or recipe.get("name") or "")[:160],
        "intro": (parsed.get("intro") or "")[:600],
        "equipment": equip,
        "phases": phases,
        "troubleshooting": [{"problem": (t.get("problem") or "")[:200], "cause": (t.get("cause") or "")[:200], "fix": (t.get("fix") or "")[:300]}
                            for t in (parsed.get("troubleshooting") or []) if isinstance(t, dict)][:5],
        "storage": (parsed.get("storage") or "")[:500],
    }


@api_router.get("/recipes/{recipe_id}/course-v2")
async def course_v2(recipe_id: str, lang: str = "it", user: _Opt[dict] = Depends(optional_user)):
    lang2 = _lang2(lang)
    if lang2 not in _COURSE_LANGS:
        raise HTTPException(status_code=400, detail="lang_not_supported")
    is_admin = bool(user and user.get("role") == "admin")
    if not is_admin and await _is_hidden(recipe_id):
        raise HTTPException(status_code=404, detail="recipe_not_found")
    cached = await db.recipe_courses_v2.find_one({"recipe_id": recipe_id, "lang": lang2}, {"_id": 0})
    if cached and cached.get("course"):
        return {"ok": True, "cached": True, "course": cached["course"],
                "verified": bool(cached.get("verified")), "recipe_name": cached.get("recipe_name", "")}
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="recipe_not_found")
    # tetto giornaliero alle NUOVE generazioni
    if not await _rate_limit("course_gen_daily", "all", COURSE_GEN_DAILY_CAP, 86400):
        raise HTTPException(status_code=503, detail="course_daily_cap")
    # blocco anti-doppia generazione per ricetta+lingua
    lk = _course_locks.setdefault(f"{recipe_id}:{lang2}", _asyncio.Lock())
    async with lk:
        cached = await db.recipe_courses_v2.find_one({"recipe_id": recipe_id, "lang": lang2}, {"_id": 0})
        if cached and cached.get("course"):
            return {"ok": True, "cached": True, "course": cached["course"],
                    "verified": bool(cached.get("verified")), "recipe_name": cached.get("recipe_name", "")}
        course = await _generate_course(recipe, lang2)
        if not course:
            raise HTTPException(status_code=503, detail="course_unavailable")
        await db.recipe_courses_v2.update_one(
            {"recipe_id": recipe_id, "lang": lang2},
            {"$set": {"recipe_id": recipe_id, "lang": lang2, "recipe_name": recipe.get("name", ""),
                      "course": course, "verified": False, "generated_at": now_iso()}},
            upsert=True)
        return {"ok": True, "cached": False, "course": course, "verified": False, "recipe_name": recipe.get("name", "")}


class CourseVerifyReq(_BM):
    verified: _Opt[bool] = None
    course: _Opt[dict] = None


@api_router.put("/recipes/{recipe_id}/course-v2")
async def course_v2_edit(recipe_id: str, body: CourseVerifyReq, lang: str = "it", admin: dict = Depends(require_admin)):
    lang2 = _lang2(lang)
    upd = {}
    if body.verified is not None:
        upd["verified"] = bool(body.verified)
    if body.course is not None:
        upd["course"] = body.course
    if not upd:
        raise HTTPException(status_code=400, detail="nothing_to_update")
    upd["updated_at"] = now_iso()
    await db.recipe_courses_v2.update_one({"recipe_id": recipe_id, "lang": lang2}, {"$set": upd}, upsert=True)
    doc = await db.recipe_courses_v2.find_one({"recipe_id": recipe_id, "lang": lang2}, {"_id": 0})
    return {"ok": True, "course": doc.get("course"), "verified": bool(doc.get("verified"))}


# ---------------------------------------------------------------------------
# CHAT PUBBLICA DI SITOR — una sola chat. Nessun testo salvato sul server.
# ---------------------------------------------------------------------------
class PublicChatMsg(_BM):
    role: str
    content: str


class PublicChatReq(_BM):
    messages: _List[PublicChatMsg] = []
    lang: str = "it"
    tools: _Opt[dict] = None      # profilo attrezzi/forno/tempo dal dispositivo


def _device_id(request) -> str:
    ip = _client_ip(request)
    ua = (request.headers.get("user-agent") or "")[:120]
    ck = request.cookies.get("mikilab_uid") or ""
    return _hashlib.sha256(f"{ip}|{ua}|{ck}".encode()).hexdigest()[:24]


_CHAT_SYS = {
    "it": "italiano", "de": "tedesco", "en": "inglese",
}


@api_router.post("/sitor/chat")
async def sitor_chat(body: PublicChatReq, request: Request):
    lang2 = _lang2(body.lang)
    langname = _CHAT_SYS.get(lang2, "italiano")
    dev = _device_id(request)
    # limiti: per-persona e globale (in questo ordine, senza consumare il globale se l'utente è già oltre)
    if not await _rate_limit("sitor_user_daily", dev, SITOR_USER_DAILY, 86400):
        msg = {"it": "Hai raggiunto il limite di messaggi per oggi. Torna domani, ci sarò!",
               "de": "Du hast das heutige Nachrichtenlimit erreicht. Komm morgen wieder, ich bin da!",
               "en": "You've reached today's message limit. Come back tomorrow, I'll be here!"}
        return {"ok": False, "limited": True, "reply": msg.get(lang2, msg["it"])}
    if not await _rate_limit("sitor_global_daily", "all", SITOR_GLOBAL_DAILY, 86400):
        msg = {"it": "Sitor ha ricevuto tantissime domande oggi. Torna domani, grazie!",
               "de": "Sitor hat heute sehr viele Fragen erhalten. Komm morgen wieder, danke!",
               "en": "Sitor got a lot of questions today. Please come back tomorrow, thanks!"}
        return {"ok": False, "limited": True, "reply": msg.get(lang2, msg["it"])}

    tools_line = ""
    if body.tools and isinstance(body.tools, dict):
        parts = [f"{k}: {v}" for k, v in body.tools.items() if v]
        if parts:
            tools_line = "ATTREZZI/FORNO DELL'UTENTE: " + "; ".join(parts)[:400]

    sysmsg = (
        "Sei Sitor, una guida amichevole di panificazione del sito 'Il Manuale di Sitor'. "
        "Parti sempre dal presupposto che chi ti scrive è un principiante che cucina a casa. "
        "Spiega il PERCHÉ, dai SEGNALI da riconoscere oltre ai minuti, e chiedi solo ciò che ti serve "
        "(che forno ha, che attrezzi, quanto tempo). Usa il profilo attrezzi se fornito; con impastatrici "
        "piccole ricorda di rispettare la capienza del produttore. "
        "PARLA SOLO di panificazione e delle ricette di questo sito. Se non sei sicuro, dillo con onestà. "
        "NIENTE consigli medici o dietetici: per le allergie rimanda a leggere le etichette. "
        "NON dare ricette con fiori o foglie di canapa né con CBD, e non spiegare come procurarsi o usare cannabis: "
        "parla solo di semi e farina di canapa alimentare. Rifiuta gentilmente qualsiasi altro argomento. "
        "Non chiedere né usare dati personali. Rispondi breve e pratico. "
        f"Rispondi in {langname}."
    )
    # storia dal browser: teniamo solo gli ultimi messaggi
    hist = [m for m in (body.messages or []) if m.role in ("user", "assistant") and (m.content or "").strip()][-10:]
    if not hist or hist[-1].role != "user":
        raise HTTPException(status_code=400, detail="no_user_message")
    convo = "\n".join(f"{'Utente' if m.role == 'user' else 'Sitor'}: {m.content[:1500]}" for m in hist[:-1])
    last = hist[-1].content[:1500]
    convo_block = ("CONVERSAZIONE PRECEDENTE:\n" + convo) if convo else ""
    prompt = f"{tools_line}\n{convo_block}\n\nDOMANDA: {last}".strip()
    try:
        reply = ""
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"sitorchat-{dev}",
                       system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=900)
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                reply += ev.content or ""
        reply = (reply or "").strip()
        if not reply:
            raise ValueError("empty")
    except Exception as e:
        logging.getLogger(__name__).warning("sitor chat fail: %s", str(e)[:120])
        fb = {"it": "Scusa, ho avuto un intoppo. Riprova tra poco.",
              "de": "Entschuldige, kleiner Fehler. Versuch es gleich nochmal.",
              "en": "Sorry, small glitch. Please try again shortly."}
        return {"ok": False, "reply": fb.get(lang2, fb["it"])}
    return {"ok": True, "reply": reply}
