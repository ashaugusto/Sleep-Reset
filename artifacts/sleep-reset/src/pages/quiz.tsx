import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Moon, Shield, Check } from "lucide-react";
import { gtm } from "@/lib/gtm";

// ─── Quiz definition ─────────────────────────────────────────────────────────
type Choice = { key: string; label: string };
type Question = {
  key: string;
  prompt: string;
  helper?: string;
  choices: Choice[];
  multi?: boolean;
};

const QUESTIONS: Question[] = [
  {
    key: "age",
    prompt: "What's your age range?",
    choices: [
      { key: "25_34", label: "25–34" },
      { key: "35_44", label: "35–44" },
      { key: "45_54", label: "45–54" },
      { key: "55_plus", label: "55+" },
    ],
  },
  {
    key: "gender",
    prompt: "Gender",
    choices: [
      { key: "female", label: "Female" },
      { key: "male", label: "Male" },
      { key: "other", label: "Other / prefer not to say" },
    ],
  },
  {
    key: "main_problem",
    prompt: "What's the main problem most nights?",
    helper: "Pick the one that bothers you most.",
    choices: [
      { key: "cant_fall_asleep", label: "I can't fall asleep" },
      { key: "wake_3am", label: "I wake at 3–4am and can't get back" },
      { key: "both", label: "Both — onset AND middle of the night" },
      { key: "light_all_night", label: "Light, broken sleep all night" },
    ],
  },
  {
    key: "duration",
    prompt: "How long has this been going on?",
    choices: [
      { key: "lt_3mo", label: "Less than 3 months" },
      { key: "3_12mo", label: "3 months – 1 year" },
      { key: "1_3y", label: "1 – 3 years" },
      { key: "3y_plus", label: "More than 3 years" },
    ],
  },
  {
    key: "frequency",
    prompt: "How many nights per week is it bad?",
    choices: [
      { key: "every_night", label: "Every single night" },
      { key: "4_6_per_wk", label: "4 – 6 nights" },
      { key: "2_3_per_wk", label: "2 – 3 nights" },
      { key: "occasional", label: "Less than 2 nights" },
    ],
  },
  {
    key: "day_impact",
    prompt: "What's worst about the day after?",
    choices: [
      { key: "no_energy", label: "No energy — I'm wiped out" },
      { key: "brain_fog", label: "Brain fog — I can't think clearly" },
      { key: "bad_mood", label: "Mood — I'm irritable or flat" },
      { key: "anxious", label: "Anxiety — I dread bedtime" },
    ],
  },
  {
    key: "tried",
    prompt: "What have you tried before?",
    helper: "Select all that apply.",
    multi: true,
    choices: [
      { key: "prescription", label: "Prescription sleep meds" },
      { key: "otc_supplements", label: "Melatonin / supplements" },
      { key: "apps", label: "Meditation apps (Calm, Headspace…)" },
      { key: "therapy", label: "Therapy / CBT" },
      { key: "nothing", label: "Nothing yet — this is my first attempt" },
    ],
  },
  {
    key: "recent_stress",
    prompt: "Anything stressful in the last 12 months?",
    helper: "Big life event, work pressure, health, family.",
    choices: [
      { key: "yes", label: "Yes — something specific" },
      { key: "always", label: "I always have stress" },
      { key: "no", label: "No, life is steady" },
    ],
  },
  {
    key: "shift_work",
    prompt: "Shift work or irregular schedule?",
    helper: "Includes night shifts, jet-lag every month, on-call.",
    choices: [
      { key: "yes", label: "Yes" },
      { key: "no", label: "No" },
    ],
  },
  {
    key: "outcome",
    prompt: "If this got fixed, what would change for you?",
    helper: "Pick the one that matters most.",
    choices: [
      { key: "energy_back", label: "I'd have my energy back" },
      { key: "patience_with_family", label: "I'd be patient with my family again" },
      { key: "career_focus", label: "I could focus at work" },
      { key: "stop_dreading", label: "I'd stop dreading bedtime" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clientId(): string {
  try {
    let id = localStorage.getItem("sw_cid");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("sw_cid", id);
    }
    return id;
  } catch { return String(Date.now()); }
}
function getUtm(name: string): string {
  try { return new URLSearchParams(window.location.search).get(name) || ""; } catch { return ""; }
}
function getCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    return m ? m[1] : "";
  } catch { return ""; }
}
function logEvent(event: string) {
  try {
    void fetch("/api/sw/e", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ad_id: getUtm("utm_content"), client_id: clientId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const STORAGE_KEY = "sw_quiz_progress";

// ─── Main component ──────────────────────────────────────────────────────────
export default function Quiz() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1 = questions; .length = capture; .length+1 = submitting
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const fired = useRef<Set<string>>(new Set());

  // Restore progress on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers) setAnswers(parsed.answers);
        if (typeof parsed?.step === "number") setStep(Math.min(parsed.step, QUESTIONS.length));
      }
    } catch {}
    if (!fired.current.has("start")) {
      fired.current.add("start");
      logEvent("quiz_start");
    }
    // Record which ad-hook the visitor arrived from (?h=) so it's stored on the
    // sleep_profile and carried to the homepage hero for message-match.
    try {
      const adHook = new URLSearchParams(window.location.search).get("h");
      if (adHook) window.sessionStorage.setItem("sw_hero_variant", adHook);
    } catch {}
    document.documentElement.classList.remove("dark");
  }, []);

  // Persist progress
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers })); } catch {}
  }, [step, answers]);

  function pick(qKey: string, choiceKey: string, multi?: boolean) {
    setAnswers((prev) => {
      if (multi) {
        const cur = Array.isArray(prev[qKey]) ? (prev[qKey] as string[]) : [];
        const next = cur.includes(choiceKey) ? cur.filter((c) => c !== choiceKey) : [...cur, choiceKey];
        return { ...prev, [qKey]: next };
      }
      return { ...prev, [qKey]: choiceKey };
    });
    if (!multi) {
      // Auto-advance on single-select
      setTimeout(() => advance(), 200);
    }
  }

  function advance() {
    setStep((s) => {
      const next = s + 1;
      if (next === QUESTIONS.length) logEvent("quiz_questions_done");
      return next;
    });
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function submitCapture() {
    setErr("");
    const emailClean = email.trim().toLowerCase();
    if (!/^.+@.+\..+$/.test(emailClean)) { setErr("Please enter a valid email."); return; }
    setSubmitting(true);
    try {
      // 1) Submit answers, get profile id + type
      const submitRes = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: clientId(),
          answers,
          ad_id: getUtm("utm_content"),
          utm_source: getUtm("utm_source"),
          utm_medium: getUtm("utm_medium"),
          utm_campaign: getUtm("utm_campaign"),
          utm_term: getUtm("utm_term"),
          hero_variant: typeof window !== "undefined" ? window.sessionStorage.getItem("sw_hero_variant") || "" : "",
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok || !submitData?.profile_id) {
        setErr("Could not save your quiz. Please try again.");
        setSubmitting(false);
        return;
      }
      // 2) Capture email + WA — shared eventID for browser pixel ↔ server CAPI dedup
      const leadEventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const capRes = await fetch("/api/quiz/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: submitData.profile_id,
          email: emailClean,
          event_id: leadEventId,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
        }),
      });
      const capData = await capRes.json();
      if (!capRes.ok) {
        setErr(capData?.error || "Could not save contact info.");
        setSubmitting(false);
        return;
      }
      // Pixel Lead (sub-event for Meta learning; campaign optimization stays Purchase)
      // + custom QuizComplete (audience-building hook for retargeting later)
      gtm.quizComplete(submitData.type, emailClean, leadEventId);
      logEvent("quiz_complete");
      try { localStorage.removeItem(STORAGE_KEY); } catch {}

      // 3) Redirect to homepage, preserving ALL original ad UTMs (Meta attribution intact).
      // Hero (message-match): the AD's hook wins — the visitor clicked that promise, and the
      // VSL's narrative mirrors it (3am opening / "tried everything" / authority / "asleep in 15").
      // Only when the ad carries no hook do we fall back to the quiz-type mapping.
      const HERO_KEYS = new Set(["default", "hyperarousal", "melatonin", "wake3am", "notyourself"]);
      const typeToHero: Record<string, string> = {
        onset: "hyperarousal",       // "your brain forgot how to shut down"
        maintenance: "wake3am",      // "it's 3:47am. the house is asleep. your brain isn't."
        mixed: "default",            // "remember what it felt like to wake up rested"
        circadian: "melatonin",      // "you've tried everything. still awake at 3am."
      };
      const adHook = new URLSearchParams(window.location.search).get("h");
      const hero = (adHook && HERO_KEYS.has(adHook)) ? adHook : (typeToHero[submitData.type] || "default");
      const out = new URLSearchParams(window.location.search);
      out.set("h", hero);
      out.set("qp", submitData.profile_id);
      // Reach the homepage at "/" — preserves UTMs for attribution
      window.location.href = "/?" + out.toString();
    } catch (e) {
      setErr("Network error — please try again.");
      setSubmitting(false);
    }
  }

  const totalSteps = QUESTIONS.length + 1; // +1 capture
  const isQuestionStep = step < QUESTIONS.length;
  const isCaptureStep = step === QUESTIONS.length;
  const q = isQuestionStep ? QUESTIONS[step] : null;
  const progressPct = Math.min(100, ((step + 1) / totalSteps) * 100);

  return (
    <div
      className="min-h-[100dvh]"
      style={{ background: "#FAFAF7", color: "#1F2937", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-[#EFEFEC] bg-[#FAFAF7] sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#0E2541]" />
            <span className="font-bold text-sm text-[#0E2541] tracking-tight">Sleep Wired</span>
          </div>
          <span className="text-[11px] text-[#6B7280] tabular-nums">
            Step {Math.min(step + 1, totalSteps)} of {totalSteps}
          </span>
        </div>
        <div className="h-1 bg-[#EFEFEC]">
          <div className="h-1 bg-[#C9A14A] transition-all" style={{ width: progressPct + "%" }} />
        </div>
      </header>

      {/* Body */}
      <main className="max-w-xl mx-auto px-5 py-8">
        {isQuestionStep && q && (
          <div>
            <h1
              className="text-[1.6rem] sm:text-[1.9rem] leading-[1.15] text-[#0E2541] mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              {q.prompt}
            </h1>
            {q.helper && <p className="text-sm text-[#6B7280] mb-5">{q.helper}</p>}

            <div className="space-y-2.5">
              {q.choices.map((c) => {
                const selected = q.multi
                  ? Array.isArray(answers[q.key]) && (answers[q.key] as string[]).includes(c.key)
                  : answers[q.key] === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => pick(q.key, c.key, q.multi)}
                    className={
                      "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 " +
                      (selected
                        ? "border-[#0E2541] bg-[#0E2541] text-white"
                        : "border-[#E5E7EB] bg-white hover:border-[#C9A14A] text-[#1F2937]")
                    }
                  >
                    <span className="font-medium text-base">{c.label}</span>
                    {selected && <Check className="w-5 h-5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Nav for multi-select (needs explicit continue) */}
            {q.multi && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="text-sm text-[#6B7280] hover:text-[#0E2541] disabled:opacity-40 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={advance}
                  disabled={!Array.isArray(answers[q.key]) || (answers[q.key] as string[]).length === 0}
                  className="bg-[#C9A14A] hover:bg-[#B58D38] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Back-only nav for single-select (auto-advances forward) */}
            {!q.multi && step > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={back}
                  className="text-sm text-[#6B7280] hover:text-[#0E2541] flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
            )}
          </div>
        )}

        {isCaptureStep && (
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#0E2541] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Shield className="w-3 h-3 text-[#166534]" />
              Analysis ready
            </div>
            <h1
              className="text-[1.6rem] sm:text-[1.9rem] leading-[1.15] text-[#0E2541] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              Where do we send your Sleep Type report?
            </h1>
            <p className="text-sm text-[#4B5563] mb-6">
              We'll send your personalized analysis and 7-night protocol via email — including the exact mechanism behind your insomnia type and what fixes it.
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-[0.14em] mb-1.5">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white focus:border-[#0E2541] focus:outline-none text-base"
                />
              </label>
              {err && <p className="text-sm text-red-600 font-medium">{err}</p>}

              <button
                type="button"
                onClick={submitCapture}
                disabled={submitting}
                className="w-full bg-[#C9A14A] hover:bg-[#B58D38] text-white font-extrabold text-base py-4 rounded-xl shadow-[0_8px_28px_rgba(201,161,74,0.32)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? "Analyzing…" : (<>See my Sleep Type <ArrowRight className="w-5 h-5" /></>)}
              </button>

              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={back}
                  className="text-sm text-[#6B7280] hover:text-[#0E2541] flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-[11px] text-[#6B7280]">Free · No spam · 1 follow-up max</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
