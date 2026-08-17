import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wheat, Droplets, Clock, Copy, Scale } from "lucide-react";
import { recipesApi } from "@/lib/api";
import RecipeDialog from "@/components/RecipeDialog";
import ScaleDialog from "@/components/ScaleDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RecipeList({ collectionName, heroImage, heroTitle, heroSubtitle, emptyText }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [scaling, setScaling] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setRecipes(await recipesApi.list(collectionName));
    } catch {
      toast.error("Errore nel caricamento delle ricette");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collectionName]);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await recipesApi.update(editing.id, payload);
        toast.success("Ricetta aggiornata");
      } else {
        await recipesApi.create({ ...payload, collection_name: collectionName });
        toast.success("Ricetta aggiunta");
      }
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error("Errore nel salvataggio");
    }
  };

  const handleDelete = async () => {
    try {
      await recipesApi.remove(toDelete.id);
      toast.success("Ricetta eliminata");
      setToDelete(null);
      load();
    } catch {
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleDuplicate = async (r) => {
    try {
      const { id, created_at, updated_at, ...rest } = r;
      await recipesApi.create({ ...rest, collection_name: collectionName, name: `${r.name} (copia)` });
      toast.success("Ricetta duplicata");
      load();
    } catch {
      toast.error("Errore nella duplicazione");
    }
  };

  const handleScaleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: collectionName });
      toast.success("Ricetta scalata salvata");
      setScaling(null);
      load();
    } catch {
      toast.error("Errore nel salvataggio");
    }
  };

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 h-40">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C221E]/85 via-[#2C221E]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-white">{heroTitle}</h1>
          <p className="text-white/85 text-sm mt-0.5">{heroSubtitle}</p>
        </div>
      </div>

      <button
        data-testid="add-recipe-btn"
        onClick={() => { setEditing(null); setDialogOpen(true); }}
        className="w-full bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mb-5"
      >
        <Plus className="w-5 h-5" /> Aggiungi ricetta
      </button>

      {loading ? (
        <p className="text-center text-[#8C7567] py-8">Caricamento…</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 px-6 border-2 border-dashed border-[#E8DEC8] dark:border-[#3D302A] rounded-3xl">
          <Wheat className="w-10 h-10 text-[#D99B26] mx-auto mb-3" />
          <p className="text-[#736055] dark:text-[#A89689]">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-testid={`recipe-card-${r.id}`}
              className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold text-[#2C221E] dark:text-[#F5EFE6] truncate">
                    {r.name}
                  </h3>
                  {r.flour_type ? (
                    <p className="text-sm text-[#8C7567] mt-0.5">{r.flour_type}</p>
                  ) : null}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    data-testid={`scale-recipe-${r.id}`}
                    onClick={() => setScaling(r)}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#6B8E62] active:scale-95"
                    aria-label="Scala dosi"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`duplicate-recipe-${r.id}`}
                    onClick={() => handleDuplicate(r)}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#8C7567] active:scale-95"
                    aria-label="Duplica"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`edit-recipe-${r.id}`}
                    onClick={() => { setEditing(r); setDialogOpen(true); }}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B34A26] active:scale-95"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`delete-recipe-${r.id}`}
                    onClick={() => setToDelete(r)}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B4442A] active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {r.hydration_percent != null && (
                  <Badge icon={<Droplets className="w-3.5 h-3.5" />}>{r.hydration_percent}% idr.</Badge>
                )}
                {r.flour_grams != null && (
                  <Badge icon={<Wheat className="w-3.5 h-3.5" />}>{r.flour_grams}g farina</Badge>
                )}
                {r.bulk_fermentation_hours != null && (
                  <Badge icon={<Clock className="w-3.5 h-3.5" />}>{r.bulk_fermentation_hours}h lievit.</Badge>
                )}
              </div>

              {r.notes ? (
                <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-3 leading-relaxed">{r.notes}</p>
              ) : null}
            </motion.div>
          ))}
        </div>
      )}

      <RecipeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />

      <ScaleDialog
        recipe={scaling}
        open={!!scaling}
        onOpenChange={(o) => !o && setScaling(null)}
        onSave={handleScaleSave}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Eliminare la ricetta?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" verrà eliminata definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">Annulla</AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-btn"
              onClick={handleDelete}
              className="bg-[#B4442A] hover:bg-[#963B1C]"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Badge({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#D99B26]/15 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data text-xs px-2.5 py-1 rounded-full font-bold border border-[#D99B26]/30">
      {icon}
      {children}
    </span>
  );
}
