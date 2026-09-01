import { useEffect, useState } from "react";
import { AlertTriangle, Snowflake, Wrench, Zap, ZapOff, RotateCcw, CheckCircle2, PackageCheck, Flame } from "lucide-react";
import { labConfigApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import {
  useShift, setWorkMode, toggleMachineDown, isMachineDown, setColdDown,
  addNote, clearNotes, basesSummary, statusLabel, machineDownNote, coldDownNote,
} from "@/lib/shiftState";

// Gestione Guasti & Celle — vista operativa (tema Oro del Grano).
// Segnala macchine fuori uso e celle non funzionanti; il ricalcolo (regole offline) genera
// note automatiche per il turno successivo. Include il riepilogo Basi & Pre-cotti.
const C = { cream: "#F5ECD7", surf: "#FBF6E8", border: "#E3C989", gold: "#C8862B", title: "#8A5A16", dark: "#3D2B1F", muted: "#6B5138", danger: "#9C4A1E" };

export default function Emergenze() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const shift = useShift();
  const [mixers, setMixers] = useState([]);
  const [cells, setCells] = useState([]);

  useEffect(() => {
    labConfigApi.get().then((cfg) => {
      const mx = (cfg && cfg.mixers) || [];
      setMixers(mx.length ? mx : [{ name: tri("Impastatrice principale", "Hauptmaschine", "Main mixer", "Amasadora principal", "Pétrin principal", "همزن اصلی") }]);
      setCells((cfg && cfg.cells) || []);
    }).catch(() => setMixers([{ name: tri("Impastatrice principale", "Hauptmaschine", "Main mixer", "Amasadora principal", "Pétrin principal", "همزن اصلی") }]));
    // eslint-disable-next-line
  }, []);

  const downNames = (shift.machines_down || []).map((m) => m.name);
  const bases = basesSummary(shift);

  const onMachine = (name) => {
    const willDown = !isMachineDown(shift, name);
    toggleMachineDown(name, willDown);
    if (willDown) addNote("🔧 " + machineDownNote(name, mixers, [...downNames, name], tri), "guasto");
  };

  const onCold = () => {
    const willDown = !shift.cold_down;
    setColdDown(willDown, willDown ? tri("Cella spenta stanotte", "Zelle heute Nacht aus", "Cell off tonight", "Cámara apagada", "Chambre éteinte", "سردخانه خاموش") : "");
    if (willDown) addNote("❄️→🔥 " + coldDownNote(tri), "cella");
  };

  const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  return (
    <div data-testid="emergenze" className="min-h-[70vh] rounded-3xl p-5 pb-28" style={{ background: C.cream, color: C.dark }}>
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-6 h-6" style={{ color: C.danger }} />
        <h1 className="font-display font-extrabold leading-tight" style={{ fontSize: "clamp(24px,6vw,34px)", color: C.dark }}>{tri("Guasti & Celle", "Störungen & Zellen", "Failures & Cells", "Averías y Cámaras", "Pannes & Chambres", "خرابی و سردخانه")}</h1>
      </div>
      <p className="text-[13px] mb-4" style={{ color: C.muted }}>{tri("Segnala un problema: l'app ricalcola e lascia una nota al turno dopo.", "Melde ein Problem: die App rechnet neu und hinterlässt eine Notiz.", "Report an issue: the app recalculates and leaves a note for the next shift.", "Reporta un problema: la app recalcula y deja una nota.", "Signale un problème : l'app recalcule et laisse une note.", "مشکل را ثبت کن: برنامه دوباره محاسبه می‌کند.")}</p>

      {/* Modalità di lavoro */}
      <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: C.title }}>{tri("Modalità di lavoro", "Arbeitsmodus", "Work mode", "Modo de trabajo", "Mode de travail", "حالت کار")}</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { id: "continuo", Icon: Zap, t: tri("Flusso Continuo", "Kontinuierlich", "Continuous Flow", "Flujo Continuo", "Flux Continu", "جریان پیوسته"), s: tri("In tempo reale con gli altri", "Echtzeit mit dem Team", "Real-time with the team", "En tiempo real", "Temps réel", "هم‌زمان با تیم") },
          { id: "autonomia", Icon: PackageCheck, t: tri("In Autonomia", "Eigenständig", "Autonomous", "En Autonomía", "En Autonomie", "خودگردان"), s: tri("Prepari in blocco per dopo", "Vorbereitung auf Vorrat", "Batch-prep ahead", "Prep. anticipada", "Prépa anticipée", "آماده‌سازی زودهنگام") },
        ].map((m) => {
          const on = shift.work_mode === m.id;
          return (
            <button key={m.id} data-testid={`emg-mode-${m.id}`} onClick={() => setWorkMode(m.id)}
              className="text-left rounded-2xl p-3 active:scale-98 transition-all" style={{ background: on ? C.gold : C.surf, border: `2px solid ${on ? C.gold : C.border}`, color: on ? C.cream : C.dark }}>
              <m.Icon className="w-6 h-6 mb-1.5" style={{ color: on ? C.cream : C.gold }} />
              <span className="block font-extrabold text-[14px] leading-tight">{m.t}</span>
              <span className="block text-[10.5px] leading-tight mt-0.5" style={{ color: on ? "#FBF0D8" : C.muted }}>{m.s}</span>
            </button>
          );
        })}
      </div>

      {/* Impastatrici / macchine */}
      <p className="text-xs font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: C.title }}><Wrench className="w-4 h-4" /> {tri("Impastatrici & macchine", "Maschinen", "Mixers & machines", "Amasadoras y máquinas", "Machines", "همزن‌ها")}</p>
      <div className="space-y-2 mb-5" data-testid="emg-machines">
        {mixers.map((m, i) => {
          const down = isMachineDown(shift, m.name);
          return (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: C.surf, border: `2px solid ${down ? C.danger : C.border}` }}>
              <span className="flex-1 min-w-0">
                <span className="block font-extrabold truncate" style={{ fontSize: "16px", color: down ? C.danger : C.dark }}>{m.name}{m.capacity_kg ? ` · ${m.capacity_kg}kg` : ""}</span>
                <span className="block text-[11px]" style={{ color: down ? C.danger : C.muted }}>{down ? tri("FUORI USO", "AUSSER BETRIEB", "OUT OF ORDER", "FUERA DE USO", "HORS SERVICE", "خراب") : tri("Operativa", "Betriebsbereit", "Operational", "Operativa", "Opérationnelle", "فعال")}</span>
              </span>
              <button data-testid={`emg-machine-toggle-${i}`} onClick={() => onMachine(m.name)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold text-[13px] active:scale-95 transition-all"
                style={{ background: down ? C.gold : "#EED8A8", color: down ? C.cream : C.danger }}>
                {down ? <><ZapOff className="w-4 h-4" /> {tri("Ripristina", "Zurück", "Restore", "Restaurar", "Rétablir", "بازگرداندن")}</> : <><ZapOff className="w-4 h-4" /> {tri("Fuori uso", "Störung", "Out of order", "Fuera de uso", "Panne", "خرابی")}</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cella / fermalievitazione */}
      <p className="text-xs font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: C.title }}><Snowflake className="w-4 h-4" /> {tri("Freddo & lievitazione", "Kälte & Gärung", "Cold & proofing", "Frío y fermentación", "Froid & pousse", "سرما و ور آمدن")}</p>
      <button data-testid="emg-cold-toggle" onClick={onCold}
        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-2 active:scale-98 transition-all text-left"
        style={{ background: shift.cold_down ? C.danger : C.surf, border: `2px solid ${shift.cold_down ? C.danger : C.border}`, color: shift.cold_down ? C.cream : C.dark }}>
        <Snowflake className="w-6 h-6 shrink-0" style={{ color: shift.cold_down ? C.cream : C.gold }} />
        <span className="flex-1">
          <span className="block font-extrabold text-[15px] leading-tight">{tri("Cella non funzionante stanotte", "Zelle heute Nacht defekt", "Cell not working tonight", "Cámara no funciona esta noche", "Chambre en panne cette nuit", "سردخانه امشب خراب")}</span>
          <span className="block text-[11px] leading-tight mt-0.5" style={{ color: shift.cold_down ? "#FBE7DA" : C.muted }}>{tri("Passa a lievitazione diretta a temp. ambiente", "Direkte Gärung bei Raumtemperatur", "Switch to direct room-temp leavening", "Fermentación directa a temp. ambiente", "Levée directe à température ambiante", "ور آمدن مستقیم دمای اتاق")}</span>
        </span>
        {shift.cold_down ? <Flame className="w-6 h-6 shrink-0" /> : null}
      </button>
      {cells.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {cells.map((c, i) => (
            <span key={i} className="text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: C.surf, border: `1px solid ${C.border}`, color: C.muted }}>❄️ {c.name}{c.temp_c != null ? ` ${c.temp_c}°` : ""}</span>
          ))}
        </div>
      )}

      {/* Basi & Pre-cotti disponibili */}
      <p className="text-xs font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: C.title }}><PackageCheck className="w-4 h-4" /> {tri("Basi & Pre-cotti in cella", "Basen & Vorgebacken", "Bases & Pre-baked", "Bases y Precocidos", "Bases & Précuits", "پایه‌ها و نیم‌پزها")}</p>
      <div className="mb-5" data-testid="emg-bases">
        {bases.length === 0 ? (
          <p className="text-[13px]" style={{ color: C.muted }}>{tri("Nessuna base o pre-cotto registrato. Aggiorna dalle Ricette del Giorno o a voce.", "Noch nichts registriert.", "Nothing registered yet.", "Nada registrado aún.", "Rien enregistré.", "چیزی ثبت نشده.")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {bases.map((b, i) => (
              <div key={i} className="rounded-2xl px-3 py-2.5" style={{ background: C.surf, border: `2px solid ${C.border}` }}>
                <span className="block font-mono-data font-extrabold" style={{ fontSize: "22px", color: C.title }}>{b.qty}{b.unit ? ` ${b.unit}` : ""}</span>
                <span className="block font-bold text-[13px] truncate" style={{ color: C.dark }}>{b.product}</span>
                <span className="block text-[10px] font-semibold" style={{ color: C.gold }}>{statusLabel(b.kind, tri)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note del turno */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5" style={{ color: C.title }}><AlertTriangle className="w-4 h-4" /> {tri("Note per il turno", "Schicht-Notizen", "Shift notes", "Notas del turno", "Notes de poste", "یادداشت شیفت")}</p>
        {(shift.shift_notes || []).length > 0 && (
          <button data-testid="emg-clear-notes" onClick={clearNotes} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: C.gold }}>
            <RotateCcw className="w-3.5 h-3.5" /> {tri("Nuovo turno", "Neue Schicht", "New shift", "Nuevo turno", "Nouveau poste", "شیفت جدید")}
          </button>
        )}
      </div>
      <div className="space-y-2" data-testid="emg-notes">
        {(shift.shift_notes || []).length === 0 ? (
          <p className="text-[13px]" style={{ color: C.muted }}>{tri("Nessuna nota. Tutto regolare.", "Keine Notizen. Alles ok.", "No notes. All good.", "Sin notas. Todo bien.", "Aucune note.", "یادداشتی نیست.")}</p>
        ) : (
          shift.shift_notes.map((n) => (
            <div key={n.id} className="rounded-2xl px-4 py-3" style={{ background: "#FBEEDD", border: `2px solid ${C.danger}` }}>
              <p className="text-[13.5px] leading-snug font-medium" style={{ color: C.dark }}>{n.text}</p>
              <p className="text-[10px] mt-1 font-semibold" style={{ color: C.danger }}>{fmtTime(n.at)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
