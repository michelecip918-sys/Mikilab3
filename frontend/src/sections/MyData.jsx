import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CalendarDays, BookOpen, FileText, MessageSquare, Clock, ChevronDown, Trash2, Loader2, Thermometer, Palmtree, Send, KeyRound, Copy, ShieldCheck } from "lucide-react";
import { plansArchiveApi, recipesApi, chatApi, operatorApi } from "@/lib/api";
import { getChats, removeChat } from "@/lib/chatHistory";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Archivio "I Miei Dati Salvati": Piani (archivio), Ricette (personali), Documenti & PDF, Chat AI.
export default function MyData({ onOpenTool }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [tab, setTab] = useState("piani");
  const [plans, setPlans] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    plansArchiveApi.list().then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
    recipesApi.list("personal").then((d) => setRecipes(Array.isArray(d) ? d : [])).catch(() => {});
    setChats(getChats());
  }, []);

  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; } };

  const TABS = [
    { id: "piani", Icon: CalendarDays, label: tri("Piani di Lavoro", "Arbeitspläne", "Work Plans"), n: plans.length },
    { id: "ricette", Icon: BookOpen, label: tri("Ricette", "Rezepte", "Recipes"), n: recipes.length },
    { id: "docs", Icon: FileText, label: tri("Documenti & PDF", "Dokumente & PDF", "Documents & PDF") },
    { id: "chat", Icon: MessageSquare, label: tri("Chat AI", "KI-Chat", "AI Chat"), n: chats.length },
  ];

  const deleteChat = (id) => { removeChat(id); setChats(getChats()); };

  const [absNote, setAbsNote] = useState("");
  const [absDates, setAbsDates] = useState("");
  const [absSending, setAbsSending] = useState("");
  const sendAbsence = async (kind) => {
    setAbsSending(kind);
    try {
      const r = await operatorApi.absence({ kind, note: absNote, dates: absDates });
      toast.success(tri(`Avviso di ${r.label} inviato al Capo ✔`, `${r.label}-Meldung an den Chef gesendet ✔`, `${r.label} notice sent to the Boss ✔`));
      setAbsNote(""); setAbsDates("");
    } catch {
      toast.error(tri("Accedi per inviare l'avviso al Capo.", "Melde dich an, um den Chef zu benachrichtigen.", "Sign in to notify the Boss."));
    } finally { setAbsSending(""); }
  };

  const isAdmin = user?.role === "admin";
  const [invites, setInvites] = useState([]);
  const [invBusy, setInvBusy] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  useEffect(() => {
    if (isAdmin) operatorApi.listInvites().then((r) => setInvites(r.invites || [])).catch(() => {});
  }, [isAdmin]);
  const genInvite = async () => {
    setInvBusy(true);
    try {
      await operatorApi.createInvite();
      const r = await operatorApi.listInvites();
      setInvites(r.invites || []);
      toast.success(tri("Nuovo codice operatore generato ✔", "Neuer Operator-Code erstellt ✔", "New operator code created ✔"));
    } catch { toast.error(tri("Solo il Capo può generare codici.", "Nur der Chef kann Codes erstellen.", "Only the Boss can create codes.")); }
    finally { setInvBusy(false); }
  };
  const genDelegation = async () => {
    setInvBusy(true);
    try {
      const r = await operatorApi.createDelegation();
      await operatorApi.listInvites().then((x) => setInvites(x.invites || []));
      toast.success(tri(`Delega 8h creata: ${r.code}`, `8h-Delegation erstellt: ${r.code}`, `8h delegation created: ${r.code}`));
    } catch { toast.error(tri("Solo il Capo può creare deleghe.", "Nur der Chef.", "Boss only.")); }
    finally { setInvBusy(false); }
  };
  const doRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeemBusy(true);
    try {
      await operatorApi.redeem(redeemCode.trim());
      toast.success(tri("Sei registrato come Operatore ✔ Ricarica per aggiornare.", "Als Operator registriert ✔", "Registered as Operator ✔"));
      setRedeemCode("");
    } catch (e) {
      const s = e?.response?.status;
      toast.error(s === 409 ? tri("Codice già utilizzato.", "Code bereits benutzt.", "Code already used.") : tri("Codice non valido.", "Ungültiger Code.", "Invalid code."));
    } finally { setRedeemBusy(false); }
  };

  const isOperator = user?.role === "operatore" || user?.role === "sostituto";
  const [opName, setOpName] = useState("");
  const [opDept, setOpDept] = useState("");
  const [opBusy, setOpBusy] = useState(false);
  useEffect(() => {
    if (isOperator) operatorApi.getProfile().then((p) => { setOpName(p.operator_name || ""); setOpDept(p.department || ""); }).catch(() => {});
  }, [isOperator]);
  const DEPTS = [["impasti", "Impasti"], ["forni", "Forni"], ["pasticceria", "Pasticceria"], ["laugen", "Laugen"], ["banco", "Banco (Lavori a Mano)"], ["pretzel", "Macchina / Pretzel"]];
  const saveOpProfile = async () => {
    setOpBusy(true);
    try {
      await operatorApi.saveProfile({ display_name: opName, department: opDept });
      toast.success(tri("Profilo operatore salvato ✔", "Operator-Profil gespeichert ✔", "Operator profile saved ✔"));
    } catch { toast.error(tri("Errore nel salvataggio.", "Speicherfehler.", "Save error.")); }
    finally { setOpBusy(false); }
  };

  return (
    <div data-testid="my-data" className="pb-4">
      <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8] mb-1">{tri("I Miei Dati Salvati", "Meine gespeicherten Daten", "My Saved Data")}</h2>
      <p className="text-sm text-[#7E8A93] mb-4">{tri("Tutto ciò che salvi, in un unico posto.", "Alles, was du speicherst, an einem Ort.", "Everything you save, in one place.")}</p>

      {/* Portale Operatori — token invito (Capo) / riscatto (Operatore) */}
      <div data-testid="operator-portal" className="mb-4 rounded-2xl border border-[#2A3B49] bg-white dark:bg-[#1B2A38] p-4 shadow-md">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#5E8CA8] mb-1 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> {isAdmin ? tri("Codici Operatori (Capo)", "Operator-Codes (Chef)", "Operator Codes (Boss)") : tri("Codice Operatore", "Operator-Code", "Operator Code")}</p>
        {isAdmin ? (
          <>
            <p className="text-[12px] text-[#7E8A93] mb-3">{tri("Genera codici d'invito univoci da dare ai tuoi operatori per la registrazione sicura.", "Erzeuge eindeutige Einladungscodes für deine Operatoren.", "Generate unique invite codes for your operators' secure sign-up.")}</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button data-testid="operator-gen-code" disabled={invBusy} onClick={genInvite} className="flex items-center justify-center gap-2 rounded-xl bg-[#3E9C93] text-white font-semibold py-2.5 active:scale-97 transition-all disabled:opacity-60">
                {invBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} {tri("Nuovo codice", "Neuer Code", "New code")}
              </button>
              <button data-testid="operator-gen-delega" disabled={invBusy} onClick={genDelegation} className="flex items-center justify-center gap-2 rounded-xl bg-[#5E8CA8] text-white font-semibold py-2.5 active:scale-97 transition-all disabled:opacity-60">
                <Clock className="w-4 h-4" /> {tri("Delega 8h", "Delegation 8h", "8h delegation")}
              </button>
            </div>
            <div className="space-y-1.5" data-testid="operator-code-list">
              {invites.length === 0 && <p className="text-[12px] text-[#7E8A93] text-center py-1">{tri("Nessun codice ancora.", "Noch keine Codes.", "No codes yet.")}</p>}
              {invites.slice(0, 12).map((iv) => (
                <div key={iv.code} className="flex items-center justify-between rounded-xl bg-[#e4eff8] dark:bg-[#0E1620] border border-[#2A3B49] px-3 py-2">
                  <span className="font-mono-data font-bold tracking-widest text-[#2B303B] dark:text-[#e4eff8]">{iv.code}{iv.kind === "delega" && <span className="ml-2 text-[9px] font-sans font-bold text-[#5E8CA8] align-middle">DELEGA 8h</span>}</span>
                  <span className="flex items-center gap-2">
                    {iv.used_by ? <span className="text-[10px] text-[#3E9C93] font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{iv.used_by_name || tri("Usato", "Benutzt", "Used")}</span> : <span className="text-[10px] text-[#7E8A93]">{tri("Libero", "Frei", "Free")}</span>}
                    <button data-testid={`operator-copy-${iv.code}`} onClick={() => { try { navigator.clipboard.writeText(iv.code); toast.success(tri("Copiato", "Kopiert", "Copied")); } catch { /* */ } }} className="text-[#5E8CA8]"><Copy className="w-4 h-4" /></button>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : user?.role === "operatore" ? (
          <p className="text-[13px] text-[#3E9C93] font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {tri("Sei registrato come Operatore di MikiLab.", "Du bist als MikiLab-Operator registriert.", "You are registered as a MikiLab Operator.")}</p>
        ) : (
          <>
            <p className="text-[12px] text-[#7E8A93] mb-3">{tri("Hai un codice dal Capo? Inseriscilo per attivare il tuo accesso da operatore.", "Code vom Chef? Gib ihn ein, um deinen Operator-Zugang zu aktivieren.", "Got a code from the Boss? Enter it to activate your operator access.")}</p>
            <div className="flex gap-2">
              <input data-testid="operator-redeem-input" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} placeholder="ES. A1B2C3D4" className="flex-1 rounded-xl bg-[#e4eff8] dark:bg-[#0E1620] border border-[#2A3B49] px-3 py-2 text-sm font-mono-data tracking-widest text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#3E9C93]" />
              <button data-testid="operator-redeem-btn" disabled={redeemBusy} onClick={doRedeem} className="rounded-xl bg-[#3E9C93] text-white font-semibold px-4 active:scale-97 transition-all disabled:opacity-60">{redeemBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : tri("Attiva", "Aktivieren", "Activate")}</button>
            </div>
          </>
        )}
      </div>

      {/* Onboarding Operatore — dati personali + reparto assegnato */}
      {isOperator && (
        <div data-testid="operator-onboarding" className="mb-4 rounded-2xl border border-[#3E9C93]/40 bg-white dark:bg-[#1B2A38] p-4 shadow-md">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3E9C93] mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {tri("Il Mio Profilo Operatore", "Mein Operator-Profil", "My Operator Profile")}</p>
          <p className="text-[12px] text-[#7E8A93] mb-3">{tri("Inserisci il tuo nome e il reparto: vedrai la tua postazione dedicata.", "Gib deinen Namen und die Abteilung an: du siehst deinen Bereich.", "Enter your name and department: you'll see your dedicated station.")}</p>
          <input data-testid="operator-name-input" value={opName} onChange={(e) => setOpName(e.target.value)} placeholder={tri("Il tuo nome", "Dein Name", "Your name")} className="w-full mb-2 rounded-xl bg-[#e4eff8] dark:bg-[#0E1620] border border-[#2A3B49] px-3 py-2 text-sm text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#3E9C93]" />
          <select data-testid="operator-dept-select" value={opDept} onChange={(e) => setOpDept(e.target.value)} className="w-full mb-3 rounded-xl bg-[#e4eff8] dark:bg-[#0E1620] border border-[#2A3B49] px-3 py-2 text-sm text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#3E9C93]">
            <option value="">{tri("Scegli il reparto…", "Abteilung wählen…", "Choose department…")}</option>
            {DEPTS.map(([id, lab]) => <option key={id} value={id}>{lab}</option>)}
          </select>
          <button data-testid="operator-save-profile" disabled={opBusy} onClick={saveOpProfile} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3E9C93] text-white font-semibold py-2.5 active:scale-97 transition-all disabled:opacity-60">
            {opBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Salva profilo", "Profil speichern", "Save profile")}
          </button>
          {opDept && <p className="text-[12px] text-[#3E9C93] font-semibold mt-2 text-center">{tri("Reparto assegnato:", "Zugewiesene Abteilung:", "Assigned department:")} {DEPTS.find((d) => d[0] === opDept)?.[1]}</p>}
        </div>
      )}

      {/* Modulo Assenze — avvisa il Capo (malattia/ferie) */}
      <div data-testid="absence-module" className="mb-4 rounded-2xl border border-[#2A3B49] bg-white dark:bg-[#1B2A38] p-4 shadow-md">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3E9C93] mb-1">{tri("Avvisa il Capo", "Chef benachrichtigen", "Notify the Boss")}</p>
        <p className="text-[12px] text-[#7E8A93] mb-3">{tri("Invia un avviso immediato di malattia o ferie: arriva direttamente al Capo.", "Sende sofort eine Krankheits- oder Urlaubsmeldung direkt an den Chef.", "Send an instant sickness or holiday notice straight to the Boss.")}</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input data-testid="absence-dates" value={absDates} onChange={(e) => setAbsDates(e.target.value)} placeholder={tri("Quando? (es. oggi, 12-15/06)", "Wann? (z. B. heute)", "When? (e.g. today)")} className="rounded-xl bg-[#e4eff8] dark:bg-[#0E1620] border border-[#2A3B49] px-3 py-2 text-sm text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#3E9C93]" />
          <input data-testid="absence-note" value={absNote} onChange={(e) => setAbsNote(e.target.value)} placeholder={tri("Nota (facoltativa)", "Notiz (optional)", "Note (optional)")} className="rounded-xl bg-[#e4eff8] dark:bg-[#0E1620] border border-[#2A3B49] px-3 py-2 text-sm text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#3E9C93]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="absence-malattia" disabled={!!absSending} onClick={() => sendAbsence("malattia")}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5E8CA8] text-white font-semibold py-2.5 active:scale-97 transition-all disabled:opacity-60">
            {absSending === "malattia" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Thermometer className="w-4 h-4" />} {tri("Malattia", "Krankheit", "Sick")}
          </button>
          <button data-testid="absence-ferie" disabled={!!absSending} onClick={() => sendAbsence("ferie")}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#3E9C93] text-white font-semibold py-2.5 active:scale-97 transition-all disabled:opacity-60">
            {absSending === "ferie" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palmtree className="w-4 h-4" />} {tri("Ferie", "Urlaub", "Holiday")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 bg-[#e4eff8] dark:bg-[#1B2A38] p-1.5 rounded-2xl mb-4 border border-[#2A3B49] dark:border-[#2A3B49]">
        {TABS.map(({ id, Icon, label, n }) => (
          <button key={id} data-testid={`mydata-tab-${id}`} onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 py-2 rounded-2xl shadow-md border border-amber-900/40 text-[11px] font-semibold transition-all ${tab === id ? "bg-[#3E9C93] text-white shadow" : "text-[#7E8A93]"}`}>
            <Icon className="w-4 h-4" />
            <span className="leading-tight text-center">{label}{n != null ? ` (${n})` : ""}</span>
          </button>
        ))}
      </div>

      {tab === "piani" && (
        <div className="space-y-2" data-testid="mydata-piani">
          {plans.length === 0 ? <Empty text={tri("Nessun piano salvato. Salvane uno dal Piano Settimanale o dal Piano IA.", "Keine Pläne. Speichere einen im Wochenplan oder KI-Plan.", "No saved plans. Save one from the Weekly or AI plan.")} /> :
            plans.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.kind === "capo" ? "bg-[#3E9C93]/15 text-[#3E9C93] dark:text-[#8FB0C2]" : "bg-[#3E9C93]/15 text-[#3E9C93] dark:text-[#a9d2ec]"}`}>{p.kind === "capo" ? tri("Piano IA", "KI-Plan", "AI Plan") : tri("Settimanale", "Woche", "Weekly")}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{p.name}</p><p className="text-[11px] text-[#7E8A93] flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(p.created_at)}</p></div>
                <button data-testid={`mydata-open-plan-${p.id}`} onClick={() => onOpenTool && onOpenTool(p.kind === "capo" ? "pianoai" : "settimana")} className="text-xs font-semibold text-[#3E9C93]">{tri("Apri", "Öffnen", "Open")}</button>
              </div>
            ))}
        </div>
      )}

      {tab === "ricette" && (
        <div className="space-y-2" data-testid="mydata-ricette">
          {recipes.length === 0 ? <Empty text={tri("Nessuna ricetta personale. Aggiungile da Ricette → Le Mie Ricette.", "Keine eigenen Rezepte. Füge sie unter Rezepte → Meine Rezepte hinzu.", "No personal recipes. Add them under Recipes → My Recipes.")} /> :
            recipes.map((r) => (
              <div key={r.id} className="rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-3">
                <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{r.name}</p>
                {r.category && <p className="text-[11px] text-[#7E8A93]">{r.category}</p>}
              </div>
            ))}
        </div>
      )}

      {tab === "docs" && (
        <div data-testid="mydata-docs">
          <Empty text={tri("I PDF (piani, etichette UE, liste spesa) si generano al volo dagli strumenti con il tasto Stampa/PDF. Apri un piano o una ricetta e usa 'Stampa'.", "PDFs (Pläne, EU-Etiketten, Einkaufslisten) werden in den Werkzeugen mit 'Drucken/PDF' erzeugt.", "PDFs (plans, EU labels, shopping lists) are generated on the fly from the tools with the Print/PDF button.")} />
        </div>
      )}

      {tab === "chat" && (
        <div data-testid="mydata-chat" className="space-y-2">
          {chats.length === 0 ? (
            <Empty text={tri("Nessuna conversazione. Parla con 'Chiedi al Maestro' o con Mohammadreza nel Tuo Laboratorio: lo storico apparirà qui.", "Noch keine Unterhaltung. Sprich mit 'Frag den Meister' oder mit Mohammadreza in deinem Labor: der Verlauf erscheint hier.", "No conversations yet. Chat with 'Ask the Master' or with Mohammadreza in Your Lab: the history will appear here.")} />
          ) : (
            chats.map((c) => (
              <ChatCard key={c.id} chat={c} fmt={fmt} tri={tri} onDelete={() => deleteChat(c.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ChatCard({ chat, fmt, tri, onDelete }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(null);
  const [loading, setLoading] = useState(false);

  const label = chat.kind === "mohammed" ? "Mohammadreza" : tri("Chiedi al Maestro", "Frag den Meister", "Ask the Master");

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && msgs === null) {
      setLoading(true);
      try { const d = await chatApi.history(chat.id); setMsgs(Array.isArray(d) ? d : []); }
      catch { setMsgs([]); }
      finally { setLoading(false); }
    }
  };

  return (
    <div data-testid={`mydata-chat-${chat.id}`} className="rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="w-9 h-9 rounded-2xl shadow-md border border-amber-900/40 bg-[#3E9C93]/15 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-[#3E9C93]" /></div>
        <button data-testid={`mydata-chat-toggle-${chat.id}`} onClick={toggle} className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{label}</p>
          <p className="text-[11px] text-[#7E8A93] flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(chat.ts)}</p>
        </button>
        <button data-testid={`mydata-chat-delete-${chat.id}`} onClick={onDelete} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#1B2A38] flex items-center justify-center text-[#3E9C93] shrink-0"><Trash2 className="w-4 h-4" /></button>
        <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7E8A93] shrink-0"><ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-[#7E8A93] text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" />{tri("Carico…", "Lädt…", "Loading…")}</div>
          ) : (msgs && msgs.length > 0) ? (
            msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`markdown-body max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#3E9C93] text-white whitespace-pre-wrap" : "bg-[#e4eff8] dark:bg-[#1B2A38] text-[#2B303B] dark:text-[#e4eff8]"}`}>
                  {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#7E8A93] py-2">{tri("Conversazione vuota o non più disponibile.", "Leere oder nicht mehr verfügbare Unterhaltung.", "Empty or no longer available conversation.")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#e4eff8] dark:bg-[#1B2A38] border border-dashed border-[#2A3B49] dark:border-[#2A3B49] p-4 text-sm text-[#7E8A93] leading-snug">{text}</div>;
}
