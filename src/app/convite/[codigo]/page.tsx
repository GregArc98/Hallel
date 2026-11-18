import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SairButton } from "@/components/sair-button";
import { getSessao } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioEntrar } from "../../entrar/formulario-entrar";
import { FormularioPerfil } from "./formulario-perfil";

export const metadata: Metadata = { title: "Entrar na equipe" };

/** Link único da equipe (vai no grupo do WhatsApp): cada pessoa cria o próprio perfil. */
export default async function ConvitePage({ params }: PageProps<"/convite/[codigo]">) {
  const { codigo } = await params;
  const supabase = await createClient();
  const { data: igreja } = await supabase.rpc("igreja_do_convite", { p_codigo: codigo });
  const sessao = await getSessao();

  if (!igreja) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Convite inválido</h1>
        <p className="text-muted-foreground">Este link não vale mais. Peça o link novo ao líder do louvor.</p>
      </main>
    );
  }
  if (sessao && sessao.vinculos.length > 0) redirect("/");
  if (sessao && sessao.pendentes.length > 0) redirect("/aguardando");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Hallel</h1>
        <p className="text-muted-foreground">
          Entrar na equipe de <strong className="text-foreground">{igreja}</strong>
        </p>
      </div>

      {!sessao ? (
        <>
          <ol className="space-y-1 rounded-xl bg-muted px-4 py-3 text-sm">
            <li>1. Digite seu e-mail e abra o link que chegar.</li>
            <li>2. Preencha seu nome e WhatsApp.</li>
            <li>3. O líder confirma e pronto.</li>
          </ol>
          <FormularioEntrar proximo={`/convite/${codigo}`} google={false} />
        </>
      ) : (
        <>
          <FormularioPerfil codigo={codigo} email={sessao.usuario.email ?? ""} />
          <div className="flex justify-center">
            <SairButton />
          </div>
        </>
      )}
    </main>
  );
}
