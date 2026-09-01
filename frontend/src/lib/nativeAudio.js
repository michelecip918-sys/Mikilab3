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
