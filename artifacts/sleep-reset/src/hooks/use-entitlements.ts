import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@/lib/fetch";
import type { Rung } from "@/lib/offers";

// ─── What this account owns ──────────────────────────────────────────────────
// GET /api/entitlements, which the API derives from the purchases ledger rather
// than from a flag somebody set once. That is the whole point of reading it
// here instead of off the user record: a refund revokes the row and recomputes,
// so the library closes on its own, and a purchase made under the same email
// before the account existed still counts.
//
// The user object does carry kitPurchasedAt and premiumPurchasedAt, but they
// are a cache of this same calculation and the generated API client does not
// expose all of them, so the ledger is the honest source.
//
// A 401 is not an error worth retrying: it means signed out, which the route
// guard is already handling.

export interface Entitlements {
  rungs: Rung[];
  purchasedAt: string | null;
  premiumPurchasedAt: string | null;
  kitPurchasedAt: string | null;
  downsellPurchasedAt: string | null;
  seatCredits: number | null;
}

const EMPTY: Entitlements = {
  rungs: [],
  purchasedAt: null,
  premiumPurchasedAt: null,
  kitPurchasedAt: null,
  downsellPurchasedAt: null,
  seatCredits: null,
};

export function useEntitlements(enabled = true) {
  const query = useQuery<Entitlements>({
    queryKey: ["entitlements"],
    enabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const r = await customFetch("/api/entitlements");
      if (r.status === 401) return EMPTY;
      if (!r.ok) throw new Error(`entitlements: ${r.status}`);
      const data = (await r.json()) as Partial<Entitlements>;
      return { ...EMPTY, ...data, rungs: Array.isArray(data.rungs) ? data.rungs : [] };
    },
  });

  const rungs = query.data?.rungs ?? [];
  return {
    ...query,
    entitlements: query.data ?? EMPTY,
    /** False while loading, so nothing unlocks before the answer arrives. */
    owns: (rung: Rung) => rungs.includes(rung),
  };
}
