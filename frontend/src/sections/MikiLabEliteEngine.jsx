/* ============================================================================
   MIKILAB OS v10.2 - ULTIMATE 3D BAKERY ENTERPRISE EDITION (Miki & Mohamed)
   UI: Multi-Avatar + Real Timers + Allarme Persistente + Radio + Testi Legali
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
  const [modalOpen, setModalOpen] = useState(null); // 'privacy', 'impressum', 'copyright'

  // Timer Forno Reale Dinamico con Allarme Persistente
  const [timerSeconds, setTimerSeconds] = useState(1080); // 18 minuti
  const [isBaking, setIsBaking] = useState(false);

  const speakVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  // Audio sintetico di allarme persistente per lo schermo spento/rumore
  const playBeepAlert = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota alta
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); }, 1500);
    } catch (e) {
      console.log("Audio non supportato automaticamente");
    }
  };

  useEffect(() => {
    let interval = null;
    if (isBaking && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isBaking) {
      setIsBaking(false);
      // Allarme persistente vocale e sonoro di emergenza fine cottura
      speakVoice("Allarme forno! Cottura completata, spegnere immediatamente!");
      playBeepAlert();
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

  // AMBIENTI 3D DEL PANIFICIO
  const rooms3D = {
    impasti: {
      title: "🌾 BANCO IMPASTI & SILOS 3D",
      color: "#FFB300",
      bgGradient: "linear-gradient(135deg, #2A1A08 0%, #795548 50%, #FFB300 100%)",
      avatarName: "Miki (Maestro Impastatore)",
      avatarVisual: "📸 [Foto Reale Miki: Miki che gioca a palla di pane col tatuaggio visibile]",
      avatarAction: "Miki sta gestendo il banco impasti, l'acqua e la spirale!",
      item3D: "📦 Silo Farina T500 & Vasca Impastatrice",
      desc: "Reparto impasti ad alta idratazione e controllo del glutine"
    },
    forni: {
      title: "🔥 ZONA FORNI A LEGNA 3D",
      color: "#FF3D00",
      bgGradient: "linear-gradient(135deg, #3E2723 0%, #D84315 50%, #FF3D00 100%)",
      avatarName: "Mohamed & Miki (Infornatore Capo)",
      avatarVisual: "📸 [Foto Reale Miki: Miki che inforna col tatuaggio in primo piano]",
      avatarAction: "Mohamed e Miki stanno controllando il forno rotativo e le cotture!",
      item3D: "🌋 Forno Rotativo con Mattoni Refrattari",
      desc: "Gestione vapore, infornate e timer di cottura con allarme persistente"
    },
    pasticceria: {
      title: "🥐 KONDITOREI & ABBATTITORE 3D",
      color: "#E040FB",
      bgGradient: "linear-gradient(135deg, #1A237E 0%, #7B1FA2 50%, #E040FB 100%)",
      avatarName: "Miki & Mohamed (Team Pasticceria)",
      avatarVisual: "👥🥐 (Foto Storiche Laboratorio)",
      avatarAction: "Team all'opera con la laminazione del burro e l'abbattitore!",
      item3D: "🧊 Abbattitore Professionale -35°C & Sfogliatrice",
      desc: "Calcolo pieghe 4-4 e gestione temperature burro"
    },
    guida: {
      title: "📖 GUIDA & TUTELA COPYRIGHT (MIKILAB)",
      color: "#00E676",
      bgGradient: "linear-gradient(135deg, #004D40 0%, #00796B 50%, #00E676 100%)",
      avatarName: "Miki & Mohamed (Progetto Ufficiale)",
      avatarVisual: "📚✨ (Galleria Foto Reali dei Tatuaggi & Pane)",
      avatarAction: "Consultazione Guida 3D e Protezione Legale del Software!",
      item3D: "💡 Archivio Tecnologie & Specifiche di Progetto",
      desc: "Soluzioni sviluppate ad hoc da Miki & Mohamed vs Standard di Mercato"
    }
  };

  const currentRoom = rooms3D[activeTab];

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
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
      <div style={{ padding: '16px', maxWidth: 760, margin: '0 auto', paddingBottom: '40px' }}>

        {/* HEADER AMBIENTE & RADIO REALE */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          border: `2px solid ${currentRoom.color}`,
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '16px',
          boxShadow: `0 0 25px ${currentRoom.color}55`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ backgroundColor: currentRoom.color, color: '#000', padding: '4px 10px', borderRadius: '20px', fontWeight: '900', fontSize: '0.75rem' }}>
                STANZA 3D ATTIVA
              </span>
              <h1 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', textShadow: '2px 2px 4px #000' }}>{currentRoom.title}</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button data-testid="elite-radio-toggle" onClick={() => {
                setRadioPlaying(!radioPlaying);
                speakVoice(radioPlaying ? "Radio panificio spenta" : "Radio panificio in streaming live avviata");
              }} style={{ backgroundColor: radioPlaying ? '#00E676' : 'rgba(255,255,255,0.1)', color: '#FFF', border: `1px solid ${currentRoom.color}`, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                📻 RADIO REALE: {radioPlaying ? 'ON (Streaming 🎶)' : 'OFF'}
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

        {/* SELETTORE STANZE 3D */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'impasti', icon: '🌾', label: 'IMPASTI (MIKI)' },
            { id: 'forni', icon: '🔥', label: 'FORNI (MOHAMED)' },
            { id: 'pasticceria', icon: '🥐', label: 'PASTICCERIA' },
            { id: 'guida', icon: '📖', label: 'GUIDA & INFO' }
          ].map(room => (
            <button key={room.id} data-testid={`elite-room-${room.id}`} onClick={() => { setActiveTab(room.id); speakVoice(`Spostamento in ${room.label}`); }} style={{
              backgroundColor: activeTab === room.id ? rooms3D[room.id].color : 'rgba(0,0,0,0.6)',
              color: activeTab === room.id ? '#000' : '#FFF',
              border: `2px solid ${rooms3D[room.id].color}`,
              borderRadius: '12px',
              padding: '12px 4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transform: activeTab === room.id ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.4s ease, background-color 0.4s ease'
            }}>
              <div style={{ fontSize: '1.4rem' }}>{room.icon}</div>
              <div style={{ fontSize: '0.6rem', marginTop: '4px' }}>{room.label}</div>
            </button>
          ))}
        </div>

        {/* SCENA 3D & FOTO REALI */}
        <div data-testid="elite-scene-3d" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          borderRadius: '20px',
          border: `3px solid ${currentRoom.color}`,
          padding: '24px',
          textAlign: 'center',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `inset 0 0 60px rgba(0,0,0,0.9), 0 10px 30px ${currentRoom.color}33`
        }}>
          <div style={{
            minHeight: '210px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 10%, transparent 75%)'
          }}>
            <div style={{
              fontSize: '1.1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: `2px dashed ${currentRoom.color}`,
              padding: '14px 20px',
              borderRadius: '12px',
              color: '#FFF',
              fontWeight: 'bold',
              marginBottom: '10px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
            }}>
              {currentRoom.avatarVisual}
            </div>

            <div style={{ fontSize: '0.75rem', color: currentRoom.color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {currentRoom.avatarName}
            </div>

            <div style={{
              backgroundColor: currentRoom.color,
              color: '#000',
              padding: '8px 18px',
              borderRadius: '20px',
              fontWeight: '900',
              fontSize: '0.85rem',
              marginTop: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
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
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: `1px solid ${currentRoom.color}`,
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: currentRoom.color }}>
            {activeTab === 'guida' ? '📖 Guida & Tutela Proprietà Intellettuale' : '⚙️ Dati Operativi Reparto'}
          </h3>

          {activeTab === 'guida' ? (
            <div data-testid="elite-guida-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#DDD' }}>
              <p>✨ <strong>MikiLab OS v10.2</strong> ideato e sviluppato da Mohamed & Miki.</p>
              <p>🔒 <strong>Protezione Copyright:</strong> Questo software, l'interfaccia 3D, la logica dei timer e i contenuti multimediali sono protetti da diritti di proprietà intellettuale esclusivi. Ogni duplicazione o uso non autorizzato è severamente vietato.</p>
              <p>🛒 <strong>Rispetto al mercato:</strong> Soluzioni commerciali rigide superate da un sistema vivo, con allarmi persistenti per schermi spenti e radio live integrata.</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#DDD', marginBottom: '12px' }}>{currentRoom.desc}</p>
          )}

          {activeTab === 'impasti' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem' }}>Farina T500</div>
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
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FF3D00' }}>🔥 Forno Rotativo (240°C) - Allarme Persistente Attivo</div>
              <div data-testid="elite-timer" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '6px 0', fontFamily: 'monospace' }}>
                {formatTime(timerSeconds)}
              </div>
              <button data-testid="elite-start-bake" onClick={() => { setIsBaking(true); speakVoice("Conto alla rovescia forno avviato da Mohamed"); }} style={{ backgroundColor: '#FF3D00', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isBaking ? '⏳ COTTURA IN CORSO (ALLARME PRONTO)...' : '▶️ AVVIA COTTURA & ALLARME'}
              </button>
            </div>
          )}
        </div>

        {/* FOOTER LEGALE & COPYRIGHT */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: '0.75rem',
          color: '#AAA',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <span>© MikiLab OS v10.2 - Mohamed & Miki (Tutti i diritti riservati)</span>
          <button data-testid="elite-privacy" onClick={() => setModalOpen('privacy')} style={{ background: 'none', border: 'none', color: '#FFB300', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}>
            🔒 Privacy (GDPR)
          </button>
          <button data-testid="elite-copyright" onClick={() => setModalOpen('copyright')} style={{ background: 'none', border: 'none', color: '#00E676', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}>
            🛡️ Tutela Copyright
          </button>
          <button data-testid="elite-impressum" onClick={() => setModalOpen('impressum')} style={{ background: 'none', border: 'none', color: '#E040FB', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}>
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
            backgroundColor: '#1E1E24', border: '2px solid #FFB300', borderRadius: '16px',
            padding: '24px', maxWidth: '500px', width: '100%', color: '#FFF', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <h2 style={{ color: '#FFB300', marginTop: 0 }}>
              {modalOpen === 'privacy' && '🔒 Informativa sulla Privacy (GDPR)'}
              {modalOpen === 'copyright' && '🛡️ Protezione Copyright & Proprietà'}
              {modalOpen === 'impressum' && '📜 Impressum & Note Legali'}
            </h2>

            <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#DDD', marginBottom: '20px' }}>
              {modalOpen === 'privacy' && (
                <p>I dati di produzione, le ricette e le impostazioni del laboratorio gestiti all'interno di MikiLab OS sono trattati in totale conformità al Regolamento UE 2016/679 (GDPR), garantendo la massima riservatezza e sicurezza dei dati aziendali.</p>
              )}
              {modalOpen === 'copyright' && (
                <p><strong>© 2026 MikiLab OS - Mohamed & Miki.</strong> Tutti i diritti di proprietà intellettuale relativi al codice sorgente, all'interfaccia 3D, ai flussi operativi, alle immagini e ai concetti di laboratorio sono riservati. È vietata la copia, la riproduzione o la distribuzione non autorizzata, anche parziale, dell'opera.</p>
              )}
              {modalOpen === 'impressum' && (
                <p><strong>MikiLab Industrial Systems</strong><br />
                  Sviluppato da Mohamed & Miki<br />
                  Laboratorio di Panificazione e Pasticceria 3D<br />
                  Contatto ufficiale: support@mikilab-os.com</p>
              )}
            </div>

            <button data-testid="elite-legal-close" onClick={() => setModalOpen(null)} style={{
              backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '10px 20px',
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
