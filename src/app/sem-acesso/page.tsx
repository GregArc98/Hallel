import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SairButton } from "@/components/sair-button";
import { getSessao } from "@/lib/auth";

export const metadata: Metadata = { title: "Acesso pendente" };

export default async function SemAcessoPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.vinculos.length > 0) redirect("/");
  if (sessao.pendentes.length > 0) redirect("/aguardando");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Quase lá!</h1>
      <p>
        Você entrou como <strong className="break-all">{sessao.usuario.email}</strong>, mas esse
        e-mail ainda não está cadastrado na equipe.
      </p>
      <p className="text-muted-foreground">
        Peça ao líder do louvor o <strong>link de convite da equipe</strong> (ele manda no grupo do
        WhatsApp) e abra por ele para criar seu perfil.
      </p>
      <div className="flex justify-center">
        <SairButton variant="outline" />
      </div>
    </main>
  );
}
