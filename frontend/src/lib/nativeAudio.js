import { playTTS } from "@/lib/tts";

// Ponte audio multi-operatore. In WEB: sintesi nativa del dispositivo + indicatore UI
// che mostra QUALE operatore riceve la notifica. Predisposto per la build NATIVA
// (Capacitor / Native Audio Plugin) che instraderà l'audio sul MAC address Bluetooth
// del singolo auricolare (instradamento multicanale non possibile nel browser).
export function isNativeAudioAvailable() {
  try {
    const P = window.Capacitor && window.Capacitor.Plugins;
    return !!(P && (P.MikiAudio || P.NativeAudio));
  } catch { return false; }
}

export function routeVoice({ text, lang = "it", persona = "michele", operator = null, onEnded } = {}) {
  // 1) UI: chi sta ricevendo la notifica
  window.dispatchEvent(new CustomEvent("mikilab-audio-route", { detail: { text, persona, operator } }));

  // 2) Build nativa futura: instrada sul singolo auricolare via MAC address
  if (isNativeAudioAvailable() && operator && operator.earphoneMac) {
    try {
      const P = window.Capacitor.Plugins.MikiAudio || window.Capacitor.Plugins.NativeAudio;
      if (P.speakTo) { P.speakTo({ text, lang, mac: operator.earphoneMac, persona }); if (onEnded) onEnded(); return; }
    } catch { /* fallback web */ }
  }

  // 3) Web: sintesi vocale nativa del dispositivo
  playTTS(text, { lang, voice: persona, onEnded });
}

// --- Routing cuffie Bluetooth per-operatore (plugin @mikilab/bluetooth-audio) ---
function btPlugin() {
  try { const P = window.Capacitor && window.Capacitor.Plugins; return P && P.BluetoothAudio; } catch { return null; }
}
export function isHeadsetRoutingAvailable() {
  try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && btPlugin()); } catch { return false; }
}
export async function listHeadsets() {
  const P = btPlugin(); if (!P) return [];
  try { const r = await P.listDevices(); return (r && r.devices) || []; } catch { return []; }
}
export async function connectHeadset(operatorId = "", deviceId = "") {
  const P = btPlugin(); if (!P) return { ok: false, reason: "web" };
  try { await P.requestPermissions(); const r = await P.connect({ operatorId, deviceId }); return { ok: !!(r && r.ok), device: r && r.device }; }
  catch (e) { return { ok: false, reason: String(e?.message || e) }; }
}
export async function startHeadsetSco() { const P = btPlugin(); if (P) { try { await P.startSco(); } catch { /* */ } } }

