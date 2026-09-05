/*
 * ============================================================================
 *  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
 *  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
 *  Unico proprietario legale: il Master. Sole legal owner: the Master.
 *  Codice riservato: vietata copia, distribuzione, reverse engineering o
 *  cloning non autorizzati. Unauthorized copying, distribution, reverse
 *  engineering or cloning is strictly prohibited and actively tracked by
 *  the BakoMix AI Security Guardian.
 * ============================================================================
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
document.documentElement.classList.add("dark");
// hapticFeedback:false — nessuna vibrazione in tutta l'app (v13.0)
try { if (typeof navigator !== "undefined" && navigator.vibrate) { navigator.vibrate = () => false; } } catch (e) { /* */ }
import App from "@/App";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/auth/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

// PWA: registra il Service Worker (bunker mode → app installabile e usabile offline).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL || ""}/sw.js`).catch(() => { /* */ });
    // rigioca la coda offline appena l'app è pronta (se già online)
    import("@/lib/syncQueue").then((m) => { if (navigator.onLine) m.flushQueue(); }).catch(() => { /* */ });
  });
}
