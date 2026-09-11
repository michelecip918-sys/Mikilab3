import { useState, useEffect, useRef } from "react";
import { CloudSun, Cpu, Activity, Radio, Mic, MicOff, Wifi, Droplets, Thermometer, Gauge, Zap, AlertTriangle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Fasi 5/6/7/9 · Tecnologie Uniche di MikiLab — dashboard olografiche vive (dati simulati credibili).
function Card({ icon: Ic, title, sub, accent, testid, children }) {
  return (
    <div data-testid={testid} className="relative rounded-xl bg-[#060A10]/80 border p-4 overflow-hidden" style={{ borderColor: `${accent}33` }}>
      <div className="absolute -right-8 -top-8 w-20 h-20 rounded-full blur-2xl" style={{ background: `${accent}22` }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Ic className="w-4 h-4" style={{ color: accent }} />
          <div><p className="text-[12px] font-black text-white uppercase tracking-wide leading-none">{title}</p>{sub && <p className="text-[9.5px] text-[#94A3B8] mt-0.5">{sub}</p>}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdvancedLab() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);

  // 1) Compensazione climatica — formula fornaio (temp acqua = 3*DDT - farina - ambiente - attrito)
  const [ambient, setAmbient] = useState(24);
  useEffect(() => { const t = setInterval(() => setAmbient((a) => Math.max(12, Math.min(36, a + (Math.random() - 0.5) * 1.2))), 2500); return () => clearInterval(t); }, []);
  const ddt = 24, flour = ambient - 1, friction = 3;
  const waterT = Math.round((3 * ddt - flour - ambient - friction) * 10) / 10;
  const cellHum = Math.max(55, Math.min(85, Math.round(80 - (ambient - 20) * 1.5)));

  // 2) IoT Plug & Play — scan simulato
  const [scanning, setScanning] = useState(false);
  const [sensors, setSensors] = useState([]);
  const scan = () => {
    setScanning(true); setSensors([]);
    setTimeout(() => {
      setSensors([
        { id: "T1", type: tri("Temperatura", "Temperatur", "Temperature", "Temperatura", "Température", "دما"), val: "24.3°C", ic: Thermometer, c: "#a4afbb" },
        { id: "H1", type: tri("Umidità", "Feuchte", "Humidity", "Humedad", "Humidité", "رطوبت"), val: "68%", ic: Droplets, c: "#8a97a6" },
        { id: "P1", type: "pH", val: "5.4", ic: Gauge, c: "#93a2ae" },
        { id: "F1", type: tri("Flusso", "Fluss", "Flow", "Flujo", "Flux", "جریان"), val: "1.2 L/m", ic: Wifi, c: "#9aa6b2" },
      ]);
      setScanning(false);
    }, 1600);
  };

  // 3) Manutenzione predittiva
  const [machines, setMachines] = useState([
    { name: tri("Forno rotativo", "Rotorofen", "Rotary oven", "Horno rotativo", "Four rotatif", "فر گردان"), health: 94, wear: 12 },
    { name: tri("Impastatrice", "Kneter", "Mixer", "Amasadora", "Pétrin", "خمیرگیر"), health: 88, wear: 21 },
    { name: tri("Cella lievitazione", "Gärzelle", "Proofer", "Cámara", "Chambre", "اتاق تخمیر"), health: 71, wear: 44 },
  ]);
  useEffect(() => {
    const t = setInterval(() => setMachines((ms) => ms.map((m) => ({ ...m, health: Math.max(40, Math.min(99, m.health + (Math.random() - 0.55) * 2)) }))), 3000);
    return () => clearInterval(t);
  }, []);

  // 4) Edge computing enzimatico — latenza µs
  const [lat, setLat] = useState(0.42);
  useEffect(() => { const t = setInterval(() => setLat(Math.round((0.2 + Math.random() * 0.6) * 100) / 100), 900); return () => clearInterval(t); }, []);

  // 5) Controllo vocale privato (Web Speech API locale)
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [voiceMsg, setVoiceMsg] = useState("");
  const recRef = useRef(null);

  const runVoiceCommand = (txt) => {
    const t = (txt || "").toLowerCase();
    if (/(sensor|scansiona|scannerizza|scan|iot)/.test(t)) { scan(); setVoiceMsg(tri("Comando: scansione sensori avviata.", "Befehl: Sensor-Scan gestartet.", "Command: sensor scan started.", "Comando: escaneo iniciado.", "Commande : scan lancé.", "فرمان: اسکن آغاز شد.")); return; }
    if (/(manutenz|maintenance|guasto|machine|macchin)/.test(t)) { setVoiceMsg(tri("Comando: stato manutenzione mostrato.", "Befehl: Wartungsstatus.", "Command: maintenance status.", "Comando: mantenimiento.", "Commande : maintenance.", "فرمان: نگهداری.")); return; }
    if (/(clima|climate|meteo|acqua|water)/.test(t)) { setVoiceMsg(tri("Comando: compensazione climatica in evidenza.", "Befehl: Klimaausgleich.", "Command: climate compensation.", "Comando: clima.", "Commande : climat.", "فرمان: آب‌وهوا.")); return; }
    setVoiceMsg(tri("Comando non riconosciuto. Prova: 'scansiona sensori'.", "Unbekannter Befehl. Versuch: 'Sensoren scannen'.", "Command not recognized. Try: 'scan sensors'.", "No reconocido. Prueba: 'escanear'.", "Non reconnu. Essaie : 'scanner'.", "شناخته نشد."));
  };
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setHeard(tri("Riconoscimento vocale non supportato dal browser.", "Spracherkennung nicht unterstützt.", "Voice recognition not supported.", "Reconocimiento no soportado.", "Reconnaissance non supportée.", "پشتیبانی نمی‌شود.")); return; }
    if (listening) { try { recRef.current && recRef.current.stop(); } catch { /* */ } setListening(false); return; }
    const r = new SR(); recRef.current = r;
    r.lang = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" }[lang] || "it-IT";
    r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const txt = e.results[0][0].transcript; setHeard(txt); setListening(false); runVoiceCommand(txt); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    try { r.start(); setListening(true); setHeard(""); } catch { setListening(false); }
  };
  useEffect(() => () => { try { recRef.current && recRef.current.stop(); } catch { /* */ } }, []);

  const critical = machines.find((m) => m.health < 75);

  return (
    <div data-testid="advanced-lab" className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#a6b1bc]/10 border border-[#a6b1bc]/40 flex items-center justify-center"><Zap className="w-6 h-6 text-[#a6b1bc]" /></div>
        <div>
          <h3 className="font-cyber text-base font-black text-white uppercase tracking-wide">{tri("Tecnologie Uniche al Mondo", "Einzigartige Technologien", "World-Unique Technologies", "Tecnologías Únicas", "Technologies Uniques", "فناوری‌های بی‌نظیر")}</h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Plancia avanzata di Sitor — dati live.", "Erweiterte Konsole — Live-Daten.", "Advanced console — live data.", "Consola avanzada — datos en vivo.", "Console avancée — données en direct.", "کنسول پیشرفته — داده زنده")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Compensazione climatica */}
        <Card testid="lab-climate" icon={CloudSun} accent="#8a97a6" title={tri("Compensazione Climatica", "Klimaausgleich", "Climate Compensation", "Compensación Climática", "Compensation Climatique", "جبران آب‌وهوا")} sub={tri("Prodotto identico in ogni clima", "Gleiches Produkt in jedem Klima", "Same product in any climate", "Mismo producto en cualquier clima", "Même produit sous tout climat", "محصول یکسان")}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-[9px] text-[#94A3B8] uppercase">{tri("Ambiente", "Umgebung", "Ambient", "Ambiente", "Ambiant", "محیط")}</p><p className="font-cyber text-lg font-black text-white">{ambient.toFixed(1)}°</p></div>
            <div><p className="text-[9px] text-[#8a97a6] uppercase">{tri("Acqua", "Wasser", "Water", "Agua", "Eau", "آب")}</p><p className="font-cyber text-lg font-black text-[#8a97a6]">{waterT}°</p></div>
            <div><p className="text-[9px] text-[#93a2ae] uppercase">{tri("Umid. cella", "Zellfeuchte", "Cell hum.", "Humedad", "Humidité", "رطوبت")}</p><p className="font-cyber text-lg font-black text-[#93a2ae]">{cellHum}%</p></div>
          </div>
        </Card>

        {/* IoT Plug & Play */}
        <Card testid="lab-iot" icon={Radio} accent="#9aa6b2" title={tri("IoT Plug & Play", "IoT Plug & Play", "IoT Plug & Play", "IoT Plug & Play", "IoT Plug & Play", "IoT")} sub={tri("Riconoscimento sensori in 1s", "Sensor-Erkennung in 1s", "Sensor recognition in 1s", "Reconocimiento en 1s", "Reconnaissance en 1s", "شناسایی در ۱ ثانیه")}>
          <button data-testid="lab-iot-scan" onClick={scan} disabled={scanning} className="w-full mb-2 py-1.5 rounded-lg text-[11px] font-bold text-[#060A10] disabled:opacity-60" style={{ background: "linear-gradient(90deg,#9aa6b2,#8a97a6)" }}>{scanning ? tri("Scansione…", "Scan…", "Scanning…", "Escaneando…", "Analyse…", "اسکن…") : tri("Scansiona sensori", "Sensoren scannen", "Scan sensors", "Escanear", "Scanner", "اسکن سنسورها")}</button>
          <div className="grid grid-cols-2 gap-1.5">
            {sensors.map((s) => (<div key={s.id} className="flex items-center gap-1.5 rounded bg-[#0b0f19] border border-[#1e293b] px-2 py-1"><s.ic className="w-3.5 h-3.5" style={{ color: s.c }} /><span className="text-[10px] text-[#c5d3df] truncate">{s.type}</span><span className="ml-auto text-[10px] font-bold" style={{ color: s.c }}>{s.val}</span></div>))}
          </div>
        </Card>

        {/* Manutenzione predittiva */}
        <Card testid="lab-maintenance" icon={Activity} accent="#6e9e85" title={tri("Manutenzione Predittiva", "Vorausschauende Wartung", "Predictive Maintenance", "Mantenimiento Predictivo", "Maintenance Prédictive", "نگهداری پیش‌بینانه")} sub={tri("Guasti previsti prima che accadano", "Ausfälle vorhergesagt", "Failures predicted early", "Fallos anticipados", "Pannes anticipées", "پیش‌بینی خرابی")}>
          <div className="space-y-1.5">
            {machines.map((m) => (
              <div key={m.name}>
                <div className="flex items-center justify-between text-[10.5px]"><span className="text-[#c5d3df] truncate">{m.name}</span><span className="font-bold" style={{ color: m.health < 75 ? "#aaa795" : "#6e9e85" }}>{Math.round(m.health)}%</span></div>
                <div className="h-1.5 rounded-full bg-[#0b0f19] overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${m.health}%`, background: m.health < 75 ? "#aaa795" : "#6e9e85" }} /></div>
              </div>
            ))}
          </div>
          {critical && <p data-testid="lab-maint-alert" className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#aaa795]"><AlertTriangle className="w-3 h-3" /> {tri("Manutenzione consigliata", "Wartung empfohlen", "Maintenance advised", "Mantenimiento aconsejado", "Maintenance conseillée", "نگهداری توصیه می‌شود")}: {critical.name}</p>}
        </Card>

        {/* Edge computing + Voce */}
        <Card testid="lab-edge" icon={Cpu} accent="#a6b1bc" title={tri("Edge Enzimatico & Voce", "Edge & Sprache", "Enzymatic Edge & Voice", "Edge & Voz", "Edge & Voix", "Edge و صدا")} sub={tri("Calcolo locale sub-millisecondo", "Lokale Sub-ms-Berechnung", "Sub-ms local compute", "Cómputo local sub-ms", "Calcul local sub-ms", "پردازش محلی")}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#94A3B8] uppercase">{tri("Latenza", "Latenz", "Latency", "Latencia", "Latence", "تأخیر")}</span>
            <span className="font-cyber text-lg font-black text-[#a6b1bc] tabular-nums">{lat.toFixed(2)} ms</span>
          </div>
          <button data-testid="lab-voice" onClick={toggleVoice} className={`w-full py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1.5 border ${listening ? "bg-[#b06e78]/15 border-[#b06e78]/50 text-[#b06e78] animate-pulse" : "bg-[#0b0f19] border-[#1e293b] text-[#c5d3df]"}`}>
            {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />} {listening ? tri("Ascolto…", "Höre…", "Listening…", "Escuchando…", "Écoute…", "شنیدن…") : tri("Comando vocale privato", "Sprachbefehl", "Private voice command", "Comando de voz", "Commande vocale", "فرمان صوتی")}
          </button>
          {heard && <p data-testid="lab-voice-heard" className="mt-1.5 text-[10.5px] text-[#9aa6b2] italic">“{heard}”</p>}
          {voiceMsg && <p data-testid="lab-voice-action" className="mt-1 text-[10px] font-bold text-[#a6b1bc]">⟶ {voiceMsg}</p>}
        </Card>
      </div>
    </div>
  );
}
