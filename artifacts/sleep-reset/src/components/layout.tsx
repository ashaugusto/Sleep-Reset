import { Link, useRoute } from "wouter";
import { Home, Moon, PlayCircle, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerkUser } from "@/hooks/use-clerk-user";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";

export function BottomNav() {
  const [isHome] = useRoute("/dashboard");
  const [isSleepLog] = useRoute("/sleep-log");
  const [isTonight] = useRoute("/night/:id");
  const [isProfile] = useRoute("/profile");

  const { userId } = useClerkUser();
  const { data: user } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") }
  });

  const currentNight = user?.currentNight ?? 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        <NavItem href="/dashboard" icon={<Home className="w-5 h-5" />} label="Home" isActive={isHome} />
        <NavItem href="/sleep-log" icon={<Moon className="w-5 h-5" />} label="Sleep Log" isActive={isSleepLog} />
        <NavItem href={`/night/${currentNight}`} icon={<PlayCircle className="w-5 h-5" />} label="Tonight" isActive={isTonight} />
        <NavItem href="/profile" icon={<UserIcon className="w-5 h-5" />} label="Profile" isActive={isProfile} />
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, isActive }: { href: string; icon: React.ReactNode; label: string; isActive: boolean }) {
  return (
    <Link href={href} className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function AppLayout({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col pb-safe">
      <main className="flex-1 w-full max-w-md mx-auto relative flex flex-col pb-20">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
