import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Moon, CheckCircle2, Loader2 } from "lucide-react";
import { customFetch } from "@/lib/fetch";

// ─── Rung 5, the partner's half: taking the seat ─────────────────────────────
// The only page in the app written for somebody who has never heard of us. They
// were sent a link by the person they live with, they have no account, they
// have bought nothing, and they are one form away from seven nights of CBT-I.
//
// Public and unguarded, necessarily: the token in the URL is the whole
// credential. It is 32 random bytes, it works once, and it dies with the
// purchase behind it, so a refunded seat closes this page as surely as it
// closes the partner's access. The server decides all of that; this page only
// ever renders what it is told.
//
// What it deliberately does not do is sign somebody in who already has a
// password. A link forwarded through a chat window is not proof of identity,
// and an invite that could open an existing account would be a password reset
// with extra steps. In that one case the access is still granted and they are
// sent to sign in with the password they already have.
//
// Standalone chrome rather than the funnel's or the member area's: this is not
// a step in a funnel (there is nothing to buy) and not the member area yet
// (there is no account). It borrows /welcome's look, which is the other page
// that greets somebody at the moment access appears.

interface InviteView {
  valid: boolean;
  redeemed: boolean;
  from: string | null;
}

export default function Seat() {
  const [, params] = useRoute("/seat/:token");
  const token = params?.token ?? "";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { signedIn: boolean; message?: string }>(null);

  const invite = useQuery<InviteView | null>({
    queryKey: ["seat-invite", token],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const r = await customFetch(`/api/seats/invite/${encodeURIComponent(token)}`);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`invite: ${r.status}`);
      return (await r.json()) as InviteView;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await customFetch(`/api/seats/invite/${encodeURIComponent(token)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(body?.message || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      // A full reload rather than a client-side route: the session cookie is
      // new, and every cached query on this tab was answered as a signed-out
      // visitor. Reloading is the cheapest way to be sure none of them survive.
      if (body.signedIn) {
        window.location.href = "/";
        return;
      }
      setDone({ signedIn: false, message: body.message });
      setBusy(false);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex items-center justify-center gap-2 py-5 border-b border-border/40">
        <Moon className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm">Sleep Wired</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        {invite.isLoading && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Checking your invitation…</p>
          </div>
        )}

        {/* Dead link. One message for every way it can be dead, because telling
            the difference is only useful to somebody guessing tokens. */}
        {!invite.isLoading && !invite.data && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Moon className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-xl font-extrabold">This invitation is no longer valid</h1>
            <p className="text-sm text-muted-foreground">
              Ask the person who sent it to check it, or email{" "}
              <a href="mailto:support@sleepwired.com" className="text-primary underline">
                support@sleepwired.com
              </a>
              .
            </p>
          </div>
        )}

        {invite.data?.redeemed && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold">This seat has already been claimed</h1>
            <p className="text-sm text-muted-foreground">
              If that was you,{" "}
              <a href="/sign-in" className="text-primary underline">
                sign in here
              </a>
              .
            </p>
          </div>
        )}

        {done && !done.signedIn && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold">Your access is ready</h1>
            <p className="text-sm text-muted-foreground">{done.message}</p>
            <a
              href="/sign-in"
              className="inline-block w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl"
            >
              Sign in
            </a>
          </div>
        )}

        {invite.data && !invite.data.redeemed && !done && (
          <div className="w-full space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold mb-1">
                  {invite.data.from ? `${invite.data.from} saved you a seat` : "Someone saved you a seat"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  It is already paid for. Choose a password and it is yours.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-2.5">
              {[
                "The 7-night CBT-I protocol, from night one",
                "Your own sleep profile and onboarding",
                "Your own diary and progress, private to you",
                "Lifetime access, nothing to pay",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name (optional)"
                autoComplete="given-name"
                className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                autoComplete="email"
                className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password (6 characters or more)"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-200 disabled:opacity-60"
              >
                {busy ? "Opening your account…" : "Claim my seat"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Your nights, your diary and your answers are yours alone. The person who invited you cannot see them.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
