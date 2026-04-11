import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useClerk, Show } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

// Pages
import Landing from "@/pages/landing";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import Claim from "@/pages/claim";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Night from "@/pages/night";
import SleepLog from "@/pages/sleep-log";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";
import Welcome from "@/pages/welcome";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import Solution from "@/pages/solution";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isSignedIn, user } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (!user?.purchasedAt) return <Redirect to="/" />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isLoading, isSignedIn, user } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isSignedIn) return <Landing />;
  if (!user?.purchasedAt) return <Landing />;
  if (!user?.onboardingComplete) return <Redirect to="/onboarding" />;
  return <Redirect to="/dashboard" />;
}

function ClaimGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/sign-in/*?" component={SignIn} />
      <Route path="/sign-up/*?" component={SignUp} />
      <Route path="/claim">
        <ClaimGuard><Claim /></ClaimGuard>
      </Route>
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
      <Route path="/welcome" component={Welcome} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/solution" component={Solution} />
      <Route>
        <AppLayout showNav={false}><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground p-8 text-center">
        <p>Auth configuration missing. Please check your environment setup.</p>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl || undefined}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
