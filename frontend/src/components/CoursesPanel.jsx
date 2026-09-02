import { GraduationCap } from "lucide-react";
import { content } from "@/data/content";
import { useLang } from "@/i18n/LanguageContext";

export default function CoursesPanel() {
  const { t, lang } = useLang();
  const courses = content[lang].freeCourses || [];
  return (
    <div className="space-y-4" data-testid="courses-panel">
      <div className="flex items-center gap-2 text-[#7E8A93]">
        <GraduationCap className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("courses_label")}</span>
      </div>
      <p className="text-xs text-[#7E8A93] -mt-1 leading-relaxed">{t("courses_note")}</p>
      {courses.map((c, i) => (
        <div key={i} data-testid={`course-${i}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl overflow-hidden">
          <div className="aspect-video bg-black">
            <iframe
              className="w-full h-full"
              src={c.url}
              title={c.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#c94f00]">{c.category}</span>
              {c.isNew && (
                <span data-testid={`course-new-${i}`} className="text-[10px] font-bold uppercase tracking-wide text-white bg-[#8FB0C2] px-2 py-0.5 rounded-full">{t("course_new")}</span>
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8] mt-0.5">{c.title}</h3>
            <p className="text-xs text-[#7E8A93] mt-1">{t("course_source")}: {c.source} · {c.level}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
