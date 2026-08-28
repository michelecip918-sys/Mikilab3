import { useRef } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Doppia opzione ovunque: "Scatta ora" (fotocamera diretta) + "Allega" (galleria/file).
export default function DualPhotoButtons({ onFile, allowVideo = false, testid = "photo" }) {
  const camRef = useRef(null);
  const galRef = useRef(null);
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const acc = allowVideo ? "image/*,video/*" : "image/*";
  const pick = (e) => { const f = e.target.files && e.target.files[0]; if (f) onFile(f); e.target.value = ""; };
  return (
    <div className="grid grid-cols-2 gap-2" data-testid={`${testid}-dual`}>
      <input ref={camRef} data-testid={`${testid}-cam-input`} type="file" accept={acc} capture="environment" onChange={pick} className="hidden" />
      <input ref={galRef} data-testid={`${testid}-gallery-input`} type="file" accept={acc} onChange={pick} className="hidden" />
      <button type="button" data-testid={`${testid}-take`} onClick={() => camRef.current && camRef.current.click()}
        className="flex items-center justify-center gap-2 bg-[#8C4A27] hover:bg-[#336a94] text-white font-semibold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        <Camera className="w-5 h-5" /> {tri("Scatta ora", "Jetzt aufnehmen", "Take photo")}
      </button>
      <button type="button" data-testid={`${testid}-attach`} onClick={() => galRef.current && galRef.current.click()}
        className="flex items-center justify-center gap-2 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-semibold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        <ImagePlus className="w-5 h-5 text-[#B45309]" /> {tri("Allega", "Anhängen", "Attach")}
      </button>
    </div>
  );
}
