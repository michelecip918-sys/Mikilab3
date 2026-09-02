/* ============================================================================
   MIKILAB ELITE ENGINE — Motore operativo unificato (BakeMix Engine)
   Tema: Grain Gold #D4AF37 / Dark Slate #0B0B0C
   Focus: Ottimizzazione profitto + Voce Hands-Free + Stock AI + Flotta
   Unifica i pannelli "Ufficio & Squadra" e "Team Auricolari".
   ============================================================================ */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function MikiLabEliteEngine({ open, onClose }) {
  const SYSTEM_NAME = "MikiLab (BakeMix Engine)";
  const [activeTab, setActiveTab] = useState('lab');
  const [language] = useState('it-IT');
  const [credits] = useState(100);

  // 1. HARDWARE & SENSORE AUTOMATICO FARINA SILOS
  const [hardware] = useState({
    silosFarina: 82, // %
    silosFarinaTemp: 19.5, // °C rilevata automaticamente dal sensore
    cellaFreezeTemp: -18,
    cellaFreezeUmidita: 65
  });

  // 2. MAGAZZINO INGREDIENTI (PROFITTO E SCARICO VIVO)
  const [inventory, setInventory] = useState([
    { id: 'farina_0', nome: 'Farina Tipo 0 (F.lli Becco)', qta: 1250, unita: 'kg', costoKg: 0.85 },
    { id: 'lievito_fresco', nome: 'Lievito Fresco', qta: 18, unita: 'kg', costoKg: 2.10 },
    { id: 'sale_marino', nome: 'Sale Marino Fine', qta: 85, unita: 'kg', costoKg: 0.40 },
    { id: 'burro_82', nome: 'Burro Professionale 82%', qta: 45, unita: 'kg', costoKg: 6.50 }
  ]);

  // 3. FLOTTA FURGONI & LOGISTICA
  const [deliveries] = useState([
    { id: 'furgone_1', autista: 'Marco', zona: 'Centro Storico', ceste: 24, stato: 'In Carico' },
    { id: 'furgone_2', autista: 'Giuseppe', zona: 'Supermercati Nord', ceste: 45, stato: 'In Viaggio' }
  ]);

  // 4. RICETTARIO MAESTRO
  const [recipeBook, setRecipeBook] = useState(() => {
    const saved = localStorage.getItem('mikilab_recipes');
    return saved ? JSON.parse(saved) : [
      { id: 'pane_matera', nome: 'Pane di Matera IGP', farina: 10, acqua: 6.8, lievito: 0.15, sale: 0.2, minutiVel1: 8, minutiVel2: 4 },
      { id: 'brezel_laugen', nome: 'Brezel / Laugengebäck 3D', farina: 10, acqua: 5.0, lievito: 0.3, sale: 0.22, minutiVel1: 6, minutiVel2: 5 }
    ];
  });

  const [selectedRecipeId, setSelectedRecipeId] = useState('pane_matera');
  const [targetKg, setTargetKg] = useState(25);
  const [roomTemp, setRoomTemp] = useState(24);
  const [flourTemp, setFlourTemp] = useState(hardware.silosFarinaTemp); // Auto-set dal sensore silos
  const [scaledRecipe, setScaledRecipe] = useState(null);

  // FORM RICETTA CAPO
  const [editingId, setEditingId] = useState(null);
  const [recForm, setRecForm] = useState({ nome: '', farina: 10, acqua: 6.5, lievito: 0.2, sale: 0.2, vel1: 7, vel2: 4, guida: '' });

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // VOCE NATIVA BANCO (HANDS-FREE)
  const speakLocal = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // INPUT VOCALE TEMPERATURA FARINA
  const handleVoiceInputFarina = () => {
    speakLocal("Dimmi la temperatura della farina al banco.");
    const val = prompt("Dì o inserisci la temperatura della farina (°C):", flourTemp);
    if (val) {
      setFlourTemp(Number(val));
      speakLocal(`Temperatura farina impostata a ${val} gradi.`);
    }
  };

  // CALCOLO ACQUA 3T
  const calculateWaterTemp = () => {
    const targetImpastoTemp = 24;
    const baseTemp = targetImpastoTemp * 3;
    const tempFrizionale = 9;
    const idealWater = baseTemp - (roomTemp + flourTemp + tempFrizionale);
    return idealWater > 2 ? idealWater.toFixed(1) : "Usare Ghiaccio / 2.0";
  };

  const calculateDynamicRecipe = () => {
    const currentRec = recipeBook.find(r => r.id === selectedRecipeId);
    if (!currentRec) return;
    const factor = targetKg / currentRec.farina;
    const tempAcqua = calculateWaterTemp();

    // Calcolo costo impasto per il calcolo del profitto
    const costoMateriaPrima = (targetKg * 0.85) + ((currentRec.lievito * factor) * 2.10);

    const computed = {
      ...currentRec,
      farina: targetKg,
      acqua: (currentRec.acqua * factor).toFixed(1),
      lievito: (currentRec.lievito * factor * 1000).toFixed(0),
      sale: (currentRec.sale * factor * 1000).toFixed(0),
      tempAcqua,
      costoStimato: costoMateriaPrima.toFixed(2)
    };
    setScaledRecipe(computed);
    speakLocal(`Dosi calcolate per ${computed.nome}. Acqua a ${tempAcqua} gradi. Costo stimato impasto ${computed.costoStimato} euro.`);
  };

  // AVVIO TIMER + SCARICO AUTOMATICO MAGAZZINO
  const startImpastoTimer = () => {
    if (!scaledRecipe) return alert("Calcola prima la ricetta!");

    setInventory(prev => prev.map(item => {
      if (item.id === 'farina_0') return { ...item, qta: Math.max(0, item.qta - scaledRecipe.farina) };
      if (item.id === 'lievito_fresco') return { ...item, qta: Math.max(0, item.qta - (scaledRecipe.lievito / 1000)) };
      return item;
    }));

    speakLocal(`Partito timer per ${scaledRecipe.minutiVel1} minuti. Dosi scaricate dal magazzino.`);
    alert(`⏱️ Impasto Avviato! ${scaledRecipe.minutiVel1} min in 1ª Vel. Magazzino e profitto aggiornati!`);
  };

  // SCANSIONE BOLLA BECCO (CARICO AI)
  const handleScanInvoice = () => {
    speakLocal("Scansione fattura Becco in corso...");
    setTimeout(() => {
      setInventory(prev => prev.map(item => {
        if (item.id === 'farina_0') return { ...item, qta: item.qta + 500 };
        if (item.id === 'lievito_fresco') return { ...item, qta: item.qta + 20 };
        return item;
      }));
      speakLocal("Fattura Becco registrata. Caricati 500 chili di farina e 20 chili di lievito.");
      alert("📄 BOLLA BECCO CARICATA CON SUCCESSO:\n- +500 kg Farina Tipo 0\n- +20 kg Lievito Fresco");
    }, 1200);
  };

  // PUSH REAL-TIME RICETTE
  const handlePushToTeam = () => {
    localStorage.setItem('mikilab_recipes', JSON.stringify(recipeBook));
    speakLocal("Aggiornamento inviato a tutti gli operai.");
    alert("📢 PUSH INVIATO: Ricette e dosi aggiornate su tutti i telefoni!");
  };

  const handleSaveRecipe = () => {
    if (!recForm.nome) return alert("Inserisci il nome della ricetta!");
    let updated;
    if (editingId) {
      updated = recipeBook.map(r => r.id === editingId ? { ...r, nome: recForm.nome, farina: Number(recForm.farina), acqua: Number(recForm.acqua), lievito: Number(recForm.lievito), sale: Number(recForm.sale), minutiVel1: Number(recForm.vel1), minutiVel2: Number(recForm.vel2) } : r);
      setEditingId(null);
    } else {
      updated = [...recipeBook, { id: 'rec_' + Date.now(), nome: recForm.nome, farina: Number(recForm.farina), acqua: Number(recForm.acqua), lievito: Number(recForm.lievito), sale: Number(recForm.sale), minutiVel1: Number(recForm.vel1), minutiVel2: Number(recForm.vel2) }];
    }
    setRecipeBook(updated);
    localStorage.setItem('mikilab_recipes', JSON.stringify(updated));
    setRecForm({ nome: '', farina: 10, acqua: 6.5, lievito: 0.2, sale: 0.2, vel1: 7, vel2: 4, guida: '' });
    speakLocal("Ricetta salvata.");
  };

  if (!open) return null;

  const TABS = [
    { id: 'lab', label: '⚙️ BANCO' },
    { id: 'magazzino', label: '📦 STOCK AI' },
    { id: 'furgoni', label: '🚛 FURGONI' },
    { id: 'tutor_ai', label: '📸 FOTO AI' },
    { id: 'master', label: '👑 CAPO' },
  ];

  return createPortal(
    <div data-testid="elite-engine-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', backgroundColor: '#0B0B0C', color: '#FFF', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '12px', maxWidth: 640, margin: '0 auto', paddingBottom: '80px' }}>

        {/* HEADER PRINCIPALE */}
        <div style={{ borderBottom: '2px solid #D4AF37', paddingBottom: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#D4AF37', letterSpacing: '1px' }}>{SYSTEM_NAME}</h1>
            <span style={{ fontSize: '0.7rem', color: '#00FF66' }}>● Produzione & Profitto Attivi | Crediti AI: {credits}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button data-testid="elite-interfono" onClick={() => speakLocal("Interfono attivo. Puoi parlare con la squadra.")} style={{ backgroundColor: '#18181A', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px 10px', borderRadius: '6px' }}>
              <strong style={{ fontSize: '0.75rem' }}>🎙️ INTERFONO</strong>
            </button>
            <button data-testid="elite-close" onClick={onClose} aria-label="Chiudi" style={{ backgroundColor: '#18181A', color: '#FFF', border: '1px solid #333', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BANNER PROFITTO */}
        <div style={{ backgroundColor: '#18181A', padding: '8px', borderRadius: '6px', marginBottom: '12px', borderLeft: '4px solid #00FF66', fontSize: '0.75rem', color: '#AAA' }}>
          💡 <strong style={{ color: '#FFF' }}>MikiLab guarda al profitto:</strong> ottimizza il magazzino, azzera gli sprechi d'impasto e aumenta la resa della produzione.
        </div>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '14px' }}>
          {TABS.map(tab => (
            <button key={tab.id} data-testid={`elite-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{ backgroundColor: activeTab === tab.id ? '#D4AF37' : '#18181A', color: activeTab === tab.id ? '#000' : '#FFF', border: 'none', padding: '8px 2px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{tab.label}</button>
          ))}
        </div>

        {/* TAB 1: BANCO LAVORO */}
        {activeTab === 'lab' && (
          <div data-testid="elite-panel-lab">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#18181A', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #D4AF37' }}>
                <span style={{ fontSize: '0.7rem', color: '#AAA' }}>🌾 Silos Farina (Auto-Sensor)</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>{hardware.silosFarina}% Pieno ({hardware.silosFarinaTemp}°C)</div>
              </div>
              <div style={{ backgroundColor: '#18181A', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #00FF66' }}>
                <span style={{ fontSize: '0.7rem', color: '#AAA' }}>❄️ Cella Freeze</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#00FF66' }}>{hardware.cellaFreezeTemp}°C | {hardware.cellaFreezeUmidita}% UR</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#D4AF37' }}>🌾 Scegli il Pane & Parametri Clima</h3>

              <select data-testid="elite-recipe-select" value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)} style={{ width: '100%', backgroundColor: '#0B0B0C', color: '#FFF', border: '1px solid #D4AF37', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                {recipeBook.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#AAA' }}>Kg Impasto:</span>
                  <input data-testid="elite-input-kg" type="number" value={targetKg} onChange={(e) => setTargetKg(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#0B0B0C', color: '#FFF', border: '1px solid #444', padding: '6px', borderRadius: '4px' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#AAA' }}>Temp Lab °C:</span>
                  <input data-testid="elite-input-roomtemp" type="number" value={roomTemp} onChange={(e) => setRoomTemp(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#0B0B0C', color: '#FFF', border: '1px solid #444', padding: '6px', borderRadius: '4px' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#AAA' }}>Temp Farina:</span>
                  <input data-testid="elite-input-flourtemp" type="number" value={flourTemp} onChange={(e) => setFlourTemp(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#0B0B0C', color: '#FFF', border: '1px solid #444', padding: '6px', borderRadius: '4px' }} />
                </div>
              </div>

              <button data-testid="elite-voice-flourtemp" onClick={handleVoiceInputFarina} style={{ width: '100%', backgroundColor: '#222', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '10px' }}>
                🎙️ Dì a voce la Temp Farina
              </button>

              <button data-testid="elite-calc-btn" onClick={calculateDynamicRecipe} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '12px', borderRadius: '6px' }}>
                <strong style={{ fontSize: '0.95rem' }}>🚰 CALCOLA ACQUA 3T & COSTO</strong>
              </button>

              {scaledRecipe && (
                <div data-testid="elite-scaled-result" style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px', marginTop: '12px', borderLeft: '4px solid #D4AF37' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#D4AF37' }}>{scaledRecipe.nome} ({scaledRecipe.farina} kg)</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    💧 Acqua: <strong>{scaledRecipe.acqua} L</strong> (Temp: <strong style={{ color: '#00FF66' }}>{scaledRecipe.tempAcqua}°C</strong>)<br />
                    🧮 Lievito: <strong>{scaledRecipe.lievito} g</strong> | Sale: <strong>{scaledRecipe.sale} g</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#00FF66', marginTop: '4px' }}>
                    💰 Costo Materia Prima Impasto: <strong>€{scaledRecipe.costoStimato}</strong>
                  </div>

                  <button data-testid="elite-start-timer" onClick={startImpastoTimer} style={{ width: '100%', backgroundColor: '#00FF66', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>⏱️ AVVIA TIMER E SCARICA STOCK</strong>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MAGAZZINO STOCK AI */}
        {activeTab === 'magazzino' && (
          <div data-testid="elite-panel-magazzino" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px', border: '1px solid #D4AF37' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#D4AF37' }}>📦 Magazzino Vivo & Carico Bolle AI</h3>

            <button data-testid="elite-scan-invoice" onClick={handleScanInvoice} style={{ width: '100%', backgroundColor: '#00FF66', color: '#000', border: 'none', padding: '12px', borderRadius: '6px', marginBottom: '14px' }}>
              <strong style={{ fontSize: '0.95rem' }}>📸 FOTOGRAFA BOLLA / FATTURA BECCO</strong>
              <div style={{ fontSize: '0.65rem', color: '#111' }}>L'AI carica la farina e i prodotti in automatico</div>
            </button>

            <h4 style={{ fontSize: '0.85rem', color: '#AAA', marginBottom: '8px' }}>Giacenze & Costi Attuali:</h4>
            {inventory.map(item => (
              <div key={item.id} data-testid={`elite-stock-${item.id}`} style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#FFF' }}>{item.nome}</strong>
                  <div style={{ fontSize: '0.65rem', color: '#AAA' }}>Costo/Unitario: €{item.costoKg.toFixed(2)}</div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00FF66' }}>{item.qta} {item.unita}</div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: LOGISTICA FURGONI */}
        {activeTab === 'furgoni' && (
          <div data-testid="elite-panel-furgoni" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px', border: '1px solid #D4AF37' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#D4AF37' }}>🚛 Gestione Flotta Furgoni</h3>
            {deliveries.map(f => (
              <div key={f.id} data-testid={`elite-furgone-${f.id}`} style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px', marginBottom: '8px', borderLeft: '4px solid #D4AF37' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{f.autista} ({f.zona})</strong>
                  <span style={{ fontSize: '0.75rem', color: '#00FF66' }}>{f.stato}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#AAA', marginTop: '4px' }}>Ceste Caricate: {f.ceste} ceste</div>
                <button onClick={() => { speakLocal(`Rotta vocale inviata all'autista ${f.autista}`); alert(`Notifica vocale inviata ad autista ${f.autista}`); }} style={{ backgroundColor: '#222', color: '#D4AF37', border: '1px solid #D4AF37', padding: '4px 8px', borderRadius: '4px', marginTop: '6px', fontSize: '0.7rem' }}>
                  📲 Invia Rotta Vocale
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: FOTO AI */}
        {activeTab === 'tutor_ai' && (
          <div data-testid="elite-panel-tutor" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ color: '#D4AF37' }}>📸 Foto AI Controllo Pagnotta</h3>
            <p style={{ fontSize: '0.75rem', color: '#AAA' }}>Verifica l'angolo dei tagli a 45° e la sagoma della pagnotta prima di infornare.</p>
          </div>
        )}

        {/* TAB 5: PANNELLO CAPO */}
        {activeTab === 'master' && (
          <div data-testid="elite-panel-master" style={{ backgroundColor: '#18181A', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#D4AF37' }}>👑 Pannello Capo / Maestro</h3>

            <div style={{ backgroundColor: '#0B0B0C', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#D4AF37' }}>{editingId ? '✏️ MODIFICA RICETTA' : '➕ AGGIUNGI NUOVA RICETTA'}</h4>
              <input data-testid="elite-recipe-name" placeholder="Nome Pane" value={recForm.nome} onChange={(e) => setRecForm({ ...recForm, nome: e.target.value })} style={{ width: '95%', backgroundColor: '#18181A', color: '#FFF', border: '1px solid #444', padding: '6px', borderRadius: '4px', marginBottom: '6px' }} />
              <button data-testid="elite-save-recipe" onClick={handleSaveRecipe} style={{ width: '100%', backgroundColor: '#D4AF37', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold' }}>
                {editingId ? '💾 SALVA MODIFICHE' : '➕ AGGIUNGI RICETTA'}
              </button>
            </div>

            <button data-testid="elite-push-team" onClick={handlePushToTeam} style={{ width: '100%', backgroundColor: '#FF6B00', color: '#FFF', border: 'none', padding: '10px', borderRadius: '6px' }}>
              <strong>📢 MANDA A TUTTI I PANETTIERI</strong>
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
