import SitorAvatar from "@/components/SitorAvatar";

// Wrapper: MikiAvatar e HeroAvatar mostrano il volto ufficiale unico di Sitor.
export const MikiAvatar = ({ label, subtitle, size = 46, className = "" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <SitorAvatar size={size} />
    {(label || subtitle) && (
      <div className="min-w-0">
        {label && <p className="text-sm font-bold text-foreground truncate">{label}</p>}
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
    )}
  </div>
);

export const HeroAvatar = ({ className = "" }) => (
  <SitorAvatar className={className} round />
);

export default MikiAvatar;
