import { Hourglass } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SairButton } from "@/components/sair-button";
import { getSessao } from "@/lib/auth";

export const metadata: Metadata = { title: "Aguardando aprovação" };

export default async function AguardandoPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.vinculos.length > 0) redirect("/");
  if (sessao.pendentes.length === 0) redirect("/sem-acesso");
  const [pendente] = sessao.pendentes;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <Hourglass className="size-10 text-primary" aria-hidden />
      <h1 className="text-2xl font-semibold">Cadastro enviado, {pendente.nome}!</h1>
      <p className="text-muted-foreground">
        Agora é só aguardar o líder de {pendente.igreja} confirmar. Depois disso, abra o Hallel de
        novo e você já vê suas escalas e o repertório.
      </p>
      <SairButton variant="outline" />
    </main>
  );
}
