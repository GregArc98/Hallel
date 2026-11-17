"use client";

import { Mail, MailCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function urlDeRetorno(proximo: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("proximo", proximo);
  return url.toString();
}

export function FormularioEntrar({ proximo, google }: { proximo: string; google: boolean }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado">("livre");
  const [erro, setErro] = useState<string | null>(null);

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEstado("enviando");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: urlDeRetorno(proximo) },
    });
    if (error) {
      setEstado("livre");
      setErro(
        error.status === 429
          ? "Muitos pedidos seguidos. Espere alguns minutos e tente de novo."
          : "Não foi possível enviar o link. Confira o e-mail e tente de novo.",
      );
      return;
    }
    setEstado("enviado");
  }

  async function entrarComGoogle() {
    setErro(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: urlDeRetorno(proximo) },
    });
    if (error) setErro("Não foi possível abrir o login do Google.");
  }

  if (estado === "enviado") {
    return (
      <div className="space-y-4 rounded-xl border p-6 text-center">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">Enviamos um link para</p>
          <p className="break-all">{email}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Abra o e-mail <strong>neste mesmo aparelho</strong> e toque em entrar. Se não chegar em
          alguns minutos, olhe a caixa de spam.
        </p>
        <Button variant="ghost" onClick={() => setEstado("livre")}>
          Usar outro e-mail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {google && (
        <>
          <Button variant="outline" size="lg" className="w-full" onClick={entrarComGoogle}>
            <svg viewBox="0 0 24 24" aria-hidden className="size-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Entrar com Google
          </Button>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={enviarLink} className="space-y-3">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Seu e-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="h-12 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={estado === "enviando"}>
          <Mail /> {estado === "enviando" ? "Enviando…" : "Receber link de acesso"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Sem senha: você recebe um link no e-mail e entra com um toque.
        </p>
      </form>

      {erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
