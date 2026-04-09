import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erro ao criar conta");
        return;
      }
      queryClient.setQueryData(["auth", "me"], data);
      setLocation("/purchase");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Moon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-serif">Criar conta</h1>
          <p className="text-sm text-muted-foreground">Comece o seu protocolo de sono</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button
            onClick={() => setLocation("/sign-in")}
            className="text-primary underline underline-offset-4"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
