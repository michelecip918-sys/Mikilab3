import { useEffect, useState } from "react";

// Avatar di Miki-Nexus con occhio rosso REATTIVO: pulsa quando l'impianto e' in stato critico.
// Lo stato arriva via evento window "mikilab-mood" emesso dal polling del deck in App.js.
export const NexusAvatar = ({ size = 56, className = "", eyeLeft = "63%", eyeTop = "33%" }) => {
  const [alert, setAlert] = useState(false);
  useEffect(() => {
    const onMood = (e) => setAlert(e.detail === "critico");
    window.addEventListener("mikilab-mood", onMood);
    return () => window.removeEventListener("mikilab-mood", onMood);
  }, []);
  return (
    <div data-testid="nexus-avatar" className={`relative rounded-full overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <img src="/avatar_nexus.jpg" alt="Miki-Nexus" className="w-full h-full object-cover object-top"
        onError={(e) => { e.currentTarget.style.display = "none"; }} />
      {alert && (
        <>
          <span data-testid="nexus-red-eye" className="absolute rounded-full animate-ping"
            style={{ left: eyeLeft, top: eyeTop, width: size * 0.14, height: size * 0.14, background: "rgba(244,63,94,0.85)", boxShadow: "0 0 12px 4px rgba(244,63,94,0.8)", transform: "translate(-50%,-50%)" }} />
          <span className="absolute rounded-full animate-pulse"
            style={{ left: eyeLeft, top: eyeTop, width: size * 0.09, height: size * 0.09, background: "#ff1f3d", boxShadow: "0 0 10px 3px rgba(255,31,61,0.9)", transform: "translate(-50%,-50%)" }} />
        </>
      )}
    </div>
  );
};
