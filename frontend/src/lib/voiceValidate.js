// Validazione sintattica delle direttive (voce/manuale) prima di salvare nel Planner.
import { toast } from "sonner";

export function validateBatchQty(raw) {
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) { toast.error("Quantità non valida: usa un numero (pezzi) da 0 in su."); return null; }
  if (n > 9999) { toast.error("Quantità troppo alta: massimo 9999 pezzi per giorno."); return null; }
  return Math.round(n);
}

export function validateRecipeName(raw) {
  const s = String(raw || "").trim();
  if (s.length < 2) { toast.error("Nome ricetta troppo corto."); return null; }
  if (s.length > 60) { toast.error("Nome ricetta troppo lungo (max 60 caratteri)."); return null; }
  return s;
}
