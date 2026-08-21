// Avatar del fondatore (con logo ML sulla maglia), riutilizzabile in ogni sezione.
export const MikiAvatar = ({ label, subtitle, size = 46, className = "" }) => (
  <div data-testid="miki-avatar" className={`flex items-center gap-2.5 ${className}`}>
    <img
      src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`}
      alt="Michele — MikiLab"
      style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-[#6E8CA0]/60 shadow-sm shrink-0"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
    {(label || subtitle) && (
      <div className="min-w-0 leading-tight">
        {label && <p className="font-display text-sm font-bold text-[#2B303B] dark:text-[#EAF0EC] truncate">{label}</p>}
        {subtitle && <p className="text-[11px] text-[#7E8A93] truncate">{subtitle}</p>}
      </div>
    )}
  </div>
);

// Variante per gli hero colorati: avatar tondo in alto a destra, bordo bianco.
export const HeroAvatar = ({ className = "" }) => (
  <img
    src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`}
    alt="Michele — MikiLab"
    data-testid="section-avatar"
    className={`absolute top-4 right-4 w-14 h-14 rounded-full object-cover ring-2 ring-white/70 shadow-lg ${className}`}
    onError={(e) => { e.currentTarget.style.display = "none"; }}
  />
);

export default MikiAvatar;
