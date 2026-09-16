import { useState, useEffect, useCallback } from "react";
import { Building2 } from "lucide-react";
import { orgsApi } from "@/lib/api";

// Badge compatto con il nome dell'azienda ATTIVA (solo Capo autenticato).
export const OrgBadge = () => {
  const [name, setName] = useState("");
  const load = useCallback(() => {
    orgsApi.list().then((d) => {
      const act = (d?.orgs || []).find((o) => o.is_active) || (d?.orgs || [])[0];
      setName(act?.name || "");
    }).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("mikilab-org-changed", onChange);
    return () => window.removeEventListener("mikilab-org-changed", onChange);
  }, [load]);
  if (!name) return null;
  return (
    <div data-testid="org-badge" title={name}
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D97736]/40 bg-[#D97736]/10 max-w-[180px]">
      <Building2 className="w-3.5 h-3.5 text-[#D97736] shrink-0" />
      <span className="text-[11px] font-bold text-[#D97736] truncate">{name}</span>
    </div>
  );
};

export default OrgBadge;
