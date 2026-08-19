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
                ? "bg-[#B34A26] text-white border-[#B34A26]"
                : "bg-white dark:bg-[#2A211D] text-[#4A3B34] dark:text-[#C9BBB0] border-[#E8DEC8] dark:border-[#3D302A]"
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
