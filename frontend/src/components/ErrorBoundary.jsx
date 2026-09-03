import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";

// Intercetta i crash di render così lo schermo non resta bianco.
// Si auto-ripristina quando cambia `resetKey` (es. cambio tab / tasto Indietro).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("MikiLab render crash:", error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const lang = this.props.lang;
    const tri = (i, d, e) => mkTri(lang)(i, d, e);
    return (
      <div data-testid="error-boundary" className="max-w-md mx-auto mt-10 rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#F26419]/12 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7 text-[#F26419]" />
        </div>
        <h2 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">
          {tri("Ops, qualcosa si è bloccato", "Ups, etwas ist hängengeblieben", "Oops, something got stuck")}
        </h2>
        <p className="text-sm text-[#7E8A93] mt-1.5">
          {tri("Nessun problema: riprova o torna alla Home.", "Kein Problem: versuch es erneut oder geh zur Startseite.", "No worries: retry or go back Home.")}
        </p>
        <div className="flex flex-col gap-2 mt-5">
          <button data-testid="error-retry" onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center justify-center gap-2 bg-[#F26419] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
            <RotateCcw className="w-4.5 h-4.5" /> {tri("Riprova", "Erneut versuchen", "Retry")}
          </button>
          <button data-testid="error-home" onClick={() => { window.location.assign(window.location.origin + "/"); }}
            className="inline-flex items-center justify-center gap-2 bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] text-[#F26419] dark:text-[#a9d2ec] font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
            <Home className="w-4.5 h-4.5" /> {tri("Torna alla Home", "Zur Startseite", "Go Home")}
          </button>
        </div>
      </div>
    );
  }
}
