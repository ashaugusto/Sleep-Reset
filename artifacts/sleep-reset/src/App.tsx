import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

// Pages — the quiz is the root (paid-traffic entry), so it stays in the main
// bundle; everything else is code-split to keep root TTI low.
//
// The paid path is three pages in one design system: /  →  /quiz/result  →
// /plan. The WIRED sales page is intact and still served at /watch, but it is
// no longer part of that path: the result used to hand off to it, which put a
// page written for a cold visitor in front of someone who had just been
// diagnosed. /plan replaced it as the closer.
import Quiz from "@/pages/quiz";
const Watch = lazy(() => import("@/pages/watch"));
const Plan = lazy(() => import("@/pages/plan"));
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
const Library = lazy(() => import("@/pages/library"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const Terms = lazy(() => import("@/pages/terms"));
const QuizResult = lazy(() => import("@/pages/quiz-result"));
const Kit = lazy(() => import("@/pages/kit"));
const Protocol = lazy(() => import("@/pages/protocol"));
const Partner = lazy(() => import("@/pages/partner"));
const Seat = lazy(() => import("@/pages/seat"));
const Season = lazy(() => import("@/pages/season"));
const Recalibration = lazy(() => import("@/pages/recalibration"));

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
  if (!isSignedIn) return <Quiz />;
  if (!user?.purchasedAt) return <Quiz />;
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
      {/* Where everything bought on top of the seven nights is listened to.
          Guarded like the rest of the member area: the Kit and the Recovery
          Pack are granted to an account, not to a link. */}
      <Route path="/library">
        <AuthGuard><AppLayout><Library /></AppLayout></AuthGuard>
      </Route>
      {/* Rung 5, the buyer's end: buy a second seat and hand it over. Guarded,
          because the seat belongs to an account. The partner's end is /seat,
          which is public and lives with the other unguarded routes below. */}
      <Route path="/partner">
        <AuthGuard><AppLayout><Partner /></AppLayout></AuthGuard>
      </Route>
      {/* Rungs 6 and 7, both sold inside the platform rather than in the
          funnel, and both guarded because they are offered to a member and read
          off their account. When each one is *offered* is src/lib/rung-gates.ts:
          rung 7 at the end of night 7, rung 6 a week later on day
          14. They used to open on the same instant, and two offers on one
          screen is neither offer. */}
      <Route path="/season">
        <AuthGuard><AppLayout><Season /></AppLayout></AuthGuard>
      </Route>
      <Route path="/recalibration">
        <AuthGuard><AppLayout><Recalibration /></AppLayout></AuthGuard>
      </Route>
      {/* The upsell Hotmart's sales funnel redirects to after the payment
          clears. Public and unguarded on purpose: the buyer has paid but has
          not set a password yet, so there is no account to guard, and both
          answers on the page end at /welcome with the transaction intact. */}
      <Route path="/kit" component={Kit} />
      {/* Rung 4, and the only page in the funnel shown after a refusal: the 9
          EUR protocol offered to whoever said no on /kit. Public and unguarded
          for the same reason /kit is, and it ends at /welcome either way. */}
      <Route path="/protocol" component={Protocol} />
      <Route path="/welcome" component={Welcome} />
      {/* The partner claiming the seat. Public by necessity: they have no
          account, and the token in the path is the whole credential. */}
      <Route path="/seat/:token" component={Seat} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      {/* The previous homepage, kept whole. /wired is an alias so old links
          and any ad still pointing at the series keep landing on it. */}
      <Route path="/watch" component={Watch} />
      <Route path="/wired" component={Watch} />
      <Route path="/start" component={Landing} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/quiz/result" component={QuizResult} />
      <Route path="/plan" component={Plan} />
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
