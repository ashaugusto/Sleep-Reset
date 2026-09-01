import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

// ─── The two boxes on the seventh rung, and where their state lives ──────────
// Not in the browser. A tick in localStorage is a claim the buyer can wipe by
// clearing their cache and that we cannot produce two years later, and what
// these boxes need is a record: the sentence, the language, the timestamp, tied
// to the account and then to the sale. So every tick is a round trip, and what
// the page shows is what came back from the server, never what was clicked.
//
// That is also why there is no optimistic update here. A box that appears
// ticked when the write failed is exactly the failure this whole mechanism
// exists to prevent.

export type ConsentKind = "backend_early_start" | "backend_log_reading";

export interface ConsentBox {
  granted: boolean;
  grantedAt: string | null;
  withdrawnAt: string | null;
  /** The sentence as stored. Once granted, this is the record, not our copy. */
  statement: string;
  locale: string | null;
}

export type BackendConsentState = Record<ConsentKind, ConsentBox>;

export function useBackendConsent(enabled: boolean) {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const key = ["consents", "backend", locale];

  const { data, isLoading } = useQuery<BackendConsentState | null>({
    queryKey: key,
    enabled,
    retry: false,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const res = await fetch(`/api/consents/backend?locale=${locale}`, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to read consent state");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: { earlyStart?: boolean; logReading?: boolean; rung?: string }) => {
      const res = await fetch("/api/consents/backend", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to record consent");
      return (await res.json()) as BackendConsentState;
    },
    onSuccess: (next) => queryClient.setQueryData(key, next),
  });

  return {
    state: data ?? null,
    isLoading,
    set: mutation.mutate,
    isSaving: mutation.isPending,
    failed: mutation.isError,
  };
}
