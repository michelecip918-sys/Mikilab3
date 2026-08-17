import { Wheat, Moon, Sun, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-[#FDFBF7]/95 dark:bg-[#1A1412]/95 backdrop-blur-md border-b border-[#E8DEC8] dark:border-[#3D302A] px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#B34A26] flex items-center justify-center shadow-sm">
          <Wheat className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-none">
          <div className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">
            Mikilab
          </div>
          <div className="text-[10px] tracking-wider uppercase font-semibold text-[#8C7567]">
            Il Maestro del Pane
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          data-testid="climate-indicator"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#736055] dark:text-[#A89689] bg-[#F5EFE6] dark:bg-[#332823] px-2.5 py-1.5 rounded-lg border border-[#E8DEC8] dark:border-[#3D302A]"
        >
          <MapPin className="w-3.5 h-3.5 text-[#B34A26]" />
          Stoccarda
        </div>
        <button
          data-testid="theme-toggle"
          onClick={() => setDark((d) => !d)}
          className="w-10 h-10 rounded-xl bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#B34A26] active:scale-95 transition-all"
          aria-label="Cambia tema"
        >
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </div>
    </header>
  );
}
