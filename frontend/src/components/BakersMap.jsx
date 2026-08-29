import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Loader2, Trash2, Navigation, Store } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { bakersApi } from "@/lib/api";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Mappa dei Fornai MikiLab — Leaflet + OpenStreetMap (nessuna chiave). Posizione opt-in e approssimata.
export default function BakersMap({ open, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [pins, setPins] = useState([]);
  const [mine, setMine] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [coords, setCoords] = useState(null); // {lat,lng}
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [all, me] = await Promise.all([bakersApi.map(), bakersApi.me()]);
    setPins(Array.isArray(all) ? all : []);
    setMine(me || null);
    if (me) { setName(me.name || ""); setCity(me.city || ""); setBio(me.bio || ""); setLink(me.link || ""); setCoords({ lat: me.lat, lng: me.lng }); }
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  // Init mappa
  useEffect(() => {
    if (!open || !mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView([46, 9], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "© OpenStreetMap",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { try { map.remove(); } catch { /* */ } mapRef.current = null; };
  }, [open]);

  // Aggiorna marker
  useEffect(() => {
    const map = mapRef.current; const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const mkIcon = (mineFlag) => L.divIcon({
      className: "", html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${mineFlag ? "⭐" : "🥖"}</div>`,
      iconSize: [26, 26], iconAnchor: [13, 24],
    });
    const list = [...pins];
    if (mine && !pins.some((p) => p.lat === mine.lat && p.lng === mine.lng && p.name === mine.name)) list.push(mine);
    list.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const isMine = mine && p.name === mine.name && p.lat === mine.lat && p.lng === mine.lng;
      const m = L.marker([p.lat, p.lng], { icon: mkIcon(isMine) }).addTo(layer);
      const safe = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? safe(u) : "");
      const lurl = safeUrl(p.link);
      const linkHtml = lurl ? `<br/><a href="${lurl}" target="_blank" rel="noopener noreferrer" style="color:#ff6b00;font-weight:600">🔗 ${safe((p.link || "").replace(/^https?:\/\//, ""))}</a>` : "";
      m.bindPopup(`<b>${safe(p.name)}</b>${p.city ? `<br/>📍 ${safe(p.city)}` : ""}${p.bio ? `<br/><span style="color:#555">${safe(p.bio)}</span>` : ""}${linkHtml}`);
    });
    if (list.length) {
      try { map.fitBounds(L.latLngBounds(list.map((p) => [p.lat, p.lng])).pad(0.3), { maxZoom: 8 }); } catch { /* */ }
    }
  }, [pins, mine]);

  const useGeo = () => {
    if (!navigator.geolocation) { toast.error(tri("GPS non disponibile", "GPS nicht verfügbar", "GPS unavailable", "GPS no disponible")); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setBusy(false); toast.success(tri("Posizione presa dal GPS", "Standort per GPS erfasst", "Location from GPS", "Ubicación por GPS")); },
      () => { setBusy(false); toast.error(tri("Permesso GPS negato: scrivi la città.", "GPS verweigert: Stadt eingeben.", "GPS denied: type your city.", "GPS denegado: escribe la ciudad.")); },
      { timeout: 8000 }
    );
  };

  const geocodeCity = async () => {
    if (!city.trim()) return null;
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=${lang}`);
      const j = await r.json();
      const results = (j.results || []).slice().sort((a, b) => (b.population || 0) - (a.population || 0));
      const g = results[0];
      if (g) { setCity(`${g.name}${g.country ? ", " + g.country : ""}`); return { lat: g.latitude, lng: g.longitude, country: g.country || "" }; }
    } catch { /* */ }
    return null;
  };

  const save = async () => {
    setBusy(true);
    try {
      let c = coords; let country = "";
      if (!c) { const g = await geocodeCity(); if (g) { c = { lat: g.lat, lng: g.lng }; country = g.country; } }
      if (!c) { toast.error(tri("Indica la città o usa il GPS.", "Stadt angeben oder GPS nutzen.", "Enter a city or use GPS.", "Indica la ciudad o usa GPS.")); setBusy(false); return; }
      await bakersApi.save({ name: name.trim(), city: city.trim(), country, bio: bio.trim(), link: link.trim(), lat: c.lat, lng: c.lng });
      toast.success(tri("Sei sulla mappa! 🥖", "Du bist auf der Karte! 🥖", "You're on the map! 🥖", "¡Estás en el mapa! 🥖"));
      setShowForm(false); setCoords(null); await load();
    } catch { toast.error(tri("Salvataggio non riuscito", "Speichern fehlgeschlagen", "Save failed", "Error al guardar")); }
    finally { setBusy(false); }
  };

  const removeMe = async () => {
    setBusy(true);
    try { await bakersApi.remove(); setMine(null); toast.success(tri("Rimosso dalla mappa", "Von der Karte entfernt", "Removed from map", "Eliminado del mapa")); setShowForm(false); await load(); }
    catch { /* */ } finally { setBusy(false); }
  };

  if (!open) return null;
  const inp = "w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  return (
    <div className="fixed inset-0 z-[80] bg-[#12212e] flex flex-col" data-testid="bakers-map">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white">
        <div className="flex items-center gap-2"><Store className="w-5 h-5" /><p className="font-semibold">{tri("Mappa dei Fornai", "Bäcker-Karte", "Bakers Map", "Mapa de Panaderos")}</p><span className="text-white/60 text-xs">({pins.length})</span></div>
        <button data-testid="bakers-map-close" onClick={onClose} className="p-2 rounded-full bg-white/15 active:scale-90"><X className="w-5 h-5" /></button>
      </div>
      <div ref={mapEl} data-testid="bakers-map-canvas" className="flex-1 w-full" style={{ minHeight: 0 }} />

      <div className="bg-[#121212] dark:bg-[#121212] border-t border-[#2e2e2e] dark:border-[#2e2e2e] p-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        {!showForm ? (
          <button data-testid="bakers-optin-toggle" onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] text-white font-semibold py-3 rounded-2xl active:scale-98">
            <MapPin className="w-5 h-5" /> {mine ? tri("Modifica la mia posizione", "Meinen Standort bearbeiten", "Edit my location", "Editar mi ubicación") : tri("Mettimi sulla mappa", "Auf die Karte setzen", "Put me on the map", "Ponme en el mapa")}
          </button>
        ) : (
          <div data-testid="bakers-form" className="space-y-2">
            <input data-testid="bakers-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome / forno", "Name / Bäckerei", "Name / bakery", "Nombre / panadería")} className={inp} />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input data-testid="bakers-city" value={city} onChange={(e) => { setCity(e.target.value); setCoords(null); }} placeholder={tri("Città", "Stadt", "City", "Ciudad")} className={inp} />
              <button data-testid="bakers-gps" onClick={useGeo} disabled={busy} className="px-3 rounded-xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00]" title="GPS">{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}</button>
            </div>
            <input data-testid="bakers-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder={tri("Due parole su di te (facoltativo)", "Kurz über dich (optional)", "A short bio (optional)", "Bio breve (opcional)")} className={inp} />
            <input data-testid="bakers-link" value={link} onChange={(e) => setLink(e.target.value)} maxLength={200} placeholder={tri("Sito o Instagram (facoltativo)", "Website oder Instagram (optional)", "Website or Instagram (optional)", "Web o Instagram (opcional)")} className={inp} />
            <p className="text-[10.5px] text-[#7E8A93]">{tri("La posizione è approssimata alla città (privacy). Comparire è facoltativo.", "Standort auf Stadt gerundet (Privatsphäre). Freiwillig.", "Location is rounded to the city (privacy). Opt-in.", "Ubicación aproximada a la ciudad (privacidad). Opcional.")}</p>
            <div className="flex gap-2">
              <button data-testid="bakers-save" onClick={save} disabled={busy} className="flex-1 bg-[#ff6b00] text-white font-semibold py-2.5 rounded-xl active:scale-98 disabled:opacity-50">{busy ? "…" : tri("Salva", "Speichern", "Save", "Guardar")}</button>
              {mine && <button data-testid="bakers-remove" onClick={removeMe} disabled={busy} className="px-3 rounded-xl bg-[#ff6b00]/15 text-[#ff6b00]"><Trash2 className="w-5 h-5" /></button>}
              <button data-testid="bakers-cancel" onClick={() => setShowForm(false)} className="px-3 rounded-xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#7E8A93]"><X className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
