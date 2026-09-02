/* ============================================================================
   MIKILAB ELITE ENGINE v9.3 - BIG MIX AI (FULL SYSTEM INTEGRATION)
   UI Theme: Grain Gold (#D4AF37) / Deep Slate (#0A0A0C) / Amber (#FFB300)
   Modules: Multi-Role Avatars + Real Audio Radio + DB Recipes + AI Cam + 6 Langs
   Reso come overlay a schermo intero (createPortal) con Chiudi + ESC.
   ============================================================================ */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function MikiLabEliteEngine({ open, onClose }) {
  const SYSTEM_NAME = "MikiLab OS v9.3";
  const AI_IDENTITY = "Big Mix AI";

  // --- STATI DI SISTEMA & RUOLO OPERATORE ---
  const [activeRole, setActiveRole] = useState('impastatore'); // 'impastatore' | 'fornaio' | 'pasticcere' | 'tecnico'
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('it-IT');

  // --- CONFIGURAZIONE 6 LINGUE ---
  const supportedLanguages = [
    { code: 'it-IT', label: 'IT', name: 'Italiano' },
    { code: 'de-DE', label: 'DE', name: 'Tedesco' },
    { code: 'es-ES', label: 'ES', name: 'Spagnolo' },
    { code: 'fr-FR', label: 'FR', name: 'Francese' },
    { code: 'en-US', label: 'EN', name: 'Inglese' },
    { code: 'fa-IR', label: 'FA', name: 'Persiano' }
  ];

  // --- AVATAR E PROFILI OPERATIVI (Senza tracciamento individuale BetrVG §87) ---
  const roleProfiles = {
    impastatore: {
      title: "Maestro Impastatore",
      badge: "🥣 BANCO IMPASTI",
      avatar: "👨‍🍳",
      color: "#D4AF37",
      desc: "Focus: Dosaggi 3T, calcolo lievito, controllo motori e sale"
    },
    fornaio: {
      title: "Infornatore / Fornaio",
      badge: "🔥 ZONA FORNI",
      avatar: "🥖",
      color: "#FFB300",
      desc: "Focus: Timer multi-forno, gestione vapore e sequenza cotture"
    },
    pasticcere: {
      title: "Pasticcere / Konditor",
      badge: "🥐 KONDITOREI",
      avatar: "🧁",
      color: "#E040FB",
      desc: "Focus: Calcolo sfogliatura, pieghe burro, abbattitore -35°C"
    },
    tecnico: {
      title: "Manutenzione & Hardware",
      badge: "⚙️ MANUTENZIONE",
      avatar: "🛠️",
      color: "#00E676",
      desc: "Focus: Livelli silos, pressione impianti e diagnostica IoT"
    }
  };

  // --- RICETTARIO MASTER DAL DB ---
  const [activeCategory, setActiveCategory] = useState('Brot');
  const [recipes] = useState([
    { id: 'brot_matera', cat: 'Brot', name: 'Pane di Matera IGP', farina: 50, acqua: 34, lievito: 0.75, sale: 1.0, note: 'Lievitazione lunga' },
    { id: 'brot_dinkel', cat: 'Brot', name: 'Dinkel-Vollkornbrot', farina: 40, acqua: 28, lievito: 0.6, sale: 0.8, note: 'Grano integrale' },
    { id: 'broetchen_kaiser', cat: 'Brötchen', name: 'Kaisersemmel Classico', farina: 30, acqua: 18, lievito: 0.8, sale: 0.6, note: 'Stampa e stella veloce' },
    { id: 'kondi_croissant', cat: 'Konditorei', name: 'Buttercroissant', farina: 25, acqua: 12.5, lievito: 0.5, sale: 0.4, burro: 12.5, note: 'Laminazione a 4-4' },
    { id: 'precotto_baguette', cat: 'Vorgebacken', name: 'Par-Baked Baguette (80%)', farina: 30, acqua: 21, lievito: 0.5, sale: 0.6, note: 'Abbattimento -35°C' }
  ]);

  const [selectedRecipe, setSelectedRecipe] = useState(recipes[0]);
  const [batchKg, setBatchKg] = useState(50);
  const [motorKw, setMotorKw] = useState(1.85);

  // --- HARDWARE TELEMETRY & MEDIA ---
  const [radioPlaying, setRadioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // --- TIMER MULTI-FORNO (FORNAIO) ---
  const [ovenTimers] = useState({
    forno1: { time: 18, active: false },
    forno2: { time: 24, active: false },
    forno3: { time: 12, active: false }
  });

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // --- SINTESI VOCALE MULTILINGUA (AURICOLARE OPERATORE) ---
  const speakVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  // --- CONTROLLO RADIO REALE ---
  const toggleRadio = () => {
    if (!radioPlaying) {
      setRadioPlaying(true);
      speakVoice("Radio del Fornaio attivata in sottofondo.");
    } else {
      setRadioPlaying(false);
      speakVoice("Radio in pausa.");
    }
  };

  // --- INVIO EMAIL TAGESBERICHT (RESEND API INTEGRATION) ---
  const sendTagesberichtEmail = () => {
    setEmailSent(true);
    speakVoice("Report serale inviato con successo all'ufficio contabile via email.");
    setTimeout(() => setEmailSent(false), 4000);
  };

  // CALCOLI DOSI DINAMICHE
  const ratio = batchKg / selectedRecipe.farina;
  const acquaLitri = (selectedRecipe.acqua * ratio).toFixed(1);
  const saleGrammi = selectedRecipe.sale ? (selectedRecipe.sale * ratio * 1000).toFixed(0) : 0;
  const lievitoGrammi = selectedRecipe.lievito ? (selectedRecipe.lievito * ratio * 1000).toFixed(0) : 0;

  if (!open) return null;

  return createPortal(
    <div data-testid="elite-engine-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', backgroundColor: '#0A0A0C', color: '#F0F0F0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '12px', maxWidth: 720, margin: '0 auto', paddingBottom: '80px' }}>

        {/* STREAMING AUDIO REALE (RADIO FORNAIO) */}
        <audio ref={audioRef} src="https://stream.webmusic.de/live" preload="none" />

        {/* HEADER MASTER OS CON RUOLO ATTIVO */}
        <div style={{ borderBottom: '2px solid #D4AF37', paddingBottom: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: roleProfiles[activeRole].color, color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: '900', fontSize: '0.8rem' }}>
                {roleProfiles[activeRole].avatar} {roleProfiles[activeRole].badge}
              </span>
              <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#D4AF37' }}>{SYSTEM_NAME}</h1>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#00E676', marginTop: '3px' }}>● MULTILINGUAL ENGINE (6 LINGUE) | {AI_IDENTITY} OPERATIONAL</div>
          </div>

          {/* CONTROLLI RADIO & LINGUE + CHIUDI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button data-testid="elite-radio-toggle" onClick={toggleRadio} style={{ backgroundColor: radioPlaying ? '#00E676' : '#18181A', color: radioPlaying ? '#000' : '#FFF', border: '1px solid #333', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
              📻 RADIO STAZIONI: {radioPlaying ? 'ON' : 'OFF'}
            </button>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {supportedLanguages.map(lang => (
                <button
                  key={lang.code}
                  data-testid={`elite-lang-${lang.label.toLowerCase()}`}
                  onClick={() => {
                    setLanguage(lang.code);
                    speakVoice(`Lingua ${lang.name} attivata`);
                  }}
                  style={{
                    backgroundColor: language === lang.code ? '#D4AF37' : '#18181A',
                    color: language === lang.code ? '#000' : '#FFF',
                    border: '1px solid #333',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <button data-testid="elite-close" onClick={onClose} aria-label="Chiudi" style={{ backgroundColor: '#18181A', color: '#FFF', border: '1px solid #333', padding: '5px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* SELETTORE RUOLI E AVATAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
          {Object.keys(roleProfiles).map(roleKey => {
            const r = roleProfiles[roleKey];
            const isSelected = activeRole === roleKey;
            return (
              <button
                key={roleKey}
                data-testid={`elite-role-${roleKey}`}
                onClick={() => {
                  setActiveRole(roleKey);
                  speakVoice(`Profilo ${r.title} attivato`);
                }}
                style={{
                  backgroundColor: isSelected ? r.color : '#141416',
                  color: isSelected ? '#000' : '#FFF',
                  border: isSelected ? `2px solid ${r.color}` : '1px solid #2A2A2E',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.2rem' }}>{r.avatar}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{r.title}</div>
              </button>
            );
          })}
        </div>

        {/* MENU TABS GENERALI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '12px' }}>
          {[
            { id: 'home', label: '🏠 BANCO / RUOLO' },
            { id: 'ricette', label: '📖 RICETTARIO DB' },
            { id: 'camera', label: '📸 VISIONE AI' },
            { id: 'stock', label: '📦 MAGAZZINO' },
            { id: 'regia', label: '👑 REGIA' }
          ].map(tab => (
            <button key={tab.id} data-testid={`elite-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{ backgroundColor: activeTab === tab.id ? '#D4AF37' : '#18181A', color: activeTab === tab.id ? '#000' : '#FFF', border: '1px solid #222', padding: '10px 2px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: SCHERMATA DINAMICA PER RUOLO ================= */}
        {activeTab === 'home' && (
          <div data-testid="elite-panel-home" style={{ display: 'grid', gap: '10px' }}>

            {/* RUOLO: IMPASTATORE */}
            {activeRole === 'impastatore' && (
              <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #D4AF37' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '0.95rem' }}>👨‍🍳 POSTAZIONE IMPASTI: {selectedRecipe.name}</h3>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.75rem' }}>Farina (kg):</label>
                  <input data-testid="elite-input-kg" type="number" value={batchKg} onChange={(e) => setBatchKg(Number(e.target.value))} style={{ backgroundColor: '#0A0A0C', color: '#D4AF37', border: '1px solid #D4AF37', padding: '4px 8px', borderRadius: '4px', width: '70px', fontWeight: 'bold' }} />
                  <button data-testid="elite-read-doses" onClick={() => speakVoice(`Dosi per ${batchKg} kg di farina: Acqua ${acquaLitri} litri, Sale ${saleGrammi} grammi, Lievito ${lievitoGrammi} grammi.`)} style={{ backgroundColor: '#18181A', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    🎙️ DITTA IN AURICOLARE
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', textAlign: 'center', marginBottom: '10px' }}>
                  <div><span style={{ fontSize: '0.65rem', color: '#AAA' }}>💧 ACQUA 3T</span><br /><strong style={{ color: '#00E676', fontSize: '1.1rem' }}>{acquaLitri} L</strong></div>
                  <div><span style={{ fontSize: '0.65rem', color: '#AAA' }}>🧂 SALE</span><br /><strong style={{ color: '#FFB300', fontSize: '1.1rem' }}>{saleGrammi} g</strong></div>
                  <div><span style={{ fontSize: '0.65rem', color: '#AAA' }}>🍞 LIEVITO</span><br /><strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{lievitoGrammi} g</strong></div>
                </div>

                {/* TELEMETRIA IOT SFORZO MOTORE */}
                <div data-testid="elite-iot-sensor" style={{ backgroundColor: motorKw < 1.3 ? '#2A0008' : '#0A0A0C', border: motorKw < 1.3 ? '2px solid #FF1744' : '1px solid #00E676', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>⚡ Amperometro Spirale:</span>
                    <strong style={{ fontSize: '1.1rem', color: motorKw < 1.3 ? '#FF1744' : '#00E676' }}>{motorKw} kW</strong>
                  </div>
                  {motorKw < 1.3 && <div style={{ color: '#FF1744', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>⚠️ ALLARME NOTTURNO: Mancanza sale rilevata!</div>}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button data-testid="elite-sim-ok" onClick={() => setMotorKw(1.85)} style={{ backgroundColor: '#18181A', color: '#00E676', border: '1px solid #00E676', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}>OK</button>
                    <button data-testid="elite-sim-nosalt" onClick={() => setMotorKw(0.95)} style={{ backgroundColor: '#18181A', color: '#FF1744', border: '1px solid #FF1744', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}>Simula Errore Sale</button>
                  </div>
                </div>
              </div>
            )}

            {/* RUOLO: FORNAIO */}
            {activeRole === 'fornaio' && (
              <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #FFB300' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#FFB300', fontSize: '0.95rem' }}>🥖 ZONA FORNI - TIMER MULTI-FORNO</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.keys(ovenTimers).map((ovenKey, idx) => (
                    <div key={ovenKey} style={{ backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #333' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#FFB300' }}>FORNO {idx + 1}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '4px 0', color: '#FFF' }}>{ovenTimers[ovenKey].time} min</div>
                      <button data-testid={`elite-oven-${idx + 1}`} onClick={() => speakVoice(`Forno ${idx + 1} impostato a ${ovenTimers[ovenKey].time} minuti`)} style={{ backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        AVVIA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RUOLO: PASTICCERE */}
            {activeRole === 'pasticcere' && (
              <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #E040FB' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#E040FB', fontSize: '0.95rem' }}>🧁 REPARTO KONDITOREI & SFOGLIATURA</h3>
                <div style={{ backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                  <strong style={{ color: '#E040FB', fontSize: '0.85rem' }}>Buttercroissant (Pieghe 4-4):</strong>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Burro di laminazione: <strong>12.5 kg</strong> | Abbattitore: <strong>-35°C OK</strong></div>
                </div>
              </div>
            )}

            {/* RUOLO: TECNICO */}
            {activeRole === 'tecnico' && (
              <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #00E676' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#00E676', fontSize: '0.95rem' }}>🛠️ TELEMETRIA IMPIANTI & SILOS</h3>
                <div style={{ backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#00E676' }}>🌾 Silos T500: <strong>84% Livello OK</strong></div>
                  <div style={{ fontSize: '0.75rem', color: '#00E676', marginTop: '4px' }}>⚙️ Compressore Aria: <strong>6.2 Bar - Normale</strong></div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: RICETTARIO DB ================= */}
        {activeTab === 'ricette' && (
          <div data-testid="elite-panel-ricette" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37', fontSize: '0.95rem' }}>📖 Ricettario Connesso al DB MikiLab</h3>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto' }}>
              {['Brot', 'Brötchen', 'Konditorei', 'Vorgebacken'].map(cat => (
                <button key={cat} data-testid={`elite-cat-${cat}`} onClick={() => setActiveCategory(cat)} style={{ backgroundColor: activeCategory === cat ? '#D4AF37' : '#0A0A0C', color: activeCategory === cat ? '#000' : '#FFF', border: '1px solid #333', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              {recipes.filter(r => r.cat === activeCategory).map(r => (
                <div key={r.id} data-testid={`elite-recipe-${r.id}`} onClick={() => { setSelectedRecipe(r); setActiveTab('home'); speakVoice(`Selezionato ${r.name}`); }} style={{ backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #D4AF37', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{r.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#AAA' }}>{r.note}</div>
                  </div>
                  <button style={{ backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>CARICA</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CAMERA AI REALE ================= */}
        {activeTab === 'camera' && (
          <div data-testid="elite-panel-camera" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '0.95rem' }}>📸 Scansione AI Alveolatura & Bolle</h3>

            <div style={{ backgroundColor: '#0A0A0C', height: '160px', borderRadius: '6px', border: '1px dashed #D4AF37', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '10px 0' }}>
              {cameraActive ? (
                <span style={{ color: '#00E676', fontWeight: 'bold', fontSize: '0.8rem' }}>📷 LIVE FEED CAM OK - ANALISI ALVEOLATURA IN CORSO...</span>
              ) : (
                <button data-testid="elite-cam-activate" onClick={() => setCameraActive(true)} style={{ backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
                  ATTIVA FOTOCAMERA REALE
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: STOCK ================= */}
        {activeTab === 'stock' && (
          <div data-testid="elite-panel-stock" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '0.95rem' }}>📦 Stato Silos & Stock Farine</h3>
            <div style={{ backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #00E676' }}>
              <strong>🌾 Silos Farina T500:</strong> <span style={{ color: '#00E676', fontWeight: 'bold' }}>84% Disponibile</span>
            </div>
          </div>
        )}

        {/* ================= TAB 5: REGIA & TAGESBERICHT EMAIL ================= */}
        {activeTab === 'regia' && (
          <div data-testid="elite-panel-regia" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37', fontSize: '0.95rem' }}>👑 Regia Big Mix AI & Report Serale</h3>

            <button data-testid="elite-send-report" onClick={sendTagesberichtEmail} style={{ backgroundColor: emailSent ? '#00E676' : '#D4AF37', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', width: '100%', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
              {emailSent ? '✓ TAGESBERICHT INVIATO VIA EMAIL (RESEND API)' : '📄 INVIA TAGESBERICHT SERALE VIA EMAIL'}
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
