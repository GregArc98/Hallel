import type { Metadata } from "next";
import Link from "next/link";

import { SairButton } from "@/components/sair-button";
import { exigirIntegrante } from "@/lib/auth";
import { carregarEquipe, carregarFuncoes, resumoFuncoes } from "@/lib/equipe/dados";
import { MeusDados } from "./meus-dados";
import { EscolherTema } from "./tema";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const ctx = await exigirIntegrante();
  const [[eu], funcoes] = await Promise.all([
    carregarEquipe(ctx.igreja.id, ctx.integranteId),
    carregarFuncoes(ctx.igreja.id),
  ]);

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold">{ctx.nome}</h1>
        <p className="text-muted-foreground">
          {ctx.admin ? "Líder (admin)" : "Membro"} · {ctx.igreja.nome}
        </p>
        <p className="text-sm text-muted-foreground">{ctx.usuario.email}</p>
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="font-semibold">Seus dados</h2>
        <MeusDados nome={eu?.nome ?? ctx.nome} telefone={eu?.telefone ?? ""} email={ctx.usuario.email ?? ""} />
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="font-semibold">Suas funções</h2>
        <p>{eu ? resumoFuncoes(eu, funcoes).join(" · ") || "Nenhuma função cadastrada." : "—"}</p>
        <p className="text-sm text-muted-foreground">
          Papel e funções são definidos pelos líderes.
          {ctx.admin && (
            <>
              {" "}
              Ou edite em{" "}
              <Link href={`/equipe/${ctx.integranteId}`} className="text-primary underline-offset-4 hover:underline">
                Equipe
              </Link>
              .
            </>
          )}
        </p>
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="font-semibold">Senha</h2>
        <Link href="/redefinir-senha" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Trocar minha senha
        </Link>
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="font-semibold">Aparência</h2>
        <EscolherTema />
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="font-semibold">Instalar no celular</h2>
        <p className="text-sm text-muted-foreground">
          Android (Chrome): menu ⋮ → <strong>Instalar app</strong>. iPhone (Safari): botão Compartilhar →{" "}
          <strong>Adicionar à Tela de Início</strong>. Assim o Hallel abre como app e o repertório dos
          seus próximos cultos fica disponível sem internet.
        </p>
      </section>

      <SairButton variant="outline" />
    </div>
  );
}
