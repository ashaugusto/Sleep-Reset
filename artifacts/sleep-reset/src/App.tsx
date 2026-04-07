import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import NotFound from "@/pages/not-found";
import { useClerkUser } from "@/hooks/use-clerk-user";
import { AppLayout } from "@/components/layout";
import {
  useGetUser,
  useGetPurchaseStatus,
  getGetUserQueryKey,
  getGetPurchaseStatusQueryKey,
} from "@workspace/api-client-react";

// Pages
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Night from "@/pages/night";
import SleepLog from "@/pages/sleep-log";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";
import Purchase from "@/pages/purchase";

const queryClient = new QueryClient();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AuthedRootRedirect() {
  const { userId, isLoaded } = useClerkUser();
  const { data: user, isLoading: userLoading } = useGetUser(userId ?? "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId ?? "") },
  });
  const { data: purchaseStatus, isLoading: purchaseLoading } = useGetPurchaseStatus({
    query: { enabled: !!userId, queryKey: getGetPurchaseStatusQueryKey() },
  });

  if (!isLoaded || userLoading || purchaseLoading) return <Spinner />;
  if (!purchaseStatus?.purchased) return <Redirect to="/purchase" />;
  if (!user?.onboardingComplete) return <Redirect to="/onboarding" />;
  return <Redirect to="/dashboard" />;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useClerkUser();
  const { data: purchaseStatus, isLoading } = useGetPurchaseStatus({
    query: { enabled: !!userId, queryKey: getGetPurchaseStatusQueryKey() },
  });

  if (!isLoaded || isLoading) return <Spinner />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (!purchaseStatus?.purchased) return <Redirect to="/purchase" />;
  return <>{children}</>;
}

function Router() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <Switch>
      <Route path="/" component={LandingOrRedirect} />
      <Route path="/sign-in">
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <SignIn routing="hash" signUpUrl={`${base}/sign-up`} fallbackRedirectUrl={`${base}/`} />
        </div>
      </Route>
      <Route path="/sign-up">
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <SignUp routing="hash" signInUrl={`${base}/sign-in`} fallbackRedirectUrl={`${base}/purchase`} />
        </div>
      </Route>
      <Route path="/purchase" component={Purchase} />
      <Route path="/onboarding">
        <AuthGuard><Onboarding /></AuthGuard>
      </Route>
      <Route path="/dashboard">
        <AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>
      </Route>
      <Route path="/night/:id">
        <AuthGuard><AppLayout><Night /></AppLayout></AuthGuard>
      </Route>
      <Route path="/sleep-log">
        <AuthGuard><AppLayout><SleepLog /></AppLayout></AuthGuard>
      </Route>
      <Route path="/progress">
        <AuthGuard><AppLayout><Progress /></AppLayout></AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard><AppLayout><Profile /></AppLayout></AuthGuard>
      </Route>
      <Route>
        <AppLayout showNav={false}><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function LandingOrRedirect() {
  const { isSignedIn, isLoaded } = useClerkUser();
  if (!isLoaded) return <Spinner />;
  if (isSignedIn) return <AuthedRootRedirect />;
  return <Landing />;
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl={`${base}/sign-in`}
      signUpUrl={`${base}/sign-up`}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={base}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
