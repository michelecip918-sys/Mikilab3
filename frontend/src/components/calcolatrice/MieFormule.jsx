// V127 — Le mie formule: restano solo in questo dispositivo (localStorage «mikilab_formule»), entrano nella Valigia.
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, Copy, Share2, Calculator } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { LS } from "@/lib/sitorTools";
import { STILI, calcola, L, fmtG, fmtP, fmtGiorno } from "@/lib/fornaio";

export const KEY_FORMULE = "mikilab_formule";
export const MAX_FORMULE = 60;
export function leggiFormule() {
  const x = LS.get(KEY_FORMULE, []);
  return Array.isArray(x) ? x.filter((y) => y && y.id && y.f && typeof y.f === "object").slice(0, MAX_FORMULE) : [];
}
export function scriviFormule(list) { LS.set(KEY_FORMULE, list.slice(0, MAX_FORMULE)); }

function Voce({ item, lang, onApri, onCondividi, onRinomina, onDuplica, onElimina }) {
  const tri = mkTri(lang);
  const [edit, setEdit] = useState(false);
  const [nome, setNome] = useState(item.name || "");
  const [sicuro, setSicuro] = useState(false);
  let info = "";
  try {
    const r = calcola(item.f);
    info = `${fmtG(r.impasto, lang)} · ${tri("acqua", "Wasser", "water")} ${fmtP(r.idrReale, lang, 0)} · ${tri("sale", "Salz", "salt")} ${fmtP(r.salePct, lang, 1)}`;
  } catch { info = ""; }
  const st = STILI[item.f.st] || STILI.libero;
  return (
    <li data-testid={`formula-${item.id}`} className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
      {edit ? (
        <div className="flex gap-2">
          <input value={nome} onChange={(e) => setNome(e.target.value.slice(0, 60))} className="flex-1 min-w-0 text-[14px] bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary" />
          <button type="button" onClick={() => { onRinomina(nome.trim()); setEdit(false); }} className="text-[12.5px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">OK</button>
        </div>
      ) : (
        <button type="button" onClick={onApri} className="block w-full text-left">
          <p className="text-[15px] font-bold text-foreground leading-tight">{item.name || L(st.n, lang)}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{L(st.n, lang)}{item.at ? ` · ${fmtGiorno(new Date(item.at), lang)}` : ""}</p>
          {info ? <p className="text-[12.5px] font-mono-data text-foreground/80 mt-1">{info}</p> : null}
        </button>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={onApri} className="inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground"><Calculator className="w-3.5 h-3.5" />{tri("Apri", "Öffnen", "Open")}</button>
        <button type="button" onClick={onCondividi} aria-label={tri("Condividi", "Teilen", "Share")} className="inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-border"><Share2 className="w-3.5 h-3.5" />{tri("Link", "Link", "Link")}</button>
        <button type="button" onClick={() => setEdit((v) => !v)} aria-label={tri("Rinomina", "Umbenennen", "Rename")} className="inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-border"><Pencil className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={onDuplica} aria-label={tri("Duplica", "Duplizieren", "Duplicate")} className="inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-border"><Copy className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => { if (sicuro) onElimina(); else { setSicuro(true); setTimeout(() => setSicuro(false), 4000); } }}
          className={`inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border ${sicuro ? "border-mattone bg-mattone text-white" : "border-border text-muted-foreground"}`}>
          <Trash2 className="w-3.5 h-3.5" />{sicuro ? tri("Sicuro? Tocca ancora", "Sicher? Nochmal tippen", "Sure? Tap again") : null}
        </button>
      </div>
    </li>
  );
}

export default function MieFormule({ lang, lista, setLista, onApri, onCondividi, onNuova }) {
  const tri = mkTri(lang);
  const salva = (list) => { setLista(list); scriviFormule(list); };
  if (!lista.length) {
    return (
      <div data-testid="formule-vuoto" className="rounded-2xl border border-dashed border-border bg-card p-5 text-center space-y-3">
        <p className="text-[14px] text-foreground font-semibold">{tri("Ancora nessuna formula.", "Noch keine Rezeptur.", "No formulas yet.")}</p>
        <p className="text-[12.5px] text-muted-foreground leading-snug">{tri("Calcola un impasto e premi «Salva»: resta qui, solo in questo telefono. Puoi mandarla con un link a chi vuoi.", "Berechne einen Teig und tippe auf „Speichern“: er bleibt hier, nur auf diesem Handy. Per Link kannst du ihn weitergeben.", "Work out a dough and tap \"Save\": it stays here, only on this phone. You can send it to anyone with a link.")}</p>
        <button type="button" onClick={onNuova} className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground"><Calculator className="w-4 h-4" />{tri("Calcola un impasto", "Einen Teig berechnen", "Work out a dough")}</button>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="formule-lista">
      <p className="text-[12.5px] text-muted-foreground">{tri(`${lista.length} ${lista.length === 1 ? "formula" : "formule"}, solo in questo dispositivo.`, `${lista.length} ${lista.length === 1 ? "Rezeptur" : "Rezepturen"}, nur auf diesem Gerät.`, `${lista.length} ${lista.length === 1 ? "formula" : "formulas"}, only on this device.`)}</p>
      <ul className="space-y-2.5">
        {lista.map((it) => (
          <Voce key={it.id} item={it} lang={lang}
            onApri={() => onApri(it)}
            onCondividi={() => onCondividi(it.f)}
            onRinomina={(n) => salva(lista.map((x) => (x.id === it.id ? { ...x, name: n, f: { ...x.f, n } } : x)))}
            onDuplica={() => { if (lista.length >= MAX_FORMULE) { toast.error(tri("Sono già 60: eliminane una.", "Schon 60: lösche eine.", "Already 60: delete one.")); return; } const id = `f${Date.now().toString(36)}`; const nm = `${it.name || ""} (2)`.trim(); salva([{ ...it, id, name: nm, f: { ...it.f, n: nm }, at: new Date().toISOString() }, ...lista]); }}
            onElimina={() => salva(lista.filter((x) => x.id !== it.id))} />
        ))}
      </ul>
    </div>
  );
}
