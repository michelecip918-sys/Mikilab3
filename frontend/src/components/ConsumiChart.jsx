import { useState, useEffect } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { warehouseApi } from "@/lib/api";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DAYS = 14;

// Storico consumi farine: aggrega il log (/consumption) per giorno negli ultimi 14 giorni.
export default function ConsumiChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    warehouseApi.consumption()
      .then((logs) => {
        const byDay = {};
        const today = new Date();
        for (let i = DAYS - 1; i >= 0; i--) {
          const d = new Date(today); d.setDate(today.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          byDay[key] = { day: `${d.getDate()}/${d.getMonth() + 1}`, kg: 0 };
        }
        (Array.isArray(logs) ? logs : []).forEach((l) => {
          if ((l.kind || "") !== "farina") return;
          const key = String(l.at || "").slice(0, 10);
          if (byDay[key]) byDay[key].kg += Number(l.kg) || 0;
        });
        const arr = Object.values(byDay).map((x) => ({ ...x, kg: Math.round(x.kg * 100) / 100 }));
        setData(arr);
      })
      .catch(() => setData([]));
  }, []);

  const total = (data || []).reduce((s, x) => s + x.kg, 0);
  const hasData = total > 0;

  return (
    <div data-testid="consumi-chart" className="p-4 rounded-xl bg-background border border-border">
      <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4" /> Consumi Farine · ultimi {DAYS} giorni
      </h4>
      {data === null ? (
        <div className="h-[120px] flex items-center justify-center text-muted-foreground text-xs"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Caricamento…</div>
      ) : !hasData ? (
        <p data-testid="consumi-empty" className="h-[80px] flex items-center justify-center text-center text-muted-foreground text-[11px]">Nessun consumo registrato. Conferma un'impastata per iniziare a tracciare i consumi.</p>
      ) : (
        <>
          <div style={{ width: "100%", height: 120 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} interval={1} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#D9520011" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card))", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "hsl(var(--muted-foreground))" }} formatter={(v) => [`${v} kg`, "Consumo"]} />
                <Bar dataKey="kg" radius={[3, 3, 0, 0]}>
                  {data.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Totale farine consumate nel periodo: <strong className="text-primary">{Math.round(total * 100) / 100} kg</strong></p>
        </>
      )}
    </div>
  );
}
