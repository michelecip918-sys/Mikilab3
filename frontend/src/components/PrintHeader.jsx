import { mkTri } from "@/i18n/triMaps";
// Intestazione visibile SOLO in stampa/PDF (logo MikiLab + titolo + data).
export default function PrintHeader({ title = "", lang = "it" }) {
  const base = process.env.PUBLIC_URL || "";
  const d = new Date().toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB"));
  return (
    <div className="print-only" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #c94f00", paddingBottom: 8 }}>
        <img src={`${base}/logo-256.png`} alt="MikiLab" style={{ height: 38, width: "auto" }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#2B303B" }}>MikiLab</div>
          {title ? <div style={{ fontSize: 12, color: "#555" }}>{title} · {d}</div> : <div style={{ fontSize: 12, color: "#555" }}>{d}</div>}
        </div>
      </div>
    </div>
  );
}
