import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Moon, CheckCircle2, Loader2 } from "lucide-react";
import { gtm } from "@/lib/gtm";

// ─── The page the buyer lands on with the money already gone ─────────────────
// Two processors arrive here, and they prove the sale in different ways.
//
// Stripe hands back a checkout session id and the verification is one call.
// Hotmart hands back a transaction code and the verification is a race: the
// buyer's browser is redirected the instant the card clears, while the webhook
// that writes the sale down is a separate call travelling in parallel. Which
// arrives first is not ours to decide, so the page waits and asks again rather
// than telling somebody who has just paid that nothing was found.
//
// If the wait runs out, the fallback is the access link the webhook emails, and
// the page says so. What it never does is send a paying buyer to a dead end.

/** Hotmart's own name for the field has moved between panel versions. */
const TRANSACTION_KEYS = ["transaction", "trans", "hotmart_transaction", "tid"];

const POLL_INTERVAL_MS = 2500;
const POLL_ATTEMPTS = 12; // ~30s

type State = "loading" | "ok" | "waiting" | "error" | "refunded";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const sessionId = params.get("session_id") ?? "";
  const transaction = TRANSACTION_KEYS.map((k) => params.get(k)).find((v) => !!v) ?? "";

  const [verifyState, setVerifyState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [canCreateAccount, setCanCreateAccount] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const purchaseFired = useRef(false);

  // ─── Hotmart ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!transaction) return;
    let cancelled = false;
    let attempt = 0;

    async function poll() {
      attempt += 1;
      try {
        const r = await fetch(`/api/hotmart/claim?transaction=${encodeURIComponent(transaction)}`, {
          credentials: "include",
        });

        if (cancelled) return;

        if (r.ok) {
          const data = await r.json();
          setMaskedEmail(data.maskedEmail ?? null);
          setCanCreateAccount(data.canCreateAccount !== false && !data.hasAccount);
          setVerifyState("ok");
          if (!purchaseFired.current) {
            purchaseFired.current = true;
            gtm.purchase(transaction, null);
          }
          return;
        }

        if (r.status === 410) {
          setErrorMsg("This purchase was refunded. If that is a mistake, email support@sleepwired.com.");
          setVerifyState("refunded");
          return;
        }

        // 404 means the webhook has not landed yet. Keep asking.
        if (attempt < POLL_ATTEMPTS) {
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        setVerifyState("waiting");
      } catch {
        if (cancelled) return;
        if (attempt < POLL_ATTEMPTS) {
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        setVerifyState("waiting");
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [transaction]);

  // ─── Stripe ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (transaction) return;

    if (!sessionId) {
      setErrorMsg("No payment session found. If you just purchased, please wait a moment and refresh.");
      setVerifyState("error");
      return;
    }

    fetch(`/api/auth/claim?session_id=${encodeURIComponent(sessionId)}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({ message: "Could not verify payment." }));
          setErrorMsg(body.message ?? "Payment not verified.");
          setVerifyState("error");
          return;
        }
        const data = await r.json();
        setEmail(data.email ?? null);
        setName(data.name ?? null);
        setVerifyState("ok");
        if (!purchaseFired.current) {
          purchaseFired.current = true;
          gtm.purchase(sessionId, data.email ?? null);
        }
      })
      .catch(() => {
        setErrorMsg("Network error. Please refresh the page.");
        setVerifyState("error");
      });
  }, [sessionId, transaction]);

  function handleCreateAccount() {
    // Hotmart: only the transaction travels. The email is typed on the next
    // page and checked against the sale, so a guessed code opens nothing.
    const query = new URLSearchParams(
      transaction
        ? { transaction, ...(maskedEmail ? { masked: maskedEmail } : {}) }
        : { session_id: sessionId, ...(email ? { email } : {}), ...(name ? { name } : {}) },
    );
    setLocation(`/sign-up?${query.toString()}`);
  }

  const shownEmail = email ?? maskedEmail;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex items-center justify-center gap-2 py-5 border-b border-border/40">
        <Moon className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm">Sleep Wired</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        {verifyState === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              {transaction ? "Confirming your purchase…" : "Verifying your payment…"}
            </p>
          </div>
        )}

        {/* Paid, but the confirmation has not reached us yet. The email will. */}
        {verifyState === "waiting" && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold">Your payment went through</h1>
            <p className="text-sm text-muted-foreground">
              Setting up your access is taking a little longer than usual. Check your inbox: we are sending
              your access link to the email you used at checkout. It normally arrives within a minute.
            </p>
            <p className="text-sm text-muted-foreground">
              Nothing after five minutes? Email{" "}
              <a href="mailto:support@sleepwired.com" className="text-primary underline">
                support@sleepwired.com
              </a>{" "}
              and we will open it by hand.
            </p>
          </div>
        )}

        {(verifyState === "error" || verifyState === "refunded") && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Moon className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-xl font-extrabold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <p className="text-sm text-muted-foreground">
              Already paid?{" "}
              <button onClick={() => setLocation("/sign-in")} className="text-primary underline">
                Sign in here
              </button>{" "}
              or email{" "}
              <a href="mailto:support@sleepwired.com" className="text-primary underline">
                support@sleepwired.com
              </a>
            </p>
          </div>
        )}

        {verifyState === "ok" && (
          <div className="w-full space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold mb-1">Payment Confirmed!</h1>
                {shownEmail && (
                  <p className="text-sm text-muted-foreground">
                    Receipt sent to <strong className="text-foreground">{shownEmail}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-2.5">
              {[
                "7-Night CBT-I Protocol — unlocked & ready",
                "Personalised sleep profile onboarding",
                "Nightly diary, charts & progress tracking",
                "Lifetime access — start tonight",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            {canCreateAccount ? (
              <button
                onClick={handleCreateAccount}
                className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-200"
              >
                Create Your Account →
              </button>
            ) : (
              <button
                onClick={() => setLocation("/sign-in")}
                className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-200"
              >
                Sign in to your account →
              </button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <button onClick={() => setLocation("/sign-in")} className="text-primary underline">
                Sign in
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
