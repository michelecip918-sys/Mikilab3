import { useState, useMemo, useEffect } from "react";
import { GraduationCap, PlayCircle, ChefHat, Calculator, Wheat, Camera, Star, Printer, Bell } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { subscriptionApi } from "@/lib/api";
import { MENTORS, ACADEMY_VIDEOS, FLOURS, CALC_RECIPES } from "@/data/academy";
import Beginners from "@/sections/Beginners";
import { toast } from "sonner";

function VideoEmbed({ src, title, testid }) {
  const url = src.includes("?") ? `${src}&rel=0&modestbranding=1&playsinline=1&cc_load_policy=1` : `${src}?rel=0&modestbranding=1&playsinline=1&cc_load_policy=1`;
  return (
    <div data-testid={testid} className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16 / 9" }}>
      <iframe className="absolute inset-0 w-full h-full" src={url} title={title} loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen" allowFullScreen />
    </div>
  );
}

const DIFF = [
  { id: "all", it: "Tutti", de: "Alle", en: "All" },
  { id: "facile", it: "Facile", de: "Einfach", en: "Easy" },
  { id: "intermedio", it: "Intermedio", de: "Mittel", en: "Intermediate" },
  { id: "avanzato", it: "Avanzato", de: "Fortgeschritten", en: "Advanced" },
];

export default function AcademyHome() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const L = (o) => (o ? o[lang] || o.it : "");
  const [sub, setSub] = useState("mentori");
  const [mentor, setMentor] = useState("all");
  const [diff, setDiff] = useState("all");
  const [status, setStatus] = useState(null);

  useEffect(() => { subscriptionApi.status().then(setStatus).catch(() => setStatus(null)); }, []);

  // Notifica nuovi contenuti del mentore
  useEffect(() => {
    const newIds = ACADEMY_VIDEOS.filter((v) => v.isNew).map((v) => v.id);
    const seen = JSON.parse(localStorage.getItem("mikilab_academy_seen") || "[]");
    const fresh = newIds.filter((id) => !seen.includes(id));
    if (fresh.length) {
      toast.success(tri(`${fresh.length} nuovi video dai mentori!`, `${fresh.length} neue Mentor-Videos!`, `${fresh.length} new mentor videos!`), { icon: "🔔" });
      localStorage.setItem("mikilab_academy_seen", JSON.stringify([...seen, ...fresh]));
    }
  }, []); // eslint-disable-line

  const videos = useMemo(() => ACADEMY_VIDEOS.filter(
    (v) => (mentor === "all" || v.mentor === mentor) && (diff === "all" || v.difficulty === diff)
  ), [mentor, diff]);

  const diagUsed = status?.diagnosi_used ?? 0;
  const diagLimit = status?.diagnosi_limit;

  const TABS = [
    { id: "mentori", label: tri("Video Mentore", "Mentor-Videos", "Mentor videos"), Icon: PlayCircle },
    { id: "ricettario", label: tri("Ricettario", "Rezeptbuch", "Recipes"), Icon: Calculator },
    { id: "farine", label: tri("Farine", "Mehle", "Flours"), Icon: Wheat },
    { id: "corsi", label: tri("Corsi & Quiz", "Kurse & Quiz", "Courses & Quiz"), Icon: GraduationCap },
  ];

  const diffLabel = (id) => { const d = DIFF.find((x) => x.id === id); return d ? d[lang] || d.it : id; };
  const diffColor = (id) => (id === "facile" ? "#6B8E62" : id === "avanzato" ? "#B34A26" : "#6E8CA0");

  return (
    <div className="pb-4" data-testid="academy-home">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-4 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] p-6 text-white">
        <GraduationCap className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Impara da Casa", "Von zu Hause lernen", "Learn from Home")}</h1>
        <p className="text-white/85 text-sm mt-1 max-w-md">{tri("La tua Academy: mentori, ricettario dinamico, database farine e diagnosi delle tue cotture.", "Deine Academy: Mentoren, dynamisches Rezeptbuch, Mehl-Datenbank und Back-Diagnose.", "Your Academy: mentors, dynamic recipe book, flour database and bake diagnosis.")}</p>
        {typeof diagLimit === "number" && (
          <div data-testid="academy-diag-usage" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/25 px-3 py-1.5 text-sm font-semibold">
            <Camera className="w-4 h-4" /> {tri("Diagnosi Foto", "Foto-Diagnosen", "Photo diagnoses")}: {diagUsed}/{diagLimit} {tri("questo mese", "diesen Monat", "this month")}
          </div>
        )}
      </div>

      {/* Sub-nav */}
      <div data-testid="academy-subnav" className="grid grid-cols-4 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-5 border border-[#D7E1DB] dark:border-[#38424B]">
        {TABS.map(({ id, label, Icon }) => {
          const on = sub === id;
          return (
            <button key={id} data-testid={`academy-tab-${id}`} onClick={() => setSub(id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${on ? "bg-[#6B8E62] text-white shadow-md" : "text-[#7E8A93] hover:bg-white/60 dark:hover:bg-[#2A323A]"}`}>
              <Icon className="w-4 h-4 shrink-0" /><span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {sub === "mentori" && (
        <div className="space-y-4">
          {/* Scegli il mentore */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#7E8A93] mb-2 flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5" /> {tri("Scegli il tuo mentore", "Wähle deinen Mentor", "Choose your mentor")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button data-testid="mentor-all" onClick={() => setMentor("all")}
                className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${mentor === "all" ? "bg-[#6B8E62] text-white border-[#6B8E62]" : "bg-white dark:bg-[#232A31] border-[#D7E1DB] dark:border-[#38424B] text-[#7E8A93]"}`}>
                {tri("Tutti", "Alle", "All")}
              </button>
              {MENTORS.map((m) => {
                const on = mentor === m.id;
                return (
                  <button key={m.id} data-testid={`mentor-${m.id}`} onClick={() => setMentor(m.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${on ? "text-white" : "bg-white dark:bg-[#232A31] border-[#D7E1DB] dark:border-[#38424B] text-[#2B303B] dark:text-[#EAF0EC]"}`}
                    style={on ? { background: m.color, borderColor: m.color } : {}}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>{m.name[0]}</span>
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bio mentore selezionato */}
          {mentor !== "all" && (() => { const m = MENTORS.find((x) => x.id === mentor); return m ? (
            <div data-testid="mentor-bio" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4 flex items-start gap-3">
              <span className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: m.color }}>{m.name[0]}</span>
              <div>
                <p className="font-display font-bold text-[#2B303B] dark:text-[#EAF0EC]">{m.name}</p>
                <p className="text-xs font-semibold" style={{ color: m.color }}>{L(m.role)}</p>
                <p className="text-sm text-[#7E8A93] mt-1">{L(m.bio)}</p>
              </div>
            </div>
          ) : null; })()}

          {/* Filtro difficoltà */}
          <div className="flex gap-2 flex-wrap" data-testid="difficulty-filter">
            {DIFF.map((d) => {
              const on = diff === d.id;
              return (
                <button key={d.id} data-testid={`diff-${d.id}`} onClick={() => setDiff(d.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${on ? "text-white" : "bg-white dark:bg-[#232A31] border-[#D7E1DB] dark:border-[#38424B] text-[#7E8A93]"}`}
                  style={on ? { background: d.id === "all" ? "#5E8B7E" : diffColor(d.id), borderColor: d.id === "all" ? "#5E8B7E" : diffColor(d.id) } : {}}>
                  {d[lang] || d.it}
                </button>
              );
            })}
          </div>

          {/* Griglia video */}
          <div className="space-y-4">
            {videos.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Nessun video con questi filtri.", "Keine Videos mit diesen Filtern.", "No videos with these filters.")}</p>}
            {videos.map((v) => (
              <div key={v.id} data-testid={`academy-video-${v.id}`} className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl overflow-hidden">
                <VideoEmbed src={`https://www.youtube.com/embed/${v.yt}`} title={L(v.title)} testid={`academy-video-frame-${v.id}`} />
                <div className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: diffColor(v.difficulty) }}>{diffLabel(v.difficulty)}</span>
                    <span className="text-[11px] text-[#7E8A93]">{v.duration}</span>
                    {v.isNew && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B34A26] text-white flex items-center gap-1"><Bell className="w-3 h-3" />{tri("Nuovo", "Neu", "New")}</span>}
                    <span className="ml-auto text-[10px] text-[#7E8A93]">CC {v.subs.map((s) => s.toUpperCase()).join(" · ")}</span>
                  </div>
                  <p className="font-display font-bold text-[#2B303B] dark:text-[#EAF0EC] leading-tight">{L(v.title)}</p>
                  <p className="text-sm text-[#7E8A93] mt-1">{L(v.desc)}</p>
                  <p className="text-[11px] text-[#5E8B7E] mt-1.5 font-semibold">{MENTORS.find((m) => m.id === v.mentor)?.name}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-[#7E8A93]">{tri("Sottotitoli disponibili in IT · DE · EN (attiva i CC sul player).", "Untertitel in IT · DE · EN verfügbar (CC im Player aktivieren).", "Subtitles available in IT · DE · EN (enable CC in the player).")}</p>
        </div>
      )}

      {sub === "ricettario" && <DynamicRecipes />}
      {sub === "farine" && <FlourDB />}
      {sub === "corsi" && <Beginners />}
    </div>
  );
}

// --- Ricettario dinamico: calcolo dosi da teglia + farina --------------------
function DynamicRecipes() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const L = (o) => (o ? o[lang] || o.it : "");
  const [recipe, setRecipe] = useState(CALC_RECIPES[0].id);
  const [width, setWidth] = useState("30");
  const [length, setLength] = useState("40");
  const [flour, setFlour] = useState("00");

  const r = CALC_RECIPES.find((x) => x.id === recipe) || CALC_RECIPES[0];
  const area = (Number(width) || 0) * (Number(length) || 0);
  const flourG = Math.round(area * r.flourPerCm2);
  const g = (pct) => Math.round(flourG * pct / 100);

  // Scheda ricetta scaricabile/stampabile TRILINGUE (IT · DE · EN) → salva come PDF.
  const downloadPdf = () => {
    const L3 = (o) => ({ it: o.it, de: o.de || o.it, en: o.en || o.it });
    const nm = L3(r.name), ht = L3(r.hint);
    const LBL = {
      it: { flour: "Farina", water: "Acqua", salt: "Sale", oil: "Olio EVO", yeast: "Lievito di birra", tin: "Teglia" },
      de: { flour: "Mehl", water: "Wasser", salt: "Salz", oil: "Olivenöl", yeast: "Frischhefe", tin: "Blech" },
      en: { flour: "Flour", water: "Water", salt: "Salt", oil: "Olive oil", yeast: "Fresh yeast", tin: "Tin" },
    };
    const rows = (lng) => {
      const b = LBL[lng];
      const line = (k, v) => `<tr><td>${k}</td><td style="text-align:right;font-family:monospace">${v} g</td></tr>`;
      let out = line(`<b>${b.flour}</b>`, `<b>${flourG}</b>`) + line(b.water, g(r.bp.water)) + line(b.salt, g(r.bp.salt));
      if (r.bp.oil > 0) out += line(b.oil, g(r.bp.oil));
      out += line(b.yeast, g(r.bp.yeast));
      return out;
    };
    const block = (lng) => `
      <div class="card">
        <h2>${nm[lng]} · ${flour}</h2>
        <p class="sub">${LBL[lng].tin} ${width}×${length} cm</p>
        <table>${rows(lng)}</table>
        <p class="hint">💡 ${ht[lng]}</p>
      </div>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>MikiLab · ${nm.it}</title>
      <style>
        body{font-family:Georgia,serif;color:#2B303B;margin:24px;background:#fff}
        .head{text-align:center;border-bottom:3px solid #6B8E62;padding-bottom:10px;margin-bottom:18px}
        .head h1{margin:0;color:#4d6b45}
        .head p{margin:2px 0 0;color:#7E8A93;font-size:13px}
        .card{border:1px solid #D7E1DB;border-radius:12px;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid}
        .card h2{margin:0 0 2px;font-size:18px}
        .sub{margin:0 0 8px;color:#7E8A93;font-size:12px}
        table{width:100%;border-collapse:collapse}
        td{padding:4px 0;border-bottom:1px solid #EAF0EC;font-size:15px}
        .hint{margin:10px 0 0;color:#4d6b45;font-size:13px}
        .flag{font-size:12px;font-weight:bold;color:#6B8E62;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px}
        .foot{text-align:center;color:#7E8A93;font-size:11px;margin-top:16px}
      </style></head><body>
      <div class="head"><h1>MikiLab · Michele</h1><p>${nm.it} — ${LBL.it.tin} ${width}×${length} cm · ${flour}</p></div>
      <p class="flag">🇮🇹 Italiano</p>${block("it")}
      <p class="flag">🇩🇪 Deutsch</p>${block("de")}
      <p class="flag">🇬🇧 English</p>${block("en")}
      <p class="foot">MikiLab · mikilab.de</p>
      <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-4" data-testid="dynamic-recipes">
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4 space-y-3">
        <p className="font-display font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Calcola le dosi", "Mengen berechnen", "Calculate the doses")}</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Ricetta", "Rezept", "Recipe")}</span>
            <select data-testid="calc-recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)}
              className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5">
              {CALC_RECIPES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Larghezza teglia (cm)", "Blechbreite (cm)", "Tin width (cm)")}</span>
              <input data-testid="calc-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5" />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Lunghezza teglia (cm)", "Blechlänge (cm)", "Tin length (cm)")}</span>
              <input data-testid="calc-length" type="number" value={length} onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5" />
            </label>
          </div>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Farina", "Mehl", "Flour")}</span>
            <select data-testid="calc-flour" value={flour} onChange={(e) => setFlour(e.target.value)}
              className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5">
              {FLOURS.map((f) => <option key={f.name} value={f.name}>{f.name} · {f.type_de}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Risultato */}
      <div className="print-area rounded-2xl bg-gradient-to-br from-[#6B8E62]/10 to-[#4d6b45]/5 border border-[#6B8E62]/30 p-5" data-testid="calc-result">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{L(r.name)} · {flour}</p>
        <p className="text-xs text-[#7E8A93] mb-3">{tri("Teglia", "Blech", "Tin")} {width}×{length} cm</p>
        <div className="space-y-1.5 font-mono-data text-sm">
          <Row label={tri("Farina", "Mehl", "Flour")} val={`${flourG} g`} bold />
          <Row label={tri("Acqua", "Wasser", "Water")} val={`${g(r.bp.water)} g`} />
          <Row label={tri("Sale", "Salz", "Salt")} val={`${g(r.bp.salt)} g`} />
          {r.bp.oil > 0 && <Row label={tri("Olio EVO", "Olivenöl", "Olive oil")} val={`${g(r.bp.oil)} g`} />}
          <Row label={tri("Lievito di birra", "Frischhefe", "Fresh yeast")} val={`${g(r.bp.yeast)} g`} />
        </div>
        <p className="text-sm text-[#4d6b45] dark:text-[#9ec48f] mt-3">💡 {L(r.hint)}</p>
      </div>

      <button data-testid="calc-print" onClick={downloadPdf}
        className="w-full flex items-center justify-center gap-2 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        <Printer className="w-5 h-5" /> {tri("Scarica scheda PDF (IT · DE · EN)", "PDF-Karte herunterladen (IT · DE · EN)", "Download recipe card PDF (IT · DE · EN)")}
      </button>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold" : ""}`}>
      <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
      <span className="text-[#33564E] dark:text-[#8FB0C2]">{val}</span>
    </div>
  );
}

// --- Database farine ---------------------------------------------------------
function FlourDB() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [q, setQ] = useState("");
  const rows = FLOURS.filter((f) => `${f.name} ${f.type_de}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3" data-testid="flour-db">
      <input data-testid="flour-search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={tri("Cerca farina (es. 00, Dinkel, Manitoba)", "Mehl suchen (z.B. 00, Dinkel, Manitoba)", "Search flour (e.g. 00, Dinkel, Manitoba)")}
        className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5 text-sm" />
      <div className="rounded-2xl overflow-hidden border border-[#D7E1DB] dark:border-[#38424B]">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-[#EAF0EC] dark:bg-[#1F252B] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">
          <span>IT</span><span>DE (Type)</span><span>W</span>
        </div>
        {rows.map((f, i) => (
          <div key={f.name} data-testid={`flour-row-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2.5 text-sm border-t border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#232A31]">
            <div>
              <p className="font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{f.name}</p>
              <p className="text-xs text-[#7E8A93]">{f.use[lang] || f.use.it}</p>
            </div>
            <span className="text-[#3F4A54] dark:text-[#AEB8BF] self-center">{f.type_de}</span>
            <span className="font-mono-data text-[#33564E] dark:text-[#8FB0C2] self-center">{f.w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
