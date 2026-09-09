// Barra-indice sticky in cima alle pagine lunghe: chip che scrollano alla sezione (per data-testid).
export default function SectionJumpBar({ sections = [], testid = "section-jump-bar" }) {
  if (!sections.length) return null;
  const go = (target) => {
    const el = document.querySelector(`[data-testid="${target}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div data-testid={testid} className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-3 bg-[#0D1520]/85 backdrop-blur-md border-b border-[#2A3B49]">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {sections.map((s) => {
          const Icon = s.Icon;
          return (
            <button key={s.target} data-testid={`jump-${s.target}`} onClick={() => go(s.target)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B2A38] border border-[#2A3B49] text-[#e4eff8] text-[12.5px] font-bold whitespace-nowrap active:scale-95 hover:border-[#3E9C93]/60 transition-all">
              {Icon && <Icon className="w-3.5 h-3.5 text-[#3E9C93]" />}
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
