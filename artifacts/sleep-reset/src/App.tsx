import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

// Pages — Watch is the root (paid-traffic entry), so it stays in the main
// bundle; everything else is code-split to keep root TTI low.
import Watch from "@/pages/watch";
const Landing = lazy(() => import("@/pages/landing"));
const SignIn = lazy(() => import("@/pages/sign-in"));
const SignUp = lazy(() => import("@/pages/sign-up"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Night = lazy(() => import("@/pages/night"));
const SleepLog = lazy(() => import("@/pages/sleep-log"));
const Progress = lazy(() => import("@/pages/progress"));
const Profile = lazy(() => import("@/pages/profile"));
const Welcome = lazy(() => import("@/pages/welcome"));
const Upgrade = lazy(() => import("@/pages/upgrade"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const Terms = lazy(() => import("@/pages/terms"));
const Quiz = lazy(() => import("@/pages/quiz"));
const QuizResult = lazy(() => import("@/pages/quiz-result"));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
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
  if (!isSignedIn) return <Watch />;
  if (!user?.purchasedAt) return <Watch />;
  if (!user?.onboardingComplete) return <Redirect to="/onboarding" />;
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-black" />}>
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
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
      <Route path="/upgrade">
        <AuthGuard><AppLayout><Upgrade /></AppLayout></AuthGuard>
      </Route>
      <Route path="/welcome" component={Welcome} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/watch" component={Watch} />
      <Route path="/start" component={Landing} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/quiz/result" component={QuizResult} />
      <Route path="/solution">
        <Redirect to="/" />
      </Route>
      <Route>
        <AppLayout showNav={false}><NotFound /></AppLayout>
      </Route>
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
