/* ============================================================================
   MIKILAB ELITE OS v5.0 — FULL INDUSTRIAL ENGINE
   Tema: Grain Gold #D4AF37 / Dark Slate #0B0B0C
   Focus: Anti-Error OS + Bäckerei/Konditorei + Full Automation + Camera AI
   Reso come overlay a schermo intero (createPortal) con Chiudi + ESC.
   ============================================================================ */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function MikiLabEliteEngine({ open, onClose }) {
  const SYSTEM_NAME = "MikiLab OS v5.0";
  const [activeTab, setActiveTab] = useState('banco');
  const [language, setLanguage] = useState('it-IT');

  // --- 1. RICETTARIO DIVISO PER CATEGORIE (BÄCKEREI & KONDITOREI) ---
  const [activeCategory, setActiveCategory] = useState('Brot');
  const [recipeBook] = useState([
    // BROT (PANE)
    { id: 'pane_matera', cat: 'Brot', nome: 'Pane di Matera IGP', farina: 50, acqua: 34, lievito: 0.75, sale: 1.0, tempIdeal: 24, note: 'Lievitazione lunga' },
    { id: 'pane_grano_duro', cat: 'Brot', nome: 'Altstadt Landbrot (Grano Duro)', farina: 40, acqua: 26, lievito: 0.6, sale: 0.8, tempIdeal: 23, note: 'Cottura a cielo alto' },
    // BRÖTCHEN (PANINI)
    { id: 'ciabatta_trad', cat: 'Brötchen', nome: 'Ciabatta Classica 100g', farina: 25, acqua: 20, lievito: 0.5, sale: 0.5, tempIdeal: 22, note: 'Alta idratazione' },
    { id: 'laugen_brezel', cat: 'Brötchen', nome: 'Laugenbrezel Bayrisch', farina: 30, acqua: 15, lievito: 0.9, sale: 0.66, tempIdeal: 21, note: 'Passaggio in soluzione soda' },
    // KONDITOREI (PASTICCERIA)
    { id: 'schwarzwald_boden', cat: 'Konditorei', nome: 'Schwarzwälder Kirschtorte (Basi)', farina: 10, zucchero: 8, uova: 60, cacao: 2, tempIdeal: 20, note: 'Montata soffice' },
    { id: 'croissant_butter', cat: 'Konditorei', nome: 'Buttercroissant (Sfogliati)', farina: 20, acqua: 10, burroSfoglia: 10, lievito: 0.4, tempIdeal: 18, note: 'Laminazione a 4-4' },
    // VORGEBACKEN (PRECOTTO)
    { id: 'parbaked_baguette', cat: 'Vorgebacken', nome: 'Baguette Precotta (Par-Baked)', farina: 30, acqua: 21, lievito: 0.45, sale: 0.6, tempIdeal: 22, note: '80% Cottura - Vapore Max' },
    // SNACKS & RIPIENI
    { id: 'snack_focaccia', cat: 'Snacks', nome: 'Focaccia Ligure da Farcitura', farina: 20, acqua: 15, olio: 2, sale: 0.4, tempIdeal: 25, note: 'Buca manuale con salamoia' }
  ]);

  const [selectedRecipe, setSelectedRecipe] = useState(recipeBook[0]);
  const [batchKg, setBatchKg] = useState(50);

  // --- 2. HARDWARE, IOT & CELLE AUTOMATICHE ---
  const [silosFarina] = useState({ percentuale: 82, temp: 19.5 });
  const [amperometroIoT, setAmperometroIoT] = useState(1.8); // kW Assorbimento Spirale (1.8 kW = OK, <1.2 kW = Manca Sale)
  const [cellaAuto] = useState({ fase: 'Lievitazione (+24°C)', umidita: 80, contoRovescia: '00:45:00' });
  const [fornoState] = useState({ forno1: 'In Cottura (230°C)', forno2: 'PRONTO PRECOTTO (190°C)' });

  // --- 3. SCALER TUTORIAL PER APPRENDISTI ---
  const [scalerStep, setScalerStep] = useState(0);
  const scalerSteps = [
    { titolo: "1. Controllo Silos & Calcolo 3T", icona: "🌾", desc: "La farina scende dal silos a 19.5°C. MikiLab calcola l'acqua esatta a 3T per avere l'impasto a 24°C." },
    { titolo: "2. Impasto & Controllo IoT Sale", icona: "⚡", desc: "La pinza amperometrica misura 1.8 kW. Se dimentichi il sale, lo sforzo scende sotto 1.2 kW e suona l'allarme." },
    { titolo: "3. Cella Fermalievitazione Auto", icona: "❄️", desc: "La cella passa da Freezer (-18°C) a Frigo (+2°C) e infine a Lievitazione (+24°C) pronte alle 02:00 di notte." },
    { titolo: "4. Cottura Precotto & Abbattitore", icona: "🥖", desc: "I panini precotti cuociono all'80% per non scurire. Allarme vocale per estrazione e passaggio diretto a -35°C." }
  ];

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // --- 4. TRADUTTORE VOCALE MULTILINGUA (MIKI-TRANSLATE) ---
  const speakCommand = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  // --- CALCOLO DOSI DINAMICHE ---
  const factor = batchKg / selectedRecipe.farina;
  const acquaCalcolata = (selectedRecipe.acqua * factor).toFixed(1);
  const saleCalcolato = selectedRecipe.sale ? (selectedRecipe.sale * factor * 1000).toFixed(0) : 0;
  const lievitoCalcolato = selectedRecipe.lievito ? (selectedRecipe.lievito * factor * 1000).toFixed(0) : 0;

  if (!open) return null;

  const TABS = [
    { id: 'banco', label: '⚙️ BANCO' },
    { id: 'ricette', label: '📖 RICETTE' },
    { id: 'guida', label: 'ℹ️ GUIDA' },
    { id: 'camera', label: '📸 CAM AI' },
    { id: 'stock', label: '📦 STOCK' },
    { id: 'regia', label: '👑 REGIA' },
  ];

  return createPortal(
    <div data-testid="elite-engine-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', backgroundColor: '#0B0B0C', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '12px', maxWidth: 680, margin: '0 auto', paddingBottom: '80px' }}>

        {/* HEADER DI BORDO INDUSTRIAL OS */}
        <div style={{ borderBottom: '2px solid #D4AF37', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#D4AF37', letterSpacing: '1px' }}>{SYSTEM_NAME}</h1>
            <span style={{ fontSize: '0.68rem', color: '#00FF66' }}>● SENSORI IOT CONNESSI | DSGVO & BetrVG COMPLIANT</span>
          </div>

          {/* SELETTORE LINGUA INTERFONO + CHIUDI */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button data-testid="elite-lang-it" onClick={() => { setLanguage('it-IT'); speakCommand("Lingua Italiana impostata."); }} style={{ backgroundColor: language === 'it-IT' ? '#D4AF37' : '#18181A', color: language === 'it-IT' ? '#000' : '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>IT</button>
            <button data-testid="elite-lang-de" onClick={() => { setLanguage('de-DE'); speakCommand("Deutsche Sprache aktiv."); }} style={{ backgroundColor: language === 'de-DE' ? '#D4AF37' : '#18181A', color: language === 'de-DE' ? '#000' : '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>DE</button>
            <button data-testid="elite-lang-ro" onClick={() => { setLanguage('ro-RO'); speakCommand("Limba Română activă."); }} style={{ backgroundColor: language === 'ro-RO' ? '#D4AF37' : '#18181A', color: language === 'ro-RO' ? '#000' : '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>RO</button>
            <button data-testid="elite-close" onClick={onClose} aria-label="Chiudi" style={{ backgroundColor: '#18181A', color: '#FFF', border: '1px solid #333', padding: '5px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* STRUTTURA A 6 TAB RIGIDE E PULITE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '14px' }}>
          {TABS.map(tab => (
            <button key={tab.id} data-testid={`elite-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{ backgroundColor: activeTab === tab.id ? '#D4AF37' : '#18181A', color: activeTab === tab.id ? '#000' : '#FFF', border: 'none', padding: '10px 2px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{tab.label}</button>
          ))}
        </div>

        {/* ================= TAB 1: BANCO PRODUZIONE NOTTURNO ================= */}
        {activeTab === 'banco' && (
          <div data-testid="elite-panel-banco" style={{ display: 'grid', gap: '10px' }}>

            {/* DOSAGGIO IMPASTO E CALCOLO ACQUA 3T */}
            <div style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#D4AF37', fontSize: '0.95rem' }}>🥣 Impasto In Lavorazione: {selectedRecipe.nome}</h3>
                <span style={{ fontSize: '0.7rem', color: '#AAA' }}>Categoria: {selectedRecipe.cat}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem' }}>KG Farina:</label>
                <input data-testid="elite-input-kg" type="number" value={batchKg} onChange={(e) => setBatchKg(Number(e.target.value))} style={{ backgroundColor: '#0B0B0C', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px', borderRadius: '4px', width: '70px', fontWeight: 'bold' }} />
                <button data-testid="elite-read-doses" onClick={() => speakCommand(`Dosi per ${batchKg} chili di farina. Versa ${acquaCalcolata} litri di acqua e ${saleCalcolato} grammi di sale.`)} style={{ backgroundColor: '#222', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  🎙️ LEGGI DOSI
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px' }}>
                <div>💧 Acqua 3T: <strong style={{ color: '#00FF66' }}>{acquaCalcolata} L</strong></div>
                <div>🧂 Sale Fine: <strong>{saleCalcolato} g</strong></div>
                <div>🍞 Lievito: <strong>{lievitoCalcolato} g</strong></div>
              </div>
            </div>

            {/* CONTROL SENSOR IOT (PINZA AMPEROMETRICA SALE) */}
            <div data-testid="elite-iot-sensor" style={{ backgroundColor: amperometroIoT < 1.3 ? '#330000' : '#18181A', border: amperometroIoT < 1.3 ? '2px solid #FF3366' : '1px solid #00FF66', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>⚡ Sensore IoT Sforzo Motore Spirale:</span>
                <strong style={{ color: amperometroIoT < 1.3 ? '#FF3366' : '#00FF66' }}>{amperometroIoT} kW</strong>
              </div>

              {amperometroIoT < 1.3 ? (
                <div style={{ color: '#FF3366', marginTop: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  ⚠️ ALLARME SFORZO BASSO: Maglia glutinica assente. Hai dimenticato di versare il sale?
                </div>
              ) : (
                <div style={{ color: '#00FF66', marginTop: '4px', fontSize: '0.75rem' }}>
                  ✓ Sforzo regolare: Maglia glutinica e sale confermati dalla resistenza meccanica.
                </div>
              )}

              {/* Simulatore di test per la demo */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                <button data-testid="elite-sim-ok" onClick={() => setAmperometroIoT(1.8)} style={{ fontSize: '0.65rem', backgroundColor: '#222', color: '#00FF66', border: 'none', padding: '4px 6px', borderRadius: '3px' }}>Simula Impasto OK (1.8 kW)</button>
                <button data-testid="elite-sim-nosalt" onClick={() => setAmperometroIoT(0.9)} style={{ fontSize: '0.65rem', backgroundColor: '#222', color: '#FF3366', border: 'none', padding: '4px 6px', borderRadius: '3px' }}>Simula Dimenticanza Sale (0.9 kW)</button>
              </div>
            </div>

            {/* STATO CELLE & PRECOTTO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: '#18181A', padding: '10px', borderRadius: '6px', border: '1px solid #333' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#D4AF37', fontSize: '0.8rem' }}>❄️ Cella Full-Automatic</h4>
                <div style={{ fontSize: '0.75rem' }}>Stato: <strong>{cellaAuto.fase}</strong></div>
                <div style={{ fontSize: '0.7rem', color: '#AAA' }}>Pronto tra: {cellaAuto.contoRovescia}</div>
              </div>

              <div style={{ backgroundColor: '#18181A', padding: '10px', borderRadius: '6px', border: '1px solid #333' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#D4AF37', fontSize: '0.8rem' }}>🥖 Modulo Precotto (Par-Baked)</h4>
                <div style={{ fontSize: '0.75rem' }}>Forno 2: <strong style={{ color: '#00FF66' }}>{fornoState.forno2}</strong></div>
                <div style={{ fontSize: '0.7rem', color: '#AAA' }}>Cottura 80% + Abbattitore a -35°C</div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: RICETTARIO BÄCKEREI & KONDITOREI ================= */}
        {activeTab === 'ricette' && (
          <div data-testid="elite-panel-ricette" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37', fontSize: '1rem' }}>📖 Ricettario Digitale Bäckerei & Konditorei</h3>

            {/* FILTRO CATEGORIE */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', overflowX: 'auto' }}>
              {['Brot', 'Brötchen', 'Konditorei', 'Vorgebacken', 'Snacks'].map(cat => (
                <button key={cat} data-testid={`elite-cat-${cat}`} onClick={() => setActiveCategory(cat)} style={{ backgroundColor: activeCategory === cat ? '#D4AF37' : '#0B0B0C', color: activeCategory === cat ? '#000' : '#FFF', border: '1px solid #333', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* LISTA RICETTE FILTRATE */}
            <div style={{ display: 'grid', gap: '6px' }}>
              {recipeBook.filter(r => r.cat === activeCategory).map(r => (
                <div key={r.id} data-testid={`elite-recipe-${r.id}`} onClick={() => { setSelectedRecipe(r); setActiveTab('banco'); }} style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #D4AF37', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{r.nome}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{r.note}</div>
                  </div>
                  <button style={{ backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>SELEZIONA</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: GUIDA & SCALER INTERATTIVO ================= */}
        {activeTab === 'guida' && (
          <div data-testid="elite-panel-guida" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '1rem' }}>ℹ️ Guida Operativa & Scaler Tutorial</h3>

            <input data-testid="elite-scaler-range" type="range" min="0" max={scalerSteps.length - 1} value={scalerStep} onChange={(e) => setScalerStep(Number(e.target.value))} style={{ width: '100%', accentColor: '#D4AF37', marginBottom: '10px' }} />

            <div style={{ backgroundColor: '#0B0B0C', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #D4AF37' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#FFF' }}>{scalerSteps[scalerStep].icona} {scalerSteps[scalerStep].titolo}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#CCC', lineHeight: '1.4' }}>{scalerSteps[scalerStep].desc}</p>
            </div>

            <button data-testid="elite-scaler-speak" onClick={() => speakCommand(scalerSteps[scalerStep].desc)} style={{ width: '100%', marginTop: '10px', backgroundColor: '#222', color: '#D4AF37', border: '1px solid #D4AF37', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              🎙️ ASCOLTA ISTRUZIONE VOCALE
            </button>
          </div>
        )}

        {/* ================= TAB 4: FOTOCAMERA AI & VISION ================= */}
        {activeTab === 'camera' && (
          <div data-testid="elite-panel-camera" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '1rem' }}>📸 Visione Artificiale AI</h3>
            <p style={{ fontSize: '0.75rem', color: '#AAA' }}>Analisi visiva dell'alveolatura, sagoma della pagnotta e scansione bolle fornitore (Becco).</p>
            <div style={{ backgroundColor: '#0B0B0C', padding: '24px', borderRadius: '6px', border: '1px dashed #444', margin: '10px 0' }}>
              <div style={{ fontSize: '2rem' }}>📷</div>
              <span style={{ fontSize: '0.8rem', color: '#00FF66' }}>SISTEMA VISIONE PRONTO</span>
            </div>
            <button data-testid="elite-cam-scan" onClick={() => speakCommand("Fotocamera attiva. Inquadra il lotto di pane o la bolla di consegna.")} style={{ backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem' }}>AZIONA SCANSIONE AI</button>
          </div>
        )}

        {/* ================= TAB 5: STOCK & LOGISTICA ================= */}
        {activeTab === 'stock' && (
          <div data-testid="elite-panel-stock" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37', fontSize: '1rem' }}>📦 Magazzino Silos & Flotta</h3>
            <div style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>🌾 Silos Farina Principale:</strong> <span style={{ color: '#00FF66' }}>{silosFarina.percentuale}% (Livello OK)</span>
            </div>
            <div style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px' }}>
              <strong>🚛 Furgone 1 (Centro):</strong> 24 Ceste Caricate (In Partenza)
            </div>
          </div>
        )}

        {/* ================= TAB 6: REGIA & REPORT SERALE ================= */}
        {activeTab === 'regia' && (
          <div data-testid="elite-panel-regia" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#D4AF37', fontSize: '1rem' }}>👑 Regia Capo & Report Tagesbericht</h3>
            <p style={{ fontSize: '0.75rem', color: '#AAA' }}>Report serale di produzione inviato all'ufficio (Formato aggregato conforme BetrVG / DSGVO).</p>
            <button data-testid="elite-send-report" onClick={() => speakCommand("Report serale inviato con successo all'ufficio contabile.")} style={{ backgroundColor: '#00FF66', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', width: '100%', fontWeight: 'bold', fontSize: '0.75rem' }}>
              📄 INVIA REPORT SERALE TAGESBERICHT
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
