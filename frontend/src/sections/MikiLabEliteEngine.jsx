/* ============================================================================
   MIKILAB OS v10.3 - ULTIMATE 3D BAKERY ENTERPRISE EDITION (Miki & Mohamed)
   UI: Real Photos + Real Radio (RAI stream) + DB Recipes + Push Notifications
   Reso come overlay a schermo intero (createPortal) con Chiudi + ESC.
   ============================================================================ */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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

const ROOM_IDS = ['impasti', 'forni', 'pasticceria', 'laugen', 'banco', 'pretzel'];

export default function MikiLabEliteEngine({ open, onClose, locked = false, lockedDept = '' }) {
  const hasValidDept = ROOM_IDS.includes(lockedDept);
  const isLocked = locked; // operatore/sostituto: sempre bloccato (fail-closed anche senza reparto valido)
  const [activeTab, setActiveTab] = useState(locked && hasValidDept ? lockedDept : 'impasti');
  const [language, setLanguage] = useState('it-IT');
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
    }
    return () => clearInterval(interval);
  }, [isBaking, timerSeconds]);

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

  // AMBIENTI 3D DEL PANIFICIO (con FOTO REALI di Miki & Mohamed)
  const rooms3D = {
    impasti: {
      title: "🌾 BANCO IMPASTI & SILOS 3D",
      color: "#5E8CA8",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #1B2A38 55%, #3E9C93 100%)",
      avatarName: "Michele (Maestro Impastatore)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Michele sta gestendo il banco impasti, l'acqua e la spirale!",
      item3D: "📦 Silo Farina T500 & Vasca Impastatrice",
      desc: "Reparto impasti ad alta idratazione e controllo del glutine"
    },
    forni: {
      title: "🔥 FORNI SINCRONIZZATI 3D",
      color: "#3E9C93",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #14212C 55%, #5E8CA8 100%)",
      avatarName: "Michele (Capo Fornaio)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Michele sta sincronizzando forni, vapore e timer di cottura!",
      item3D: "🌋 Forni Sincronizzati con Mattoni Refrattari",
      desc: "Gestione vapore, infornate e timer di cottura con allarme e notifica"
    },
    pasticceria: {
      title: "🥐 KONDITOREI & PASTICCERIA 3D",
      color: "#7FB0A6",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #1B2A38 55%, #7FB0A6 100%)",
      avatarName: "Michele (Maestro Pasticcere)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Laminazione del burro e abbattitore in azione!",
      item3D: "🧊 Abbattitore -35°C & Sfogliatrice",
      desc: "Calcolo pieghe 4-4 e gestione temperature burro"
    },
    laugen: {
      title: "🥨 LINEA LAUGEN 3D",
      color: "#5E8CA8",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #14212C 55%, #3E9C93 100%)",
      avatarName: "Michele (Operatore Laugen)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Immersione in soda e taglio: linea Laugen operativa!",
      item3D: "🧪 Vasca Soda Laugen & Sale Grosso",
      desc: "Bretzel e Laugengebäck: bagno alcalino, sicurezza e taglio"
    },
    banco: {
      title: "✋ LAVORI A MANO (BANCO) 3D",
      color: "#3E9C93",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #1B2A38 55%, #5E8CA8 100%)",
      avatarName: "Michele (Formatore Artigianale)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Formatura a mano: pezzatura, arrotondamento e taglio!",
      item3D: "🪵 Banco in Legno & Tarocco",
      desc: "Formatura artigianale, pezzatura e pirlatura a mano"
    },
    pretzel: {
      title: "⚙️ MACCHINA / POSTAZIONE PRETZEL",
      color: "#8FB0C2",
      bgGradient: "linear-gradient(135deg, #0E1620 0%, #14212C 55%, #8FB0C2 100%)",
      avatarName: "Michele (Operatore Macchine Dedicate)",
      avatarImg: "/michele-real-lab.jpg",
      avatarAction: "Postazione Pretzel dedicata · turno delle 05:00 attivo!",
      item3D: "🥨 Macchina Pretzel Automatica (slot 05:00)",
      desc: "Lavori a macchina e postazione Pretzel con slot orario dedicato"
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
            { id: 'impasti', icon: '🌾', label: 'IMPASTI' },
            { id: 'forni', icon: '🔥', label: 'FORNI' },
            { id: 'pasticceria', icon: '🥐', label: 'PASTICCERIA' },
            { id: 'laugen', icon: '🥨', label: 'LAUGEN' },
            { id: 'banco', icon: '✋', label: 'BANCO' },
            { id: 'pretzel', icon: '⚙️', label: 'PRETZEL' }
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

          {activeTab === 'impasti' && (
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
                  <input data-testid="elite-input-kg" type="number" value={batchKg} onChange={(e) => setBatchKg(Number(e.target.value))} style={{ width: '70px', backgroundColor: 'rgba(0,0,0,0.4)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '4px', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }} />
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

          {activeTab === 'forni' && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#C2612E' }}>🔥 Forno Rotativo ({ovenTemp}°C) - Allarme + Notifica Telefono</div>
              {ovenRecipeName && (
                <div data-testid="elite-oven-recipe" style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '4px' }}>
                  📖 Parametri da ricetta: <strong>{ovenRecipeName}</strong>
                </div>
              )}
              <div data-testid="elite-timer" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '6px 0', fontFamily: 'monospace' }}>
                {formatTime(timerSeconds)}
              </div>
              <button data-testid="elite-start-bake" onClick={startBake} style={{ backgroundColor: '#C2612E', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isBaking ? '⏳ COTTURA IN CORSO (ALLARME PRONTO)...' : '▶️ AVVIA COTTURA & NOTIFICA'}
              </button>
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
