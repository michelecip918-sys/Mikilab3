import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CalendarDays, BookOpen, FileText, MessageSquare, Clock, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { plansArchiveApi, recipesApi, chatApi } from "@/lib/api";
import { getChats, removeChat } from "@/lib/chatHistory";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

// Archivio "I Miei Dati Salvati": Piani (archivio), Ricette (personali), Documenti & PDF, Chat AI.
export default function MyData({ onOpenTool }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));
  const [tab, setTab] = useState("piani");
  const [plans, setPlans] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    plansArchiveApi.list().then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
    recipesApi.list("personal").then((d) => setRecipes(Array.isArray(d) ? d : [])).catch(() => {});
    setChats(getChats());
  }, []);

  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; } };

  const TABS = [
    { id: "piani", Icon: CalendarDays, label: tri("Piani di Lavoro", "Arbeitspläne", "Work Plans"), n: plans.length },
    { id: "ricette", Icon: BookOpen, label: tri("Ricette", "Rezepte", "Recipes"), n: recipes.length },
    { id: "docs", Icon: FileText, label: tri("Documenti & PDF", "Dokumente & PDF", "Documents & PDF") },
    { id: "chat", Icon: MessageSquare, label: tri("Chat AI", "KI-Chat", "AI Chat"), n: chats.length },
  ];

  const deleteChat = (id) => { removeChat(id); setChats(getChats()); };

  return (
    <div data-testid="my-data" className="pb-4">
      <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8] mb-1">{tri("I Miei Dati Salvati", "Meine gespeicherten Daten", "My Saved Data")}</h2>
      <p className="text-sm text-[#7E8A93] mb-4">{tri("Tutto ciò che salvi, in un unico posto.", "Alles, was du speicherst, an einem Ort.", "Everything you save, in one place.")}</p>

      <div className="grid grid-cols-4 gap-1.5 bg-[#e4eff8] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-4 border border-[#d5e4f0] dark:border-[#38424B]">
        {TABS.map(({ id, Icon, label, n }) => (
          <button key={id} data-testid={`mydata-tab-${id}`} onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${tab === id ? "bg-[#3f7cac] text-white shadow" : "text-[#7E8A93]"}`}>
            <Icon className="w-4 h-4" />
            <span className="leading-tight text-center">{label}{n != null ? ` (${n})` : ""}</span>
          </button>
        ))}
      </div>

      {tab === "piani" && (
        <div className="space-y-2" data-testid="mydata-piani">
          {plans.length === 0 ? <Empty text={tri("Nessun piano salvato. Salvane uno dal Piano Settimanale o dal Piano IA.", "Keine Pläne. Speichere einen im Wochenplan oder KI-Plan.", "No saved plans. Save one from the Weekly or AI plan.")} /> :
            plans.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.kind === "capo" ? "bg-[#6E8CA0]/15 text-[#234b6e] dark:text-[#8FB0C2]" : "bg-[#5aa0cf]/15 text-[#2e6690] dark:text-[#a9d2ec]"}`}>{p.kind === "capo" ? tri("Piano IA", "KI-Plan", "AI Plan") : tri("Settimanale", "Woche", "Weekly")}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{p.name}</p><p className="text-[11px] text-[#7E8A93] flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(p.created_at)}</p></div>
                <button data-testid={`mydata-open-plan-${p.id}`} onClick={() => onOpenTool && onOpenTool(p.kind === "capo" ? "pianoai" : "settimana")} className="text-xs font-semibold text-[#3f7cac]">{tri("Apri", "Öffnen", "Open")}</button>
              </div>
            ))}
        </div>
      )}

      {tab === "ricette" && (
        <div className="space-y-2" data-testid="mydata-ricette">
          {recipes.length === 0 ? <Empty text={tri("Nessuna ricetta personale. Aggiungile da Ricette → Le Mie Ricette.", "Keine eigenen Rezepte. Füge sie unter Rezepte → Meine Rezepte hinzu.", "No personal recipes. Add them under Recipes → My Recipes.")} /> :
            recipes.map((r) => (
              <div key={r.id} className="rounded-xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-3">
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
    <div data-testid={`mydata-chat-${chat.id}`} className="rounded-xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="w-9 h-9 rounded-xl bg-[#3f7cac]/15 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-[#3f7cac]" /></div>
        <button data-testid={`mydata-chat-toggle-${chat.id}`} onClick={toggle} className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{label}</p>
          <p className="text-[11px] text-[#7E8A93] flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(chat.ts)}</p>
        </button>
        <button data-testid={`mydata-chat-delete-${chat.id}`} onClick={onDelete} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center text-[#C0574D] shrink-0"><Trash2 className="w-4 h-4" /></button>
        <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7E8A93] shrink-0"><ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-[#7E8A93] text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" />{tri("Carico…", "Lädt…", "Loading…")}</div>
          ) : (msgs && msgs.length > 0) ? (
            msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`markdown-body max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#3f7cac] text-white whitespace-pre-wrap" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8]"}`}>
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
  return <div className="rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] border border-dashed border-[#d5e4f0] dark:border-[#38424B] p-4 text-sm text-[#7E8A93] leading-snug">{text}</div>;
}
