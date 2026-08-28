import { useState, useEffect, useCallback } from "react";
import { Thermometer, Save, Trash2, Sparkles, Droplet, CheckCircle2, Flame, Snowflake, History, LogIn, Scale, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { doughSessionsApi, recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// FASE 2 — Diario Impasti & Algoritmo "Giorno Dopo".
// Salva le sessioni (temp impasto/ambiente/umidità/acqua) e propone la correzione
// dell'acqua per centrare oggi la temperatura target. Consiglio deterministico + IA.

export default function DoughLog() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { user, setAuthOpen } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ recipe_id: "", recipe_name: "", target_temp_c: "", dough_temp_c: "", room_temp_c: "", humidity: "", water_temp_c: "", note: "" });
  const [dayAfter, setDayAfter] = useState(null);
  const [advice, setAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    const list = await doughSessionsApi.list();
    setSessions(list);
  }, [user]);

  useEffect(() => {
    Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal")]).then(([m, p]) => setRecipes([...(m || []), ...(p || [])]));
  }, []);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const runDayAfter = useCallback(async () => {
    if (!user || !form.recipe_name) { setDayAfter(null); return; }
    const r = await doughSessionsApi.dayAfter({
      recipe_id: form.recipe_id || "", recipe_name: form.recipe_name,
      today_room_c: form.room_temp_c !== "" ? Number(form.room_temp_c) : null,
      today_humidity: form.humidity !== "" ? Number(form.humidity) : null, lang,
    }).catch(() => null);
    setDayAfter(r);
    setAdvice("");
  }, [user, form.recipe_name, form.recipe_id, form.room_temp_c, form.humidity, lang]);

  useEffect(() => { runDayAfter(); }, [runDayAfter]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickRecipe = (id) => {
    const rec = recipes.find((x) => x.id === id);
    setForm((f) => ({ ...f, recipe_id: id, recipe_name: rec ? rLoc(rec, "name", lang) : f.recipe_name, target_temp_c: rec && rec.water_temp_c ? f.target_temp_c : f.target_temp_c }));
  };

  const save = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!form.recipe_name.trim() || form.dough_temp_c === "") { toast.error(tri("Inserisci ricetta e temperatura impasto", "Rezept und Teigtemperatur angeben", "Enter recipe and dough temperature")); return; }
    setSaving(true);
    try {
      await doughSessionsApi.create({
        recipe_id: form.recipe_id || "", recipe_name: form.recipe_name.trim(),
        target_temp_c: form.target_temp_c !== "" ? Number(form.target_temp_c) : null,
        dough_temp_c: Number(form.dough_temp_c),
        room_temp_c: form.room_temp_c !== "" ? Number(form.room_temp_c) : null,
        humidity: form.humidity !== "" ? Number(form.humidity) : null,
        water_temp_c: form.water_temp_c !== "" ? Number(form.water_temp_c) : null,
        note: form.note.trim(),
      });
      toast.success(tri("Sessione salvata", "Sitzung gespeichert", "Session saved"));
      setForm((f) => ({ ...f, dough_temp_c: "", note: "" }));
      await loadSessions();
      await runDayAfter();
    } catch { toast.error(tri("Errore nel salvataggio", "Speichern fehlgeschlagen", "Save failed")); }
    setSaving(false);
  };

  const remove = async (id) => {
    try { await doughSessionsApi.remove(id); setSessions((s) => s.filter((x) => x.id !== id)); }
    catch { toast.error(tri("Errore", "Fehler", "Error")); }
  };

  const getAdvice = async () => {
    if (!user) { setAuthOpen(true); return; }
    setLoadingAdvice(true);
    try {
      const r = await doughSessionsApi.aiAdvice({
        recipe_id: form.recipe_id || "", recipe_name: form.recipe_name,
        today_room_c: form.room_temp_c !== "" ? Number(form.room_temp_c) : null,
        today_humidity: form.humidity !== "" ? Number(form.humidity) : null, lang,
      });
      setAdvice(r.advice || tri("Nessun consiglio disponibile", "Kein Rat verfügbar", "No advice available"));
    } catch { toast.error(tri("Errore IA", "KI-Fehler", "AI error")); }
    setLoadingAdvice(false);
  };

  const inp = "w-full bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#8C4A27]";
  const VERDICT = {
    on_target: { color: "#B45309", Icon: CheckCircle2, label: tri("Nel target 👌", "Im Ziel 👌", "On target 👌") },
    too_warm: { color: "#C0574D", Icon: Flame, label: tri("Troppo caldo", "Zu warm", "Too warm") },
    too_cold: { color: "#3F7CAC", Icon: Snowflake, label: tri("Troppo freddo", "Zu kalt", "Too cold") },
    unknown: { color: "#7E8A93", Icon: Thermometer, label: tri("Dati incompleti", "Unvollständig", "Incomplete data") },
  };

  return (
    <div className="pb-40" data-testid="doughlog">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#8C4A27] flex items-center justify-center"><Thermometer className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Diario Impasti", "Teig-Tagebuch", "Dough Log")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Temperature + algoritmo Giorno Dopo", "Temperaturen + Tag-danach-Algorithmus", "Temperatures + Day-After algorithm")}</p>
        </div>
      </div>

      {!user && (
        <button data-testid="doughlog-login" onClick={() => setAuthOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#3F7CAC] text-white font-semibold py-3 rounded-2xl mb-4">
          <LogIn className="w-5 h-5" /> {tri("Accedi per salvare le sessioni", "Anmelden, um Sitzungen zu speichern", "Sign in to save sessions")}
        </button>
      )}

      {/* Form nuova sessione */}
      <div className="bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-4 mb-4 space-y-3">
        <p className="text-xs font-bold uppercase text-[#8C4A27]">{tri("Nuova sessione impasto", "Neue Teig-Sitzung", "New dough session")}</p>
        <select data-testid="doughlog-recipe" value={form.recipe_id} onChange={(e) => pickRecipe(e.target.value)} className={inp}>
          <option value="">{tri("— Scegli ricetta (o scrivi sotto) —", "— Rezept wählen (oder unten tippen) —", "— Pick recipe (or type below) —")}</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{rLoc(r, "name", lang)}</option>)}
        </select>
        <input data-testid="doughlog-name" value={form.recipe_name} onChange={(e) => setForm((f) => ({ ...f, recipe_name: e.target.value, recipe_id: "" }))} placeholder={tri("Nome impasto", "Teig-Name", "Dough name")} className={inp} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-[#7E8A93]">{tri("Temp. target impasto °C", "Ziel-Teigtemp. °C", "Target dough temp °C")}<input data-testid="doughlog-target" type="number" step="0.1" value={form.target_temp_c} onChange={(e) => setForm((f) => ({ ...f, target_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
          <label className="text-[11px] text-[#7E8A93]">{tri("Temp. FINALE impasto °C", "END-Teigtemp. °C", "FINAL dough temp °C")}<input data-testid="doughlog-dough" type="number" step="0.1" value={form.dough_temp_c} onChange={(e) => setForm((f) => ({ ...f, dough_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
          <label className="text-[11px] text-[#7E8A93]">{tri("Temp. ambiente °C", "Raumtemp. °C", "Room temp °C")}<input data-testid="doughlog-room" type="number" step="0.1" value={form.room_temp_c} onChange={(e) => setForm((f) => ({ ...f, room_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
          <label className="text-[11px] text-[#7E8A93]">{tri("Umidità %", "Feuchte %", "Humidity %")}<input data-testid="doughlog-hum" type="number" step="1" value={form.humidity} onChange={(e) => setForm((f) => ({ ...f, humidity: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
          <label className="text-[11px] text-[#7E8A93]">{tri("Temp. acqua °C", "Wassertemp. °C", "Water temp °C")}<input data-testid="doughlog-water" type="number" step="0.1" value={form.water_temp_c} onChange={(e) => setForm((f) => ({ ...f, water_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
        </div>
        <input data-testid="doughlog-note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder={tri("Note (facoltative)", "Notiz (optional)", "Note (optional)")} className={inp} />
        <button data-testid="doughlog-save" onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#8C4A27] hover:bg-[#336a94] disabled:opacity-50 text-white font-bold py-3 rounded-2xl active:scale-98"><Save className="w-5 h-5" /> {saving ? tri("Salvataggio…", "Speichern…", "Saving…") : tri("Salva sessione", "Sitzung speichern", "Save session")}</button>
      </div>

      {/* Giorno Dopo */}
      {dayAfter && dayAfter.has_history && dayAfter.analysis && (() => {
        const a = dayAfter.analysis; const v = VERDICT[a.verdict] || VERDICT.unknown; const V = v.Icon;
        return (
          <div className="rounded-2xl p-4 mb-4 border" style={{ background: v.color + "1A", borderColor: v.color + "55" }} data-testid="doughlog-dayafter">
            <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: v.color }}><V className="w-4 h-4" /> {tri("Giorno Dopo", "Tag danach", "Day After")}</div>
            <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] mt-2" data-testid="doughlog-verdict">{v.label}{a.delta !== null && a.verdict !== "on_target" && ` · ${a.delta > 0 ? "+" : ""}${a.delta}°C`}</p>
            <p className="text-[12px] text-[#7E8A93]">{tri("Ieri", "Gestern", "Yesterday")}: {dayAfter.last.dough_temp_c}°C (target {dayAfter.last.target_temp_c ?? "?"}°C), {tri("acqua", "Wasser", "water")} {dayAfter.last.water_temp_c ?? "?"}°C</p>
            {a.suggested_water_c !== null && (
              <div className="flex items-center gap-2 mt-2 bg-[#3F7CAC]/10 border border-[#3F7CAC]/30 rounded-xl px-3 py-2">
                <Droplet className="w-4 h-4 text-[#3F7CAC]" />
                <p className="text-sm text-[#2B303B] dark:text-[#e4eff8]">{tri("Oggi usa acqua a", "Heute Wasser mit", "Today use water at")} <b data-testid="doughlog-suggest-water" className="font-mono-data text-[#3F7CAC]">{a.suggested_water_c}°C</b></p>
              </div>
            )}
            <button data-testid="doughlog-ai" onClick={getAdvice} disabled={loadingAdvice} className="mt-3 w-full flex items-center justify-center gap-2 bg-[#8C4A27] text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 active:scale-98"><Sparkles className="w-4 h-4" /> {loadingAdvice ? tri("Chiedo al Maestro…", "Frage den Meister…", "Asking the Master…") : tri("Consiglio IA del Maestro", "KI-Rat des Meisters", "Master's AI advice")}</button>
            {advice && <p data-testid="doughlog-advice" className="text-sm text-[#2B303B] dark:text-[#e4eff8] mt-3 whitespace-pre-line bg-white/60 dark:bg-[#1F252B]/60 rounded-xl p-3">{advice}</p>}
          </div>
        );
      })()}

      {/* Grafico andamento temperature (Giorno Dopo trend) */}
      {(() => {
        const withTemp = [...sessions].filter((s) => s.dough_temp_c != null).reverse().slice(-8);
        if (withTemp.length < 2) return null;
        const data = withTemp.map((s, i) => ({
          name: s.date ? s.date.slice(5) : String(i + 1),
          impasto: s.dough_temp_c,
          target: s.target_temp_c != null ? s.target_temp_c : null,
        }));
        return (
          <div className="bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-4 mb-4" data-testid="doughlog-chart">
            <p className="text-xs font-bold uppercase text-[#8C4A27] mb-2 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {tri("Andamento temperatura impasto", "Verlauf Teigtemperatur", "Dough temperature trend")}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6D8C3" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7E8A93" }} />
                <YAxis tick={{ fontSize: 10, fill: "#7E8A93" }} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(v) => `${v}°C`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="impasto" name={tri("Impasto", "Teig", "Dough")} stroke="#C0574D" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#B45309" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Storico */}
      {sessions.length > 0 && (
        <div data-testid="doughlog-history">
          <p className="text-xs font-bold uppercase text-[#7E8A93] mb-2 flex items-center gap-1"><History className="w-3.5 h-3.5" /> {tri("Storico sessioni", "Verlauf", "History")}</p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} data-testid={`doughlog-item-${s.id}`} className="flex items-center justify-between bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] flex items-center gap-1.5">
                    {s.recipe_name}
                    {s.source === "pesata" && <span data-testid={`doughlog-badge-${s.id}`} className="inline-flex items-center gap-0.5 bg-[#8C4A27]/15 text-[#8C4A27] text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"><Scale className="w-2.5 h-2.5" /> {tri("da Pesata", "aus Wiegen", "from Weighing")}</span>}
                  </p>
                  <p className="text-[11px] text-[#7E8A93] font-mono-data">{s.date} · {tri("impasto", "Teig", "dough")} {s.dough_temp_c}°C{s.target_temp_c != null ? ` / target ${s.target_temp_c}°C` : ""}{s.water_temp_c != null ? ` · ${tri("acqua", "Wasser", "water")} ${s.water_temp_c}°C` : ""}</p>
                </div>
                <button data-testid={`doughlog-remove-${s.id}`} onClick={() => remove(s.id)} className="text-[#7E8A93] hover:text-[#C0574D] shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
