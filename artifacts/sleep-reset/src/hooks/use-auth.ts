import { useUser, useClerk } from "@clerk/react";
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
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const queryClient = useQueryClient();

  const isSignedIn = clerkLoaded && !!clerkUser;

  const {
    data: user,
    isLoading: appUserLoading,
  } = useQuery<AppUser | null>({
    queryKey: ["auth", "me", clerkUser?.id],
    queryFn: fetchAppUser,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isLoading = !clerkLoaded || (isSignedIn && appUserLoading);
  const userId = clerkUser?.id ?? null;

  async function signOut() {
    await clerkSignOut();
    queryClient.clear();
    window.location.href = "/sleep-reset/";
  }

  return {
    user: isSignedIn ? (user ?? null) : null,
    userId,
    isLoading,
    isSignedIn,
    signOut,
    clerkUser,
  };
}
