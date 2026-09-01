import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Profilo utente MikiLab: "pro" (Laboratorio B2B) o "passion" (Home-Baker B2C).
// Adatta navigazione, moduli visibili e UX per tutta la sessione.
const Ctx = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(() => { try { return localStorage.getItem("mikilab_profile") || "passion"; } catch { return "passion"; } });
  const [selecting, setSelecting] = useState(false);

  const chooseProfile = useCallback((p) => {
    try {
      localStorage.setItem("mikilab_profile", p);
      // PRO => Modalità Farina attiva di default; PASSION => disattivata.
      localStorage.setItem("mikilab_lab_big", p === "pro" ? "1" : "0");
    } catch { /* */ }
    setProfileState(p);
    setSelecting(false);
    window.dispatchEvent(new CustomEvent("mikilab-profile-changed", { detail: { profile: p } }));
  }, []);

  const openSelector = useCallback(() => setSelecting(true), []);

  useEffect(() => {
    const h = () => setSelecting(true);
    window.addEventListener("mikilab-open-profile", h);
    return () => window.removeEventListener("mikilab-open-profile", h);
  }, []);

  return (
    <Ctx.Provider value={{ profile, selecting, chooseProfile, openSelector }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProfile() {
  return useContext(Ctx) || { profile: null, selecting: false, chooseProfile: () => {}, openSelector: () => {} };
}
