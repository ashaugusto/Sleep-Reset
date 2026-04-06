import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useUserId } from "@/hooks/use-user-id";
import { AppLayout } from "@/components/layout";
import { useGetUser } from "@workspace/api-client-react";

// Pages
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Night from "@/pages/night";
import SleepLog from "@/pages/sleep-log";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function RootRedirect() {
  const userId = useUserId();
  const { data: user, isLoading } = useGetUser(userId ?? "");

  if (!userId || isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user?.onboardingComplete) {
    return <Redirect to="/dashboard" />;
  }

  return <Redirect to="/onboarding" />;
}

function Router() {
  const userId = useUserId();

  if (!userId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/night/:id">
        <AppLayout><Night /></AppLayout>
      </Route>
      <Route path="/sleep-log">
        <AppLayout><SleepLog /></AppLayout>
      </Route>
      <Route path="/progress">
        <AppLayout><Progress /></AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout><Profile /></AppLayout>
      </Route>
      <Route>
        <AppLayout showNav={false}><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
