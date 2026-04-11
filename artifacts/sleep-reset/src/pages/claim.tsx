import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Loader2, Moon, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Claim() {
  const { user: clerkUser, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isLoaded || !clerkUser) return;

    const sessionId = sessionStorage.getItem("pendingSessionId");
    if (!sessionId) {
      setLocation("/dashboard");
      return;
    }

    fetch("/api/auth/claim", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({ message: "Unknown error" }));
          setError(body.message ?? "Failed to link your purchase.");
          return;
        }
        sessionStorage.removeItem("pendingSessionId");
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        setDone(true);
        setTimeout(() => setLocation("/onboarding"), 1200);
      })
      .catch(() => setError("Network error. Please try again."));
  }, [isLoaded, clerkUser, setLocation, queryClient]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex items-center justify-center gap-2 py-5 border-b border-border/40">
        <Moon className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm">Sleep Rewire</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        {done ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <h1 className="text-xl font-extrabold">Account activated!</h1>
            <p className="text-sm text-muted-foreground">Setting up your protocol…</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4 max-w-sm">
            <Moon className="w-10 h-10 text-destructive mx-auto" />
            <h1 className="text-xl font-extrabold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Contact{" "}
              <a href="mailto:support@sleepwired.com" className="text-primary underline">
                support@sleepwired.com
              </a>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Activating your account…</p>
          </div>
        )}
      </main>
    </div>
  );
}
