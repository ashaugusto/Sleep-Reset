import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  onboardingComplete: boolean;
  purchasedAt: string | null;
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isSignedIn = !!user;
  const userId = user?.id ?? null;

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
    window.location.href = "/";
  }

  return { user, userId, isLoading, isSignedIn, signOut, refetch };
}
