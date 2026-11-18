import { ArrowLeft, Send, Trash2, Undo2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { carregarEquipe, carregarFuncoes } from "@/lib/equipe/dados";
import { carregarCulto, carregarCultos, carregarIndisponibilidades } from "@/lib/escala/dados";
import {
  ICONE_PERIODO,
  NOME_PERIODO,
  chaveMes,
  dataCurta,
  mesDaData,
  primeiroEUltimoDia,
} from "@/lib/escala/datas";
import { chaveVaga, contarEscalas, estaIndisponivel } from "@/lib/escala/regras";
import { excluirCulto, publicarCulto, salvarDetalhesCulto } from "../actions";
import { ConfirmarExclusaoCulto } from "./confirmar-exclusao";
import { EditorEscala } from "./editor-escala";

export const metadata: Metadata = { title: "Editar escala" };

const campo =
  "h-11 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function EditarEscalaPage({ params, searchParams }: PageProps<"/escala/[id]">) {
  const ctx = await exigirAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const culto = await carregarCulto(ctx.igreja.id, id);
  if (!culto) notFound();
  const mes = mesDaData(culto.data);
  const [de, ate] = primeiroEUltimoDia(mes);

  const [funcoes, equipe, cultosDoMes, indisponibilidades] = await Promise.all([
    carregarFuncoes(ctx.igreja.id),
    carregarEquipe(ctx.igreja.id),
    carregarCultos(ctx.igreja.id, de, ate),
    carregarIndisponibilidades(ctx.igreja.id, culto.data, culto.data),
  ]);

  const contagem = contarEscalas(cultosDoMes.filter((c) => c.id !== culto.id));
  const noMesmoHorario = new Set(
    cultosDoMes
      .filter((c) => c.id !== culto.id && c.data === culto.data && c.periodo === culto.periodo)
      .flatMap((c) => c.vagas.map((v) => v.integranteId)),
  );
  const naoPodem = equipe.filter(
    (m) => m.ativo && estaIndisponivel(m.id, culto.data, culto.periodo, indisponibilidades),
  );

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={`/escala?mes=${chaveMes(mes)}`}>
          <ArrowLeft /> Escala do mês
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          {dataCurta(culto.data)} · {ICONE_PERIODO[culto.periodo]} {NOME_PERIODO[culto.periodo]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {culto.tipo === "avulso" ? "Culto avulso" : "Culto de domingo"} ·{" "}
          {culto.escalaPublicada ? "escala publicada (a equipe vê)" : "rascunho (a equipe ainda não vê)"}
        </p>
      </header>

      {naoPodem.length > 0 && (
        <p className="rounded-xl bg-muted px-3 py-2 text-sm">
          <strong>Não podem neste culto:</strong> {naoPodem.map((m) => m.nome).join(", ")}
        </p>
      )}

      <EditorEscala
        cultoId={culto.id}
        periodoNome={NOME_PERIODO[culto.periodo]}
        funcoes={funcoes.map((f) => ({ id: f.id, nome: f.nome, max: f.max_por_culto }))}
        inicial={Object.fromEntries(culto.vagas.map((v) => [chaveVaga(v.funcaoId, v.posicao), v.integranteId]))}
        pessoas={equipe.map((m) => ({
          id: m.id,
          nome: m.nome,
          ativo: m.ativo,
          funcoes: m.funcoes.filter((f) => f.periodo === culto.periodo).map((f) => f.funcaoId),
          indisponivel: estaIndisponivel(m.id, culto.data, culto.periodo, indisponibilidades),
          emOutroCulto: noMesmoHorario.has(m.id),
          vezesNoMes: contagem.get(m.id) ?? 0,
        }))}
      />

      <form action={publicarCulto} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
        <input type="hidden" name="id" value={culto.id} />
        <p className="flex-1 text-sm">
          {culto.escalaPublicada
            ? "A equipe já vê esta escala."
            : "Quando estiver pronta, publique para a equipe ver. (Salve antes as mudanças.)"}
        </p>
        {culto.escalaPublicada ? (
          <Button type="submit" name="publicar" value="0" variant="ghost">
            <Undo2 /> Voltar para rascunho
          </Button>
        ) : (
          <Button type="submit" name="publicar" value="1">
            <Send /> Publicar esta escala
          </Button>
        )}
      </form>

      <details className="rounded-xl border p-3" open={sp.erro === "detalhes" || sp.ok === "detalhes"}>
        <summary className="cursor-pointer font-semibold">Detalhes do culto</summary>
        <form action={salvarDetalhesCulto} className="mt-3 grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <input type="hidden" name="id" value={culto.id} />
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Título (opcional)</span>
            <input name="titulo" defaultValue={culto.titulo ?? ""} placeholder="Ex.: Ceia, Vigília" className={campo} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Horário</span>
            <input name="horario" type="time" defaultValue={culto.horario ?? ""} className={campo} />
          </label>
          <Button type="submit" variant="secondary">
            Salvar detalhes
          </Button>
        </form>
        {sp.erro === "detalhes" && <p className="mt-2 text-sm text-destructive">Confira o título e o horário.</p>}
        {sp.ok === "detalhes" && <p className="mt-2 text-sm text-primary">Detalhes salvos.</p>}
      </details>

      <ConfirmarExclusaoCulto action={excluirCulto} id={culto.id} descricao={`${dataCurta(culto.data)} ${NOME_PERIODO[culto.periodo].toLowerCase()}`}>
        <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 /> Excluir culto
        </Button>
      </ConfirmarExclusaoCulto>
    </div>
  );
}
