/* ============================================================================
   MIKILAB ELITE ENGINE v9.0 - BIG MIX AI (FULL REBUILD & REFACTOR)
   UI Theme: Grain Gold (#D4AF37) / Deep Slate (#0A0A0C) / Amber (#FFB300)
   System: Integrated Anti-Error OS, IoT Sensors, AI Vision & Radio
   Reso come overlay a schermo intero (createPortal) con Chiudi + ESC.
   ============================================================================ */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function MikiLabEliteEngine({ open, onClose }) {
  const SYSTEM_NAME = "MikiLab OS v9.0";
  const AI_IDENTITY = "Big Mix AI";

  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('it-IT');

  // --- RICETTARIO UNIFICATO BÄCKEREI & KONDITOREI ---
  const [activeCategory, setActiveCategory] = useState('Brot');
  const [recipes] = useState([
    { id: 'brot_matera', cat: 'Brot', name: 'Pane di Matera IGP', farina: 50, acqua: 34, lievito: 0.75, sale: 1.0, note: 'Lievitazione lunga' },
    { id: 'brot_dinkel', cat: 'Brot', name: 'Dinkel-Vollkornbrot', farina: 40, acqua: 28, lievito: 0.6, sale: 0.8, note: 'Grano integrale' },
    { id: 'broetchen_kaiser', cat: 'Brötchen', name: 'Kaisersemmel Classico', farina: 30, acqua: 18, lievito: 0.8, sale: 0.6, note: 'Stampa e stella veloce' },
    { id: 'broetchen_brezel', cat: 'Brötchen', name: 'Laugenbrezel Bayrisch', farina: 35, acqua: 17.5, lievito: 0.9, sale: 0.7, note: 'Bagno in soluzione soda' },
    { id: 'kondi_croissant', cat: 'Konditorei', name: 'Buttercroissant', farina: 25, acqua: 12.5, burro: 12.5, lievito: 0.5, note: 'Laminazione a 4-4' },
    { id: 'precotto_baguette', cat: 'Vorgebacken', name: 'Par-Baked Baguette (80%)', farina: 30, acqua: 21, lievito: 0.5, sale: 0.6, note: 'Cottura parziale' }
  ]);

  const [selectedRecipe, setSelectedRecipe] = useState(recipes[0]);
  const [batchKg, setBatchKg] = useState(50);

  // --- TELEMETRIA HARDWARE & SENSORI ---
  const [motorKw, setMotorKw] = useState(1.85);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // --- SINTESI VOCALE MULTILINGUA ---
  const speakVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  // --- CALCOLATORE DOSI ---
  const ratio = batchKg / selectedRecipe.farina;
  const acquaLitri = (selectedRecipe.acqua * ratio).toFixed(1);
  const saleGrammi = selectedRecipe.sale ? (selectedRecipe.sale * ratio * 1000).toFixed(0) : 0;
  const lievitoGrammi = selectedRecipe.lievito ? (selectedRecipe.lievito * ratio * 1000).toFixed(0) : 0;

  if (!open) return null;

  const TABS = [
    { id: 'home', label: '🏠 HOME BANCO' },
    { id: 'ricette', label: '📖 RICETTARIO' },
    { id: 'camera', label: '📸 VISIONE AI' },
    { id: 'stock', label: '📦 MAGAZZINO' },
    { id: 'regia', label: '👑 REGIA' }
  ];

  return createPortal(
    <div data-testid="elite-engine-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', backgroundColor: '#0A0A0C', color: '#F0F0F0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '12px', maxWidth: 680, margin: '0 auto', paddingBottom: '80px' }}>

        {/* HEADER MASTER OS */}
        <div style={{ borderBottom: '2px solid #D4AF37', paddingBottom: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: '#D4AF37', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', fontSize: '0.75rem' }}>{AI_IDENTITY}</span>
              <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#D4AF37', letterSpacing: '0.5px' }}>{SYSTEM_NAME}</h1>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#00E676', marginTop: '3px' }}>● SISTEMA UNIFICATO PRONTO | HARDWARE ONLINE</div>
          </div>

          {/* CONTROLLI RADIO & LINGUA + CHIUDI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button data-testid="elite-radio-toggle" onClick={() => { setRadioPlaying(!radioPlaying); speakVoice(radioPlaying ? "Radio in pausa" : "Radio attivata"); }} style={{ backgroundColor: radioPlaying ? '#00E676' : '#18181A', color: radioPlaying ? '#000' : '#FFF', border: '1px solid #333', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
              📻 RADIO: {radioPlaying ? 'ON' : 'OFF'}
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              {['it-IT', 'de-DE', 'ro-RO'].map(lang => (
                <button key={lang} data-testid={`elite-lang-${lang.split('-')[0]}`} onClick={() => { setLanguage(lang); speakVoice(`Lingua ${lang.split('-')[0]}`); }} style={{ backgroundColor: language === lang ? '#D4AF37' : '#18181A', color: language === lang ? '#000' : '#FFF', border: '1px solid #333', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  {lang.split('-')[0].toUpperCase()}
                </button>
              ))}
            </div>

            <button data-testid="elite-close" onClick={onClose} aria-label="Chiudi" style={{ backgroundColor: '#18181A', color: '#FFF', border: '1px solid #333', padding: '5px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MENU TABS UNIFICATO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '12px' }}>
          {TABS.map(tab => (
            <button key={tab.id} data-testid={`elite-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{ backgroundColor: activeTab === tab.id ? '#D4AF37' : '#18181A', color: activeTab === tab.id ? '#000' : '#FFF', border: '1px solid #222', padding: '10px 2px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: HOME BANCO ================= */}
        {activeTab === 'home' && (
          <div data-testid="elite-panel-home" style={{ display: 'grid', gap: '10px' }}>

            {/* DOSAGGIO CON SINTESI VOCALE */}
            <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#D4AF37', fontSize: '0.95rem' }}>🥣 {selectedRecipe.name}</h3>
                <span style={{ fontSize: '0.7rem', color: '#FFB300' }}>Cat: {selectedRecipe.cat}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem' }}>Farina (kg):</label>
                <input data-testid="elite-input-kg" type="number" value={batchKg} onChange={(e) => setBatchKg(Number(e.target.value))} style={{ backgroundColor: '#0A0A0C', color: '#D4AF37', border: '1px solid #D4AF37', padding: '4px 8px', borderRadius: '4px', width: '70px', fontWeight: 'bold' }} />
                <button data-testid="elite-read-doses" onClick={() => speakVoice(`Impostati ${batchKg} kg di farina. Dosi: ${acquaLitri} litri di acqua a tre T e ${saleGrammi} grammi di sale.`)} style={{ backgroundColor: '#18181A', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  🎙️ LEGGI DOSI
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div><span style={{ fontSize: '0.65rem', color: '#AAA' }}>💧 ACQUA 3T</span><br /><strong style={{ color: '#00E676', fontSize: '1rem' }}>{acquaLitri} L</strong></div>
                <div><span style={{ fontSize: '0.65rem', color: '#AAA' }}>🧂 SALE</span><br /><strong style={{ color: '#FFB300', fontSize: '1rem' }}>{saleGrammi} g</strong></div>
                <div><span style={{ fontSize: '0.65rem', color: '#AAA' }}>🍞 LIEVITO</span><br /><strong style={{ color: '#FFF', fontSize: '1rem' }}>{lievitoGrammi} g</strong></div>
              </div>
            </div>

            {/* CONTROL SENSOR IOT (VERIFICA SALE) */}
            <div data-testid="elite-iot-sensor" style={{ backgroundColor: motorKw < 1.3 ? '#2A0008' : '#141416', border: motorKw < 1.3 ? '2px solid #FF1744' : '1px solid #00E676', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>⚡ Sforzo Motore Spirale:</span>
                <strong style={{ fontSize: '1.1rem', color: motorKw < 1.3 ? '#FF1744' : '#00E676' }}>{motorKw} kW</strong>
              </div>

              {motorKw < 1.3 ? (
                <div style={{ color: '#FF1744', marginTop: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  ⚠️ ALLARME: Resistenza impasto insufficiente. Mancanza sale rilevata!
                </div>
              ) : (
                <div style={{ color: '#00E676', marginTop: '4px', fontSize: '0.75rem' }}>
                  ✓ Formazione maglia glutinica e sale confermati.
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button data-testid="elite-sim-ok" onClick={() => setMotorKw(1.85)} style={{ backgroundColor: '#0A0A0C', color: '#00E676', border: '1px solid #00E676', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}>Simula Impasto OK</button>
                <button data-testid="elite-sim-nosalt" onClick={() => setMotorKw(0.95)} style={{ backgroundColor: '#0A0A0C', color: '#FF1744', border: '1px solid #FF1744', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}>Simula Manca Sale</button>
              </div>
            </div>

            {/* CHECKOUT FINE TURNO */}
            <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: checkoutDone ? '1px solid #00E676' : '1px solid #FF1744' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>🛡️ Ciclo Automatico Notturno</span>
                <button data-testid="elite-nightcycle" onClick={() => { setCheckoutDone(!checkoutDone); speakVoice(checkoutDone ? "Ciclo disattivato" : "Ciclo notturno attivato"); }} style={{ backgroundColor: checkoutDone ? '#00E676' : '#FF1744', color: checkoutDone ? '#000' : '#FFF', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  {checkoutDone ? '✓ CELLA ATTIVA' : 'ATTIVA ORA'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: RICETTARIO ================= */}
        {activeTab === 'ricette' && (
          <div data-testid="elite-panel-ricette" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37', fontSize: '0.95rem' }}>📖 Seleziona Ricetta da Produzione</h3>

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

        {/* ================= TAB 3: CAMERA AI ================= */}
        {activeTab === 'camera' && (
          <div data-testid="elite-panel-camera" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '0.95rem' }}>📸 Scansione AI Alveolatura & Bolle</h3>

            <div style={{ backgroundColor: '#0A0A0C', height: '160px', borderRadius: '6px', border: '1px dashed #D4AF37', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '10px 0' }}>
              {cameraActive ? (
                <span style={{ color: '#00E676', fontWeight: 'bold', fontSize: '0.8rem' }}>📷 SCANSIONE IN CORSO... (LIVE FEED OK)</span>
              ) : (
                <button data-testid="elite-cam-activate" onClick={() => setCameraActive(true)} style={{ backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
                  ATTIVA FOTOCAMERA
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: STOCK ================= */}
        {activeTab === 'stock' && (
          <div data-testid="elite-panel-stock" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '0.95rem' }}>📦 Stato Silos & Stock</h3>
            <div style={{ backgroundColor: '#0A0A0C', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #00E676' }}>
              <strong>🌾 Silos Farina T500:</strong> <span style={{ color: '#00E676', fontWeight: 'bold' }}>84% Disponibile</span>
            </div>
          </div>
        )}

        {/* ================= TAB 5: REGIA ================= */}
        {activeTab === 'regia' && (
          <div data-testid="elite-panel-regia" style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #2A2A2E' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '0.95rem' }}>👑 Regia Big Mix AI</h3>
            <button data-testid="elite-send-report" onClick={() => speakVoice("Report serale inviato all'ufficio contabile.")} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', width: '100%', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
              📄 INVIA TAGESBERICHT VIA EMAIL
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
