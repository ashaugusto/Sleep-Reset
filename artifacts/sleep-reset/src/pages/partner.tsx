import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@/lib/fetch";
import { useI18n, fill, money } from "@/lib/i18n";
import { OFFERS, hotmartCheckoutUrl } from "@/lib/offers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, Copy, Loader2, UserPlus } from "lucide-react";

// ─── Rung 5, the buyer's half: giving the seat away ──────────────────────────
// The other rungs deliver a file. This one delivers a second person, and that
// is the entire reason it needs a page instead of a row in /library: the buyer
// pays 17 EUR and then has to do something before anybody receives anything.
//
// A seat therefore has three states, and this page is a picture of them:
//
//   none yet        buy one. The Hotmart checkout, like every other rung.
//   bought          make the invitation. One click, one link, theirs to send.
//   given           who has it, and when they took it.
//
// The link is not emailed for them. They are handing this to a person they live
// with, usually while standing next to them, and asking us to mail a stranger
// on their behalf would need an address we do not have and a consent we were
// never given. Copy, paste, send it however they already talk. Sophie left that
// choice open in FLU-226 and wrote the copy for the invitation, which is what
// this is; nothing in her text needed changing once the link won.
//
// Credits are counted server side and are not the `seatCredits` column, which
// counts seats *bought*. GET /api/seats does the arithmetic against the invites
// table; see artifacts/api-server/src/lib/seats.ts for why that distinction is
// load bearing.
//
// The one part of the member area that is not English only. The pitch is sales
// copy, it exists in four languages under `seat` in the locales, and a page that
// asks a French buyer for 17 EUR should ask in French. Everything below the
// pitch (the link, the state of the seat) stays English, like the rest of the
// member area, because it is mechanics rather than persuasion.

interface SeatRow {
  purchasedAt: string;
  invited: boolean;
  url: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
}
interface SeatsResponse {
  owned: number;
  available: number;
  seats: SeatRow[];
}

export default function Partner() {
  const { t } = useI18n();
  const c = t.seat;
  const { userId } = useAuth();
  const { data: user } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });
  const queryClient = useQueryClient();

  const seats = useQuery<SeatsResponse>({
    queryKey: ["seats"],
    retry: false,
    queryFn: async () => {
      const r = await customFetch("/api/seats");
      if (!r.ok) throw new Error(`seats: ${r.status}`);
      return (await r.json()) as SeatsResponse;
    },
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      const r = await customFetch("/api/seats/invite", { method: "POST" });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.message || "Could not create the invitation.");
      return body as { url: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seats"] });
      void queryClient.invalidateQueries({ queryKey: ["entitlements"] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  // An offer code that is not in the build takes the button off the page rather
  // than putting up a link to Hotmart's error 008. Same rule as every rung.
  const checkoutUrl = hotmartCheckoutUrl("seat", { email: user?.email ?? undefined, tracking: { h: "partner" } });
  const price = money(t, OFFERS.seat.price);

  if (seats.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = seats.data?.seats ?? [];
  const available = seats.data?.available ?? 0;

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="space-y-2 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.eyebrow}</p>
        <h1 className="text-3xl font-serif">{c.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{c.promise}</p>
      </div>

      {rows.map((seat, i) => (
        <SeatCard key={`${seat.purchasedAt}-${i}`} seat={seat} />
      ))}

      {available > 0 && (
        <Card className="p-5 bg-card border-card-border space-y-4">
          <div className="flex items-start gap-3">
            <UserPlus className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {available === 1 ? "You have a seat to give" : `You have ${available} seats to give`}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Make the invitation and send them the link. They choose their own password, and their account
                opens as soon as they do.
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => createInvite.mutate()} disabled={createInvite.isPending}>
            {createInvite.isPending ? "Making the link…" : "Make the invitation"}
          </Button>
        </Card>
      )}

      {/* Buying one, or another one. Shown even when they already own a seat: a
          second seat is a real thing to want, and the page would be lying by
          omission if the only way to it was through the library card. */}
      <Card className="p-5 bg-secondary/30 border-border/50 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {checkoutUrl
              ? fill(c.priceLine, { price })
              : "Second seats are not on sale at the moment. Nothing you already own is affected."}
          </p>
        </div>

        {/* Sophie's five lines. They are the offer, so they stay on the page
            even for a buyer who already has a seat: this is the only place the
            second account is explained at all. */}
        <ul className="space-y-2">
          {c.bullets.map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>

        {checkoutUrl && (
          <>
            <Button variant={rows.length ? "outline" : "default"} className="w-full" asChild>
              <a href={checkoutUrl}>{fill(c.cta, { price })}</a>
            </Button>
            <p className="text-xs text-muted-foreground text-center">{c.guarantee}</p>
          </>
        )}
      </Card>
    </div>
  );
}

function SeatCard({ seat }: { seat: SeatRow }) {
  const [copied, setCopied] = useState(false);

  if (seat.redeemedAt) {
    return (
      <Card className="p-5 bg-card border-card-border space-y-2">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Seat taken</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {seat.redeemedBy ?? "Your partner"} opened their account on{" "}
          {new Date(seat.redeemedAt).toLocaleDateString()}. They start at night one, on their own schedule.
        </p>
      </Card>
    );
  }

  if (!seat.invited || !seat.url) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(seat.url!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in plenty of in-app browsers. The link is on the
      // screen and selectable, so this is a downgrade, not a dead end.
      toast({ title: "Copy the link from the box above." });
    }
  };

  return (
    <Card className="p-5 bg-card border-card-border space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">The invitation is ready</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Send this to the person you are giving the seat to. It works once, and only for them.
        </p>
      </div>
      <p className="text-xs font-mono break-all rounded-xl border border-border/50 bg-secondary/30 p-3 select-all">
        {seat.url}
      </p>
      <Button variant="outline" className="w-full" onClick={copy}>
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" /> Copy the link
          </>
        )}
      </Button>
    </Card>
  );
}
