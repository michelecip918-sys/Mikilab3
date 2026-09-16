"""iter255 — Coordinamento Automatico + Vista Autista.

Scenari testati:
  1) Coordinamento operatore: 2 operatori liberi abilitati; capo assente; primo RIFIUTA → il secondo riceve la chiamata; secondo ACCETTA → busy.
  2) Coordinamento macchina: qty sopra soglia + macchina disponibile → resolved=machine.
  3) Coordinamento proposta con capo presente → resolved=proposed → confirm → pending.
  4) Task scoperto: response_timeout_sec=5, un solo candidato che non risponde → dopo ~6s active mostra 'uncovered'; log elenca decisioni.
  5) Vista autista: creare consegne di oggi via /deliveries; /delivery/run le ordina per deadline; not_ready_count>0; PATCH /delivery/stop/{id}/status delivered=true.
"""
import os
import time
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.strip().split("=", 1)[1]
                        break
        except FileNotFoundError:
            pass
    assert v, "REACT_APP_BACKEND_URL non impostato"
    return v.rstrip("/")


BASE_URL = _load_backend_url()


def _free_all_workers_via_mongo():
    """Libera tutti gli operatori occupati (test setup)."""
    try:
        from pymongo import MongoClient
        mongo_url = None
        db_name = None
        with open("/app/backend/.env") as f:
            for line in f:
                if line.startswith("MONGO_URL="):
                    mongo_url = line.strip().split("=", 1)[1].strip('"').strip("'")
                elif line.startswith("DB_NAME="):
                    db_name = line.strip().split("=", 1)[1].strip('"').strip("'")
        if not mongo_url or not db_name:
            return
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
        db = client[db_name]
        db.worker_states.update_many(
            {"organization_id": "org_default"},
            {"$set": {"status": "free", "task_id": None, "step_order": None,
                      "task": None, "dept": None}})
    except Exception as e:
        print(f"[free_all_workers] {e}")
GATE_PIN = "198505"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"
DEPT = "pizzeria"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text}"
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    _free_all_workers_via_mongo()
    return s


def _free_operators(sess, need=2):
    """Ritorna nomi di operatori liberi presenti nel pool corrente."""
    r = sess.get(f"{BASE_URL}/api/operators/skills", timeout=15)
    assert r.status_code == 200, r.text
    ops = [o for o in r.json().get("operators", []) if o.get("status") == "free"]
    return ops[:need], r.json().get("operators", [])


def _cleanup_state(sess, ops):
    # svuota skills e stato busy per gli operatori di test
    for name in ops:
        sess.put(f"{BASE_URL}/api/operators/skills", json={"name": name, "departments": [], "is_driver": False}, timeout=10)
    # imposta capo_present_manual=None per non lasciare stato
    sess.put(f"{BASE_URL}/api/coordination/settings", json={"capo_present_manual": None, "response_timeout_sec": 30}, timeout=10)


# --- Coordinamento: scenario chiave (2 operatori, primo rifiuta → passa al 2°) ---
class TestCoordinationOperatorHandoff:
    def test_first_refuses_second_accepts(self, sess):
        _free_all_workers_via_mongo()
        free, _ = _free_operators(sess, 2)
        assert len(free) >= 2, f"Servono almeno 2 operatori liberi nel pool: {free}"
        op1, op2 = free[0]["name"], free[1]["name"]

        # 1) Abilita entrambi sullo stesso reparto
        for name in (op1, op2):
            r = sess.put(f"{BASE_URL}/api/operators/skills",
                         json={"name": name, "departments": [DEPT], "is_driver": False}, timeout=10)
            assert r.status_code == 200, r.text
            assert DEPT in r.json()["departments"]

        # 2) Capo ASSENTE, timeout largo
        r = sess.put(f"{BASE_URL}/api/coordination/settings",
                     json={"capo_present_manual": False, "response_timeout_sec": 30}, timeout=10)
        assert r.status_code == 200, r.text

        # 3) Trigger: qty piccola → non passa a macchina
        r = sess.post(f"{BASE_URL}/api/coordination/trigger",
                      json={"dept": DEPT, "task_desc": "TEST_infornata linea 2",
                            "qty": 5, "qty_unit": "kg"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["resolved"] == "pending", f"expected pending, got {data}"
        call = data["call"]
        call_id = call["id"]
        current = call["current_operator"]
        assert current in (op1, op2), f"current_operator {current} not in {op1},{op2}"
        # dovrebbe essere il PRIMO della coda
        first = call["queue"][0]
        assert current == first

        # 4) Primo RIFIUTA
        r = sess.post(f"{BASE_URL}/api/coordination/calls/{call_id}/respond",
                      json={"answer": "no", "operator": current}, timeout=10)
        assert r.status_code == 200, r.text
        after = r.json()["call"]
        assert after["status"] == "pending"
        second = after["current_operator"]
        assert second and second != current, f"expected different operator, got {second}"
        assert second in call["queue"]

        # 5) Secondo ACCETTA
        r = sess.post(f"{BASE_URL}/api/coordination/calls/{call_id}/respond",
                      json={"answer": "si", "operator": second}, timeout=10)
        assert r.status_code == 200, r.text
        acc = r.json()["call"]
        assert acc["status"] == "accepted"
        assert acc["resolved"]["type"] == "operator"
        assert acc["resolved"]["ref"] == second

        # 6) Board mostra busy
        r = sess.get(f"{BASE_URL}/api/worker/board", timeout=10)
        assert r.status_code == 200, r.text
        board = r.json()
        # struttura può variare; cerca l'operatore
        workers = board.get("board") or board.get("workers") or board.get("pool") or []
        # fallback: appiattisci qualsiasi lista di dict
        found = None
        for w in workers:
            if (w.get("name") or "").lower() == second.lower():
                found = w
                break
        assert found is not None, f"operatore {second} non trovato in board: keys={list(board.keys())} sample={workers[:2] if workers else board}"
        assert found.get("status") == "busy", f"stato atteso busy, got {found}"

        # cleanup: libera l'operatore accettato (worker state)
        # + rimuovi skills
        _cleanup_state(sess, [op1, op2])


# --- Coordinamento: macchina sopra soglia ---
class TestCoordinationMachine:
    def test_machine_over_threshold(self, sess):
        # accendi capo assente + accessi soglia default (25 kg)
        sess.put(f"{BASE_URL}/api/coordination/settings",
                 json={"capo_present_manual": False, "machine_threshold_kg": 25}, timeout=10)
        # assicura almeno una macchina 'spenta' (già default in _dept_machines_merged)
        # forza reset di tutte a spenta
        r = sess.get(f"{BASE_URL}/api/depts/{DEPT}/machines", timeout=10)
        assert r.status_code == 200
        machines = r.json()["machines"]
        payload = {"machines": [{"id": m["id"], "status": "spenta", "value": ""} for m in machines]}
        r = sess.post(f"{BASE_URL}/api/depts/{DEPT}/machines", json=payload, timeout=10)
        assert r.status_code == 200

        r = sess.post(f"{BASE_URL}/api/coordination/trigger",
                      json={"dept": DEPT, "task_desc": "TEST_macchina grande",
                            "qty": 50, "qty_unit": "kg"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["resolved"] == "machine", data
        assert data["machine"]["status"] == "spenta"


# --- Coordinamento: capo presente → proposta → confirm ---
class TestCoordinationProposal:
    def test_proposed_then_confirm(self, sess):
        free, _ = _free_operators(sess, 1)
        assert free, "serve un operatore libero"
        op = free[0]["name"]
        sess.put(f"{BASE_URL}/api/operators/skills",
                 json={"name": op, "departments": [DEPT], "is_driver": False}, timeout=10)
        r = sess.put(f"{BASE_URL}/api/coordination/settings",
                     json={"capo_present_manual": True, "response_timeout_sec": 30}, timeout=10)
        assert r.status_code == 200

        r = sess.post(f"{BASE_URL}/api/coordination/trigger",
                      json={"dept": DEPT, "task_desc": "TEST_proposta", "qty": 3, "qty_unit": "kg"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["resolved"] == "proposed", data
        call = data["call"]
        assert call["proposed_operator"]
        call_id = call["id"]

        r = sess.post(f"{BASE_URL}/api/coordination/proposals/{call_id}/confirm", timeout=10)
        assert r.status_code == 200, r.text
        c = r.json()["call"]
        assert c["status"] == "pending"
        assert c["current_operator"] == call["proposed_operator"]

        # cleanup: rifiuta la chiamata così l'operatore torna libero al termine
        sess.post(f"{BASE_URL}/api/coordination/calls/{call_id}/respond",
                  json={"answer": "no", "operator": c["current_operator"]}, timeout=10)
        _cleanup_state(sess, [op])


# --- Coordinamento: task scoperto per timeout ---
class TestCoordinationUncovered:
    def test_timeout_uncovered_and_log(self, sess):
        _free_all_workers_via_mongo()
        free, _ = _free_operators(sess, 1)
        assert free, "serve un operatore libero"
        op = free[0]["name"]
        sess.put(f"{BASE_URL}/api/operators/skills",
                 json={"name": op, "departments": [DEPT], "is_driver": False}, timeout=10)
        r = sess.put(f"{BASE_URL}/api/coordination/settings",
                     json={"capo_present_manual": False, "response_timeout_sec": 5}, timeout=10)
        assert r.status_code == 200, r.text
        r = sess.post(f"{BASE_URL}/api/coordination/trigger",
                      json={"dept": DEPT, "task_desc": "TEST_scoperto", "qty": 2, "qty_unit": "kg"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["resolved"] == "pending", f"expected pending, got {data}"
        call_id = data["call"]["id"]
        print("uncovered test call:", data["call"])

        # attende almeno 2 timeout consecutivi (queue può contenere più candidati)
        time.sleep(6)
        sess.get(f"{BASE_URL}/api/coordination/active", timeout=15)  # trigger refresh
        time.sleep(6)
        sess.get(f"{BASE_URL}/api/coordination/active", timeout=15)
        time.sleep(6)
        r = sess.get(f"{BASE_URL}/api/coordination/active", timeout=15)
        assert r.status_code == 200
        calls = r.json()["calls"]
        found = next((c for c in calls if c["id"] == call_id), None)
        assert found is not None, f"chiamata non trovata in active; calls={calls}"
        assert found["status"] == "uncovered", f"expected uncovered, got {found}"

        r = sess.get(f"{BASE_URL}/api/coordination/log", timeout=10)
        assert r.status_code == 200
        decisions = r.json()["decisions"]
        kinds = {d.get("kind") for d in decisions}
        assert "uncovered" in kinds
        _cleanup_state(sess, [op])


# --- Vista Autista ---
class TestDriverRun:
    def test_deliveries_and_run(self, sess):
        # crea 2 consegne con orari differenti
        c1 = {"client": "TEST_Cliente A", "address": "Via Roma 1",
              "deadline": "11:00", "van": "Furgone1",
              "items": [{"product": "TEST_prodotto_non_pianificato_zzz", "qty": 3}]}
        c2 = {"client": "TEST_Cliente B", "address": "Via Milano 2",
              "deadline": "09:30", "van": "Furgone1",
              "items": [{"product": "TEST_prodotto_non_pianificato_yyy", "qty": 5}]}
        r1 = sess.post(f"{BASE_URL}/api/deliveries", json=c1, timeout=10)
        r2 = sess.post(f"{BASE_URL}/api/deliveries", json=c2, timeout=10)
        assert r1.status_code == 200 and r2.status_code == 200, (r1.text, r2.text)
        id1 = r1.json()["delivery"]["id"]
        id2 = r2.json()["delivery"]["id"]

        r = sess.get(f"{BASE_URL}/api/delivery/run", timeout=10)
        assert r.status_code == 200, r.text
        run = r.json()
        stops = run["stops"]
        # solo le tappe test (potrebbero esserci altre); filtra
        test_stops = [s for s in stops if s["id"] in (id1, id2)]
        assert len(test_stops) == 2
        # ordine: la tappa 09:30 deve venire PRIMA di 11:00 in stops
        idx1 = next(i for i, s in enumerate(stops) if s["id"] == id2)  # 09:30
        idx2 = next(i for i, s in enumerate(stops) if s["id"] == id1)  # 11:00
        assert idx1 < idx2, "ordine non rispettato per deadline"
        # not_ready_count > 0 (prodotti non in piano di oggi)
        assert run["not_ready_count"] >= 1, run

        # segna consegnato
        r = sess.patch(f"{BASE_URL}/api/delivery/stop/{id1}/status", json={"delivered": True}, timeout=10)
        assert r.status_code == 200
        assert r.json()["delivered"] is True

        r = sess.get(f"{BASE_URL}/api/delivery/run", timeout=10)
        assert r.status_code == 200
        stops = r.json()["stops"]
        s1 = next(s for s in stops if s["id"] == id1)
        assert s1["delivered"] is True

        # cleanup
        sess.delete(f"{BASE_URL}/api/deliveries/{id1}", timeout=10)
        sess.delete(f"{BASE_URL}/api/deliveries/{id2}", timeout=10)
