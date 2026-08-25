import { useState, useEffect } from "react";
import { CalendarDays, BookOpen, FileText, MessageSquare, Clock } from "lucide-react";
import { plansArchiveApi, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

// Archivio "I Miei Dati Salvati": Piani (archivio), Ricette (personali), Documenti & PDF.
export default function MyData({ onOpenTool }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [tab, setTab] = useState("piani");
  const [plans, setPlans] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    plansArchiveApi.list().then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
    recipesApi.list("personal").then((d) => setRecipes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; } };

  const TABS = [
    { id: "piani", Icon: CalendarDays, label: tri("Piani di Lavoro", "Arbeitspläne", "Work Plans"), n: plans.length },
    { id: "ricette", Icon: BookOpen, label: tri("Ricette", "Rezepte", "Recipes"), n: recipes.length },
    { id: "docs", Icon: FileText, label: tri("Documenti & PDF", "Dokumente & PDF", "Documents & PDF") },
    { id: "chat", Icon: MessageSquare, label: tri("Chat AI", "KI-Chat", "AI Chat") },
  ];

  return (
    <div data-testid="my-data" className="pb-4">
      <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#EAF0EC] mb-1">{tri("I Miei Dati Salvati", "Meine gespeicherten Daten", "My Saved Data")}</h2>
      <p className="text-sm text-[#7E8A93] mb-4">{tri("Tutto ciò che salvi, in un unico posto.", "Alles, was du speicherst, an einem Ort.", "Everything you save, in one place.")}</p>

      <div className="grid grid-cols-4 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-4 border border-[#D7E1DB] dark:border-[#38424B]">
        {TABS.map(({ id, Icon, label, n }) => (
          <button key={id} data-testid={`mydata-tab-${id}`} onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${tab === id ? "bg-[#5E8B7E] text-white shadow" : "text-[#7E8A93]"}`}>
            <Icon className="w-4 h-4" />
            <span className="leading-tight text-center">{label}{n != null ? ` (${n})` : ""}</span>
          </button>
        ))}
      </div>

      {tab === "piani" && (
        <div className="space-y-2" data-testid="mydata-piani">
          {plans.length === 0 ? <Empty text={tri("Nessun piano salvato. Salvane uno dal Piano Settimanale o dal Piano IA.", "Keine Pläne. Speichere einen im Wochenplan oder KI-Plan.", "No saved plans. Save one from the Weekly or AI plan.")} /> :
            plans.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.kind === "capo" ? "bg-[#6E8CA0]/15 text-[#33564E] dark:text-[#8FB0C2]" : "bg-[#6B8E62]/15 text-[#4d6b45] dark:text-[#9ec48f]"}`}>{p.kind === "capo" ? tri("Piano IA", "KI-Plan", "AI Plan") : tri("Settimanale", "Woche", "Weekly")}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{p.name}</p><p className="text-[11px] text-[#7E8A93] flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(p.created_at)}</p></div>
                <button data-testid={`mydata-open-plan-${p.id}`} onClick={() => onOpenTool && onOpenTool(p.kind === "capo" ? "pianoai" : "settimana")} className="text-xs font-semibold text-[#5E8B7E]">{tri("Apri", "Öffnen", "Open")}</button>
              </div>
            ))}
        </div>
      )}

      {tab === "ricette" && (
        <div className="space-y-2" data-testid="mydata-ricette">
          {recipes.length === 0 ? <Empty text={tri("Nessuna ricetta personale. Aggiungile da Ricette → Le Mie Ricette.", "Keine eigenen Rezepte. Füge sie unter Rezepte → Meine Rezepte hinzu.", "No personal recipes. Add them under Recipes → My Recipes.")} /> :
            recipes.map((r) => (
              <div key={r.id} className="rounded-xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-3">
                <p className="text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{r.name}</p>
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
        <div data-testid="mydata-chat">
          <Empty text={tri("Lo storico delle chat con l'assistente arriverà a breve.", "Der Chat-Verlauf mit dem Assistenten kommt bald.", "AI chat history is coming soon.")} />
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-xl bg-[#EAF0EC] dark:bg-[#2A323A] border border-dashed border-[#D7E1DB] dark:border-[#38424B] p-4 text-sm text-[#7E8A93] leading-snug">{text}</div>;
}
