import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { useEntitlements } from "@/hooks/use-entitlements";
import { PACKS, trackSrc, type Pack } from "@/lib/library";
import { OFFERS } from "@/lib/offers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, FileText, Lock, Loader2, UserPlus } from "lucide-react";

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
    </div>
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
