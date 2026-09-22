/* MikiLab — Il Manuale di Sitor. (c) 2026 Michele Signorella. */
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
// Tema "La bottega di Michele": chiaro di default, scuro se scelto dall'utente.
try { if (localStorage.getItem("mikilab_theme") === "dark") document.documentElement.classList.add("dark"); } catch (e) { /* */ }
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

// PWA: registra il Service Worker (app installabile e ricette consultabili offline).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL || ""}/sw.js`).catch(() => { /* */ });
  });
}
