import { useEffect } from "react";
import { Moon } from "lucide-react";

// Direct hits to /quiz/result?id=PROFILE_ID redirect to the homepage with
// hero variant matched to the quiz type. The quiz flow itself bypasses this
// page entirely (quiz.tsx redirects straight to /). Kept for users who land
// here via stored URL, browser back-button, or shared link.
const TYPE_TO_HERO: Record<string, string> = {
  onset: "hyperarousal",
  maintenance: "wake3am",
  mixed: "default",
  circadian: "melatonin",
};

export default function QuizResult() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { window.location.href = "/quiz"; return; }

    fetch("/api/quiz/profile/" + encodeURIComponent(id))
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !d?.profile) { window.location.href = "/quiz"; return; }
        const hero = TYPE_TO_HERO[d.profile.type] || "default";
        const out = new URLSearchParams(window.location.search);
        out.delete("id");
        out.set("h", hero);
        out.set("qp", id);
        window.location.href = "/?" + out.toString();
      })
      .catch(() => { window.location.href = "/quiz"; });

    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#FAFAF7" }}>
      <div className="text-center">
        <Moon className="w-8 h-8 text-[#0E2541] mx-auto mb-3" />
        <div className="w-8 h-8 rounded-full border-4 border-[#0E2541] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6B7280]">Loading your personalized program…</p>
      </div>
    </div>
  );
}
