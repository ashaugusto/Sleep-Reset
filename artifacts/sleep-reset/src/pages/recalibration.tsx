import { useAuth } from "@/hooks/use-auth";
import {
  useGetUser,
  getGetUserQueryKey,
  useGetProgress,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useI18n, fill, money } from "@/lib/i18n";
import type { BackendCopy } from "@/locales/types";
import { OFFERS, BACKEND_TIERS, hotmartCheckoutUrl } from "@/lib/offers";
import { BACKEND_MIN_LOGGED_NIGHTS } from "@/lib/rung-gates";
import { useBackendConsent } from "@/hooks/use-backend-consent";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Eye, Loader2, Lock } from "lucide-react";

// ─── Rung 7: The Recalibration ───────────────────────────────────────────────
// A person reads the nights the buyer logged and writes back the sleep window
// their own data is asking for. The one line the whole offer stands on, and it
// is in all four locales: the app already calculates, this is somebody looking.
//
// Two levels, which is why this page is shaped unlike the rungs above it. 79
// buys the written plan; 149 buys the same written plan plus thirty minutes
// live, booked after the plan has been read. They are two rungs in
// src/lib/offers.ts and two Hotmart offers, and BACKEND_TIERS is what keeps
// them lined up with Sophie's `backend.tiers` — index i is the same level in
// both, so the words and the price cannot drift apart.
//
// What the upper level adds is a conversation, not more care. That distinction
// is the reason the lower level does not read as mutilated, and it is why the
// extra bullet is appended to the five shared ones rather than replacing one.
//
// The gate is seven logged nights, and here it is enforced rather than merely
// respected. Every other rung would still deliver to somebody who bought it
// early; this one would not. It is read off the sleep log, the guarantee
// promises we look before we start and refund if there is nothing there to work
// with, and taking 79 EUR from an account with two nights in it is selling work
// we already know we cannot do. Below seven nights the page says where they are
// instead of showing a button.
//
// Delivery is a weekly batch done by one person, which is why the fourth bullet
// says "up to 7 working days after you ask us to start" and not "in 7 days",
// and why that batch day has to stay fixed. Capacity is the ceiling on this
// rung, not copy.
//
// The two boxes above the prices are the other reason this page is shaped
// unlike the rest, and they are not the same kind of box. Reading the log is
// the service: that log is health data, GDPR art. 9 has no contract exception,
// and explicit consent under art. 9(2)(a) is the only basis there is. Paying is
// not consenting, so that box gates the prices. Starting early is the reverse,
// a right being handed back, and dir. 2011/83/UE art. 16(a) only takes the 14
// days away when it was expressly asked for. Making it a condition of buying
// would be selling the right rather than being given it, so it gates nothing:
// unticked buys, and the work starts on day 15.
//
// Both start unticked. A pre-ticked box has not been valid consent since
// Planet49, and pre-ticking the early start one would be worse than invalid.

export default function Recalibration() {
  const { t } = useI18n();
  const c = t.backend;
  const { userId } = useAuth();
  const { data: user, isLoading } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });
  const { data: progress, isLoading: progressLoading } = useGetProgress(userId || "", {
    query: { enabled: !!userId, queryKey: getGetProgressQueryKey(userId || "") },
  });
  const { owns } = useEntitlements();
  const { state: consent } = useBackendConsent(true);

  if (isLoading || progressLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const loggedNights = progress?.logsCount ?? 0;
  const open = loggedNights >= BACKEND_MIN_LOGGED_NIGHTS;
  const owned = owns("backend") || owns("backendLive");
  // Only the log reading box gates the prices. The early start one never does.
  const mayBuy = !!consent?.backend_log_reading?.granted;

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
            <p className="text-sm font-medium">Your recalibration is booked</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The review runs once a week, in a batch. Your written plan arrives by email in up to 7 working
            days, and there is nothing for you to send: the log is already here.
          </p>
        </Card>
      )}

      {/* The five bullets both levels share. They carry the compliance line, so
          they stay on the page whole and above the prices. */}
      <ul className="space-y-2 px-1">
        {c.bullets.map((line) => (
          <li key={line} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground leading-relaxed">{line}</span>
          </li>
        ))}
      </ul>

      {/* Not a bullet, on purpose. A tick next to it would read as one more
          thing you get, and this is the line that sends somebody to a doctor
          instead of to the checkout. It stays above the prices in both tiers,
          so it cannot be scrolled past on the way to a button. */}
      <p className="text-xs text-muted-foreground leading-relaxed px-1 border-l-2 border-border/60 pl-3">
        {c.medical}
      </p>

      {!open ? (
        <Card className="p-5 bg-secondary/30 border-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {loggedNights} of {BACKEND_MIN_LOGGED_NIGHTS} nights logged
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There is nothing to read yet. This opens once the log holds {BACKEND_MIN_LOGGED_NIGHTS} nights, because the
            log is the whole thing being read. Keep filling it in each morning.
          </p>
        </Card>
      ) : (
        <>
          {!owned && <ConsentBoxes copy={c.consent} />}
          {!owned && !mayBuy ? (
            <Card className="p-5 bg-secondary/30 border-border/50">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{c.consent.blocked}</p>
              </div>
            </Card>
          ) : (
            c.tiers.map((tier, i) => (
              <TierCard
                key={tier.name}
                tier={tier}
                rung={BACKEND_TIERS[i]}
                owned={owned}
                email={user?.email ?? undefined}
                guarantee={c.guarantee}
                emphasis={i === 0}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

// ─── The two boxes ───────────────────────────────────────────────────────────
// What is shown next to a ticked box is the sentence the server stored, not the
// one in the locale file. They are the same words, kept in step by hand from
// marketing/flu235-degrau7-compliance.md, but if they ever drift the buyer
// should be looking at the one that is on the record.
function ConsentBoxes({ copy }: { copy: BackendCopy["consent"] }) {
  const { locale } = useI18n();
  const { state, set, isSaving, failed } = useBackendConsent(true);

  const reading = state?.backend_log_reading;
  const early = state?.backend_early_start;

  function when(iso: string | null | undefined): string | null {
    if (!iso) return null;
    try {
      return fill(copy.recorded, {
        when: new Date(iso).toLocaleString(locale, {
          day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
        }),
      });
    } catch {
      return null;
    }
  }

  return (
    <Card className="p-5 bg-card border-card-border space-y-4">
      <p className="text-sm font-medium">{copy.title}</p>

      <Box
        id="consent-log-reading"
        checked={!!reading?.granted}
        disabled={isSaving}
        onChange={(v) => set({ logReading: v })}
        text={reading?.granted ? reading.statement : copy.logReading}
        note={reading?.granted ? when(reading.grantedAt) : null}
      />

      <Box
        id="consent-early-start"
        checked={!!early?.granted}
        disabled={isSaving}
        onChange={(v) => set({ earlyStart: v })}
        text={early?.granted ? early.statement : copy.earlyStart}
        note={early?.granted ? when(early.grantedAt) : copy.earlyStartNote}
      />

      {failed && <p className="text-xs text-destructive leading-relaxed">{copy.error}</p>}
    </Card>
  );
}

function Box({
  id, checked, disabled, onChange, text, note,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
  text: string;
  note: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5 shrink-0"
      />
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs text-muted-foreground leading-relaxed cursor-pointer block">
          {text}
        </label>
        {note && <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{note}</p>}
      </div>
    </div>
  );
}

function TierCard({
  tier,
  rung,
  owned,
  email,
  guarantee,
  emphasis,
}: {
  tier: { name: string; priceLine: string; extra: string | null; cta: string };
  rung: (typeof BACKEND_TIERS)[number];
  owned: boolean;
  email: string | undefined;
  guarantee: string;
  emphasis: boolean;
}) {
  const { t } = useI18n();
  const price = money(t, OFFERS[rung].price);
  // No offer code in the build means no button, on this rung as on every other.
  const checkoutUrl = hotmartCheckoutUrl(rung, { email, tracking: { h: "recalibration" } });

  return (
    <Card className="p-5 bg-secondary/30 border-border/50 space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{tier.name}</p>
        <p className="text-sm text-primary tabular-nums">{price}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{tier.priceLine}</p>

      {/* One bullet more than the level below, never a different one. */}
      {tier.extra && (
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-xs text-muted-foreground leading-relaxed">{tier.extra}</span>
        </div>
      )}

      {!owned &&
        (checkoutUrl ? (
          <>
            <Button variant={emphasis ? "default" : "outline"} className="w-full" asChild>
              <a href={checkoutUrl}>{fill(tier.cta, { price })}</a>
            </Button>
            <p className="text-xs text-muted-foreground text-center">{guarantee}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            This level is not on sale yet. Nothing you already own is affected.
          </p>
        ))}
    </Card>
  );
}
