import { createContext, useContext, useEffect, useState, useRef } from "react";
import { bakoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

// Battito Impianto Unico: un solo polling live che alimenta 3D, Emergenze e AGV.
const HeartbeatCtx = createContext(null);
export const useHeartbeat = () => useContext(HeartbeatCtx);

export function PlantHeartbeatProvider({ children }) {
  const { lang } = useLang();
  const [hb, setHb] = useState(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    let stop = false;
    const load = () => bakoApi.heartbeat(langRef.current).then((d) => { if (!stop) setHb(d); }).catch(() => { /* */ });
    load();
    const iv = setInterval(load, 4000);
    return () => { stop = true; clearInterval(iv); };
  }, []);

  return <HeartbeatCtx.Provider value={hb}>{children}</HeartbeatCtx.Provider>;
}
