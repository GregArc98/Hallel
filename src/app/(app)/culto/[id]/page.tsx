import { ArrowLeft, ChevronRight, ListMusic, Pencil, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BaixarAudios } from "@/components/pwa/baixar-audios";
import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { carregarEquipe, carregarFuncoes } from "@/lib/equipe/dados";
import { carregarCulto, carregarRepertorioCompleto } from "@/lib/escala/dados";
import { ehBlobDoVercel } from "@/lib/musicas/audio";
import { ICONE_PERIODO, NOME_PERIODO, chaveMes, dataCurta, mesDaData } from "@/lib/escala/datas";
import { tomDoCulto } from "@/lib/repertorio/regras";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Culto" };

export default async function CultoPage({ params }: PageProps<"/culto/[id]">) {
  const ctx = await exigirIntegrante();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const culto = await carregarCulto(ctx.igreja.id, id);
  if (!culto) notFound();

  const [itens, funcoes, equipe] = await Promise.all([
    carregarRepertorioCompleto(id),
    carregarFuncoes(ctx.igreja.id),
    carregarEquipe(ctx.igreja.id),
  ]);
  const nome = new Map(equipe.map((m) => [m.id, m.nome]));
  const minhasFuncoes = culto.vagas.filter((v) => v.integranteId === ctx.integranteId).map((v) => v.funcaoId);
  const escalaVisivel = ctx.admin || culto.escalaPublicada;
  const repertorioVisivel = ctx.admin || culto.repertorioPublicado;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={`/escala?mes=${chaveMes(mesDaData(culto.data))}`}>
          <ArrowLeft /> Escala
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          {dataCurta(culto.data)} · {ICONE_PERIODO[culto.periodo]} {NOME_PERIODO[culto.periodo]}
        </h1>
        <p className="text-muted-foreground">
          {[culto.titulo, culto.horario].filter(Boolean).join(" · ")}
          {minhasFuncoes.length > 0 && (
            <span className="font-semibold text-primary">
              {culto.titulo || culto.horario ? " · " : ""}Você: {minhasFuncoes.map((f) => funcoes.find((x) => x.id === f)?.nome).join(" e ")}
            </span>
          )}
        </p>
      </header>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListMusic className="size-5" /> Repertório
          </h2>
          {ctx.admin && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/escala/${id}/repertorio`}>
                <Pencil /> Editar
              </Link>
            </Button>
          )}
        </div>
        {repertorioVisivel && itens.length > 0 && (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/culto/${id}/tocar`}>
              <Play /> Modo culto
            </Link>
          </Button>
        )}
        {repertorioVisivel && (
          <BaixarAudios
            urls={[...new Set(itens.map((m) => m.audioUrl).filter((u): u is string => ehBlobDoVercel(u)))]}
          />
        )}
        {ctx.admin && !culto.repertorioPublicado && (
          <p className="text-sm text-muted-foreground">Rascunho: só líderes veem.</p>
        )}
        {!repertorioVisivel ? (
          <p className="rounded-xl border border-dashed p-4 text-muted-foreground">Repertório ainda não publicado.</p>
        ) : itens.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-muted-foreground">Nenhuma música ainda.</p>
        ) : (
          <ol className="divide-y rounded-xl border">
            {itens.map((item, i) => {
              const tom = tomDoCulto(item.tom, item.tomOriginal);
              return (
                <li key={`${item.musicaId}-${i}`}>
                  <Link href={`/culto/${id}/tocar?i=${i}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                    <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.titulo}</p>
                      {item.observacao && <p className="text-sm text-muted-foreground">{item.observacao}</p>}
                    </div>
                    {tom && (
                      <span className="min-w-9 rounded-md bg-muted px-2 py-1 text-center font-bold text-chord">{tom}</span>
                    )}
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        {repertorioVisivel && culto.observacoes && (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm whitespace-pre-line">{culto.observacoes}</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Escala</h2>
        {!escalaVisivel ? (
          <p className="rounded-xl border border-dashed p-4 text-muted-foreground">Escala em preparação.</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border px-4 py-3 text-sm">
            {funcoes.map((f) => {
              const pessoas = culto.vagas.filter((v) => v.funcaoId === f.id).sort((a, b) => a.posicao - b.posicao);
              return (
                <div key={f.id} className="contents">
                  <dt className="text-muted-foreground">{f.nome}</dt>
                  <dd>
                    {pessoas.length === 0
                      ? "—"
                      : pessoas.map((v, j) => (
                          <span key={v.posicao}>
                            {j > 0 && ", "}
                            <span className={cn(v.integranteId === ctx.integranteId && "font-semibold text-primary")}>
                              {nome.get(v.integranteId) ?? "?"}
                            </span>
                          </span>
                        ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </section>
    </div>
  );
}
