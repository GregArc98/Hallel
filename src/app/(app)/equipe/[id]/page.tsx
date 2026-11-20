import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { exigirAdmin } from "@/lib/auth";
import { carregarEquipe, carregarFuncoes } from "@/lib/equipe/dados";
import { chaveFuncao } from "@/lib/equipe/formulario";
import { ExcluirIntegrante } from "../excluir-integrante";
import { IntegranteForm } from "../integrante-form";

export const metadata: Metadata = { title: "Editar integrante" };

const ERROS: Record<string, string> = {
  "voce-mesmo": "Você não pode remover a si mesmo. Peça a outro líder.",
  "ultimo-lider": "Não dá para remover o último líder da equipe. Promova outra pessoa antes.",
  falha: "Não foi possível remover. Tente de novo.",
};

export default async function EditarIntegrantePage({ params, searchParams }: PageProps<"/equipe/[id]">) {
  const ctx = await exigirAdmin();
  const { id } = await params;
  const { erro } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [[membro], funcoes] = await Promise.all([
    carregarEquipe(ctx.igreja.id, id),
    carregarFuncoes(ctx.igreja.id),
  ]);
  if (!membro) notFound();
  const euMesmo = membro.id === ctx.integranteId;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{membro.nome}</h1>
        {!membro.aprovado && (
          <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
            <strong>Cadastro novo</strong> feito pelo link da equipe. Confira os dados, marque o papel e
            as funções e toque em <strong>Aprovar e salvar</strong>.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {!membro.aprovado ? "" : membro.email
            ? membro.entrouNoApp
              ? "Já entrou no app."
              : "Ainda não entrou no app. Mande o link de convite da equipe: ela cria a senha com este e-mail e já entra aprovada."
            : "Sem e-mail: a pessoa aparece nas escalas, mas não consegue entrar no app."}
        </p>
      </div>
      {typeof erro === "string" && ERROS[erro] && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERROS[erro]}
        </p>
      )}
      <IntegranteForm
        funcoes={funcoes}
        euMesmo={euMesmo}
        aprovar={!membro.aprovado}
        valores={{
          id: membro.id,
          nome: membro.nome,
          email: membro.email ?? "",
          telefone: membro.telefone ?? "",
          papel: membro.papel,
          ativo: membro.ativo,
          marcadas: membro.funcoes.map((f) => chaveFuncao(f.funcaoId, f.periodo)),
        }}
      />
      {!euMesmo && <ExcluirIntegrante id={membro.id} nome={membro.nome} />}
    </div>
  );
}
