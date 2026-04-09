import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Moon, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useCreateCheckoutSession, useGetPurchaseStatus, getGetPurchaseStatusQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID || "";

export default function Purchase() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { userId, isLoading, isSignedIn } = useAuth();
  const { toast } = useToast();
  const cancelled = new URLSearchParams(search).get("cancelled") === "1";

  const { data: purchaseStatus, isLoading: statusLoading } = useGetPurchaseStatus({
    query: { enabled: !!userId, queryKey: getGetPurchaseStatusQueryKey() },
  });

  const { mutate: createCheckout, isPending } = useCreateCheckoutSession({
    mutation: {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Falha ao iniciar pagamento. Tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  useEffect(() => {
    if (!isLoading && !isSignedIn) setLocation("/sign-in");
  }, [isLoading, isSignedIn, setLocation]);

  useEffect(() => {
    if (purchaseStatus?.purchased) setLocation("/onboarding");
  }, [purchaseStatus, setLocation]);

  if (isLoading || statusLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleCheckout = () => {
    if (!PRICE_ID) {
      toast({ title: "Em breve", description: "Checkout disponível em breve." });
      return;
    }
    createCheckout({ data: { priceId: PRICE_ID } });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="flex items-center px-6 py-4 max-w-lg mx-auto w-full">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <span className="font-semibold">Sleep Reset</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-lg mx-auto w-full">
        {cancelled && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl mb-6 w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Pagamento cancelado. Tente novamente quando quiser.
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Acesso completo</h1>
          <p className="text-muted-foreground">
            Pagamento único. Sem assinatura. Acesso ao programa completo de 7 noites.
          </p>
        </div>

        <Card className="w-full p-6 mb-6 border-primary/30 bg-card">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-bold">$47</span>
            <span className="text-muted-foreground text-sm">pagamento único</span>
          </div>
          <ul className="space-y-2 mb-6">
            {[
              "Programa completo de 7 noites CBT-I",
              "Áudio guiado para cada sessão",
              "Diário de sono + rastreamento",
              "Gráficos e exportação CSV",
              "Acesso vitalício",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button
            onClick={handleCheckout}
            disabled={isPending}
            className="w-full py-6 text-base font-semibold"
            size="lg"
          >
            {isPending ? "Redirecionando…" : "Pagar $47 e começar hoje"}
          </Button>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Pagamento seguro via Stripe. Suas informações nunca são armazenadas em nossos servidores.
        </p>
      </main>
    </div>
  );
}
