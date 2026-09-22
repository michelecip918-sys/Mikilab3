import { useState, useEffect } from "react";
import { api } from "@/lib/api";

// U1a: legge una sola volta gli interruttori pubblici e il livello di risparmio.
let _cache = null;
let _promise = null;

export function loadFeatures() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = api.get("/features").then((r) => { _cache = r.data || {}; try { window.__mikilabFeatures = _cache; } catch { /* */ } return _cache; }) // V93
      .catch(() => ({ FEATURE_PHOTO_DIAG: false, FEATURE_PLAN: true, FEATURE_LIVE: true, FEATURE_VOICE_CHAT: true, savings_level: 0 }));
  }
  return _promise;
}

export function useFeatures() {
  const [f, setF] = useState(_cache || { FEATURE_PHOTO_DIAG: false, FEATURE_PLAN: true, FEATURE_LIVE: true, FEATURE_VOICE_CHAT: true, savings_level: 0 });
  useEffect(() => { let ok = true; loadFeatures().then((d) => { if (ok) setF(d); }); return () => { ok = false; }; }, []);
  return f;
}
