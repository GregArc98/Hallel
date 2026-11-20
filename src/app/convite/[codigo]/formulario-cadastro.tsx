"use client";

import { MailCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CampoSenha } from "@/components/campo-senha";
import { Button } from "@/components/ui/button";
import { mensagemDoErro, normalizarEmail, problemaNaSenha } from "@/lib/acesso/senha";
import { createClient } from "@/lib/supabase/client";
import { urlDeRetorno } from "../../entrar/formulario-entrar";

const campo =
  "h-12 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Cadastro pelo link da equipe: cria a conta (e-mail e senha) guardando nome, WhatsApp e o
 * convite. Ao confirmar o e-mail, o retorno do login conclui o pedido de entrada na equipe.
 */
export function FormularioCadastro({ codigo }: { codigo: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [jaTemConta, setJaTemConta] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const entrar = `/entrar?proximo=${encodeURIComponent(`/convite/${codigo}`)}`;

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setJaTemConta(false);
    if (!nome.trim()) return setErro("Informe seu nome.");
    const problema = problemaNaSenha(senha, repetida);
    if (problema) return setErro(problema);

    setEnviando(true);
    const { data, error } = await createClient().auth.signUp({
      email: normalizarEmail(email),
      password: senha,
      options: {
        emailRedirectTo: urlDeRetorno(`/convite/${codigo}`),
        data: { nome: nome.trim(), telefone: telefone.trim(), convite: codigo },
      },
    });
    setEnviando(false);
    if (error) {
      setErro(mensagemDoErro(error, "cadastro"));
      setJaTemConta(error.code === "user_already_exists" || error.code === "email_exists");
      return;
    }
    // E-mail já cadastrado: o Supabase responde "ok" sem criar nada (para não revelar contas).
    if (data.user && data.user.identities?.length === 0) {
      setErro("Este e-mail já tem conta. Entre com sua senha.");
      setJaTemConta(true);
      return;
    }
    // Sem confirmação de e-mail ativada, a conta já vem logada: segue direto.
    if (data.session) {
      router.refresh(); // a página do convite passa a mostrar o próximo passo
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="space-y-4 rounded-xl border p-6 text-center">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">Falta só confirmar seu e-mail</p>
          <p className="break-all">{email}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Abra a mensagem que enviamos e toque em <strong>Confirmar meu e-mail</strong>. Seu pedido
          vai para o líder na hora. Se não chegar em alguns minutos, olhe a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={cadastrar} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Seu nome *</span>
        <input
          required
          autoComplete="name"
          maxLength={80}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como a equipe te chama"
          className={campo}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">WhatsApp</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 90000-0000"
          className={campo}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">E-mail *</span>
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
      <CampoSenha rotulo="Crie uma senha * (mínimo 8 caracteres)" value={senha} onChange={setSenha} nova />
      <CampoSenha rotulo="Repita a senha *" value={repetida} onChange={setRepetida} nova />

      {erro && (
        <div role="alert" className="space-y-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>{erro}</p>
          {jaTemConta && (
            <Button asChild variant="outline" size="sm">
              <Link href={entrar}>Entrar com minha senha</Link>
            </Button>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        <UserPlus /> {enviando ? "Enviando…" : "Pedir para entrar na equipe"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href={entrar} className="font-medium text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
