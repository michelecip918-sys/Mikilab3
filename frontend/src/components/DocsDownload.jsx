import { FileDown, FileText } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Documento ecosistema PDF in tutte le lingue del sito.
const DOCS = [
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
];
const KNOWN = new Set(["it", "de", "en", "es", "fr", "fa"]);
const fileFor = (code) => `${process.env.PUBLIC_URL || ""}/MikiLab_v14_Ecosystem_Document_${(KNOWN.has(code) ? code : "en").toUpperCase()}.pdf`;

export default function DocsDownload() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const current = DOCS.find((d) => d.code === lang) || DOCS.find((d) => d.code === "en") || DOCS[0];

  return (
    <div data-testid="docs-download" className="p-4 rounded-xl bg-[#0f172a]/80 border border-[#334155]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#14b8a6] flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4" /> {tri("Documento Ecosistema (PDF)", "Ökosystem-Dokument (PDF)", "Ecosystem Document (PDF)", "Documento Ecosistema (PDF)", "Document Écosystème (PDF)", "سند اکوسیستم (PDF)")}
      </h3>
      <p className="text-[10px] text-[#64748B] mb-3">{tri(
        "Manuale illustrato dei 64 moduli, hardware B2B e schermate reali — disponibile in tutte le lingue del sito.",
        "Illustriertes Handbuch der 64 Module, B2B-Hardware und echte Screenshots — in allen Sprachen der Seite.",
        "Illustrated manual of the 64 modules, B2B hardware and real screens — available in all site languages.",
        "Manual ilustrado de los 64 módulos, hardware B2B y pantallas reales — en todos los idiomas del sitio.",
        "Manuel illustré des 64 modules, matériel B2B et écrans réels — dans toutes les langues du site.",
        "راهنمای مصور ۶۴ ماژول، سخت‌افزار B2B و تصاویر واقعی — به همه زبان‌های سایت.")}</p>

      <a
        data-testid="docs-download-current"
        href={fileFor(current.code)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#14b8a6] text-[#030712] hover:bg-[#0d9488] active:scale-95 transition-all"
      >
        <FileDown className="w-4 h-4" /> {tri("Scarica", "Herunterladen", "Download", "Descargar", "Télécharger", "دانلود")} ({current.flag} {current.label})
      </a>

      <div className="mt-3 flex flex-wrap gap-2">
        {DOCS.map((d) => (
          <a
            key={d.code}
            data-testid={`docs-link-${d.code}`}
            href={fileFor(d.code)}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              d.code === current.code
                ? "border-[#14b8a6] text-[#14b8a6] bg-[#14b8a6]/10"
                : "border-[#374151] text-[#94A3B8] hover:text-white hover:border-[#14b8a6]"
            }`}
          >
            <span>{d.flag}</span> {d.label}
          </a>
        ))}
      </div>
    </div>
  );
}
