import { useEffect, useState, useCallback } from "react";
import { GraduationCap, Volume2, Save, Loader2, Pencil } from "lucide-react";
import { apprenticeApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";

// Card "Sitor Apprendista": mostra le due info pratiche (pezzi per teglia + come formare).
// Il Capo (canEdit) le scrive UNA VOLTA. Sitor le può leggere a voce. Non tocca ingredienti/dosi.
export default function ApprenticeCard({ recipeId, canEdit = false, autoSpeak = false }) {
  const { tri, lang } = useLang();
  const [info, setInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pieces_per_tray: "", tray_format: "", shaping_note: "" });

  const load = useCallback(() => {
    if (!recipeId) return;
    apprenticeApi.get(recipeId).then((d) => {
      setInfo(d);
      setForm({ pieces_per_tray: d.pieces_per_tray || "", tray_format: d.tray_format || "", shaping_note: d.shaping_note || "" });
      if (autoSpeak && d.has_info && d.spoken) { try { playTTS(d.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
    });
  }, [recipeId, autoSpeak, lang]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await apprenticeApi.set(recipeId, form); setEditing(false); load(); } finally { setSaving(false); }
  };

  if (!info) return null;
  const empty = !info.has_info;
  if (empty && !canEdit) return null; // apprendista: se il Capo non ha ancora scritto, nulla da mostrare

  return (
    <div data-testid={`apprentice-card-${recipeId}`} className="rounded-xl border border-[#7E9A82]/40 bg-[#7E9A82]/8 p-3">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="w-4 h-4 text-[#7E9A82]" />
        <span className="text-[11px] font-black uppercase tracking-widest text-[#7E9A82]">{tri("Sitor Apprendista", "Sitor Lehrling", "Sitor Apprentice", "Sitor Aprendiz", "Sitor Apprenti", "سیتور کارآموز")}</span>
        {info.has_info && info.spoken && (
          <button data-testid={`apprentice-speak-${recipeId}`} onClick={() => { try { playTTS(info.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }} className="ml-auto p-1 rounded-lg text-[#7E9A82] hover:bg-[#7E9A82]/15" title={tri("Ascolta", "Anhören", "Listen", "Escuchar", "Écouter", "بشنو")}>
            <Volume2 className="w-4 h-4" />
          </button>
        )}
        {canEdit && !editing && (
          <button data-testid={`apprentice-edit-${recipeId}`} onClick={() => setEditing(true)} className={`p-1 rounded-lg text-[#D97736] hover:bg-[#D97736]/15 ${info.has_info && info.spoken ? "" : "ml-auto"}`} title={tri("Modifica", "Bearbeiten", "Edit", "Editar", "Modifier", "ویرایش")}>
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {!editing ? (
        info.has_info ? (
          <div className="space-y-1.5">
            {info.pieces_per_tray ? (
              <p className="text-sm text-[#2B303B] dark:text-[#e4eff8]"><span className="text-[#7E8A93]">{tri("Per teglia/formato:", "Pro Blech:", "Per tray:", "Por bandeja:", "Par plaque :", "در هر سینی:")}</span> <b>{info.pieces_per_tray}{info.tray_format ? ` · ${info.tray_format}` : ""}</b></p>
            ) : null}
            {info.shaping_note ? (
              <p className="text-sm text-[#2B303B] dark:text-[#e4eff8] leading-relaxed"><span className="text-[#7E8A93]">{tri("Come formare:", "Formen:", "Shaping:", "Cómo formar:", "Façonnage :", "شکل‌دهی:")}</span> {info.shaping_note}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-[#7E8A93]">{tri("Nessuna istruzione pratica ancora. Scrivi tu quanti pezzi entrano in una teglia e come si formano.", "Noch keine Angaben.", "No practical instructions yet.", "Aún sin instrucciones.", "Aucune instruction pour le moment.", "هنوز دستوری نیست.")}</p>
        )
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input data-testid={`apprentice-pieces-${recipeId}`} value={form.pieces_per_tray} onChange={(e) => setForm((f) => ({ ...f, pieces_per_tray: e.target.value }))} placeholder={tri("Pezzi (es. 12)", "Stück", "Pieces", "Piezas", "Pièces", "تعداد")} className="rounded-lg bg-white dark:bg-[#0b0f19] border border-[#7E9A82]/40 px-2.5 py-1.5 text-sm text-[#2B303B] dark:text-white" />
            <input data-testid={`apprentice-format-${recipeId}`} value={form.tray_format} onChange={(e) => setForm((f) => ({ ...f, tray_format: e.target.value }))} placeholder={tri("Formato teglia", "Blechformat", "Tray format", "Formato", "Format plaque", "قالب سینی")} className="rounded-lg bg-white dark:bg-[#0b0f19] border border-[#7E9A82]/40 px-2.5 py-1.5 text-sm text-[#2B303B] dark:text-white" />
          </div>
          <textarea data-testid={`apprentice-shaping-${recipeId}`} value={form.shaping_note} onChange={(e) => setForm((f) => ({ ...f, shaping_note: e.target.value }))} rows={3} placeholder={tri("Come formare/piegare i pezzi…", "Wie formen…", "How to shape…", "Cómo formar…", "Comment façonner…", "چگونه شکل دهیم…")} className="w-full rounded-lg bg-white dark:bg-[#0b0f19] border border-[#7E9A82]/40 px-2.5 py-1.5 text-sm text-[#2B303B] dark:text-white" />
          <div className="flex gap-2">
            <button data-testid={`apprentice-save-${recipeId}`} onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#7E9A82] text-white text-xs font-bold px-3 py-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {tri("Salva", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs font-bold text-[#7E8A93] px-2">{tri("Annulla", "Abbrechen", "Cancel", "Cancelar", "Annuler", "لغو")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
