import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { announcementsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Stoccarda() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", details: "", region: "stoccarda" });
  const [toDelete, setToDelete] = useState(null);
  const [filter, setFilter] = useState("all");

  const REGIONS = ["stoccarda", "germania", "italia", "mondo"];
  const regionLabel = (r) => t(`region_${r || "stoccarda"}`);

  const load = async () => {
    try { setItems(await announcementsApi.list()); }
    catch { toast.error(t("toast_ann_load_error")); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ title: "", details: "", region: "stoccarda" }); setEditing({}); };
  const openEdit = (a) => { setForm({ title: a.title, details: a.details || "", region: a.region || "stoccarda" }); setEditing(a); };

  const save = async () => {
    if (!form.title.trim()) return;
    try {
      if (editing && editing.id) await announcementsApi.update(editing.id, form);
      else await announcementsApi.create(form);
      toast.success(t("toast_ann_saved"));
      setEditing(null); load();
    } catch { toast.error(t("toast_save_error")); }
  };

  const remove = async () => {
    try { await announcementsApi.remove(toDelete.id); toast.success(t("toast_ann_deleted")); setToDelete(null); load(); }
    catch { toast.error(t("toast_generic_error")); }
  };

  return (
    <div className="space-y-4 mb-5">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#6B8E62]/15 border border-[#6B8E62]/30 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-[#6B8E62]" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] leading-none">{t("tab_stoccarda")}</h2>
          <p className="text-xs text-[#8C7567] mt-0.5">{t("stoccarda_sub")}</p>
        </div>
      </div>

      {editing ? (
        <div className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 space-y-3">
          <input
            data-testid="announcement-title-input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("ann_title_ph")}
            className="w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 outline-none focus:border-[#B34A26]"
          />
          <textarea
            data-testid="announcement-details-input"
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            rows={3}
            placeholder={t("ann_details_ph")}
            className="w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 outline-none focus:border-[#B34A26] resize-none"
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("ann_region")}</label>
            <select
              data-testid="announcement-region-select"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              className="mt-1 w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 outline-none focus:border-[#B34A26]"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{regionLabel(r)}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)}
              className="flex-1 bg-[#F5EFE6] dark:bg-[#332823] px-4 py-3 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] font-medium">
              {t("cancel")}
            </button>
            <button data-testid="announcement-save-btn" onClick={save}
              className="flex-1 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-4 py-3 rounded-xl">
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <button
          data-testid="add-announcement-btn"
          onClick={openNew}
          className="w-full bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-3 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t("ann_add")}
        </button>
      )}

      <div className="flex gap-2 overflow-x-auto thin-scroll pb-1">
        {["all", ...REGIONS].map((r) => (
          <button
            key={r}
            data-testid={`region-chip-${r}`}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === r ? "bg-[#B34A26] text-white" : "bg-[#F5EFE6] dark:bg-[#332823] text-[#8C7567] border border-[#E8DEC8] dark:border-[#3D302A]"
            }`}
          >
            {r === "all" ? t("region_all") : regionLabel(r)}
          </button>
        ))}
      </div>

      {items.filter((a) => filter === "all" || (a.region || "stoccarda") === filter).map((a) => (
        <div key={a.id} data-testid={`announcement-${a.id}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6B8E62]/15 border border-[#6B8E62]/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#6B8E62]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-[#6B8E62] px-2 py-0.5 rounded-full">{regionLabel(a.region)}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6] mt-1">{a.title}</h3>
              {a.details ? <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{a.details}</p> : null}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => openEdit(a)} data-testid={`edit-announcement-${a.id}`} className="w-8 h-8 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B34A26]">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setToDelete(a)} data-testid={`delete-announcement-${a.id}`} className="w-8 h-8 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B4442A]">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("ann_delete_q")}</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" {t("ann_delete_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="announcement-delete-cancel">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction data-testid="announcement-delete-confirm" onClick={remove} className="bg-[#B4442A] hover:bg-[#963B1C]">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
