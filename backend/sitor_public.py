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

from course_builder import build_course as _build_course, proc_hash as _proc_hash

# Modelli: chat/foto/corsi AI pubblici usano un modello economico (Sonnet), NON Opus.
# "Veloce" (Cosa faccio, livelli risparmio) usa Haiku. Cambiabili da variabili d'ambiente.
SITOR_PUBLIC_MODEL = _os.environ.get("SITOR_PUBLIC_MODEL", "claude-sonnet-4-6")
COURSE_GEN_DAILY_CAP = int(_os.environ.get("COURSE_GEN_DAILY_CAP", "40"))
SITOR_USER_DAILY = int(_os.environ.get("SITOR_USER_DAILY", "15"))
SITOR_GLOBAL_DAILY = int(_os.environ.get("SITOR_GLOBAL_DAILY", "500"))

_COURSE_LANGS = ("it", "de", "en")
_course_locks: dict = {}
SITOR_FAST = _os.environ.get("SITOR_FAST") or "claude-haiku-4-5-20251001"
SITOR_MAESTRO_MODEL = _os.environ.get("SITOR_MAESTRO_MODEL") or "claude-opus-4-8"  # V105: cervello grande, solo se acceso dall'admin

# V105 — IL SAPERE DEL MAESTRO: quello che un panettiere di mestiere sa a memoria. Sitor lo usa in ogni risposta.
_MAESTRO = (
    "COME RAGIONA UN MAESTRO PANETTIERE (segui sempre questo metodo): "
    "a) prima capisci: farina, acqua, lievito, temperatura, tempo, forno. Se manca un dato decisivo, chiedilo, UNA domanda sola, e intanto dai la risposta piu' probabile. "
    "b) quando c'e' un problema rispondi in quest'ordine: cosa sta succedendo, perche' (una riga), cosa fare ADESSO per salvare il pezzo, cosa cambiare la prossima volta. "
    "c) quando c'e' da pianificare: prima i numeri (grammi, percentuali, gradi, ore), poi le parole. "
    "d) parla per segnali, non solo per minuti: 'raddoppiato', 'la prova del dito torna su piano', 'la superficie del poolish si avvalla', 'suono cavo sotto', '96-98 gradi al cuore'. "
    "e) sii onesto: se una cosa dipende dal forno o dalla farina di chi scrive, dillo e dai un intervallo. Non inventare mai ricette del sito che non conosci. "
    "NUMERI DEL MESTIERE: sale 1,8-2,2% sulla farina (panettone 0,8-1,2%); lievito fresco 0,2-0,4% per lievitazioni lunghe, 0,8-1,5% per 2-4 ore, 1 g secco = 3 g fresco; "
    "biga 40-50% della farina, 45-50% di acqua, 1% di lievito sulla sua farina, 16-18 ore a 16-18 gradi; poolish 30% farina, acqua 1:1, 0,2-0,3% lievito, 12-16 ore a 20 gradi; "
    "lievito madre 20-30% sulla farina, rinfrescato 2 volte, usato al picco (raddoppio in 4-6 ore a 26-28 gradi, galleggia); "
    "temperatura impasto 24-26 gradi (ricchi 26-27): temperatura acqua = temperatura obiettivo x 3 (o x 4 con prefermento) - aria - farina (- prefermento) - attrito (mano 3, planetaria 9, spirale 13); "
    "la lievitazione raddoppia di velocita' ogni 8 gradi in piu'; in frigo a 4 gradi va al 12% di 25 gradi (12 ore di frigo valgono circa 1,5 ore); "
    "idratazione: pane 65-75, ciabatta 80-90, pizza 60-70, focaccia 75-85, cassetta 60-65, panettone 55-60 (piu' burro e tuorli); TA tedesca = 100 + idratazione; "
    "farine: italiane 00/0/1/2/integrale per raffinazione, W per forza (200-260 pane e pizza veloci, 280-330 lunghe, 350+ panettone), P/L per equilibrio; tedesche per ceneri Typ 405/550/812/1050/1600, "
    "550 = tipo 0 da pane, 405 = 00 da dolci, 1050 = tipo 2; proteine sopra 12% = forte; semola rimacinata assorbe piu' acqua e vuole piu' tempo; farro ha glutine fragile: meno acqua, meno lavorazione; "
    "segale quasi senza glutine: vuole acidita' (lievito madre o pasta acida) e cuoce in stampo; grano arso e' tostato, mai oltre il 20%. "
    "FORNO: preriscalda 45-60 minuti con pietra o teglia; vapore solo i primi 12-15 minuti; pentola con coperchio = vapore naturale; la crosta prende colore dopo i 140 gradi (Maillard) e poi caramella; "
    "pane cotto a 96-98 gradi al cuore, ricchi 92-94; raffreddare su griglia, segale 12-24 ore prima del taglio; forno di casa: conosci il tuo, gira la teglia a meta'. "
    "DIFETTI (causa piu' probabile prima): non cresce = lievito morto/acqua troppo calda/freddo; appiccicoso = troppa acqua per la farina o glutine non sviluppato (riposo e pieghe, non farina); "
    "collassa = sovralievitazione; piatto = forma poco tesa o troppa acqua; niente spinta = sovralievitato o forno freddo o niente taglio; scoppia di lato = taglio timido o sottolievitato; "
    "crudo sotto = teglia fredda o pezzo grosso (copri, scendi a 180-190, prolunga); pallido = poco calore finale o troppo vapore; gommoso = tagliato caldo o poco cotto; fitto = poca lievitazione o farina debole; "
    "sa di lievito/alcol = troppo lievito o troppo caldo; acido pungente = lievito madre affamato (rinfresca 2-3 volte); duro il giorno dopo = diretto veloce e frigo (mai il pane in frigo). "
    "TRADIZIONE DI MICHELE (Matera, Miglionico, Stoccarda): pane di Matera e di Altamura con semola rimacinata e lievito madre, pagnotte grandi da 1-2 chili che durano una settimana; "
    "focaccia barese con la patata lessa nell'impasto; strascinati, orecchiette, lagane e ceci; mollica fritta e peperone crusco; la regola di Michele: lievito madre o biga dalle 12 ore in su, lievito di birra solo se serve, poco. "
    "GERMANIA: Sauerteig di segale a tre stadi o Detmolder; Vorteig = biga/poolish; Laugengebaeck con soda caustica al 4% solo con guanti e occhiali, a casa bicarbonato bollito; Broetchen 550 con poco malto. "
    "ATTREZZI DEL SITO da consigliare per nome quando servono: Acqua giusta (temperatura acqua), Lievitazione a casa tua (tempi alla tua temperatura), Righello della ciotola (quando e' pronto), "
    "Pesa tutto in una ciotola, Pronto soccorso dell'impasto, Disegna il taglio, L'occhio di Sitor (foto crosta/mollica), Il pane in agenda, Lo stampo giusto, Metti a confronto, Il laboratorio (foglio di produzione, cella, conversioni, forno), "
    "Il sommelier del pane, Stasera ho ospiti, Il tuo primo pane in 7 giorni, Le mani in pasta, Il pane dei piccoli, La mappa di MikiLab. "
    "SICUREZZA: niente consigli medici o dietetici, per gli allergeni rimanda alle etichette; con i bambini il forno lo apre l'adulto; niente canapa oltre semi e farina alimentare. "
)
_CACHE_TTL = 86400


async def _savings_level() -> int:
    try:
        s = await db.site_settings.find_one({}, {"_id": 0, "savings_level": 1})
        return max(0, min(int((s or {}).get("savings_level") or 0), 3))
    except Exception:
        return 0


async def _feature_on(name: str, default=True) -> bool:
    try:
        s = await db.site_settings.find_one({}, {"_id": 0, name: 1})
        v = (s or {}).get(name)
        return default if v is None else bool(v)
    except Exception:
        return default


async def _bump_usage(field: str, n: int = 1):
    try:
        day = datetime.now(timezone.utc).date().isoformat()
        await db.usage_daily.update_one({"day": day}, {"$inc": {field: int(n)}, "$setOnInsert": {"day": day}}, upsert=True)
    except Exception:
        pass


def _chat_limits(level: int):
    """(user_daily, global_daily, max_tokens, model) in base al livello risparmio."""
    if level >= 3:
        return (0, 0, 0, SITOR_PUBLIC_MODEL)
    if level == 2:
        return (3, max(1, SITOR_GLOBAL_DAILY // 5), 450, SITOR_FAST)
    if level == 1:
        return (8, max(1, SITOR_GLOBAL_DAILY // 2), 450, SITOR_FAST)
    return (SITOR_USER_DAILY, SITOR_GLOBAL_DAILY, 900, SITOR_PUBLIC_MODEL)


def _norm_q(s: str) -> str:
    return _re.sub(r"[^\w\s]", "", (s or "").lower()).strip()


def _cache_key(q: str, lang: str, level: str) -> str:
    return _hashlib.sha256(f"{lang}|{level}|{_norm_q(q)}".encode()).hexdigest()[:32]


def _cacheable(q: str, has_profile: bool) -> bool:
    if has_profile or not q or len(q) > 300:
        return False
    if _re.search(r"[\w.+-]+@[\w-]+\.\w+", q):
        return False
    if _re.search(r"(?:\+?\d[\s-]?){7,}", q):
        return False
    return True




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
        "non solo i minuti. Se il procedimento cita il lievito madre (o poolish), nella versione CASA indica SEMPRE "
        "il POOLISH come alternativa per chi non ha il lievito madre, senza cambiare le dosi di farina e acqua. "
        "Niente HACCP né burocrazia. Nessun consiglio medico. "
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
                   system_message=sysmsg).with_model("anthropic", SITOR_PUBLIC_MODEL).with_params(max_tokens=4500)
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
async def course_v2(recipe_id: str, lang: str = "it", ai: int = 0, user: _Opt[dict] = Depends(optional_user)):
    """Corso passo-passo. DEFAULT: costruito dal procedimento della ricetta (nessuna IA, istantaneo, gratis,
    IT/DE/EN sempre). Solo l'admin può chiedere la versione IA con ?ai=1 (costa crediti, poi resta in cache)."""
    lang2 = _lang2(lang)
    if lang2 not in _COURSE_LANGS:
        raise HTTPException(status_code=400, detail="lang_not_supported")
    is_admin = bool(user and user.get("role") == "admin")
    if not is_admin and await _is_hidden(recipe_id):
        raise HTTPException(status_code=404, detail="recipe_not_found")
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="recipe_not_found")
    want_ai = bool(ai) and is_admin
    ph = _proc_hash(recipe, lang2)
    cached = await db.recipe_courses_v2.find_one({"recipe_id": recipe_id, "lang": lang2}, {"_id": 0})
    if cached and cached.get("course") and not want_ai:
        src = cached.get("source") or "ai"   # corsi vecchi (senza source) vengono dall'IA: già pagati, si tengono
        if src != "procedure" or cached.get("proc_hash") == ph:
            return {"ok": True, "cached": True, "course": cached["course"],
                    "verified": bool(cached.get("verified")), "recipe_name": cached.get("recipe_name", "")}
    prev = await db.recipe_courses_v2.find_one({"recipe_id": recipe_id, "verified": True}, {"_id": 0, "verified": 1})
    course, source = None, "procedure"
    if want_ai:
        if not await _rate_limit("course_gen_daily", "all", COURSE_GEN_DAILY_CAP, 86400):
            raise HTTPException(status_code=503, detail="course_daily_cap")
        lk = _course_locks.setdefault(f"{recipe_id}:{lang2}", _asyncio.Lock())
        async with lk:
            try:
                course = await _generate_course(recipe, lang2)
            except Exception as e:
                logging.getLogger(__name__).warning("course ai fail: %s", str(e)[:120])
                course = None
        if course:
            source = "ai"
            await _bump_usage("course_gens")
    if not course:
        course = _build_course(recipe, lang2)
        if course:
            try:
                course["equipment"] = _core.equipment_template(recipe)
            except Exception:
                course["equipment"] = []
    if not course:
        raise HTTPException(status_code=503, detail="course_unavailable")
    await db.recipe_courses_v2.update_one(
        {"recipe_id": recipe_id, "lang": lang2},
        {"$set": {"recipe_id": recipe_id, "lang": lang2, "recipe_name": recipe.get("name", ""),
                  "course": course, "verified": bool(prev), "source": source, "proc_hash": ph, "generated_at": now_iso()}},
        upsert=True)
    return {"ok": True, "cached": False, "course": course, "verified": bool(prev), "recipe_name": recipe.get("name", "")}


class CourseVerifyReq(_BM):
    verified: _Opt[bool] = None
    course: _Opt[dict] = None


@api_router.put("/recipes/{recipe_id}/course-v2")
async def course_v2_edit(recipe_id: str, body: CourseVerifyReq, lang: str = "it", admin: dict = Depends(require_admin)):
    lang2 = _lang2(lang)
    upd = {}
    if body.course is not None:
        upd["course"] = body.course
    if body.verified is not None and body.course is None:
        # solo flag: vale per tutte le lingue della ricetta
        await db.recipe_courses_v2.update_many({"recipe_id": recipe_id},
            {"$set": {"verified": bool(body.verified), "updated_at": now_iso()}})
        return {"ok": True, "verified": bool(body.verified)}
    if body.verified is not None:
        upd["verified"] = bool(body.verified)
    if not upd:
        raise HTTPException(status_code=400, detail="nothing_to_update")
    upd["updated_at"] = now_iso()
    await db.recipe_courses_v2.update_one({"recipe_id": recipe_id, "lang": lang2}, {"$set": upd}, upsert=True)
    if body.verified is not None:
        await db.recipe_courses_v2.update_many({"recipe_id": recipe_id, "lang": {"$ne": lang2}},
            {"$set": {"verified": bool(body.verified)}})
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
    level: _Opt[str] = None       # "casa" (principiante) | "esperto" (professionista)
    recipe_id: _Opt[str] = None   # ricetta che l'utente sta guardando (contesto per Sitor)
    farro: _Opt[bool] = None      # l'utente ha attivato la versione al farro


_SITE_KNOWLEDGE = (
    "CONOSCENZE DEL SITO (rispettale sempre): "
    "1) Le ricette 'Provate da Michele' hanno dosi FISSE: non cambiarle mai, puoi solo adattare i gesti (forno di casa, attrezzi). Le 'bozze di Sitor (IA)' sono punti di partenza da provare. "
    "2) FARRO: ogni ricetta con farina ha il pulsante 'Converti in farro'. Regola: acqua -8% (panettoni -4%), impasta meno e più piano, lievitazioni più corte del 10-15%, pieghe delicate: il glutine del farro è fragile. "
    "3) MIGLIORATORE di Michele = miscela a secco (su 100 g: malto diastatico 44, lino dorato 29, lupino dolce 15, psillio 8, acerola 4); dose 2% sulla farina per gli indiretti, 3% per i diretti. Contiene LUPINO (allergene) e malto d'orzo (glutine). "
    "Se l'utente non lo può fare, alternative: (a) solo malto diastatico 0,3-0,5% sulla farina; (b) fiocchi di patate 3-5% o patata lessa schiacciata; (c) un miglioratore/Backmalz del commercio secondo la confezione; (d) ometterlo: il pane riesce lo stesso, un po' meno morbido. La pagina 'Il mio miglioratore' spiega tutto con i grammi. "
    "4) Senza lievito madre: poolish (farina e acqua 1:1, 0,3% di lievito fresco sulla sua farina, 12-16 ore a 18-20 °C) al posto del lievito madre, oppure lievito di birra 0,8-1% con 4-6 ore. Su ogni ricetta c'è il pannello 'Non ho questo ingrediente'. "
    "5) Logica di Michele: lievito madre o biga dalle 12 ore in su; lievito di birra 4-6 ore; evita il lievito di birra se puoi; focaccia con patata lessa schiacciata e un filo d'olio a chiudere l'impasto, in teglia; croissant a impasto diretto. "
    "6) Se non conosci una ricetta del sito, NON inventarla: dì che non la trovi. Nessun consiglio medico. "
    "FORMATO: solo testo semplice, niente markdown (niente asterischi, niente #), frasi corte, di norma 6-8 righe e al massimo 12 quando servono i numeri; spiega sempre il perché."
)

_catalog_cache: dict = {"t": 0.0, "txt": ""}


async def _catalog_names_txt() -> str:
    """Elenco compatto dei nomi ricetta visibili (cache 1 ora): evita che Sitor inventi ricette del sito."""
    import time as _t
    if _catalog_cache["txt"] and _t.time() - _catalog_cache["t"] < 3600:
        return _catalog_cache["txt"]
    try:
        hidden = {e["recipe_id"] async for e in db.recipe_extras.find({"hidden_public": True}, {"_id": 0, "recipe_id": 1})}
        names = []
        async for r in db.recipes.find({"collection_name": "mikilab", "hidden": {"$ne": True}}, {"_id": 0, "id": 1, "name": 1}):
            if r.get("id") not in hidden and r.get("name"):
                names.append(r["name"][:48])
        txt = "RICETTE DEL SITO (solo nomi): " + "; ".join(sorted(names))[:5500]
    except Exception:
        txt = ""
    _catalog_cache.update({"t": _t.time(), "txt": txt})
    return txt


async def _recipe_context(recipe_id, lang2: str, farro) -> str:
    if not recipe_id:
        return ""
    try:
        if await _is_hidden(recipe_id):
            return ""
        r = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
        if not r:
            return ""
        def loc(field):
            if lang2 in ("de", "en") and (r.get(f"{field}_{lang2}") or "").strip():
                return r.get(f"{field}_{lang2}")
            return r.get(field) or ""
        ex = await db.recipe_extras.find_one({"recipe_id": recipe_id}, {"_id": 0, "status": 1, "verified": 1}) or {}
        status = "PROVATA da Michele" if ex.get("status") == "tested" else ("controllata da Michele" if ex.get("verified") else "bozza di Sitor (IA), da provare")
        dose = f"farina {r.get('flour_grams')} g, acqua {r.get('water_grams')} g, sale {r.get('salt_grams')} g, prefermento {r.get('sourdough_grams') or 0} g"
        extras = ", ".join(f"{e.get('name')} {e.get('percent')}%" for e in (r.get("extra_ingredients") or []) if isinstance(e, dict) and e.get("percent") is not None)[:600]
        # V105: i numeri del panettiere, calcolati qui, cosi' Sitor ragiona sulla ricetta vera
        try:
            fg = float(r.get("flour_grams") or 0); wg = float(r.get("water_grams") or 0); sg = float(r.get("salt_grams") or 0); pg = float(r.get("sourdough_grams") or 0)
            hyd = (wg / fg * 100) if fg > 0 else 0; salt_pct = (sg / fg * 100) if fg > 0 else 0; pre_pct = (pg / fg * 100) if fg > 0 else 0
            biga = r.get("biga") if isinstance(r.get("biga"), dict) else None
            biga_txt = (f" Prefermento {biga.get('kind') or r.get('preferment_type') or 'biga'}: farina {biga.get('flour_g')} g, acqua {biga.get('water_g')} g, lievito {biga.get('yeast_g')} g, {biga.get('hours')} ore." if biga and (biga.get("flour_g") or biga.get("show")) else "")
            times = f" Tempi a 25 gradi: massa {r.get('bulk_fermentation_hours') or '?'} h, forma {r.get('proofing_hours') or '?'} h."
            nums = f" NUMERI DEL PANETTIERE: idratazione {hyd:.0f}% (TA {100 + hyd:.0f}), sale {salt_pct:.1f}% sulla farina, prefermento/lievito madre {pre_pct:.0f}% sulla farina.{biga_txt}{times} Forno: {r.get('oven_type') or '-'}."
        except Exception:
            nums = ""
        notes = (loc("notes") or "")[:400]
        return (f"RICETTA CHE L'UTENTE STA GUARDANDO ({status}): {loc('name')}. Farina: {loc('flour_type')}. Dosi (base): {dose}. "
                f"Altri ingredienti (% sulla farina): {extras}. Cottura {r.get('bake_temp')} °C per {r.get('bake_minutes')} min.{nums} "
                f"{'Versione AL FARRO attiva. ' if farro else ''}{('NOTE DI MICHELE: ' + notes + ' ') if notes else ''}PROCEDIMENTO: {loc('procedure')[:1800]}")
    except Exception:
        return ""



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
    slevel = await _savings_level()
    user_daily, global_daily, max_tok, model = _chat_limits(slevel)
    if slevel == 0 and await _feature_on("FEATURE_SITOR_MAESTRO", False):  # V105: cervello grande a scelta dell'admin
        model = SITOR_MAESTRO_MODEL; max_tok = max(max_tok, 1100)
    level = (body.level or "casa").strip().lower()
    # Livello 3: Sitor riposa, nessuna chiamata IA pubblica.
    if slevel >= 3:
        msg = {"it": "Sitor sta riposando: usa i pulsanti «Come va?» e i corsi già scritti.",
               "de": "Sitor macht Pause: nutze die «Wie läuft's?»-Knöpfe und die fertigen Kurse.",
               "en": "Sitor is resting: use the «How's it going?» buttons and the ready courses."}
        return {"ok": False, "resting": True, "reply": msg.get(lang2, msg["it"])}
    # limiti: per-persona e globale (in questo ordine, senza consumare il globale se l'utente è già oltre)
    if not await _rate_limit("sitor_user_daily", dev, user_daily, 86400):
        msg = {"it": "Hai raggiunto il limite di messaggi per oggi. Torna domani, ci sarò!",
               "de": "Du hast das heutige Nachrichtenlimit erreicht. Komm morgen wieder, ich bin da!",
               "en": "You've reached today's message limit. Come back tomorrow, I'll be here!"}
        return {"ok": False, "limited": True, "reply": msg.get(lang2, msg["it"])}
    if not await _rate_limit("sitor_global_daily", "all", global_daily, 86400):
        msg = {"it": "Sitor ha ricevuto tantissime domande oggi. Torna domani, grazie!",
               "de": "Sitor hat heute sehr viele Fragen erhalten. Komm morgen wieder, danke!",
               "en": "Sitor got a lot of questions today. Please come back tomorrow, thanks!"}
        return {"ok": False, "limited": True, "reply": msg.get(lang2, msg["it"])}

    tools_line = ""
    has_profile = bool(body.tools and isinstance(body.tools, dict) and any(v for v in body.tools.values()))
    if has_profile:
        parts = [f"{k}: {v}" for k, v in body.tools.items() if v]
        if parts:
            tools_line = "ATTREZZI/FORNO DELL'UTENTE: " + "; ".join(parts)[:400]

    level = (body.level or "casa").strip().lower()
    # V105 prompt — Sitor maestro
    if level == "esperto":
        sysmsg = (
            "Sei Sitor, il maestro panettiere del sito 'Il Manuale di Sitor' (mikilab.de), la guida IA di Michele Signorella, panettiere a Stoccarda nato a Matera. "
            "Chi ti scrive e' un PANETTIERE DI MESTIERE: rispondi da maestro a collega, conciso e tecnico, niente basi ovvie ne' frasi di incoraggiamento. "
            "Percentuali del panettiere, intervalli e tolleranze, temperature di impasto e di forno, tempi e temperature di cella: sempre con i numeri. "
            "Se e' aperta una ricetta del sito, ragiona sui SUOI numeri (li trovi qui sotto) e non cambiarne le dosi: adatta metodo, tempi, temperature, attrezzi. "
            "Usa il profilo attrezzi/forno se fornito. PARLA SOLO di panificazione, pasta fresca e lievitati, e delle ricette di questo sito. Se non sei sicuro, dillo e dai un intervallo. "
            "NIENTE consigli medici o dietetici: per le allergie rimanda alle etichette. Niente canapa oltre semi e farina alimentare. Rifiuta gentilmente altri argomenti. "
            "Non chiedere ne' usare dati personali. Ricorda che sei un'IA se te lo chiedono. "
            f"Rispondi in {langname}."
        )
    else:
        sysmsg = (
            "Sei Sitor, il maestro panettiere del sito 'Il Manuale di Sitor' (mikilab.de), la guida IA di Michele Signorella, panettiere a Stoccarda nato a Matera. "
            "Chi ti scrive di solito impasta a casa: parla come un maestro paziente in bottega, caldo e concreto, che normalizza l'errore e spiega sempre il PERCHE'. "
            "Dai numeri veri (grammi, gradi, ore) e i SEGNALI da riconoscere con gli occhi e le mani, non solo i minuti. Chiedi solo cio' che ti serve davvero (una domanda alla volta). "
            "Se e' aperta una ricetta del sito, ragiona sui SUOI numeri (li trovi qui sotto) e non cambiarne le dosi: adatta gesti, tempi, forno di casa, attrezzi. "
            "Con impastatrici piccole ricorda la capienza del produttore. Quando serve, manda all'attrezzo giusto del sito chiamandolo per nome. "
            "PARLA SOLO di panificazione, pasta fresca e lievitati, e delle ricette di questo sito. Se non sei sicuro, dillo con onesta'. "
            "NIENTE consigli medici o dietetici: per le allergie rimanda a leggere le etichette. Niente canapa oltre semi e farina alimentare, e non spiegare come procurarsi o usare cannabis. "
            "Rifiuta gentilmente qualsiasi altro argomento. Non chiedere ne' usare dati personali. Ricorda che sei un'IA se te lo chiedono. "
            f"Rispondi in {langname}."
        )
    sysmsg = sysmsg + " " + _MAESTRO
    sysmsg = sysmsg + " " + _SITE_KNOWLEDGE
    cat_txt = await _catalog_names_txt()
    if cat_txt:
        sysmsg += " " + cat_txt
    rec_ctx = await _recipe_context(body.recipe_id, lang2, body.farro)
    if rec_ctx:
        sysmsg += " " + rec_ctx
    # storia dal browser: teniamo solo gli ultimi messaggi
    hist = [m for m in (body.messages or []) if m.role in ("user", "assistant") and (m.content or "").strip()][-10:]
    if not hist or hist[-1].role != "user":
        raise HTTPException(status_code=400, detail="no_user_message")
    convo = "\n".join(f"{'Utente' if m.role == 'user' else 'Sitor'}: {m.content[:1500]}" for m in hist[:-1])
    last = hist[-1].content[:1500]
    convo_block = ("CONVERSAZIONE PRECEDENTE:\n" + convo) if convo else ""
    prompt = f"{tools_line}\n{convo_block}\n\nDOMANDA: {last}".strip()
    # F3: cache 24h per domande identiche (stessa lingua+livello) senza profilo personale né conversazione.
    use_cache = _cacheable(last, has_profile or bool(body.recipe_id)) and not convo
    ck = _cache_key(last, lang2, level) if use_cache else None
    if ck:
        hit = await db.chat_cache.find_one({"key": ck, "exp": {"$gt": now_iso()}}, {"_id": 0, "reply": 1})
        if hit and hit.get("reply"):
            await _bump_usage("chat_cache_hits")
            return {"ok": True, "reply": hit["reply"], "cached": True}
    try:
        reply = ""
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"sitorchat-{dev}",
                       system_message=sysmsg).with_model("anthropic", model).with_params(max_tokens=max_tok)
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
    await _bump_usage("chat_calls")
    if ck:
        exp = (datetime.now(timezone.utc) + timedelta(seconds=_CACHE_TTL)).isoformat()
        await db.chat_cache.update_one({"key": ck}, {"$set": {"key": ck, "reply": reply, "exp": exp}}, upsert=True)
    return {"ok": True, "reply": reply}


# ---------------------------------------------------------------------------
# STADIO H — "Com'è venuto?" · analisi foto della mollica (POST /api/sitor/photo)
# Interruttore FEATURE_PHOTO_DIAG (default SPENTO). Foto MAI salvata su disco/DB.
# ---------------------------------------------------------------------------
class PhotoReq(_BM):
    image_base64: str = ""
    lang: str = "it"
    level: _Opt[str] = None


@api_router.post("/sitor/photo")
async def sitor_photo(body: PhotoReq, request: Request):
    lang2 = _lang2(body.lang)
    langname = _CHAT_SYS.get(lang2, "italiano")
    if not await _feature_on("FEATURE_PHOTO_DIAG", True):
        raise HTTPException(status_code=404, detail="not_found")
    slevel = await _savings_level()
    if slevel >= 3:
        msg = {"it": "Sitor sta riposando: riprova più tardi.",
               "de": "Sitor macht Pause: versuch es später.",
               "en": "Sitor is resting: try again later."}
        return {"ok": False, "resting": True, "reply": msg.get(lang2, msg["it"])}
    dev = _device_id(request)
    if not await _rate_limit("sitor_photo_daily", dev, 3, 86400):
        msg = {"it": "Hai già analizzato 3 foto oggi. Torna domani!",
               "de": "Du hast heute schon 3 Fotos analysiert. Bis morgen!",
               "en": "You've analysed 3 photos today. Come back tomorrow!"}
        return {"ok": False, "limited": True, "reply": msg.get(lang2, msg["it"])}
    b64 = (body.image_base64 or "").strip()
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[-1]
    if not b64 or len(b64) < 100:
        raise HTTPException(status_code=400, detail="no_image")
    if len(b64) > 8_000_000:
        raise HTTPException(status_code=413, detail="image_too_large")
    level = (body.level or "casa").strip().lower()
    tono = ("tono tecnico e conciso da panettiere di mestiere" if level == "esperto"
            else "tono caloroso e incoraggiante per un principiante, normalizza l'errore")
    sysmsg = (
        "Sei Sitor, guida di panificazione. Ti mostro la FOTO di un pane o di un impasto. "
        "Valuta mollica (alveolatura), crosta (colore, spessore) e forma secondo l'occhio di un buon panettiere. "
        f"Usa un {tono}. Se la foto NON mostra pane, impasto o un lievitato, rispondi con is_bread=false e lascia gli altri campi vuoti. "
        "Nessun consiglio medico o dietetico. Non descrivere persone. "
        f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
        "{\"is_bread\":true,\"observations\":[\"oss.1\",\"oss.2\",\"oss.3\"],\"correction\":\"UNA sola correzione per la prossima prova\"}. "
        "Esattamente 3 observations brevi e 1 correction."
    )
    try:
        out = ""
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"photo-{dev}", system_message=sysmsg).with_model("anthropic", SITOR_PUBLIC_MODEL).with_params(max_tokens=700)
        async for ev in chat.stream_message(UserMessage(text="Analizza questa foto.", file_contents=[ImageContent(image_base64=b64)])):
            if isinstance(ev, TextDelta):
                out += ev.content or ""
        parsed = _core._parse_llm_json(out) if hasattr(_core, "_parse_llm_json") else {}
        if not parsed:
            m = _re.search(r"\{.*\}", out, _re.S)
            parsed = _json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.getLogger(__name__).warning("photo diag fail: %s", str(e)[:120])
        fb = {"it": "Scusa, non riesco ad analizzare la foto ora. Riprova tra poco.",
              "de": "Entschuldige, ich kann das Foto gerade nicht analysieren. Versuch es gleich nochmal.",
              "en": "Sorry, I can't analyse the photo right now. Try again shortly."}
        return {"ok": False, "reply": fb.get(lang2, fb["it"])}
    del b64  # la foto NON viene salvata: scartata subito
    await _bump_usage("vision_calls")
    if not parsed.get("is_bread", False):
        no = {"it": "Questa foto non sembra mostrare pane o impasto. Inviami una foto del tuo prodotto da forno!",
              "de": "Dieses Foto zeigt anscheinend kein Brot oder keinen Teig. Schick mir ein Foto deines Backwerks!",
              "en": "This photo doesn't seem to show bread or dough. Send me a photo of your bake!"}
        return {"ok": True, "is_bread": False, "reply": no.get(lang2, no["it"])}
    obs = [str(o)[:220] for o in (parsed.get("observations") or [])][:3]
    corr = str(parsed.get("correction") or "")[:300]
    return {"ok": True, "is_bread": True, "observations": obs, "correction": corr}


# ---------------------------------------------------------------------------
# STADIO J2 (strumento admin) — "Bozza da Sitor": genera una ricetta nello stesso
# schema, salvata come NUOVA ricetta NASCOSTA (hidden_public=true, status sitor_draft).
# ---------------------------------------------------------------------------
class DraftRecipeReq(_BM):
    name: str
    lang: str = "it"
    hint: _Opt[str] = None


@api_router.post("/sitor/draft-recipe")
async def sitor_draft_recipe(body: DraftRecipeReq, admin: dict = Depends(require_admin)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="llm_unavailable")
    nm = (body.name or "").strip()[:120]
    if not nm:
        raise HTTPException(status_code=400, detail="no_name")
    if not await _rate_limit("draft_recipe_daily", "all", COURSE_GEN_DAILY_CAP, 86400):
        raise HTTPException(status_code=503, detail="draft_daily_cap")
    sysmsg = (
        "Sei Sitor, panettiere esperto. Scrivi una BOZZA di ricetta per il nome dato, nello schema JSON richiesto. "
        "REGOLE: NON copiare testi o quantità da siti o libri. Ricava le proporzioni da principi generali e intervalli "
        "tipici del mestiere. Nelle note segnala SEMPRE che è 'un punto di partenza da provare', mai un dato verificato. "
        "Usa le percentuali del panettiere (sulla farina). Restituisci SOLO JSON valido: "
        "{\"name\":\"..\",\"name_de\":\"..\",\"name_en\":\"..\",\"menu_category\":\"pane|panini|basi|panettoni\","
        "\"dough_category\":\"..\",\"flour_type\":\"..\",\"hydration_percent\":0,\"flour_grams\":0,\"water_grams\":0,"
        "\"salt_grams\":0,\"sourdough_grams\":0,\"preferment_type\":\"diretto|poolish|biga|lievito madre\","
        "\"bulk_fermentation_hours\":0,\"proofing_hours\":0,\"mix_minutes\":0,\"bake_temp\":0,\"bake_minutes\":0,"
        "\"extra_ingredients\":[{\"name\":\"..\",\"grams\":0}],\"procedure\":\"..\",\"procedure_de\":\"..\",\"procedure_en\":\"..\","
        "\"notes\":\"..\",\"notes_de\":\"..\",\"notes_en\":\"..\"}. Numeri interi o decimali, 0 se non applicabile."
    )
    hint = f" Contesto: {body.hint[:200]}." if body.hint else ""
    out = ""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"draft-{nm[:16]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=2500)
        async for ev in chat.stream_message(UserMessage(text=f"Scrivi la bozza di ricetta per: '{nm}'.{hint}")):
            if isinstance(ev, TextDelta):
                out += ev.content or ""
        parsed = _core._parse_llm_json(out) if hasattr(_core, "_parse_llm_json") else {}
        if not parsed:
            m = _re.search(r"\{.*\}", out, _re.S)
            parsed = _json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.getLogger(__name__).warning("draft recipe fail: %s", str(e)[:120])
        raise HTTPException(status_code=503, detail="draft_unavailable")
    if not parsed or not parsed.get("name"):
        raise HTTPException(status_code=503, detail="draft_unavailable")

    def _f(v):
        try:
            return float(v) if v not in (None, "") else None
        except Exception:
            return None
    rid = uuid.uuid4().hex
    doc = {
        "id": rid, "collection_name": "mikilab", "organization_id": ORG_DEFAULT,
        "name": str(parsed.get("name") or nm)[:120],
        "name_de": (parsed.get("name_de") or None), "name_en": (parsed.get("name_en") or None),
        "menu_category": (parsed.get("menu_category") or "pane"),
        "dough_category": (parsed.get("dough_category") or None),
        "flour_type": (parsed.get("flour_type") or ""),
        "hydration_percent": _f(parsed.get("hydration_percent")),
        "flour_grams": _f(parsed.get("flour_grams")), "water_grams": _f(parsed.get("water_grams")),
        "salt_grams": _f(parsed.get("salt_grams")), "sourdough_grams": _f(parsed.get("sourdough_grams")),
        "preferment_type": (parsed.get("preferment_type") or None),
        "bulk_fermentation_hours": _f(parsed.get("bulk_fermentation_hours")),
        "proofing_hours": _f(parsed.get("proofing_hours")), "mix_minutes": _f(parsed.get("mix_minutes")),
        "bake_temp": _f(parsed.get("bake_temp")), "bake_minutes": _f(parsed.get("bake_minutes")),
        "extra_ingredients": [{"name": str(x.get("name") or "")[:80], "grams": _f(x.get("grams"))} for x in (parsed.get("extra_ingredients") or []) if isinstance(x, dict)][:20],
        "procedure": str(parsed.get("procedure") or "")[:6000],
        "procedure_de": (parsed.get("procedure_de") or None), "procedure_en": (parsed.get("procedure_en") or None),
        "notes": str(parsed.get("notes") or "")[:3000],
        "notes_de": (parsed.get("notes_de") or None), "notes_en": (parsed.get("notes_en") or None),
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.recipes.insert_one(dict(doc))
    await db.recipe_extras.update_one({"recipe_id": rid},
        {"$set": {"recipe_id": rid, "hidden_public": True, "status": "sitor_draft",
                  "verified": False, "updated_at": now_iso()}}, upsert=True)
    await _bump_usage("draft_recipes")
    return {"ok": True, "recipe_id": rid, "name": doc["name"], "hidden_public": True, "status": "sitor_draft"}

TECHNIQUES = [
    {"slug": "baguette", "it": "Baguette (formatura)", "de": "Baguette (Formen)", "en": "Baguette (shaping)"},
    {"slug": "croissant", "it": "Croissant e cornetti", "de": "Croissants und Hörnchen", "en": "Croissants"},
    {"slug": "pieghe", "it": "Pieghe dell'impasto", "de": "Teig falten", "en": "Dough folds"},
    {"slug": "pirlatura", "it": "Pirlatura", "de": "Rundwirken (Pirlatura)", "en": "Shaping into a ball"},
    {"slug": "filone", "it": "Filone e pagnotta (tagli)", "de": "Laib und Brotlaib (Einschneiden)", "en": "Bâtard and loaf (scoring)"},
    {"slug": "panettone", "it": "Panettone (capovolgere con i ferri)", "de": "Panettone (mit Spießen stürzen)", "en": "Panettone (flipping with skewers)"},
]
_TQ_BY_SLUG = {t["slug"]: t for t in TECHNIQUES}
_tq_locks: dict = {}


async def _gen_technique(slug: str, lang2: str) -> _Opt[dict]:
    if not EMERGENT_LLM_KEY:
        return None
    t = _TQ_BY_SLUG[slug]
    langname = _SYS.get(lang2, "italiano")
    extra = ""
    if slug == "croissant":
        extra = ("NON inventare e NON scrivere misure dei triangoli (base, altezza) né lo spessore della sfoglia: "
                 "quei numeri li fornisce Michele. Se servirebbe una misura, scrivi che 'Le misure le aggiunge Michele'. "
                 "Descrivi solo i gesti: laminazione, stesura, taglio dei triangoli, incisione della base, arrotolamento.")
    if slug == "panettone":
        extra = "Concentrati sul capovolgimento a testa in giù con i ferri/spiedi infilati alla base, e sul raffreddamento appeso."
    sysmsg = (
        f"Sei Sitor, guida di panificazione. Scrivi una pagina-guida sulla tecnica: '{t['it']}'. "
        "Per chi cucina a casa: chiaro, pratico, senza gerghi inutili. NON inventare misure o pesi che non conosci. "
        f"{extra} Rispondi in {langname}. Restituisci SOLO JSON valido: "
        "{\"intro\":\"1-2 frasi\",\"steps\":[\"passo 1\",\"passo 2\", \"...\"],\"errors\":[\"errore comune 1\",\"errore comune 2\"]}. "
        "Da 4 a 8 passi numerabili, da 2 a 5 errori comuni. Nessun testo fuori dal JSON."
    )
    out = ""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"tq-{slug}-{lang2}", system_message=sysmsg).with_model("anthropic", SITOR_PUBLIC_MODEL).with_params(max_tokens=2500)
    async for ev in chat.stream_message(UserMessage(text=f"Scrivi la guida per la tecnica '{t['it']}'.")):
        if isinstance(ev, TextDelta):
            out += ev.content or ""
    parsed = _core._parse_llm_json(out) if hasattr(_core, "_parse_llm_json") else {}
    if not parsed:
        m = _re.search(r"\{.*\}", out, _re.S)
        parsed = _json.loads(m.group(0)) if m else {}
    if not parsed.get("steps"):
        return None
    return {
        "intro": (parsed.get("intro") or "")[:600],
        "steps": [str(s)[:500] for s in (parsed.get("steps") or [])][:8],
        "errors": [str(s)[:400] for s in (parsed.get("errors") or [])][:5],
    }


@api_router.get("/techniques")
async def techniques_list(user: _Opt[dict] = Depends(optional_user)):
    stored = {}
    async for d in db.technique_pages.find({}, {"_id": 0, "slug": 1, "verified": 1, "hidden_images": 1}):
        s = d["slug"]
        cur = stored.get(s) or {"verified": False, "hidden_images": []}
        cur["verified"] = cur["verified"] or bool(d.get("verified"))
        cur["hidden_images"] = d.get("hidden_images") or cur["hidden_images"]
        stored[s] = cur
    return {"techniques": [{"slug": t["slug"], "it": t["it"], "de": t["de"], "en": t["en"],
                            "verified": bool(stored.get(t["slug"], {}).get("verified"))} for t in TECHNIQUES]}


@api_router.get("/techniques/{slug}")
async def technique_get(slug: str, lang: str = "it", user: _Opt[dict] = Depends(optional_user)):
    if slug not in _TQ_BY_SLUG:
        raise HTTPException(status_code=404, detail="technique_not_found")
    lang2 = _lang2(lang)
    if lang2 not in _COURSE_LANGS:
        lang2 = "it"
    doc = await db.technique_pages.find_one({"slug": slug, "lang": lang2}, {"_id": 0})
    meta = await db.technique_pages.find_one({"slug": slug, "verified": True}, {"_id": 0, "verified": 1, "hidden_images": 1}) \
        or await db.technique_pages.find_one({"slug": slug}, {"_id": 0, "verified": 1, "hidden_images": 1}) or {}
    t = _TQ_BY_SLUG[slug]
    if doc and doc.get("body"):
        return {"ok": True, "slug": slug, "title": t[lang2], "body": doc["body"],
                "verified": bool(meta.get("verified")), "hidden_images": meta.get("hidden_images") or []}
    is_admin = bool(user and user.get("role") == "admin")
    if not is_admin and await _savings_level() >= 2:
        raise HTTPException(status_code=503, detail="savings_no_new_technique")
    if not await _rate_limit("technique_gen_daily", "all", COURSE_GEN_DAILY_CAP, 86400):
        raise HTTPException(status_code=503, detail="technique_daily_cap")
    lk = _tq_locks.setdefault(f"{slug}:{lang2}", _asyncio.Lock())
    async with lk:
        doc = await db.technique_pages.find_one({"slug": slug, "lang": lang2}, {"_id": 0})
        if doc and doc.get("body"):
            return {"ok": True, "slug": slug, "title": t[lang2], "body": doc["body"],
                    "verified": bool(meta.get("verified")), "hidden_images": meta.get("hidden_images") or []}
        body = await _gen_technique(slug, lang2)
        if not body:
            raise HTTPException(status_code=503, detail="technique_unavailable")
        await _bump_usage("technique_gens")
        await db.technique_pages.update_one({"slug": slug, "lang": lang2},
            {"$set": {"slug": slug, "lang": lang2, "body": body, "verified": bool(meta.get("verified")), "generated_at": now_iso()}}, upsert=True)
        return {"ok": True, "slug": slug, "title": t[lang2], "body": body,
                "verified": bool(meta.get("verified")), "hidden_images": meta.get("hidden_images") or []}


class TechniqueEdit(_BM):
    verified: _Opt[bool] = None
    body: _Opt[dict] = None
    hidden_images: _Opt[_List[int]] = None
    lang: str = "it"


@api_router.put("/techniques/{slug}")
async def technique_edit(slug: str, body: TechniqueEdit, admin: dict = Depends(require_admin)):
    if slug not in _TQ_BY_SLUG:
        raise HTTPException(status_code=404, detail="technique_not_found")
    lang2 = _lang2(body.lang)
    upd = {"slug": slug, "lang": lang2, "updated_at": now_iso()}
    if body.body is not None:
        upd["body"] = body.body
    if body.verified is not None:
        upd["verified"] = bool(body.verified)
    if body.hidden_images is not None:
        upd["hidden_images"] = [int(i) for i in body.hidden_images]
    await db.technique_pages.update_one({"slug": slug, "lang": lang2}, {"$set": upd}, upsert=True)
    # verified/hidden_images sono per-tecnica: applicali a tutte le lingue
    if body.verified is not None or body.hidden_images is not None:
        meta = {k: upd[k] for k in ("verified", "hidden_images") if k in upd}
        await db.technique_pages.update_many({"slug": slug}, {"$set": meta})
    doc = await db.technique_pages.find_one({"slug": slug}, {"_id": 0, "verified": 1})
    return {"ok": True, "verified": bool((doc or {}).get("verified"))}


class LiveSessionReq(_BM):
    title: str
    recipe_id: _Opt[str] = None
    scale: _Opt[str] = None
    start_utc: str
    duration_min: int = 180
    notes: _Opt[str] = None


@api_router.get("/live-sessions")
async def live_sessions_list(admin: dict = Depends(require_admin)):
    docs = await db.live_sessions.find({}, {"_id": 0}).sort("start_utc", -1).to_list(100)
    return {"sessions": docs}


@api_router.post("/live-sessions")
async def live_sessions_create(body: LiveSessionReq, admin: dict = Depends(require_admin)):
    doc = {"id": uuid.uuid4().hex, "title": body.title[:120], "recipe_id": body.recipe_id,
           "scale": body.scale, "start_utc": body.start_utc, "duration_min": int(body.duration_min or 180),
           "notes": (body.notes or "")[:500], "created_at": now_iso()}
    await db.live_sessions.insert_one(dict(doc))
    return {"ok": True, "session": doc}


@api_router.delete("/live-sessions/{sid}")
async def live_sessions_delete(sid: str, admin: dict = Depends(require_admin)):
    await db.live_sessions.delete_one({"id": sid})
    return {"ok": True}



# ===========================================================================
# STADIO F — COSTI (admin): usage 30 giorni, livello risparmio, feature flags
# ===========================================================================
@api_router.get("/admin/costs")
async def admin_costs(admin: dict = Depends(require_admin)):
    days = [(datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat() for i in range(30)]
    rows = {d["day"]: d async for d in db.usage_daily.find({"day": {"$in": days}}, {"_id": 0})}
    s = await db.site_settings.find_one({}, {"_id": 0}) or {}
    fields = ["chat_calls", "course_gens", "technique_gens", "plan_calls", "vision_calls", "live_pings", "done_pings", "chat_cache_hits"]
    table = [{"day": d, **{f: int((rows.get(d) or {}).get(f, 0)) for f in fields}} for d in days]
    over80 = {}
    today = table[0]
    lim = {"chat_calls": SITOR_GLOBAL_DAILY, "course_gens": COURSE_GEN_DAILY_CAP, "technique_gens": COURSE_GEN_DAILY_CAP}
    for k, v in lim.items():
        if v and today.get(k, 0) >= 0.8 * v:
            over80[k] = {"used": today.get(k, 0), "limit": v}
    return {"table": table, "savings_level": int(s.get("savings_level") or 0),
            "features": {"FEATURE_PHOTO_DIAG": bool(s.get("FEATURE_PHOTO_DIAG", True)),
                         "FEATURE_PLAN": bool(s.get("FEATURE_PLAN", True)),
                         "FEATURE_LIVE": bool(s.get("FEATURE_LIVE", True)),
                         "FEATURE_VOICE_CHAT": bool(s.get("FEATURE_VOICE_CHAT", True)),
                         "FEATURE_VOICE_SERVER": bool(s.get("FEATURE_VOICE_SERVER", False)),
                         "FEATURE_SITOR_MAESTRO": bool(s.get("FEATURE_SITOR_MAESTRO", False))},  # V93 V105
            "limits": {"SITOR_USER_DAILY": SITOR_USER_DAILY, "SITOR_GLOBAL_DAILY": SITOR_GLOBAL_DAILY, "COURSE_GEN_DAILY_CAP": COURSE_GEN_DAILY_CAP},
            "alerts_over_80pct": over80}


class SavingsReq(_BM):
    savings_level: _Opt[int] = None
    FEATURE_PHOTO_DIAG: _Opt[bool] = None
    FEATURE_PLAN: _Opt[bool] = None
    FEATURE_LIVE: _Opt[bool] = None
    FEATURE_VOICE_CHAT: _Opt[bool] = None
    FEATURE_VOICE_SERVER: _Opt[bool] = None  # V93: voce del server (a pagamento), spenta di default
    FEATURE_SITOR_MAESTRO: _Opt[bool] = None  # V105: modello grande per la chat (piu' caro), spento di default


@api_router.put("/admin/costs")
async def admin_costs_set(body: SavingsReq, admin: dict = Depends(require_admin)):
    upd = {}
    if body.savings_level is not None:
        upd["savings_level"] = max(0, min(int(body.savings_level), 3))
    for f in ("FEATURE_PHOTO_DIAG", "FEATURE_PLAN", "FEATURE_LIVE", "FEATURE_VOICE_CHAT", "FEATURE_VOICE_SERVER", "FEATURE_SITOR_MAESTRO"):  # V93 V105
        v = getattr(body, f)
        if v is not None:
            upd[f] = bool(v)
    if upd:
        await db.site_settings.update_one({}, {"$set": upd}, upsert=True)
    return {"ok": True, **upd}


@api_router.get("/features")
async def public_features():
    """Interruttori pubblici (per nascondere i pulsanti lato client)."""
    s = await db.site_settings.find_one({}, {"_id": 0}) or {}
    return {"FEATURE_PHOTO_DIAG": bool(s.get("FEATURE_PHOTO_DIAG", True)),
            "FEATURE_PLAN": bool(s.get("FEATURE_PLAN", True)),
            "FEATURE_LIVE": bool(s.get("FEATURE_LIVE", True)),
            "FEATURE_VOICE_CHAT": bool(s.get("FEATURE_VOICE_CHAT", True)),
            "FEATURE_VOICE_SERVER": bool(s.get("FEATURE_VOICE_SERVER", False)),  # V93
            "FEATURE_SITOR_MAESTRO": bool(s.get("FEATURE_SITOR_MAESTRO", False)),  # V105
            "savings_level": int(s.get("savings_level") or 0)}


# ===========================================================================
# STADIO G2 — "Cosa faccio con quello che ho?" · POST /api/sitor/plan
# ===========================================================================
class PlanReq(_BM):
    prompt: str = ""
    lang: str = "it"


@api_router.post("/sitor/plan")
async def sitor_plan(body: PlanReq, request: Request):
    lang2 = _lang2(body.lang)
    if not await _feature_on("FEATURE_PLAN", True):
        raise HTTPException(status_code=404, detail="not_found")
    slevel = await _savings_level()
    if slevel >= 3:
        return {"ok": False, "resting": True, "recipes": []}
    dev = _device_id(request)
    cap = 2 if slevel >= 1 else 3
    if not await _rate_limit("sitor_plan_daily", dev, cap, 86400):
        msg = {"it": "Hai già usato «Cosa faccio» per oggi. Torna domani!",
               "de": "Du hast «Was mache ich» heute schon genutzt. Bis morgen!",
               "en": "You've used «What can I make» for today. See you tomorrow!"}
        return {"ok": False, "limited": True, "reply": msg.get(lang2, msg["it"]), "recipes": []}
    q = (body.prompt or "").strip()[:300]
    if not q:
        raise HTTPException(status_code=400, detail="empty_prompt")
    # elenco compatto delle ricette VISIBILI (id, nome, categoria, difficoltà, tempo, richiede LM)
    vis = await db.recipes.find({"collection_name": "mikilab", "organization_id": ORG_DEFAULT}, {"_id": 0}).to_list(3000)
    hidden = {e["recipe_id"] async for e in db.recipe_extras.find({"hidden_public": True}, {"_id": 0, "recipe_id": 1})}
    ex_map = {e["recipe_id"]: e async for e in db.recipe_extras.find({}, {"_id": 0, "recipe_id": 1, "difficulty": 1})}
    catalog = []
    for r in vis:
        rid = r.get("id")
        if rid in hidden:
            continue
        hrs = (float(r.get("bulk_fermentation_hours") or 0) + float(r.get("proofing_hours") or 0))
        catalog.append({"id": rid, "n": (r.get("name") or "")[:60], "cat": r.get("menu_category") or "",
                        "d": (ex_map.get(rid) or {}).get("difficulty") or "facile",
                        "h": round(hrs, 1), "lm": bool(r.get("sourdough_grams"))})
    valid_ids = {c["id"] for c in catalog}
    import json as __j
    cat_txt = __j.dumps(catalog, ensure_ascii=False)[:9000]
    sysmsg = ("Sei Sitor. Scegli AL MASSIMO 3 ricette DALL'ELENCO fornito che rispondono alla richiesta. "
              "NON inventare ricette. Rispondi SOLO con JSON valido: "
              '{"picks":[{"id":"<id esatto dall\'elenco>","flour_g":<intero>,"reason":"<una frase>"}],"warning":"<breve o vuoto>"}. '
              f"Lingua della reason/warning: {_CHAT_SYS.get(lang2,'italiano')}.")
    prompt = f"ELENCO RICETTE (JSON): {cat_txt}\n\nRICHIESTA UTENTE: {q}"
    try:
        raw = ""
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"plan-{dev}", system_message=sysmsg).with_model("anthropic", SITOR_FAST or SITOR_BRAIN).with_params(max_tokens=500)
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                raw += ev.content or ""
        m = _re.search(r"\{.*\}", raw, _re.S)
        parsed = __j.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.getLogger(__name__).warning("plan fail: %s", str(e)[:120])
        return {"ok": False, "recipes": []}
    await _bump_usage("plan_calls")
    out = []
    for p in (parsed.get("picks") or [])[:3]:
        rid = str(p.get("id") or "")
        if rid in valid_ids:  # il backend scarta id inventati o nascosti
            out.append({"id": rid, "flour_g": int(p.get("flour_g") or 0) or None, "reason": str(p.get("reason") or "")[:160]})
    return {"ok": True, "recipes": out, "warning": str(parsed.get("warning") or "")[:200]}


# ===========================================================================
# STADIO G5 — Impastiamo insieme (Live) · G6 — "quanti l'hanno fatta"
# ===========================================================================
@api_router.get("/time")
async def server_time():
    return {"now": now_iso(), "epoch_ms": int(datetime.now(timezone.utc).timestamp() * 1000)}


@api_router.get("/live")
async def live_get():
    if not await _feature_on("FEATURE_LIVE", True):
        raise HTTPException(status_code=404, detail="not_found")
    now = datetime.now(timezone.utc)
    docs = await db.live_sessions.find({}, {"_id": 0}).sort("start_utc", 1).to_list(50)
    current = nxt = None
    for d in docs:
        try:
            st = datetime.fromisoformat(d["start_utc"])
            if st.tzinfo is None:
                st = st.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        dur = int(d.get("duration_min") or 180)
        if st <= now <= st + timedelta(minutes=dur):
            current = d
        elif st > now and nxt is None:
            nxt = d
    part = 0
    try:
        cutoff = (now - timedelta(minutes=1)).isoformat()
        part = len(await db.live_pings.distinct("token", {"at": {"$gt": cutoff}}))
    except Exception:
        pass
    return {"ok": True, "current": current, "next": nxt, "participants": part, "server_now": now_iso()}


class LivePing(_BM):
    token: str = ""


@api_router.post("/live/ping")
async def live_ping(body: LivePing, request: Request):
    if not await _feature_on("FEATURE_LIVE", True):
        raise HTTPException(status_code=404, detail="not_found")
    tok = (body.token or "")[:40] or secrets.token_urlsafe(8)
    await db.live_pings.update_one({"token": tok}, {"$set": {"token": tok, "at": now_iso()}}, upsert=True)
    await _bump_usage("live_pings")
    # pulizia leggera dei ping vecchi (non distruttivo sui dati: solo ping effimeri)
    try:
        await db.live_pings.delete_many({"at": {"$lt": (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()}})
    except Exception:
        pass
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    n = len(await db.live_pings.distinct("token", {"at": {"$gt": cutoff}}))
    return {"ok": True, "participants": n}


class DonePing(_BM):
    recipe_id: str = ""


@api_router.post("/done-ping")
async def done_ping(body: DonePing, request: Request):
    rid = (body.recipe_id or "").strip()
    if not rid:
        raise HTTPException(status_code=400, detail="no_recipe")
    dev = _device_id(request)
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    key = _hashlib.sha256(f"{dev}|{rid}|{month}".encode()).hexdigest()[:24]
    # una volta al giorno per ricetta+dispositivo (hash solo per il limite)
    if not await _rate_limit(f"done_{rid}", dev, 1, 86400):
        pass  # oltre il limite: non incrementa di nuovo
    else:
        await db.done_counters.update_one({"recipe_id": rid, "month": month}, {"$inc": {"count": 1}, "$setOnInsert": {"recipe_id": rid, "month": month}}, upsert=True)
        await _bump_usage("done_pings")
    doc = await db.done_counters.find_one({"recipe_id": rid, "month": month}, {"_id": 0, "count": 1})
    n = int((doc or {}).get("count") or 0)
    return {"ok": True, "count": n if n >= 20 else 0, "threshold": 20}
