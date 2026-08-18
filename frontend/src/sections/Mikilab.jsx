import RecipeList from "@/components/RecipeList";
import CoursesPanel from "@/components/CoursesPanel";
import { useLang } from "@/i18n/LanguageContext";
import { content, COURSES_VERSION } from "@/data/content";
import { Heart, ChefHat, Wheat, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const COURSES_SEEN_KEY = "mikilab_courses_v";

export default function Mikilab() {
  const { t, lang } = useLang();
  const [imgOk, setImgOk] = useState(true);
  const [view, setView] = useState("main");
  const [coursesNew, setCoursesNew] = useState(false);
  const lm = content[lang].lievitoMadre;

  const hasNewCourses = content[lang].freeCourses?.some((c) => c.isNew);

  useEffect(() => {
    const seen = Number(localStorage.getItem(COURSES_SEEN_KEY) || 0);
    if (hasNewCourses && seen !== COURSES_VERSION) {
      setCoursesNew(true);
      toast(t("courses_toast_new"), { icon: "🎓", duration: 6000 });
      try {
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(t("courses_notify_title"), { body: t("courses_notify_body"), tag: "mikilab-courses" });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((p) => {
              if (p === "granted") new Notification(t("courses_notify_title"), { body: t("courses_notify_body"), tag: "mikilab-courses" });
            });
          }
        }
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line
  }, []);

  const openCourses = () => {
    localStorage.setItem(COURSES_SEEN_KEY, String(COURSES_VERSION));
    setCoursesNew(false);
    setView("corsi");
  };

  if (view === "lievito" || view === "corsi") {
    return (
      <div className="pb-4">
        <button
          data-testid="mikilab-back-btn"
          onClick={() => setView("main")}
          className="flex items-center gap-1 text-[#B34A26] font-medium mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> Mikilab
        </button>
        {view === "lievito" && (
          <div data-testid="lievito-page" className="space-y-4">
            <div className="rounded-2xl p-5 bg-[#D99B26]/12 border border-[#D99B26]/40">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="w-5 h-5 text-[#B34A26]" />
                <h2 className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("lm_page_title")}</h2>
              </div>
              <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{lm.intro}</p>
            </div>
            {lm.sections.map((s, i) => (
              <div key={i} data-testid={`lm-section-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
                <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{s.title}</h3>
                <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        )}
        {view === "corsi" && <CoursesPanel />}
      </div>
    );
  }

  return (
    <div>
      <div data-testid="bio-card" className="mb-5 rounded-3xl p-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">{t("bio_title")}</h2>
        </div>
        <div className="flex items-start gap-4">
          <div data-testid="bio-photo" className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-white/15 border-2 border-white/40 flex items-center justify-center">
            {imgOk ? (
              <img
                src={`${process.env.PUBLIC_URL}/bio-photo.jpg`}
                alt="Mikilab"
                className="w-full h-full object-cover"
                onError={() => setImgOk(false)}
              />
            ) : (
              <ChefHat className="w-9 h-9 text-white/80" />
            )}
          </div>
          <p className="text-sm text-white/90 leading-relaxed flex-1">{t("bio_text")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-5">
        <button
          data-testid="lievito-open-btn"
          onClick={() => setView("lievito")}
          className="w-full flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
            <Wheat className="w-6 h-6 text-[#B34A26]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t("tab_lievito")}</h3>
            <p className="text-sm text-[#8C7567] truncate">{t("lm_page_title")}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
        </button>

        <button
          data-testid="corsi-open-btn"
          onClick={openCourses}
          className="relative w-full flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#6B8E62]/15 border border-[#6B8E62]/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-[#4d6b45] dark:text-[#9ec48f]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t("tab_corsi")}</h3>
            <p className="text-sm text-[#8C7567] truncate">{t("courses_label")}</p>
          </div>
          {coursesNew && (
            <span data-testid="courses-new-dot" className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#E5AC3A]" />
          )}
          <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
        </button>
      </div>

      <RecipeList
        collectionName="mikilab"
        readOnly
        heroImage="https://images.unsplash.com/photo-1675725291010-cb1020860cb2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxhcnRpc2FuJTIwc291cmRvdWdoJTIwYnJlYWQlMjBiYWtlcnklMjB3b29kJTIwb3ZlbiUyMGZsb3VyfGVufDB8fHx8MTc4Njk4MjgxOXww&ixlib=rb-4.1.0&q=85"
        heroTitle={t("mikilab_title")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />
    </div>
  );
}
