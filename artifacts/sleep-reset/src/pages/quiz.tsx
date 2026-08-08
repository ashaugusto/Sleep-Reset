import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { INTRO, QUESTIONS, ANALYZING_LINES, type Choice } from "@/lib/quiz-data";
import "@/styles/funnel.css";

// ─── The entry quiz ──────────────────────────────────────────────────────────
// This is the root page: paid traffic lands here. One question per screen, one
// tap to answer, no scroll, and no email until the result page.
// Copy lives in lib/quiz-data.ts, spec in marketing/flu143-enquete-perguntas.md.
// The look lives in styles/funnel.css and is shared with /quiz/result.
//
// Flow: intro → 5 questions → analysis → POST /api/quiz/submit → /quiz/result.
// The WIRED sales page it replaced is untouched and still served at /watch.

const STORAGE_KEY = "sw_quiz_v2";
const FEEDBACK_MS = 1100;
const ANALYZE_LINE_MS = 800;
const KEYS = "ABCDE";

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
// Light haptic on tap. Makes it feel like an app, not a form. No-op on iOS.
function haptic() {
  try { navigator.vibrate?.(8); } catch {}
}

type Answers = Record<string, string>;
type Screen = { kind: "intro" } | { kind: "question"; index: number } | { kind: "analyzing" };

/** Wordmark. Drawn here rather than pulled from an icon set: a hairline
 *  crescent at 16px sits with the letterspaced type, a filled icon doesn't. */
function Crescent() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.2 9.9A5.7 5.7 0 0 1 6.1 2.8a5.9 5.9 0 1 0 7.1 7.1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Quiz() {
  const [, setLocation] = useLocation();
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

  return (
    <div className="fnl">
      {/* Header: wordmark, position, ticks. Sticky, so the answer area never
          moves under the thumb. */}
      <header className="fnl-head">
        <div className="fnl-wrap fnl-head-row">
          <span className="fnl-mark"><Crescent /> Sleep Wired</span>
          <span className="fnl-step">
            {screen.kind === "question" && `${qIndex + 1} / ${QUESTIONS.length}`}
            {screen.kind === "analyzing" && "Building your result"}
          </span>
        </div>
        {/* Ticks only once the quiz is running. On the intro they would read
            as a broken rule, so the header closes with a plain hairline. */}
        {screen.kind === "intro" ? (
          <div className="fnl-progress"><span className="fnl-tick fnl-tick--full" /></div>
        ) : (
          <div className="fnl-progress">
            {QUESTIONS.map((q, i) => (
              <span
                key={q.key}
                className="fnl-tick"
                data-on={screen.kind === "analyzing" || i <= qIndex}
              />
            ))}
          </div>
        )}
      </header>

      <main className="fnl-wrap fnl-main">
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
    <div className="flex-1 flex flex-col pt-5">
      <span className="fnl-eyebrow mb-5">{INTRO.eyebrow}</span>
      <h1 className="fnl-display mb-4">{INTRO.headline}</h1>
      <p className="fnl-lede">{INTRO.sub}</p>

      {/* The contract. It sets expectations and, just as usefully, it gives the
          first screen something to hold instead of half a page of air. */}
      <ol className="fnl-promises">
        {INTRO.promises.map((line, i) => (
          <li key={line}>
            <span className="fnl-num">{String(i + 1).padStart(2, "0")}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-7">
        <button type="button" onClick={onStart} className="fnl-cta">
          {INTRO.cta} <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <p className="fnl-micro mt-4 text-center">{INTRO.microcopy}</p>
      </div>
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
    <div className="flex-1 flex flex-col fnl-enter">
      <h2 className="fnl-h2 mb-2">{q.prompt}</h2>
      {q.helper && <p className="fnl-helper mb-6">{q.helper}</p>}

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
            <span className="fnl-choice-label">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Micro-feedback: information, not praise. */}
      <div className="fnl-feedback" data-on={!!feedback} aria-live="polite">
        <span>{feedback || " "}</span>
      </div>

      {/* The promise from the intro, repeated on every question. It's the
          objection that makes people abandon a quiz, and it costs one line. */}
      <div className="mt-auto pt-5 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="fnl-ghost">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="fnl-micro">No email to see your result</span>
      </div>
    </div>
  );
}

// ─── Analysis ────────────────────────────────────────────────────────────────
function Analyzing({ step, failed, onRetry }: { step: number; failed: boolean; onRetry: () => void }) {
  if (failed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="fnl-h2 mb-2">We couldn't build your result.</h2>
        <p className="fnl-helper mb-8">Your answers are saved. One tap and we'll try again.</p>
        <button type="button" onClick={onRetry} className="fnl-cta max-w-[15rem]">
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col justify-center">
      <span className="fnl-label mb-6">Analysis</span>
      <ul className="fnl-steps">
        {ANALYZING_LINES.map((line, i) =>
          i > step ? null : (
            <li key={line} className="fnl-step-row" data-done={i < step}>
              <span className="fnl-dot" />
              <span>{line}</span>
            </li>
          ),
        )}
      </ul>
      <hr className="fnl-rule mt-10 mb-4" />
      <p className="fnl-micro">Your answers stay private. We never sell or share them.</p>
    </div>
  );
}
