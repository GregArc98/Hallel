"use client";

import { KeyRound, LogIn, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CampoSenha } from "@/components/campo-senha";
import { Button } from "@/components/ui/button";
import { mensagemDoErro, normalizarEmail } from "@/lib/acesso/senha";
import { createClient } from "@/lib/supabase/client";

const campo =
  "h-12 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function urlDeRetorno(proximo: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("proximo", proximo);
  return url.toString();
}

type Tela = "entrar" | "recuperar" | "recuperacao-enviada";

export function FormularioEntrar({ proximo, google }: { proximo: string; google: boolean }) {
  const router = useRouter();
  const [tela, setTela] = useState<Tela>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [semConfirmar, setSemConfirmar] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSemConfirmar(false);
    setEnviando(true);
    const { error } = await createClient().auth.signInWithPassword({ email: normalizarEmail(email), password: senha });
    if (error) {
      setEnviando(false);
      setErro(mensagemDoErro(error, "entrar"));
      setSemConfirmar(error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message));
      return;
    }
    router.replace(proximo);
    router.refresh(); // o servidor passa a enxergar a sessão nova
  }

  async function reenviarConfirmacao() {
    setErro(null);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: normalizarEmail(email),
      options: { emailRedirectTo: urlDeRetorno(proximo) },
    });
    if (error) setErro(mensagemDoErro(error, "recuperar"));
    else setReenviado(true);
  }

  async function pedirNovaSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await createClient().auth.resetPasswordForEmail(normalizarEmail(email), {
      redirectTo: urlDeRetorno("/redefinir-senha"),
    });
    setEnviando(false);
    if (error) {
      setErro(mensagemDoErro(error, "recuperar"));
      return;
    }
    setTela("recuperacao-enviada");
  }

  async function entrarComGoogle() {
    setErro(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: urlDeRetorno(proximo) },
    });
    if (error) setErro("Não foi possível abrir o login do Google.");
  }

  const aviso = erro && (
    <div role="alert" className="space-y-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <p>{erro}</p>
      {semConfirmar &&
        (reenviado ? (
          <p className="text-foreground">Enviamos de novo. Olhe também a caixa de spam.</p>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={reenviarConfirmacao}>
            Reenviar e-mail de confirmação
          </Button>
        ))}
    </div>
  );

  const campoEmail = (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">E-mail</span>
      <input
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@exemplo.com"
        className={campo}
      />
    </label>
  );

  if (tela === "recuperacao-enviada") {
    return (
      <div className="space-y-4 rounded-xl border p-6 text-center">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">Enviamos um e-mail para</p>
          <p className="break-all">{email}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Abra a mensagem e toque em <strong>Criar nova senha</strong>. Se não chegar em alguns
          minutos, olhe a caixa de spam.
        </p>
        <Button variant="ghost" onClick={() => setTela("entrar")}>
          Voltar para entrar
        </Button>
      </div>
    );
  }

  if (tela === "recuperar") {
    return (
      <form onSubmit={pedirNovaSenha} className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Esqueci minha senha</h2>
          <p className="text-sm text-muted-foreground">
            Digite seu e-mail. Vamos mandar um link para você criar uma senha nova.
          </p>
        </div>
        {campoEmail}
        {aviso}
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          <KeyRound /> {enviando ? "Enviando…" : "Enviar link para nova senha"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => setTela("entrar")}>
          Voltar para entrar
        </Button>
      </form>
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

      <form onSubmit={entrar} className="space-y-4">
        {campoEmail}
        <CampoSenha rotulo="Senha" value={senha} onChange={setSenha} />
        {aviso}
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          <LogIn /> {enviando ? "Entrando…" : "Entrar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setErro(null);
            setTela("recuperar");
          }}
        >
          Esqueci minha senha
        </Button>
      </form>
    </div>
  );
}
