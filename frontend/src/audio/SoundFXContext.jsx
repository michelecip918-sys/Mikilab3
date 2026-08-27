import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { playSfx, setSfxVolume } from "@/lib/uiSounds";

const SoundFXContext = createContext({ sfxEnabled: false, toggleSfx: () => {}, sfxVolume: 0.5, setSfxVol: () => {} });
export const useSoundFX = () => useContext(SoundFXContext);

const KEY = "mikilab_sfx_enabled";
const VKEY = "mikilab_sfx_volume";

export function SoundFXProvider({ children }) {
  const [sfxEnabled, setSfxEnabled] = useState(() => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } });
  const [sfxVolume, setVol] = useState(() => { try { const v = Number(localStorage.getItem(VKEY)); return isNaN(v) ? 0.5 : v; } catch { return 0.5; } });
  const enabledRef = useRef(sfxEnabled);
  const lastHover = useRef(0);

  useEffect(() => { enabledRef.current = sfxEnabled; try { localStorage.setItem(KEY, sfxEnabled ? "1" : "0"); } catch { /* */ } }, [sfxEnabled]);
  useEffect(() => { setSfxVolume(sfxVolume); try { localStorage.setItem(VKEY, String(sfxVolume)); } catch { /* */ } }, [sfxVolume]);

  useEffect(() => {
    const onClick = (e) => {
      if (!enabledRef.current) return;
      const el = e.target.closest("button, a, [role='button'], [data-sfx]");
      if (!el) return;
      const kind = el.getAttribute("data-sfx");
      if (kind === "confirm") playSfx("ding");
      else if (kind === "delete") playSfx("cut");
      else if (kind === "save") playSfx("door");
      else playSfx("crunch");
    };
    const onOver = (e) => {
      if (!enabledRef.current) return;
      const nav = e.target.closest("[data-testid^='nav-tab-']");
      if (!nav) return;
      const now = Date.now();
      if (now - lastHover.current < 250) return;
      lastHover.current = now;
      playSfx("puff");
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onOver, true);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("pointerover", onOver, true); };
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxEnabled((v) => { const nv = !v; if (nv) playSfx("ding"); return nv; });
  }, []);

  return (
    <SoundFXContext.Provider value={{ sfxEnabled, toggleSfx, sfxVolume, setSfxVol: setVol }}>
      {children}
    </SoundFXContext.Provider>
  );
}
