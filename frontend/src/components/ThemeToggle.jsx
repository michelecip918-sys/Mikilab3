import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("mikilab_theme") === "dark" ? "dark" : "light"; } catch { return "light"; }
  });
  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("mikilab_theme", theme);
    } catch { /* */ }
  }, [theme]);
  return (
    <button data-testid="theme-toggle" onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}
      aria-label="Cambia tema" title="Cambia tema"
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-foreground active:scale-95 transition-all">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
