import { useState } from "react";
import { MessageCircle, Camera } from "lucide-react";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import { useLang } from "@/i18n/LanguageContext";

export default function MaestroAI() {
  const { t } = useLang();
  const [tab, setTab] = useState("chat");

  const TABS = [
    { id: "chat", label: t("ai_tab_chat"), Icon: MessageCircle },
    { id: "foto", label: t("ai_tab_foto"), Icon: Camera },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            data-testid={`ai-tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold border transition-colors ${
              tab === id
                ? "bg-[#3f7cac] text-white border-[#3f7cac]"
                : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#d5e4f0] dark:border-[#38424B]"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {tab === "chat" ? <MaestroSaTutto /> : <PhotoDiagnosi />}
    </div>
  );
}
