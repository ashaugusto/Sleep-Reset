import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Moon, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { customFetch } from "@/lib/fetch";
import { useToast } from "@/hooks/use-toast";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id") ?? "";

  const { toast } = useToast();

  const [claimData, setClaimData] = useState<{ email: string; name: string | null; hasPassword: boolean } | null>(null);
  const [claimError, setClaimError] = useState("");
  const [claimLoading, setClaimLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setClaimError("No payment session found. If you just purchased, please wait a moment and refresh.");
      setClaimLoading(false);
      return;
    }

    customFetch(`/api/auth/claim?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({ message: "Could not verify payment." }));
          setClaimError(body.message ?? "Payment not verified.");
          return;
        }
        const data = await r.json();
        setClaimData(data);

        // If they already have a password, auto-sign them in and redirect
        if (data.hasPassword) {
          setClaimError("");
        }
      })
      .catch(() => setClaimError("Network error. Please refresh the page."))
      .finally(() => setClaimLoading(false));
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const r = await customFetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, password }),
      });

      if (!r.ok) {
        const body = await r.json().catch(() => ({ message: "Something went wrong." }));
        toast({ title: body.message ?? "Error activating account", variant: "destructive" });
        return;
      }

      setLocation("/onboarding");
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center gap-2 py-5 border-b border-border/40">
        <Moon className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm">Sleep Rewire</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        {claimLoading ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying your payment…</p>
          </div>
        ) : claimError ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Moon className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-xl font-extrabold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{claimError}</p>
            <p className="text-sm text-muted-foreground">
              Already paid?{" "}
              <button onClick={() => setLocation("/sign-in")} className="text-primary underline">
                Sign in here
              </button>
              {" "}or email{" "}
              <a href="mailto:support@sleepreset.com" className="text-primary underline">
                support@sleepreset.com
              </a>
            </p>
          </div>
        ) : claimData?.hasPassword ? (
          // User already has an account — just tell them to sign in
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold mb-2">Payment Confirmed!</h1>
              <p className="text-sm text-muted-foreground">
                You already have an account with <strong className="text-foreground">{claimData.email}</strong>. Sign in to access your protocol.
              </p>
            </div>
            <button
              onClick={() => setLocation("/sign-in")}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-base"
            >
              Sign In to Start →
            </button>
          </div>
        ) : (
          // New user — set password
          <div className="w-full space-y-6">
            {/* Success indicator */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold mb-1">Payment Confirmed!</h1>
                <p className="text-sm text-muted-foreground">
                  One last step — create your password to access The Sleep Rewire Protocol.
                </p>
              </div>
            </div>

            {/* What they get */}
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

            {/* Account setup form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Your Email
                </label>
                <div className="bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground">
                  {claimData?.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</>
                ) : (
                  "Activate My Account & Start →"
                )}
              </button>
            </form>

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
