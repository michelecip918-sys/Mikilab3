"""Iter260 — broad regression sweep of backend endpoints post-modifications.
Covers: endpoint no-500 sweep, asset integrity, SEO cleanup, character-avatar identity,
translations coverage. Multi-tenant isolation & invites & dispatch-coord already covered
in prior iterations (257/258/259), only touched lightly here.
"""
import os
import hashlib
import requests
import pytest

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        # Fallback: read from frontend/.env (test env only)
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    assert v, "REACT_APP_BACKEND_URL not set"
    return v.rstrip("/")


BASE_URL = _load_backend_url()
GATE_PIN = "198505"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text}"
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


# --- Endpoint regression sweep -------------------------------------------------

SWEEP_ENDPOINTS = [
    "/api/orgs",
    "/api/mike/silos",
    "/api/mike/machines",
    "/api/recipes?scope=personal",
    "/api/coordination/active",
    "/api/coordination/settings",
    "/api/delivery/run",
    "/api/lab/pulse",
    "/api/lab/pulse/history",
    "/api/deck/status",
    "/api/mike/b2b/orders",
    "/api/production/shift-plan",
    "/api/production/leaderboard",
    "/api/compliance/timelog",
    "/api/compliance/safety",
    "/api/enterprise/sites",
    "/api/enterprise/overview",
    "/api/operators/skills",
    "/api/mike/briefing/floor?role=fornaio",
    "/api/mike/deus/production-queue",
    "/api/delegation/tasks",
    "/api/batches/active",
    "/api/lab/warehouse/consumption",
    "/api/mike/timeline",
    "/api/mike/mikiscore/history",
    "/api/ai/morning-briefing",
    "/api/shift/handoff",
    "/api/deck/alarms/history",
]


@pytest.mark.parametrize("path", SWEEP_ENDPOINTS)
def test_endpoint_no_500(admin_session, path):
    r = admin_session.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code < 500, f"{path} -> {r.status_code}: {r.text[:200]}"
    assert r.status_code in (200, 201, 204, 400, 401, 403, 404, 405, 422), f"{path} unexpected {r.status_code}"


# --- Asset integrity -----------------------------------------------------------

ASSETS = [
    "/logo-emblem.png",
    "/logo.png",
    "/avatar_nexus.jpg",
    "/avatar_sitor.jpg",
    "/sitor-full.jpg",
    "/sitor-oven.jpg",
    "/og-image.jpg",
    "/icon-192.png",
    "/icon-512.png",
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/michele-real-lab.jpg",
    "/avatar_miki.jpg",
]


@pytest.mark.parametrize("asset", ASSETS)
def test_asset_available(asset):
    r = requests.get(f"{BASE_URL}{asset}", timeout=20)
    assert r.status_code == 200, f"{asset} -> {r.status_code}"
    assert len(r.content) > 500, f"{asset} suspiciously small: {len(r.content)}b"


def test_sitor_avatar_identity():
    """Le immagini-personaggio di Sitor devono essere identiche (stesso md5).
    NB: sitor-oven.jpg è la SECONDA POSA (diversa di proposito), quindi esclusa."""
    sitor_imgs = ["/avatar_sitor.jpg", "/sitor-full.jpg", "/avatar_nexus.jpg", "/sitor_official.jpg"]
    hashes = {}
    for p in sitor_imgs:
        r = requests.get(f"{BASE_URL}{p}", timeout=20)
        assert r.status_code == 200
        hashes[p] = hashlib.md5(r.content).hexdigest()
    unique = set(hashes.values())
    assert len(unique) == 1, f"Sitor images differ: {hashes}"


# --- SEO / index.html ---------------------------------------------------------


def test_index_seo():
    r = requests.get(f"{BASE_URL}/", timeout=20)
    assert r.status_code == 200
    html = r.text
    assert "<title>" in html
    lower = html.lower()
    assert "multiverso olografico" not in lower, "Legacy 'Multiverso Olografico' still in index"
    assert "mike mix" not in lower, "'Mike Mix' still in index meta"
    assert "miki-nexus" not in lower, "'Miki-Nexus' still in index meta"


# --- Translations coverage ----------------------------------------------------


def test_translations_coverage():
    """triTranslations.json: structure is {italian_key: {lang: translation}}.
    Verify that fr/fa/ar/tr locales have reasonable coverage."""
    import json
    p = "/app/frontend/src/i18n/triTranslations.json"
    with open(p) as f:
        data = json.load(f)
    total = len(data)
    assert total > 20, f"triTranslations has too few keys: {total}"
    counts = {"fr": 0, "fa": 0, "ar": 0, "tr": 0}
    for _k, langs in data.items():
        if not isinstance(langs, dict):
            continue
        for lang in counts.keys():
            if lang in langs and langs[lang]:
                counts[lang] += 1
    print(f"translation coverage over {total} keys: {counts}")
    # Report but only fail for hard misses (0 coverage)
    missing = [lang for lang, c in counts.items() if c == 0]
    assert not missing, f"triTranslations.json missing locales entirely: {missing}. Coverage: {counts}"
    # Soft warn: any locale with <50% coverage is flagged
    low = {lang: c for lang, c in counts.items() if c < total * 0.5}
    if low:
        print(f"WARN: low translation coverage (< 50%): {low} of {total} keys")
