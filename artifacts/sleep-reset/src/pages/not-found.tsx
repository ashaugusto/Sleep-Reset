import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground px-6 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-5xl font-serif text-primary">404</h1>
        <h2 className="text-xl font-medium">Page not found</h2>
        <p className="text-muted-foreground text-sm">
          This page doesn't exist. Let's get you back on track.
        </p>
      </div>
      <Button onClick={() => setLocation("/dashboard")} className="px-8">
        Back to Dashboard
      </Button>
    </div>
  );
}
