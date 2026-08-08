import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QUESTIONS, ANALYZE_LINE_MS, type Choice } from "@/lib/quiz-data";
import { useI18n, fill, withLocale, type Dict } from "@/lib/i18n";
import { FunnelHeader } from "@/components/funnel-chrome";
import { clientId, getParam, getCookie, logEvent, haptic } from "@/lib/funnel-track";
import "@/styles/funnel.css";

// ─── The entry quiz ──────────────────────────────────────────────────────────
// This is the root page: paid traffic lands here. One question per screen, one
// tap to answer, no scroll, and no email until the result page.
//
// Structure (question order, answer slugs) lives in lib/quiz-data.ts because
// the API scores from it. Words live in src/locales/*. The look lives in
// styles/funnel.css and is shared with /quiz/result and /plan.
//
// Flow: intro → 5 questions → analysis → POST /api/quiz/submit → /quiz/result.

const STORAGE_KEY = "sw_quiz_v2";
const FEEDBACK_MS = 1100;
const KEYS = "ABCDE";

type Answers = Record<string, string>;
type Screen = { kind: "intro" } | { kind: "question"; index: number } | { kind: "analyzing" };

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [answers, setAnswers] = useState<Answers>({});
  const [feedback, setFeedback] = useState("");
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mount: restore progress, fire pageview ──
  useEffect(() => {
    logEvent("quiz_view");
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
      const h = getParam("h");
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
    const t2 = setInterval(
      () => setAnalyzeStep((i) => Math.min(i + 1, t.quiz.analyzing.length - 1)),
      ANALYZE_LINE_MS,
    );
    return () => clearInterval(t2);
  }, [screen.kind, t]);

  const submit = useCallback(async (finalAnswers: Answers) => {
    setFailed(false);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: clientId(),
          answers: finalAnswers,
          ad_id: getParam("utm_content"),
          utm_source: getParam("utm_source"),
          utm_medium: getParam("utm_medium"),
          utm_campaign: getParam("utm_campaign"),
          utm_term: getParam("utm_term"),
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
      const params = withLocale(new URLSearchParams(window.location.search));
      params.set("id", data.profile_id);
      setTimeout(
        () => setLocation("/quiz/result?" + params.toString()),
        3 * ANALYZE_LINE_MS,
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
    setFeedback(t.quiz.questions[question.key].choices[choice.key].feedback);
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

  return (
    <div className="fnl">
      {/* Header: wordmark, language, position, ticks. Sticky, so the answer
          area never moves under the thumb. */}
      <FunnelHeader
        ticks={QUESTIONS.length}
        on={screen.kind === "analyzing" ? QUESTIONS.length : qIndex + 1}
        right={
          screen.kind === "question"
            ? fill(t.quiz.stepLabel, { n: qIndex + 1, total: QUESTIONS.length })
            : screen.kind === "analyzing"
              ? t.quiz.building
              : undefined
        }
      />

      <main className="fnl-wrap fnl-main">
        {screen.kind === "intro" && <Intro t={t} onStart={start} />}

        {screen.kind === "question" && (
          <QuestionScreen
            key={qIndex}
            t={t}
            index={qIndex}
            answers={answers}
            feedback={feedback}
            onChoose={choose}
            onBack={() => goBack(qIndex)}
          />
        )}

        {screen.kind === "analyzing" && (
          <Analyzing t={t} step={analyzeStep} failed={failed} onRetry={() => void submit(answers)} />
        )}
      </main>
    </div>
  );
}

// ─── Intro ───────────────────────────────────────────────────────────────────
function Intro({ t, onStart }: { t: Dict; onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col pt-5">
      <span className="fnl-eyebrow mb-5">{t.quiz.eyebrow}</span>
      <h1 className="fnl-display mb-4">{t.quiz.headline}</h1>
      <p className="fnl-lede">{t.quiz.sub}</p>

      {/* The contract. It sets expectations and, just as usefully, it gives the
          first screen something to hold instead of half a page of air. */}
      <ol className="fnl-promises">
        {t.quiz.promises.map((line, i) => (
          <li key={line}>
            <span className="fnl-num">{String(i + 1).padStart(2, "0")}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-7">
        <button type="button" onClick={onStart} className="fnl-cta">
          {t.quiz.cta} <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <p className="fnl-micro mt-4 text-center">{t.quiz.microcopy}</p>
      </div>
    </div>
  );
}

// ─── One question ────────────────────────────────────────────────────────────
function QuestionScreen({
  t, index, answers, feedback, onChoose, onBack,
}: {
  t: Dict;
  index: number;
  answers: Answers;
  feedback: string;
  onChoose: (q: (typeof QUESTIONS)[number], choice: Choice, index: number) => void;
  onBack: () => void;
}) {
  const q = QUESTIONS[index];
  const copy = t.quiz.questions[q.key];
  const picked = answers[q.key];

  return (
    <div className="flex-1 flex flex-col fnl-enter">
      <h2 className="fnl-h2 mb-2">{copy.prompt}</h2>
      {copy.helper && <p className="fnl-helper mb-6">{copy.helper}</p>}

      <div className="fnl-choices">
        {q.choices.map((c, i) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChoose(q, c, index)}
            aria-pressed={picked === c.key}
            className="fnl-choice"
          >
            <span className="fnl-key" aria-hidden="true">{KEYS[i]}</span>
            <span className="fnl-choice-label">{copy.choices[c.key].label}</span>
          </button>
        ))}
      </div>

      {/* Micro-feedback: information, not praise. */}
      <div className="fnl-feedback" data-on={!!feedback} aria-live="polite">
        <span>{feedback || " "}</span>
      </div>

      {/* The promise from the intro, repeated on every question. It's the
          objection that makes people abandon a quiz, and it costs one line. */}
      <div className="mt-auto pt-5 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="fnl-ghost">
          <ArrowLeft className="w-4 h-4" /> {t.quiz.back}
        </button>
        <span className="fnl-micro">{t.quiz.noEmailNote}</span>
      </div>
    </div>
  );
}

// ─── Analysis ────────────────────────────────────────────────────────────────
function Analyzing({
  t, step, failed, onRetry,
}: {
  t: Dict;
  step: number;
  failed: boolean;
  onRetry: () => void;
}) {
  if (failed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="fnl-h2 mb-2">{t.quiz.failTitle}</h2>
        <p className="fnl-helper mb-8">{t.quiz.failBody}</p>
        <button type="button" onClick={onRetry} className="fnl-cta max-w-[15rem]">
          {t.quiz.retry}
        </button>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col justify-center">
      <span className="fnl-label mb-6">{t.quiz.analysisLabel}</span>
      <ul className="fnl-steps">
        {t.quiz.analyzing.map((line, i) =>
          i > step ? null : (
            <li key={line} className="fnl-step-row" data-done={i < step}>
              <span className="fnl-dot" />
              <span>{line}</span>
            </li>
          ),
        )}
      </ul>
      <hr className="fnl-rule mt-10 mb-4" />
      <p className="fnl-micro">{t.quiz.privacy}</p>
    </div>
  );
}
