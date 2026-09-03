/* ============================================================================
   MIKILAB OS v10.3 - ULTIMATE 3D BAKERY ENTERPRISE EDITION (Miki & Mohamed)
   UI: Real Photos + Real Radio (RAI stream) + DB Recipes + Push Notifications
   Reso come overlay a schermo intero (createPortal) con Chiudi + ESC.
   ============================================================================ */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLang } from '@/i18n/LanguageContext';

const APP_LANG_TO_TTS = { it: 'it-IT', de: 'de-DE', en: 'en-US', es: 'es-ES', fr: 'fr-FR', fa: 'fa-IR' };

const API = process.env.REACT_APP_BACKEND_URL;
// Stazioni reali della "Radio del Fornaio" (sottoinsieme di RadioFornaio.jsx)
const RADIO_STATIONS = [
  { id: 'rai1', name: 'RAI Radio 1', url: 'https://icestreaming.rai.it/1.mp3' },
  { id: 'rai2', name: 'RAI Radio 2', url: 'https://icestreaming.rai.it/2.mp3' },
  { id: 'rai3', name: 'RAI Radio 3', url: 'https://icestreaming.rai.it/3.mp3' },
  { id: 'r105', name: 'Radio 105', url: 'https://icy.unitedradio.it/Radio105.mp3' },
  { id: 'virgin', name: 'Virgin Radio', url: 'https://icy.unitedradio.it/Virgin.mp3' },
  { id: 'rmc', name: 'Radio Monte Carlo', url: 'https://icy.unitedradio.it/RMC.mp3' },
  { id: 'swr3', name: 'SWR3 (DE)', url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3' },
  { id: 'classicfm', name: 'Classic FM (UK)', url: 'https://media-ssl.musicradio.com/ClassicFMMP3' },
];

const ROOM_IDS = ['panetteria', 'pizzeria', 'pasticceria'];
const DEPT_LABELS = { panetteria: 'Panetteria', pizzeria: 'Pizzeria', pasticceria: 'Pasticceria', impasti: 'Panetteria', forni: 'Panetteria', laugen: 'Panetteria', banco: 'Panetteria', pretzel: 'Panetteria' };

export default function MikiLabEliteEngine({ open, onClose, locked = false, lockedDept = '', isCapo = false, readOnly = false }) {
  const hasValidDept = ROOM_IDS.includes(lockedDept);
  const isLocked = locked; // operatore/sostituto: sempre bloccato (fail-closed anche senza reparto valido)
  const { lang: appLang } = useLang();
  const [activeTab, setActiveTab] = useState(locked && hasValidDept ? lockedDept : 'panetteria');
  const [language, setLanguage] = useState(APP_LANG_TO_TTS[appLang] || 'it-IT');
  const [workMode, setWorkMode] = useState(() => { try { return localStorage.getItem('mikilab_work_mode') || 'solo'; } catch { return 'solo'; } });
  const [crew, setCrew] = useState([]);
  const [holiday, setHoliday] = useState(false);
  const [alarmUnattended, setAlarmUnattended] = useState(false); // allarme forno incustodito
  const alarmTimerRef = useRef(null);
  const changeWorkMode = (m) => { setWorkMode(m); try { localStorage.setItem('mikilab_work_mode', m); } catch { /* */ } };

  // Sincronizza la lingua del motore con la lingua dell'app
  useEffect(() => { setLanguage(APP_LANG_TO_TTS[appLang] || 'it-IT'); }, [appLang]);
  const [batchKg, setBatchKg] = useState(50);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [stationId, setStationId] = useState('rai1');
  const [modalOpen, setModalOpen] = useState(null);

  // Ricette reali dal DB MikiLab
  const [dbRecipes, setDbRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  // Timer Forno Reale con Allarme Persistente + Notifica Push
  const [timerSeconds, setTimerSeconds] = useState(1080); // 18 minuti
  const [isBaking, setIsBaking] = useState(false);
  const [ovenTemp, setOvenTemp] = useState(240);       // °C dal DB ricetta
  const [ovenRecipeName, setOvenRecipeName] = useState(''); // ricetta che pilota il forno

  const radioRef = useRef(null);

  // Blocco Operatore: quando l'engine si apre in modalità bloccata, forza il reparto assegnato.
  useEffect(() => {
    if (open && locked && hasValidDept) setActiveTab(lockedDept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locked, hasValidDept, lockedDept]);

  // Pannello Capo: carica la squadra (operai) quando serve.
  useEffect(() => {
    if (!open || !isCapo || workMode !== 'squadra' || !API) return;
    fetch(`${API}/api/operator/crew`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { crew: [] })
      .then(d => setCrew(Array.isArray(d.crew) ? d.crew : []))
      .catch(() => setCrew([]));
  }, [open, isCapo, workMode]);

  const speakVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const playBeepAlert = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); }, 1500);
    } catch (e) { console.log("Audio non supportato automaticamente"); }
  };

  // Notifica push del telefono a fine cottura (Web Notifications API)
  const pushOvenDone = () => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification("🔥 MikiLab — Forno", {
          body: "Cottura completata! Sfornare subito.",
          icon: "/icon-192.png",
          tag: "mikilab-oven",
          renotify: true
        });
        setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
      }
    } catch (e) { /* no-op */ }
  };

  useEffect(() => {
    let interval = null;
    if (isBaking && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0 && isBaking) {
      setIsBaking(false);
      speakVoice("Allarme forno! Cottura completata, sfornare subito!");
      playBeepAlert();
      pushOvenDone();
      // Allarme Forno Prioritario: parte il conteggio "incustodito" (2 min → notifica al Capo)
      setAlarmUnattended(true);
      if (alarmTimerRef.current) clearTimeout(alarmTimerRef.current);
      alarmTimerRef.current = setTimeout(() => {
        try {
          if (API) fetch(`${API}/api/oven/alarm`, {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: (rooms3D[activeTab] && rooms3D[activeTab].title) || 'Forno', recipe: ovenRecipeName, minutes_unattended: 2 })
          }).catch(() => {});
          speakVoice("Attenzione: allarme forno non gestito. Notifico il Capo.");
        } catch (e) { /* */ }
      }, 120000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBaking, timerSeconds]);

  // Ferma l'escalation allarme quando l'engine si chiude
  useEffect(() => { if (!open && alarmTimerRef.current) { clearTimeout(alarmTimerRef.current); alarmTimerRef.current = null; setAlarmUnattended(false); } }, [open]);

  // Modalità Ferie: stato corrente
  useEffect(() => {
    if (!open || !API) return;
    fetch(`${API}/api/lab/holiday`).then(r => r.ok ? r.json() : {}).then(d => setHoliday(!!d.active)).catch(() => {});
  }, [open]);

  const toggleHoliday = async () => {
    const next = !holiday; setHoliday(next);
    try {
      const res = await fetch(`${API}/api/lab/holiday`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: next }) });
      if (!res.ok) { setHoliday(!next); return; }
      window.dispatchEvent(new Event('mikilab-holiday-changed'));
    } catch (e) { setHoliday(!next); }
  };

  const ackAlarm = () => { setAlarmUnattended(false); if (alarmTimerRef.current) { clearTimeout(alarmTimerRef.current); alarmTimerRef.current = null; } speakVoice("Allarme forno tacitato."); };

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // Carica le ricette reali dal DB MikiLab all'apertura
  useEffect(() => {
    if (!open || dbRecipes.length || !API) return;
    fetch(`${API}/api/recipes?collection_name=mikilab`)
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        if (Array.isArray(list) && list.length) {
          setDbRecipes(list);
          setSelectedRecipeId(list[0].id);
        }
      })
      .catch(() => { /* offline: resta sui default */ });
  }, [open, dbRecipes.length]);

  // Ferma la radio quando si chiude l'overlay
  useEffect(() => {
    if (!open && radioRef.current) { radioRef.current.pause(); setRadioPlaying(false); }
  }, [open]);

  // BINDING Ricetta → Forno: la ricetta scelta popola minuti e temperatura del forno
  useEffect(() => {
    const r = dbRecipes.find(x => x.id === selectedRecipeId);
    if (!r) return;
    if (r.bake_minutes) { setTimerSeconds(Math.round(r.bake_minutes * 60)); setIsBaking(false); }
    if (r.bake_temp) setOvenTemp(r.bake_temp);
    setOvenRecipeName(r.name || '');
  }, [selectedRecipeId, dbRecipes]);

  const currentStation = RADIO_STATIONS.find(s => s.id === stationId) || RADIO_STATIONS[0];

  const playStation = (st) => {
    if (!radioRef.current) radioRef.current = new Audio();
    const a = radioRef.current;
    a.src = st.url;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    setRadioPlaying(true);
  };

  const toggleRadio = () => {
    if (!radioRef.current) radioRef.current = new Audio();
    const a = radioRef.current;
    if (radioPlaying) {
      a.pause();
      setRadioPlaying(false);
      speakVoice("Radio panificio spenta");
    } else {
      playStation(currentStation);
      speakVoice(`Radio del Fornaio: ${currentStation.name}`);
    }
  };

  const changeStation = (id) => {
    const st = RADIO_STATIONS.find(s => s.id === id) || RADIO_STATIONS[0];
    setStationId(id);
    if (radioPlaying) { playStation(st); speakVoice(st.name); }
  };

  useEffect(() => () => { try { if (radioRef.current) radioRef.current.pause(); } catch (e) {} }, []);

  // 3 MACRO-AREE UNIFICATE (v31.0): Panetteria, Pizzeria (con Consegne), Pasticceria & Gelateria
  const rooms3D = {
    panetteria: {
      title: "🍞 CENTRO PANETTERIA & IMPASTI 3D",
      color: "#5E8CA8",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #1B2A38 55%, #3E9C93 100%)",
      avatarName: "Michele (Maestro Panettiere)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Impasti, forni e linea Laugen sincronizzati!",
      item3D: "📦 Silos Farina, Impastatrice & Forni",
      desc: "Impasti ad alta idratazione, forni, Laugen/Pretzel, fermentazione predittiva e Centro Formule",
      features: ["Gestione Impastatore", "Forno Principale", "Laugen / Pretzel", "Fermentazione Predittiva", "Centro Formule"]
    },
    pizzeria: {
      title: "🍕 REPARTO PIZZERIA & TEGLIE 3D",
      color: "#3E9C93",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #14212C 55%, #5E8CA8 100%)",
      avatarName: "Michele (Maestro Pizzaiolo)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Teglie, forno pizze e consegne in sincrono!",
      item3D: "🔥 Forno Pizze & Ceste per la Consegna",
      desc: "Impasti pizza, teglie, sfornate sincronizzate e gestione consegne (Lieferung / Ceste)",
      features: ["Gestione Teglie & Impasti Pizza", "Forno Pizze", "Sfornate Sincronizzate", "Gestione Consegne (Lieferung / Ceste)"]
    },
    pasticceria: {
      title: "🥐 LABORATORIO PASTICCERIA & GELATERIA 3D",
      color: "#7FB0A6",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #1B2A38 55%, #7FB0A6 100%)",
      avatarName: "Michele (Maestro Pasticcere)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Laminazione, abbattitore e formule dolci in azione!",
      item3D: "🧊 Abbattitore -35°C & Sfogliatrice",
      desc: "Ricette dolci, bilanciamento formule, abbattitore e controllo tempi di raffreddamento",
      features: ["Generatori Ricette Dolci", "Bilanciamento Formule", "Abbattitore & Forni Pasticceria", "Controllo Tempi Raffreddamento"]
    }
  };

  const currentRoom = rooms3D[activeTab];
  const _lc = (language || 'it-IT').slice(0, 2);
  const _pick = (it, de, en, es, fr, fa) => ({ it, de, en, es, fr, fa }[_lc] || it);
  const lockLabel = _pick("Reparto assegnato", "Zugewiesene Abteilung", "Assigned department", "Departamento asignado", "Rayon assigné", "بخش تعیین‌شده");
  const noDeptLabel = _pick("Reparto non ancora assegnato — chiedi al Capo", "Noch keine Abteilung — frag den Chef", "No department yet — ask the Capo", "Sin departamento — pide al Capo", "Aucun rayon — demande au Chef", "بخش تعیین نشده — از سرآشپز بپرس");

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Dosi dinamiche: usa l'idratazione REALE della ricetta selezionata dal DB (fallback 68%)
  const selectedRecipe = dbRecipes.find(r => r.id === selectedRecipeId) || null;
  const hydration = selectedRecipe && selectedRecipe.hydration_percent ? selectedRecipe.hydration_percent : 68;
  const acquaL = (batchKg * hydration / 100).toFixed(1);
  const saleG = (batchKg * 20).toFixed(0);

  const startBake = () => {
    setIsBaking(true);
    speakVoice("Conto alla rovescia forno avviato da Mohamed");
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
  };

  if (!open) return null;

  return createPortal(
    <div data-testid="elite-engine-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto',
      background: currentRoom.bgGradient, color: '#FFF',
      fontFamily: 'system-ui, sans-serif', transition: 'background 0.8s ease-in-out'
    }}>
      <div style={{ padding: '16px', maxWidth: 760, margin: '0 auto', paddingBottom: '40px' }}>

        {/* HEADER AMBIENTE & RADIO REALE */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)',
          border: `2px solid ${currentRoom.color}`, borderRadius: '16px',
          padding: '14px', marginBottom: '16px', boxShadow: `0 0 25px ${currentRoom.color}55`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ backgroundColor: currentRoom.color, color: '#000', padding: '4px 10px', borderRadius: '20px', fontWeight: '900', fontSize: '0.75rem' }}>
                STANZA 3D ATTIVA
              </span>
              <h1 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', textShadow: '2px 2px 4px #000' }}>{currentRoom.title}</h1>
              <p data-testid="elite-slogan" style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: currentRoom.color, fontWeight: 600, maxWidth: '340px', lineHeight: 1.3 }}>
                {_pick(
                  "L'ecosistema digitale integrato per produzione, logistica vocale e gestione dei laboratori.",
                  "Das integrierte digitale Ökosystem für Produktion, Sprach-Logistik und Laborverwaltung.",
                  "The integrated digital ecosystem for production, voice logistics and lab management.",
                  "El ecosistema digital integrado para producción, logística por voz y gestión de laboratorios.",
                  "L'écosystème numérique intégré pour la production, la logistique vocale et la gestion des laboratoires.",
                  "اکوسیستم دیجیتال یکپارچه برای تولید، لجستیک صوتی و مدیریت آزمایشگاه.")}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button data-testid="elite-radio-toggle" onClick={toggleRadio} style={{ backgroundColor: radioPlaying ? '#8F9B5E' : 'rgba(255,255,255,0.1)', color: '#FFF', border: `1px solid ${currentRoom.color}`, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                📻 {radioPlaying ? 'ON 🎶' : 'RADIO'}
              </button>
              <select data-testid="elite-radio-station" value={stationId} onChange={(e) => changeStation(e.target.value)}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '8px', padding: '7px 6px', fontSize: '0.72rem', fontWeight: 'bold', maxWidth: '130px' }}>
                {RADIO_STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button data-testid="elite-close" onClick={onClose} aria-label="Chiudi" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', border: `1px solid ${currentRoom.color}`, padding: '7px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* SELETTORE LINGUA (6 lingue) */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
            {[['it-IT', 'IT'], ['de-DE', 'DE'], ['es-ES', 'ES'], ['fr-FR', 'FR'], ['en-US', 'EN'], ['fa-IR', 'FA']].map(([code, label]) => (
              <button key={code} data-testid={`elite-lang-${label.toLowerCase()}`} onClick={() => { setLanguage(code); speakVoice(`Lingua ${label}`); }} style={{ backgroundColor: language === code ? currentRoom.color : 'rgba(255,255,255,0.1)', color: language === code ? '#000' : '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Vista Ospite (sola lettura) */}
        {readOnly && (
          <div data-testid="elite-guest-badge" style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #8FB0C2', borderRadius: '12px', padding: '10px', marginBottom: '16px', textAlign: 'center', color: '#8FB0C2', fontWeight: 700, fontSize: '0.8rem' }}>
            👁️ {_pick("Vista Ospite · sola lettura (accedi per operare)", "Gastansicht · nur Lesen", "Guest view · read-only", "Vista invitado · solo lectura", "Vue invité · lecture seule", "نمای مهمان · فقط خواندن")}
          </div>
        )}

        {/* Modalità Ferie attiva (banner) */}
        {holiday && (
          <div data-testid="elite-holiday-banner" style={{ backgroundColor: 'rgba(94,140,168,.18)', border: `2px solid ${currentRoom.color}`, borderRadius: '12px', padding: '10px', marginBottom: '16px', textAlign: 'center', color: currentRoom.color, fontWeight: 800, fontSize: '0.82rem' }}>
            🌴 {_pick("Laboratorio in Ferie — produzione in pausa", "Labor im Urlaub", "Lab on holiday — production paused", "Laboratorio de vacaciones", "Laboratoire en congé", "آزمایشگاه در تعطیلات")}
          </div>
        )}

        {/* PANNELLO DI CONTROLLO CAPO — Solo vs Squadra/Turni (solo per il Capo) */}
        {isCapo && !isLocked && (
          <div data-testid="elite-capo-panel" style={{
            backgroundColor: 'rgba(0,0,0,0.7)', border: `1px solid ${currentRoom.color}`,
            borderRadius: '16px', padding: '14px', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>{_pick("Pannello di Controllo Capo", "Chef-Kontrollpanel", "Capo Control Panel", "Panel de Control Capo", "Panneau de Contrôle Chef", "پنل کنترل سرآشپز")}</div>
                <div style={{ fontSize: '0.72rem', color: '#AAA' }}>{_pick("Gestisci il laboratorio in autonomia o coordina la squadra.", "Führe das Labor allein oder koordiniere das Team.", "Run the lab solo or coordinate your crew.", "Gestiona el laboratorio solo o coordina el equipo.", "Gère le labo en solo ou coordonne l'équipe.", "آزمایشگاه را تنها اداره کن یا تیم را هماهنگ کن.")}</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.08)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <button data-testid="elite-capo-solo" onClick={() => changeWorkMode('solo')} style={{ padding: '8px 12px', borderRadius: '9px', fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: workMode === 'solo' ? currentRoom.color : 'transparent', color: workMode === 'solo' ? '#000' : '#CCC' }}>
                  {_pick("Lavoro da Solo", "Alleine", "Work Solo", "Trabajo Solo", "En Solo", "کار تنها")}
                </button>
                <button data-testid="elite-capo-squadra" onClick={() => changeWorkMode('squadra')} style={{ padding: '8px 12px', borderRadius: '9px', fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: workMode === 'squadra' ? currentRoom.color : 'transparent', color: workMode === 'squadra' ? '#000' : '#CCC' }}>
                  {_pick("Ho una Squadra", "Ich habe ein Team", "I have a Crew", "Tengo Equipo", "J'ai une Équipe", "تیم دارم")}
                </button>
              </div>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#CCC', fontWeight: 600 }}>🌴 {_pick("Modalità Ferie", "Urlaubsmodus", "Holiday mode", "Modo vacaciones", "Mode congé", "حالت تعطیلات")}</span>
              <button data-testid="elite-holiday-toggle" onClick={toggleHoliday} style={{ padding: '6px 14px', borderRadius: '9px', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${currentRoom.color}`, cursor: 'pointer', backgroundColor: holiday ? currentRoom.color : 'transparent', color: holiday ? '#000' : currentRoom.color }}>
                {holiday ? _pick("ATTIVA — Disattiva", "AKTIV — Aus", "ON — Turn off", "ACTIVO — Apagar", "ACTIF — Éteindre", "روشن — خاموش") : _pick("Attiva ferie", "Urlaub an", "Turn on", "Activar", "Activer", "روشن کن")}
              </button>
            </div>
            {workMode === 'squadra' && (
              <div data-testid="elite-capo-crew" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: currentRoom.color, fontWeight: 700, marginBottom: '8px' }}>
                  {_pick("Turni & Assegnazione Reparti", "Schichten & Abteilungen", "Shifts & Department Assignment", "Turnos y Departamentos", "Postes & Rayons", "شیفت و بخش‌ها")}
                </div>
                {crew.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#AAA' }}>
                    {_pick("Nessun operaio ancora. Invita operai con i token dal tuo profilo.", "Noch keine Mitarbeiter. Lade sie mit Tokens ein.", "No crew yet. Invite workers with tokens from your profile.", "Sin equipo aún. Invita con tokens desde tu perfil.", "Aucun employé. Invite-les avec des jetons.", "هنوز کارگری نیست. با توکن دعوت کن.")}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                    {crew.map((m, i) => (
                      <div key={i} data-testid={`elite-crew-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#EEE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || m.email}</div>
                          <div style={{ fontSize: '0.68rem', color: '#AAA' }}>{DEPT_LABELS[m.department] || (m.department || '—')}{m.role === 'sostituto' ? ' · Sostituto' : ''}</div>
                        </div>
                        <span style={{ fontSize: '0.62rem', backgroundColor: `${currentRoom.color}33`, color: currentRoom.color, padding: '3px 6px', borderRadius: '6px' }}>Attivo</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SELETTORE STANZE 3D — nascosto per l'operatore bloccato sul suo reparto */}
        {isLocked ? (
          <div data-testid="elite-locked-dept" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            backgroundColor: 'rgba(0,0,0,0.55)', border: `2px solid ${currentRoom.color}`,
            borderRadius: '12px', padding: '12px', marginBottom: '16px',
            color: currentRoom.color, fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center'
          }}>
            {hasValidDept
              ? `🔒 ${lockLabel} · ${currentRoom.title}`
              : `🔒 ${noDeptLabel}`}
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'panetteria', icon: '🍞', label: 'PANETTERIA' },
            { id: 'pizzeria', icon: '🍕', label: 'PIZZERIA' },
            { id: 'pasticceria', icon: '🥐', label: 'PASTICCERIA' }
          ].map(room => (
            <button key={room.id} data-testid={`elite-room-${room.id}`} onClick={() => { setActiveTab(room.id); speakVoice(`Spostamento in ${room.label}`); }} style={{
              backgroundColor: activeTab === room.id ? rooms3D[room.id].color : 'rgba(0,0,0,0.6)',
              color: activeTab === room.id ? '#000' : '#FFF',
              border: `2px solid ${rooms3D[room.id].color}`, borderRadius: '12px',
              padding: '12px 4px', cursor: 'pointer', fontWeight: 'bold',
              transform: activeTab === room.id ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.4s ease, background-color 0.4s ease'
            }}>
              <div style={{ fontSize: '1.4rem' }}>{room.icon}</div>
              <div style={{ fontSize: '0.6rem', marginTop: '4px' }}>{room.label}</div>
            </button>
          ))}
        </div>
        )}

        {/* SCENA 3D & FOTO REALI */}
        <div data-testid="elite-scene-3d" className="lab-3d-card" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.82)', borderRadius: '20px',
          border: `3px solid ${currentRoom.color}`, padding: '24px', textAlign: 'center',
          marginBottom: '16px', position: 'relative', overflow: 'hidden',
          boxShadow: `inset 0 0 60px rgba(0,0,0,0.9), 0 10px 30px ${currentRoom.color}33`
        }}>
          <div style={{
            minHeight: '210px', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 10%, transparent 75%)'
          }}>
            <img
              data-testid="elite-avatar-photo"
              src={currentRoom.avatarImg}
              alt={currentRoom.avatarName}
              style={{
                width: '120px', height: '120px', objectFit: 'cover',
                borderRadius: '50%', border: `4px solid ${currentRoom.color}`,
                boxShadow: `0 10px 25px rgba(0,0,0,0.8), 0 0 25px ${currentRoom.color}55`,
                marginBottom: '10px'
              }}
              onError={(e) => { e.currentTarget.src = "/michele-real-lab.jpg"; }}
            />

            <div style={{ fontSize: '0.75rem', color: currentRoom.color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {currentRoom.avatarName}
            </div>

            <div style={{
              backgroundColor: currentRoom.color, color: '#000', padding: '8px 18px',
              borderRadius: '20px', fontWeight: '900', fontSize: '0.85rem',
              marginTop: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}>
              {currentRoom.avatarAction}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#DDD', marginTop: '8px' }}>
              🏛️ Angolo 3D: <strong style={{ color: currentRoom.color }}>{currentRoom.item3D}</strong>
            </div>
          </div>
        </div>

        {/* PANNELLO OPERATIVO O GUIDA */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
          borderRadius: '16px', border: `1px solid ${currentRoom.color}`,
          padding: '16px', marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: currentRoom.color }}>
            {activeTab === 'guida' ? '📖 Guida & Tutela Proprietà Intellettuale' : '⚙️ Dati Operativi Reparto'}
          </h3>

          {activeTab === 'guida' ? (
            <div data-testid="elite-guida-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#DDD' }}>
              <p>✨ <strong>MikiLab | 3D Lab Simulation v10.3</strong> ideato e sviluppato da Mohamed & Miki.</p>
              <p>🔒 <strong>Protezione Copyright:</strong> Questo software, l'interfaccia 3D, la logica dei timer e i contenuti multimediali sono protetti da diritti di proprietà intellettuale esclusivi. Ogni duplicazione o uso non autorizzato è severamente vietato.</p>
              <p>🚀 <strong>Rispetto al mercato:</strong> Foto reali del team, radio live integrata, ricette collegate al database e allarmi con notifica del telefono per la cottura.</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#DDD', marginBottom: '12px' }}>{currentRoom.desc}</p>
          )}

          {activeTab === 'panetteria' && (
            <div>
              {/* Ricette reali dal DB MikiLab */}
              {dbRecipes.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#AAA', marginBottom: '4px' }}>📖 Ricetta dal DB MikiLab ({dbRecipes.length}):</div>
                  <select data-testid="elite-db-recipe-select" value={selectedRecipeId}
                    onChange={(e) => { setSelectedRecipeId(e.target.value); const r = dbRecipes.find(x => x.id === e.target.value); if (r) speakVoice(`Ricetta ${r.name}`); }}
                    style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '8px', padding: '8px', fontWeight: 'bold' }}>
                    {dbRecipes.map(r => <option key={r.id} value={r.id}>{r.name}{r.hydration_percent ? ` — ${r.hydration_percent}%` : ''}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem' }}>Farina T500</div>
                  <input data-testid="elite-input-kg" type="number" value={batchKg} disabled={readOnly} onChange={(e) => setBatchKg(Number(e.target.value))} style={{ width: '70px', backgroundColor: 'rgba(0,0,0,0.4)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '4px', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', opacity: readOnly ? 0.6 : 1 }} />
                  <span style={{ fontSize: '0.7rem', color: '#AAA' }}> kg</span>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem' }}>Acqua ({hydration}%)</div>
                  <strong data-testid="elite-water" style={{ color: '#8F9B5E', fontSize: '1.2rem' }}>{acquaL} L</strong>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem' }}>Sale (2%)</div>
                  <strong style={{ color: '#D97706', fontSize: '1.2rem' }}>{saleG} g</strong>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'panetteria' || activeTab === 'pizzeria') && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#C2612E' }}>🔥 {activeTab === 'pizzeria' ? 'Forno Pizze' : 'Forno Rotativo'} ({ovenTemp}°C) - Allarme + Notifica Telefono</div>
              {ovenRecipeName && (
                <div data-testid="elite-oven-recipe" style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '4px' }}>
                  📖 Parametri da ricetta: <strong>{ovenRecipeName}</strong>
                </div>
              )}
              <div data-testid="elite-timer" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '6px 0', fontFamily: 'monospace' }}>
                {formatTime(timerSeconds)}
              </div>
              {alarmUnattended ? (
                <div data-testid="elite-alarm-priority" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                  <div style={{ color: '#E63946', fontWeight: 800, fontSize: '0.8rem' }}>🚨 ALLARME FORNO — sfornare! (2 min → avviso al Capo)</div>
                  <button data-testid="elite-alarm-ack" onClick={ackAlarm} style={{ backgroundColor: '#E63946', color: '#FFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ✋ TACITA ALLARME
                  </button>
                </div>
              ) : (
                <button data-testid="elite-start-bake" onClick={startBake} disabled={readOnly} style={{ backgroundColor: readOnly ? '#3A4652' : '#C2612E', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: readOnly ? 'not-allowed' : 'pointer', opacity: readOnly ? 0.6 : 1 }}>
                  {isBaking ? '⏳ COTTURA IN CORSO (ALLARME PRONTO)...' : '▶️ AVVIA COTTURA & NOTIFICA'}
                </button>
              )}
            </div>
          )}

          {/* GRIGLIA FUNZIONI DEL REPARTO (tutte le macro-aree) */}
          {activeTab !== 'guida' && Array.isArray(currentRoom.features) && (
            <div data-testid="elite-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginTop: '14px' }}>
              {currentRoom.features.map((feat, i) => (
                <div key={i} data-testid={`elite-feature-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${currentRoom.color}44`, padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#EEE', fontWeight: 600 }}>{feat}</span>
                  <span style={{ fontSize: '0.6rem', backgroundColor: `${currentRoom.color}33`, color: currentRoom.color, padding: '3px 6px', borderRadius: '6px' }}>Attivo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER LEGALE & COPYRIGHT */}
        <div style={{
          textAlign: 'center', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: '0.75rem', color: '#AAA', display: 'flex', justifyContent: 'center',
          gap: '15px', flexWrap: 'wrap'
        }}>
          <span>© MikiLab | 3D Lab Simulation v10.3 - Mohamed & Miki (Tutti i diritti riservati)</span>
          <button data-testid="elite-privacy" onClick={() => setModalOpen('privacy')} style={{ background: 'none', border: 'none', color: '#D97706', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}>
            🔒 Privacy (GDPR)
          </button>
          <button data-testid="elite-copyright" onClick={() => setModalOpen('copyright')} style={{ background: 'none', border: 'none', color: '#8F9B5E', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}>
            🛡️ Tutela Copyright
          </button>
          <button data-testid="elite-impressum" onClick={() => setModalOpen('impressum')} style={{ background: 'none', border: 'none', color: '#B5714E', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}>
            📜 Impressum
          </button>
        </div>

      </div>

      {/* MODALE TESTI LEGALI VERI */}
      {modalOpen && (
        <div data-testid="elite-legal-modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1E1E24', border: '2px solid #D97706', borderRadius: '16px',
            padding: '24px', maxWidth: '500px', width: '100%', color: '#FFF', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <h2 style={{ color: '#D97706', marginTop: 0 }}>
              {modalOpen === 'privacy' && '🔒 Informativa sulla Privacy (GDPR)'}
              {modalOpen === 'copyright' && '🛡️ Protezione Copyright & Proprietà'}
              {modalOpen === 'impressum' && '📜 Impressum & Note Legali'}
            </h2>

            <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#DDD', marginBottom: '20px' }}>
              {modalOpen === 'privacy' && (
                <p>I dati di produzione, le ricette e le impostazioni del laboratorio gestiti all'interno di MikiLab | 3D Lab Simulation sono trattati in totale conformità al Regolamento UE 2016/679 (GDPR), garantendo la massima riservatezza e sicurezza dei dati aziendali.</p>
              )}
              {modalOpen === 'copyright' && (
                <p><strong>© 2026 MikiLab | 3D Lab Simulation - Mohamed & Miki.</strong> Tutti i diritti di proprietà intellettuale relativi al codice sorgente, all'interfaccia 3D, ai flussi operativi, alle immagini e ai concetti di laboratorio sono riservati. È vietata la copia, la riproduzione o la distribuzione non autorizzata, anche parziale, dell'opera.</p>
              )}
              {modalOpen === 'impressum' && (
                <p><strong>MikiLab Industrial Systems</strong><br />
                  Sviluppato da Mohamed & Miki<br />
                  Laboratorio di Panificazione e Pasticceria 3D<br />
                  Contatto ufficiale: support@mikilab-os.com</p>
              )}
            </div>

            <button data-testid="elite-legal-close" onClick={() => setModalOpen(null)} style={{
              backgroundColor: '#D97706', color: '#000', border: 'none', padding: '10px 20px',
              borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%'
            }}>
              CHIUDI
            </button>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
