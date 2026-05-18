import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Headphones, Check, Loader2 } from "lucide-react";
import { customFetch } from "@/lib/fetch";
import { toast } from "@/hooks/use-toast";

const RECOVERY_PACK = [
  { slug: "jet-lag", title: "Jet Lag Reset", desc: "Resolve time-zone shifts in 3 nights" },
  { slug: "3am-anxiety", title: "3 AM Anxiety Attack", desc: "What to do when you wake up wired at 3 AM" },
  { slug: "sunday-night", title: "Sunday Night Insomnia", desc: "Break the weekly conditioned-anxiety cycle" },
  { slug: "shift-work", title: "Shift Work Adaptation", desc: "Sleep that fights modern shift patterns" },
  { slug: "post-illness", title: "Post-Illness Recovery", desc: "Reset after fever, surgery or COVID" },
  { slug: "post-vacation", title: "Post-Vacation Reset", desc: "3-night fix when you come back wrecked" },
  { slug: "quick-reset", title: "Quick Reset (2-night)", desc: "The most aggressive CBT-I recompression" },
];

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { userId } = useAuth();
  const { data: user } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });
  const [loading, setLoading] = useState(false);

  const alreadyOwns = !!user?.premiumPurchasedAt;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const r = await customFetch("/api/checkout/upgrade", { method: "POST", credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({ message: "Could not start checkout." }));
        toast({ title: body.message ?? "Checkout failed", variant: "destructive" });
        return;
      }
      const { url } = await r.json();
      window.location.href = url;
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <div className="text-center space-y-3 pt-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Headphones className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif">Recovery Pack</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          The 7 nights got you sleeping again. The Recovery Pack is the toolkit for when life knocks
          sleep out of rhythm — travel, illness, anxiety, shift work.
        </p>
      </div>

      <Card className="p-5 bg-card border-card-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">What's included</p>
        <div className="space-y-3">
          {RECOVERY_PACK.map((a) => (
            <div key={a.slug} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 bg-secondary/30 border-border/50 space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Preview — 3 AM Anxiety Attack</p>
        <audio controls preload="metadata" src="/audio/recovery-3am-anxiety.mp3" className="w-full h-9">
          Your browser does not support audio.
        </audio>
        <p className="text-[11px] text-muted-foreground">Full audio length ~2-3 min · all 7 sessions same format</p>
      </Card>

      {alreadyOwns ? (
        <Card className="p-5 bg-primary/10 border-primary/20 text-center space-y-2">
          <p className="text-sm font-medium text-primary">You already own the Recovery Pack</p>
          <p className="text-xs text-muted-foreground">All 7 sessions available below.</p>
          <Button variant="outline" className="mt-2" onClick={() => setLocation("/dashboard")}>
            Back to dashboard
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-center space-y-1">
            <p className="text-3xl font-serif">€19</p>
            <p className="text-xs text-muted-foreground">one-time · lifetime access</p>
          </div>
          <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Recovery Pack — €19"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Same 60-night money-back guarantee. Reply to any email to refund.
          </p>
        </div>
      )}

      {alreadyOwns && (
        <Card className="p-5 bg-card border-card-border space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Your Recovery Pack</p>
          {RECOVERY_PACK.map((a) => (
            <div key={a.slug} className="space-y-2">
              <p className="text-sm font-medium">{a.title}</p>
              <audio controls preload="metadata" src={`/audio/recovery-${a.slug}.mp3`} className="w-full h-9">
                Your browser does not support audio.
              </audio>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
