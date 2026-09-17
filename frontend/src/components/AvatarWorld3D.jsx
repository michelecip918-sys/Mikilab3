import SitorAvatar from "@/components/SitorAvatar";

// Wrapper: scena avatar unificata sul volto ufficiale di Sitor.
export default function AvatarWorld3D({ speaking = false, className = "" }) {
  return <SitorAvatar className={`w-full h-full ${className}`} round={false} speaking={speaking} />;
}
