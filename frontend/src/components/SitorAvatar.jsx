// Rappresentazione UFFICIALE e UNICA di Sitor (Michele dal futuro, divisa da fornaio moderna).
// Un solo volto, un solo stile, usato ovunque nel sito.
const OFFICIAL_SRC = `${process.env.PUBLIC_URL || ""}/sitor_official.jpg`;

export default function SitorAvatar({ size = null, className = "", round = true, speaking = false, ring = true, alt = "Sitor" }) {
  const dim = typeof size === "number" ? { width: size, height: size } : {};
  const fill = size === null;
  return (
    <div
      data-testid="sitor-avatar"
      className={`relative overflow-hidden ${round ? "rounded-full" : "rounded-2xl"} ${fill ? "w-full h-full" : ""} ${className}`}
      style={{
        ...dim,
        boxShadow: ring ? "0 0 0 2px rgba(217,119,54,0.35), 0 6px 22px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <img src={OFFICIAL_SRC} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      {speaking && (
        <span
          className="absolute inset-0 rounded-[inherit] pointer-events-none animate-pulse"
          style={{ boxShadow: "inset 0 0 0 2px rgba(126,154,130,0.7)" }}
        />
      )}
    </div>
  );
}

export { SitorAvatar };
