"""Diagnostic: compare capo/plan SSE over public ingress vs internal port."""
import json
import os
import sys
import time

import requests
from dotenv import dotenv_values

BASE = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
INTERNAL = "http://localhost:8001"

BODY = {
    "items": [{"name": "Pane di grano duro", "quantity": 30, "unit": "kg"}],
    "mixers": [{"name": "Spirale 40", "capacity_kg": 40, "type": "spirale"}],
    "cells": [{"name": "Cella 1", "type": "lievitazione", "temp_c": 16, "contents": "pane"}],
    "staff": 2,
    "start_time": "05:00",
    "lab_temp_c": 29,
    "standard_temp_c": 26,
    "lang": "it",
}


def run(base):
    t0 = time.time()
    chunks = 0
    chars = 0
    done = False
    try:
        with requests.post(f"{base}/api/capo/plan", json=BODY, stream=True, timeout=300) as r:
            print(base, "status", r.status_code, r.headers.get("content-type"))
            for raw in r.iter_lines(decode_unicode=True):
                if not raw or not raw.startswith("data:"):
                    continue
                obj = json.loads(raw[5:].strip())
                if obj.get("done"):
                    done = True
                    break
                chunks += 1
                chars += len(obj.get("d", ""))
    except Exception as e:
        print("EXCEPTION:", type(e).__name__, e)
    print(f"{base} -> chunks={chunks} chars={chars} done={done} elapsed={time.time()-t0:.1f}s")


if __name__ == "__main__":
    run(INTERNAL)
    run(BASE)
