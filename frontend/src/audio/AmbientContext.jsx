import { createContext, useContext, useState, useCallback } from "react";
import ambient from "@/lib/ambientMusic";

const AmbientContext = createContext(null);

export function AmbientProvider({ children }) {
  const [on, setOn] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [mode, setModeState] = useState("fire");

  const toggle = useCallback(() => {
    setOn((prev) => {
      if (prev) { ambient.disable(); return false; }
      const ok = ambient.enable();
      return ok;
    });
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    ambient.setVolume(v);
  }, []);

  const setMode = useCallback((m) => {
    setModeState(m);
    ambient.setMode(m);
  }, []);

  const setSection = useCallback((name) => ambient.setSection && ambient.setSection(name), []);

  return (
    <AmbientContext.Provider value={{ on, toggle, setSection, volume, setVolume, mode, setMode }}>
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbient() {
  return useContext(AmbientContext) || { on: false, toggle: () => {}, setSection: () => {}, volume: 0.5, setVolume: () => {}, mode: "fire", setMode: () => {} };
}
