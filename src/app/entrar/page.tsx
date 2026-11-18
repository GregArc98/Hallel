import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { caminhoSeguro, getSessao } from "@/lib/auth";
import { LOGIN_GOOGLE } from "@/lib/env";
import { LimparAoSair } from "@/components/pwa/limpar-ao-sair";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  link: "Esse link não vale mais (ele expira e só funciona uma vez). Peça um novo abaixo.",
  provedor: "Não foi possível entrar com o Google. Tente de novo ou use o e-mail.",
};

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const params = await searchParams;
  const proximo = caminhoSeguro(typeof params.proximo === "string" ? params.proximo : null);
  if (await getSessao()) redirect(proximo);

  const erro = typeof params.erro === "string" ? ERROS[params.erro] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Hallel</h1>
        <p className="text-muted-foreground">Escalas, repertório e cifras do ministério de louvor.</p>
      </div>
      {erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}
      <FormularioEntrar proximo={proximo} google={LOGIN_GOOGLE} />
      {params.saiu === "1" && <LimparAoSair />}
    </main>
  );
}
