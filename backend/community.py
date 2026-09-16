# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Community / Social (bake-along, amici, DM, notifiche, wisdom, inviti operatori).
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
Le rotte sono registrate sullo stesso `api_router` del core (server.py).
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

# --- Bake-Along: sfide settimanali di panificazione della community + classifica ---
BAKEALONG_THEMES = [
    {"id": "pane_integrale", "it": ("Pane Integrale", "Sforna un pane 100% integrale ben alveolato.", "Idrata di più (l'integrale beve tanto), usa autolisi lunga e pieghe delicate."),
     "de": ("Vollkornbrot", "Backe ein 100% Vollkornbrot mit schöner Porung.", "Mehr Wasser (Vollkorn saugt stark), lange Autolyse und sanftes Falten."),
     "en": ("Whole Wheat Bread", "Bake a 100% whole wheat loaf with an open crumb.", "Hydrate more (whole wheat drinks a lot), long autolyse and gentle folds."),
     "es": ("Pan Integral", "Hornea un pan 100% integral bien alveolado.", "Más hidratación, autólisis larga y pliegues suaves."),
     "fr": ("Pain Complet", "Réussis un pain 100% complet bien alvéolé.", "Hydrate davantage (le complet boit beaucoup), autolyse longue et rabats délicats."),
     "fa": ("نان سبوس‌دار", "یک نان ۱۰۰٪ سبوس‌دار با مغز حفره‌دار بپز.", "بیشتر هیدراته کن (سبوس آب زیاد می‌گیرد)، اتولیز طولانی و تاهای ملایم.")},
    {"id": "baguette", "it": ("Baguette Croccante", "La baguette più croccante e alveolata che riesci a fare.", "Poolish la sera prima, vapore in forno nei primi 10 minuti."),
     "de": ("Knuspriges Baguette", "Das knusprigste, luftigste Baguette, das du hinbekommst.", "Poolish am Vorabend, Dampf in den ersten 10 Minuten."),
     "en": ("Crusty Baguette", "The crustiest, airiest baguette you can make.", "Poolish the night before, steam for the first 10 minutes."),
     "es": ("Baguette Crujiente", "La baguette más crujiente y alveolada que puedas.", "Poolish la noche antes, vapor los primeros 10 minutos."),
     "fr": ("Baguette Croustillante", "La baguette la plus croustillante et alvéolée possible.", "Poolish la veille, vapeur au four les 10 premières minutes."),
     "fa": ("باگت ترد", "تردترین و حفره‌دارترین باگتی که می‌توانی.", "پولیش شب قبل، بخار در ۱۰ دقیقه اول فر.")},
    {"id": "focaccia", "it": ("Focaccia Alveolata", "Focaccia soffice e piena di bolle.", "Alta idratazione, lievitazione in teglia unta, fossette con le dita e olio."),
     "de": ("Luftige Focaccia", "Weiche Focaccia voller Blasen.", "Hohe Hydratation, Gare im geölten Blech, Dellen mit den Fingern und Öl."),
     "en": ("Bubbly Focaccia", "Soft focaccia full of bubbles.", "High hydration, proof in an oiled pan, dimple with fingers and oil."),
     "es": ("Focaccia Alveolada", "Focaccia esponjosa y llena de burbujas.", "Alta hidratación, fermentación en bandeja aceitada, hoyuelos y aceite."),
     "fr": ("Focaccia Alvéolée", "Focaccia moelleuse et pleine de bulles.", "Forte hydratation, pousse en plaque huilée, creux aux doigts et huile."),
     "fa": ("فوکاچیای حفره‌دار", "فوکاچیای نرم و پر از حباب.", "هیدراتاسیون بالا، تخمیر در سینی روغنی، گودی با انگشت و روغن.")},
    {"id": "cinnamon", "it": ("Girelle alla Cannella", "Soft rolls alla cannella con glassa.", "Impasto arricchito con burro e latte, seconda lievitazione ben fatta."),
     "de": ("Zimtschnecken", "Weiche Zimtschnecken mit Glasur.", "Angereicherter Teig mit Butter und Milch, gute zweite Gare."),
     "en": ("Cinnamon Rolls", "Soft cinnamon rolls with glaze.", "Enriched dough with butter and milk, good second proof."),
     "es": ("Rollos de Canela", "Rollos suaves de canela con glaseado.", "Masa enriquecida con mantequilla y leche, buena segunda fermentación."),
     "fr": ("Roulés à la Cannelle", "Roulés moelleux à la cannelle avec glaçage.", "Pâte enrichie beurre et lait, bonne deuxième pousse."),
     "fa": ("رول دارچینی", "رول‌های نرم دارچینی با روکش.", "خمیر غنی با کره و شیر، تخمیر دوم خوب.")},
    {"id": "pizza", "it": ("Pizza in Teglia", "Pizza in teglia alta idratazione, cornicione alveolato.", "80% idratazione, maturazione in frigo 24-48h, teglia ben calda."),
     "de": ("Blechpizza", "Blechpizza mit hoher Hydratation, luftiger Rand.", "80% Hydratation, 24-48h Kühlreifung, heißes Blech."),
     "en": ("Pan Pizza", "High-hydration pan pizza with an airy crust.", "80% hydration, 24-48h cold maturation, very hot pan."),
     "es": ("Pizza en Bandeja", "Pizza en bandeja alta hidratación, borde alveolado.", "80% hidratación, maduración en frío 24-48h, bandeja caliente."),
     "fr": ("Pizza en Plaque", "Pizza en plaque très hydratée, bord alvéolé.", "80% d'hydratation, maturation au frigo 24-48h, plaque bien chaude."),
     "fa": ("پیتزای سینی", "پیتزای سینی با هیدراتاسیون بالا و لبه حفره‌دار.", "۸۰٪ هیدراتاسیون، رسیدن در یخچال ۲۴-۴۸ ساعت، سینی داغ.")},
    {"id": "rustico", "it": ("Pane Rustico a Lievito Madre", "Un bel pane rustico con la tua pasta madre.", "Rinfresca la madre al top, cottura in pentola per la crosta."),
     "de": ("Rustikales Sauerteigbrot", "Ein schönes rustikales Brot mit deinem Sauerteig.", "Sauerteig auf dem Höhepunkt auffrischen, im Topf backen."),
     "en": ("Rustic Sourdough", "A beautiful rustic loaf with your sourdough.", "Refresh the starter at its peak, bake in a pot for the crust."),
     "es": ("Pan Rústico de Masa Madre", "Un buen pan rústico con tu masa madre.", "Refresca la madre en su punto, hornea en olla para la corteza."),
     "fr": ("Pain Rustique au Levain", "Un beau pain rustique avec ton levain.", "Rafraîchis le levain à son pic, cuisson en cocotte pour la croûte."),
     "fa": ("نان روستایی با خمیر ترش", "یک نان روستایی زیبا با خمیر ترش خودت.", "خمیر ترش را در اوج تازه کن، در قابلمه بپز برای پوسته.")},
    {"id": "brioche", "it": ("Brioche Soffice", "La brioche più soffice e filante.", "Burro freddo a fine impasto, incordatura perfetta, frigo prima di formare."),
     "de": ("Fluffige Brioche", "Die weichste, fluffigste Brioche.", "Kalte Butter am Ende, perfekte Teigstruktur, vor dem Formen kühlen."),
     "en": ("Soft Brioche", "The softest, fluffiest brioche.", "Cold butter at the end, perfect gluten, chill before shaping."),
     "es": ("Brioche Suave", "La brioche más suave y esponjosa.", "Mantequilla fría al final, amasado perfecto, frío antes de formar."),
     "fr": ("Brioche Moelleuse", "La brioche la plus moelleuse et filante.", "Beurre froid en fin de pétrissage, réseau parfait, frigo avant façonnage."),
     "fa": ("بریوش نرم", "نرم‌ترین و کش‌دارترین بریوش.", "کره سرد در پایان ورز، شکل‌گیری کامل گلوتن، یخچال قبل از فرم دادن.")},
    {"id": "grissini", "it": ("Grissini & Snack", "Grissini o crackers croccanti fatti in casa.", "Impasto povero d'acqua, stesura sottile, cottura bassa e lunga."),
     "de": ("Grissini & Snacks", "Knusprige Grissini oder Cracker selbstgemacht.", "Wasserarmer Teig, dünn ausrollen, niedrig und lange backen."),
     "en": ("Grissini & Snacks", "Crunchy homemade grissini or crackers.", "Low-water dough, roll thin, bake low and long."),
     "es": ("Grissini & Snacks", "Grissini o crackers crujientes caseros.", "Masa con poca agua, estirado fino, cocción baja y larga."),
     "fr": ("Gressins & Snacks", "Gressins ou crackers croustillants maison.", "Pâte peu hydratée, abaisse fine, cuisson basse et longue."),
     "fa": ("گریسینی و اسنک", "گریسینی یا کراکر ترد خانگی.", "خمیر کم‌آب، پهن‌کردن نازک، پخت با حرارت پایین و طولانی.")},
]


def _bakealong_index(offset: int = 0):
    from datetime import date, timedelta
    _, w, _2 = (date.today() + timedelta(weeks=offset)).isocalendar()
    return w % len(BAKEALONG_THEMES)


def _bakealong_theme(lang: str, offset: int = 0):
    lang = lang if lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    th = BAKEALONG_THEMES[_bakealong_index(offset)]
    title, desc, tip = th.get(lang, th["it"])
    return {"id": th["id"], "title": title, "description": desc, "tip": tip}


class BakeAlongSubmitReq(BaseModel):
    text: str = Field("", max_length=2000)
    image_url: str


@api_router.get("/bakealong/current")
async def bakealong_current(request: Request, lang: str = "it"):
    user = await optional_user(request)
    week = _iso_week()
    theme = _bakealong_theme(lang)
    count = await db.community_posts.count_documents({"category": "bakealong", "challenge_week": week})
    submitted = False
    if user:
        submitted = bool(await db.community_posts.find_one(
            {"category": "bakealong", "challenge_week": week, "author_id": user["user_id"]}, {"_id": 1}))
    last = _bakealong_theme(lang, offset=-1)
    return {"week": week, "theme": theme, "participants": count, "already_submitted": submitted,
            "last_week_theme": last}


@api_router.post("/bakealong/submit")
async def bakealong_submit(body: BakeAlongSubmitReq, user: dict = Depends(current_user)):
    if not body.image_url:
        raise HTTPException(400, "Serve una foto del tuo prodotto")
    week = _iso_week()
    theme = _bakealong_theme("it")
    existing = await db.community_posts.find_one(
        {"category": "bakealong", "challenge_week": week, "author_id": user["user_id"]}, {"_id": 0, "id": 1})
    text = (body.text or "").strip()
    tr = await _translate_text_multi(text) if text else {}
    if existing:
        await db.community_posts.update_one({"id": existing["id"]},
            {"$set": {"text": text, "text_de": tr.get("text_de"), "text_en": tr.get("text_en"),
                      "text_es": tr.get("text_es"), "image_url": body.image_url}})
        doc = await db.community_posts.find_one({"id": existing["id"]}, {"_id": 0})
        return _post_public(doc, user)
    doc = {
        "id": str(uuid.uuid4()),
        "author_id": user["user_id"],
        "author_name": user.get("name") or (user.get("email") or "Fornaio").split("@")[0],
        "author_avatar": user.get("picture", ""),
        "category": "bakealong",
        "challenge_week": week,
        "challenge_id": theme["id"],
        "text": text,
        "text_de": tr.get("text_de"), "text_en": tr.get("text_en"), "text_es": tr.get("text_es"),
        "image_url": body.image_url,
        "created_at": now_iso(),
        "likes": [], "comments": [],
    }
    await db.community_posts.insert_one(doc)
    await _touch_streak(user["user_id"])
    return _post_public(doc, user)


@api_router.get("/bakealong/entries")
async def bakealong_entries(request: Request, week: Optional[str] = None):
    user = await optional_user(request)
    wk = week or _iso_week()
    docs = await db.community_posts.find({"category": "bakealong", "challenge_week": wk}, {"_id": 0}).to_list(500)
    entries = [_post_public(d, user) for d in docs]
    entries.sort(key=lambda e: (e["like_count"], e.get("created_at", "")), reverse=True)
    for rank, e in enumerate(entries):
        e["rank"] = rank + 1
    return {"week": wk, "entries": entries}


async def _broadcast_bakealong(force: bool = False):
    """Invia push + campanella a tutti gli iscritti per la sfida della settimana corrente. Ritorna il numero di iscritti."""
    theme = _bakealong_theme("it")
    title = "🔥 Nuova Sfida Bake-Along!"
    body = f"Questa settimana: {theme['title']}. Sforna e partecipa!"
    subs = await db.push_subs.find({}, {"_id": 0}).to_list(5000)
    if subs:
        _, priv = await _get_vapid()
        payload = {"title": title, "body": body, "url": "/?tab=impara"}
        for s in subs:
            try:
                await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
            except Exception:
                pass
    uids = {s.get("user_id") for s in subs if s.get("user_id")}
    for uid in uids:
        try:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()), "user_id": uid, "actor_id": "system",
                "type": "bakealong", "post_id": None, "actor_name": "MikiLab",
                "snippet": theme["title"][:80], "read": False, "created_at": now_iso(),
            })
        except Exception:
            pass
    return len(subs)


@api_router.post("/admin/bakealong/notify")
async def admin_bakealong_notify(user: dict = Depends(require_admin)):
    n = await _broadcast_bakealong(force=True)
    await db.app_config.update_one({"_id": "bakealong_notify"}, {"$set": {"week": _iso_week()}}, upsert=True)
    return {"ok": True, "notified_subscribers": n}


async def _award_bakealong_winner(week: str):
    """Assegna la coccarda 'Campione Bake-Along' al vincitore (più voti) della settimana indicata. Idempotente per settimana."""
    if not week:
        return None
    if await db.bakealong_winners.find_one({"week": week}):
        return None  # già assegnato
    docs = await db.community_posts.find({"category": "bakealong", "challenge_week": week}, {"_id": 0}).to_list(500)
    if not docs:
        return None
    docs.sort(key=lambda d: (len(d.get("likes", []) or []), d.get("created_at", "")), reverse=True)
    win = docs[0]
    likes = len(win.get("likes", []) or [])
    winner = {
        "week": week, "user_id": win.get("author_id"), "name": win.get("author_name"),
        "avatar": win.get("author_avatar", ""), "likes": likes, "post_id": win.get("id"),
        "image_url": win.get("image_url"), "challenge_id": win.get("challenge_id"),
        "created_at": now_iso(),
    }
    await db.bakealong_winners.insert_one(winner)
    winner.pop("_id", None)
    if win.get("author_id"):
        await db.users.update_one({"user_id": win["author_id"]}, {"$addToSet": {"badges": "bakealong_champion"}})
        # notifica + push al vincitore
        try:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()), "user_id": win["author_id"], "actor_id": "system",
                "type": "bakealong_win", "post_id": win.get("id"), "actor_name": "MikiLab",
                "snippet": f"Hai vinto la sfida Bake-Along ({likes} voti)! 🏆", "read": False, "created_at": now_iso(),
            })
            subs = await db.push_subs.find({"user_id": win["author_id"]}, {"_id": 0}).to_list(10)
            if subs:
                _, priv = await _get_vapid()
                payload = {"title": "🏆 Sei il Campione Bake-Along!", "body": f"Hai vinto la sfida della settimana con {likes} voti!", "url": "/?tab=impara"}
                for s in subs:
                    await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
        except Exception:
            logger.exception("bakealong winner notify error")
    return winner


@api_router.get("/bakealong/winners")
async def bakealong_winners(limit: int = 12):
    rows = await db.bakealong_winners.find({}, {"_id": 0}).sort("week", -1).to_list(max(1, min(limit, 50)))
    return {"winners": rows}


@api_router.post("/admin/bakealong/award")
async def admin_bakealong_award(user: dict = Depends(require_admin), week: Optional[str] = None):
    """Assegna manualmente la coccarda al vincitore della settimana indicata (default: settimana corrente)."""
    wk = week or _iso_week()
    w = await _award_bakealong_winner(wk)
    return {"ok": True, "week": wk, "winner": w}


async def _bakealong_notify_loop():
    """A inizio di ogni nuova settimana ISO avvisa (web push + campanella) tutti gli iscritti della nuova sfida Bake-Along."""
    await asyncio.sleep(20)  # attende l'avvio completo
    while True:
        try:
            wk = _iso_week()
            cfg = await db.app_config.find_one({"_id": "bakealong_notify"})
            last = cfg.get("week") if cfg else None
            if last is None:
                # Primo avvio: memorizza la settimana corrente SENZA notificare (niente spam al deploy)
                await db.app_config.update_one({"_id": "bakealong_notify"}, {"$set": {"week": wk}}, upsert=True)
            elif last != wk:
                # Proclama il vincitore della settimana appena conclusa (last), poi annuncia la nuova sfida
                try:
                    await _award_bakealong_winner(last)
                except Exception:
                    logger.exception("award winner on rollover error")
                n = await _broadcast_bakealong()
                await db.app_config.update_one({"_id": "bakealong_notify"}, {"$set": {"week": wk}}, upsert=True)
                logger.info(f"Bake-Along: notificata nuova sfida a {n} iscritti")
        except Exception:
            logger.exception("bakealong notify loop error")
        await asyncio.sleep(600)


# --- Sistema Amici (richieste + accetta/rifiuta + elenco utenti) --------------
class FriendReq(BaseModel):
    to_id: str

class FriendRespReq(BaseModel):
    from_id: str
    action: str  # accept | decline

class FriendRemoveReq(BaseModel):
    other_id: str


def _user_card(u: dict) -> dict:
    return {
        "user_id": u.get("user_id"),
        "name": u.get("name") or (u.get("email") or "Fornaio").split("@")[0],
        "picture": u.get("picture") or "",
        "email": u.get("email") or "",
    }


async def _friendship(a: str, b: str):
    return await db.friendships.find_one(
        {"$or": [{"from_id": a, "to_id": b}, {"from_id": b, "to_id": a}]}, {"_id": 0}
    )


def _rel_status(fr: dict, me: str) -> str:
    if not fr:
        return "none"
    if fr.get("status") == "accepted":
        return "friends"
    return "outgoing" if fr.get("from_id") == me else "incoming"


@api_router.get("/users/directory")
async def users_directory(user: dict = Depends(current_user)):
    me = user["user_id"]
    users = await db.users.find({"user_id": {"$ne": me}}, {"_id": 0}).to_list(500)
    frs = await db.friendships.find(
        {"$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}
    ).to_list(1000)
    rel = {}
    for f in frs:
        other = f["to_id"] if f["from_id"] == me else f["from_id"]
        rel[other] = _rel_status(f, me)
    out = []
    for u in users:
        card = _user_card(u)
        card["status"] = rel.get(u.get("user_id"), "none")
        out.append(card)
    out.sort(key=lambda c: (c["status"] != "friends", c["name"].lower()))
    return out


@api_router.get("/friends")
async def friends_list(user: dict = Depends(current_user)):
    me = user["user_id"]
    frs = await db.friendships.find(
        {"$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}
    ).to_list(1000)
    friend_ids, incoming_ids, outgoing_ids = [], [], []
    for f in frs:
        other = f["to_id"] if f["from_id"] == me else f["from_id"]
        st = _rel_status(f, me)
        (friend_ids if st == "friends" else incoming_ids if st == "incoming" else outgoing_ids).append(other)

    async def cards(ids):
        if not ids:
            return []
        us = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(500)
        return [_user_card(u) for u in us]

    return {"friends": await cards(friend_ids), "incoming": await cards(incoming_ids), "outgoing": await cards(outgoing_ids)}


@api_router.post("/friends/request")
async def friends_request(body: FriendReq, user: dict = Depends(current_user)):
    me = user["user_id"]
    if body.to_id == me:
        raise HTTPException(400, "Non puoi aggiungere te stesso")
    target = await db.users.find_one({"user_id": body.to_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Utente non trovato")
    existing = await _friendship(me, body.to_id)
    if existing:
        return {"status": _rel_status(existing, me)}
    await db.friendships.insert_one({
        "id": str(uuid.uuid4()), "from_id": me, "to_id": body.to_id,
        "status": "pending", "created_at": now_iso(),
    })
    actor = user.get("name") or (user.get("email") or "Fornaio").split("@")[0]
    await _notify(body.to_id, me, "friend_request", None, actor, "")
    return {"status": "outgoing"}


@api_router.post("/friends/respond")
async def friends_respond(body: FriendRespReq, user: dict = Depends(current_user)):
    me = user["user_id"]
    fr = await db.friendships.find_one({"from_id": body.from_id, "to_id": me, "status": "pending"}, {"_id": 0})
    if not fr:
        raise HTTPException(404, "Richiesta non trovata")
    if body.action == "accept":
        await db.friendships.update_one({"id": fr["id"]}, {"$set": {"status": "accepted", "accepted_at": now_iso()}})
        actor = user.get("name") or (user.get("email") or "Fornaio").split("@")[0]
        await _notify(body.from_id, me, "friend_accept", None, actor, "")
        return {"status": "friends"}
    await db.friendships.delete_one({"id": fr["id"]})
    return {"status": "none"}


@api_router.post("/friends/remove")
async def friends_remove(body: FriendRemoveReq, user: dict = Depends(current_user)):
    me = user["user_id"]
    fr = await _friendship(me, body.other_id)
    if fr:
        await db.friendships.delete_one({"id": fr["id"]})
    return {"status": "none"}


@api_router.get("/friends/suggestions")
async def friends_suggestions(user: dict = Depends(current_user), limit: int = 8):
    """Suggeriti per te: amici in comune (friends-of-friends) + fornai attivi con interessi simili."""
    me = user["user_id"]
    # Relazioni esistenti da escludere (amici, richieste in corso, me stesso)
    my_frs = await db.friendships.find({"$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}).to_list(2000)
    exclude = {me}
    my_friend_ids = []
    for f in my_frs:
        other = f["to_id"] if f["from_id"] == me else f["from_id"]
        exclude.add(other)
        if f.get("status") == "accepted":
            my_friend_ids.append(other)

    cand = {}  # id -> {score, reason, mutuals}
    # 1) Amici di amici (con conteggio amici in comune e un nome esempio)
    if my_friend_ids:
        ffs = await db.friendships.find(
            {"status": "accepted", "$or": [{"from_id": {"$in": my_friend_ids}}, {"to_id": {"$in": my_friend_ids}}]},
            {"_id": 0}).to_list(5000)
        fof = {}
        for f in ffs:
            for side in ("from_id", "to_id"):
                oid = f[side]
                via = f["to_id"] if side == "from_id" else f["from_id"]
                if oid in exclude or via not in my_friend_ids:
                    continue
                fof.setdefault(oid, set()).add(via)
        for oid, vias in fof.items():
            cand[oid] = {"score": 100 + len(vias), "reason": "mutual", "mutuals": len(vias)}

    # 2) Partecipanti alle sfide Bake-Along (interesse simile)
    ba = await db.community_posts.find({"category": "bakealong"}, {"_id": 0, "author_id": 1}).to_list(1000)
    for p in ba:
        oid = p.get("author_id")
        if oid and oid not in exclude and oid not in cand:
            cand[oid] = {"score": 50, "reason": "bakealong", "mutuals": 0}

    # 3) Fornai attivi di recente nel Social
    if len(cand) < limit + 4:
        recent = await db.community_posts.find({"is_deleted": {"$ne": True}}, {"_id": 0, "author_id": 1})\
            .sort("created_at", -1).to_list(300)
        for p in recent:
            oid = p.get("author_id")
            if oid and oid not in exclude and oid not in cand:
                cand[oid] = {"score": 20, "reason": "active", "mutuals": 0}

    if not cand:
        return {"suggestions": []}

    top = sorted(cand.items(), key=lambda kv: kv[1]["score"], reverse=True)[:limit]
    ids = [oid for oid, _ in top]
    users = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(200)
    umap = {u["user_id"]: u for u in users}

    # Nome di un amico in comune (per il testo "amico di …")
    via_name = {}
    if my_friend_ids:
        fus = await db.users.find({"user_id": {"$in": my_friend_ids}}, {"_id": 0, "user_id": 1, "name": 1, "email": 1}).to_list(500)
        via_name = {u["user_id"]: (u.get("name") or (u.get("email") or "Fornaio").split("@")[0]) for u in fus}

    out = []
    for oid, meta in top:
        u = umap.get(oid)
        if not u:
            continue
        card = _user_card(u)
        card["reason"] = meta["reason"]
        card["mutuals"] = meta["mutuals"]
        out.append(card)
    return {"suggestions": out}



class ProfileUpdateReq(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    picture: Optional[str] = None
    birthday: Optional[str] = None  # "MM-DD" oppure "YYYY-MM-DD" (facoltativo)


@api_router.get("/community/profile/{user_id}")
async def community_profile(user_id: str):
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(404, "Utente non trovato")
    posts = await db.community_posts.find({"author_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(50)
    listings = await db.market_listings.count_documents({"owner_id": user_id, "is_deleted": {"$ne": True}})
    frs = await db.friendships.find({"status": "accepted", "$or": [{"from_id": user_id}, {"to_id": user_id}]}, {"_id": 0}).to_list(200)
    other_ids = [(f["to_id"] if f["from_id"] == user_id else f["from_id"]) for f in frs]
    contacts = []
    if other_ids:
        us = await db.users.find({"user_id": {"$in": other_ids}}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "email": 1}).to_list(200)
        contacts = [{"user_id": x["user_id"], "name": x.get("name") or (x.get("email") or "Fornaio").split("@")[0], "picture": x.get("picture", "")} for x in us]
    ba_wins = await db.bakealong_winners.count_documents({"user_id": user_id})
    return {
        "user_id": user_id,
        "name": u.get("name") or (u.get("email") or "Fornaio").split("@")[0],
        "picture": u.get("picture", ""), "bio": u.get("bio", ""),
        "joined": u.get("created_at"), "followers_count": len(other_ids),
        "birthday": u.get("birthday", ""),
        "contacts": contacts, "badges": u.get("badges", []),
        "bakealong_wins": ba_wins,
        "posts": posts, "posts_count": len(posts), "listings_count": listings,
    }


@api_router.post("/community/profile")
async def community_profile_update(body: ProfileUpdateReq, user: dict = Depends(current_user)):
    upd = {}
    if body.name is not None: upd["name"] = body.name.strip()[:60]
    if body.bio is not None: upd["bio"] = body.bio.strip()[:300]
    if body.picture is not None: upd["picture"] = body.picture.strip()[:600]
    if body.birthday is not None: upd["birthday"] = body.birthday.strip()[:10]
    if upd:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": upd})
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"name": u.get("name"), "picture": u.get("picture", ""), "bio": u.get("bio", ""), "birthday": u.get("birthday", "")}


# ---------------------------------------------------------------------------
# Sapienza dell'Utente — proverbi proposti dai fornai (moderati) + voti
# ---------------------------------------------------------------------------
class WisdomReq(BaseModel):
    text: str


@api_router.post("/wisdom")
async def wisdom_create(body: WisdomReq, user: dict = Depends(current_user)):
    text = (body.text or "").strip()
    if len(text) < 8:
        raise HTTPException(400, "Scrivi un proverbio un po' più lungo")
    if len(text) > 240:
        text = text[:240]
    tr = await _translate_text_multi(text)
    doc = {
        "id": str(uuid.uuid4()), "author_id": user["user_id"],
        "author_name": user.get("name") or (user.get("email") or "Fornaio").split("@")[0],
        "text": text, "text_de": tr.get("text_de"), "text_en": tr.get("text_en"), "text_es": tr.get("text_es"),
        "status": "pending", "likes": [], "created_at": now_iso(),
    }
    await db.wisdom_proverbs.insert_one(doc)
    return {"ok": True, "status": "pending"}


def _wisdom_public(d, user):
    return {"id": d["id"], "author_name": d.get("author_name", "Fornaio"),
            "text": d.get("text", ""), "text_de": d.get("text_de"), "text_en": d.get("text_en"), "text_es": d.get("text_es"),
            "like_count": len(d.get("likes") or []),
            "liked_by_me": bool(user and user["user_id"] in (d.get("likes") or [])),
            "status": d.get("status")}


@api_router.get("/wisdom/approved")
async def wisdom_approved(request: Request):
    user = await optional_user(request)
    docs = await db.wisdom_proverbs.find({"status": "approved"}, {"_id": 0}).to_list(200)
    docs.sort(key=lambda d: (len(d.get("likes") or []), d.get("created_at") or ""), reverse=True)
    return [_wisdom_public(d, user) for d in docs]


@api_router.post("/wisdom/{pid}/like")
async def wisdom_like(pid: str, user: dict = Depends(current_user)):
    d = await db.wisdom_proverbs.find_one({"id": pid}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Proverbio non trovato")
    likes = set(d.get("likes") or [])
    uid = user["user_id"]
    likes.discard(uid) if uid in likes else likes.add(uid)
    await db.wisdom_proverbs.update_one({"id": pid}, {"$set": {"likes": list(likes)}})
    return {"ok": True, "like_count": len(likes), "liked_by_me": uid in likes}


@api_router.get("/wisdom/pending")
async def wisdom_pending(user: dict = Depends(require_admin)):
    docs = await db.wisdom_proverbs.find({"status": "pending"}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return [_wisdom_public(d, user) for d in docs]


@api_router.post("/wisdom/{pid}/approve")
async def wisdom_approve(pid: str, user: dict = Depends(require_admin)):
    await db.wisdom_proverbs.update_one({"id": pid}, {"$set": {"status": "approved", "approved_at": now_iso()}})
    return {"ok": True}


@api_router.post("/wisdom/{pid}/reject")
async def wisdom_reject(pid: str, user: dict = Depends(require_admin)):
    await db.wisdom_proverbs.delete_one({"id": pid})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Streak del Fornaio — giorni consecutivi in cui l'utente cuoce o impara
# ---------------------------------------------------------------------------
STREAK_MILESTONES = [3, 7, 14, 30, 60, 100]


async def _touch_streak(user_id: str):
    """Registra un'attività (cuoce/impara) di oggi e aggiorna lo streak. Idempotente per giorno."""
    from datetime import date, timedelta
    today = date.today().isoformat()
    yest = (date.today() - timedelta(days=1)).isoformat()
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0, "activity_last": 1, "streak_current": 1, "streak_best": 1})
    if u is None:
        return
    last = u.get("activity_last")
    if last == today:
        return
    cur = int(u.get("streak_current") or 0)
    cur = cur + 1 if last == yest else 1
    best = max(int(u.get("streak_best") or 0), cur)
    upd = {"$set": {"activity_last": today, "streak_current": cur, "streak_best": best}}
    earned = [f"streak_{m}" for m in STREAK_MILESTONES if cur >= m]
    if earned:
        upd["$addToSet"] = {"badges": {"$each": earned}}
    await db.users.update_one({"user_id": user_id}, upd)


@api_router.get("/streak")
async def get_streak(user: dict = Depends(current_user)):
    from datetime import date, timedelta
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "activity_last": 1, "streak_current": 1, "streak_best": 1, "badges": 1})
    today = date.today().isoformat()
    yest = (date.today() - timedelta(days=1)).isoformat()
    last = (u or {}).get("activity_last")
    cur = int((u or {}).get("streak_current") or 0)
    # Se l'ultima attività non è oggi né ieri, lo streak è interrotto (mostra 0 finché non riprende).
    if last not in (today, yest):
        cur = 0
    best = int((u or {}).get("streak_best") or 0)
    nxt = next((m for m in STREAK_MILESTONES if m > cur), None)
    # Traguardi già CONQUISTATI (persistiti in badges: "streak_N"), a prescindere dallo streak attuale.
    badges = set((u or {}).get("badges") or [])
    earned = [m for m in STREAK_MILESTONES if f"streak_{m}" in badges or best >= m]
    return {"current": cur, "best": best, "active_today": last == today,
            "milestones": [{"days": m, "reached": cur >= m} for m in STREAK_MILESTONES],
            "earned": earned, "next": nxt}


@api_router.get("/hall-of-fame")
async def hall_of_fame():
    """Classifica mensile dei fornai: punteggio = voti ricevuti sui post del mese + n° post."""
    from datetime import date
    today = date.today()
    prefix = f"{today.year:04d}-{today.month:02d}"  # ISO created_at inizia con YYYY-MM
    docs = await db.community_posts.find(
        {"is_deleted": {"$ne": True}, "created_at": {"$regex": f"^{prefix}"}},
        {"_id": 0, "author_id": 1, "author_name": 1, "author_avatar": 1, "likes": 1}).to_list(3000)
    agg = {}
    for d in docs:
        aid = d.get("author_id")
        if not aid or aid == "mikila":
            continue
        a = agg.setdefault(aid, {"user_id": aid, "name": d.get("author_name") or "Fornaio",
                                 "picture": d.get("author_avatar", ""), "likes": 0, "posts": 0})
        a["likes"] += len(d.get("likes") or [])
        a["posts"] += 1
    rows = list(agg.values())
    for r in rows:
        r["score"] = r["likes"] * 2 + r["posts"]
    rows.sort(key=lambda r: (-r["score"], r["name"].lower()))
    rows = rows[:10]
    ids = [r["user_id"] for r in rows]
    if ids:
        us = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0, "user_id": 1, "picture": 1, "badges": 1, "streak_best": 1}).to_list(100)
        umap = {u["user_id"]: u for u in us}
        for r in rows:
            uu = umap.get(r["user_id"], {})
            if uu.get("picture"):
                r["picture"] = uu["picture"]
            r["streak_best"] = int(uu.get("streak_best") or 0)
            r["champion"] = "bakealong_champion" in (uu.get("badges") or [])
    for i, r in enumerate(rows):
        r["rank"] = i + 1
    label = today.strftime("%Y-%m")
    return {"month": label, "leaders": rows}


@api_router.post("/activity/ping")
async def activity_ping(user: dict = Depends(current_user)):
    await _touch_streak(user["user_id"])
    return await get_streak(user)


# ---------------------------------------------------------------------------
# Auguri Automatici — Mikila pubblica un post pubblico per compleanno/anniversario
# ---------------------------------------------------------------------------
@api_router.post("/greetings/check")
async def greetings_check(user: dict = Depends(current_user)):
    from datetime import date, datetime as _dt
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not u:
        return {"posted": False}
    today = date.today()
    tkey = today.isoformat()
    if u.get("last_greeting_date") == tkey:
        return {"posted": False, "reason": "already"}

    def _mmdd(s):
        if not s:
            return None
        s = str(s)
        if len(s) == 5 and s[2] == "-":
            return s
        try:
            d = _dt.fromisoformat(s.replace("Z", "+00:00"))
            return f"{d.month:02d}-{d.day:02d}"
        except Exception:
            return None

    tmd = f"{today.month:02d}-{today.day:02d}"
    name = u.get("name") or (u.get("email") or "Fornaio").split("@")[0]
    kind = None
    if _mmdd(u.get("birthday")) == tmd:
        kind = "compleanno"
        text = f"🎂 Tanti auguri di buon compleanno a {name} da tutta la famiglia MikiLab! Oggi si impasta con il sorriso. 🥖"
    else:
        ca = _mmdd(u.get("created_at"))
        joined_year = None
        try:
            joined_year = _dt.fromisoformat(str(u.get("created_at")).replace("Z", "+00:00")).year
        except Exception:
            joined_year = None
        if ca == tmd and joined_year and joined_year < today.year:
            kind = "anniversario"
            yrs = today.year - joined_year
            text = f"🥳 Oggi {name} festeggia {yrs} anno/i con MikiLab! Grazie di far parte del nostro forno. 🎉"
    if not kind:
        return {"posted": False}

    # Guardia atomica: rivendica il giorno prima di pubblicare (evita doppioni sotto chiamate concorrenti).
    claim = await db.users.update_one(
        {"user_id": user["user_id"], "last_greeting_date": {"$ne": tkey}},
        {"$set": {"last_greeting_date": tkey}})
    if claim.modified_count == 0:
        return {"posted": False, "reason": "already"}

    tr = await _translate_text_multi(text)
    doc = {
        "id": str(uuid.uuid4()),
        "author_id": "mikilab",
        "author_name": "MikiLab",
        "author_avatar": "/michele-avatar.jpg",
        "category": "auguri",
        "greeting_for": user["user_id"],
        "text": text,
        "text_de": tr.get("text_de"), "text_en": tr.get("text_en"), "text_es": tr.get("text_es"),
        "created_at": now_iso(), "likes": [], "comments": [],
    }
    await db.community_posts.insert_one(doc)
    return {"posted": True, "kind": kind}


class DMReq(BaseModel):
    to_id: str
    text: str = ""
    image_url: Optional[str] = None


@api_router.post("/community/messages")
async def dm_send(body: DMReq, user: dict = Depends(current_user)):
    text = (body.text or "").strip()[:1000]
    image_url = (body.image_url or "").strip()[:600] or None
    if (not text and not image_url) or not body.to_id:
        raise HTTPException(400, "Messaggio vuoto")
    me = user["user_id"]
    doc = {"id": str(uuid.uuid4()), "from_id": me, "to_id": body.to_id, "text": text,
           "image_url": image_url, "read": False, "created_at": now_iso()}
    await db.dm_messages.insert_one(doc)
    actor = user.get("name") or (user.get("email") or "Fornaio").split("@")[0]
    await _notify(body.to_id, me, "message", None, actor, (text or "📷 Foto")[:60])
    doc.pop("_id", None)
    return doc


@api_router.get("/community/conversations")
async def dm_conversations(user: dict = Depends(current_user)):
    me = user["user_id"]
    msgs = await db.dm_messages.find(
        {"$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}
    ).sort("created_at", 1).to_list(2000)
    convos = {}  # other_id -> {last, at, unread}
    for m in msgs:
        other = m["to_id"] if m["from_id"] == me else m["from_id"]
        c = convos.setdefault(other, {"other_id": other, "last": "", "at": None, "unread": 0})
        c["last"] = m.get("text", "") or ("📷 Foto" if m.get("image_url") else "")
        c["at"] = m.get("created_at")
        if m["to_id"] == me and not m.get("read"):
            c["unread"] += 1
    ids = list(convos.keys())
    if ids:
        us = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "email": 1}).to_list(500)
        umap = {x["user_id"]: x for x in us}
        for oid, c in convos.items():
            u = umap.get(oid, {})
            c["name"] = u.get("name") or (u.get("email") or "Fornaio").split("@")[0]
            c["picture"] = u.get("picture", "")
    items = sorted(convos.values(), key=lambda c: c.get("at") or "", reverse=True)
    return {"conversations": items}


@api_router.get("/community/messages/{other_id}")
async def dm_thread(other_id: str, user: dict = Depends(current_user)):
    me = user["user_id"]
    q = {"$or": [{"from_id": me, "to_id": other_id}, {"from_id": other_id, "to_id": me}]}
    msgs = await db.dm_messages.find(q, {"_id": 0}).sort("created_at", 1).to_list(200)
    await db.dm_messages.update_many({"from_id": other_id, "to_id": me, "read": False}, {"$set": {"read": True}})
    other = await db.users.find_one({"user_id": other_id}, {"_id": 0, "name": 1, "picture": 1, "email": 1})
    other_info = None
    if other:
        other_info = {"user_id": other_id, "name": other.get("name") or (other.get("email") or "Fornaio").split("@")[0], "picture": other.get("picture", "")}
    return {"messages": msgs, "other": other_info}


_REACT_EMOJIS = {"👍", "🔥", "🥖", "❤️", "👏", "😮"}


class ReactReq(BaseModel):
    emoji: str


@api_router.post("/community/messages/{msg_id}/react")
async def dm_react(msg_id: str, body: ReactReq, user: dict = Depends(current_user)):
    emoji = (body.emoji or "").strip()
    if emoji not in _REACT_EMOJIS:
        raise HTTPException(400, "Emoji non valida")
    me = user["user_id"]
    msg = await db.dm_messages.find_one({"id": msg_id}, {"_id": 0, "from_id": 1, "to_id": 1, "reactions": 1})
    if not msg or me not in (msg.get("from_id"), msg.get("to_id")):
        raise HTTPException(404, "Messaggio non trovato")
    reactions = [r for r in (msg.get("reactions") or []) if r.get("user_id") != me]
    existing = next((r for r in (msg.get("reactions") or []) if r.get("user_id") == me), None)
    if not (existing and existing.get("emoji") == emoji):
        reactions.append({"user_id": me, "emoji": emoji})  # aggiungi/cambia; se stessa emoji -> toggle off
    await db.dm_messages.update_one({"id": msg_id}, {"$set": {"reactions": reactions}})
    return {"reactions": reactions}


# --- Notifiche Community (like/commenti sui propri post) ---
async def _notify(recipient_id, actor_id, ntype, post_id, actor_name, snippet):
    if not recipient_id or recipient_id == actor_id:
        return  # non notificare sé stessi
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": recipient_id, "actor_id": actor_id,
        "type": ntype, "post_id": post_id, "actor_name": actor_name,
        "snippet": (snippet or "")[:80], "read": False, "created_at": now_iso(),
    })


@api_router.get("/notifications")
async def notifications_list(user: dict = Depends(current_user)):
    docs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    unread = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})
    return {"items": docs, "unread": unread}


@api_router.post("/notifications/read")
async def notifications_read(user: dict = Depends(current_user)):
    await db.notifications.update_many({"user_id": user["user_id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


class AbsenceReq(BaseModel):
    kind: str = Field(..., max_length=20)   # 'malattia' | 'ferie'
    note: Optional[str] = Field("", max_length=500)
    dates: Optional[str] = Field("", max_length=120)


@api_router.post("/operator/absence")
async def operator_absence(body: AbsenceReq, user: dict = Depends(current_user)):
    label = "Ferie" if body.kind == "ferie" else "Malattia"
    actor_name = user.get("name") or user.get("email") or "Operatore"
    note = (body.note or "").strip()
    dates = (body.dates or "").strip()
    snippet = f"{label}" + (f" · {dates}" if dates else "") + (f" — {note}" if note else "")
    # Registra l'assenza per data → Sitor ricalcola il personale disponibile e i volumi.
    try:
        await db.lab_absences.insert_one({
            "user_id": user.get("user_id"), "name": actor_name, "kind": body.kind,
            "organization_id": _org_id(user),
            "date": datetime.now(timezone.utc).date().isoformat(), "at": now_iso(),
        })
    except Exception:
        pass
    owners = await db.users.find(
        {"$or": [{"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}, {"role": "admin"}]},
        {"_id": 0, "user_id": 1, "email": 1},
    ).to_list(100)
    for o in owners:
        await _notify(o.get("user_id"), user.get("user_id"), "absence", None, actor_name, snippet)
    try:
        if _resend and RESEND_API_KEY:
            html = f"<p><b>{actor_name}</b> ha inviato un avviso di <b>{label}</b>.</p>"
            if dates:
                html += f"<p>Periodo: {dates}</p>"
            if note:
                html += f"<p>Nota: {note}</p>"
            for o in owners:
                if o.get("email"):
                    await asyncio.to_thread(_resend.Emails.send, {
                        "from": f"MikiLab <{SENDER_EMAIL}>", "to": [o["email"]],
                        "subject": f"MikiLab · Avviso {label} da {actor_name}", "html": html,
                    })
    except Exception:
        pass
    return {"ok": True, "label": label}


class AccessInviteReq(BaseModel):
    max_uses: int = Field(1, ge=1, le=500)
    days: int = Field(30, ge=1, le=365)
    note: Optional[str] = Field("", max_length=80)


@api_router.post("/access/invites")
async def create_access_invite(body: AccessInviteReq, user: dict = Depends(require_admin)):
    token = secrets.token_urlsafe(18)
    doc = {"token": token, "created_by": user.get("email"), "created_at": now_iso(),
           "expires_at": (datetime.now(timezone.utc) + timedelta(days=body.days)).isoformat(),
           "max_uses": int(body.max_uses), "used": 0, "used_by": [], "note": body.note or "", "active": True}
    await db.access_invites.insert_one(dict(doc))
    return {"status": "success", "token": token, "expires_at": doc["expires_at"], "max_uses": doc["max_uses"]}


@api_router.get("/access/invites")
async def list_access_invites(user: dict = Depends(require_admin)):
    items = await db.access_invites.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"invites": items}


@api_router.post("/access/invites/{token}/revoke")
async def revoke_access_invite(token: str, user: dict = Depends(require_admin)):
    await db.access_invites.update_one({"token": token}, {"$set": {"active": False}})
    return {"status": "success"}


@api_router.post("/operator/invites")
async def create_operator_invite(user: dict = Depends(require_admin)):
    code = uuid.uuid4().hex[:8].upper()
    doc = {"code": code, "created_by": user.get("user_id"), "created_at": now_iso(), "used_by": None, "used_by_name": None, "used_at": None, "role": "operatore"}
    await db.operator_invites.insert_one(doc)
    return {"code": code}


@api_router.get("/operator/invites")
async def list_operator_invites(user: dict = Depends(require_admin)):
    items = await db.operator_invites.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"invites": items}


class RedeemReq(BaseModel):
    code: str = Field(..., max_length=32)


@api_router.post("/operator/redeem")
async def redeem_operator_invite(body: RedeemReq, user: dict = Depends(current_user)):
    code = (body.code or "").strip().upper()
    inv = await db.operator_invites.find_one({"code": code})
    if not inv:
        raise HTTPException(status_code=404, detail="Codice non valido")
    if inv.get("used_by") and inv.get("used_by") != user.get("user_id"):
        raise HTTPException(status_code=409, detail="Codice gia utilizzato")
    exp = inv.get("expires_at")
    if exp and now_iso() > exp:
        raise HTTPException(status_code=410, detail="Codice scaduto")
    new_role = inv.get("role") or "operatore"
    await db.operator_invites.update_one({"code": code}, {"$set": {"used_by": user.get("user_id"), "used_by_name": user.get("name") or user.get("email"), "used_at": now_iso()}})
    if user.get("role") != "admin":
        updates = {"role": new_role}
        if new_role == "sostituto":
            updates["sostituto_until"] = exp or (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
        await db.users.update_one({"user_id": user.get("user_id")}, {"$set": updates})
    return {"ok": True, "role": new_role if user.get("role") != "admin" else "admin"}




class AssignReq(BaseModel):
    email: str = Field(..., max_length=160)
    department: str = Field(..., max_length=40)






class OvenAlarmReq(BaseModel):
    room: Optional[str] = Field("", max_length=40)
    recipe: Optional[str] = Field("", max_length=160)
    minutes_unattended: Optional[int] = 2






class HolidayReq(BaseModel):
    active: bool = False


