// Pagina "Coming Soon / Manutenzione" mostrata al pubblico quando REACT_APP_MAINTENANCE=true.
export default function Maintenance() {
  return (
    <div data-testid="maintenance-screen" className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#ff6b00 0%,#121212 100%)" }}>
      <div className="relative z-10 max-w-md">
        <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden ring-2 ring-[#D4AF37]/70 shadow-xl bg-[#1e1e1e]">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-full h-full object-cover" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white mt-6 tracking-tight">MikiLab</h1>
        <div className="h-1.5 w-40 mx-auto my-5 rounded-full" style={{ background: "linear-gradient(90deg,#D4AF37,#ff6b00)" }} />
        <p className="text-xl sm:text-2xl font-semibold text-[#EAF0EC]">Mikilab sta arrivando.</p>
        <p className="text-base text-white/75 mt-2">Sito in manutenzione.</p>
        <p className="text-sm text-white/50 mt-8">© {new Date().getFullYear()} MikiLab · mikilab.de</p>
      </div>
    </div>
  );
}
