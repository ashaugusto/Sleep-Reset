import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface AppUser {
  id: string;
  email: string | null;
  name: string | null;
  onboardingComplete: boolean;
  purchasedAt: string | null;
}

async function fetchAppUser(): Promise<AppUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AppUser | null>({
    queryKey: ["auth", "me"],
    queryFn: fetchAppUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isSignedIn = !isLoading && !!user;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.clear();
    window.location.href = "/";
  }

  return {
    user: user ?? null,
    userId: user?.id ?? null,
    isLoading,
    isSignedIn,
    signOut,
  };
}
