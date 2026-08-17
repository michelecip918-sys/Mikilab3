import { BookOpen, Wrench, Sparkles } from "lucide-react";

const TABS = [
  { id: "mikilab", label: "Mikilab", sub: "Le tue ricette", Icon: BookOpen },
  { id: "maestro", label: "Maestro", sub: "Strumenti", Icon: Wrench },
  { id: "sa-tutto", label: "Il Maestro", sub: "sa tutto", Icon: Sparkles },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 bg-[#FDFBF7]/95 dark:bg-[#1A1412]/95 backdrop-blur-md border-t border-[#E8DEC8] dark:border-[#3D302A] z-50 px-3 py-2 shadow-[0_-4px_20px_rgba(44,34,30,0.06)]"
    >
      <div className="max-w-xl mx-auto grid grid-cols-3 gap-1">
        {TABS.map(({ id, label, sub, Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all min-h-[56px] ${
                on
                  ? "bg-[#B34A26] text-white shadow-md"
                  : "text-[#8C7567] hover:bg-[#F5EFE6] dark:hover:bg-[#332823]"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={on ? 2.4 : 2} />
              <span className="text-[11px] font-semibold leading-none">{label}</span>
              <span className={`text-[9px] leading-none ${on ? "text-white/80" : "text-[#A89689]"}`}>
                {sub}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
