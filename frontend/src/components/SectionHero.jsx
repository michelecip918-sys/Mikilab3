// Banner tematico "3D simulato" per le sezioni: scena con l'avatar di Michele + cornice legno/mattoni.
export default function SectionHero({ image, title, subtitle, testid, position = "50% 25%" }) {
  const BASE = process.env.PUBLIC_URL || "";
  return (
    <div data-testid={testid} className="relative mb-4 pt-2">
      <div className="relative rounded-t-[70px] rounded-b-[22px] p-2 shadow-xl" style={{ background: "linear-gradient(160deg,#ff8a33,#ff6b00 55%,#c94f00)" }}>
        <div className="relative rounded-t-[62px] rounded-b-[16px] overflow-hidden bg-[#2B303B] grain-overlay">
          <img src={`${BASE}/${image}`} alt={title} className="w-full h-40 object-cover" style={{ objectPosition: position }} loading="eager"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div aria-hidden className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(120% 60% at 50% 8%, rgba(255,226,170,.30), transparent 55%)" }} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B1410]/92 via-[#1B1410]/25 to-transparent px-4 pt-12 pb-3">
            <h1 className="font-display text-2xl font-bold text-white leading-tight drop-shadow-lg">{title}</h1>
            {subtitle && <p className="text-white/85 text-[13px] leading-snug mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
