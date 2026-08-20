import { createContext, useContext, useState, useCallback } from "react";
import ambient from "@/lib/ambientMusic";

const AmbientContext = createContext(null);

export function AmbientProvider({ children }) {
  const [on, setOn] = useState(false);

  const toggle = useCallback(() => {
    setOn((prev) => {
      if (prev) { ambient.disable(); return false; }
      const ok = ambient.enable();
      return ok;
    });
  }, []);

  const setSection = useCallback((name) => ambient.setSection(name), []);

  return (
    <AmbientContext.Provider value={{ on, toggle, setSection }}>
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbient() {
  return useContext(AmbientContext) || { on: false, toggle: () => {}, setSection: () => {} };
}
