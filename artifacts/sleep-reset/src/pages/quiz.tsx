import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, Lock, Moon } from "lucide-react";
import { INTRO, QUESTIONS, ANALYZING_LINES, type Choice } from "@/lib/quiz-data";

// ─── The entry quiz ──────────────────────────────────────────────────────────
// This is the root page: paid traffic lands here. One question per screen, one
// tap to answer, no scroll, and no email until the result page.
// Copy lives in lib/quiz-data.ts — spec: marketing/flu143-enquete-perguntas.md
//
// Flow: intro → 5 questions → analysis → POST /api/quiz/submit → /quiz/result.
// The WIRED sales page it replaced is untouched and still served at /watch.

const STORAGE_KEY = "sw_quiz_v2";
const FEEDBACK_MS = 1100;
const ANALYZE_LINE_MS = 800;

// ─── Tracking ────────────────────────────────────────────────────────────────
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
// Light haptic on tap — makes it feel like an app, not a form. No-op on iOS.
function haptic() {
  try { navigator.vibrate?.(8); } catch {}
}

type Answers = Record<string, string>;
type Screen = { kind: "intro" } | { kind: "question"; index: number } | { kind: "analyzing" };

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [answers, setAnswers] = useState<Answers>({});
  const [feedback, setFeedback] = useState("");
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mount: restore progress, fire pageview, force light theme ──
  useEffect(() => {
    logEvent("quiz_view");
    document.documentElement.classList.remove("dark");
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { answers?: Answers; index?: number };
        if (saved?.answers) setAnswers(saved.answers);
        // Resume mid-quiz, never on the analysis screen.
        if (typeof saved?.index === "number" && saved.index > 0) {
          setScreen({ kind: "question", index: Math.min(saved.index, QUESTIONS.length - 1) });
          started.current = true;
        }
      }
    } catch {}
    // The ad's hook (?h=) rides along to the offer page for message-match.
    try {
      const h = new URLSearchParams(window.location.search).get("h");
      if (h) sessionStorage.setItem("sw_hero_variant", h);
    } catch {}
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  // ── Persist progress ──
  useEffect(() => {
    if (screen.kind !== "question") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: screen.index, answers })); } catch {}
  }, [screen, answers]);

  // ── Analysis screen: reveal one line at a time ──
  useEffect(() => {
    if (screen.kind !== "analyzing") return;
    const t = setInterval(
      () => setAnalyzeStep((i) => Math.min(i + 1, ANALYZING_LINES.length - 1)),
      ANALYZE_LINE_MS,
    );
    return () => clearInterval(t);
  }, [screen.kind]);

  const submit = useCallback(async (finalAnswers: Answers) => {
    setFailed(false);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: clientId(),
          answers: finalAnswers,
          ad_id: getUtm("utm_content"),
          utm_source: getUtm("utm_source"),
          utm_medium: getUtm("utm_medium"),
          utm_campaign: getUtm("utm_campaign"),
          utm_term: getUtm("utm_term"),
          hero_variant: (() => { try { return sessionStorage.getItem("sw_hero_variant") || ""; } catch { return ""; } })(),
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.profile_id) throw new Error("submit failed");
      logEvent("quiz_submit");
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      // Let the three analysis lines finish before the result appears.
      const params = new URLSearchParams(window.location.search);
      params.set("id", data.profile_id);
      setTimeout(
        () => setLocation("/quiz/result?" + params.toString()),
        ANALYZING_LINES.length * ANALYZE_LINE_MS,
      );
    } catch {
      logEvent("quiz_submit_fail");
      setFailed(true);
    }
  }, [setLocation]);

  // ── Answering ──
  function choose(question: (typeof QUESTIONS)[number], choice: Choice, index: number) {
    haptic();
    const next: Answers = { ...answers, [question.key]: choice.key, ...(choice.derives ?? {}) };
    setAnswers(next);
    setFeedback(choice.feedback);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => goForward(index, next), FEEDBACK_MS);
  }

  function goForward(fromIndex: number, current: Answers) {
    setFeedback("");
    logEvent(`quiz_q${fromIndex + 1}_done`);
    if (fromIndex + 1 < QUESTIONS.length) {
      setScreen({ kind: "question", index: fromIndex + 1 });
      window.scrollTo({ top: 0 });
      return;
    }
    logEvent("quiz_questions_done");
    setAnalyzeStep(0);
    setScreen({ kind: "analyzing" });
    void submit(current);
  }

  function goBack(fromIndex: number) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setFeedback("");
    setScreen(fromIndex === 0 ? { kind: "intro" } : { kind: "question", index: fromIndex - 1 });
  }

  function start() {
    haptic();
    if (!started.current) { started.current = true; logEvent("quiz_start"); }
    setScreen({ kind: "question", index: 0 });
  }

  const qIndex = screen.kind === "question" ? screen.index : -1;
  const progress = screen.kind === "intro" ? 0
    : screen.kind === "analyzing" ? 100
    : ((qIndex + 1) / QUESTIONS.length) * 100;

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "#FAFAF7", color: "#1F2937", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Header — brand + counter. Fixed, so the answer area never jumps. */}
      <header className="sticky top-0 z-20 bg-[#FAFAF7]/95 backdrop-blur-sm">
        <div className="max-w-[460px] mx-auto w-full px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-[18px] h-[18px] text-[#0E2541]" />
            <span className="font-bold text-[13px] text-[#0E2541] tracking-tight">Sleep Wired</span>
          </div>
          <span className="text-[12px] font-medium text-[#6B7280] tabular-nums">
            {screen.kind === "question" && `Question ${qIndex + 1} of ${QUESTIONS.length}`}
            {screen.kind === "analyzing" && "Building your result"}
          </span>
        </div>
        <div className="h-[3px] bg-[#EDEDE8]">
          <div
            className="h-[3px] bg-[#C9A14A] transition-[width] duration-500 ease-out"
            style={{ width: progress + "%" }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-[460px] mx-auto px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {screen.kind === "intro" && <Intro onStart={start} />}

        {screen.kind === "question" && (
          <QuestionScreen
            key={qIndex}
            index={qIndex}
            answers={answers}
            feedback={feedback}
            onChoose={choose}
            onBack={() => goBack(qIndex)}
          />
        )}

        {screen.kind === "analyzing" && (
          <Analyzing step={analyzeStep} failed={failed} onRetry={() => void submit(answers)} />
        )}
      </main>
    </div>
  );
}

// ─── Intro ───────────────────────────────────────────────────────────────────
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <span className="inline-flex self-start items-center bg-white border border-[#E5E7EB] text-[#0E2541] text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full mb-6">
        {INTRO.eyebrow}
      </span>
      <h1
        className="text-[2.05rem] leading-[1.1] text-[#0E2541] mb-4"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
      >
        {INTRO.headline}
      </h1>
      <p className="text-[16px] leading-[1.6] text-[#4B5563] mb-8">{INTRO.sub}</p>

      <button
        type="button"
        onClick={onStart}
        className="w-full bg-[#0E2541] active:scale-[0.985] transition-transform text-white font-extrabold text-[17px] min-h-[58px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(14,37,65,0.22)]"
      >
        {INTRO.cta} <ArrowRight className="w-5 h-5" />
      </button>
      <p className="mt-4 text-center text-[13px] text-[#6B7280]">{INTRO.microcopy}</p>
    </div>
  );
}

// ─── One question ────────────────────────────────────────────────────────────
function QuestionScreen({
  index, answers, feedback, onChoose, onBack,
}: {
  index: number;
  answers: Answers;
  feedback: string;
  onChoose: (q: (typeof QUESTIONS)[number], choice: Choice, index: number) => void;
  onBack: () => void;
}) {
  const q = QUESTIONS[index];
  const picked = answers[q.key];

  return (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <h2
        className="text-[1.6rem] leading-[1.18] text-[#0E2541] mb-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
      >
        {q.prompt}
      </h2>
      {q.helper && <p className="text-[14px] text-[#6B7280] mb-5">{q.helper}</p>}

      <div className="space-y-2.5">
        {q.choices.map((c) => {
          const selected = picked === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onChoose(q, c, index)}
              aria-pressed={selected}
              className={
                "w-full text-left px-4 min-h-[60px] py-3 rounded-2xl border-2 flex items-center gap-3 " +
                "transition-all duration-150 active:scale-[0.985] " +
                (selected
                  ? "border-[#0E2541] bg-[#0E2541] text-white shadow-[0_6px_18px_rgba(14,37,65,0.18)]"
                  : "border-[#E7E7E2] bg-white text-[#1F2937]")
              }
            >
              <span className="text-[21px] leading-none shrink-0" aria-hidden="true">{c.emoji}</span>
              <span className="font-medium text-[15.5px] leading-[1.3] flex-1">{c.label}</span>
              <span
                className={
                  "w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors " +
                  (selected ? "bg-[#C9A14A] border-[#C9A14A]" : "border-[#E0E0DA]")
                }
              >
                {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Micro-feedback — information, not praise. Reserved height so nothing
          shifts when it appears. */}
      <div className="mt-4 min-h-[52px]" aria-live="polite">
        <div
          className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 transition-opacity duration-200"
          style={{ background: "rgba(14,37,65,0.06)", opacity: feedback ? 1 : 0 }}
        >
          <span className="w-2 h-2 rounded-full bg-[#C9A14A] shrink-0 mt-[6px]" />
          <span className="text-[14px] leading-[1.4] text-[#0E2541] font-medium">{feedback || " "}</span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] text-[#6B7280] flex items-center gap-1.5 py-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </div>
  );
}

// ─── Analysis ────────────────────────────────────────────────────────────────
function Analyzing({ step, failed, onRetry }: { step: number; failed: boolean; onRetry: () => void }) {
  if (failed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-[16px] text-[#1F2937] mb-1 font-semibold">We couldn't build your result.</p>
        <p className="text-[14px] text-[#6B7280] mb-6">Your answers are saved. One tap and we'll try again.</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-[#0E2541] text-white font-bold text-[16px] px-7 min-h-[52px] rounded-2xl"
        >
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-full border-4 border-[#E5E7EB] border-t-[#C9A14A] animate-spin mb-8" />
      <ul className="space-y-3 w-full max-w-[300px]">
        {ANALYZING_LINES.map((line, i) => {
          if (i > step) return null;
          const done = i < step;
          return (
            <li key={line} className="flex items-center gap-2.5 animate-in fade-in duration-300">
              <span
                className={
                  "w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center " +
                  (done ? "bg-[#C9A14A]" : "border-2 border-[#D7D7D0]")
                }
              >
                {done && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
              </span>
              <span className={"text-[15px] " + (done ? "text-[#9CA3AF]" : "text-[#0E2541] font-semibold")}>
                {line}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-10 text-[12px] text-[#6B7280] flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Your answers stay private
      </p>
    </div>
  );
}
