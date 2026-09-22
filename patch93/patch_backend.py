# MikiLab v93 — due ritocchi al backend (idempotenti; se un'ancora manca: errore, nessuna scrittura).
import sys
edits = []; failed = False
def load(p):
    try: return open(p, encoding="utf-8").read()
    except FileNotFoundError: print("ERRORE: non trovo " + p); sys.exit(1)
def rep(s, frm, to, tag, p):
    global failed
    if tag in s: return s
    if frm not in s: print("ERRORE: ancora non trovata in %s: %r" % (p, frm[:70])); failed = True; return s
    return s.replace(frm, to, 1)

p = "backend/sitor_public.py"; s0 = load(p); s = s0
s = rep(s, "    FEATURE_VOICE_CHAT: _Opt[bool] = None\n", "    FEATURE_VOICE_CHAT: _Opt[bool] = None\n    FEATURE_VOICE_SERVER: _Opt[bool] = None  # V93: voce del server (a pagamento), spenta di default\n", "FEATURE_VOICE_SERVER: _Opt", p)
s = rep(s, 'for f in ("FEATURE_PHOTO_DIAG", "FEATURE_PLAN", "FEATURE_LIVE", "FEATURE_VOICE_CHAT"):', 'for f in ("FEATURE_PHOTO_DIAG", "FEATURE_PLAN", "FEATURE_LIVE", "FEATURE_VOICE_CHAT", "FEATURE_VOICE_SERVER"):  # V93', '"FEATURE_VOICE_SERVER"):', p)
s = rep(s, '            "FEATURE_VOICE_CHAT": bool(s.get("FEATURE_VOICE_CHAT", True)),\n            "savings_level"', '            "FEATURE_VOICE_CHAT": bool(s.get("FEATURE_VOICE_CHAT", True)),\n            "FEATURE_VOICE_SERVER": bool(s.get("FEATURE_VOICE_SERVER", False)),  # V93\n            "savings_level"', '"FEATURE_VOICE_SERVER": bool(s.get("FEATURE_VOICE_SERVER", False)),  # V93\n            "savings_level"', p)
s = rep(s, '                         "FEATURE_VOICE_CHAT": bool(s.get("FEATURE_VOICE_CHAT", True))},', '                         "FEATURE_VOICE_CHAT": bool(s.get("FEATURE_VOICE_CHAT", True)),\n                         "FEATURE_VOICE_SERVER": bool(s.get("FEATURE_VOICE_SERVER", False))},  # V93', 'bool(s.get("FEATURE_VOICE_SERVER", False))},  # V93', p)
if s != s0: edits.append((p, s))

p = "backend/server.py"; s0 = load(p); s = s0
s = rep(s, "    voice_id: Optional[str] = None\n", "    voice_id: Optional[str] = None\n    translate: bool = False  # V93: traduzione prima della voce solo su richiesta\n", "translate: bool = False", p)
s = rep(s, 'session_id=f"tts-tr-{ck[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN)', 'session_id=f"tts-tr-{ck[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_FAST)', 'tts-tr-{ck[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_FAST)', p)
s = rep(s, "    text = _clean_for_tts(await _translate_for_tts(text, payload.lang))[:2000]\n",
"""    # V93: la voce del server costa crediti: si usa solo se accesa dall'admin (pagina Costi). Altrimenti parla il telefono.
    try:
        _vs = await db.site_settings.find_one({}, {"_id": 0, "FEATURE_VOICE_SERVER": 1}) or {}
        _voice_on = bool(_vs.get("FEATURE_VOICE_SERVER", False))
    except Exception:
        _voice_on = False
    if not _voice_on:
        raise HTTPException(status_code=424, detail="Voce server spenta: usa voce dispositivo")
    if payload.translate:  # V93: i testi arrivano gia' nella lingua giusta; traduzione solo se richiesta
        text = _clean_for_tts(await _translate_for_tts(text, payload.lang))[:2000]
""", "FEATURE_VOICE_SERVER\": 1}) or {}", p)
if s != s0: edits.append((p, s))

if failed: print("ERRORE: nessun file modificato."); sys.exit(1)
for p, s in edits: open(p, "w", encoding="utf-8").write(s)
print("Backend: " + (", ".join(p.split("/")[-1] for p, _ in edits) + " aggiornati" if edits else "già aggiornato, nessuna modifica"))
