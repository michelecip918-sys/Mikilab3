import { useState } from "react";
import { Package, Flame } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import ProductionInventory from "@/components/ProductionInventory";
import BatchPhoenix from "@/components/BatchPhoenix";

// Bottone che apre uno strumento (ex Sitor fluttuante) nel suo contesto/sezione naturale.
export function InventoryButton() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button data-testid="magazzino-inventory-btn" onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#6e9e85]/50 text-[#6e9e85] bg-[#6e9e85]/10 active:scale-95 transition-transform">
        <Package className="w-4 h-4" /> {tri("Inventario di Produzione (foto)", "Produktions-Inventar (Foto)", "Production Inventory (photo)", "Inventario de Producción (foto)", "Inventaire de Production (photo)", "موجودی تولید (عکس)")}
      </button>
      <p className="text-[11px] text-[#64748B] mt-1.5">{tri("Scatta una foto agli scaffali: Sitor conta e aggiorna le giacenze.", "Foto der Regale: Sitor zählt und aktualisiert.", "Photograph the shelves: Sitor counts and updates stock.", "Fotografía los estantes: Sitor cuenta y actualiza.", "Photographie les étagères : Sitor compte et met à jour.", "از قفسه‌ها عکس بگیر: سیتور می‌شمارد و به‌روزرسانی می‌کند.")}</p>
      {open && <ProductionInventory onClose={() => setOpen(false)} />}
    </div>
  );
}

export function BatchPhoenixButton() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button data-testid="celle-phoenix-btn" onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#fdba74]/50 text-[#fdba74] bg-[#f97316]/10 active:scale-95 transition-transform">
        <Flame className="w-4 h-4" /> Batch Phoenix · {tri("Recupero impasti", "Teig-Rettung", "Dough recovery", "Recuperación de masa", "Récupération de pâte", "بازیابی خمیر")}
      </button>
      <p className="text-[11px] text-[#64748B] mt-1.5">{tri("Un impasto è rimasto fermo troppo? Sitor propone come recuperarlo prima che si perda.", "Teig zu lange gestanden? Sitor schlägt die Rettung vor.", "A dough stalled too long? Sitor suggests how to recover it before it's lost.", "¿Masa parada demasiado? Sitor propone recuperarla.", "Pâte arrêtée trop longtemps ? Sitor propose de la récupérer.", "خمیر زیادی مانده؟ سیتور راه نجاتش را پیشنهاد می‌دهد.")}</p>
      {open && <BatchPhoenix onClose={() => setOpen(false)} />}
    </div>
  );
}
