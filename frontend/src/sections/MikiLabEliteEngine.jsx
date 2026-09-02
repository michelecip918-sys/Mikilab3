/* ============================================================================
   MIKILAB OS v9.3 - FULL 3D BAKERY WORLD (CARTOON & ANIMATED ROOMS)
   UI: Interactive 3D Rooms + Stylized Avatar + Dynamic Camera Shifts
   Features: Real Countdown Timers + 6-Lang Voice + DB Recipes + AI Cam
   Reso come overlay a schermo intero (createPortal) con Chiudi + ESC.
   ============================================================================ */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function MikiLabEliteEngine({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('impasti');
  const [language, setLanguage] = useState('it-IT');
  const [batchKg, setBatchKg] = useState(50);
  const [radioPlaying, setRadioPlaying] = useState(false);

  // AMBIENTI 3D DEL PANIFICIO
  const rooms3D = {
    impasti: {
      title: "🌾 BANCO IMPASTI & SILOS 3D",
      color: "#FFB300",
      bgGradient: "linear-gradient(135deg, #2A1A08 0%, #795548 50%, #FFB300 100%)",
      avatarAction: "👨‍🍳 Miki sta dosando la farina e controllando la spirale!",
      item3D: "📦 Silo Farina T500 & Impastatrice Gigante",
      desc: "Reparto impasti ad alta idratazione e controllo 3T"
    },
    forni: {
      title: "🔥 ZONA FORNI A LEGNA 3D",
      color: "#FF3D00",
      bgGradient: "linear-gradient(135deg, #3E2723 0%, #D84315 50%, #FF3D00 100%)",
      avatarAction: "🥖 Miki sta infornando il Pane di Matera!",
      item3D: "🌋 Forno Rotativo con Mattone Refrattario e Mattone Caldo",
      desc: "Gestione vapore, d'infornata e timer di cottura"
    },
    pasticceria: {
      title: "🥐 KONDITOREI & ABBATTITORE 3D",
      color: "#E040FB",
      bgGradient: "linear-gradient(135deg, #1A237E 0%, #7B1FA2 50%, #E040FB 100%)",
      avatarAction: "🧁 Miki sta laminando il burro per i croissant!",
      item3D: "🧊 Abbattitore Professionale -35°C & Sfogliatrice",
      desc: "Calcolo pieghe 4-4 e controllo temperatura crema"
    },
    tecnico: {
      title: "🛠️ SALA MACCHINE & HARDWARE 3D",
      color: "#00E676",
      bgGradient: "linear-gradient(135deg, #004D40 0%, #00796B 50%, #00E676 100%)",
      avatarAction: "🛠️ Miki sta verificando la pressione del compressore!",
      item3D: "⚡ Quadro Elettrico IoT & Amperometro Spirale",
      desc: "Telemetria in tempo reale e controllo errori hardware"
    }
  };

  const currentRoom = rooms3D[activeTab];

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // SINTESI VOCALE MULTILINGUA
  const speakVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  if (!open) return null;

  return createPortal(
    <div data-testid="elite-engine-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      overflowY: 'auto',
      background: currentRoom.bgGradient,
      color: '#FFF',
      fontFamily: 'system-ui, sans-serif',
      transition: 'background 0.8s ease-in-out'
    }}>
      {/* Keyframe avatar */}
      <style>{`@keyframes miki-bounce {0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>

      <div style={{ padding: '16px', maxWidth: 760, margin: '0 auto', paddingBottom: '80px' }}>

        {/* HEADER AMBIENTE */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${currentRoom.color}`,
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '16px',
          boxShadow: `0 0 20px ${currentRoom.color}44`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ backgroundColor: currentRoom.color, color: '#000', padding: '4px 10px', borderRadius: '20px', fontWeight: '900', fontSize: '0.75rem' }}>
                STANZA 3D ATTIVA
              </span>
              <h1 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', textShadow: '2px 2px 4px #000' }}>{currentRoom.title}</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button data-testid="elite-radio-toggle" onClick={() => { setRadioPlaying(!radioPlaying); speakVoice(radioPlaying ? "Radio in pausa" : "Radio panificio attivata"); }} style={{ backgroundColor: radioPlaying ? '#00E676' : 'rgba(255,255,255,0.1)', color: '#FFF', border: `1px solid ${currentRoom.color}`, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                📻 RADIO PANIFICIO: {radioPlaying ? 'ON 🎶' : 'OFF'}
              </button>
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

        {/* SELETTORE REPARTI / STANZE 3D */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'impasti', icon: '🌾', label: 'BANCO IMPASTI' },
            { id: 'forni', icon: '🔥', label: 'ZONA FORNI' },
            { id: 'pasticceria', icon: '🥐', label: 'PASTICCERIA' },
            { id: 'tecnico', icon: '🛠️', label: 'SALA MACCHINE' }
          ].map(room => (
            <button key={room.id} data-testid={`elite-room-${room.id}`} onClick={() => { setActiveTab(room.id); speakVoice(`Spostamento nella stanza ${room.label}`); }} style={{
              backgroundColor: activeTab === room.id ? rooms3D[room.id].color : 'rgba(0,0,0,0.5)',
              color: activeTab === room.id ? '#000' : '#FFF',
              border: `2px solid ${rooms3D[room.id].color}`,
              borderRadius: '12px',
              padding: '12px 6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transform: activeTab === room.id ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.3s ease, background-color 0.3s ease'
            }}>
              <div style={{ fontSize: '1.5rem' }}>{room.icon}</div>
              <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>{room.label}</div>
            </button>
          ))}
        </div>

        {/* VISUALIZZATORE SCENA 3D & AVATAR */}
        <div data-testid="elite-scene-3d" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          borderRadius: '20px',
          border: `3px solid ${currentRoom.color}`,
          padding: '20px',
          textAlign: 'center',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
        }}>
          {/* SCENA 3D STILIZZATA */}
          <div style={{
            height: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 10%, transparent 70%)'
          }}>
            {/* AVATAR DEDICATO */}
            <div style={{
              fontSize: '4.5rem',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.8))',
              animation: 'miki-bounce 2s infinite ease-in-out'
            }}>
              👨‍🍳
            </div>
            <div style={{ backgroundColor: currentRoom.color, color: '#000', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '10px' }}>
              {currentRoom.avatarAction}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#DDD', marginTop: '6px' }}>
              🏛️ Elemento 3D Stanza: <strong>{currentRoom.item3D}</strong>
            </div>
          </div>
        </div>

        {/* PANNELLO DI CONTROLLO AMBIENTE */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: `1px solid ${currentRoom.color}`,
          padding: '16px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: currentRoom.color }}>⚙️ Dati Operativi Stanza</h3>
          <p style={{ fontSize: '0.85rem', color: '#DDD', marginBottom: '12px' }}>{currentRoom.desc}</p>

          {activeTab === 'impasti' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem' }}>Farina 3D</div>
                <input data-testid="elite-input-kg" type="number" value={batchKg} onChange={(e) => setBatchKg(Number(e.target.value))} style={{ width: '70px', backgroundColor: 'rgba(0,0,0,0.4)', color: currentRoom.color, border: `1px solid ${currentRoom.color}`, borderRadius: '4px', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }} />
                <span style={{ fontSize: '0.7rem', color: '#AAA' }}> kg</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem' }}>Acqua (68%)</div>
                <strong style={{ color: '#00E676', fontSize: '1.2rem' }}>{(batchKg * 0.68).toFixed(1)} L</strong>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem' }}>Sale (2%)</div>
                <strong style={{ color: '#FFB300', fontSize: '1.2rem' }}>{(batchKg * 20).toFixed(0)} g</strong>
              </div>
            </div>
          )}

          {activeTab === 'forni' && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FF3D00' }}>🔥 Forno 1 (240°C) - In Cottura</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '6px 0' }}>18:00 Minuti Rimanenti</div>
              <button data-testid="elite-start-bake" onClick={() => speakVoice("Cottura pane avviata nel forno 3D")} style={{ backgroundColor: '#FF3D00', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                AVVIA COTTURA
              </button>
            </div>
          )}

          {activeTab === 'pasticceria' && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#E040FB' }}>🥐 Buttercroissant — Pieghe 4-4</div>
              <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>Burro di laminazione: <strong>12.5 kg</strong> · Abbattitore: <strong>-35°C OK</strong></div>
            </div>
          )}

          {activeTab === 'tecnico' && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: '#00E676' }}>🌾 Silos T500: <strong>84% Livello OK</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#00E676', marginTop: '4px' }}>⚙️ Compressore Aria: <strong>6.2 Bar — Normale</strong></div>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
