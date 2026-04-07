import { useUser } from "@clerk/react";
import { useEffect, useRef } from "react";
import { useCreateUser } from "@workspace/api-client-react";

export function useClerkUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { mutate: createUser } = useCreateUser();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !syncedRef.current) {
      syncedRef.current = true;
      createUser({
        data: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          name: user.fullName ?? null,
        },
      });
    }
  }, [isLoaded, isSignedIn, user, createUser]);

  return {
    userId: user?.id ?? null,
    user,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
  };
}
