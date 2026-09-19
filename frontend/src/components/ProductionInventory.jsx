import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { X, Package, Camera, ScanLine, Loader2, Link2, Snowflake, Wheat, AlertTriangle, Sparkles } from "lucide-react";
import { warehouseApi, recipesApi, inventoryApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export default function ProductionInventory({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [stock, setStock] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState("");
  const [batches, setBatches] = useState(1);
  const [camOn, setCamOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [binding, setBinding] = useState(false);
  const [insight, setInsight] = useState("");
  const [bindResult, setBindResult] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const loadStock = useCallback(() => { warehouseApi.list().then((d) => setStock(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  useEffect(() => { loadStock(); recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : [])).catch(() => {}); }, [loadStock]);

  const stopCam = useCallback(() => {
    try { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null; setCamOn(false);
  }, []);
  const startCam = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { toast.error(tri("Fotocamera non supportata", "Kamera nicht unterstützt", "Camera not supported", "Cámara no soportada", "Caméra non supportée", "دوربین پشتیبانی نمی‌شود")); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = st; setCamOn(true);
      if (videoRef.current) { videoRef.current.srcObject = st; await videoRef.current.play().catch(() => {}); }
    } catch { toast.error(tri("Permesso fotocamera negato", "Kamera verweigert", "Camera permission denied", "Permiso de cámara denegado", "Caméra refusée", "اجازه دوربین رد شد")); }
  }, [tri]);
  useEffect(() => () => stopCam(), [stopCam]);

  const captureScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720; canvas.height = video.videoHeight || 960;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL("image/jpeg", 0.7);
    setScanning(true); setInsight("");
    try {
      const res = await inventoryApi.scanDrop(b64);
      setStock(res.stock || []);
      setInsight(res.mikemix_insight || "");
      toast.success(tri(`${res.detected_count} materie caricate`, `${res.detected_count} Waren geladen`, `${res.detected_count} items loaded`, `${res.detected_count} artículos cargados`, `${res.detected_count} articles chargés`, `${res.detected_count} کالا بارگذاری شد`));
      stopCam();
    } catch { toast.error(tri("Scansione non riuscita", "Scan fehlgeschlagen", "Scan failed", "Escaneo fallido", "Échec du scan", "اسکن ناموفق")); }
    setScanning(false);
  }, [tri, stopCam]);

  const bind = useCallback(async () => {
    if (!recipeId) return;
    setBinding(true); setBindResult(null);
    try {
      const res = await inventoryApi.bindBatch(recipeId, Math.max(1, Number(batches) || 1));
      setStock(res.stock || []);
      setBindResult(res);
      toast.success(res.mikemix_insight || tri("Batch agganciato", "Charge verknüpft", "Batch bound", "Lote vinculado", "Lot lié", "دسته متصل شد"));
      const low = res.low_stock || [];
      if (low.length) {
        const names = low.map((l) => `${l.name} (${l.quantity_kg}/${l.min_kg} kg)`).join(", ");
        toast.warning(tri(
          `Scorta bassa dopo il batch: ${names}. Rifornisci al più presto.`,
          `Niedriger Bestand nach der Charge: ${names}. Bald nachfüllen.`,
          `Low stock after the batch: ${names}. Restock soon.`,
          `Stock bajo tras el lote: ${names}. Reponer pronto.`,
          `Stock bas après le lot : ${names}. À réapprovisionner.`,
          `موجودی کم پس از دسته: ${names}. زودتر تأمین کن.`
        ), { duration: 9000 });
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Errore", "Fehler", "Error", "Error", "Erreur", "خطا"));
    }
    setBinding(false);
  }, [recipeId, batches, tri]);

  return (
    <div data-testid="production-inventory" className="fixed inset-0 z-[80] bg-background/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-background/95 py-2 z-10">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2"><Package className="w-5 h-5 text-accent" /> {tri("Inventario di Produzione", "Produktions-Inventar", "Production Inventory", "Inventario de Producción", "Inventaire de Production", "موجودی تولید")}</h2>
          <button data-testid="inventory-close" onClick={() => { stopCam(); onClose(); }} className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-[12px] text-muted-foreground mb-4">{tri("Sitor legge le consegne dalla foto, tiene le scorte e aggancia i batch alla linea — senza uffici né scartoffie.", "Sitor liest Lieferungen per Foto, führt den Bestand und verknüpft Chargen mit der Linie — ohne Büro/Papierkram.", "Sitor reads deliveries from a photo, tracks stock and binds batches to the line — no office, no paperwork.", "Sitor lee las entregas por foto, controla el stock y vincula lotes a la línea — sin oficina ni papeleo.", "Sitor lit les livraisons par photo, suit le stock et lie les lots à la ligne — sans bureau ni paperasse.", "Sitor تحویل‌ها را از عکس می‌خواند و موجودی را مدیریت می‌کند — بدون کاغذبازی.")}</p>

        {/* SCANSIONE CONSEGNA / FREEZER */}
        <div className="rounded-2xl border border-accent/30 bg-accent0d p-3 mb-5" style={{ background: "#22c55e0d" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-accent mb-2 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> {tri("Scansiona consegna / scarico freezer", "Lieferung/Freezer scannen", "Scan delivery / freezer drop", "Escanear entrega / freezer", "Scanner livraison / freezer", "اسکن تحویل / فریزر")}</p>
          <div className="relative rounded-xl overflow-hidden border border-border bg-background mb-2" style={{ aspectRatio: "4 / 3", maxHeight: "36vh" }}>
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${camOn ? "" : "hidden"}`} data-testid="inventory-video" />
            {!camOn && <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"><Snowflake className="w-8 h-8 mb-1" /><p className="text-xs">{tri("Fotocamera spenta", "Kamera aus", "Camera off", "Cámara apagada", "Caméra éteinte", "دوربین خاموش")}</p></div>}
            {scanning && <div className="absolute inset-0 bg-accent/10 flex items-center justify-center"><Loader2 className="w-7 h-7 text-accent animate-spin" /></div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {!camOn ? (
              <button data-testid="inventory-start-cam" onClick={startCam} className="col-span-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-accent/50 text-accent font-black text-sm active:scale-95"><Camera className="w-4 h-4" /> {tri("Accendi fotocamera", "Kamera an", "Turn on camera", "Encender cámara", "Allumer caméra", "روشن کردن دوربین")}</button>
            ) : (
              <>
                <button data-testid="inventory-scan-btn" onClick={captureScan} disabled={scanning} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-muted to-muted text-foreground font-black text-sm disabled:opacity-50 active:scale-95">{scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} {tri("Scansiona", "Scannen", "Scan", "Escanear", "Scanner", "اسکن")}</button>
                <button data-testid="inventory-stop-cam" onClick={stopCam} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-border text-muted-foreground font-bold text-sm active:scale-95"><X className="w-4 h-4" /> {tri("Spegni", "Aus", "Off", "Apagar", "Éteindre", "خاموش")}</button>
              </>
            )}
          </div>
          {insight && <div className="mt-2 text-[12px] text-foreground flex items-start gap-1.5" data-testid="inventory-insight"><Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" /> {insight}</div>}
        </div>

        {/* AGGANCIO BATCH ALLA LINEA */}
        <div className="rounded-2xl border border-primary/30 p-3 mb-5" style={{ background: "#5EEAD40d" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> {tri("Aggancia batch → Dosaggio & Autolisi", "Charge → Dosierung & Autolyse", "Bind batch → Dosage & Autolysis", "Vincular lote → Dosif. & Autólisis", "Lier lot → Dosage & Autolyse", "اتصال دسته → دوز و اتولیز")}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select data-testid="inventory-recipe-select" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="flex-1 bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none focus:border-primary">
              <option value="">{tri("Scegli ricetta…", "Rezept wählen…", "Choose recipe…", "Elegir receta…", "Choisir recette…", "انتخاب دستور…")}</option>
              {recipes.map((r) => (<option key={r.id} value={r.id}>{r[`name_${lang}`] || r.name}</option>))}
            </select>
            <div className="flex items-center gap-1.5">
              <button data-testid="inventory-batch-minus" onClick={() => setBatches((b) => Math.max(1, b - 1))} className="w-10 h-10 rounded-xl bg-background border border-border text-foreground text-lg font-black active:scale-95">−</button>
              <span data-testid="inventory-batch-value" className="w-12 text-center font-mono-data text-lg font-black text-foreground">{Math.max(1, Number(batches) || 1)}×</span>
              <button data-testid="inventory-batch-plus" onClick={() => setBatches((b) => (Number(b) || 1) + 1)} className="w-10 h-10 rounded-xl bg-background border border-border text-foreground text-lg font-black active:scale-95">+</button>
            </div>
          </div>
          <button data-testid="inventory-bind-btn" onClick={bind} disabled={!recipeId || binding} className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-muted text-foreground font-black text-sm disabled:opacity-40 active:scale-95">{binding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} {tri("Aggancia e scala consumi", "Verknüpfen & abbuchen", "Bind & deduct", "Vincular y descontar", "Lier & déduire", "اتصال و کسر")}</button>
          {bindResult && (
            <div className="mt-3 space-y-1.5" data-testid="inventory-bind-result">
              {(bindResult.consumed || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] bg-background border border-border rounded-lg px-3 py-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Wheat className="w-3.5 h-3.5 text-accent" /> {c.name}</span>
                  <span className="font-mono-data text-foreground">−{c.kg} kg → {c.quantity_kg} kg</span>
                </div>
              ))}
              {(bindResult.shortfalls || []).map((s, i) => (
                <div key={`s${i}`} className="flex items-center gap-1.5 text-[12px] text-muted-foreground" data-testid={`inventory-shortfall-${i}`}><AlertTriangle className="w-3.5 h-3.5" /> {s.name}: {tri("mancano", "fehlen", "missing", "faltan", "manquent", "کمبود")} {s.missing} kg</div>
              ))}
              {(bindResult.low_stock || []).map((l, i) => (
                <div key={`l${i}`} className="flex items-center gap-1.5 text-[12px] text-muted-foreground" data-testid={`inventory-lowstock-${i}`}><AlertTriangle className="w-3.5 h-3.5" /> {tri("Scorta bassa", "Niedriger Bestand", "Low stock", "Stock bajo", "Stock bas", "موجودی کم")}: {l.name} — {l.quantity_kg}/{l.min_kg} kg</div>
              ))}
            </div>
          )}
        </div>

        {/* SCORTE ATTUALI */}
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2">{tri("Scorte in linea", "Bestand", "Stock on line", "Stock en línea", "Stock en ligne", "موجودی خط")}</p>
        <div className="space-y-1.5" data-testid="inventory-stock">
          {stock.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-4">{tri("Nessuna scorta. Scansiona una consegna.", "Kein Bestand. Lieferung scannen.", "No stock. Scan a delivery.", "Sin stock. Escanea una entrega.", "Aucun stock. Scanne une livraison.", "موجودی نیست. یک تحویل اسکن کن.")}</p>}
          {stock.map((s) => {
            const low = s.min_kg > 0 && s.quantity_kg <= s.min_kg;
            return (
              <div key={s.id} data-testid={`inventory-item-${s.id}`} className="flex items-center justify-between bg-background border rounded-xl px-3 py-2" style={{ borderColor: low ? "#f59e0b55" : "hsl(var(--card))" }}>
                <span className="text-[13px] text-foreground flex items-center gap-2">{s.kind === "farina" ? <Wheat className="w-4 h-4 text-foreground" /> : <Package className="w-4 h-4 text-muted-foreground" />} {s.name}</span>
                <span className={`font-mono-data font-bold ${low ? "text-muted-foreground" : "text-foreground"}`}>{s.quantity_kg} kg</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
