// V127 — pezzi di interfaccia della calcolatrice del fornaio (stessi colori e caratteri del resto del sito).

export function Sezione({ titolo, sotto, children, testid, extra }) {
  return (
    <section data-testid={testid} className="rounded-2xl border border-border bg-card p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-foreground leading-tight">{titolo}</p>
          {sotto ? <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{sotto}</p> : null}
        </div>
        {extra || null}
      </div>
      {children}
    </section>
  );
}

export function Numero({ label, value, onChange, suffix, min, max, step = 1, testid, w = "w-24", hint }) {
  return (
    <label className="block text-[12.5px] text-muted-foreground min-w-0">
      <span className="block leading-tight">{label}</span>
      <span className="mt-1 flex items-center gap-1.5">
        <input data-testid={testid} type="number" inputMode="decimal" min={min} max={max} step={step} value={value == null ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className={`${w} font-mono-data text-[15px] font-bold text-foreground bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary`} />
        {suffix ? <span className="text-[12.5px] text-muted-foreground whitespace-nowrap">{suffix}</span> : null}
      </span>
      {hint ? <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</span> : null}
    </label>
  );
}

export function Scelta({ options, value, onChange, testid, small }) {
  return (
    <div data-testid={testid} className="flex flex-wrap gap-1.5" role="group">
      {options.map((o) => (
        <button key={String(o.v)} type="button" data-testid={testid ? `${testid}-${o.v}` : undefined} onClick={() => onChange(o.v)} aria-pressed={value === o.v}
          className={`inline-flex items-center gap-1 ${small ? "text-[11.5px] px-2.5 py-1" : "text-[12.5px] px-3 py-1.5"} font-semibold rounded-full border transition-all active:scale-95 ${value === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/60"}`}>
          {o.I ? <o.I className="w-3.5 h-3.5" /> : null}{o.l}
        </button>
      ))}
    </div>
  );
}

export function Cursore({ label, value, onChange, min, max, step = 1, testid, mostra }) {
  const v = Number(String(value == null ? "" : value).replace(",", "."));
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-[12.5px] text-muted-foreground"><span>{label}</span><span className="font-mono-data font-bold text-foreground">{mostra != null ? mostra : value}</span></span>
      <input data-testid={testid} type="range" min={min} max={max} step={step} value={Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
    </label>
  );
}

export function Interruttore({ on, onChange, label, sotto, testid }) {
  return (
    <button type="button" data-testid={testid} onClick={() => onChange(!on)} aria-pressed={!!on} className="w-full flex items-start gap-3 text-left">
      <span className={`mt-0.5 shrink-0 w-10 h-6 rounded-full border transition-colors ${on ? "bg-primary border-primary" : "bg-muted border-border"}`}>
        <span className={`block w-5 h-5 mt-[1px] rounded-full bg-white shadow transition-transform ${on ? "translate-x-[17px]" : "translate-x-[1px]"}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-foreground leading-tight">{label}</span>
        {sotto ? <span className="block text-[12px] text-muted-foreground leading-snug mt-0.5">{sotto}</span> : null}
      </span>
    </button>
  );
}

const TONO = {
  ok: "border-salvia/50 bg-salvia/10",
  info: "border-ambra/50 bg-ambra/10",
  warn: "border-mattone/50 bg-mattone/10",
  tip: "border-primary/35 bg-primary/5",
};
export function Avviso({ lvl, children, testid }) {
  return <p data-testid={testid} className={`text-[12.5px] leading-snug text-foreground/90 rounded-xl border px-3 py-2 ${TONO[lvl] || TONO.info}`}>{children}</p>;
}

export const selectCls = "text-[13px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary";
