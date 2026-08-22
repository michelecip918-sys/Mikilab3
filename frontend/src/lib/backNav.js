import { useEffect, useRef } from "react";

// Gestione "tasto Indietro" multi-livello per viste profonde (dialog ricetta,
// strumento del Laboratorio, sotto-pagine). Ogni vista aperta aggiunge una voce
// alla history; il tasto Indietro la chiude passo-passo invece di tornare alla Home.

const stack = [];

export function pushBack(onClose) {
  const entry = { onClose };
  stack.push(entry);
  window.history.pushState({ _bk: stack.length }, "");
  return entry;
}

// Chiusura via UI (X / pulsante): rimuove solo la voce dallo stack.
// Non tocchiamo la history per non provocare salti (es. verso la Home).
export function releaseBack(entry) {
  const i = stack.lastIndexOf(entry);
  if (i !== -1) stack.splice(i, 1);
}

// Chiamata dal singolo listener popstate in App. Ritorna true se ha gestito l'evento.
export function consumeBack() {
  const entry = stack.pop();
  if (entry) { entry.onClose(); return true; }
  return false;
}

export function useBackClose(active, onClose) {
  const entryRef = useRef(null);
  const cbRef = useRef(onClose);
  cbRef.current = onClose;
  useEffect(() => {
    if (!active) return undefined;
    entryRef.current = pushBack(() => cbRef.current && cbRef.current());
    return () => {
      if (entryRef.current) { releaseBack(entryRef.current); entryRef.current = null; }
    };
  }, [active]);
}
