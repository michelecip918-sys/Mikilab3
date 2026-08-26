import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Loader2, Check } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export const VOICE_OPTIONS = [
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", desc: { it: "Profonda, rassicurante", de: "Tief, beruhigend", en: "Deep, reassuring" } },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", desc: { it: "Calda, narratore", de: "Warm, Erzähler", en: "Warm, storyteller" } },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", desc: { it: "Morbida, affidabile", de: "Weich, vertrauensvoll", en: "Smooth, trustworthy" } },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", desc: { it: "Amichevole, spontanea", de: "Freundlich, natürlich", en: "Charming, down-to-earth" } },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: { it: "Sicura, da speaker", de: "Sicher, Sprecher", en: "Steady broadcaster" } },
];

export const getVoiceId = (who) =>
  localStorage.getItem(who === "michele" ? "mikilab_voice_michele" : "mikilab_voice_momy") ||
  (who === "michele" ? "JBFqnCBsd6RMkjVDRZzb" : "nPczCjzI2devNBz1zQrb");

export default function VoiceSettings({ open, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [momy, setMomy] = useState(getVoiceId("momy"));
  const [michele, setMichele] = useState(getVoiceId("michele"));
  const [previewing, setPreviewing] = useState(null);
  const audioRef = useRef(null);

  const preview = async (voiceId, who) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setPreviewing(voiceId + who);
      const sample = who === "michele"
        ? tri("Ciao, sono Michele, benvenuto in MikiLab.", "Hallo, ich bin Michele, willkommen bei MikiLab.", "Hi, I'm Michele, welcome to MikiLab.")
        : tri("Ciao, sono Momy, il tuo assistente in laboratorio.", "Hallo, ich bin Momy, dein Assistent.", "Hi, I'm Momy, your lab assistant.");
      const res = await fetch(`${API}/tts`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ text: sample, lang, voice_id: voiceId }),
      });
      const blob = await res.blob();
      const a = new Audio(URL.createObjectURL(blob));
      audioRef.current = a;
      a.onended = () => setPreviewing(null);
      await a.play();
    } catch { setPreviewing(null); }
  };

  const save = () => {
    localStorage.setItem("mikilab_voice_momy", momy);
    localStorage.setItem("mikilab_voice_michele", michele);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    onClose();
  };

  const Group = ({ title, sel, setSel, who }) => (
    <div className="mb-4">
      <p className="font-display font-bold text-[#2B303B] dark:text-[#e4eff8] mb-2">{title}</p>
      <div className="space-y-2">
        {VOICE_OPTIONS.map((v) => {
          const on = sel === v.id;
          return (
            <div key={v.id} className={`flex items-center gap-2 rounded-2xl border p-2.5 ${on ? "border-[#3f7cac] bg-[#3f7cac]/8" : "border-[#d5e4f0] dark:border-[#38424B]"}`}>
              <button data-testid={`voice-${who}-${v.name}`} onClick={() => setSel(v.id)} className="flex-1 text-left min-w-0">
                <span className="font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8]">{v.name}</span>
                <span className="text-xs text-[#7E8A93] block truncate">{v.desc[lang] || v.desc.it}</span>
              </button>
              <button data-testid={`voice-preview-${who}-${v.name}`} onClick={() => preview(v.id, who)} className="w-9 h-9 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                {previewing === v.id + who ? <Loader2 className="w-4 h-4 animate-spin text-[#3f7cac]" /> : <Volume2 className="w-4 h-4 text-[#3f7cac]" />}
              </button>
              {on && <Check className="w-5 h-5 text-[#3f7cac] shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3" onClick={onClose}>
          <motion.div data-testid="voice-settings" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#f0f6fb] dark:bg-[#1B2127] border border-[#d5e4f0] dark:border-[#38424B] shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Scegli le voci 🎙️", "Stimmen wählen 🎙️", "Choose the voices 🎙️")}</h2>
              <button data-testid="voice-settings-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <Group title={tri("Voce di Momy (assistente)", "Momy-Stimme (Assistent)", "Momy's voice (assistant)")} sel={momy} setSel={setMomy} who="momy" />
            <Group title={tri("Voce di Michele (fondatore)", "Michele-Stimme (Gründer)", "Michele's voice (founder)")} sel={michele} setSel={setMichele} who="michele" />
            <button data-testid="voice-settings-save" onClick={save}
              className="w-full bg-[#3f7cac] hover:bg-[#336a94] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
              {tri("Salva le voci", "Stimmen speichern", "Save voices")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
