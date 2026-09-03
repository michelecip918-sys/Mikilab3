import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Radio, Thermometer, Send, Headphones, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { playTTS } from "@/lib/tts";

// Pannello "Ufficio & Squadra (Live-Sync)": l'ufficio ricalcola il piano dagli ordini extra
// e lo comunica alla squadra a voce (voce del telefono → zero crediti). Cuffie hands-free
// riusano l'ascolto continuo globale. Calcolo Temperatura Acqua (Formula 3T) integrato.
const D = { bg: "#0E1620", card: "#1E1E1E", input: "#151515", accent: "#3E9C93", green: "#00FF66", red: "#FF3333", text: "#FFFFFF", muted: "#A0A0A0", border: "#333333" };

export default function UfficioSquadra({ open, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const persona = (() => { try { return localStorage.getItem("mikilab_voice_persona") || "michele"; } catch { return "michele"; } })();
  const speak = (t) => playTTS(t, { lang, voice: persona });

  const [wake, setWake] = useState(false);
  const [extra, setExtra] = useState("");
  const [piano, setPiano] = useState("");
  const [ta, setTa] = useState(22), [tf, setTf] = useState(20), [ti, setTi] = useState(9), [td, setTd] = useState(24);
  const [acqua, setAcqua] = useState(null);

  useEffect(() => {
    const onState = (e) => setWake(!!e.detail?.wake);
    window.addEventListener("mikilab-voice-state", onState);
    return () => window.removeEventListener("mikilab-voice-state", onState);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const rigenera = () => {
    if (!extra.trim()) { toast.info(tri("Inserisci un ordine extra dall'ufficio.", "Gib eine Zusatzbestellung ein.", "Enter an extra order from the office.", "Introduce un pedido extra.", "Saisis une commande extra.", "یک سفارش اضافه وارد کن.")); return; }
    const m = extra.match(/\d+/);
    const kg = m ? parseInt(m[0], 10) : 10;
    const msg = tri(
      `Piano ricalcolato: +${kg}kg impasto integrati. Aggiungere ${Math.round(kg * 0.65)} litri d'acqua. Impastatrice +3 minuti. Notifica inviata alla squadra.`,
      `Plan neu berechnet: +${kg}kg Teig. ${Math.round(kg * 0.65)} Liter Wasser hinzufügen. Kneter +3 Minuten. Team benachrichtigt.`,
      `Plan recomputed: +${kg}kg dough added. Add ${Math.round(kg * 0.65)} litres of water. Mixer +3 minutes. Team notified.`,
      `Plan recalculado: +${kg}kg de masa. Añadir ${Math.round(kg * 0.65)} litros de agua. Amasadora +3 minutos. Equipo avisado.`,
      `Plan recalculé : +${kg}kg de pâte. Ajouter ${Math.round(kg * 0.65)} litres d'eau. Pétrin +3 minutes. Équipe notifiée.`,
      `برنامه بازمحاسبه شد: +${kg} کیلو خمیر. ${Math.round(kg * 0.65)} لیتر آب اضافه کن. همزن +۳ دقیقه.`,
    );
    setPiano(msg);
    speak(msg);
  };

  const toggleCuffie = async () => {
    if (wake) { window.dispatchEvent(new Event("mikilab-wake-off")); return; }
    // Permesso microfono richiesto nel gesto del click.
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); s.getTracks().forEach((t) => t.stop()); }
      catch { toast.error(tri("Microfono negato. Abilitalo nel browser.", "Mikrofon verweigert.", "Microphone denied. Enable it in the browser.", "Micrófono denegado.", "Micro refusé.", "میکروفون رد شد.")); return; }
    }
    window.dispatchEvent(new Event("mikilab-wake-on"));
  };

  const calcolaAcqua = () => {
    const res = (parseFloat(td) * 3) - (parseFloat(ta) + parseFloat(tf) + parseFloat(ti));
    const v = res.toFixed(1);
    setAcqua(v);
    speak(tri(`Temperatura acqua: ${v} gradi.`, `Wassertemperatur: ${v} Grad.`, `Water temperature: ${v} degrees.`, `Temperatura del agua: ${v} grados.`, `Température de l'eau : ${v} degrés.`, `دمای آب: ${v} درجه.`));
  };

  if (!open) return null;

  const inputCls = "w-full rounded-md px-3 py-2 text-[15px] outline-none";
  const inputSty = { background: D.input, border: `1px solid ${D.border}`, color: D.text };

  return createPortal(
    <div data-testid="ufficio-squadra" className="fixed inset-0 z-[900] overflow-y-auto" style={{ background: D.bg, color: D.text }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: D.card, borderBottom: `2px solid ${D.accent}` }}>
        <h1 className="flex items-center gap-2 font-extrabold text-[17px]" style={{ color: D.accent }}>
          <Building2 className="w-5 h-5" /> {tri("Ufficio & Squadra", "Büro & Team", "Office & Team", "Oficina y Equipo", "Bureau & Équipe", "دفتر و تیم")}
        </h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.muted }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: wake ? D.green : "#555", boxShadow: wake ? `0 0 8px ${D.green}` : "none" }} />
            {wake ? tri("Live Squadra", "Team live", "Team live", "Equipo en vivo", "Équipe live", "تیم زنده") : "Standby"}
          </span>
          <button data-testid="ufficio-close" onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95" style={{ background: D.input, border: `1px solid ${D.border}` }}><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Live-Sync */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.accent}` }}>
          <h2 className="flex items-center gap-2 font-bold text-[15px] mb-1" style={{ color: D.accent }}><Radio className="w-4 h-4" /> BakeMix AI Live-Sync</h2>
          <p className="text-[13px] mb-3" style={{ color: D.muted }}>{tri("Modifica la produzione dall'ufficio o comunica con la squadra a voce, senza consumo di crediti.", "Produktion vom Büro ändern oder mit dem Team sprechen, ohne Guthaben.", "Edit production from the office or talk to the team by voice, no credit use.", "Edita la producción desde la oficina o habla con el equipo, sin gastar créditos.", "Modifie la production depuis le bureau ou parle à l'équipe, sans crédits.", "تولید را از دفتر ویرایش کن یا با تیم صحبت کن، بدون مصرف اعتبار.")}</p>

          <label className="text-[12px]" style={{ color: D.muted }}>{tri("Ordini extra / Varianti del Capo", "Zusatzbestellungen / Chef-Varianten", "Extra orders / Chef's changes", "Pedidos extra / Cambios del Jefe", "Commandes extra / Variantes du Chef", "سفارش‌های اضافه / تغییرات سرآشپز")}</label>
          <textarea data-testid="ufficio-extra-orders" rows={2} value={extra} onChange={(e) => setExtra(e.target.value)}
            placeholder={tri("Es. Aggiungi +20kg Pane Matera al 75%…", "z.B. +20kg Matera-Brot bei 75%…", "e.g. Add +20kg Matera bread at 75%…", "Ej. +20kg pan Matera al 75%…", "ex. +20kg pain Matera à 75%…", "مثلاً +۲۰ کیلو نان…")}
            className={inputCls + " my-2 resize-none"} style={inputSty} />
          <button data-testid="ufficio-rigenera" onClick={rigenera} className="w-full rounded-md py-2.5 font-bold active:scale-98 transition-all" style={{ background: "transparent", border: `1px solid ${D.accent}`, color: D.accent }}>
            {tri("RIGENERA PIANO IMPASTI & MACCHINE", "PLAN & MASCHINEN NEU BERECHNEN", "REGENERATE DOUGH & MACHINE PLAN", "REGENERAR PLAN DE MASAS", "RÉGÉNÉRER LE PLAN", "بازتولید برنامه")}
          </button>
          {piano && <div data-testid="ufficio-piano-result" className="mt-3 rounded-md p-3 text-[14px]" style={{ background: D.input, border: `1px dashed ${D.accent}` }}>{piano}</div>}

          <hr className="my-4" style={{ borderColor: D.border }} />

          <button data-testid="ufficio-cuffie" onClick={toggleCuffie} className="w-full rounded-lg py-3 font-extrabold text-white flex items-center justify-center gap-2 active:scale-98 transition-all" style={{ background: wake ? D.red : D.accent }}>
            <Headphones className="w-5 h-5" /> {wake ? tri("DISATTIVA CUFFIE SQUADRA", "TEAM-HEADSET AUS", "TURN OFF TEAM HEADSET", "APAGAR AURICULARES", "COUPER LE CASQUE", "خاموش کردن هدست") : tri("ATTIVA CUFFIE SQUADRA (HANDS-FREE)", "TEAM-HEADSET AN (HANDS-FREE)", "ACTIVATE TEAM HEADSET (HANDS-FREE)", "ACTIVAR AURICULARES", "ACTIVER LE CASQUE", "فعال‌سازی هدست")}
          </button>
          <p data-testid="ufficio-audio-log" className="text-[12px] mt-2" style={{ color: D.muted }}>
            {wake ? tri("Cuffie attive: soppressione rumore macchinari abilitata. Di' «Ehi Lab» per parlare.", "Headset aktiv: Maschinen-Rauschunterdrückung. Sag «Ehi Lab».", "Headset active: machine-noise suppression on. Say «Ehi Lab».", "Auriculares activos: supresión de ruido. Di «Ehi Lab».", "Casque actif : suppression du bruit. Dis «Ehi Lab».", "هدست فعال: حذف نویز ماشین.") : tri("Audio in standby. Zero crediti consumati.", "Audio im Standby. Kein Guthaben.", "Audio on standby. Zero credits used.", "Audio en espera. Cero créditos.", "Audio en veille. Zéro crédit.", "صدا در حالت آماده. بدون مصرف اعتبار.")}
          </p>
        </div>

        {/* Temperatura Acqua 3T */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <h3 className="flex items-center gap-2 font-bold text-[15px] mb-3" style={{ color: D.accent }}><Thermometer className="w-4 h-4" /> {tri("Temperatura Acqua (Formula 3T)", "Wassertemperatur (3T-Formel)", "Water Temperature (3T Formula)", "Temperatura del Agua (Fórmula 3T)", "Température de l'Eau (Formule 3T)", "دمای آب (فرمول ۳T)")}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              [tri("Temp. Ambiente °C", "Raumtemp. °C", "Room temp °C", "Temp. ambiente °C", "Temp. ambiante °C", "دمای محیط"), ta, setTa, "ufficio-temp-amb"],
              [tri("Temp. Farina °C", "Mehltemp. °C", "Flour temp °C", "Temp. harina °C", "Temp. farine °C", "دمای آرد"), tf, setTf, "ufficio-temp-far"],
              [tri("Riscald. Impastatrice °C", "Kneter-Erwärmung °C", "Mixer heating °C", "Calent. amasadora °C", "Échauffement pétrin °C", "گرمای همزن"), ti, setTi, "ufficio-temp-imp"],
              [tri("Temp. Desiderata °C", "Zieltemp. °C", "Target temp °C", "Temp. deseada °C", "Temp. désirée °C", "دمای هدف"), td, setTd, "ufficio-temp-des"],
            ].map(([label, val, set, tid], i) => (
              <div key={i}>
                <label className="text-[11px]" style={{ color: D.muted }}>{label}</label>
                <input data-testid={tid} type="number" value={val} onChange={(e) => set(e.target.value)} className={inputCls + " mt-1"} style={inputSty} />
              </div>
            ))}
          </div>
          <button data-testid="ufficio-calcola-acqua" onClick={calcolaAcqua} className="w-full rounded-md py-2.5 mt-3 font-bold active:scale-98 transition-all flex items-center justify-center gap-2" style={{ background: "transparent", border: `1px solid ${D.accent}`, color: D.accent }}>
            <Send className="w-4 h-4" /> {tri("CALCOLA TEMPERATURA ACQUA", "WASSERTEMPERATUR BERECHNEN", "CALCULATE WATER TEMPERATURE", "CALCULAR TEMPERATURA", "CALCULER LA TEMPÉRATURE", "محاسبه دمای آب")}
          </button>
          {acqua !== null && (
            <div data-testid="ufficio-acqua-result" className="mt-3 rounded-md p-3 text-center font-bold text-[15px]" style={{ background: D.input, border: `1px dashed ${D.accent}` }}>
              {tri("Temperatura acqua consigliata", "Empfohlene Wassertemperatur", "Recommended water temperature", "Temperatura recomendada", "Température recommandée", "دمای پیشنهادی آب")}: <span style={{ color: D.accent }}>{acqua} °C</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
