import {
  Calendar, Bot, Sparkles, Zap, Timer, Compass, BarChart3, Package, ShoppingCart,
  Factory, Users, Wheat, Croissant, Wrench, FileText, ShieldCheck, Siren, Truck,
  Slice, Radar, Wind, Leaf, Thermometer, Globe, Eye, Megaphone, Smile, Settings,
  Satellite, Gauge, Star, ClipboardList,
} from "lucide-react";

// Mappa le vecchie emoji dei pannelli a icone lucide monocromatiche (look professionale).
const MAP = {
  "🗓️": Calendar, "🤖": Bot, "✨": Sparkles, "✦": Star, "⚡": Zap, "⏱️": Timer,
  "🧭": Compass, "📊": BarChart3, "📦": Package, "🛒": ShoppingCart, "🏭": Factory,
  "👥": Users, "🌾": Wheat, "🥖": Wheat, "🧁": Croissant, "🧰": Wrench, "🧾": FileText,
  "🛡️": ShieldCheck, "🚨": Siren, "🚚": Truck, "🔪": Slice, "🛰️": Satellite,
  "💨": Wind, "🌿": Leaf, "🌡️": Thermometer, "🌐": Globe, "👁️": Eye, "📣": Megaphone,
  "🙂": Smile, "⚙️": Settings, "🎯": Gauge,
};

export function PanelIcon({ icon, className = "w-5 h-5", color = "currentColor" }) {
  if (!icon) return null;
  const Cmp = MAP[icon];
  if (!Cmp) return <span className="text-lg leading-none">{icon}</span>;
  return <Cmp className={className} style={{ color }} strokeWidth={1.75} />;
}
