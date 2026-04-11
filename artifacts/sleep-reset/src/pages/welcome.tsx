import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Moon, CheckCircle2, Loader2 } from "lucide-react";
import { gtm } from "@/lib/gtm";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id") ?? "";

  const [verifyState, setVerifyState] = useState<"loading" | "ok" | "error">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const purchaseFired = useRef(false);

  useEffect(() => {
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
  }, [sessionId]);

  function handleCreateAccount() {
    const query = new URLSearchParams({
      session_id: sessionId,
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    });
    setLocation(`/sign-up?${query.toString()}`);
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex items-center justify-center gap-2 py-5 border-b border-border/40">
        <Moon className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm">Sleep Rewire</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        {verifyState === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying your payment…</p>
          </div>
        )}

        {verifyState === "error" && (
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
                {email && (
                  <p className="text-sm text-muted-foreground">
                    Receipt sent to <strong className="text-foreground">{email}</strong>
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

            <button
              onClick={handleCreateAccount}
              className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-200"
            >
              Create Your Account →
            </button>

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
