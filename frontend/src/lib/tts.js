import { getVoiceId } from "@/components/VoiceSettings";
import { API } from "@/lib/api";

let _audio = null;

export function stopTTS() {
  try { if (_audio) { _audio.pause(); _audio = null; } } catch { /* */ }
}

function cleanForVoice(t) {
  return (t || "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#*_>`~|]/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{2022}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 1200);
}

export async function playTTS(text, { who = "momy", lang = "it", onEnded } = {}) {
  stopTTS();
  const t = cleanForVoice(text);
  if (!t) return;
  const res = await fetch(`${API}/tts`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify({ text: t, lang, voice: who, voice_id: getVoiceId(who) }),
  });
  if (!res.ok) throw new Error("tts");
  const blob = await res.blob();
  _audio = new Audio(URL.createObjectURL(blob));
  if (onEnded) _audio.onended = onEnded;
  await _audio.play();
}
