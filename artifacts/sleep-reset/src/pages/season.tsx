import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useI18n, fill, money } from "@/lib/i18n";
import { OFFERS, hotmartCheckoutUrl } from "@/lib/offers";
import { nextSeasonDrop } from "@/lib/season";
import { SEASON_FROM_DAY, daysBetween } from "@/lib/rung-gates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CalendarDays, Loader2 } from "lucide-react";

// ─── Rung 6: Reset Season ────────────────────────────────────────────────────
// Four new protocols across a year, on the four dates sleep reliably falls over
// (1 January, 1 April, 1 July, 1 October), paid once for the twelve months.
//
// Two things make this page different from every other rung, and both come out
// of decisions Ash took on 23 Aug 2026:
//
//   Nothing is delivered at the moment of purchase. Delivery is on the four
//   fixed dates and only on them, so somebody buying on 2 January waits until
//   1 April. The copy does not hide that, it names the date — which is what
//   `{nextDate}` is, filled here from src/lib/season.ts in the reader's own
//   language. A page that made them work the date out in their head would be
//   asking a hesitating reader to do arithmetic.
//
//   It is not a subscription and has to keep saying so. The sales page's whole
//   promise is "paid once, no subscription", and this is the one rung that can
//   be mistaken for one. Three of Sophie's five bullets, the price line and the
//   button all say it out loud, which is why they are on the page in full and
//   not summarised.
//
// When it is offered is in src/lib/rung-gates.ts, not here: day 14, a week after
// seven nights end, because rung 7 has the end of night 7 and two offers on one
// screen is neither offer. The page itself stays reachable before that day —
// somebody who has the link is not sent to a dead end — but it says where they
// are in the year rather than pretending the gate does not exist.

export default function Season() {
  const { t, locale } = useI18n();
  const c = t.season;
  const { userId } = useAuth();
  const { data: user, isLoading } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });
  const { owns } = useEntitlements();

  const price = money(t, OFFERS.season.price);
  const nextDate = nextSeasonDrop(locale);
  // An offer code that is not in the build takes the button off the page rather
  // than putting up a link to Hotmart's error 008. Same rule as every rung.
  const checkoutUrl = hotmartCheckoutUrl("season", {
    email: user?.email ?? undefined,
    tracking: { h: "season" },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const owned = owns("season");
  const day = user?.purchasedAt ? daysBetween(new Date(user.purchasedAt), new Date()) : 0;

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="space-y-2 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.eyebrow}</p>
        <h1 className="text-3xl font-serif">{c.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{c.promise}</p>
      </div>

      {owned && (
        <Card className="p-5 bg-card border-card-border space-y-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Reset Season is yours</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Four drops, and the next one lands on {nextDate}. It shows up in your library on the day, and
            nothing renews in between.
          </p>
        </Card>
      )}

      <Card className="p-5 bg-secondary/30 border-border/50 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {checkoutUrl
              ? fill(c.priceLine, { price })
              : "Reset Season is not on sale yet. Nothing you already own is affected."}
          </p>
        </div>

        {/* Sophie's five lines in full. Three of them are the "not a
            subscription" guardrail and one carries the first delivery date, so
            there is nothing here that can be trimmed for length. */}
        <ul className="space-y-2">
          {c.bullets.map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {fill(line, { nextDate, price })}
              </span>
            </li>
          ))}
        </ul>

        {!owned && checkoutUrl && (
          <>
            <Button className="w-full" asChild>
              <a href={checkoutUrl}>{fill(c.cta, { price })}</a>
            </Button>
            {/* The guarantee runs from the first drop rather than from the
                payment, which is a promise we honour by hand: Hotmart's own
                window only ever counts from the purchase. */}
            <p className="text-xs text-muted-foreground text-center">{c.guarantee}</p>
          </>
        )}
      </Card>

      {!owned && day < SEASON_FROM_DAY && (
        <div className="flex items-start gap-2.5 px-1">
          <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are on day {day} of the seven nights. This one usually makes more sense once they are behind
            you, which is why it only appears in your library from day {SEASON_FROM_DAY}.
          </p>
        </div>
      )}
    </div>
  );
}
