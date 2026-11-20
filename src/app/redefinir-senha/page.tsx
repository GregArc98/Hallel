import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessao } from "@/lib/auth";
import { FormularioNovaSenha } from "./formulario-nova-senha";

export const metadata: Metadata = { title: "Nova senha" };

/** Aberta pelo link do e-mail "Esqueci minha senha" (que já deixa a pessoa logada) ou pelo Perfil. */
export default async function RedefinirSenhaPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Nova senha</h1>
        <p className="break-all text-muted-foreground">{sessao.usuario.email}</p>
      </div>
      <FormularioNovaSenha />
    </main>
  );
}
