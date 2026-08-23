import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetUser,
  getGetUserQueryKey,
  useGetProgress,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { useEntitlements } from "@/hooks/use-entitlements";
import { PACKS, trackSrc, type Pack } from "@/lib/library";
import { OFFERS } from "@/lib/offers";
import { offeredAt } from "@/lib/rung-gates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, FileText, Lock, Loader2, UserPlus, CalendarDays, Eye } from "lucide-react";

// ─── The member library ──────────────────────────────────────────────────────
// Ash asked where the Kit's member page is, and whether it is the same one as
// the protocol's. It is the same member area and the same login, and this is
// the page: one library for everything bought on top of the seven nights,
// rather than a route per rung. The ladder has seven rungs planned and a page
// each would be seven pages that all say "here is your audio".
//
// Why it did not exist before. The Recovery Pack has been sold as an order bump
// since the Hotmart move, and the only place it could be played was /upgrade,
// which is the page that sells it: a buyer had to walk back into a sales page
// to hear what they already owned, and nothing on the dashboard pointed there.
// The Kit was worse, having audio in public/ and no route at all.
//
// Locked packs stay on the page instead of disappearing. Someone who bought the
// protocol alone should be able to see what the Kit is without going back
// through a funnel, and the buy link goes to the page that sells it with their
// email attached, so the checkout is prefilled the way the funnel's is.

export default function Library() {
  const { userId } = useAuth();
  const { data: user } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });
  const { owns, isLoading } = useEntitlements();
  // Rungs 6 and 7 are gated on where the member is, not on what they own, and
  // the library gets one row between them rather than one each. That is the
  // collision rule made structural: src/lib/rung-gates.ts hands back the single
  // rung this surface may ask for right now, and from day 14 that is the
  // season. Two offers on one screen is neither offer.
  const { data: progress } = useGetProgress(userId || "", {
    query: { enabled: !!userId, queryKey: getGetProgressQueryKey(userId || "") },
  });
  const member = {
    loggedNights: progress?.logsCount ?? 0,
    purchasedAt: user?.purchasedAt ? new Date(user.purchasedAt) : null,
    owned: (["season", "backend", "backendLive"] as const).filter(owns),
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ownedCount = PACKS.filter((p) => owns(p.rung)).length;

  // A locked pack whose superset is already owned is not an offer, it is a
  // second price tag on a file they can already play. The downsell is the only
  // one of these today: it is the Kit's 20 minute protocol on its own.
  const shown = PACKS.filter((p) => owns(p.rung) || !(p.supersededBy && owns(p.supersededBy)));

  // One rung, or none. Not a list: the point of the gate is that this surface
  // never asks two questions at once.
  const slot = offeredAt("library", member);

  return (
    <div className="p-6 space-y-8 pb-24">
      <div className="space-y-2 pt-4">
        <h1 className="text-3xl font-serif">Your library</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {ownedCount > 0
            ? "Everything you own, in one place. Lifetime access, nothing expires."
            : "The seven nights are on your dashboard. Anything you add to them shows up here."}
        </p>
      </div>

      {shown.map((pack) => (
        <PackCard key={pack.rung} pack={pack} owned={owns(pack.rung)} email={user?.email ?? null} />
      ))}

      {/* The fifth rung is not a pack: nothing to play, and what it delivers is
          a second account rather than a file. It gets a row of its own rather
          than a PackCard pretending it has tracks. */}
      <SeatRow owned={owns("seat")} />

      {/* Rung 7 once it is theirs. It is asked for at the end of night 7 and
          not here, but an account that bought it needs a way back to what it
          bought. */}
      {(owns("backend") || owns("backendLive")) && (
        <OfferRow
          icon={<Eye className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
          title="The Recalibration"
          body="Your written plan is in the weekly batch. It arrives by email in up to 7 working days, and there is nothing for you to send."
          cta="See what you asked for"
          href="/recalibration"
        />
      )}

      {owns("season") && (
        <OfferRow
          icon={<CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
          title="Reset Season"
          body="Four drops across the year, on 1 January, 1 April, 1 July and 1 October. Each one lands in here on the day."
          cta="See the year"
          href="/season"
        />
      )}

      {/* And the one rung this surface is allowed to ask for today, if any.
          The season from day 14; before that, rung 7 for anyone who reached the
          end of night 7 and did not decide on the spot. Never both. */}
      {slot === "season" && (
        <OfferRow
          icon={<CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
          title="Reset Season"
          body="Four new protocols across the year, on the four dates sleep tends to fall over. Paid once, and nothing renews."
          cta={`Add Reset Season \u00b7 \u20ac${OFFERS.season.price}`}
          href="/season"
        />
      )}
      {slot === "backend" && (
        <OfferRow
          icon={<Eye className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
          title="The Recalibration"
          body="A person reads the seven nights you logged and writes back the window your own data is asking for. The app calculates; this is somebody looking."
          cta={`Have someone read my log \u00b7 from \u20ac${OFFERS.backend.price}`}
          href="/recalibration"
        />
      )}
    </div>
  );
}

/** A rung that delivers something other than a file: a person, a service, a
 *  year of drops. Same row as the seat, which was the first of them. */
function OfferRow({
  icon,
  title,
  body,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  const [, setLocation] = useLocation();
  return (
    <Card className="p-5 bg-secondary/30 border-border/50 space-y-4">
      <div className="flex items-start gap-3">
        {icon}
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => setLocation(href)}>
        {cta}
      </Button>
    </Card>
  );
}

/** The second seat, from the buyer's side. The whole flow lives on /partner. */
function SeatRow({ owned }: { owned: boolean }) {
  const [, setLocation] = useLocation();
  return (
    <Card className="p-5 bg-secondary/30 border-border/50 space-y-4">
      <div className="flex items-start gap-3">
        <UserPlus className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Second Seat</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {owned
              ? "You have a seat to give. Send the invitation and they get their own account and their own seven nights."
              : "A second account for the person you wake up, with the seven nights worked out on their nights, not yours."}
          </p>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => setLocation("/partner")}>
        {owned ? "Give the seat" : `Add a second seat for \u20ac${OFFERS.seat.price}`}
      </Button>
    </Card>
  );
}

function PackCard({ pack, owned, email }: { pack: Pack; owned: boolean; email: string | null }) {
  const [, setLocation] = useLocation();
  const price = OFFERS[pack.rung].price;

  if (!owned) {
    return (
      <Card className="p-5 bg-secondary/30 border-border/50 space-y-4">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{pack.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{pack.blurb}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // The sales pages read the email off the query string to prefill the
            // Hotmart checkout, the same way the post-purchase funnel hands it
            // over. A signed-in member has no reason to type it again.
            const q = email ? `?email=${encodeURIComponent(email)}` : "";
            setLocation(`${pack.buyHref}${q}`);
          }}
        >
          Unlock {pack.title} &middot; &euro;{price}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card border-card-border space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{pack.title}</p>
        <span className="text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
          Yours
        </span>
      </div>

      {pack.document && (
        <a
          href={pack.document.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/30 p-4 hover:border-primary/50 transition-colors"
        >
          <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{pack.document.title}</p>
            <p className="text-xs text-muted-foreground">{pack.document.desc}</p>
          </div>
        </a>
      )}

      <div className="space-y-5">
        {pack.tracks.map((track) => (
          <div key={track.slug} className="space-y-2">
            <div className="flex items-start gap-3">
              <Headphones className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{track.title}</p>
                <p className="text-xs text-muted-foreground">
                  {track.length} &middot; {track.desc}
                </p>
              </div>
            </div>
            <audio controls preload="none" src={trackSrc(track)} className="w-full h-9">
              Your browser does not support audio playback.
            </audio>
          </div>
        ))}
      </div>
    </Card>
  );
}
