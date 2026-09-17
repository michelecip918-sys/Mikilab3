import SitorAvatar from "@/components/SitorAvatar";

// Wrapper: mantiene la firma storica ma mostra il volto UFFICIALE unico di Sitor.
export default function LivingAvatar3D({ accent = "#8a97a6", className = "", rounded = true, speaking = false }) {
  return <SitorAvatar className={className} round={rounded} speaking={speaking} />;
}
