import Beginners from "@/sections/Beginners";

// Impara: guida per principianti / laboratorio in versione semplice.
// (News spostate in Home; Enciclopedia spostata in Ricette.)
export default function LearnHub({ onNavigate }) {
  return <Beginners onNavigate={onNavigate} />;
}
