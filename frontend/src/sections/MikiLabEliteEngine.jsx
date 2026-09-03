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
const DRIVERS = ['Marco', 'Giovanni', 'Luca', 'Alex'];
const QUICK_BAKES = ['4x Baguette', '4x Croissant', '2x Teglia Pizza', '10x Pane Saponetta'];

export default function MikiLabEliteEngine({ open, onClose, locked = false, lockedDept = '', isCapo = false, readOnly = false }) {
  const hasValidDept = ROOM_IDS.includes(lockedDept);
  const isLocked = locked; // operatore/sostituto: sempre bloccato (fail-closed anche senza reparto valido)
  const { lang: appLang } = useLang();
  const [activeTab, setActiveTab] = useState(locked && hasValidDept ? lockedDept : 'panetteria');
  const [language, setLanguage] = useState(APP_LANG_TO_TTS[appLang] || 'it-IT');
  const [workMode, setWorkMode] = useState(() => { try { return localStorage.getItem('mikilab_work_mode') || 'solo'; } catch { return 'solo'; } });
  const [crew, setCrew] = useState([]);
  const [ovenAlarms, setOvenAlarms] = useState([]);
  const [customDepts, setCustomDepts] = useState([]);
  const [deptExtras, setDeptExtras] = useState({});
  const [deliveries, setDeliveries] = useState([]);
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptTitle, setNewDeptTitle] = useState('');
  const [deptError, setDeptError] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newDeliveryTime, setNewDeliveryTime] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [crates, setCrates] = useState([]);
  const [newStore, setNewStore] = useState('');
  const [crateDriver, setCrateDriver] = useState(DRIVERS[0]);
  const [targetCrateId, setTargetCrateId] = useState('');
  const isAfterCutoff = new Date().getHours() >= 18;
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
  const loadCrew = () => {
    if (!API) return;
    fetch(`${API}/api/operator/crew`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { crew: [] })
      .then(d => setCrew(Array.isArray(d.crew) ? d.crew : []))
      .catch(() => setCrew([]));
  };
  useEffect(() => {
    if (!open || !isCapo || workMode !== 'squadra' || !API) return;
    loadCrew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCapo, workMode]);

  // Storico Allarmi Forno (Capo)
  useEffect(() => {
    if (!open || !isCapo || !API) return;
    fetch(`${API}/api/oven/alarms`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { alarms: [] })
      .then(d => setOvenAlarms(Array.isArray(d.alarms) ? d.alarms : []))
      .catch(() => setOvenAlarms([]));
  }, [open, isCapo, alarmUnattended]);

  const assignDept = async (email, dept) => {
    setCrew(prev => prev.map(m => m.email === email ? { ...m, department: dept } : m));
    try {
      const res = await fetch(`${API}/api/operator/assign`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, department: dept }) });
      if (!res.ok) loadCrew();
    } catch (e) { loadCrew(); }
  };

  // Reparti dinamici + consegne
  const loadDepartments = () => {
    if (!API) return;
    fetch(`${API}/api/lab/departments`).then(r => r.ok ? r.json() : {}).then(d => { setCustomDepts(d.custom || []); setDeptExtras(d.extras || {}); }).catch(() => {});
  };
  const loadDeliveries = () => {
    if (!API) return;
    fetch(`${API}/api/deliveries`, { credentials: 'include' }).then(r => r.ok ? r.json() : {}).then(d => setDeliveries(d.deliveries || [])).catch(() => {});
  };
  useEffect(() => { if (open && API) loadDepartments(); /* eslint-disable-next-line */ }, [open]);
  useEffect(() => { if (open && API && activeTab === 'pizzeria') loadDeliveries(); /* eslint-disable-next-line */ }, [open, activeTab]);

  const createDept = async () => {
    const id = newDeptId.trim(); const title = newDeptTitle.trim();
    setDeptError('');
    if (!id || !title) { setDeptError('Inserisci ID e nome'); return; }
    try {
      const res = await fetch(`${API}/api/lab/departments`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title }) });
      if (res.ok) { const d = await res.json(); setNewDeptId(''); setNewDeptTitle(''); setShowAddDept(false); loadDepartments(); if (d.department) setActiveTab(d.department.id); }
      else { const e = await res.json().catch(() => ({})); setDeptError(e.detail || 'Errore creazione reparto'); }
    } catch (e) { setDeptError('Errore di rete'); }
  };
  const deleteDept = async (id) => {
    if (!window.confirm('Eliminare questo reparto?')) return;
    try {
      const res = await fetch(`${API}/api/lab/departments/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) return;
      if (activeTab === id) setActiveTab('panetteria');
      loadDepartments();
    } catch (e) { /* */ }
  };
  const addFeature = async () => {
    const feat = newFeature.trim(); if (!feat) return;
    try { const res = await fetch(`${API}/api/lab/departments/${activeTab}/feature`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feature: feat }) }); if (res.ok) { setNewFeature(''); loadDepartments(); } } catch (e) { /* */ }
  };
  const addDelivery = async () => {
    const client = newClient.trim(); if (!client) return;
    try { const res = await fetch(`${API}/api/deliveries`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client, time: newDeliveryTime.trim(), driver: newDriver.trim() }) }); if (res.ok) { setNewClient(''); setNewDeliveryTime(''); setNewDriver(''); loadDeliveries(); speakVoice(`Nuova consegna aggiunta per ${client}.`); } } catch (e) { /* */ }
  };
  const setDeliveryStatus = async (id, status) => {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    try { await fetch(`${API}/api/deliveries/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); } catch (e) { loadDeliveries(); }
  };
  const deleteDelivery = async (id) => {
    setDeliveries(prev => prev.filter(d => d.id !== id));
    try { await fetch(`${API}/api/deliveries/${id}`, { method: 'DELETE', credentials: 'include' }); } catch (e) { loadDeliveries(); }
  };
  const markAlarmsRead = async () => {
    try { await fetch(`${API}/api/oven/alarms/read`, { method: 'POST', credentials: 'include' }); setOvenAlarms(prev => prev.map(a => ({ ...a, read: true }))); } catch (e) { /* */ }
  };
  const announceStatus = () => {
    const inConsegna = deliveries.filter(d => d.status === 'in consegna').length;
    const unread = ovenAlarms.filter(a => !a.read).length;
    speakVoice(`Stato laboratorio. ${inConsegna} consegne in corso. ${unread} allarmi forno non letti. Reparto ${currentRoom.title} operativo.`);
  };

  // Ceste Smart
  const loadCrates = () => {
    if (!API) return;
    fetch(`${API}/api/crates`, { credentials: 'include' }).then(r => r.ok ? r.json() : {}).then(d => {
      const list = d.crates || [];
      setCrates(list);
      setTargetCrateId(prev => prev || (list[0] && list[0].id) || '');
    }).catch(() => {});
  };
  useEffect(() => { if (open && API && !readOnly) loadCrates(); /* eslint-disable-next-line */ }, [open, readOnly]);
  // Sintesi vocale automatica all'apertura dell'Elite Engine (Capo)
  useEffect(() => {
    if (open && isCapo) { const t = setTimeout(() => speakVoice("Benvenuto Comandante. Plancia MikiLab pronta. Reparti e ceste attivi."), 700); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const createCrate = async () => {
    const store = newStore.trim(); if (!store) return;
    try { const res = await fetch(`${API}/api/crates`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ store_name: store, driver: crateDriver }) }); if (res.ok) { const d = await res.json(); setNewStore(''); loadCrates(); if (d.crate) setTargetCrateId(d.crate.id); speakVoice(`Cesta creata per ${store}.`); } } catch (e) { /* */ }
  };
  const addToCrate = async (product) => {
    if (!targetCrateId) return;
    setCrates(prev => prev.map(c => c.id === targetCrateId ? { ...c, items: [...(c.items || []), product] } : c));
    try { await fetch(`${API}/api/crates/${targetCrateId}/item`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item: product }) }); } catch (e) { loadCrates(); }
    const store = (crates.find(c => c.id === targetCrateId) || {}).store_name || '';
    speakVoice(`Aggiunto ${product} nella cesta ${store}.`);
  };
  const setCrateDriverServer = async (id, driver) => {
    setCrates(prev => prev.map(c => c.id === id ? { ...c, driver } : c));
    try { await fetch(`${API}/api/crates/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driver }) }); } catch (e) { loadCrates(); }
  };
  const clearCrate = async (id) => {
    setCrates(prev => prev.map(c => c.id === id ? { ...c, items: [] } : c));
    try { await fetch(`${API}/api/crates/${id}/clear`, { method: 'POST', credentials: 'include' }); } catch (e) { loadCrates(); }
  };
  const deleteCrate = async (id) => {
    setCrates(prev => prev.filter(c => c.id !== id));
    if (targetCrateId === id) setTargetCrateId('');
    try { await fetch(`${API}/api/crates/${id}`, { method: 'DELETE', credentials: 'include' }); } catch (e) { loadCrates(); }
  };

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
      speakVoice(next ? "Modalità ferie intelligenti attivata, cicli settimanali clonati." : "Modalità ferie disattivata, produzione ripresa.");
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

  const CUSTOM_COLOR = '#8FB0C2';
  const allRooms = { ...rooms3D };
  customDepts.forEach(d => {
    allRooms[d.id] = { title: `🧩 ${d.title.toUpperCase()}`, color: CUSTOM_COLOR, bgGradient: 'linear-gradient(135deg, #0E1620 0%, #14212C 55%, #8FB0C2 100%)', avatarName: `Michele · ${d.title}`, avatarImg: '/michele-real-lab.jpg', avatarAction: 'Reparto flessibile operativo!', item3D: '🧩 Postazione Universale', desc: d.desc || '', features: d.features || [], custom: true };
  });
  const currentRoom = allRooms[activeTab] || allRooms.panetteria;
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
              <button data-testid="elite-announce-status" onClick={announceStatus} style={{ backgroundColor: 'rgba(62,156,147,0.15)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '10px', padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                📢 {_pick("Annuncia Stato", "Status ansagen", "Announce Status", "Anunciar estado", "Annoncer l'état", "اعلام وضعیت")}
              </button>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#CCC', fontWeight: 600 }}>🌴 {_pick("Modalità Ferie", "Urlaubsmodus", "Holiday mode", "Modo vacaciones", "Mode congé", "حالت تعطیلات")}</span>
              <button data-testid="elite-holiday-toggle" onClick={toggleHoliday} style={{ padding: '6px 14px', borderRadius: '9px', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${currentRoom.color}`, cursor: 'pointer', backgroundColor: holiday ? currentRoom.color : 'transparent', color: holiday ? '#000' : currentRoom.color }}>
                {holiday ? _pick("ATTIVA — Disattiva", "AKTIV — Aus", "ON — Turn off", "ACTIVO — Apagar", "ACTIF — Éteindre", "روشن — خاموش") : _pick("Attiva ferie", "Urlaub an", "Turn on", "Activar", "Activer", "روشن کن")}
              </button>
            </div>
            <div data-testid="elite-cutoff" style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: 700, color: isAfterCutoff ? '#E6A23C' : '#7FB0A6' }}>
              {isAfterCutoff
                ? _pick("⚠️ Dopo le 18:00 · ordini e modifiche bloccati", "⚠️ Nach 18:00 · Bestellungen gesperrt", "⚠️ After 18:00 · orders & edits locked", "⚠️ Después de 18:00 · pedidos bloqueados", "⚠️ Après 18h · commandes bloquées", "⚠️ بعد از ۱۸ · سفارش‌ها قفل")
                : _pick("✅ Orario regolare · modifiche aperte (cutoff 18:00)", "✅ Reguläre Zeit · offen (Cutoff 18:00)", "✅ Regular hours · edits open (cutoff 18:00)", "✅ Horario regular · abierto (corte 18:00)", "✅ Heures normales · ouvert (18h)", "✅ ساعت عادی · باز (۱۸)")}
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
                      <div key={i} data-testid={`elite-crew-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#EEE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || m.email}{m.role === 'sostituto' ? ' · Sostituto' : ''}</div>
                          <span style={{ fontSize: '0.62rem', backgroundColor: `${currentRoom.color}33`, color: currentRoom.color, padding: '3px 6px', borderRadius: '6px' }}>Attivo</span>
                        </div>
                        <select data-testid={`elite-crew-dept-${i}`} value={ROOM_IDS.includes(m.department) ? m.department : 'panetteria'} onChange={(e) => assignDept(m.email, e.target.value)}
                          style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '6px', padding: '5px', fontSize: '0.72rem', fontWeight: 700 }}>
                          <option value="panetteria">Panetteria</option>
                          <option value="pizzeria">Pizzeria</option>
                          <option value="pasticceria">Pasticceria</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STORICO ALLARMI FORNO (Capo) */}
        {isCapo && !isLocked && ovenAlarms.length > 0 && (
          <div data-testid="elite-oven-alarms" style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid #E6A23C', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#E6A23C', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔥 {_pick("Storico Allarmi Forno non gestiti", "Ofen-Alarm-Verlauf", "Unhandled oven alarms", "Historial de alarmas del horno", "Historique alarmes four", "تاریخچه هشدار فر")}
                {ovenAlarms.filter(a => !a.read).length > 0 && (
                  <span data-testid="elite-alarms-unread" style={{ backgroundColor: '#E63946', color: '#FFF', borderRadius: '50%', minWidth: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, padding: '0 5px' }}>
                    {ovenAlarms.filter(a => !a.read).length}
                  </span>
                )}
              </div>
              {ovenAlarms.filter(a => !a.read).length > 0 && (
                <button data-testid="elite-alarms-markread" onClick={markAlarmsRead} style={{ backgroundColor: 'transparent', color: '#AAA', border: '1px solid #55606B', borderRadius: '8px', padding: '4px 8px', fontSize: '0.66rem', cursor: 'pointer' }}>
                  {_pick("Segna come letti", "Als gelesen", "Mark as read", "Marcar leídos", "Marquer lus", "خوانده شد")}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {ovenAlarms.slice(0, 20).map((a, i) => (
                <div key={a.id || i} data-testid={`elite-oven-alarm-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(230,162,60,0.25)', borderRadius: '8px', padding: '8px', fontSize: '0.72rem', color: '#EEE' }}>
                  <div style={{ fontWeight: 600 }}>{a.snippet}</div>
                  <div style={{ fontSize: '0.62rem', color: '#AAA', marginTop: '2px' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                </div>
              ))}
            </div>
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
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
          {[
            { id: 'panetteria', icon: '🍞', label: 'PANETTERIA' },
            { id: 'pizzeria', icon: '🍕', label: 'PIZZERIA' },
            { id: 'pasticceria', icon: '🥐', label: 'PASTICCERIA' },
            ...customDepts.map(d => ({ id: d.id, icon: '🧩', label: (d.title || d.id).toUpperCase(), custom: true }))
          ].map(room => (
            <div key={room.id} style={{ position: 'relative' }}>
              <button data-testid={`elite-room-${room.id}`} onClick={() => { setActiveTab(room.id); speakVoice(`Spostamento in ${room.label}`); }} style={{
                width: '100%',
                backgroundColor: activeTab === room.id ? (allRooms[room.id] ? allRooms[room.id].color : CUSTOM_COLOR) : 'rgba(0,0,0,0.6)',
                color: activeTab === room.id ? '#000' : '#FFF',
                border: `2px solid ${allRooms[room.id] ? allRooms[room.id].color : CUSTOM_COLOR}`, borderRadius: '12px',
                padding: '12px 4px', cursor: 'pointer', fontWeight: 'bold',
                transform: activeTab === room.id ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.4s ease, background-color 0.4s ease'
              }}>
                <div style={{ fontSize: '1.4rem' }}>{room.icon}</div>
                <div style={{ fontSize: '0.55rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.label}</div>
              </button>
              {isCapo && room.custom && (
                <button data-testid={`elite-room-delete-${room.id}`} onClick={(e) => { e.stopPropagation(); deleteDept(room.id); }} title="Elimina reparto" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#E63946', color: '#FFF', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', lineHeight: '20px', padding: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>
        {isCapo && (
          <div style={{ marginBottom: '16px' }}>
            {!showAddDept ? (
              <button data-testid="elite-add-dept-btn" onClick={() => setShowAddDept(true)} style={{ backgroundColor: 'transparent', color: currentRoom.color, border: `1px dashed ${currentRoom.color}`, borderRadius: '10px', padding: '8px', width: '100%', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                ＋ {_pick("Crea Nuovo Reparto", "Neue Abteilung", "Create New Department", "Crear departamento", "Nouveau rayon", "بخش جدید")}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '10px', border: `1px solid ${currentRoom.color}` }}>
                <input data-testid="elite-new-dept-id" value={newDeptId} onChange={e => setNewDeptId(e.target.value)} placeholder="ID (es. congelati)" style={{ flex: '1 1 90px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '6px', fontSize: '0.72rem' }} />
                <input data-testid="elite-new-dept-title" value={newDeptTitle} onChange={e => setNewDeptTitle(e.target.value)} placeholder="Nome reparto" style={{ flex: '2 1 140px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '6px', fontSize: '0.72rem' }} />
                <button data-testid="elite-new-dept-save" onClick={createDept} style={{ backgroundColor: currentRoom.color, color: '#000', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>OK</button>
                <button onClick={() => { setShowAddDept(false); setDeptError(''); }} style={{ backgroundColor: 'transparent', color: '#AAA', border: '1px solid #33414E', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.72rem' }}>✕</button>
                {deptError && <div data-testid="elite-dept-error" style={{ flexBasis: '100%', color: '#E63946', fontSize: '0.68rem', fontWeight: 700 }}>{deptError}</div>}
              </div>
            )}
          </div>
        )}
        </>
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

          {/* GRIGLIA FUNZIONI DEL REPARTO (base + macchine extra aggiunte dal Capo) */}
          {activeTab !== 'guida' && (
            <>
            <div data-testid="elite-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginTop: '14px' }}>
              {[...(Array.isArray(currentRoom.features) ? currentRoom.features : []), ...((deptExtras[activeTab]) || [])].map((feat, i) => (
                <div key={i} data-testid={`elite-feature-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${currentRoom.color}44`, padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#EEE', fontWeight: 600 }}>{feat}</span>
                  <span style={{ fontSize: '0.6rem', backgroundColor: `${currentRoom.color}33`, color: currentRoom.color, padding: '3px 6px', borderRadius: '6px' }}>Attivo</span>
                </div>
              ))}
            </div>

            {/* Aggiungi macchina / forno / postazione (Capo) */}
            {isCapo && !isLocked && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <input data-testid="elite-add-feature-input" value={newFeature} onChange={e => setNewFeature(e.target.value)} disabled={isAfterCutoff} placeholder={isAfterCutoff ? "Modifiche bloccate dopo le 18:00" : "Aggiungi forno extra, macchina o postazione…"} style={{ flex: '1 1 180px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: `1px solid ${currentRoom.color}55`, borderRadius: '8px', padding: '8px', fontSize: '0.72rem', opacity: isAfterCutoff ? 0.6 : 1 }} />
                <button data-testid="elite-add-feature-btn" onClick={addFeature} disabled={isAfterCutoff} style={{ backgroundColor: isAfterCutoff ? '#3A4652' : currentRoom.color, color: isAfterCutoff ? '#888' : '#000', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, cursor: isAfterCutoff ? 'not-allowed' : 'pointer', fontSize: '0.72rem' }}>
                  ＋ {_pick("Aggiungi", "Hinzufügen", "Add", "Añadir", "Ajouter", "افزودن")}
                </button>
              </div>
            )}

            {/* LOGISTICA CONSEGNE (Lieferung) — reparto Pizzeria (nascosto agli ospiti) */}
            {activeTab === 'pizzeria' && !readOnly && (
              <div data-testid="elite-deliveries" style={{ marginTop: '14px', backgroundColor: 'rgba(0,0,0,0.55)', border: `1px solid ${currentRoom.color}`, borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: currentRoom.color, fontWeight: 800, marginBottom: '8px' }}>
                  🚚 {_pick("Consegne Ceste / Lieferung", "Lieferungen / Körbe", "Deliveries / Baskets", "Entregas / Cestas", "Livraisons / Paniers", "تحویل‌ها")}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  {deliveries.length === 0 && <div style={{ fontSize: '0.72rem', color: '#AAA' }}>{_pick("Nessuna consegna in coda.", "Keine Lieferungen.", "No deliveries queued.", "Sin entregas.", "Aucune livraison.", "تحویلی نیست.")}</div>}
                  {deliveries.map((del, i) => (
                    <div key={del.id} data-testid={`elite-delivery-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EEE' }}>{del.client}</span>
                        {del.time && <span style={{ fontSize: '0.66rem', color: '#AAA', marginLeft: '6px' }}>({del.time})</span>}
                        {del.driver && <span style={{ display: 'block', fontSize: '0.64rem', color: currentRoom.color, marginTop: '2px' }}>🛵 {del.driver}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select data-testid={`elite-delivery-status-${i}`} value={del.status} onChange={e => setDeliveryStatus(del.id, e.target.value)} style={{ backgroundColor: '#0E1620', color: del.status === 'consegnato' ? '#3E9C93' : '#E6A23C', border: `1px solid ${del.status === 'consegnato' ? '#3E9C93' : '#E6A23C'}`, borderRadius: '6px', padding: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                          <option value="in consegna">{_pick("In consegna", "Unterwegs", "Out for delivery", "En reparto", "En livraison", "در حال تحویل")}</option>
                          <option value="consegnato">{_pick("Consegnato", "Geliefert", "Delivered", "Entregado", "Livré", "تحویل شد")}</option>
                        </select>
                        <button data-testid={`elite-delivery-delete-${i}`} onClick={() => deleteDelivery(del.id)} title="Elimina" style={{ backgroundColor: 'rgba(230,57,70,0.12)', color: '#E63946', border: '1px solid rgba(230,57,70,0.3)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.66rem', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input data-testid="elite-delivery-client" value={newClient} onChange={e => setNewClient(e.target.value)} placeholder={_pick("Cliente", "Kunde", "Client", "Cliente", "Client", "مشتری")} style={{ flex: '2 1 110px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '7px', fontSize: '0.72rem' }} />
                    <select data-testid="elite-delivery-driver" value={newDriver} onChange={e => setNewDriver(e.target.value)} style={{ flex: '1 1 90px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '7px', fontSize: '0.72rem' }}>
                      <option value="">{_pick("Fattorino", "Fahrer", "Driver", "Repartidor", "Livreur", "پیک")}</option>
                      {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input data-testid="elite-delivery-time" value={newDeliveryTime} onChange={e => setNewDeliveryTime(e.target.value)} placeholder={_pick("Ora", "Zeit", "Time", "Hora", "Heure", "زمان")} style={{ flex: '1 1 60px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '7px', fontSize: '0.72rem' }} />
                    <button data-testid="elite-delivery-add" onClick={addDelivery} style={{ backgroundColor: currentRoom.color, color: '#000', border: 'none', borderRadius: '6px', padding: '7px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}>＋</button>
                  </div>
                )}
              </div>
            )}
            {/* CESTE SMART — smistamento rapido prodotti sfornati per negozio */}
            {!readOnly && (
              <div data-testid="elite-crates" style={{ marginTop: '14px', backgroundColor: 'rgba(0,0,0,0.55)', border: `2px solid ${currentRoom.color}55`, borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: currentRoom.color, fontWeight: 800, marginBottom: '8px' }}>
                  📦 {_pick("Smistamento Rapido Ceste", "Schnelle Körbe", "Quick Crate Packing", "Cestas rápidas", "Paniers rapides", "بسته‌بندی سریع")}
                </div>
                {/* Griglia ceste per negozio */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  {crates.length === 0 && <div style={{ fontSize: '0.72rem', color: '#AAA' }}>{_pick("Nessuna cesta. Creane una per un negozio.", "Keine Körbe.", "No crates yet. Create one for a shop.", "Sin cestas.", "Aucun panier.", "سبدی نیست.")}</div>}
                  {crates.map((c, i) => (
                    <div key={c.id} data-testid={`elite-crate-${i}`} onClick={() => setTargetCrateId(c.id)} style={{ cursor: 'pointer', backgroundColor: targetCrateId === c.id ? 'rgba(62,156,147,0.12)' : 'rgba(255,255,255,0.05)', border: `2px solid ${targetCrateId === c.id ? currentRoom.color : 'rgba(255,255,255,0.12)'}`, borderRadius: '10px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFF' }}>{c.store_name}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button data-testid={`elite-crate-clear-${i}`} onClick={(e) => { e.stopPropagation(); clearCrate(c.id); }} title="Svuota" style={{ backgroundColor: 'transparent', color: '#AAA', border: '1px solid #55606B', borderRadius: '6px', padding: '2px 6px', fontSize: '0.62rem', cursor: 'pointer' }}>🧹</button>
                          <button data-testid={`elite-crate-delete-${i}`} onClick={(e) => { e.stopPropagation(); deleteCrate(c.id); }} title="Elimina" style={{ backgroundColor: 'rgba(230,57,70,0.12)', color: '#E63946', border: '1px solid rgba(230,57,70,0.3)', borderRadius: '6px', padding: '2px 6px', fontSize: '0.62rem', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                      <select data-testid={`elite-crate-driver-${i}`} value={c.driver || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => setCrateDriverServer(c.id, e.target.value)} style={{ width: '100%', backgroundColor: '#0E1620', color: currentRoom.color, border: `1px solid ${currentRoom.color}55`, borderRadius: '6px', padding: '4px', fontSize: '0.66rem', fontWeight: 700, marginBottom: '6px' }}>
                        <option value="">🛵 {_pick("Fattorino", "Fahrer", "Driver", "Repartidor", "Livreur", "پیک")}</option>
                        {DRIVERS.map(d => <option key={d} value={d}>🛵 {d}</option>)}
                      </select>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '30px' }}>
                        {(c.items || []).length === 0 ? <span style={{ fontSize: '0.66rem', color: '#777', fontStyle: 'italic' }}>{_pick("Cesta vuota…", "Leer…", "Empty…", "Vacía…", "Vide…", "خالی…")}</span>
                          : (c.items || []).map((p, j) => <span key={j} style={{ backgroundColor: currentRoom.color, color: '#000', fontSize: '0.64rem', padding: '3px 6px', borderRadius: '6px', fontWeight: 800 }}>{p}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Tasti giganti sfornata veloce */}
                {crates.length > 0 && (
                  <>
                  <div style={{ fontSize: '0.66rem', color: '#CCC', fontWeight: 700, marginBottom: '6px' }}>{_pick("Sfornata veloce → cesta selezionata", "Schnell in Korb", "Quick bake → selected crate", "Rápido → cesta", "Rapide → panier", "سریع → سبد")}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '8px' }}>
                    {QUICK_BAKES.map((q, i) => (
                      <button key={q} data-testid={`elite-quickbake-${i}`} onClick={() => addToCrate(q)} style={{ backgroundColor: 'rgba(62,156,147,0.18)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '10px', padding: '12px 6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
                        ＋ {q}
                      </button>
                    ))}
                  </div>
                  <select data-testid="elite-crate-target" value={targetCrateId} onChange={(e) => setTargetCrateId(e.target.value)} style={{ width: '100%', backgroundColor: '#0E1620', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '8px', padding: '8px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '8px' }}>
                    {crates.map(c => <option key={c.id} value={c.id}>📦 {c.store_name}</option>)}
                  </select>
                  </>
                )}
                {/* Crea nuova cesta */}
                {isCapo && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input data-testid="elite-crate-store" value={newStore} onChange={e => setNewStore(e.target.value)} placeholder={_pick("Nuovo negozio…", "Neuer Laden…", "New shop…", "Nueva tienda…", "Nouveau magasin…", "فروشگاه جدید…")} style={{ flex: '2 1 130px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '8px', fontSize: '0.72rem' }} />
                    <select data-testid="elite-crate-newdriver" value={crateDriver} onChange={e => setCrateDriver(e.target.value)} style={{ flex: '1 1 90px', minWidth: 0, backgroundColor: '#0E1620', color: '#FFF', border: '1px solid #33414E', borderRadius: '6px', padding: '8px', fontSize: '0.72rem' }}>
                      {DRIVERS.map(d => <option key={d} value={d}>🛵 {d}</option>)}
                    </select>
                    <button data-testid="elite-crate-create" onClick={createCrate} style={{ backgroundColor: currentRoom.color, color: '#000', border: 'none', borderRadius: '6px', padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem' }}>＋ {_pick("Cesta", "Korb", "Crate", "Cesta", "Panier", "سبد")}</button>
                  </div>
                )}
              </div>
            )}
            </>
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
