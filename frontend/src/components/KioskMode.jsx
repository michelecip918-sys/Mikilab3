import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Tablet, Maximize2, Download, Share, Plus, X, Power, Lock, Delete, ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { adminGateApi } from "@/lib/api";

const KIOSK_KEY = "mikilab_kiosk";
const WIZARD_KEY = "mikilab_kiosk_wizard_seen";
const GATE_OK_KEY = "mikilab_admin_gate_ok";
const PUB = process.env.PUBLIC_URL;

const isStandalone = () =>
  (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  (typeof navigator !== "undefined" && navigator.standalone === true);
const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Modalità Tablet / Kiosk (mod. 59): schermo intero + schermo sempre acceso per i tablet del laboratorio.
export default function KioskMode() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [kiosk, setKiosk] = useState(() => { try { return localStorage.getItem(KIOSK_KEY) === "1"; } catch { return false; } });
  const [resume, setResume] = useState(() => { try { return localStorage.getItem(KIOSK_KEY) === "1"; } catch { return false; } });
  const [installed, setInstalled] = useState(isStandalone());
  const [deferred, setDeferred] = useState(null);
  const [iosHelp, setIosHelp] = useState(false);
  const [holdPct, setHoldPct] = useState(0);
  const [exitPinOpen, setExitPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const wlRef = useRef(null);
  const holdRef = useRef(null);

  // PWA install prompt
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  // Auto-Kiosk Wizard: alla prima apertura su un dispositivo nuovo apre il wizard Tablet una sola volta.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(WIZARD_KEY) === "1"; } catch { /* */ }
    if (seen || kiosk || isStandalone()) return;
    const t = setTimeout(() => {
      setOpen(true);
      try { localStorage.setItem(WIZARD_KEY, "1"); } catch { /* */ }
    }, 3200);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wlRef.current = await navigator.wakeLock.request("screen");
        wlRef.current.addEventListener?.("release", () => { wlRef.current = null; });
      }
    } catch { /* */ }
  }, []);

  // Ri-acquisisce il wake lock quando il tablet torna in primo piano
  useEffect(() => {
    if (!kiosk) return;
    const onVis = () => { if (document.visibilityState === "visible") acquireWakeLock(); };
    document.addEventListener("visibilitychange", onVis);
    const onFsExit = () => { if (!document.fullscreenElement && kiosk) { /* utente uscito dal fullscreen: resta in kiosk logico */ } };
    document.addEventListener("fullscreenchange", onFsExit);
    return () => { document.removeEventListener("visibilitychange", onVis); document.removeEventListener("fullscreenchange", onFsExit); };
  }, [kiosk, acquireWakeLock]);

  const enterKiosk = useCallback(async () => {
    try { await (document.documentElement.requestFullscreen?.() || Promise.resolve()); } catch { /* */ }
    try { await window.screen?.orientation?.lock?.("landscape"); } catch { /* orientation lock non supportato */ }
    await acquireWakeLock();
    try { localStorage.setItem(KIOSK_KEY, "1"); } catch { /* */ }
    setKiosk(true); setResume(false); setOpen(false);
  }, [acquireWakeLock]);

  const exitKiosk = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* */ }
    try { await wlRef.current?.release?.(); } catch { /* */ }
    wlRef.current = null;
    try { window.screen?.orientation?.unlock?.(); } catch { /* */ }
    try { localStorage.removeItem(KIOSK_KEY); } catch { /* */ }
    setKiosk(false); setResume(false); setHoldPct(0);
  }, []);

  // Uscita anti-tocco accidentale: tieni premuto ~1.2s -> chiede il PIN del Capo
  const startHold = () => {
    const started = Date.now();
    holdRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / 1200) * 100);
      setHoldPct(pct);
      if (pct >= 100) { clearInterval(holdRef.current); holdRef.current = null; setHoldPct(0); setPin(""); setPinErr(false); setExitPinOpen(true); }
    }, 40);
  };
  const cancelHold = () => { if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; } setHoldPct(0); };

  // Verifica PIN Capo (server + fallback offline sull'ultimo PIN valido salvato) prima di uscire dal Kiosk
  const tryExitPin = async (val) => {
    setPinBusy(true);
    let ok = false;
    try {
      const res = await adminGateApi.verify(val);
      ok = !!(res && res.ok);
    } catch {
      try { ok = val === localStorage.getItem(GATE_OK_KEY); } catch { ok = false; }
    }
    setPinBusy(false);
    if (ok) { setExitPinOpen(false); setPin(""); exitKiosk(); }
    else { setPinErr(true); setPin(""); }
  };
  const pushPin = (d) => {
    if (pin.length >= 4 || pinBusy) return;
    const next = pin + d;
    setPin(next); setPinErr(false);
    if (next.length === 4) setTimeout(() => tryExitPin(next), 120);
  };

  const installClick = async () => {
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch { /* */ } setDeferred(null); return; }
    setIosHelp(true);
  };

  // Badge kiosk attivo (o pulsante "riprendi" dopo un reload, perché il fullscreen richiede un tocco)
  const kioskBadge = (kiosk || resume) && (
    <div data-testid="kiosk-badge" className="fixed bottom-3 left-3 z-[9998] flex items-center gap-2">
      {resume ? (
        <button data-testid="kiosk-resume-btn" onClick={enterKiosk}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0C1019] border border-[#FF6B00]/50 text-[#FF6B00] text-xs font-bold shadow-[0_0_16px_rgba(255,107,0,0.25)] active:scale-95 transition-all">
          <Maximize2 className="w-4 h-4" /> {tri("Riprendi Kiosk", "Kiosk fortsetzen", "Resume Kiosk", "Reanudar Kiosk", "Reprendre Kiosk", "ادامه کیوسک")}
        </button>
      ) : (
        <button
          data-testid="kiosk-exit-btn"
          onPointerDown={startHold} onPointerUp={cancelHold} onPointerLeave={cancelHold} onPointerCancel={cancelHold}
          className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0C1019] border border-[#FF6B00]/40 text-white text-xs font-bold overflow-hidden select-none active:scale-95 transition-all"
          title={tri("Tieni premuto per uscire", "Zum Beenden gedrückt halten", "Hold to exit", "Mantén pulsado para salir", "Maintiens pour quitter", "برای خروج نگه دار")}
        >
          <span className="absolute inset-y-0 left-0 bg-[#FF6B00]/25 transition-none" style={{ width: `${holdPct}%` }} />
          <span className="relative flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
            <Lock className="w-3.5 h-3.5 text-[#FF6B00]" />
            {tri("KIOSK · tieni premuto · serve il PIN Capo", "KIOSK · halten · Capo-PIN nötig", "KIOSK · hold · Capo PIN required", "KIOSK · mantén · PIN del Capo", "KIOSK · maintiens · PIN du Capo", "کیوسک · نگه دار · PIN کاپو")}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <>
      {!kiosk && (
        <button data-testid="kiosk-chip" onClick={() => setOpen(true)} title={tri("Modalità Tablet", "Tablet-Modus", "Tablet Mode", "Modo Tablet", "Mode Tablette", "حالت تبلت")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] font-bold text-xs hover:bg-[#FF6B00]/20 active:scale-95 transition-all">
          <Tablet className="w-3.5 h-3.5" /> <span className="hidden md:inline">{tri("Tablet", "Tablet", "Tablet", "Tablet", "Tablette", "تبلت")}</span>
        </button>
      )}

      {createPortal(<>{kioskBadge}</>, document.body)}

      {exitPinOpen && createPortal(
        <div data-testid="kiosk-exit-pin" className="fixed inset-0 z-[145] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => { setExitPinOpen(false); setPin(""); setPinErr(false); }}>
          <div className="w-full max-w-xs rounded-3xl bg-[#060A10] border border-[#FF6B00]/25 shadow-[0_0_40px_rgba(255,107,0,0.2)] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden border border-[#FF6B00]/40 bg-[#030712] mb-3 flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <h3 className="font-cyber text-base font-black tracking-wide text-white uppercase">{tri("Uscita Kiosk", "Kiosk verlassen", "Exit Kiosk", "Salir de Kiosk", "Quitter Kiosk", "خروج از کیوسک")}</h3>
            <p className="mt-1.5 text-xs text-[#94A3B8] flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00]" /> {tri("Inserisci il PIN del Capo", "Capo-PIN eingeben", "Enter the Capo PIN", "Introduce el PIN del Capo", "Saisis le PIN du Capo", "PIN کاپو را وارد کن")}</p>

            <div className={`mt-5 flex justify-center gap-3 ${pinErr ? "animate-shake" : ""}`}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} data-testid={`kiosk-pin-dot-${i}`} className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${pin.length > i ? "bg-[#FF6B00] border-[#FF6B00]" : "border-[#334155]"}`} />
              ))}
            </div>
            {pinErr && <p data-testid="kiosk-pin-error" className="mt-3 text-xs font-bold text-red-400">{tri("PIN errato. Riprova.", "Falscher PIN. Nochmal.", "Wrong PIN. Try again.", "PIN incorrecto. Reintenta.", "PIN incorrect. Réessaie.", "PIN اشتباه است.")}</p>}

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} data-testid={`kiosk-pin-key-${n}`} onClick={() => pushPin(String(n))}
                  className="h-14 rounded-2xl bg-[#0C1019] border border-[#1e293b] text-xl font-bold text-white hover:border-[#FF6B00] active:scale-95 transition-all">{n}</button>
              ))}
              <button data-testid="kiosk-pin-cancel" onClick={() => { setExitPinOpen(false); setPin(""); setPinErr(false); }} className="h-14 rounded-2xl bg-[#0C1019] border border-[#1e293b] text-[#64748B] hover:border-[#FF6B00] active:scale-95 transition-all flex items-center justify-center"><X className="w-5 h-5" /></button>
              <button data-testid="kiosk-pin-key-0" onClick={() => pushPin("0")} className="h-14 rounded-2xl bg-[#0C1019] border border-[#1e293b] text-xl font-bold text-white hover:border-[#FF6B00] active:scale-95 transition-all">0</button>
              <button data-testid="kiosk-pin-back" onClick={() => setPin((p) => p.slice(0, -1))} className="h-14 rounded-2xl bg-[#0C1019] border border-[#1e293b] text-[#64748B] hover:border-[#FF6B00] active:scale-95 transition-all flex items-center justify-center"><Delete className="w-5 h-5" /></button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {open && createPortal(
        <div data-testid="kiosk-modal" className="fixed inset-0 z-[130] overflow-y-auto bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="min-h-full flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#060A10] border border-[#FF6B00]/25 shadow-[0_0_40px_rgba(255,107,0,0.15)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl overflow-hidden border border-[#FF6B00]/40 bg-[#030712] shrink-0">
                  <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
                </span>
                <h3 className="font-cyber text-lg font-black tracking-wide text-white uppercase">{tri("Modalità Tablet", "Tablet-Modus", "Tablet Mode", "Modo Tablet", "Mode Tablette", "حالت تبلت")}</h3>
              </div>
              <button data-testid="kiosk-modal-close" onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-[#94A3B8] mb-5">{tri(
              "Prepara MikiLab per i tablet del laboratorio: schermo intero e sempre acceso, a mani libere.",
              "MikiLab für die Backstuben-Tablets: Vollbild und Display bleibt an, freihändig.",
              "Set up MikiLab for the lab tablets: full-screen and always-on display, hands-free.",
              "Prepara MikiLab para los tablets del obrador: pantalla completa y siempre encendida.",
              "Prépare MikiLab pour les tablettes du labo : plein écran et écran toujours allumé.",
              "میکی‌لب را برای تبلت‌های آزمایشگاه آماده کن: تمام‌صفحه و همیشه‌روشن.")}</p>

            {/* Step 1 — Installa app */}
            <div className="rounded-2xl bg-[#0C1019] border border-[#1e293b] p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black flex items-center justify-center">1</span>
                <span className="text-sm font-bold text-white">{tri("Installa l'app", "App installieren", "Install the app", "Instala la app", "Installe l'app", "نصب اپ")}</span>
                {installed && <span className="ml-auto text-[10px] font-bold text-[#39d98a]">✓ {tri("Installata", "Installiert", "Installed", "Instalada", "Installée", "نصب‌شده")}</span>}
              </div>
              {!installed && (
                <button data-testid="kiosk-install-btn" onClick={installClick}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/40 text-[#FF6B00] font-bold text-sm hover:bg-[#FF6B00]/20 active:scale-95 transition-all">
                  <Download className="w-4 h-4" /> {tri("Installa App", "App installieren", "Install App", "Instalar App", "Installer l'App", "نصب اپ")}
                </button>
              )}
            </div>

            {/* Step 2 — Avvia Kiosk */}
            <div className="rounded-2xl bg-[#0C1019] border border-[#1e293b] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black flex items-center justify-center">2</span>
                <span className="text-sm font-bold text-white">{tri("Avvia modalità Kiosk", "Kiosk-Modus starten", "Start Kiosk mode", "Inicia modo Kiosk", "Démarre le mode Kiosk", "شروع حالت کیوسک")}</span>
              </div>
              <p className="text-[11px] text-[#64748B] mb-3">{tri(
                "Schermo intero + display sempre acceso. Per uscire, tieni premuto il badge in basso a sinistra.",
                "Vollbild + Display bleibt an. Zum Beenden das Badge unten links gedrückt halten.",
                "Full-screen + display stays on. To exit, hold the badge at bottom-left.",
                "Pantalla completa + display siempre encendido. Para salir, mantén pulsado el badge abajo a la izquierda.",
                "Plein écran + écran toujours allumé. Pour quitter, maintiens le badge en bas à gauche.",
                "تمام‌صفحه + نمایشگر همیشه‌روشن. برای خروج، نشان پایین‌چپ را نگه دار.")}</p>
              <button data-testid="kiosk-start-btn" onClick={enterKiosk}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-[#FF6B00]/25 to-[#FF6B00]/10 border border-[#FF6B00]/60 text-[#FF6B00] font-black text-sm shadow-[0_0_18px_rgba(255,107,0,0.25)] hover:from-[#FF6B00]/35 active:scale-95 transition-all">
                <Power className="w-4 h-4" /> {tri("Avvia Kiosk", "Kiosk starten", "Start Kiosk", "Iniciar Kiosk", "Démarrer Kiosk", "شروع کیوسک")}
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {iosHelp && createPortal(
        <div data-testid="kiosk-ios-help" className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center bg-black/75 p-4" onClick={() => setIosHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#060A10] border border-[#1e293b] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-white">{tri("Aggiungi a Home", "Zum Home hinzufügen", "Add to Home", "Añadir a inicio", "Ajouter à l'accueil", "افزودن به صفحه اصلی")}</h3>
              <button onClick={() => setIosHelp(false)} className="text-[#64748B] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <ol className="space-y-2 text-sm text-[#cbd5e1]">
              <li className="flex items-center gap-2"><Share className="w-4 h-4 text-[#FF6B00]" /> {tri("Tocca «Condividi» nel browser", "Tippe auf «Teilen»", "Tap «Share» in the browser", "Toca «Compartir»", "Touche «Partager»", "روی «اشتراک» بزن")}</li>
              <li className="flex items-center gap-2"><Plus className="w-4 h-4 text-[#FF6B00]" /> {tri("Scegli «Aggiungi a Home»", "Wähle «Zum Home-Bildschirm»", "Choose «Add to Home Screen»", "Elige «Añadir a inicio»", "Choisis «Sur l'écran d'accueil»", "«افزودن به صفحه اصلی» را انتخاب کن")}</li>
            </ol>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
