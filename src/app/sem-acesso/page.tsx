import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SairButton } from "@/components/sair-button";
import { getSessao } from "@/lib/auth";

export const metadata: Metadata = { title: "Acesso pendente" };

export default async function SemAcessoPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.vinculos.length > 0) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Quase lá!</h1>
      <p>
        Você entrou como <strong className="break-all">{sessao.usuario.email}</strong>, mas esse
        e-mail ainda não está cadastrado na equipe.
      </p>
      <p className="text-muted-foreground">
        Peça ao líder do louvor para cadastrar este e-mail. Depois é só entrar de novo.
      </p>
      <div className="flex justify-center">
        <SairButton variant="outline" />
      </div>
    </main>
  );
}
