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
      setInsight(res.bakomix_insight || "");
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
      toast.success(res.bakomix_insight || tri("Batch agganciato", "Charge verknüpft", "Batch bound", "Lote vinculado", "Lot lié", "دسته متصل شد"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Errore", "Fehler", "Error", "Error", "Erreur", "خطا"));
    }
    setBinding(false);
  }, [recipeId, batches, tri]);

  return (
    <div data-testid="production-inventory" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Package className="w-5 h-5 text-[#22c55e]" /> {tri("Inventario di Produzione", "Produktions-Inventar", "Production Inventory", "Inventario de Producción", "Inventaire de Production", "موجودی تولید")}</h2>
          <button data-testid="inventory-close" onClick={() => { stopCam(); onClose(); }} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-[12px] text-[#94A3B8] mb-4">{tri("BakoMix legge le consegne dalla foto, tiene le scorte e aggancia i batch alla linea — senza uffici né scartoffie.", "BakoMix liest Lieferungen per Foto, führt den Bestand und verknüpft Chargen mit der Linie — ohne Büro/Papierkram.", "BakoMix reads deliveries from a photo, tracks stock and binds batches to the line — no office, no paperwork.", "BakoMix lee las entregas por foto, controla el stock y vincula lotes a la línea — sin oficina ni papeleo.", "BakoMix lit les livraisons par photo, suit le stock et lie les lots à la ligne — sans bureau ni paperasse.", "BakoMix تحویل‌ها را از عکس می‌خواند و موجودی را مدیریت می‌کند — بدون کاغذبازی.")}</p>

        {/* SCANSIONE CONSEGNA / FREEZER */}
        <div className="rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]0d p-3 mb-5" style={{ background: "#22c55e0d" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#22c55e] mb-2 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> {tri("Scansiona consegna / scarico freezer", "Lieferung/Freezer scannen", "Scan delivery / freezer drop", "Escanear entrega / freezer", "Scanner livraison / freezer", "اسکن تحویل / فریزر")}</p>
          <div className="relative rounded-xl overflow-hidden border border-[#1e293b] bg-black mb-2" style={{ aspectRatio: "4 / 3", maxHeight: "36vh" }}>
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${camOn ? "" : "hidden"}`} data-testid="inventory-video" />
            {!camOn && <div className="absolute inset-0 flex flex-col items-center justify-center text-[#64748B]"><Snowflake className="w-8 h-8 mb-1" /><p className="text-xs">{tri("Fotocamera spenta", "Kamera aus", "Camera off", "Cámara apagada", "Caméra éteinte", "دوربین خاموش")}</p></div>}
            {scanning && <div className="absolute inset-0 bg-[#22c55e]/10 flex items-center justify-center"><Loader2 className="w-7 h-7 text-[#22c55e] animate-spin" /></div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {!camOn ? (
              <button data-testid="inventory-start-cam" onClick={startCam} className="col-span-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#030712] border border-[#22c55e]/50 text-[#22c55e] font-black text-sm active:scale-95"><Camera className="w-4 h-4" /> {tri("Accendi fotocamera", "Kamera an", "Turn on camera", "Encender cámara", "Allumer caméra", "روشن کردن دوربین")}</button>
            ) : (
              <>
                <button data-testid="inventory-scan-btn" onClick={captureScan} disabled={scanning} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white font-black text-sm disabled:opacity-50 active:scale-95">{scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} {tri("Scansiona", "Scannen", "Scan", "Escanear", "Scanner", "اسکن")}</button>
                <button data-testid="inventory-stop-cam" onClick={stopCam} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#030712] border border-[#1e293b] text-[#94A3B8] font-bold text-sm active:scale-95"><X className="w-4 h-4" /> {tri("Spegni", "Aus", "Off", "Apagar", "Éteindre", "خاموش")}</button>
              </>
            )}
          </div>
          {insight && <div className="mt-2 text-[12px] text-[#cfe0ec] flex items-start gap-1.5" data-testid="inventory-insight"><Sparkles className="w-3.5 h-3.5 text-[#22c55e] mt-0.5 shrink-0" /> {insight}</div>}
        </div>

        {/* AGGANCIO BATCH ALLA LINEA */}
        <div className="rounded-2xl border border-[#5EEAD4]/30 p-3 mb-5" style={{ background: "#5EEAD40d" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#5EEAD4] mb-2 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> {tri("Aggancia batch → Dosaggio & Autolisi", "Charge → Dosierung & Autolyse", "Bind batch → Dosage & Autolysis", "Vincular lote → Dosif. & Autólisis", "Lier lot → Dosage & Autolyse", "اتصال دسته → دوز و اتولیز")}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select data-testid="inventory-recipe-select" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#5EEAD4]">
              <option value="">{tri("Scegli ricetta…", "Rezept wählen…", "Choose recipe…", "Elegir receta…", "Choisir recette…", "انتخاب دستور…")}</option>
              {recipes.map((r) => (<option key={r.id} value={r.id}>{r[`name_${lang}`] || r.name}</option>))}
            </select>
            <div className="flex items-center gap-1.5">
              <button data-testid="inventory-batch-minus" onClick={() => setBatches((b) => Math.max(1, b - 1))} className="w-10 h-10 rounded-xl bg-[#030712] border border-[#1e293b] text-white text-lg font-black active:scale-95">−</button>
              <span data-testid="inventory-batch-value" className="w-12 text-center font-mono-data text-lg font-black text-white">{Math.max(1, Number(batches) || 1)}×</span>
              <button data-testid="inventory-batch-plus" onClick={() => setBatches((b) => (Number(b) || 1) + 1)} className="w-10 h-10 rounded-xl bg-[#030712] border border-[#1e293b] text-white text-lg font-black active:scale-95">+</button>
            </div>
          </div>
          <button data-testid="inventory-bind-btn" onClick={bind} disabled={!recipeId || binding} className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-black text-sm disabled:opacity-40 active:scale-95">{binding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} {tri("Aggancia e scala consumi", "Verknüpfen & abbuchen", "Bind & deduct", "Vincular y descontar", "Lier & déduire", "اتصال و کسر")}</button>
          {bindResult && (
            <div className="mt-3 space-y-1.5" data-testid="inventory-bind-result">
              {(bindResult.consumed || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] bg-[#030712] border border-[#1e293b] rounded-lg px-3 py-1.5">
                  <span className="text-[#AEB8BF] flex items-center gap-1.5"><Wheat className="w-3.5 h-3.5 text-[#22c55e]" /> {c.name}</span>
                  <span className="font-mono-data text-white">−{c.kg} kg → {c.quantity_kg} kg</span>
                </div>
              ))}
              {(bindResult.shortfalls || []).map((s, i) => (
                <div key={`s${i}`} className="flex items-center gap-1.5 text-[12px] text-[#f59e0b]" data-testid={`inventory-shortfall-${i}`}><AlertTriangle className="w-3.5 h-3.5" /> {s.name}: {tri("mancano", "fehlen", "missing", "faltan", "manquent", "کمبود")} {s.missing} kg</div>
              ))}
            </div>
          )}
        </div>

        {/* SCORTE ATTUALI */}
        <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-2">{tri("Scorte in linea", "Bestand", "Stock on line", "Stock en línea", "Stock en ligne", "موجودی خط")}</p>
        <div className="space-y-1.5" data-testid="inventory-stock">
          {stock.length === 0 && <p className="text-[12px] text-[#64748B] text-center py-4">{tri("Nessuna scorta. Scansiona una consegna.", "Kein Bestand. Lieferung scannen.", "No stock. Scan a delivery.", "Sin stock. Escanea una entrega.", "Aucun stock. Scanne une livraison.", "موجودی نیست. یک تحویل اسکن کن.")}</p>}
          {stock.map((s) => {
            const low = s.min_kg > 0 && s.quantity_kg <= s.min_kg;
            return (
              <div key={s.id} data-testid={`inventory-item-${s.id}`} className="flex items-center justify-between bg-[#0b0f19] border rounded-xl px-3 py-2" style={{ borderColor: low ? "#f59e0b55" : "#1e293b" }}>
                <span className="text-[13px] text-white flex items-center gap-2">{s.kind === "farina" ? <Wheat className="w-4 h-4 text-[#e0b877]" /> : <Package className="w-4 h-4 text-[#5E8CA8]" />} {s.name}</span>
                <span className={`font-mono-data font-bold ${low ? "text-[#f59e0b]" : "text-white"}`}>{s.quantity_kg} kg</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
