import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Sign-in styled to match the /watch Netflix homepage: dark billboard
// backdrop, Bebas "W" wordmark, black card, red CTA.
//
// This page is also the members-area link on the Hotmart products, which makes
// it the first thing a buyer sees. That buyer has no password: the webhook
// creates the account passwordless and only /sign-up sets one. So the form
// below is the second way in, not the first, and "send me a sign-in link" is
// always on the page rather than hidden behind a failed attempt — telling
// somebody their address has no password would also tell an enumerator which
// addresses bought.
//
// `?dest=/library` sends them to the library instead of the dashboard once they
// are in. That is the one the Kit's members-area link should carry: the Kit is
// audio in the library, not a night on the dashboard.
const SAFE_DESTS = ["/dashboard", "/library"] as const;

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const dest = (() => {
    const raw = new URLSearchParams(window.location.search).get("dest") || "";
    return (SAFE_DESTS as readonly string[]).includes(raw) ? raw : "/dashboard";
  })();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  // Bebas Neue for the wordmark — injected locally (same as /watch).
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      queryClient.clear();

      if (!data.onboardingComplete) {
        setLocation("/onboarding");
      } else {
        setLocation(dest);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleAccessLink() {
    setError("");
    if (!email.includes("@")) {
      setError("Type the email you bought with first.");
      return;
    }
    setSendingLink(true);
    try {
      await fetch("/api/auth/access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dest }),
      });
      // The API answers the same way for a buyer and for a stranger, so the
      // page has to as well.
      setLinkSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setSendingLink(false);
  }

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col text-white"
      style={{ background: "#141414", fontFamily: "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      {/* Dimmed billboard backdrop */}
      <img
        src="/images/watch/billboard.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(20,20,20,0.85) 60%, #141414 100%)" }} />

      {/* Brand */}
      <header className="relative z-10 px-[4%] py-5">
        <a href="/watch" className="inline-flex items-baseline gap-1.5 select-none">
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E50914", fontSize: "1.9rem", lineHeight: 1 }}>W</span>
          <span className="text-[#E50914] font-extrabold tracking-[0.18em] text-[0.78rem]">SLEEP WIRED</span>
        </a>
      </header>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-4 pb-16">
        <div
          className="w-full max-w-[420px] rounded-md px-6 sm:px-12 py-8 sm:py-12"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <h1 className="text-3xl font-bold mb-7">Sign In</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded bg-[#333] text-white px-4 py-3.5 text-sm outline-none border border-transparent focus:border-[#e87c03] focus:bg-[#454545] transition placeholder:text-[#8c8c8c]"
            />

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded bg-[#333] text-white px-4 py-3.5 pr-11 text-sm outline-none border border-transparent focus:border-[#e87c03] focus:bg-[#454545] transition placeholder:text-[#8c8c8c]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8c8c] hover:text-white"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-[#e87c03]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E50914] hover:bg-[#f6121d] text-white font-bold py-3.5 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* The way in for everyone who bought and never set a password. */}
          <div className="mt-6 pt-6 border-t border-[#333]">
            {linkSent ? (
              <p className="text-sm text-[#b3b3b3] leading-relaxed">
                If that email bought Sleep Wired, the sign-in link is on its way to it. It opens your account without a password.
              </p>
            ) : (
              <>
                <p className="text-sm text-[#b3b3b3] leading-relaxed">
                  Bought it and never set a password? Type your email above and we send you a link that opens your account.
                </p>
                <button
                  type="button"
                  onClick={handleAccessLink}
                  disabled={sendingLink}
                  className="mt-3 w-full border border-[#555] hover:border-white text-white font-semibold py-3 rounded transition-colors disabled:opacity-50"
                >
                  {sendingLink ? "Sending…" : "Email me a sign-in link"}
                </button>
              </>
            )}
          </div>

          <p className="text-[#b3b3b3] text-sm mt-8">
            New to Sleep Wired?{" "}
            <a href="/watch" className="text-white hover:underline font-medium">Start your 7 nights</a>.
          </p>
          <p className="text-[#8c8c8c] text-xs mt-3">
            Trouble signing in?{" "}
            <a href="mailto:support@sleepwired.com" className="hover:underline">Contact support</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
